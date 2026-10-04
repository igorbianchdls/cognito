import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createPluginServer } from './createServer'
import { getPluginConfig, type PluginConfig } from '../shared/config'
import { PluginError, type PluginPrincipal } from '../shared/contracts'
import { resolvePluginPrincipal } from '../auth/resolvePrincipal'
import { consumeRequestLimit } from '../audit/executionRepository'
import { executionDependencies, type ExecutionDependencies } from '../application/executeTool'
import { handleNativeForm } from '../extensions/nativeForm'
import { isModern,validateModern,requireNativeFormCapability,ProtocolFailure,MODERN_VERSION,SUPPORTED_VERSIONS,SERVER_INFO } from './modernProtocol'

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
    'Access-Control-Allow-Headers':'Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name',
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
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve,reject) => {
    timeout = setTimeout(() => {
      // Reject before cancellation can make an unfinished body look complete.
      reject(new PluginError('TIMEOUT','Corpo da requisicao incompleto.',408))
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
    catch {throw new PluginError('INVALID_JSON','JSON UTF-8 invalido.')}
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
  let rpcId:unknown=null
  let oauthScope:string|undefined
  try {
    config = deps.config()
    oauthScope=config.scope
    headers = cors(request,config)
    if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers })
    const principal = await deps.resolve(request,config)
    await deps.limit(principal,config.requestsPerMinute)
    if (request.method !== 'POST') return Response.json({error:'Use POST; este servidor nao mantem sessoes SSE.'},{ status:405,headers:{ ...headers,Allow:'POST, OPTIONS' } })
    let body:unknown
    try {body=await readBody(request)}
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
      if(rpc.method==='tools/call'&&rpc.params.name==='preparar_formulario_nativo') {
        oauthScope=config.scope+' erp:write'
        requireNativeFormCapability(capabilities)
        let result:Awaited<ReturnType<typeof handleNativeForm>>
        try {result=await handleNativeForm(rpc.params,rpc.id,principal,config,deps.execution)}
        catch(error){if(error instanceof PluginError&&error.status===400)throw new ProtocolFailure(-32602,error.message);throw error}
        return Response.json({jsonrpc:'2.0',id:rpc.id,result:{...result,_meta:{...('_meta' in result?result._meta:{}),'io.modelcontextprotocol/serverInfo':SERVER_INFO}}},{headers})
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
    const failure = error instanceof PluginError ? error : new PluginError('SERVICE_UNAVAILABLE','Servico temporariamente indisponivel.',503)
    console.error(JSON.stringify({ scope:'chatgptplugin',code:failure.code,status:failure.status }))
    if (config && ['UNAUTHENTICATED','INSUFFICIENT_SCOPE'].includes(failure.code)) {
      const oauthError = failure.code === 'INSUFFICIENT_SCOPE' ? 'insufficient_scope' : 'invalid_token'
      headers['WWW-Authenticate'] = `Bearer resource_metadata="${config.metadataUrl}", scope="${oauthScope||config.scope}", error="${oauthError}"`
    }
    if (failure.status === 429) headers['Retry-After'] = '60'
    return Response.json({ error:failure.code,message:failure.message },{ status:failure.status,headers })
  }
}
