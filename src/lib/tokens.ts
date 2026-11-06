import { createHash, randomBytes } from "node:crypto";

/** Token opaco de 256 bits, seguro para URL. Vai só no e-mail, nunca no banco. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash armazenado no banco. Se o banco vazar, os convites não podem ser usados. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
