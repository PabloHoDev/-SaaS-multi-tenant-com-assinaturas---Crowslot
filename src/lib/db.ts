import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Em dev o hot reload recria módulos; reaproveitamos a instância para não
// esgotar o pool de conexões.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
