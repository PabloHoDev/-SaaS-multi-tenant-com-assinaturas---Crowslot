import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/action-state";
import { db } from "@/lib/db";
import { assertWithinLimit } from "@/lib/plans";
import { assertCan } from "@/lib/rbac";
import type { ClientInput } from "@/lib/validations/client";

import { audit } from "./audit";
import type { OrgContext } from "./tenant";

export const CLIENTS_PAGE_SIZE = 20;

function searchWhere(organizationId: string, q: string): Prisma.ClientWhereInput {
  if (!q) return { organizationId };
  const digits = q.replace(/\D/g, "");
  return {
    organizationId,
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      // Telefone é guardado só com dígitos: "(85) 9987" encontra "859987…".
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ],
  };
}

export async function listClients(ctx: OrgContext, params: { q: string; page: number }) {
  assertCan(ctx.role, "clients:read");
  const where = searchWhere(ctx.organizationId, params.q);

  const [total, totalInOrg] = await Promise.all([
    db.client.count({ where }),
    params.q ? db.client.count({ where: { organizationId: ctx.organizationId } }) : null,
  ]);
  const pageCount = Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE));
  const page = Math.min(params.page, pageCount); // ?page=999 cai na última página

  const clients = await db.client.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }], // `id` desempata e mantém a paginação estável
    skip: (page - 1) * CLIENTS_PAGE_SIZE,
    take: CLIENTS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
      appointments: {
        where: { status: "COMPLETED" },
        orderBy: { startsAt: "desc" },
        take: 1,
        select: { startsAt: true },
      },
    },
  });

  return {
    clients: clients.map(({ _count, appointments, ...c }) => ({
      ...c,
      visits: _count.appointments,
      lastVisitAt: appointments[0]?.startsAt ?? null,
    })),
    total,
    totalInOrg: totalInOrg ?? total,
    page,
    pageCount,
  };
}

export async function countClients(ctx: OrgContext) {
  return db.client.count({ where: { organizationId: ctx.organizationId } });
}

export async function getClient(ctx: OrgContext, clientId: string) {
  assertCan(ctx.role, "clients:read");
  const where = { clientId, organizationId: ctx.organizationId };

  const client = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: { id: true, name: true, email: true, phone: true, notes: true, createdAt: true },
  });
  if (!client) return null;

  const [history, completed, noShows] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: { startsAt: "desc" },
      take: 10,
      select: {
        id: true,
        startsAt: true,
        status: true,
        priceCents: true,
        service: { select: { name: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
    }),
    db.appointment.aggregate({
      where: { ...where, status: "COMPLETED" },
      _count: true,
      _sum: { priceCents: true },
      _max: { startsAt: true },
    }),
    db.appointment.count({ where: { ...where, status: "NO_SHOW" } }),
  ]);

  return {
    client,
    history,
    stats: {
      visits: completed._count,
      spentCents: completed._sum.priceCents ?? 0,
      lastVisitAt: completed._max.startsAt,
      noShows,
    },
  };
}

export async function createClient(ctx: OrgContext, input: ClientInput) {
  assertCan(ctx.role, "clients:write");

  return db.$transaction(async (tx) => {
    // Sem a trava, dois cadastros simultâneos poderiam ler "49 clientes" e
    // ambos passarem do limite do plano. O lock é por organização e é
    // liberado automaticamente no fim da transação.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ctx.organizationId}))`;
    const count = await tx.client.count({ where: { organizationId: ctx.organizationId } });
    assertWithinLimit(ctx.organization.plan, "clients", count);

    const client = await tx.client.create({
      data: { ...input, organizationId: ctx.organizationId },
      select: { id: true },
    });
    await audit(ctx, { action: "client.created", entity: "client", entityId: client.id }, tx);
    return client;
  });
}

export async function updateClient(ctx: OrgContext, clientId: string, input: ClientInput) {
  assertCan(ctx.role, "clients:write");

  const current = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: { name: true, email: true, phone: true, notes: true },
  });
  if (!current) throw new DomainError("Cliente não encontrado.");

  const changed = (Object.keys(input) as (keyof ClientInput)[]).filter(
    (key) => input[key] !== current[key],
  );
  if (changed.length === 0) return;

  await db.$transaction(async (tx) => {
    await tx.client.update({
      where: { id_organizationId: { id: clientId, organizationId: ctx.organizationId } },
      data: input,
    });
    // Registra *quais* campos mudaram, nunca os valores: dados pessoais
    // não devem ficar espalhados no log (LGPD).
    await audit(
      ctx,
      { action: "client.updated", entity: "client", entityId: clientId, metadata: { changed } },
      tx,
    );
  });
}

export async function deleteClient(ctx: OrgContext, clientId: string) {
  assertCan(ctx.role, "clients:delete");

  const client = await db.client.findFirst({
    where: { id: clientId, organizationId: ctx.organizationId },
    select: { id: true, _count: { select: { appointments: true } } },
  });
  if (!client) throw new DomainError("Cliente não encontrado.");
  if (client._count.appointments > 0) {
    // O histórico alimenta receita e relatórios; apagá-lo distorceria os números.
    throw new DomainError("Este cliente tem atendimentos no histórico e não pode ser excluído.");
  }

  await db.$transaction(async (tx) => {
    await tx.client.delete({
      where: { id_organizationId: { id: client.id, organizationId: ctx.organizationId } },
    });
    await audit(ctx, { action: "client.deleted", entity: "client", entityId: client.id }, tx);
  });
}
