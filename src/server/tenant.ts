import "server-only";

import { io } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCan, type Permission, type Role } from "@/lib/rbac";
import { slugSchema } from "@/lib/validations/common";

/**
 * Contexto de tenant resolvido para a requisição atual.
 * Todas as queries de negócio recebem `ctx.organizationId` daqui — nunca de
 * um parâmetro vindo do cliente.
 */
export type OrgContext = {
  userId: string;
  organizationId: string;
  organization: { id: string; name: string; slug: string; plan: "FREE" | "PRO"; timezone: string };
  membershipId: string;
  role: Role;
};

/** Usuário autenticado ou redireciona para o login. Deduplicado por requisição. */
export const requireUser = cache(async () => {
  // Marca o início do acesso ao banco. Sem isso, o driver `pg` gera o nonce
  // da autenticação SCRAM (crypto.getRandomValues) dentro de um prerender e
  // o Next acusa "blocking-prerender-crypto". Durante uma requisição normal
  // ou uma Server Action, `io()` resolve na hora.
  await io();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
});

/**
 * Resolve a organização pelo slug *e* confirma que o usuário é membro dela.
 * Se não for, responde 404 (e não 403) para não revelar que o slug existe.
 */
export const getOrgContext = cache(async (slug: string): Promise<OrgContext> => {
  const user = await requireUser();
  // O slug vem da URL ou de um `.bind()` no navegador: formato inválido = 404.
  if (!slugSchema.safeParse(slug).success) notFound();

  const membership = await db.membership.findFirst({
    where: { userId: user.id, organization: { slug } },
    select: {
      id: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true, plan: true, timezone: true } },
    },
  });

  if (!membership) notFound();

  return {
    userId: user.id,
    organizationId: membership.organization.id,
    organization: membership.organization,
    membershipId: membership.id,
    role: membership.role,
  };
});

/** Atalho para páginas/actions que exigem uma permissão específica. */
export async function requirePermission(slug: string, permission: Permission) {
  const ctx = await getOrgContext(slug);
  assertCan(ctx.role, permission);
  return ctx;
}
