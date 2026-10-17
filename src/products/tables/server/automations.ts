import { createHmac, randomBytes } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { Pool } from 'pg'
import { z } from 'zod'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { withTablesTransaction, type Database, type TablesSession } from './database'
import { readFields, recordSelect, requireRole, requireTable } from './repository'
import { buildRecordQuery } from './queries'
import { withComputed } from './derived'
import { filterSchema, listQuerySchema, nameSchema, TablesError, type DataRecord } from '../shared/contracts'

// Webhooks of Tables. The queue is filled by a trigger on records; deliveries run right after the
// request that changed data (and again in the daily maintenance), signed with the automation secret.
export const TRIGGERS = ['registro_criado', 'registro_alterado', 'registro_excluido'] as const
export const automationInputSchema = z.object({ nome: nameSchema, gatilho: z.enum(TRIGGERS), url: z.string().url().max(2000).refine(u => u.startsWith('https://'), 'Use um endereço HTTPS.'), filtros: z.array(filterSchema).max(10).default([]), combinacao: z.enum(['e', 'ou']).default('e'), ativa: z.boolean().default(true) }).strict()
export const automationPatchSchema = automationInputSchema.partial().extend({ expectedVersion: z.number().int().positive() }).strict()
const RETRY_MINUTES = [1, 5, 30, 120, 720], MAX_TRIES = RETRY_MINUTES.length + 1

/** Webhooks only go to public HTTPS hosts: never to this network, the cloud metadata service or private ranges. */
export async function assertPublicUrl(raw: string) {
  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.username || url.password) throw new TablesError('INVALID_URL', 'Use um endereço HTTPS público, sem usuário e senha.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) throw new TablesError('INVALID_URL', 'Endereços internos não são permitidos.')
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => { throw new TablesError('INVALID_URL', 'Não foi possível encontrar este endereço.') })
  for (const { address } of addresses) if (privateAddress(address)) throw new TablesError('INVALID_URL', 'Endereços internos não são permitidos.')
}
function privateAddress(ip: string): boolean {
  if (ip.includes(':')) { const v = ip.toLowerCase(); return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:') && privateAddress(v.slice(7)) }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a >= 224
}

const view = (row: Record<string, unknown>) => ({ id: row.id, nome: row.nome, gatilho: row.gatilho, url: row.url, ativa: row.ativa, filtros: row.filtros, combinacao: row.combinacao, versao: row.versao, criado_em: row.criado_em, ultimas_entregas: row.ultimas_entregas ?? [] })
export async function listAutomations(db: Database, session: TablesSession, tableId: string) {
  const table = await requireTable(db, session, tableId); await requireRole(db, session, table.base_id, 'administrador')
  const rows = (await db.query(`SELECT a.*,(SELECT coalesce(jsonb_agg(e ORDER BY e.criado_em DESC),'[]') FROM (SELECT id,evento,estado,tentativas,resposta,erro,criado_em,concluido_em FROM tables.entregas WHERE empresa_id=a.empresa_id AND automacao_id=a.id ORDER BY criado_em DESC LIMIT 5) e) ultimas_entregas
    FROM tables.automacoes a WHERE a.empresa_id=$1 AND a.tabela_id=$2 ORDER BY a.criado_em`, [session.tenantId, tableId])).rows
  return { automacoes: rows.map(view) }
}
async function checkFilters(db: Database, session: TablesSession, tableId: string, filtros: unknown[]) {
  if (filtros.length) buildRecordQuery(session.tenantId, tableId, await readFields(db, session, tableId), listQuerySchema.parse({ filtros }))
}
export async function createAutomation(db: Database, session: TablesSession, tableId: string, raw: unknown) {
  const input = automationInputSchema.parse(raw)
  const table = await requireTable(db, session, tableId); await requireRole(db, session, table.base_id, 'administrador')
  await assertPublicUrl(input.url); await checkFilters(db, session, tableId, input.filtros)
  const secret = randomBytes(24).toString('base64url')
  const row = (await db.query('INSERT INTO tables.automacoes(empresa_id,base_id,tabela_id,nome,gatilho,url,filtros,combinacao,ativa,segredo,criado_por) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11) RETURNING *', [session.tenantId, table.base_id, tableId, input.nome, input.gatilho, input.url, JSON.stringify(input.filtros), input.combinacao, input.ativa, secret, session.sharedUserId])).rows[0]
  // The secret is shown once, to configure the receiver; afterwards only its use is visible.
  return { automacao: view(row), segredo: secret }
}
async function owned(db: Database, session: TablesSession, id: string) {
  const row = (await db.query('SELECT * FROM tables.automacoes WHERE empresa_id=$1 AND id=$2', [session.tenantId, id])).rows[0]
  if (!row) throw new TablesError('NOT_FOUND', 'Automação não encontrada.', 404)
  await requireRole(db, session, String(row.base_id), 'administrador')
  return row
}
export async function updateAutomation(db: Database, session: TablesSession, id: string, raw: unknown) {
  const { expectedVersion, ...input } = automationPatchSchema.parse(raw), row = await owned(db, session, id)
  if (row.versao !== expectedVersion) throw new TablesError('VERSION_CONFLICT', 'A automação mudou. Atualize a tela.', 409)
  if (input.url) await assertPublicUrl(input.url)
  if (input.filtros) await checkFilters(db, session, String(row.tabela_id), input.filtros)
  const next = { ...row, ...input }
  return { automacao: view((await db.query('UPDATE tables.automacoes SET nome=$3,gatilho=$4,url=$5,filtros=$6::jsonb,combinacao=$7,ativa=$8,versao=versao+1,atualizado_em=now() WHERE empresa_id=$1 AND id=$2 RETURNING *', [session.tenantId, id, next.nome, next.gatilho, next.url, JSON.stringify(next.filtros), next.combinacao, next.ativa])).rows[0]) }
}
export async function deleteAutomation(db: Database, session: TablesSession, id: string) {
  await owned(db, session, id); await db.query('DELETE FROM tables.automacoes WHERE empresa_id=$1 AND id=$2', [session.tenantId, id]); return { ok: true }
}

// ---- Delivery ------------------------------------------------------------------------------
let pool: InstanceType<typeof Pool> | undefined
type Client = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; release?: () => void }
export type DeliveryDependencies = { connect: () => Promise<Client>; tables: typeof withTablesTransaction; send: typeof fetch; checkUrl: typeof assertPublicUrl }
const defaults = (): DeliveryDependencies => {
  if (!process.env.SUPABASE_DB_URL) throw new Error('Tables database unavailable')
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  return { connect: () => pool!.connect(), tables: withTablesTransaction, send: fetch, checkUrl: assertPublicUrl }
}

/** The record as the receiver reads it: values by field name, plus IDs to fetch more. */
async function payloadOf(db: Database, session: TablesSession, delivery: Record<string, unknown>, automation: Record<string, unknown>) {
  const record = (await db.query(`${recordSelect} WHERE r.empresa_id=$1 AND r.id=$2`, [session.tenantId, delivery.registro_id])).rows[0] as DataRecord | undefined
  if (!record) return null
  const fields = await readFields(db, session, record.tabela_id)
  if (delivery.evento !== 'registro_excluido' && Array.isArray(automation.filtros) && automation.filtros.length) {
    const compiled = buildRecordQuery(session.tenantId, record.tabela_id, fields, listQuerySchema.parse({ filtros: automation.filtros, combinacao: automation.combinacao }))
    const match = await db.query(`SELECT 1 FROM tables.registros r WHERE ${compiled.where} AND r.id=$${compiled.whereParams.length + 1}`, [...compiled.whereParams, record.id])
    if (!match.rows[0]) return 'ignore' as const
  }
  const [shown] = await withComputed(db, session, fields, [record])
  const { displayRecords } = await import('./mcp')
  const [readable] = await displayRecords(db, session, [shown], fields, 5000)
  return { evento: delivery.evento, entrega_id: delivery.id, automacao: { id: automation.id, nome: automation.nome }, tabela_id: record.tabela_id, registro: { id: record.id, versao: record.versao, criado_em: record.criado_em, atualizado_em: record.atualizado_em, valores: (readable as { exibicao: Record<string, string> }).exibicao } }
}

export async function deliverPending(limit = 20, deps: DeliveryDependencies = defaults(), deadlineMs = 25_000) {
  const deadline = Date.now() + deadlineMs, client = await deps.connect()
  let sent = 0, failed = 0
  try {
    // A short lease, so a crash or a parallel worker never sends the same delivery twice at once.
    const claimed = (await client.query(`UPDATE tables.entregas SET proximo_em=now()+interval '5 minutes' WHERE id IN (SELECT id FROM tables.entregas WHERE estado='pendente' AND proximo_em<=now() ORDER BY proximo_em LIMIT $1 FOR UPDATE SKIP LOCKED) RETURNING *`, [limit])).rows
    for (const delivery of claimed) {
      if (Date.now() > deadline) { await client.query('UPDATE tables.entregas SET proximo_em=now() WHERE id=$1', [delivery.id]); continue }
      const automation = (await client.query('SELECT a.*,m.role FROM tables.automacoes a LEFT JOIN shared.usuarios_empresas m ON m.empresa_id=a.empresa_id AND m.usuario_id=a.criado_por AND m.status=\'active\' AND NOT m.suspenso_localmente WHERE a.id=$1', [delivery.automacao_id])).rows[0]
      const finish = (estado: string, resposta: number | null, erro: string | null) => client.query('UPDATE tables.entregas SET estado=$2,resposta=$3,erro=$4,tentativas=tentativas+1,concluido_em=now() WHERE id=$1', [delivery.id, estado, resposta, erro?.slice(0, 500) ?? null])
      if (!automation?.ativa) { await finish('ignorada', null, 'Automação desativada.'); continue }
      if (!automation.role || automation.role === 'viewer') { await finish('ignorada', null, 'Quem criou a automação não tem mais acesso de edição à empresa.'); continue }
      try {
        const session: TablesSession = { tenantId: Number(automation.empresa_id), sharedUserId: Number(automation.criado_por), role: automation.role as TablesSession['role'] }
        const payload = await deps.tables(session, false, db => payloadOf(db, session, delivery, automation))
        if (payload === 'ignore') { await finish('ignorada', null, 'O registro não atende às condições.'); continue }
        if (!payload) { await finish('ignorada', null, 'O registro não existe mais.'); continue }
        await deps.checkUrl(String(automation.url))
        const body = JSON.stringify(payload), signature = createHmac('sha256', String(automation.segredo)).update(body).digest('hex')
        const response = await deps.send(String(automation.url), { method: 'POST', body, redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { 'Content-Type': 'application/json', 'User-Agent': 'Cognito-Tables-Webhook/1', 'X-Cognito-Evento': String(delivery.evento), 'X-Cognito-Entrega': String(delivery.id), 'X-Cognito-Assinatura': 'sha256=' + signature } })
        if (response.ok) { await finish('entregue', response.status, null); sent++; continue }
        throw Object.assign(new Error(`O destino respondeu ${response.status}.`), { status: response.status })
      } catch (error) {
        const tries = Number(delivery.tentativas) + 1, status = (error as { status?: number }).status ?? null, message = error instanceof Error ? error.message : 'Falha no envio.'
        if (tries >= MAX_TRIES || error instanceof TablesError) { await finish('falhou', status, message); failed++ }
        else await client.query(`UPDATE tables.entregas SET tentativas=$2,resposta=$3,erro=$4,proximo_em=now()+make_interval(mins=>$5) WHERE id=$1`, [delivery.id, tries, status, message.slice(0, 500), RETRY_MINUTES[tries - 1]])
      }
    }
  } finally { client.release?.() }
  return { entregues: sent, falhas: failed }
}

/** Queues a delivery of the latest record (or a sample) and sends it now, to check the receiver. */
export async function testAutomation(db: Database, session: TablesSession, id: string) {
  const row = await owned(db, session, id)
  const record = (await db.query('SELECT id FROM tables.registros WHERE empresa_id=$1 AND tabela_id=$2 AND excluido_em IS NULL ORDER BY atualizado_em DESC LIMIT 1', [session.tenantId, row.tabela_id])).rows[0]
  if (!record) throw new TablesError('NO_RECORDS', 'Crie um registro na tabela para enviar um teste.')
  return { registro_id: record.id }
}

/** Test deliveries are queued by the server (people never write the queue directly) and sent at once. */
export async function sendTest(automationId: string, recordId: string, deps: DeliveryDependencies = defaults()) {
  const client = await deps.connect()
  let id: unknown
  try {
    await client.query("DELETE FROM tables.entregas WHERE automacao_id=$1 AND registro_id=$2 AND evento='teste' AND estado='pendente'", [automationId, recordId])
    id = (await client.query("INSERT INTO tables.entregas(empresa_id,automacao_id,registro_id,evento) SELECT empresa_id,id,$2,'teste' FROM tables.automacoes WHERE id=$1 RETURNING id", [automationId, recordId])).rows[0]?.id
  } finally { client.release?.() }
  await deliverPending(20, deps)
  const check = await deps.connect()
  try { return (await check.query('SELECT id,estado,tentativas,resposta,erro FROM tables.entregas WHERE id=$1', [id])).rows[0] } finally { check.release?.() }
}

/** Sends what is queued after the response, when there is a request; never fails the request. */
export function deliverSoon() {
  void import('next/server').then(({ after }) => { try { after(() => deliverPending().catch(() => undefined)) } catch { /* outside a request: the daily maintenance sends it */ } }).catch(() => undefined)
}
