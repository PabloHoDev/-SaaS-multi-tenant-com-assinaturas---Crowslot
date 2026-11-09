import { z } from "zod";

/**
 * Validação das variáveis de ambiente no boot.
 * Falhar cedo com uma mensagem clara é melhor do que descobrir em produção
 * que uma chave está faltando.
 */
const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),

    AUTH_SECRET: z.string().min(32),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Crowslot <onboarding@resend.dev>"),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),

    NEXT_PUBLIC_APP_URL: z.url().optional(),
    /** Definida pela Vercel em tempo de execução. */
    VERCEL: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    // Em deploy na Vercel, o que é opcional no dev passa a ser obrigatório.
    // (Não vale para o `next build` do CI, que roda sem essas chaves.)
    if (env.VERCEL !== "1") return;
    if (!env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "obrigatória em produção (login e convites dependem de e-mail)",
      });
    }
    if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "defina a URL pública do app (senão os links de convite apontam para localhost)",
      });
    }
  });

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Variáveis de ambiente inválidas. Veja .env.example.");
}

export const env = {
  ...parsed.data,
  NEXT_PUBLIC_APP_URL: parsed.data.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
