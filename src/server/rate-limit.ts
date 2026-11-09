import "server-only";

import { headers } from "next/headers";

import { DomainError } from "@/lib/action-state";
import { db } from "@/lib/db";
import { humanizeSeconds, retryAfterSeconds, windowStartFor } from "@/lib/rate-limit-window";
import { hashToken } from "@/lib/tokens";

/**
 * Rate limit em janela fixa, guardado no próprio Postgres: sem Redis nem
 * serviço externo. O incremento é um único UPSERT atômico, então requisições
 * simultâneas não "furam" o limite.
 */

export type RateLimitRule = { limit: number; windowSec: number };

export const RATE_LIMITS = {
  /** Links mágicos por e-mail de destino. */
  loginEmail: { limit: 5, windowSec: 15 * 60 },
  /** Pedidos de link mágico por IP (vários e-mails). */
  loginIp: { limit: 10, windowSec: 15 * 60 },
  /** Reenvio de convite para o mesmo e-mail na mesma organização. */
  inviteEmail: { limit: 1, windowSec: 60 },
  /** Convites enviados por organização por dia. */
  inviteOrg: { limit: 30, windowSec: 24 * 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export class RateLimitError extends DomainError {
  constructor(public readonly retryAfterSec: number) {
    super(`Muitas tentativas. Tente de novo em ${humanizeSeconds(retryAfterSec)}.`);
    this.name = "RateLimitError";
  }
}

/** Conta uma tentativa. `identifier` (e-mail, IP…) é guardado só como hash. */
export async function consumeRateLimit(
  bucket: keyof typeof RATE_LIMITS,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit, windowSec } = RATE_LIMITS[bucket];
  const now = Date.now();
  const windowStart = windowStartFor(now, windowSec);
  const key = `${bucket}:${hashToken(identifier.toLowerCase())}`;

  const [row] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`;

  // Limpeza ocasional de janelas antigas, para a tabela não crescer sem fim.
  if (Math.random() < 0.02) {
    await db.$executeRaw`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`;
  }

  return { allowed: (row?.count ?? 1) <= limit, retryAfterSec: retryAfterSeconds(now, windowSec) };
}

export async function assertRateLimit(bucket: keyof typeof RATE_LIMITS, identifier: string) {
  const result = await consumeRateLimit(bucket, identifier);
  if (!result.allowed) throw new RateLimitError(result.retryAfterSec);
}

/**
 * IP do cliente. Na Vercel, `x-forwarded-for` é definido pela própria
 * plataforma (o primeiro valor é o IP real); em outros hosts confira se o
 * proxy reescreve esse cabeçalho antes de confiar nele.
 */
export function clientIpFrom(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function currentClientIp(): Promise<string> {
  return clientIpFrom(await headers());
}
