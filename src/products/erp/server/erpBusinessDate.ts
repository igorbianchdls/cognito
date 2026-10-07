import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { businessDay } from '@/products/erp/shared/businessDate'

/** "Hoje" no fuso da empresa do contexto autenticado (padrão America/Sao_Paulo). */
export function erpToday(now = new Date()): string {
  return businessDay(getErpDatabaseContext()?.timeZone, now)
}
