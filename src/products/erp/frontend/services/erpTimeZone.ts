import { DEFAULT_ERP_TIME_ZONE, businessDay, normalizeTimeZone } from '@/products/erp/shared/businessDate'

// Fuso da empresa ativa, recebido de /api/erp/acesso. Até chegar, vale o padrão America/Sao_Paulo.
let current = DEFAULT_ERP_TIME_ZONE
export function setErpTimeZone(value: unknown) { current = normalizeTimeZone(value) }
export function erpClientTimeZone() { return current }
/** "Hoje" (YYYY-MM-DD) no fuso da empresa, não no relógio UTC do navegador. */
export function erpClientToday() { return businessDay(current) }
/** Primeiro dia do mês corrente da empresa, como Date local para os seletores de período. */
export function erpClientMonthStart() {
  const [year, month] = erpClientToday().split('-').map(Number)
  return new Date(year, month - 1, 1)
}
