import { NextResponse, type NextRequest } from "next/server";

import { handlers } from "@/auth";
import { clientIpFrom, consumeRateLimit } from "@/server/rate-limit";

export const { GET } = handlers;

/**
 * Além do formulário (Server Action), o Auth.js expõe POST
 * /api/auth/signin/resend. Limitamos por IP aqui também, senão um script
 * poderia pular o formulário. O limite por e-mail fica no callback `signIn`.
 */
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/signin/resend")) {
    const { allowed } = await consumeRateLimit("loginIp", clientIpFrom(request.headers));
    if (!allowed) return NextResponse.redirect(new URL("/login?error=RateLimited", request.url));
  }
  return handlers.POST(request);
}
