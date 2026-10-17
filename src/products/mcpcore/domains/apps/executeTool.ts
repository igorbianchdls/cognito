import { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { withAppsClient } from '@/products/apps/server/database'
import { AppsError } from '@/products/apps/shared/contracts'
import { TablesError } from '@/products/tables/shared/contracts'
import { PluginError, selectCompany, type PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'
import type { ExecutionDependencies } from '../../application/executeTool'
import { appsTools } from './tools/catalog'
import { appsDependencies, cancelOperation, currentSession, getOperation, readApps, runAction } from './actions/coordinator'

export async function executeApps(principal: PluginPrincipal, name: string, raw: unknown, config: PluginConfig, deps: ExecutionDependencies): Promise<CallToolResult> {
  let executionId: string | undefined, timer: ReturnType<typeof setTimeout> | undefined
  const start = Date.now(), tool = appsTools.find(t => t.name === name), apps = deps.apps ?? appsDependencies
  try {
    if (!tool) throw new PluginError('UNKNOWN_TOOL', 'Ferramenta desconhecida.')
    if (!principal.scopes.includes(config.scope)) throw new PluginError('INSUFFICIENT_SCOPE', 'Reconecte com permissão de leitura.', 403)
    const input = tool.schema.parse(raw), company = selectCompany(principal, input.empresa_id), writes = tool.write || tool.control
    if (writes && !principal.scopes.includes('erp:write')) throw new PluginError('INSUFFICIENT_SCOPE', 'Reconecte com permissão de escrita.', 403)
    executionId = await deps.reserve(principal, name, company.id, config.integration)
    const task = apps.transaction(async db => {
      const session = await currentSession(db, principal, company.id, writes)
      if (tool.key === 'obter_operacao') return getOperation(db, principal, company.id, input, config)
      if (tool.control) return cancelOperation(db, principal, company.id, input.operacao_id, config)
      if (tool.write) return runAction(db, principal, session, tool.key, input, config, apps)
      return withAppsClient(db, session, client => readApps(client, session, tool.key, input, config))
    })
    const data = await Promise.race([task, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PluginError('TIMEOUT', 'A chamada demorou. Consulte apps_obter_operacao com a mesma chave antes de repetir.', 504)), config.toolTimeoutMs) })])
    const payload = { ok: true, execution_id: executionId, empresa_id: company.id, data }, text = JSON.stringify(payload)
    if (Buffer.byteLength(text) > 128 * 1024) throw new PluginError('RESULT_TOO_LARGE', 'Resultado grande demais. Leia o arquivo em partes com inicio e tamanho.')
    await deps.finish(executionId, 'succeeded', null, Date.now() - start, config.integration)
    return { content: [{ type: 'text', text }], structuredContent: payload }
  } catch (error) {
    let failure: PluginError
    if (error instanceof PluginError) failure = error
    else if (error instanceof AppsError || error instanceof TablesError) failure = new PluginError(error.code, error.message, error.status)
    else if (error instanceof z.ZodError) failure = new PluginError('INVALID_INPUT', 'Confira os campos informados.', 422, undefined, error.issues.slice(0, 8).map(i => ({ campo: i.path.join('.'), motivo: i.message })))
    else {
      const code = (error as { code?: string })?.code
      failure = ['23514', '23503', '23505', '22P02'].includes(code ?? '') ? new PluginError('INVALID_VALUE', 'Um valor não é compatível ou não está disponível nesta empresa.', 422)
        : ['40001', '40P01', '55P03'].includes(code ?? '') ? new PluginError('VERSION_CONFLICT', 'Outra alteração está em andamento. Consulte o app e tente de novo.', 409)
        : new PluginError('SERVICE_UNAVAILABLE', 'Não foi possível concluir. Consulte apps_obter_operacao antes de repetir uma alteração.', 503)
    }
    executionId ??= await deps.reserve(principal, name.slice(0, 100), null, config.integration).catch(() => undefined)
    if (executionId) await deps.finish(executionId, 'failed', failure.code, Date.now() - start, config.integration).catch(() => undefined)
    const payload = { ok: false, code: failure.code, message: failure.message, ...(failure.fields ? { campos: failure.fields } : {}), execution_id: executionId || null }
    return { isError: true, content: [{ type: 'text', text: JSON.stringify(payload) }], ...(failure.code === 'INSUFFICIENT_SCOPE' ? { _meta: { 'mcp/www_authenticate': [`Bearer resource_metadata="${config.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope"`] } } : {}) }
  } finally { clearTimeout(timer) }
}
