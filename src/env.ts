import { z } from "zod";

/**
 * Validação das variáveis de ambiente no boot.
 * Falhar cedo com uma mensagem clara é melhor do que descobrir em produção
 * que uma chave está faltando.
 */
const serverSchema = z.object({
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

  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Variáveis de ambiente inválidas. Veja .env.example.");
}

export const env = parsed.data;
