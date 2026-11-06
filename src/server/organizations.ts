import "server-only";

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

/** Cria a organização e torna o criador OWNER, atomicamente. */
export async function createOrganization(userId: string, name: string) {
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
