import "server-only";

import { io } from "next/cache";

import { env } from "@/env";
import { DomainError } from "@/lib/action-state";
import { db } from "@/lib/db";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { assertWithinLimit } from "@/lib/plans";
import { assertCan, assignableRoles, canManageMember, ForbiddenError } from "@/lib/rbac";
import { generateToken, hashToken } from "@/lib/tokens";
import { inviteTokenSchema } from "@/lib/validations/common";
import type { InviteMemberInput } from "@/lib/validations/organization";

import { audit } from "./audit";
import { assertRateLimit } from "./rate-limit";
import type { OrgContext } from "./tenant";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function listMembersAndInvites(ctx: OrgContext) {
  const [members, invitations] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    db.invitation.findMany({
      where: {
        organizationId: ctx.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);
  return { members, invitations };
}

export async function createInvitation(ctx: OrgContext, input: InviteMemberInput) {
  assertCan(ctx.role, "members:invite");
  if (!assignableRoles(ctx.role).includes(input.role)) throw new ForbiddenError("members:invite");

  const alreadyMember = await db.membership.findFirst({
    where: { organizationId: ctx.organizationId, user: { email: input.email } },
    select: { id: true },
  });
  if (alreadyMember) throw new DomainError("Essa pessoa já faz parte da equipe.");

  // Convites pendentes contam no limite — senão daria para burlar o plano
  // disparando vários convites antes de alguém aceitar.
  const [memberCount, pendingCount] = await Promise.all([
    db.membership.count({ where: { organizationId: ctx.organizationId } }),
    db.invitation.count({
      where: {
        organizationId: ctx.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
        NOT: { email: input.email }, // o reenvio substitui o convite anterior
      },
    }),
  ]);
  assertWithinLimit(ctx.organization.plan, "members", memberCount + pendingCount);

  // O reenvio substitui o convite anterior, então o limite do plano não
  // segura disparos repetidos: o rate limit evita spam pelo nosso domínio.
  await assertRateLimit("inviteEmail", `${ctx.organizationId}:${input.email}`);
  await assertRateLimit("inviteOrg", ctx.organizationId);

  const token = generateToken();

  await db.$transaction(async (tx) => {
    await tx.invitation.deleteMany({
      where: { organizationId: ctx.organizationId, email: input.email, acceptedAt: null },
    });
    const invitation = await tx.invitation.create({
      data: {
        organizationId: ctx.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: hashToken(token),
        invitedById: ctx.userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
    await audit(
      ctx,
      {
        action: "invitation.created",
        entity: "invitation",
        entityId: invitation.id,
        metadata: { email: input.email, role: input.role },
      },
      tx,
    );
  });

  const url = `${env.NEXT_PUBLIC_APP_URL}/convite/${token}`;
  const orgName = escapeHtml(ctx.organization.name);
  await sendEmail({
    to: input.email,
    subject: `Você foi convidado para ${ctx.organization.name} no Crowslot`,
    text: `Você foi convidado para a equipe de ${ctx.organization.name}.\n\nAceite em: ${url}\n\nO convite expira em 7 dias.`,
    html: emailLayout(
      "Você recebeu um convite",
      `Você foi convidado para a equipe de <strong>${orgName}</strong> no Crowslot. O convite expira em 7 dias.`,
      { label: "Aceitar convite", url },
    ),
  });
}

export async function revokeInvitation(ctx: OrgContext, invitationId: string) {
  assertCan(ctx.role, "members:invite");
  // Filtrar por organizationId impede revogar convite de outra organização (IDOR).
  const { count } = await db.invitation.deleteMany({
    where: { id: invitationId, organizationId: ctx.organizationId, acceptedAt: null },
  });
  if (count === 0) throw new DomainError("Convite não encontrado.");
  await audit(ctx, { action: "invitation.revoked", entity: "invitation", entityId: invitationId });
}

export async function removeMember(ctx: OrgContext, membershipId: string) {
  assertCan(ctx.role, "members:remove");

  const target = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId },
    select: { id: true, role: true, userId: true, _count: { select: { appointments: true } } },
  });
  if (!target) throw new DomainError("Membro não encontrado.");
  if (target.userId === ctx.userId) throw new DomainError("Você não pode remover a si mesmo.");
  if (!canManageMember(ctx.role, target.role)) throw new ForbiddenError("members:remove");
  if (target._count.appointments > 0) {
    throw new DomainError("Este profissional tem agendamentos. Reatribua-os antes de remover.");
  }

  await db.$transaction(async (tx) => {
    await tx.membership.delete({ where: { id: target.id } });
    await audit(ctx, { action: "member.removed", entity: "membership", entityId: target.id }, tx);
  });
}

/** Dados públicos do convite, para a tela de aceite. */
export async function getInvitationByToken(token: string) {
  if (!inviteTokenSchema.safeParse(token).success) return null;
  await io(); // ver comentário em `requireUser` (tenant.ts)
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      organization: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) return null;
  return invitation;
}

export async function acceptInvitation(
  token: string,
  user: { id: string; email: string },
): Promise<{ slug: string }> {
  if (!inviteTokenSchema.safeParse(token).success) {
    throw new DomainError("Este convite é inválido ou expirou.");
  }
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { id: true, slug: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    throw new DomainError("Este convite é inválido ou expirou.");
  }
  // O convite é pessoal: só o e-mail convidado pode aceitá-lo.
  if (invitation.email !== user.email.toLowerCase()) {
    throw new DomainError(
      `Este convite foi enviado para ${invitation.email}. Entre com esse e-mail.`,
    );
  }

  await db.$transaction(async (tx) => {
    // `updateMany` com `acceptedAt: null` torna o aceite atômico: em dois
    // cliques simultâneos, só um consegue marcar o convite.
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (count === 0) throw new DomainError("Este convite já foi utilizado.");

    const membership = await tx.membership.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: invitation.organizationId },
      },
      update: {},
      create: { userId: user.id, organizationId: invitation.organizationId, role: invitation.role },
    });
    await audit(
      { organizationId: invitation.organizationId, userId: user.id },
      { action: "invitation.accepted", entity: "membership", entityId: membership.id },
      tx,
    );
  });

  return { slug: invitation.organization.slug };
}
