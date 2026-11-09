import { describe, expect, it } from "vitest";

import { humanizeSeconds, retryAfterSeconds, windowStartFor } from "./rate-limit-window";

const T = Date.parse("2026-11-09T12:07:30.000Z");

describe("janela fixa", () => {
  it("alinha o início da janela ao relógio", () => {
    expect(windowStartFor(T, 15 * 60).toISOString()).toBe("2026-11-09T12:00:00.000Z");
    expect(windowStartFor(T, 60).toISOString()).toBe("2026-11-09T12:07:00.000Z");
  });

  it("calcula quanto falta para a janela acabar", () => {
    expect(retryAfterSeconds(T, 15 * 60)).toBe(450); // 12:15:00 - 12:07:30
    expect(retryAfterSeconds(T, 60)).toBe(30);
  });
});

describe("humanizeSeconds", () => {
  it("formata segundos e minutos", () => {
    expect(humanizeSeconds(1)).toBe("1 segundo");
    expect(humanizeSeconds(40)).toBe("40 segundos");
    expect(humanizeSeconds(60)).toBe("1 minuto");
    expect(humanizeSeconds(450)).toBe("8 minutos");
  });
});
