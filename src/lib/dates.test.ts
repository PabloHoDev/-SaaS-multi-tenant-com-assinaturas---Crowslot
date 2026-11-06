import { describe, expect, it } from "vitest";

import {
  dayRange,
  localDateString,
  monthRange,
  timeZoneOffsetMinutes,
  zonedTimeToUtc,
} from "./dates";

const SP = "America/Sao_Paulo";

describe("fuso horário", () => {
  it("calcula o offset de São Paulo", () => {
    expect(timeZoneOffsetMinutes(new Date("2026-11-06T12:00:00Z"), SP)).toBe(-180);
    expect(timeZoneOffsetMinutes(new Date("2026-11-06T12:00:00Z"), "UTC")).toBe(0);
  });

  it("às 23h em SP ainda é o mesmo dia, embora já seja amanhã em UTC", () => {
    const instant = new Date("2026-11-07T02:00:00Z"); // 06/11 23:00 em SP
    expect(localDateString(instant, SP)).toBe("2026-11-06");
  });

  it("converte horário local em UTC", () => {
    expect(zonedTimeToUtc("2026-11-06", 9, 30, SP).toISOString()).toBe("2026-11-06T12:30:00.000Z");
  });
});

describe("dayRange", () => {
  it("retorna o dia local de SP em UTC", () => {
    const { start, end } = dayRange(new Date("2026-11-07T02:00:00Z"), SP);
    expect(start.toISOString()).toBe("2026-11-06T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-07T03:00:00.000Z");
  });
});

describe("monthRange", () => {
  it("vira o ano corretamente em dezembro", () => {
    const { start, end } = monthRange(new Date("2026-12-15T12:00:00Z"), SP);
    expect(start.toISOString()).toBe("2026-12-01T03:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });
});
