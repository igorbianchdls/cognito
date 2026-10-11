import { createHash } from 'node:crypto'
import type { SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '../shared/erpErrors'

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}

export async function commercialRequest(client: Pick<SQLClient, 'query'>, company: number, operation: string, key: string, values: unknown) {
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:commercial:${company}:${operation}:${key}`])
  return createHash('sha256').update(JSON.stringify(canonical({ operation, values }))).digest('hex')
}

export function assertCommercialReplay(stored: unknown, hash: string) {
  if (stored !== hash) throw new ErpDomainError('IDEMPOTENCY_CONFLICT',
    'Esta identificação pertence a outra solicitação ou a um registro antigo sem assinatura. Confira o resultado anterior antes de iniciar uma nova operação.', 409, undefined, 'verify')
}
