import { describe, expect, it } from "vitest";

import { formatCurrency, initials } from "./format";

describe("formatCurrency", () => {
  it("formata centavos em reais", () => {
    // Intl usa espaço não separável entre "R$" e o valor
    expect(formatCurrency(4990).replace(/\s/g, " ")).toBe("R$ 49,90");
    expect(formatCurrency(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
});

describe("initials", () => {
  it("usa primeira e última inicial", () => {
    expect(initials("Maria da Silva")).toBe("MS");
    expect(initials("joão")).toBe("J");
    expect(initials(null)).toBe("?");
  });
});
