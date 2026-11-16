/**
 * Conversão entre o que a pessoa digita ("45,90", "R$ 1.200") e centavos.
 * Dinheiro trafega e é guardado sempre em centavos (inteiro): nada de float.
 */

const MONEY_PATTERN = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Lê um valor em reais no formato brasileiro e devolve centavos, ou `null` se
 * o texto não for um valor válido. Aceita "45", "45,5", "45,50", "1.234,56" e
 * o prefixo "R$". Não aceita negativos nem mais de duas casas decimais.
 */
export function parseBrlToCents(input: string): number | null {
  const text = input.replace(/^\s*R\$\s*/i, "").trim();
  const match = MONEY_PATTERN.exec(text);
  if (!match) return null;

  const reais = Number(match[1].replaceAll(".", ""));
  const centavos = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = reais * 100 + centavos;
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Centavos para o valor de um campo de formulário: 4590 → "45,90". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
