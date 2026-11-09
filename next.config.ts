import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança aplicados a todas as respostas.
 * - frame-ancestors / X-Frame-Options: ninguém embute o app num iframe
 *   (impede clickjacking em botões como "Excluir" e "Aceitar convite").
 * - Referrer-Policy: o caminho da URL (que pode ter o token do convite)
 *   não vaza para outros sites.
 * `form-action` fica de fora de propósito: o login com Google e o checkout do
 * Stripe redirecionam para fora depois de um POST, e o Chrome aplicaria a regra
 * a esses redirecionamentos.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Ignorado em HTTP (localhost); em produção força HTTPS por 2 anos.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
