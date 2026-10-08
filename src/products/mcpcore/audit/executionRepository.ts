import { randomUUID } from 'node:crypto'
import { pluginQuery } from '../shared/database'
import { PluginError, type PluginPrincipal } from '../shared/contracts'
import type { PluginIntegration } from '../shared/config'

export async function reserveExecution(principal: PluginPrincipal, tool: string, companyId: number | null, integration: PluginIntegration) {
  const id = randomUUID()
  await pluginQuery(
    `INSERT INTO plugin.executions(id, user_id, empresa_id, oauth_client_id, tool_name, status, integration)
     VALUES ($1,$2,$3,$4,$5,'running',$6)`, [id, principal.userId, companyId, principal.clientId, tool, integration],
  )
  return id
}
export async function finishExecution(id: string, status: 'succeeded' | 'failed', code: string | null, durationMs: number, integration: PluginIntegration) {
  await pluginQuery(
    `UPDATE plugin.executions SET status=$2,error_code=$3,duration_ms=$4,finished_at=now() WHERE id=$1 AND integration=$5`,
    [id, status, code, durationMs, integration],
  )
}
export async function consumeRequestLimit(principal: PluginPrincipal, limit: number, integration: PluginIntegration) {
  const rows = await pluginQuery<{ requests: number }>(
    `INSERT INTO plugin.rate_windows(user_id, window_start, requests, integration)
     VALUES($1,date_trunc('minute',now()),1,$2)
     ON CONFLICT(integration,user_id,window_start) DO UPDATE SET requests=plugin.rate_windows.requests+1
     RETURNING requests`, [principal.userId, integration],
  )
  if (rows[0].requests > limit) throw new PluginError('RATE_LIMITED', 'Limite de chamadas atingido. Tente novamente em um minuto.', 429)
}
