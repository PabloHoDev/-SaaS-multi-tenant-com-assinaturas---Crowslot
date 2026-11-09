import "server-only";

import { DomainError } from "@/lib/action-state";
import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

import { audit } from "./audit";

/** Organizações do usuário, para o seletor de workspace e o redirect pós-login. */
export async function listUserOrganizations(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { role: true, organization: { select: { id: true, name: true, slug: true } } },
  });
  return memberships.map((m) => ({ ...m.organization, role: m.role }));
}

/**
 * Cada organização nasce no plano Free com a própria cota. Sem teto, uma
 * pessoa multiplicaria o plano grátis criando vários espaços.
 */
export const MAX_OWNED_ORGANIZATIONS = 3;

/** Cria a organização e torna o criador OWNER, atomicamente. */
export async function createOrganization(userId: string, name: string) {
  const owned = await db.membership.count({ where: { userId, role: "OWNER" } });
  if (owned >= MAX_OWNED_ORGANIZATIONS) {
    throw new DomainError(
      `Você já é dono de ${MAX_OWNED_ORGANIZATIONS} espaços, o máximo por conta.`,
    );
  }

  const slug = await uniqueSlug(name, async (candidate) =>
    Boolean(await db.organization.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  return db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name, slug, memberships: { create: { userId, role: "OWNER" } } },
    });
    await audit(
      { organizationId: organization.id, userId },
      { action: "organization.created", entity: "organization", entityId: organization.id },
      tx,
    );
    return organization;
  });
}
