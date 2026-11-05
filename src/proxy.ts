import { NextResponse, type NextRequest } from "next/server";

/**
 * Checagem otimista: só verifica se existe cookie de sessão, sem ir ao banco.
 * A autorização de verdade (sessão válida + membership na organização)
 * acontece no servidor, em `src/server/tenant.ts`, em cada página e action.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
};
