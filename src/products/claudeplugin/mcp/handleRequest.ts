import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { PluginError } from '@/products/mcpcore/shared/contracts'
import type { PluginConfig } from '@/products/mcpcore/shared/config'
import { resolvePluginPrincipal } from '@/products/mcpcore/auth/resolvePrincipal'
import { consumeRequestLimit } from '@/products/mcpcore/audit/executionRepository'
import { executionDependencies } from '@/products/mcpcore/application/executeTool'
import { actionTools } from '@/products/mcpcore/actions/catalog'
import { corsHeaders, readJsonBody, oauthChallenge, type HttpDependencies } from '@/products/mcpcore/mcp/http'
import { getClaudePluginConfig } from '../shared/config'
import { createClaudeServer } from './createServer'

const production: HttpDependencies = { config:getClaudePluginConfig, resolve:resolvePluginPrincipal, limit:consumeRequestLimit, execution:executionDependencies }
// Streamable HTTP sem sessão, nas versões estáveis do MCP negociadas pelo SDK. O Claude não usa
// formulários MRTR nem extensões da OpenAI: quando faltam dados, a tool devolve os campos.
export async function handleClaudeRequest(request: Request, deps: HttpDependencies = production): Promise<Response> {
  let config: PluginConfig | undefined
  let headers: Record<string,string> = { 'Cache-Control':'no-store' }
  let scope: string | undefined
  try {
    config = deps.config()
    // O Claude pede no login exatamente o escopo do desafio: anuncie leitura e escrita para que as
    // tools de escrita funcionem (cada chamada continua exigindo aprovação do usuário e prévia).
    scope = `${config.scope} erp:write`
    headers = corsHeaders(request,config)
    if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers })
    // 401 antes do SDK: é o que inicia o login no Claude.
    const principal = await deps.resolve(request,config)
    await deps.limit(principal,config.requestsPerMinute,config.integration)
    if (request.method !== 'POST') return Response.json({error:'Use POST; este servidor não mantém sessões SSE.'},{ status:405,headers:{ ...headers,Allow:'POST, OPTIONS' } })
    const body = await readJsonBody(request)
    const call = body as { method?: string; params?: { name?: unknown } }
    // Token antigo só com leitura: 403 com desafio em HTTP (step-up), que é o que faz o Claude reautenticar;
    // o erro dentro do resultado da tool não dispara um novo login.
    if (call?.method === 'tools/call' && actionTools.some(tool => tool.name === call.params?.name) && !principal.scopes.includes('erp:write'))
      throw new PluginError('INSUFFICIENT_SCOPE','Reconecte o Cognito ERP com permissão de escrita.',403)
    const server = await createClaudeServer(principal,config,deps.execution)
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator:undefined,enableJsonResponse:true })
    try {
      await server.connect(transport)
      const response = await transport.handleRequest(request,{ parsedBody:body })
      const finalHeaders = new Headers(response.headers)
      for (const [key,value] of Object.entries(headers)) finalHeaders.set(key,value)
      return new Response(response.status === 204 ? null : await response.text(),{ status:response.status,headers:finalHeaders })
    } finally { await server.close() }
  } catch (error) {
    const failure = error instanceof PluginError ? error : new PluginError('SERVICE_UNAVAILABLE','Serviço temporariamente indisponível.',503)
    console.error(JSON.stringify({ scope:'claudeplugin',code:failure.code,status:failure.status,...(failure.reason?{reason:failure.reason}:{}) }))
    const challenge = config && oauthChallenge(failure,config,scope)
    if (challenge) headers['WWW-Authenticate'] = challenge
    if (failure.status === 429) headers['Retry-After'] = '60'
    return Response.json({ error:failure.code,message:failure.message },{ status:failure.status,headers })
  }
}
