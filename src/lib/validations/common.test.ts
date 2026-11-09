import { describe, expect, it } from "vitest";

import { generateToken } from "@/lib/tokens";

import { idSchema, inviteTokenSchema, slugSchema } from "./common";

describe("formatos de identificadores", () => {
  it("aceita cuid e recusa lixo", () => {
    expect(idSchema.safeParse("cmhp3v9k20000abcd1234efgh").success).toBe(true);
    expect(idSchema.safeParse("../etc/passwd").success).toBe(false);
    expect(idSchema.safeParse({ id: 1 }).success).toBe(false);
  });

  it("aceita slugs gerados pelo app", () => {
    expect(slugSchema.safeParse("barbearia-exemplo").success).toBe(true);
    expect(slugSchema.safeParse("studio-2").success).toBe(true);
    expect(slugSchema.safeParse("a").success).toBe(true);
  });

  it("recusa slugs fora do formato", () => {
    for (const s of ["", "-x", "x-", "Barbearia", "a b", "a/b", "x".repeat(61)]) {
      expect(slugSchema.safeParse(s).success).toBe(false);
    }
  });

  it("aceita o token gerado e recusa outros formatos", () => {
    expect(inviteTokenSchema.safeParse(generateToken()).success).toBe(true);
    expect(inviteTokenSchema.safeParse("curto").success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(42) + "!").success).toBe(false);
  });
});
