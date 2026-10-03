import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createPluginServer } from './createServer'
import { getPluginConfig, type PluginConfig } from '../shared/config'
import { PluginError, type PluginPrincipal } from '../shared/contracts'
import { resolvePluginPrincipal } from '../auth/resolvePrincipal'
import { consumeRequestLimit } from '../audit/executionRepository'
import { executionDependencies, type ExecutionDependencies } from '../application/executeTool'

export type HttpDependencies = {
  config: () => PluginConfig
  resolve: (request: Request, config: PluginConfig) => Promise<PluginPrincipal>
  limit: typeof consumeRequestLimit
  execution: ExecutionDependencies
}
const production: HttpDependencies = { config:getPluginConfig, resolve:resolvePluginPrincipal, limit:consumeRequestLimit, execution:executionDependencies }
function cors(request: Request, config: PluginConfig) {
  const origin = request.headers.get('origin')
  if (origin && !config.origins.includes(origin)) throw new PluginError('ORIGIN_DENIED','Origem nao autorizada.',403)
  const url = new URL(request.url)
  if (url.host !== new URL(config.resource).host) throw new PluginError('HOST_DENIED','Host nao autorizado.',403)
  return { 'Cache-Control':'no-store', Vary:'Origin',
    ...(origin ? { 'Access-Control-Allow-Origin':origin } : {}),
    'Access-Control-Allow-Methods':'POST, GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':'Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id',
    'Access-Control-Expose-Headers':'WWW-Authenticate, MCP-Protocol-Version, Retry-After',
  }
}
async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new PluginError('INVALID_CONTENT_TYPE','Use application/json.',415)
  }
  if (!request.body) throw new PluginError('INVALID_INPUT','Corpo JSON obrigatorio.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  const timeout = setTimeout(() => { void reader.cancel() },5000)
  try {
    for (;;) {
      const { done,value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 64*1024) { await reader.cancel(); throw new PluginError('REQUEST_TOO_LARGE','Corpo excede 64 KB.',413) }
      chunks.push(value)
    }
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (Array.isArray(parsed)) throw new PluginError('INVALID_INPUT','Envie uma chamada por requisicao.')
    return parsed
  } catch (error) {
    if (error instanceof PluginError) throw error
    throw new PluginError('INVALID_INPUT','JSON invalido.')
  } finally { clearTimeout(timeout); reader.releaseLock() }
}
export async function handlePluginRequest(request: Request, deps: HttpDependencies = production): Promise<Response> {
  let config: PluginConfig | undefined
  let headers: Record<string,string> = { 'Cache-Control':'no-store' }
  try {
    config = deps.config()
    headers = cors(request,config)
    if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers })
    const principal = await deps.resolve(request,config)
    await deps.limit(principal,config.requestsPerMinute)
    if (request.method !== 'POST') return Response.json({error:'Use POST; este servidor nao mantem sessoes SSE.'},{ status:405,headers:{ ...headers,Allow:'POST, OPTIONS' } })
    const body = await readBody(request)
    const server = createPluginServer(principal,config,deps.execution)
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator:undefined,enableJsonResponse:true })
    try {
      await server.connect(transport)
      const response = await transport.handleRequest(request,{ parsedBody:body })
      const content = await response.text()
      let result: unknown = content
      if (content && response.headers.get('content-type')?.includes('application/json')) {
        const parsed = JSON.parse(content)
        // SDK preserva securitySchemes em _meta; anuncie tambem no descritor publico.
        if (parsed.result?.tools) for (const tool of parsed.result.tools) {
          tool.securitySchemes = [{ type:'oauth2',scopes:[config.scope] }]
        }
        result = JSON.stringify(parsed)
      }
      const finalHeaders = new Headers(response.headers)
      for (const [key,value] of Object.entries(headers)) finalHeaders.set(key,value)
      return new Response(response.status === 204 ? null : String(result),{ status:response.status,headers:finalHeaders })
    } finally { await server.close() }
  } catch (error) {
    const failure = error instanceof PluginError ? error : new PluginError('SERVICE_UNAVAILABLE','Servico temporariamente indisponivel.',503)
    console.error(JSON.stringify({ scope:'chatgptplugin',code:failure.code,status:failure.status }))
    if (config && ['UNAUTHENTICATED','INSUFFICIENT_SCOPE'].includes(failure.code)) {
      const oauthError = failure.code === 'INSUFFICIENT_SCOPE' ? 'insufficient_scope' : 'invalid_token'
      headers['WWW-Authenticate'] = `Bearer resource_metadata="${config.metadataUrl}", scope="${config.scope}", error="${oauthError}"`
    }
    if (failure.status === 429) headers['Retry-After'] = '60'
    return Response.json({ error:failure.code,message:failure.message },{ status:failure.status,headers })
  }
}

