import { describe, expect, it } from "vitest";

import { centsToInput, parseBrlToCents } from "./money";

describe("parseBrlToCents", () => {
  it.each([
    ["45", 4500],
    ["45,5", 4550],
    ["45,90", 4590],
    ["0,99", 99],
    ["1.234,56", 123456],
    ["R$ 35,00", 3500],
    ["  r$1.000 ", 100000],
  ])("lê %j como %i centavos", (input, cents) => {
    expect(parseBrlToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-10", "10,999", "10.5", "1.23,00", "12,", ",50", "1e3"])(
    "recusa %j",
    (input) => {
      expect(parseBrlToCents(input)).toBeNull();
    },
  );
});

describe("centsToInput", () => {
  it("formata centavos com vírgula e duas casas", () => {
    expect(centsToInput(4590)).toBe("45,90");
    expect(centsToInput(3500)).toBe("35,00");
    expect(centsToInput(5)).toBe("0,05");
  });

  it("faz ida e volta com parseBrlToCents", () => {
    for (const cents of [0, 1, 99, 4590, 123456]) {
      expect(parseBrlToCents(centsToInput(cents))).toBe(cents);
    }
  });
});
