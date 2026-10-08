import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { businessDay } from '@/products/erp/shared/businessDate'

/** "Hoje" no fuso da empresa do contexto autenticado (padrão America/Sao_Paulo). */
export function erpToday(now = new Date()): string {
  return businessDay(getErpDatabaseContext()?.timeZone, now)
}

/** "Hoje" no SQL, no fuso da empresa definido em app.erp_time_zone; o banco roda em UTC. */
export const ERP_TODAY_SQL = `(now() AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date`
