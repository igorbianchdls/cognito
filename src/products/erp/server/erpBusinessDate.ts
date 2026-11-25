import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { hojeDaEmpresa } from '@/products/erp/regras/geral'

/** "Hoje" no fuso da empresa do contexto autenticado (GE-01, regras/geral.ts). */
export function erpToday(now = new Date()): string {
  return hojeDaEmpresa(getErpDatabaseContext()?.timeZone, now)
}

/** "Hoje" no SQL, no fuso da empresa definido em app.erp_time_zone; o banco roda em UTC. */
export const ERP_TODAY_SQL = `(now() AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date`
