// Segments: turns the rules into one parameterised WHERE over inbox.contacts (alias c). Runs "as the person", so the
// same row level security as the screens applies; broadcasts (etapa 5) use the service connection with the workspace fixed.
import { InboxError, type Db, type Person, type Query } from './db'
import { parseRules, type SegmentCondition, type SegmentRules } from '../shared/segments'
import { UUID } from './http'

const like = (s: string) => '%' + s.replace(/[\\%_]/g, m => '\\' + m) + '%'

/** WHERE fragment for the rules; params are appended to the given list (placeholders continue from it). */
export function compileSegment(rules: SegmentRules, params: unknown[]): string {
  const p = (v: unknown) => { params.push(v); return `$${params.length}` }
  const days = (n: unknown) => `now() - make_interval(days => ${p(Number(n))}::int)`
  const one = (c: SegmentCondition): string => {
    const neg = (sql: string, yes: boolean) => (yes ? sql : `NOT ${sql}`)
    switch (c.campo) {
      case 'etiqueta':
        return neg(`EXISTS (SELECT 1 FROM inbox.contact_tags t WHERE t.contact_id = c.id AND t.tag_id = ${p(c.valor)}::uuid)`, c.op === 'tem')
      case 'canal':
        return neg(`EXISTS (SELECT 1 FROM inbox.contact_identities i JOIN inbox.channels ch ON ch.id = i.channel_id WHERE i.contact_id = c.id AND ch.kind::text = ${p(c.valor)})`, c.op === 'tem')
      case 'origem':
        if (c.op === 'vazio') return `coalesce(c.source, '') = ''`
        if (c.op === 'preenchido') return `coalesce(c.source, '') <> ''`
        return c.op === 'igual' ? `lower(c.source) = lower(${p(c.valor)})` : `c.source ILIKE ${p(like(String(c.valor)))}`
      case 'comprou': case 'reembolsou': {
        const status = c.campo === 'comprou' ? `('aprovada')` : `('reembolsada', 'chargeback')`
        const product = c.valor ? ` AND x.product ILIKE ${p(like(String(c.valor)))}` : ''
        return neg(`EXISTS (SELECT 1 FROM inbox.purchases x WHERE x.contact_id = c.id AND x.status::text IN ${status}${product})`, c.op === 'sim')
      }
      case 'total_gasto':
        return `(SELECT coalesce(sum(x.amount), 0) FROM inbox.purchases x WHERE x.contact_id = c.id AND x.status = 'aprovada') ${c.op === 'maior' ? '>' : '<'} ${p(Number(c.valor))}::numeric`
      case 'ultima_mensagem': {
        const last = `(SELECT max(v.last_inbound_at) FROM inbox.conversations v WHERE v.contact_id = c.id)`
        return c.op === 'ha_menos' ? `${last} > ${days(c.valor)}` : `${last} < ${days(c.valor)}`
      }
      case 'criado':
        return c.op === 'ha_menos' ? `c.created_at > ${days(c.valor)}` : `c.created_at < ${days(c.valor)}`
      case 'negocio':
        if (c.op === 'nenhum') return `NOT EXISTS (SELECT 1 FROM inbox.deals d WHERE d.contact_id = c.id)`
        return `EXISTS (SELECT 1 FROM inbox.deals d JOIN inbox.pipeline_stages s ON s.id = d.stage_id WHERE d.contact_id = c.id AND s.kind::text = ${p(c.op)})`
      case 'etapa':
        return `EXISTS (SELECT 1 FROM inbox.deals d WHERE d.contact_id = c.id AND d.stage_id = ${p(c.valor)}::uuid)`
      case 'campo': {
        const field = `(c.fields ->> ${p(c.chave)})`
        if (c.op === 'vazio') return `coalesce(${field}, '') = ''`
        if (c.op === 'preenchido') return `coalesce(${field}, '') <> ''`
        return c.op === 'igual' ? `lower(${field}) = lower(${p(c.valor)})` : `${field} ILIKE ${p(like(String(c.valor)))}`
      }
      case 'telefone': return c.op === 'preenchido' ? 'c.phone IS NOT NULL' : 'c.phone IS NULL'
      case 'email': return c.op === 'preenchido' ? 'c.email IS NOT NULL' : 'c.email IS NULL'
    }
  }
  if (!rules.condicoes.length) return 'true'
  return '(' + rules.condicoes.map(c => `(${one(c)})`).join(rules.modo === 'qualquer' ? ' OR ' : ' AND ') + ')'
}

export type SegmentContact = { id: string; name: string; phone: string | null; email: string | null; source: string | null; created_at: string }

/** Who is in the segment now: total plus the first `limit` contacts, newest first. */
export async function segmentContacts(q: Query, workspaceId: string, rules: SegmentRules, { limit = 50, offset = 0 } = {}) {
  const params: unknown[] = [workspaceId]
  const where = compileSegment(rules, params)
  const [{ total }] = await q<{ total: number }>(`SELECT count(*)::int AS total FROM inbox.contacts c WHERE c.workspace_id = $1 AND ${where}`, params)
  const rows = limit > 0 ? await q<SegmentContact>(
    `SELECT c.id, c.name, c.phone, c.email, c.source, c.created_at FROM inbox.contacts c WHERE c.workspace_id = $1 AND ${where}
     ORDER BY c.created_at DESC, c.id LIMIT ${Math.min(5000, Math.max(1, limit))} OFFSET ${Math.max(0, offset)}`, params) : []
  return { total, contatos: rows }
}

/** Rules from a body: either { segmento_id } (a saved one) or { regras }. */
async function rulesFrom(q: Query, workspaceId: string, input: Record<string, unknown>): Promise<SegmentRules> {
  if (typeof input.segmento_id === 'string') {
    if (!UUID.test(input.segmento_id)) throw new InboxError('INVALID', 'Segmento inválido.')
    const [s] = await q<{ rules: unknown }>('SELECT rules FROM inbox.segments WHERE id = $1 AND workspace_id = $2', [input.segmento_id, workspaceId])
    if (!s) throw new InboxError('NOT_FOUND', 'Segmento não encontrado.', 404)
    return parseRules(s.rules)
  }
  try { return parseRules(input.regras) } catch (e) { throw new InboxError('INVALID', (e as Error).message) }
}

/** POST /api/inbox/segmentos/previa: count and first contacts, for the builder and the CSV export. */
export async function previewSegment(who: Person, input: Record<string, unknown>, db: Db) {
  const limit = Math.min(5000, Math.max(0, Number(input.limite ?? 50) || 0))
  const offset = Math.max(0, Number(input.inicio ?? 0) || 0)
  return db.asPerson(who, async q => segmentContacts(q, who.orgId, await rulesFrom(q, who.orgId, input), { limit, offset }))
}

/** Sources seen in the company, most common first: suggestions for the "Origem" rule and the contact panel. */
export async function listSources(who: Person, db: Db) {
  return db.asPerson(who, q => q<{ origem: string; contatos: number }>(
    `SELECT source AS origem, count(*)::int AS contatos FROM inbox.contacts WHERE workspace_id = $1 AND coalesce(source, '') <> ''
     GROUP BY source ORDER BY 2 DESC, 1 LIMIT 100`, [who.orgId]))
}
