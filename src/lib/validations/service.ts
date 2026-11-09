import { z } from "zod";

import { parseBrlToCents } from "@/lib/money";

/** Teto de preço: evita valores absurdos por erro de digitação (R$ 10.000,00). */
export const MAX_SERVICE_PRICE_CENTS = 1_000_000;

export const serviceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome (pelo menos 2 caracteres).")
      .max(60, "Use no máximo 60 caracteres."),
    durationMin: z.coerce
      .number({ error: "Informe a duração em minutos." })
      .int("Use minutos inteiros.")
      .min(5, "A duração mínima é de 5 minutos.")
      .max(480, "A duração máxima é de 8 horas (480 minutos).")
      .multipleOf(5, "Use múltiplos de 5 minutos, para encaixar na agenda."),
    price: z
      .string()
      .transform((value, ctx) => {
        const cents = parseBrlToCents(value);
        if (cents === null) {
          ctx.addIssue({ code: "custom", message: "Informe o preço em reais, ex.: 45,00." });
          return z.NEVER;
        }
        return cents;
      })
      .refine((cents) => cents <= MAX_SERVICE_PRICE_CENTS, "O preço máximo é R$ 10.000,00."),
  })
  // O formulário fala em reais ("price"); o resto do sistema, em centavos.
  .transform(({ price, ...rest }) => ({ ...rest, priceCents: price }));

export type ServiceInput = z.output<typeof serviceSchema>;
