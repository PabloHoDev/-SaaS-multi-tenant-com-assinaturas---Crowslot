import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(60, "Use no máximo 60 caracteres."),
});

export const inviteMemberSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER"], "Escolha um papel."),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
