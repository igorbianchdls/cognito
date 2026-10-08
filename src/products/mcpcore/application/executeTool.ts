import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { z } from 'zod'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { PluginError, selectCompany, type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import { reserveExecution, finishExecution } from '../audit/executionRepository'
import { erpQueries, type ErpQueries } from './erpQueries'
import { accessSchema, tools } from '../tools/catalog'
import { actionTools } from '../actions/catalog'
import { actionDependencies, type ActionDependencies } from '../actions/dependencies'
import { preferencesDependencies } from './preferences'

export type ExecutionDependencies = {
  queries: ErpQueries
  reserve: typeof reserveExecution
  finish: typeof finishExecution
  actions?: ActionDependencies
  preferences?: typeof preferencesDependencies
}
export const executionDependencies: ExecutionDependencies = { queries: erpQueries, reserve: reserveExecution, finish: finishExecution, actions:actionDependencies }
export const accessTools = ['meu_acesso','abrir_painel'] as const
function publicError(error: unknown, write: boolean): PluginError {
  if (error instanceof PluginError) return error
  if (error instanceof ErpDomainError && error.code === 'NOT_FOUND') return new PluginError('NOT_FOUND', error.message, 404)
  if(error instanceof ErpDomainError&&['INVALID_STATE','STALE_VERSION','IDEMPOTENCY_CONFLICT'].includes(error.code))return new PluginError(error.code,error.message,409)
  // Regras comerciais (bloqueio, limite de crédito) explicam ao usuário o que fazer; só em escritas.
  if(write&&error instanceof ErpDomainError&&['CUSTOMER_BLOCKED','CREDIT_LIMIT_EXCEEDED','DISCOUNT_LIMIT_EXCEEDED','ACCESS_DENIED','PERIOD_CLOSED'].includes(error.code))return new PluginError(error.code,error.message,error.code==='ACCESS_DENIED'?403:409)
  if (error instanceof ErpDomainError && error.code === 'VALIDATION_ERROR') {
    // Em escritas a regra do ERP explica o que corrigir; em consultas não revela registros de outras empresas.
    return write ? new PluginError('VALIDATION_ERROR', error.message, 422) : new PluginError('NOT_FOUND', 'Registro não disponível nesta empresa.', 404)
  }
  if ((error as { code?: string })?.code === '57014') return new PluginError('TIMEOUT', 'A consulta excedeu o tempo limite.', 504)
  // Regras do ERP aplicadas por triggers (ex.: período fechado) chegam como erro do banco com mensagem de negócio.
  const database = error as { code?: string; message?: string }
  if (write && ['P0001','23514'].includes(database?.code || '') && database.message && database.message.length <= 300
    && !/violates|relation|constraint|column/i.test(database.message)) return new PluginError('ERP_RULE', database.message, 422)
  return new PluginError('ERP_UNAVAILABLE', 'Não foi possível concluir a consulta ao ERP.', 503)
}
// Perfil da conexão (openai/profile): o ID do Clerk é estável e não deriva de e-mail ou nome.
function profile(principal: PluginPrincipal) {
  const name = principal.name?.trim() || principal.email || 'Usuário do Cognito ERP'
  const nickname = principal.companies.length === 1 ? `${name} · ${principal.companies[0].name}` : name
  return { id: principal.clerkUserId, name, nickname, ...(principal.email ? { email: principal.email } : {}) }
}
function invalidInput(error: z.ZodError): PluginError {
  const fields = error.issues.slice(0, 8).map(issue => ({ campo: issue.path.join('.') || '(argumentos)', motivo: issue.message }))
  return new PluginError('INVALID_INPUT', 'Parâmetros inválidos: ' + fields.map(f => `${f.campo} (${f.motivo})`).join('; '), 400, undefined, fields)
}
export async function executeTool(principal: PluginPrincipal, name: string, raw: unknown, config: PluginConfig,
  deps: ExecutionDependencies = executionDependencies): Promise<CallToolResult> {
  const started = Date.now()
  let executionId: string | undefined
  const tool = tools.find(item => item.name === name)
  const action = actionTools.find(item => item.name === name)
  try {
    const access = (accessTools as readonly string[]).includes(name)
    if (!tool && !action && !access) throw new PluginError('UNKNOWN_TOOL', 'Ferramenta desconhecida.')
    const parsed = (tool?.schema || action?.schema || accessSchema).safeParse(raw)
    if (!parsed.success) throw invalidInput(parsed.error)
    const input = parsed.data as Record<string, unknown>
    if (input.vencimento_inicio && input.vencimento_fim && String(input.vencimento_inicio) > String(input.vencimento_fim)) {
      throw new PluginError('INVALID_INPUT', 'O início do período deve ser anterior ao fim.')
    }
    if (input.inicio && input.fim && (String(input.inicio) > String(input.fim) || Date.parse(String(input.fim)) - Date.parse(String(input.inicio)) > 366 * 86400000)) {
      throw new PluginError('INVALID_INPUT','Informe um período de até 366 dias, com início anterior ao fim.')
    }
    const company = access && input.empresa_id === undefined ? null : selectCompany(principal,input.empresa_id as number | undefined)
    const capabilities = tool?.requiredCapabilities?.(input) || tool?.capabilities || action?.requiredCapabilities(input) || []
    const allowed = capabilities.every(capability => company?.capabilities.includes(capability))
    // Registre apenas metadados, nunca argumentos ou resultados com dados pessoais.
    executionId = await deps.reserve(principal,name,company?.id || null,config.integration)
    if (!allowed) throw new PluginError('ACCESS_DENIED', 'Seu perfil não permite esta operação.', 403)
    if (action && !principal.scopes.includes('erp:write')) throw new PluginError('INSUFFICIENT_SCOPE','A conexão precisa da permissão erp:write para alterar dados.',403)
    let timer: ReturnType<typeof setTimeout> | undefined
    let data: unknown
    try {
      data = await Promise.race([
        access ? Promise.resolve({ usuario_id: principal.userId, empresas: principal.companies, empresa_selecionada: company?.id || null })
          // Escritas definem o próprio contexto: prévia somente leitura, execução em transação.
          : action ? action.execute(deps.actions || actionDependencies,principal,company!.id,input,config)
          : runWithErpDatabaseContext({ tenantId: company!.id, userId: principal.userId, readOnly: true, statementTimeoutMs: 10000, timeZone: company!.timeZone },
            () => tool!.execute(deps.queries,company!.id,input)),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PluginError('TIMEOUT','A consulta excedeu o tempo limite.',504)),config.toolTimeoutMs) }),
      ])
    } finally { if (timer) clearTimeout(timer) }
    const payload = { ...(name === 'meu_acesso' ? profile(principal) : {}), ok: true, execution_id: executionId, empresa_id: company?.id || null, data }
    const serialized = JSON.stringify(payload)
    if (Buffer.byteLength(serialized) > 128 * 1024) throw new PluginError('RESULT_TOO_LARGE', 'Refine os filtros para reduzir o resultado.')
    await deps.finish(executionId,'succeeded',null,Date.now()-started,config.integration)
    return { content: [{ type:'text', text: serialized }], structuredContent: JSON.parse(serialized) }
  } catch (error) {
    const failure = publicError(error, Boolean(action))
    if (!executionId) {
      executionId = await deps.reserve(principal,name.slice(0,100),null,config.integration).catch(() => undefined)
    }
    if (executionId) await deps.finish(executionId,'failed',failure.code,Date.now()-started,config.integration).catch(() => {
      console.error(JSON.stringify({ scope:`${config.integration}plugin`, code:'AUDIT_UNAVAILABLE', executionId }))
    })
    return { isError: true, content: [{ type:'text', text: JSON.stringify({ ok:false,code:failure.code,message:failure.message,
      ...(failure.fields ? { campos: failure.fields } : {}), execution_id:executionId || null }) }],
      ...(failure.code === 'INSUFFICIENT_SCOPE' ? {_meta:{'mcp/www_authenticate':[`Bearer resource_metadata="${config.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope", error_description="Reconecte com permissao de escrita"`]}} : {}) }
  }
}
