// Data comercial do ERP. "Hoje" sempre no fuso da empresa (padrão America/Sao_Paulo); datas
// sem hora (YYYY-MM-DD) são calculadas ao meio-dia UTC para não mudar de dia com o fuso.
// Usado no servidor e no navegador: não depende de contexto de requisição.
export const DEFAULT_ERP_TIME_ZONE = 'America/Sao_Paulo'

const validZones = new Map<string, boolean>()
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_+\-/]{1,63}$/.test(value)) return false
  if (!validZones.has(value)) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: value }); validZones.set(value, true) }
    catch { validZones.set(value, false) }
  }
  return validZones.get(value)!
}
export function normalizeTimeZone(value: unknown): string {
  return isValidTimeZone(value) ? value : DEFAULT_ERP_TIME_ZONE
}
/** Dia corrente (YYYY-MM-DD) no fuso informado. */
export function businessDay(timeZone?: string | null, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: normalizeTimeZone(timeZone), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
/** Primeiro e último dia do mês de `day`, deslocado em `offset` meses. */
export function monthBounds(day: string, offset = 0): { start: string; end: string } {
  const [year, month] = day.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1 + offset, 1, 12))
  const end = new Date(Date.UTC(year, month + offset, 0, 12))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}
