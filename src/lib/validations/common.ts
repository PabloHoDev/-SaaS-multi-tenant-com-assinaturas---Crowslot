import { z } from "zod";

/**
 * Formatos dos identificadores que chegam do navegador (parâmetros de rota e
 * argumentos ligados com `.bind()` nas Server Actions). Validar o formato
 * barra lixo cedo; a autorização continua sendo feita no servidor.
 */

/** IDs gerados pelo Prisma (`cuid()`). */
export const idSchema = z.string().regex(/^[a-z0-9]{20,40}$/, "ID inválido.");

/** Slug de organização, como gerado por `slugify` (até 48 + sufixo "-NN"). */
export const slugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/);

/** Token de convite: 32 bytes em base64url = 43 caracteres. */
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
