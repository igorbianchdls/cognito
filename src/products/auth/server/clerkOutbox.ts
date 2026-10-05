import { randomUUID } from 'node:crypto'
import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { updateClerkOrganization, updateClerkOrganizationMembership } from './clerkOrganizationClient'
import type { AuthTenantRole } from '../shared/authContracts'

type Operation = { type: 'membership'; organizationId: string; clerkUserId: string; appRole: AuthTenantRole }
  | { type: 'organization'; organizationId: string; name: string; slug: string }
type Row = { id: string; payload: Operation; status: string; tentativas: number }

export async function enqueueClerkOperation(client: Pick<SQLClient, 'query'>, operation: Operation): Promise<number> {
  const entity = operation.type === 'membership' ? `${operation.organizationId}:${operation.clerkUserId}` : operation.organizationId
  const result = await client.query(`INSERT INTO shared.eventos_webhook(provedor,evento_id,tipo,entidade_id,ocorrido_em,payload)
    VALUES('clerk_outbox',$1,$2,$3,clock_timestamp(),$4::jsonb) RETURNING id`,
  [randomUUID(), operation.type, entity, JSON.stringify(operation)])
  return Number(result.rows[0].id)
}

// Claim a durable lease, commit, then call Clerk. No external call inside a DB transaction.
export async function processClerkOperation(id: number): Promise<boolean> {
  const row = await withTransaction(async client => {
    const result = await client.query(`SELECT id,payload,status,tentativas,entidade_id FROM shared.eventos_webhook
      WHERE id=$1 AND provedor='clerk_outbox' FOR UPDATE`, [id])
    const current = result.rows[0]
    if (!current || ['processed','ignored'].includes(String(current.status))) return null
    await client.query('SELECT pg_advisory_xact_lock(73005,hashtext($1))', [String(current.entidade_id)])
    const busy = await client.query(`SELECT id FROM shared.eventos_webhook WHERE provedor='clerk_outbox' AND entidade_id=$1
      AND status='processing' AND proxima_tentativa_em>now()`, [current.entidade_id])
    if (busy.rows.length) return null
    const newer = await client.query(`SELECT id FROM shared.eventos_webhook WHERE provedor='clerk_outbox'
      AND entidade_id=$1 AND id>$2 LIMIT 1`, [current.entidade_id,id])
    if (newer.rows.length) {
      await client.query("UPDATE shared.eventos_webhook SET status='ignored',processado_em=now() WHERE id=$1", [id])
      return null
    }
    await client.query(`UPDATE shared.eventos_webhook SET status='processing',tentativas=tentativas+1,
      proxima_tentativa_em=now()+interval '60 seconds',erro_codigo=NULL WHERE id=$1`, [id])
    return current as unknown as Row
  })
  if (!row) {
    const [state] = await runQuery<{ status: string }>('SELECT status FROM shared.eventos_webhook WHERE id=$1', [id])
    return ['processed','ignored'].includes(state?.status || '')
  }
  try {
    const operation = row.payload
    if (operation.type === 'membership') await updateClerkOrganizationMembership(operation)
    else await updateClerkOrganization(operation)
    await runQuery("UPDATE shared.eventos_webhook SET status='processed',processado_em=now(),proxima_tentativa_em=NULL WHERE id=$1", [id])
    return true
  } catch {
    await runQuery(`UPDATE shared.eventos_webhook SET status='failed',erro_codigo='CLERK_SYNC_FAILED',
      proxima_tentativa_em=now()+interval '1 minute'*least(60,power(2,least(tentativas,5))) WHERE id=$1`, [id])
    return false
  }
}

export async function retryClerkOperations(limit = 20): Promise<{ processed: number; pending: number }> {
  const rows = await runQuery<{ id: string }>(`SELECT id FROM shared.eventos_webhook WHERE provedor='clerk_outbox'
    AND status IN ('pending','failed','processing') AND (proxima_tentativa_em IS NULL OR proxima_tentativa_em<=now())
    ORDER BY id DESC LIMIT $1`, [Math.min(100,Math.max(1,limit))])
  let processed = 0
  for (const row of rows) if (await processClerkOperation(Number(row.id))) processed++
  return { processed, pending: rows.length-processed }
}
