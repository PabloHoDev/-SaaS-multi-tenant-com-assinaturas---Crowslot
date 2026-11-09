/**
 * Telefones brasileiros são guardados só com dígitos (DDD + número), o que
 * deixa a busca e a comparação simples; a máscara é aplicada na exibição.
 */

/** Remove tudo que não é dígito e o código do país (+55), se houver. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
}

/** Celular (DDD + 9 + 8 dígitos) ou fixo (DDD + 8 dígitos começando em 2–5). */
export function isValidBrPhone(digits: string): boolean {
  return /^[1-9][1-9](9\d{8}|[2-5]\d{7})$/.test(digits);
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const d = normalizePhone(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}
