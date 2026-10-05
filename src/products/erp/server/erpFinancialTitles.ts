import { createHash } from 'node:crypto'
import { withTransaction, type SQLClient } from '@/lib/postgres'
import { createManualFinancialTitle, changeManualFinancialTitle, type FinancialSide } from './erpCrudRepository'
import { financialTitle } from './erpReadQueries'
import { ErpDomainError } from '../shared/erpErrors'

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
type Actor = { tenantId: number; actorId: number; side: FinancialSide }

async function snapshot(client: SQLClient, input: Actor & { id: number }, lock = false) {
  const title = (await client.query(`SELECT t.*,t.atualizado_em::text AS updated_version FROM erp.contas_${input.side} t WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL${lock ? ' FOR UPDATE' : ''}`, [input.tenantId, input.id])).rows[0]
  if (!title) throw new ErpDomainError('NOT_FOUND', 'Título não disponível nesta empresa.', 404)
  const parts = (await client.query(`SELECT p.*,p.atualizado_em::text AS updated_version FROM erp.contas_${input.side}_parcelas p WHERE tenant_id=$1 AND conta_${input.side}_id=$2 ORDER BY id${lock ? ' FOR UPDATE' : ''}`, [input.tenantId, input.id])).rows
  return hash({ title, parts })
}

async function representation(client: SQLClient, input: Actor & { id: number }, reused = false) {
  const result = await financialTitle(input.tenantId, input.side, input.id, client)
  return { ...result, versao: await snapshot(client, input), reused }
}

export function readFinancialTitleWithVersion(input: Actor & { id: number }) {
  return withTransaction(async client => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')
    return representation(client, input)
  })
}

export function createFinancialTitle(input: Actor & { values: Record<string, unknown>; key: string }) {
  return withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`${input.tenantId}:financial-title:${input.side}:${input.key}`])
    const fingerprint = hash(input.values)
    const existing = (await client.query(`SELECT id,metadata,excluido_em FROM erp.contas_${input.side} WHERE tenant_id=$1 AND chave_idempotencia=$2 FOR UPDATE`, [input.tenantId, input.key])).rows[0]
    if (existing) {
      if ((existing.metadata as Record<string, unknown>)?.api_request_hash !== fingerprint) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada com dados diferentes.', 409)
      if (existing.excluido_em) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação pertence a um título excluído. Use uma nova identificação.', 409)
      return representation(client, { ...input, id: Number(existing.id) }, true)
    }
    const id = Number(await createManualFinancialTitle(client, input.tenantId, input.actorId, input.side, input.values, input.key, 'api'))
    await client.query(`UPDATE erp.contas_${input.side} SET metadata=metadata||jsonb_build_object('api_request_hash',$3::text) WHERE tenant_id=$1 AND id=$2`, [input.tenantId, id, fingerprint])
    return representation(client, { ...input, id })
  })
}

export function changeFinancialTitle(input: Actor & { id: number; expected: string; values: Record<string, unknown>; remove?: boolean }) {
  return withTransaction(async client => {
    if (await snapshot(client, input, true) !== input.expected) throw new ErpDomainError('STALE_RECORD', 'Este título mudou. Consulte os dados novamente antes de salvar.', 412, undefined, 'refresh')
    await changeManualFinancialTitle(client, input.tenantId, input.actorId, input.side, input.id, input.values, input.remove, 'api')
    return input.remove ? { id: String(input.id), status: 'cancelado', deleted: true } : representation(client, input)
  })
}
