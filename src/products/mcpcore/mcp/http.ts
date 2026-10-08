import { PluginError, type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import type { consumeRequestLimit } from '../audit/executionRepository'
import type { ExecutionDependencies } from '../application/executeTool'

// Partes do transporte HTTP iguais em todos os chats: origem, host, corpo e cabeçalho OAuth.
export type HttpDependencies = {
  config: () => PluginConfig
  resolve: (request: Request, config: PluginConfig) => Promise<PluginPrincipal>
  limit: typeof consumeRequestLimit
  execution: ExecutionDependencies
}
export function corsHeaders(request: Request, config: PluginConfig): Record<string,string> {
  const origin = request.headers.get('origin')
  if (origin && !config.origins.includes(origin)) throw new PluginError('ORIGIN_DENIED','Origem não autorizada.',403)
  const url = new URL(request.url)
  if (url.host !== new URL(config.resource).host) throw new PluginError('HOST_DENIED','Host não autorizado.',403)
  return { 'Cache-Control':'no-store', Vary:'Origin',
    ...(origin ? { 'Access-Control-Allow-Origin':origin } : {}),
    'Access-Control-Allow-Methods':'POST, GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':'Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name',
    'Access-Control-Expose-Headers':'WWW-Authenticate, MCP-Protocol-Version, Retry-After',
  }
}
export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new PluginError('INVALID_CONTENT_TYPE','Use application/json.',415)
  }
  if (!request.body) throw new PluginError('INVALID_INPUT','Corpo JSON obrigatório.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve,reject) => {
    timeout = setTimeout(() => {
      // Reject before cancellation can make an unfinished body look complete.
      reject(new PluginError('TIMEOUT','Corpo da requisição incompleto.',408))
      void reader.cancel().catch(() => undefined)
    },5000)
  })
  try {
    for (;;) {
      const { done,value } = await Promise.race([reader.read(),deadline])
      if (done) break
      size += value.byteLength
      if (size > 64*1024) { void reader.cancel().catch(() => undefined); throw new PluginError('REQUEST_TOO_LARGE','Corpo excede 64 KB.',413) }
      chunks.push(value)
    }
    let parsed:unknown
    try {parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)))}
    catch {throw new PluginError('INVALID_JSON','JSON UTF-8 inválido.')}
    if (Array.isArray(parsed)) throw new PluginError('INVALID_INPUT','Envie uma chamada por requisição.')
    return parsed
  } catch (error) {
    if (error instanceof PluginError) throw error
    throw new PluginError('INVALID_INPUT','JSON inválido.')
  } finally { clearTimeout(timeout); reader.releaseLock() }
}
// 401 e 403 de escopo apontam para os metadados do recurso, como pedem os clientes OAuth do MCP.
export function oauthChallenge(failure: PluginError, config: PluginConfig, scope = config.scope): string | undefined {
  if (!['UNAUTHENTICATED','INSUFFICIENT_SCOPE'].includes(failure.code)) return undefined
  const oauthError = failure.code === 'INSUFFICIENT_SCOPE' ? 'insufficient_scope' : 'invalid_token'
  return `Bearer resource_metadata="${config.metadataUrl}", scope="${scope}", error="${oauthError}"`
}
