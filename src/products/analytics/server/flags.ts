// Feature flags e experimentos: o que cada visitante recebe (sorteio estável por visitante, regras de país, aparelho,
// página, coorte e usuário identificado) e o resultado de um experimento (conversão por variante e a chance de ser
// diferente do controle, num teste de duas proporções).
import { createHash } from 'node:crypto'
import type { DefinicaoCoorte } from '../shared/consulta'
import { coorteSqlPublico } from './motor'
import { AnalyticsError, type Db } from './pg'

export type RegraFlag = { tipo: 'campo'; campo: 'pais' | 'aparelho' | 'navegador' | 'sistema' | 'idioma' | 'pagina'; op: 'igual' | 'diferente' | 'contem'; valor: string }
  | { tipo: 'coorte'; coorte_id: string } | { tipo: 'identificado'; valor: boolean }
export type Flag = { key: string; enabled: boolean; rollout: number; rules: RegraFlag[]; variants: { key: string; peso: number }[] | null }
export type Visitante = { distinct_id: string; user_id?: string | null; pais?: string | null; aparelho?: string; navegador?: string; sistema?: string; idioma?: string | null; pagina?: string | null }

/** 0–99, sempre o mesmo para a mesma flag e a mesma pessoa (quem se identifica mantém o sorteio do usuário). */
export const sorteio = (semente: string, quem: string) => parseInt(createHash('sha1').update(`${semente}.${quem}`).digest('hex').slice(0, 8), 16) % 100

function regraAtende(r: RegraFlag, v: Visitante, coortes: Set<string>) {
  if (r.tipo === 'identificado') return Boolean(v.user_id) === r.valor
  if (r.tipo === 'coorte') return coortes.has(r.coorte_id)
  const atual = String((r.campo === 'pagina' ? v.pagina : v[r.campo]) ?? '').toLowerCase(), alvo = r.valor.toLowerCase()
  return r.op === 'igual' ? atual === alvo : r.op === 'diferente' ? atual !== alvo : atual.includes(alvo)
}

/** O valor de uma flag para o visitante: false (fora), true (dentro) ou a chave da variante. */
export function decidirFlag(f: Flag, v: Visitante, coortes: Set<string> = new Set()): boolean | string {
  if (!f.enabled) return false
  if (!f.rules.every(r => regraAtende(r, v, coortes))) return false
  const quem = v.user_id || v.distinct_id
  if (sorteio(f.key, quem) >= f.rollout) return false
  if (!f.variants?.length) return true
  const n = sorteio(`${f.key}:variante`, quem)
  let acumulado = 0
  for (const variante of f.variants) { acumulado += variante.peso; if (n < acumulado) return variante.key }
  return f.variants[f.variants.length - 1].key
}

/** As flags ligadas de um site para um visitante (o servidor, sem as regras de acesso: a chave pública já foi conferida). */
export async function flagsDoVisitante(db: Db, propertyId: string, v: Visitante) {
  const flags = await db.query<Flag>('SELECT key, enabled, rollout, rules, variants FROM analytics.flags WHERE property_id = $1 AND enabled', [propertyId])
  const ids = [...new Set(flags.flatMap(f => f.rules).filter(r => r.tipo === 'coorte').map(r => (r as { coorte_id: string }).coorte_id))]
  const dentro = new Set<string>()
  if (ids.length) {
    const pessoa = await pessoaDoVisitante(db, propertyId, v)
    const coortes = await db.query<{ id: string; rules: DefinicaoCoorte }>('SELECT id, rules FROM analytics.cohorts WHERE property_id = $1 AND id = ANY($2::uuid[])', [propertyId, ids])
    for (const c of coortes) {
      const { sql, params } = coorteSqlPublico(c.rules, propertyId)
      const [r] = await db.query(`SELECT 1 AS ok FROM (${sql}) c WHERE c.person = $${params.length + 1} LIMIT 1`, [...params, pessoa])
      if (r) dentro.add(c.id)
    }
  }
  return Object.fromEntries(flags.map(f => [f.key, decidirFlag(f, v, dentro)]))
}

async function pessoaDoVisitante(db: Db, propertyId: string, v: Visitante) {
  if (v.user_id) return v.user_id
  const [i] = await db.query<{ user_id: string }>('SELECT user_id FROM analytics.identities WHERE property_id = $1 AND distinct_id = $2', [propertyId, v.distinct_id])
  return i?.user_id ?? v.distinct_id
}

// ---------------------------------------------------------------- experimentos

/** Função de distribuição da normal padrão (aproximação de Abramowitz e Stegun, erro < 1e-7). */
function normal(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

/** Duas proporções: valor-p (bicaudal) e a chance de a variante ser melhor que o controle. */
export function comparar(controle: { expostos: number; convertidos: number }, variante: { expostos: number; convertidos: number }) {
  if (!controle.expostos || !variante.expostos) return { p_valor: null, chance_melhor: null }
  const p1 = controle.convertidos / controle.expostos, p2 = variante.convertidos / variante.expostos
  const erro = Math.sqrt(p1 * (1 - p1) / controle.expostos + p2 * (1 - p2) / variante.expostos)
  if (!erro) return { p_valor: p1 === p2 ? 1 : 0, chance_melhor: p2 > p1 ? 100 : p2 < p1 ? 0 : 50 }
  const z = (p2 - p1) / erro
  return { p_valor: Math.round(2 * (1 - normal(Math.abs(z))) * 10000) / 10000, chance_melhor: Math.round(normal(z) * 1000) / 10 }
}

/**
 * O resultado de um experimento: quem viu cada variante (evento $flag com a flag do experimento) e quem fez o evento
 * objetivo depois de ver. A primeira variante é o controle.
 */
export async function resultadoExperimento(db: Db, id: string) {
  const [x] = await db.query<{ property_id: string; goal_event: string; started_at: string | null; ended_at: string | null; key: string; variants: { key: string }[] | null }>(
    `SELECT x.property_id, x.goal_event, x.started_at, x.ended_at, f.key, f.variants FROM analytics.experiments x JOIN analytics.flags f ON f.id = x.flag_id WHERE x.id = $1`, [id])
  if (!x) throw new AnalyticsError('Experimento não encontrado.', 404)
  const variantes = x.variants?.map(v => v.key) ?? ['true', 'false']
  if (!x.started_at) return { variantes: variantes.map(v => ({ variante: v, expostos: 0, convertidos: 0, conversao: 0, p_valor: null, chance_melhor: null })), significativo: false, iniciado: false }
  const rows = await db.query<{ variante: string; expostos: number; convertidos: number }>(`
    WITH expostos AS (
      SELECT e.person, (array_agg(e.properties ->> 'variante' ORDER BY e."timestamp"))[1] AS variante, min(e."timestamp") AS primeira
      FROM analytics.events_people e WHERE e.property_id = $1 AND e.event = '$flag' AND e.properties ->> 'flag' = $2
        AND e."timestamp" >= $3 AND e."timestamp" < COALESCE($4::timestamptz, now() + interval '1 minute') GROUP BY e.person)
    SELECT x.variante, count(*)::int AS expostos, count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics.events_people g WHERE g.property_id = $1 AND g.person = x.person
      AND g.event = $5 AND g."timestamp" >= x.primeira AND g."timestamp" < COALESCE($4::timestamptz, now() + interval '1 minute')))::int AS convertidos
    FROM expostos x GROUP BY 1`, [x.property_id, x.key, x.started_at, x.ended_at, x.goal_event])
  const por = new Map(rows.map(r => [r.variante, r]))
  const lista = variantes.map(v => { const r = por.get(v) ?? { expostos: 0, convertidos: 0 }; return { variante: v, expostos: r.expostos, convertidos: r.convertidos, conversao: r.expostos ? Math.round(r.convertidos / r.expostos * 1000) / 10 : 0 } })
  const controle = lista[0]
  const comResultado = lista.map((v, i) => ({ ...v, ...(i === 0 ? { p_valor: null, chance_melhor: null } : comparar(controle, v)) }))
  return { variantes: comResultado, significativo: comResultado.some(v => v.p_valor != null && v.p_valor < 0.05 && v.expostos >= 30 && controle.expostos >= 30), iniciado: true }
}
