// Data comercial do ERP. A regra (GE-01) e a implementação ficam em regras/geral.ts; aqui só os nomes
// usados pelo resto do código. Usado no servidor e no navegador: não depende de contexto de requisição.
import { FUSO_PADRAO, fusoDaEmpresa, fusoValido, hojeDaEmpresa, limitesDoMes, somarDias } from '../regras/geral'

export const DEFAULT_ERP_TIME_ZONE = FUSO_PADRAO
export const isValidTimeZone = fusoValido
export const normalizeTimeZone = fusoDaEmpresa

/** Dia corrente (YYYY-MM-DD) no fuso informado (GE-01). */
export function businessDay(timeZone?: string | null, now = new Date()): string {
  return hojeDaEmpresa(timeZone, now)
}
export const addDays = somarDias

/** Primeiro e último dia do mês de `day`, deslocado em `offset` meses. */
export function monthBounds(day: string, offset = 0): { start: string; end: string } {
  const { inicio, fim } = limitesDoMes(day, offset)
  return { start: inicio, end: fim }
}
