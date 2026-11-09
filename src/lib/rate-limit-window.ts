/** Início da janela fixa que contém `nowMs` (ex.: janelas de 15 min alinhadas ao relógio). */
export function windowStartFor(nowMs: number, windowSec: number): Date {
  const windowMs = windowSec * 1000;
  return new Date(Math.floor(nowMs / windowMs) * windowMs);
}

/** Segundos até a janela atual acabar (arredondado para cima, mínimo 1). */
export function retryAfterSeconds(nowMs: number, windowSec: number): number {
  const end = windowStartFor(nowMs, windowSec).getTime() + windowSec * 1000;
  return Math.max(1, Math.ceil((end - nowMs) / 1000));
}

/** "3 minutos", "1 minuto", "40 segundos" — para mensagens ao usuário. */
export function humanizeSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}
