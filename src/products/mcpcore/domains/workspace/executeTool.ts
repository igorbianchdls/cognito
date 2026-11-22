// Runs a drive_ or analytics_ tool: checks the connection's scopes and the company, records the call (metadata only)
// and runs it as the person (editor/server/database.ts). Errors come back with a code the assistant can act on.
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { selectCompany, PluginError, type PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'
import { reserveExecution, finishExecution } from '../../audit/executionRepository'
import { AnalyticsUnavailable } from '@/products/analytics/server/bigquery'
import { asMember, type Connect } from '../editor/server/database'
import { driveTools } from '../drive/tools/catalog'
import { analyticsTools } from '../analytics/tools/catalog'
import type { ToolContext, WorkspaceTool } from './context'

export const workspaceTools: WorkspaceTool[] = [...driveTools, ...analyticsTools]
export const isWorkspaceTool = (name: string) => name.startsWith('drive_') || name.startsWith('analytics_')
export const workspaceWrites = (name: unknown) => workspaceTools.some(t => t.write && t.name === name)

export type WorkspaceDependencies = { connect?: Connect; storage?: ToolContext['storage']; bigquery?: ToolContext['bigquery']; timeoutMs?: number }
type Audit = { reserve: typeof reserveExecution; finish: typeof finishExecution }

function publicError(error: unknown): PluginError {
  if (error instanceof PluginError) return error
  if (error instanceof AnalyticsUnavailable) return new PluginError('ANALYTICS_UNAVAILABLE', error.message, 503)
  if (error instanceof z.ZodError) {
    const fields = error.issues.slice(0, 8).map(issue => ({ campo: issue.path.join('.') || '(argumentos)', motivo: issue.message }))
    return new PluginError('INVALID_INPUT', 'Parâmetros inválidos: ' + fields.map(f => `${f.campo} (${f.motivo})`).join('; '), 400, undefined, fields)
  }
  const code = (error as { code?: string })?.code
  if (code === '42501') return new PluginError('ACCESS_DENIED', 'Seu perfil nesta empresa não permite esta alteração.', 403)
  if (code === '23505') return new PluginError('ALREADY_EXISTS', 'Já existe um item com esses dados.', 409)
  if (code === '23503' || code === '23514' || code === '22P02') return new PluginError('INVALID_INPUT', 'Os dados não combinam com os registros desta empresa. Consulte de novo e tente outra vez.', 422)
  if (code === '57014') return new PluginError('TIMEOUT', 'A operação demorou demais. Consulte antes de repetir.', 504)
  console.error(JSON.stringify({ scope: 'workspace-tools', code: code ?? 'UNEXPECTED', message: (error as Error)?.message?.slice(0, 200) }))
  return new PluginError('UNAVAILABLE', 'Não foi possível concluir agora. Consulte antes de repetir uma alteração.', 503)
}

export async function executeWorkspace(principal: PluginPrincipal, name: string, raw: unknown, config: PluginConfig, deps: WorkspaceDependencies = {},
  audit: Audit = { reserve: reserveExecution, finish: finishExecution }): Promise<CallToolResult> {
  const started = Date.now()
  let executionId: string | undefined
  try {
    const tool = workspaceTools.find(t => t.name === name)
    if (!tool) throw new PluginError('UNKNOWN_TOOL', 'Ferramenta desconhecida.')
    if (!principal.scopes.includes(config.scope)) throw new PluginError('INSUFFICIENT_SCOPE', 'Reconecte o Cognito com permissão de leitura.', 403)
    const input = tool.schema.parse(raw ?? {}) as Record<string, unknown>
    const company = selectCompany(principal, input.empresa_id as number | undefined)
    executionId = await audit.reserve(principal, name, company.id, config.integration)
    if (tool.write && !principal.scopes.includes('erp:write')) throw new PluginError('INSUFFICIENT_SCOPE', 'A conexão precisa da permissão erp:write para alterar dados.', 403)
    const ctx: ToolContext = {
      as: fn => asMember(principal, company, tool.write, fn, deps.connect),
      origin: new URL(config.resource).origin, assistant: config.integration === 'claude' ? 'Claude' : 'ChatGPT', storage: deps.storage, bigquery: deps.bigquery,
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const data = await Promise.race([
      (tool.run as (input: unknown, ctx: ToolContext) => Promise<unknown>)(input, ctx),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PluginError('TIMEOUT', 'A operação demorou demais. Consulte antes de repetir.', 504)), deps.timeoutMs ?? 50000) }),
    ]).finally(() => clearTimeout(timer))
    const payload = { ok: true, execution_id: executionId, empresa_id: company.id, data }
    const text = JSON.stringify(payload)
    if (Buffer.byteLength(text) > 256 * 1024) throw new PluginError('RESULT_TOO_LARGE', 'O resultado ficou grande demais. Filtre a consulta.', 413)
    await audit.finish(executionId, 'succeeded', null, Date.now() - started, config.integration)
    return { content: [{ type: 'text', text }], structuredContent: JSON.parse(text) }
  } catch (error) {
    const failure = publicError(error)
    if (!executionId) executionId = await audit.reserve(principal, name.slice(0, 100), null, config.integration).catch(() => undefined)
    if (executionId) await audit.finish(executionId, 'failed', failure.code, Date.now() - started, config.integration).catch(() => undefined)
    const payload = { ok: false, code: failure.code, message: failure.message, ...(failure.fields ? { campos: failure.fields } : {}), execution_id: executionId ?? null }
    return { isError: true, content: [{ type: 'text', text: JSON.stringify(payload) }],
      ...(failure.code === 'INSUFFICIENT_SCOPE' ? { _meta: { 'mcp/www_authenticate': [`Bearer resource_metadata="${config.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope"`] } } : {}) }
  }
}
