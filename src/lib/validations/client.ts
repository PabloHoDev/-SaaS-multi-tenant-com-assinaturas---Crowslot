import { z } from "zod";

import { isValidBrPhone, normalizePhone } from "@/lib/phone";

/** Campo opcional: string vazia vira `null` (limpa o valor no banco). */
const emptyToNull = (value: string) => value || null;

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome (pelo menos 2 caracteres).")
    .max(80, "Use no máximo 80 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "E-mail muito longo.")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Informe um e-mail válido.")
    .transform(emptyToNull),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine(
      (v) => v === "" || isValidBrPhone(v),
      "Informe o telefone com DDD, ex.: (85) 99999-9999.",
    )
    .transform(emptyToNull),
  notes: z.string().trim().max(500, "Use no máximo 500 caracteres.").transform(emptyToNull),
});

export type ClientInput = z.output<typeof clientSchema>;

/**
 * Parâmetros da listagem vindos da URL. Valores inválidos (ou repetidos, como
 * `?page=1&page=2`) caem no padrão em vez de quebrar a página.
 */
export const clientListQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
