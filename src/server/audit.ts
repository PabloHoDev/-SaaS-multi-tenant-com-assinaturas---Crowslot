import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type { OrgContext } from "./tenant";

type AuditInput = {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

type Tx = Pick<typeof db, "auditLog">;

/**
 * Registra "quem fez o quê". Aceita um client de transação para que o log
 * seja gravado atomicamente junto com a alteração auditada.
 */
export async function audit(ctx: OrgContext, input: AuditInput, tx: Tx = db) {
  await tx.auditLog.create({
    data: {
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      ...input,
    },
  });
}
