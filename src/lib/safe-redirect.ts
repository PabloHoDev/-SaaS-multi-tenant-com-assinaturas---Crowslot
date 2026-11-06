/**
 * Aceita apenas caminhos internos ("/app/x"). Bloqueia URLs absolutas,
 * protocol-relative ("//evil.com") e variações com barra invertida, que
 * permitiriam open redirect a partir de um link de login forjado.
 */
export function safeRedirect(target: unknown, fallback = "/app"): string {
  if (typeof target !== "string") return fallback;
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return fallback;
  }
  if (/[\u0000-\u001f]/.test(target)) return fallback;
  return target;
}
