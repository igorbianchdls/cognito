import type { Database, Session } from './database'

// Daily counters of each app, in São Paulo days. Counting never fails the request that is counted.
export async function countUse(db: Database, s: Session, appId: string, mode: 'publicado' | 'publico', kind: 'aberturas' | 'criacoes') {
  // A savepoint keeps a failed count from aborting the transaction of the request.
  await db.query('SAVEPOINT contar_uso')
  try {
  await db.query(`INSERT INTO apps.uso_diario(empresa_id,app_id,dia,modo,${kind}) VALUES($1,$2,(now() AT TIME ZONE 'America/Sao_Paulo')::date,$3,1)
    ON CONFLICT(empresa_id,app_id,dia,modo) DO UPDATE SET ${kind}=apps.uso_diario.${kind}+1`, [s.tenantId, appId, mode])
  await db.query('RELEASE SAVEPOINT contar_uso')
  } catch { await db.query('ROLLBACK TO SAVEPOINT contar_uso').catch(() => undefined) }
}
/** Totals of the last 30 days and the days with use, newest first. */
export async function usageOf(db: Database, s: Session, appId: string) {
  const rows = (await db.query("SELECT dia::text,modo,aberturas,criacoes FROM apps.uso_diario WHERE empresa_id=$1 AND app_id=$2 AND dia > (now() AT TIME ZONE 'America/Sao_Paulo')::date-30 ORDER BY dia DESC", [s.tenantId, appId])).rows
  const sum = (mode: string, key: 'aberturas' | 'criacoes') => rows.filter(r => r.modo === mode).reduce((total, r) => total + Number(r[key]), 0)
  return { periodo_dias: 30, aberturas_app: sum('publicado', 'aberturas'), aberturas_link_publico: sum('publico', 'aberturas'), registros_criados_por_visitantes: sum('publico', 'criacoes'), dias: rows.slice(0, 30).map(r => ({ dia: String(r.dia), modo: String(r.modo), aberturas: Number(r.aberturas), criacoes: Number(r.criacoes) })) }
}
