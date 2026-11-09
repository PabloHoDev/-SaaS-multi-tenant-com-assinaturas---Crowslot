import { describe, expect, it } from "vitest";

import { clientListQuerySchema, clientSchema } from "./client";

const base = { name: "Ana Souza", email: "", phone: "", notes: "" };

describe("clientSchema", () => {
  it("transforma campos opcionais vazios em null", () => {
    expect(clientSchema.parse(base)).toEqual({
      name: "Ana Souza",
      email: null,
      phone: null,
      notes: null,
    });
  });

  it("normaliza e-mail e telefone", () => {
    const parsed = clientSchema.parse({
      ...base,
      email: "  Ana@Email.COM ",
      phone: "(85) 99876-5432",
    });
    expect(parsed.email).toBe("ana@email.com");
    expect(parsed.phone).toBe("85998765432");
  });

  it("recusa nome curto, e-mail e telefone inválidos", () => {
    const result = clientSchema.safeParse({ ...base, name: "A", email: "x@", phone: "123" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["name", "email", "phone"]));
  });
});

describe("clientListQuerySchema", () => {
  it("usa padrões quando a URL tem lixo", () => {
    expect(clientListQuerySchema.parse({ page: "abc", q: ["a", "b"] })).toEqual({ q: "", page: 1 });
    expect(clientListQuerySchema.parse({})).toEqual({ q: "", page: 1 });
  });

  it("lê busca e página válidas", () => {
    expect(clientListQuerySchema.parse({ q: " ana ", page: "3" })).toEqual({ q: "ana", page: 3 });
  });
});
