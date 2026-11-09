import { describe, expect, it } from "vitest";

import { formatPhone, isValidBrPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("mantém só os dígitos", () => {
    expect(normalizePhone("(85) 99876-5432")).toBe("85998765432");
  });

  it("remove o +55", () => {
    expect(normalizePhone("+55 85 99876-5432")).toBe("85998765432");
  });
});

describe("isValidBrPhone", () => {
  it("aceita celular e fixo com DDD", () => {
    expect(isValidBrPhone("85998765432")).toBe(true);
    expect(isValidBrPhone("8532345678")).toBe(true);
  });

  it("recusa número sem DDD, DDD inválido ou celular sem o 9", () => {
    expect(isValidBrPhone("998765432")).toBe(false);
    expect(isValidBrPhone("05998765432")).toBe(false);
    expect(isValidBrPhone("85898765432")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("aplica a máscara de celular e de fixo", () => {
    expect(formatPhone("85998765432")).toBe("(85) 99876-5432");
    expect(formatPhone("8532345678")).toBe("(85) 3234-5678");
  });

  it("devolve vazio para nulo e o original quando não reconhece", () => {
    expect(formatPhone(null)).toBe("");
    expect(formatPhone("123")).toBe("123");
  });
});
