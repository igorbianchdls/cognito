import { createHash, randomUUID } from 'node:crypto'

import { runQuery } from '@/lib/postgres'
import type { AiPrincipal } from '@/products/ai-platform/shared/types'

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function payloadHash(payload: Record<string, unknown>) {
  return createHash('sha256').update(canonicalJson(payload)).digest('hex')
}

export async function createAiApproval(input: {
  principal: AiPrincipal
  commitToolName: string
  payload: Record<string, unknown>
  preview: Record<string, unknown>
  expiresInMinutes?: number
}) {
  const id = randomUUID()
  const hash = payloadHash(input.payload)
  const minutes = Math.min(60, Math.max(5, input.expiresInMinutes || 15))
  await runQuery(
    `INSERT INTO shared.ai_action_approvals
       (id, tenant_id, requested_by, connection_id, tool_name, payload, payload_hash, preview, expires_at)
     VALUES ($1::uuid,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,now() + ($9::text || ' minutes')::interval)`,
    [id, input.principal.tenantId, input.principal.userId, input.principal.connectionId,
      input.commitToolName, JSON.stringify(input.payload), hash, JSON.stringify(input.preview), String(minutes)],
  )
  return { approvalId: id, status: 'pending', expiresInMinutes: minutes, preview: input.preview }
}

export async function claimAiApproval(input: {
  principal: AiPrincipal
  approvalId: string
  commitToolName: string
  payload: Record<string, unknown>
}) {
  await recoverStaleAiApprovals(input.principal.tenantId)
  const rows = await runQuery<{ id: string }>(
    `UPDATE shared.ai_action_approvals SET status = 'processing', processing_at = now(),
       processing_attempts = processing_attempts + 1
     WHERE id = $1::uuid AND tenant_id = $2 AND tool_name = $3 AND payload_hash = $4
       AND requested_by = $5
       AND connection_id IS NOT DISTINCT FROM $6::bigint
       AND status = 'approved' AND expires_at > now() AND processing_attempts < 3
     RETURNING id::text`,
    [input.approvalId, input.principal.tenantId, input.commitToolName, payloadHash(input.payload),
      input.principal.userId, input.principal.connectionId],
  )
  if (!rows[0]) throw new Error('Aprovacao inexistente, expirada, alterada ou ainda nao aprovada.')
}

export async function recoverStaleAiApprovals(tenantId: number) {
  await runQuery(
    `UPDATE shared.ai_action_approvals
     SET status = CASE
       WHEN expires_at <= now() OR processing_attempts >= 3 THEN 'expired'
       ELSE 'approved'
     END,
     processing_at = NULL
     WHERE tenant_id = $1 AND status = 'processing'
       AND processing_at < now() - interval '5 minutes'`,
    [tenantId],
  )
}

export async function finishAiApproval(input: {
  principal: AiPrincipal
  approvalId: string
  succeeded: boolean
}) {
  await runQuery(
    `UPDATE shared.ai_action_approvals
     SET status = $2, consumed_at = CASE WHEN $2 = 'consumed' THEN now() ELSE consumed_at END
       , processing_at = NULL
     WHERE id = $1::uuid AND tenant_id = $3 AND requested_by = $4
       AND connection_id IS NOT DISTINCT FROM $5::bigint AND status = 'processing'`,
    [input.approvalId, input.succeeded ? 'consumed' : 'approved', input.principal.tenantId,
      input.principal.userId, input.principal.connectionId],
  )
}

export async function executeWithAiApproval<T>(input: {
  principal: AiPrincipal
  approvalId: string
  commitToolName: string
  payload: Record<string, unknown>
  execute: () => Promise<T>
}) {
  await claimAiApproval(input)
  try {
    const result = await input.execute()
    await finishAiApproval({ principal: input.principal, approvalId: input.approvalId, succeeded: true })
    return result
  } catch (error) {
    await finishAiApproval({ principal: input.principal, approvalId: input.approvalId, succeeded: false }).catch(() => undefined)
    throw error
  }
}
