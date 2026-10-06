import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { PluginError, selectCompany, type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import { reserveExecution, finishExecution } from '../audit/executionRepository'
import { erpQueries, type ErpQueries } from './erpQueries'
import { accessSchema, tools } from '../tools/catalog'
import { actionTools } from '../actions/catalog'
import { actionDependencies, type ActionDependencies } from '../actions/draftRepository'
import { preferencesDependencies } from '../extensions/settings'
import { cardSchema,cardSources } from '../ui/contracts/cards'

export type ExecutionDependencies = {
  queries: ErpQueries
  reserve: typeof reserveExecution
  finish: typeof finishExecution
  actions?: ActionDependencies
  preferences?: typeof preferencesDependencies
}
export const executionDependencies: ExecutionDependencies = { queries: erpQueries, reserve: reserveExecution, finish: finishExecution, actions:actionDependencies }
function publicError(error: unknown): PluginError {
  if (error instanceof PluginError) return error
  if (error instanceof ErpDomainError && error.code === 'NOT_FOUND') return new PluginError('NOT_FOUND', error.message, 404)
  if(error instanceof ErpDomainError&&['INVALID_STATE','STALE_VERSION','IDEMPOTENCY_CONFLICT'].includes(error.code))return new PluginError(error.code,error.message,409)
  if (error instanceof ErpDomainError && error.code === 'VALIDATION_ERROR') {
    return new PluginError('NOT_FOUND', 'Registro nao disponivel nesta empresa.', 404)
  }
  if ((error as { code?: string })?.code === '57014') return new PluginError('TIMEOUT', 'A consulta excedeu o tempo limite.', 504)
  return new PluginError('ERP_UNAVAILABLE', 'Nao foi possivel concluir a consulta ao ERP.', 503)
}
export async function executeTool(principal: PluginPrincipal, name: string, raw: unknown, config: PluginConfig,
  deps: ExecutionDependencies = executionDependencies): Promise<CallToolResult> {
  const started = Date.now()
  let executionId: string | undefined
  try {
    const tool = tools.find(item => item.name === name)
    const action = actionTools.find(item => item.name === name)
    const presentation=name==='renderizar_card'
    const access = name === 'meu_acesso' || name === 'abrir_painel' || name === 'abrir_formulario'
    if (!tool && !action && !access && !presentation) throw new PluginError('UNKNOWN_TOOL', 'Ferramenta desconhecida.')
    const parsed = (presentation?cardSchema:tool?.schema || action?.schema || accessSchema).safeParse(raw)
    if (!parsed.success) throw new PluginError('INVALID_INPUT', 'Parametros invalidos. Consulte o esquema da ferramenta.')
    const input = parsed.data as Record<string, unknown>
    if (input.vencimento_inicio && input.vencimento_fim && String(input.vencimento_inicio) > String(input.vencimento_fim)) {
      throw new PluginError('INVALID_INPUT', 'O inicio do periodo deve ser anterior ao fim.')
    }
    if (input.inicio && input.fim && (String(input.inicio) > String(input.fim) || Date.parse(String(input.fim)) - Date.parse(String(input.inicio)) > 366 * 86400000)) {
      throw new PluginError('INVALID_INPUT','Informe um periodo de ate 366 dias, com inicio anterior ao fim.')
    }
    const companyChoice=presentation&&input.card==='selecao'&&input.consulta==='meu_acesso'
    const company = (access||companyChoice) && input.empresa_id === undefined ? null : selectCompany(principal,input.empresa_id as number | undefined)
    const capabilities = tool?.requiredCapabilities?.(input) || tool?.capabilities || action?.requiredCapabilities(input) || []
    const allowed = capabilities.every(capability => company?.capabilities.includes(capability))
    // Registre apenas metadados, nunca argumentos ou resultados com dados pessoais.
    executionId = await deps.reserve(principal,name,company?.id || null)
    if (!allowed) throw new PluginError('ACCESS_DENIED', 'Seu perfil nao permite esta consulta.', 403)
    if (action?.write && !principal.scopes.includes('erp:write')) throw new PluginError('INSUFFICIENT_SCOPE','A conexao precisa da permissao erp:write para preparar rascunhos.',403)
    let timer: ReturnType<typeof setTimeout> | undefined
    let data: unknown
    try {
      data = await Promise.race([
        presentation ? (async()=>{
          const card=input.card as keyof typeof cardSources,source=String(input.consulta)
          if(!(cardSources[card] as readonly string[]).includes(source))throw new PluginError('INVALID_INPUT','Consulta incompatível com este card.')
          const parameters=input.parametros as Record<string,unknown>
          const result=await executeTool(principal,source,{...parameters,...(company?{empresa_id:company.id}:{})},config,deps)
          if(result.isError){
            const failure=JSON.parse((result.content[0] as {text:string}).text)
            throw new PluginError(failure.code,failure.message)
          }
          return {card,consulta:source,parametros:parameters,empresa:company?{id:company.id,nome:company.name}:null,dados:result.structuredContent!.data}
        })() : access ? Promise.resolve({ usuario_id: principal.userId,
          empresas: principal.companies, empresa_selecionada: company?.id || null })
          : runWithErpDatabaseContext({ tenantId: company!.id, userId: principal.userId, readOnly: true, statementTimeoutMs: 10000 },
            () => action ? action.execute(deps.actions || actionDependencies,principal,company!.id,input,config) : tool!.execute(deps.queries,company!.id,input)),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new PluginError('TIMEOUT','A consulta excedeu o tempo limite.',504)),config.toolTimeoutMs) }),
      ])
    } finally { if (timer) clearTimeout(timer) }
    // Impedir respostas enormes e normalizar datas/decimais para transporte JSON.
    if(name==='obter_pdf_nota_servico'&&data&&typeof data==='object'&&'pdf_path' in data)data={...data,url:new URL(String(data.pdf_path),config.resource).href}
    const payload = { ok: true, execution_id: executionId, empresa_id: company?.id || null, data }
    const serialized = JSON.stringify(payload)
    if (Buffer.byteLength(serialized) > 128 * 1024) throw new PluginError('RESULT_TOO_LARGE', 'Refine os filtros para reduzir o resultado.')
    await deps.finish(executionId,'succeeded',null,Date.now()-started)
    return { content: [{ type:'text', text: serialized }], structuredContent: JSON.parse(serialized) }
  } catch (error) {
    const failure = publicError(error)
    if (!executionId) {
      executionId = await deps.reserve(principal,name.slice(0,100),null).catch(() => undefined)
    }
    if (executionId) await deps.finish(executionId,'failed',failure.code,Date.now()-started).catch(() => {
      console.error(JSON.stringify({ scope:'chatgptplugin', code:'AUDIT_UNAVAILABLE', executionId }))
    })
    return { isError: true, content: [{ type:'text', text: JSON.stringify({ ok:false,code:failure.code,message:failure.message,execution_id:executionId || null }) }],
      ...(failure.code === 'INSUFFICIENT_SCOPE' ? {_meta:{'mcp/www_authenticate':[`Bearer resource_metadata="${config.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope"`]}} : {}) }
  }
}
