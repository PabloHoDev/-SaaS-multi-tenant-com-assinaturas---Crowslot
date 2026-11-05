import { describe, expect, it } from "vitest";

import { assertWithinLimit, isWithinLimit, PlanLimitError } from "./plans";

describe("limites por plano", () => {
  it("Free aceita até 50 clientes", () => {
    expect(isWithinLimit("FREE", "clients", 49)).toBe(true);
    expect(isWithinLimit("FREE", "clients", 50)).toBe(false);
  });

  it("Pro não limita clientes", () => {
    expect(isWithinLimit("PRO", "clients", 1_000_000)).toBe(true);
  });

  it("lança PlanLimitError com o limite atingido", () => {
    expect(() => assertWithinLimit("FREE", "members", 2)).toThrow(PlanLimitError);
    try {
      assertWithinLimit("FREE", "members", 2);
    } catch (e) {
      expect((e as PlanLimitError).limit).toBe(2);
    }
  });
});
