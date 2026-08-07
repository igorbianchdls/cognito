import { randomUUID } from 'node:crypto'

import { finishAiExecution, startAiExecution } from '@/products/ai-platform/audit/aiAuditRepository'
import type { AiExecutionSource, AiPrincipal } from '@/products/ai-platform/shared/types'
import { getAiTool } from '@/products/ai-platform/tools/toolRegistry'

export class AiToolError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message)
  }
}

export async function executeAiTool(input: {
  principal: AiPrincipal
  source: AiExecutionSource
  toolName: string
  args: unknown
  correlationId?: string
}) {
  const tool = getAiTool(input.toolName)
  if (!tool) throw new AiToolError('AI_TOOL_NOT_FOUND', 'Ferramenta nao encontrada.', 404)
  const parsed = tool.inputSchema.safeParse(input.args)
  if (!parsed.success) throw new AiToolError('AI_TOOL_INVALID_INPUT', parsed.error.message, 422)
  const correlationId = input.correlationId || randomUUID()
  const idempotencyKey = typeof parsed.data.idempotencyKey === 'string' ? parsed.data.idempotencyKey : null
  const startedAt = Date.now()
  const executionId = await startAiExecution({
    principal: input.principal,
    source: input.source,
    toolName: tool.name,
    toolVersion: tool.version,
    risk: tool.risk,
    correlationId,
    idempotencyKey,
    args: parsed.data,
  })

  try {
    if (!input.principal.capabilities.includes(tool.capability)) {
      throw new AiToolError('AI_CAPABILITY_DENIED', 'Usuario sem permissao para esta ferramenta.', 403)
    }
    if (input.source === 'mcp' && tool.risk !== 'read' && !input.principal.writeEnabled) {
      throw new AiToolError('AI_WRITE_DISABLED', 'As ferramentas de escrita estao desabilitadas para esta conexao.', 403)
    }
    const result = await tool.execute({ principal: input.principal, source: input.source, correlationId }, parsed.data)
    if (tool.outputSchema) tool.outputSchema.parse(result)
    await finishAiExecution({ executionId, startedAt, result })
    return { ok: true, tool: tool.name, correlationId, data: result }
  } catch (error) {
    await finishAiExecution({
      executionId,
      startedAt,
      error,
      denied: error instanceof AiToolError && error.status === 403,
    }).catch(() => undefined)
    throw error
  }
}
