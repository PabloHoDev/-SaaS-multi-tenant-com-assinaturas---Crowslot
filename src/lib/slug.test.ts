import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("remove acentos, espaços e símbolos", () => {
    expect(slugify("Barbearia do João & Cia.")).toBe("barbearia-do-joao-cia");
    expect(slugify("  Salão   Beleza  ")).toBe("salao-beleza");
  });

  it("limita o tamanho sem terminar em hífen", () => {
    const slug = slugify("a".repeat(47) + " bcd");
    expect(slug.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("adiciona sufixo numérico quando o slug já existe", async () => {
    const taken = new Set(["studio", "studio-2"]);
    await expect(uniqueSlug("Studio", async (s) => taken.has(s))).resolves.toBe("studio-3");
  });

  it("evita slugs reservados", async () => {
    await expect(uniqueSlug("Admin", async () => false)).resolves.toBe("admin-2");
  });

  it("usa fallback quando o nome não gera slug", async () => {
    await expect(uniqueSlug("!!!", async () => false)).resolves.toBe("salao");
  });
});
