/**
 * Datas no fuso da organização. O servidor (Vercel) roda em UTC; sem isso,
 * "hoje" viraria "amanhã" para um salão em São Paulo depois das 21h.
 */

/** Offset do fuso em minutos para um instante (ex.: São Paulo → -180). */
export function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value;

  const match = part?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0; // "GMT" puro = UTC
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** "AAAA-MM-DD" do instante no fuso informado. */
export function localDateString(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);
}

/** Converte uma data/hora local do fuso ("2026-11-06", 9, 30) em instante UTC. */
export function zonedTimeToUtc(date: string, hour: number, minute: number, timeZone: string) {
  const asUtc = new Date(`${date}T${pad(hour)}:${pad(minute)}:00Z`);
  const offset = timeZoneOffsetMinutes(asUtc, timeZone);
  return new Date(asUtc.getTime() - offset * 60_000);
}

/** Intervalo semiaberto [início, fim) do dia local que contém `instant`. */
export function dayRange(instant: Date, timeZone: string): { start: Date; end: Date } {
  const day = localDateString(instant, timeZone);
  const start = zonedTimeToUtc(day, 0, 0, timeZone);
  const next = new Date(`${day}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = zonedTimeToUtc(next.toISOString().slice(0, 10), 0, 0, timeZone);
  return { start, end };
}

/** Intervalo [início, fim) do mês local que contém `instant`. */
export function monthRange(instant: Date, timeZone: string): { start: Date; end: Date } {
  const [year, month] = localDateString(instant, timeZone).split("-").map(Number) as [
    number,
    number,
  ];
  const start = zonedTimeToUtc(`${year}-${pad(month)}-01`, 0, 0, timeZone);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = zonedTimeToUtc(`${nextYear}-${pad(nextMonth)}-01`, 0, 0, timeZone);
  return { start, end };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
