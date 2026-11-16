import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/action-state";
import { db } from "@/lib/db";
import { assertWithinLimit } from "@/lib/plans";
import { assertCan } from "@/lib/rbac";
import type { ServiceInput } from "@/lib/validations/service";

import { audit } from "./audit";
import type { OrgContext } from "./tenant";

type Tx = Prisma.TransactionClient;

/**
 * Trava por organização + checagem do limite de serviços ativos. Sem a trava,
 * dois cadastros simultâneos poderiam ler "9 ativos" e ambos passarem do limite.
 * O lock é liberado automaticamente no fim da transação.
 */
async function assertCanActivateOne(tx: Tx, ctx: OrgContext) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ctx.organizationId}))`;
  const active = await tx.service.count({
    where: { organizationId: ctx.organizationId, active: true },
  });
  assertWithinLimit(ctx.organization.plan, "services", active);
}

/** Catálogo completo. Todos os papéis leem: o profissional precisa ver o que atende. */
export async function listServices(ctx: OrgContext) {
  const services = await db.service.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ active: "desc" }, { name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      durationMin: true,
      priceCents: true,
      active: true,
      _count: { select: { appointments: true } },
    },
  });
  return services.map(({ _count, ...s }) => ({ ...s, appointments: _count.appointments }));
}

export async function countActiveServices(ctx: OrgContext) {
  return db.service.count({ where: { organizationId: ctx.organizationId, active: true } });
}

export async function getService(ctx: OrgContext, serviceId: string) {
  const service = await db.service.findFirst({
    where: { id: serviceId, organizationId: ctx.organizationId },
    select: {
      id: true,
      name: true,
      durationMin: true,
      priceCents: true,
      active: true,
      createdAt: true,
      _count: { select: { appointments: true } },
    },
  });
  if (!service) return null;
  const { _count, ...rest } = service;
  return { ...rest, appointments: _count.appointments };
}

export async function createService(ctx: OrgContext, input: ServiceInput) {
  assertCan(ctx.role, "services:write");

  return db.$transaction(async (tx) => {
    await assertCanActivateOne(tx, ctx);
    const service = await tx.service.create({
      data: { ...input, organizationId: ctx.organizationId },
      select: { id: true },
    });
    await audit(ctx, { action: "service.created", entity: "service", entityId: service.id }, tx);
    return service;
  });
}

export async function updateService(ctx: OrgContext, serviceId: string, input: ServiceInput) {
  assertCan(ctx.role, "services:write");

  const current = await db.service.findFirst({
    where: { id: serviceId, organizationId: ctx.organizationId },
    select: { name: true, durationMin: true, priceCents: true },
  });
  if (!current) throw new DomainError("Serviço não encontrado.");

  const changed = (Object.keys(input) as (keyof ServiceInput)[]).filter(
    (key) => input[key] !== current[key],
  );
  if (changed.length === 0) return;

  await db.$transaction(async (tx) => {
    // Mudar o preço não reescreve a receita passada: cada agendamento guarda
    // o preço congelado no momento em que foi marcado.
    await tx.service.update({
      where: { id_organizationId: { id: serviceId, organizationId: ctx.organizationId } },
      data: input,
    });
    await audit(
      ctx,
      { action: "service.updated", entity: "service", entityId: serviceId, metadata: { changed } },
      tx,
    );
  });
}

/**
 * Desativar tira o serviço das opções de agendamento sem apagar o histórico.
 * Reativar ocupa uma vaga do plano de novo, então passa pela mesma checagem
 * de limite do cadastro.
 */
export async function setServiceActive(ctx: OrgContext, serviceId: string, active: boolean) {
  assertCan(ctx.role, "services:write");

  await db.$transaction(async (tx) => {
    const service = await tx.service.findFirst({
      where: { id: serviceId, organizationId: ctx.organizationId },
      select: { active: true },
    });
    if (!service) throw new DomainError("Serviço não encontrado.");
    if (service.active === active) return;

    if (active) await assertCanActivateOne(tx, ctx);
    await tx.service.update({
      where: { id_organizationId: { id: serviceId, organizationId: ctx.organizationId } },
      data: { active },
    });
    await audit(
      ctx,
      {
        action: active ? "service.activated" : "service.deactivated",
        entity: "service",
        entityId: serviceId,
      },
      tx,
    );
  });
}

export async function deleteService(ctx: OrgContext, serviceId: string) {
  assertCan(ctx.role, "services:write");

  const service = await db.service.findFirst({
    where: { id: serviceId, organizationId: ctx.organizationId },
    select: { id: true, _count: { select: { appointments: true } } },
  });
  if (!service) throw new DomainError("Serviço não encontrado.");
  if (service._count.appointments > 0) {
    // A FK do agendamento é NO ACTION: o banco também recusaria. A mensagem
    // aponta a saída certa em vez de um erro genérico.
    throw new DomainError(
      "Este serviço já tem agendamentos e não pode ser excluído. Desative-o para tirá-lo da agenda.",
    );
  }

  await db.$transaction(async (tx) => {
    await tx.service.delete({
      where: { id_organizationId: { id: service.id, organizationId: ctx.organizationId } },
    });
    await audit(ctx, { action: "service.deleted", entity: "service", entityId: service.id }, tx);
  });
}
