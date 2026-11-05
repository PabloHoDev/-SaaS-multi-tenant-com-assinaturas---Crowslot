import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCan, type Permission, type Role } from "@/lib/rbac";

/**
 * Contexto de tenant resolvido para a requisição atual.
 * Todas as queries de negócio recebem `ctx.organizationId` daqui — nunca de
 * um parâmetro vindo do cliente.
 */
export type OrgContext = {
  userId: string;
  organizationId: string;
  organization: { id: string; name: string; slug: string; plan: "FREE" | "PRO" };
  membershipId: string;
  role: Role;
};

/** Usuário autenticado ou redireciona para o login. Deduplicado por requisição. */
export const requireUser = cache(async () => {
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

  const membership = await db.membership.findFirst({
    where: { userId: user.id, organization: { slug } },
    select: {
      id: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true, plan: true } },
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
