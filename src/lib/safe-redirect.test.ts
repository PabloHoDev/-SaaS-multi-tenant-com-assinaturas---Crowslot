import { describe, expect, it } from "vitest";

import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("mantém caminhos internos", () => {
    expect(safeRedirect("/app/barbearia?x=1")).toBe("/app/barbearia?x=1");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, 42])(
    "bloqueia %s",
    (target) => {
      expect(safeRedirect(target)).toBe("/app");
    },
  );

  it("bloqueia caracteres de controle", () => {
    expect(safeRedirect("/app\n//evil.com")).toBe("/app");
  });
});
