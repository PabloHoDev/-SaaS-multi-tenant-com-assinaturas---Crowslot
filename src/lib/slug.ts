/** Slugs que colidiriam com rotas do app ou soariam oficiais demais. */
export const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "admin",
  "login",
  "onboarding",
  "convite",
  "precos",
  "settings",
  "suporte",
  "crowslot",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/**
 * Gera um slug disponível. `isTaken` é injetado para manter a função pura e
 * testável sem banco.
 */
export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "salao";
  const candidates = [base, ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`)];

  for (const candidate of candidates) {
    if (!RESERVED_SLUGS.has(candidate) && !(await isTaken(candidate))) return candidate;
  }
  // Fallback praticamente inalcançável: sufixo aleatório.
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
