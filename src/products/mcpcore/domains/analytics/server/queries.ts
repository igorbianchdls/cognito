// Postgres SQL for the Analytics tools (eventos em analytics.events_people; a pessoa já junta visitante e usuário). The assistant never writes SQL: it picks from fixed dimensions, measures and
// operators, values always go as query parameters, and property keys are checked against a strict pattern.
import { PluginError } from '../../../shared/contracts'

export const TZ = 'America/Sao_Paulo'
export const SCOPE = 'property_id = @p::uuid AND "timestamp" >= @de::timestamptz AND "timestamp" < @ate::timestamptz'

export const DIMENSIONS = {
  pagina: 'path', host: 'host', origem: "COALESCE(utm_source, referrer_host, '(direto)')", site_de_origem: "COALESCE(referrer_host, '(direto)')",
  campanha: "COALESCE(utm_campaign, '(sem campanha)')", fonte_utm: "COALESCE(utm_source, '(nenhuma)')", meio_utm: "COALESCE(utm_medium, '(nenhum)')",
  conteudo_utm: "COALESCE(utm_content, '(nenhum)')", aparelho: "COALESCE(device, 'outro')", navegador: "COALESCE(browser, 'Outro')",
  sistema: "COALESCE(os, 'Outro')", pais: "COALESCE(country, '—')", regiao: "COALESCE(region, '—')", idioma: "COALESCE(language, '—')", evento: 'event',
} as const
export type Dimension = keyof typeof DIMENSIONS
export const DIMENSION_NAMES = Object.keys(DIMENSIONS) as [Dimension, ...Dimension[]]

const PROP = /^propriedade:([A-Za-z0-9_]{1,64})$/
/** A dimension name, or "propriedade:<key>" for a property the site sends with its events. */
export function dimensionSql(name: string) {
  if (name in DIMENSIONS) return DIMENSIONS[name as Dimension]
  const m = PROP.exec(name)
  if (m) return `COALESCE(properties ->> '${m[1]}', '(vazio)')`
  throw new PluginError('INVALID_INPUT', `Campo desconhecido: ${name}. Use ${DIMENSION_NAMES.join(', ')} ou propriedade:<nome>.`, 422)
}
export const numericProperty = (key: string) => {
  if (!/^[A-Za-z0-9_]{1,64}$/.test(key)) throw new PluginError('INVALID_INPUT', 'Nome de propriedade inválido.', 422)
  return `(CASE WHEN properties ->> '${key}' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (properties ->> '${key}')::float8 END)`
}

export type Param = { name: string; type: 'STRING' | 'INT64' | 'TIMESTAMP'; value: string | number }
export type Filter = { campo: string; operador: 'igual' | 'diferente' | 'contem' | 'nao_contem' | 'existe'; valor?: string }

/** The filters as SQL with their parameters (f0, f1…). */
export function filtersSql(filters: Filter[] = []) {
  const params: Param[] = []
  const sql = filters.map((f, i) => {
    const expr = dimensionSql(f.campo), name = `f${i}`
    if (f.operador === 'existe') return `${expr} NOT IN ('(vazio)', '(nenhum)', '(nenhuma)', '(direto)', '(sem campanha)', '—')`
    params.push({ name, type: 'STRING', value: f.valor ?? '' })
    return f.operador === 'igual' ? `${expr} = @${name}` : f.operador === 'diferente' ? `${expr} IS DISTINCT FROM @${name}`
      : f.operador === 'contem' ? `strpos(lower(${expr}), lower(@${name})) > 0` : `strpos(lower(COALESCE(${expr}, '')), lower(@${name})) = 0`
  }).map(s => ` AND ${s}`).join('')
  return { sql, params }
}

export const BUCKETS = {
  hora: `to_char("timestamp" AT TIME ZONE '${TZ}', 'YYYY-MM-DD HH24:00')`,
  dia: `to_char("timestamp" AT TIME ZONE '${TZ}', 'YYYY-MM-DD')`,
  semana: `to_char(date_trunc('week', "timestamp" AT TIME ZONE '${TZ}'), 'YYYY-MM-DD')`,
  mes: `to_char("timestamp" AT TIME ZONE '${TZ}', 'YYYY-MM')`,
} as const
/** ISO em UTC. */
export const iso = (expr: string) => `to_char((${expr}) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`

type Db = { query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<R[]> }
/** Roda SQL com parâmetros nomeados (@nome) no Postgres, trocando por $1, $2… */
export async function run<R = Record<string, unknown>>(db: Db, sql: string, params: Param[]): Promise<R[]> {
  const order: string[] = []
  const text = sql.replace(/@([a-z][a-z0-9]*)\b/g, (_m, name: string) => { let i = order.indexOf(name); if (i < 0) { order.push(name); i = order.length - 1 } return `$${i + 1}` })
  const values = order.map(name => { const p = params.find(x => x.name === name); if (!p) throw new Error(`Parâmetro ausente: ${name}`); return p.value })
  return db.query<R>(text, values)
}

export function measureSql(medida: string, propriedade?: string) {
  switch (medida) {
    case 'total': return 'COUNT(*)::int'
    case 'visitantes': return 'COUNT(DISTINCT person)::int'
    case 'sessoes': return 'COUNT(DISTINCT session_id)::int'
    case 'usuarios': return 'COUNT(DISTINCT user_id)::int'
    case 'soma': case 'media':
      if (!propriedade) throw new PluginError('INVALID_INPUT', 'Para soma ou média, informe propriedade (ex.: valor).', 422)
      return `round((${medida === 'soma' ? 'SUM' : 'AVG'}(${numericProperty(propriedade)}))::numeric, 2)::float8`
    default: throw new PluginError('INVALID_INPUT', 'Medida inválida.', 422)
  }
}

/** A date (AAAA-MM-DD) as the start of that day in Brazil. */
export const dayStart = (d: string) => new Date(`${d}T00:00:00-03:00`)
/** [de, ate) from optional dates; default: the last `days` days including today. */
export function period(de?: string, ate?: string, days = 30) {
  const end = ate ? new Date(dayStart(ate).getTime() + 86400000) : new Date(dayStart(new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10)).getTime() + 86400000)
  const start = de ? dayStart(de) : new Date(end.getTime() - days * 86400000)
  if (!(end > start)) throw new PluginError('INVALID_INPUT', 'O fim do período precisa ser depois do início.', 422)
  if (end.getTime() - start.getTime() > 400 * 86400000) throw new PluginError('INVALID_INPUT', 'Use um período de até 400 dias.', 422)
  return { de: start, ate: end }
}
export const scopeParams = (propertyId: string, p: { de: Date; ate: Date }): Param[] => [
  { name: 'p', type: 'STRING', value: propertyId }, { name: 'de', type: 'TIMESTAMP', value: p.de.toISOString() }, { name: 'ate', type: 'TIMESTAMP', value: p.ate.toISOString() },
]
/** The period as Brazil dates (UTC-3), the end inclusive. */
export const label = (p: { de: Date; ate: Date }) => ({ de: new Date(p.de.getTime() - 3 * 3600000).toISOString().slice(0, 10), ate: new Date(p.ate.getTime() - 3 * 3600000 - 1).toISOString().slice(0, 10) })
export const change = (now: number, before: number) => before ? Math.round((now - before) / before * 1000) / 10 : null
