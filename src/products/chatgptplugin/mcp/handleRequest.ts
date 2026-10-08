import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createPluginServer } from './createServer'
import { getPluginConfig, type PluginConfig } from '../shared/config'
import { PluginError } from '@/products/mcpcore/shared/contracts'
import { resolvePluginPrincipal } from '@/products/mcpcore/auth/resolvePrincipal'
import { consumeRequestLimit } from '@/products/mcpcore/audit/executionRepository'
import { executionDependencies } from '@/products/mcpcore/application/executeTool'
import { corsHeaders, readJsonBody, oauthChallenge, type HttpDependencies } from '@/products/mcpcore/mcp/http'
import { nativeFormStep } from '../extensions/nativeForm'
import { actionTools } from '@/products/mcpcore/actions/catalog'
import { isModern,validateModern,requireNativeFormCapability,supportsNativeForms,ProtocolFailure,MODERN_VERSION,SUPPORTED_VERSIONS,SERVER_INFO } from './modernProtocol'

export type { HttpDependencies } from '@/products/mcpcore/mcp/http'
const production: HttpDependencies = { config:getPluginConfig, resolve:resolvePluginPrincipal, limit:consumeRequestLimit, execution:executionDependencies }
export async function handlePluginRequest(request: Request, deps: HttpDependencies = production): Promise<Response> {
  let config: PluginConfig | undefined
  let headers: Record<string,string> = { 'Cache-Control':'no-store' }
  let rpcId:unknown=null
  let oauthScope:string|undefined
  try {
    config = deps.config()
    oauthScope=config.scope
    headers = corsHeaders(request,config)
    if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers })
    const principal = await deps.resolve(request,config)
    await deps.limit(principal,config.requestsPerMinute,config.integration)
    if (request.method !== 'POST') return Response.json({error:'Use POST; este servidor não mantém sessões SSE.'},{ status:405,headers:{ ...headers,Allow:'POST, OPTIONS' } })
    let body:unknown
    try {body=await readJsonBody(request)}
    catch(error) {
      if(isModern(request,null)&&error instanceof PluginError&&['INVALID_JSON','INVALID_INPUT'].includes(error.code))
        throw new ProtocolFailure(error.code==='INVALID_JSON'?-32700:-32600,error.message)
      throw error
    }
    rpcId=(body as {id?:unknown})?.id??null
    const modern=isModern(request,body)
    const modernRequest=modern?validateModern(request,body):undefined
    if(modernRequest) {
      headers['MCP-Protocol-Version']=MODERN_VERSION
      const {rpc,capabilities}=modernRequest
      if(rpc.method==='tools/call') {
        const continuing=rpc.params.requestState!==undefined||rpc.params.inputResponses!==undefined
        if(actionTools.some(tool=>tool.name===rpc.params.name))oauthScope=config.scope+' erp:write'
        if(continuing)requireNativeFormCapability(capabilities)
        if(supportsNativeForms(capabilities)) {
          let step:Awaited<ReturnType<typeof nativeFormStep>>
          try {step=await nativeFormStep(rpc.params,rpc.id,principal,config,deps.execution)}
          catch(error){if(error instanceof PluginError&&error.status===400)throw new ProtocolFailure(-32602,error.message);throw error}
          if(step)return Response.json({jsonrpc:'2.0',id:rpc.id,result:{...step,_meta:{...('_meta' in step?step._meta:{}),'io.modelcontextprotocol/serverInfo':SERVER_INFO}}},{headers})
        }
      }
      if(rpc.params.requestState!==undefined||rpc.params.inputResponses!==undefined)throw new ProtocolFailure(-32602,'Esta chamada não aceita continuidade de formulário.')
      // Discovery uses the SDK's actual registrations. The translation is local;
      // no initialize request is required or emitted to the modern client.
      body=rpc.method==='server/discover'?{jsonrpc:'2.0',id:rpc.id,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'modern-adapter',version:'1'}}}:rpc
      if(rpc.method==='initialize')throw new ProtocolFailure(-32601,'Use server/discover nesta versão.',404)
      const sdkHeaders=new Headers(request.headers);sdkHeaders.set('mcp-protocol-version','2025-11-25')
      request=new Request(request.url,{method:'POST',headers:sdkHeaders,body:JSON.stringify(body)})
    }
    const server = await createPluginServer(principal,config,deps.execution)
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator:undefined,enableJsonResponse:true })
    try {
      await server.connect(transport)
      const response = await transport.handleRequest(request,{ parsedBody:body })
      const content = await response.text()
      let result: unknown = content
      let status=response.status
      if (content && response.headers.get('content-type')?.includes('application/json')) {
        const parsed = JSON.parse(content)
        if(modernRequest&&parsed.error?.code===-32601)status=404
        if(modernRequest&&parsed.result) {
          if(modernRequest.rpc.method==='server/discover') {
            const {capabilities,instructions}=parsed.result
            // This endpoint has no subscriptions or change notifications.
            if(capabilities.tools)capabilities.tools={}
            if(capabilities.resources)capabilities.resources={}
            parsed.result={supportedVersions:SUPPORTED_VERSIONS,capabilities,instructions}
          }
          parsed.result.resultType='complete'
          parsed.result._meta={...parsed.result._meta,'io.modelcontextprotocol/serverInfo':SERVER_INFO}
        }
        // SDK preserva securitySchemes em _meta; anuncie tambem no descritor publico.
        if (parsed.result?.tools) for (const tool of parsed.result.tools) {
          tool.securitySchemes = tool._meta?.securitySchemes || [{ type:'oauth2',scopes:[config.scope] }]
        }
        result = JSON.stringify(parsed)
      }
      const finalHeaders = new Headers(response.headers)
      for (const [key,value] of Object.entries(headers)) finalHeaders.set(key,value)
      return new Response(response.status === 204 ? null : String(result),{ status,headers:finalHeaders })
    } finally { await server.close() }
  } catch (error) {
    if(error instanceof ProtocolFailure)return Response.json({jsonrpc:'2.0',id:rpcId,error:{code:error.code,message:error.message,...(error.data?{data:error.data}:{})}},{status:error.status,headers})
    const failure = error instanceof PluginError ? error : new PluginError('SERVICE_UNAVAILABLE','Serviço temporariamente indisponível.',503)
    console.error(JSON.stringify({ scope:'chatgptplugin',code:failure.code,status:failure.status,...(failure.reason?{reason:failure.reason}:{}) }))
    const challenge = config && oauthChallenge(failure,config,oauthScope||config.scope)
    if (challenge) headers['WWW-Authenticate'] = challenge
    if (failure.status === 429) headers['Retry-After'] = '60'
    return Response.json({ error:failure.code,message:failure.message },{ status:failure.status,headers })
  }
}
