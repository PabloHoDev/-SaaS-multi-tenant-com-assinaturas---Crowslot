import { describe, expect, it } from "vitest";

import { formatCurrency, formatDuration, initials } from "./format";

describe("formatCurrency", () => {
  it("formata centavos em reais", () => {
    // Intl usa espaço não separável entre "R$" e o valor
    expect(formatCurrency(4990).replace(/\s/g, " ")).toBe("R$ 49,90");
    expect(formatCurrency(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
});

describe("formatDuration", () => {
  it.each([
    [30, "30 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [480, "8 h"],
  ])("formata %i minutos como %j", (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe("initials", () => {
  it("usa primeira e última inicial", () => {
    expect(initials("Maria da Silva")).toBe("MS");
    expect(initials("joão")).toBe("J");
    expect(initials(null)).toBe("?");
  });
});
