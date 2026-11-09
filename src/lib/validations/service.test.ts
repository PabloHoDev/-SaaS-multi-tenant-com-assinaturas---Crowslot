import { describe, expect, it } from "vitest";

import { serviceSchema } from "./service";

const base = { name: "Corte masculino", durationMin: "30", price: "45,00" };

/** Campos com erro, sem repetição (um valor pode quebrar mais de uma regra). */
function fieldsWithError(input: Record<string, string>) {
  const result = serviceSchema.safeParse(input);
  expect(result.success).toBe(false);
  return [...new Set(result.error?.issues.map((i) => i.path[0]))];
}

describe("serviceSchema", () => {
  it("converte o formulário para o formato do banco (centavos)", () => {
    expect(serviceSchema.parse({ ...base, name: "  Corte masculino " })).toEqual({
      name: "Corte masculino",
      durationMin: 30,
      priceCents: 4500,
    });
  });

  it("aceita serviço gratuito", () => {
    expect(serviceSchema.parse({ ...base, price: "0" }).priceCents).toBe(0);
  });

  it("recusa nome curto", () => {
    expect(fieldsWithError({ ...base, name: "A" })).toEqual(["name"]);
  });

  it.each(["", "abc", "0", "3", "481", "32", "30.5"])("recusa duração %j", (durationMin) => {
    expect(fieldsWithError({ ...base, durationMin })).toEqual(["durationMin"]);
  });

  it.each(["", "abc", "-5", "10,999", "10.000,01"])("recusa preço %j", (price) => {
    expect(fieldsWithError({ ...base, price })).toEqual(["price"]);
  });

  it("aponta o erro de preço no campo do formulário, não no do banco", () => {
    expect(fieldsWithError({ ...base, price: "x" })).toEqual(["price"]);
  });
});
