import { runQuery } from '@/lib/postgres'
import { recoverStaleAiApprovals } from '@/products/ai-platform/approvals/aiApprovalRepository'

export async function listAiConnections(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT connections.id::text, connections.provider, connections.client_name,
       connections.scopes, connections.status, connections.write_enabled,
       connections.connected_at, connections.last_used_at, users.full_name AS user_name, users.email AS user_email
     FROM shared.ai_connections AS connections
     JOIN shared.users AS users ON users.id = connections.user_id
     WHERE connections.tenant_id = $1
     ORDER BY connections.last_used_at DESC NULLS LAST, connections.connected_at DESC`,
    [tenantId],
  )
}

export async function updateAiConnection(input: {
  tenantId: number
  id: number
  writeEnabled?: boolean
  status?: 'active' | 'suspended' | 'revoked'
}) {
  const rows = await runQuery<Record<string, unknown>>(
    `UPDATE shared.ai_connections SET
       write_enabled = COALESCE($3, write_enabled),
       status = COALESCE($4, status),
       revoked_at = CASE WHEN $4 = 'revoked' THEN now() WHEN $4 = 'active' THEN NULL ELSE revoked_at END
     WHERE tenant_id = $1 AND id = $2
     RETURNING id::text, provider, status, write_enabled, last_used_at`,
    [input.tenantId, input.id, input.writeEnabled ?? null, input.status || null],
  )
  if (!rows[0]) throw new Error('Conexao nao encontrada.')
  return rows[0]
}

export async function listAiApprovals(tenantId: number) {
  await recoverStaleAiApprovals(tenantId)
  await runQuery(
    `UPDATE shared.ai_action_approvals SET status = 'expired'
     WHERE tenant_id = $1 AND status IN ('pending','approved') AND expires_at <= now()`,
    [tenantId],
  )
  return runQuery<Record<string, unknown>>(
    `SELECT approvals.id::text, approvals.tool_name, approvals.preview, approvals.status,
       approvals.requested_at, approvals.expires_at, approvals.decided_at,
       requesters.full_name AS requested_by_name, approvers.full_name AS approved_by_name
     FROM shared.ai_action_approvals AS approvals
     JOIN shared.users AS requesters ON requesters.id = approvals.requested_by
     LEFT JOIN shared.users AS approvers ON approvers.id = approvals.approved_by
     WHERE approvals.tenant_id = $1
     ORDER BY approvals.requested_at DESC LIMIT 200`,
    [tenantId],
  )
}

export async function listAiExecutions(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT executions.id::text, executions.tool_name, executions.source, executions.risk,
       executions.status, executions.correlation_id::text, executions.output_summary,
       executions.error_code, executions.error_message, executions.duration_ms,
       executions.started_at, executions.finished_at, users.full_name AS user_name
     FROM shared.ai_tool_executions AS executions
     LEFT JOIN shared.users AS users ON users.id = executions.user_id
     WHERE executions.tenant_id = $1
     ORDER BY executions.started_at DESC LIMIT 100`,
    [tenantId],
  )
}

export async function decideAiApproval(input: {
  tenantId: number
  actorId: number
  id: string
  decision: 'approved' | 'rejected'
  reason?: string | null
}) {
  const rows = await runQuery<Record<string, unknown>>(
    `UPDATE shared.ai_action_approvals SET status = $4, approved_by = $3,
       decided_at = now(), decision_reason = $5
     WHERE tenant_id = $1 AND id = $2::uuid AND status = 'pending' AND expires_at > now()
     RETURNING id::text, tool_name, status, decided_at`,
    [input.tenantId, input.id, input.actorId, input.decision, input.reason?.trim() || null],
  )
  if (!rows[0]) throw new Error('Solicitacao nao encontrada, expirada ou ja decidida.')
  return rows[0]
}
