import { runQuery } from '@/lib/postgres'
import type { AiPrincipal, AiToolRisk, AiExecutionSource } from '@/products/ai-platform/shared/types'

const sensitiveKey = /(token|secret|password|senha|documento|cpf|cnpj|email|telefone|celular|endereco)/i

export function redactAiValue(value: unknown, key = ''): unknown {
  if (sensitiveKey.test(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactAiValue(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [entryKey, redactAiValue(entryValue, entryKey)]),
    )
  }
  if (typeof value === 'string' && value.length > 2000) return `${value.slice(0, 2000)}...[truncated]`
  return value
}

function summarizeResult(result: unknown) {
  if (Array.isArray(result)) return { type: 'array', count: result.length }
  if (!result || typeof result !== 'object') return { type: typeof result }
  const value = result as Record<string, unknown>
  return {
    type: 'object',
    keys: Object.keys(value).slice(0, 30),
    count: Array.isArray(value.records) ? value.records.length : undefined,
  }
}

export async function startAiExecution(input: {
  principal: AiPrincipal
  source: AiExecutionSource
  toolName: string
  toolVersion: string
  risk: AiToolRisk
  correlationId: string
  idempotencyKey?: string | null
  args: unknown
}) {
  const rows = await runQuery<{ id: string | number }>(
    `INSERT INTO shared.ai_tool_executions
       (tenant_id, user_id, connection_id, tool_name, tool_version, source, risk,
        correlation_id, idempotency_key, input_redacted)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::uuid,$9,$10::jsonb)
     RETURNING id`,
    [input.principal.tenantId, input.principal.userId, input.principal.connectionId,
      input.toolName, input.toolVersion, input.source, input.risk, input.correlationId,
      input.idempotencyKey || null, JSON.stringify(redactAiValue(input.args))],
  )
  return Number(rows[0].id)
}

export async function finishAiExecution(input: {
  executionId: number
  startedAt: number
  result?: unknown
  error?: unknown
  denied?: boolean
}) {
  const error = input.error instanceof Error ? input.error : input.error ? new Error(String(input.error)) : null
  await runQuery(
    `UPDATE shared.ai_tool_executions
     SET status = $2, output_summary = $3::jsonb, error_code = $4, error_message = $5,
       duration_ms = $6, finished_at = now()
     WHERE id = $1`,
    [input.executionId, input.denied ? 'denied' : error ? 'failed' : 'succeeded',
      input.result === undefined ? null : JSON.stringify(summarizeResult(input.result)),
      error ? String((error as Error & { code?: string }).code || 'AI_TOOL_ERROR') : null,
      error?.message.slice(0, 1000) || null, Date.now() - input.startedAt],
  )
}

export async function upsertAiConnection(input: {
  tenantId: number
  userId: number
  clientId: string
  scopes: string[]
  provider: 'chatgpt' | 'claude' | 'other'
}) {
  const rows = await runQuery<{ id: string | number; write_enabled: boolean; status: string }>(
    `INSERT INTO shared.ai_connections
       (tenant_id, user_id, clerk_client_id, provider, scopes, last_used_at)
     VALUES ($1,$2,$3,$4,$5,now())
     ON CONFLICT (tenant_id, user_id, clerk_client_id) DO UPDATE SET
       provider = EXCLUDED.provider, scopes = EXCLUDED.scopes, last_used_at = now()
     RETURNING id, write_enabled, status`,
    [input.tenantId, input.userId, input.clientId, input.provider, input.scopes],
  )
  return rows[0]
}
