import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handleClaudeRequest } from '../src/products/claudeplugin/mcp/handleRequest'
import { CARDS_URI, claudeUiDomain } from '../src/products/claudeplugin/mcp/createServer'
import { getClaudePluginConfig } from '../src/products/claudeplugin/shared/config'
import { resourceMetadata } from '../src/products/claudeplugin/auth/resourceMetadata'
import type { HttpDependencies } from '../src/products/mcpcore/mcp/http'
import { validateOAuthToken } from '../src/products/mcpcore/auth/resolvePrincipal'
import { PluginError, type PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import type { ExecutionDependencies } from '../src/products/mcpcore/application/executeTool'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'

const settings: PluginConfig = {integration:'claude',resource:'https://erp.example.invalid/api/claude/mcp',
  metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/claude/mcp',issuer:'https://test.clerk.accounts.dev',
  scope:'erp:read',clientIds:['*'],origins:['https://erp.example.invalid','https://claude.ai'],toolTimeoutMs:1000,requestsPerMinute:60}
const principal: PluginPrincipal = {userId:1,clerkUserId:'user_1',clientId:'dcr_client_1',scopes:['erp:read','erp:write'],
  companies:[{id:1,name:'Empresa um',profile:'administrador',capabilities:[...ERP_CAPABILITIES]}]}
const audit: {tool:string;integration:string}[] = []
const limits: string[] = []
const writes: {step:string;integration:string}[] = []
const draft = {rascunho_id:randomUUID(),empresa_id:1,status:'pending',registro_id:null,alvo:null,criado_em:new Date().toISOString(),
  expira_em:new Date().toISOString(),proposta:{tipo:'cliente',dados:{nome:'Cliente',tipo:'fisica'}},referencias:null}
const execution: ExecutionDependencies = {
  reserve:async(_p,tool,_c,integration)=>{audit.push({tool,integration});return randomUUID()},
  finish:async()=>undefined,
  queries:({
    overview:async()=>({saldoReceber:1,saldoPagar:2,receberVencido:0,vendasRascunho:3,comprasAbertas:4,clientesAtivos:5}),
    page:async(_id:number,_type:string,input:{page?:number;pageSize?:number})=>({records:[{id:'1',nome:'Produto'}],total:1,page:input.page||1,pageSize:input.pageSize||20}),
  } as Partial<ExecutionDependencies['queries']>) as ExecutionDependencies['queries'],
  actions:{
    prepare:async(_p,_c,_k,_proposal,config)=>{writes.push({step:'prepare',integration:config.integration});return draft as never},
    execute:async(_p,_c,_id,_kinds,_tool,config)=>{writes.push({step:'execute',integration:config.integration});return {...draft,status:'saved',registro_id:'7'} as never},
  },
}
const deps: HttpDependencies = {config:()=>settings,execution,
  limit:async(_p,_max,integration)=>{limits.push(integration)},
  resolve:async request=>{
    if (request.headers.get('authorization')!=='Bearer test') throw new PluginError('UNAUTHENTICATED','Conecte.',401)
    return principal
  }}
async function rpc(method: string, params: unknown = {}, headers: Record<string,string> = {}, token = 'Bearer test') {
  const response = await handleClaudeRequest(new Request(settings.resource,{method:'POST',
    headers:{...(token?{authorization:token}:{}),'content-type':'application/json',accept:'application/json, text/event-stream',...headers},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),deps)
  const text = await response.text()
  return {response,body:text?JSON.parse(text):null}
}
const checks: string[] = []
async function check(name: string, fn: () => unknown) { await fn(); checks.push(name); console.log('Passed:',name) }

const writeNames = ['criar_cadastro','editar_cadastro','excluir_cadastro','criar_venda','editar_venda','excluir_venda','converter_orcamento','registrar_devolucao','confirmar_venda','cancelar_venda','atender_venda',
  'criar_compra','editar_compra','excluir_compra','confirmar_compra','cancelar_compra','criar_titulo','editar_titulo','excluir_titulo','efetivar_previsao','registrar_baixa','estornar_pagamento']

async function main() {
  await check('Inicializacao com nome e instrucoes do Claude',async()=>{
    const {response,body}=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'claude-ai',version:'1'}})
    assert.equal(response.status,200);assert.equal(body.result.serverInfo.name,'cognito-claudeplugin')
    assert.match(body.result.instructions,/meu_acesso/);assert.match(body.result.instructions,/rascunho_id/)
  })
  await check('Catalogo: 15 consultas e 21 escritas com anotacoes do Claude',async()=>{
    const {body}=await rpc('tools/list')
    type Listed={name:string;title?:string;description:string;annotations:Record<string,boolean>;outputSchema?:object;_meta?:{ui?:{resourceUri?:string}}}
    const listed=body.result.tools as Listed[]
    assert.equal(listed.length,38)
    for (const absent of ['abrir_painel','ler_configuracoes','atualizar_configuracoes','search_mentions']) assert(!listed.some(t=>t.name===absent),absent)
    for (const tool of listed) {
      const write=writeNames.includes(tool.name)
      assert(tool.name.length<=64&&/^[a-z_]+$/.test(tool.name),tool.name)
      assert(tool.title&&tool.title.length>0,`title ${tool.name}`)
      assert(tool.outputSchema,`output ${tool.name}`)
      // Claude: toda escrita é destrutiva (pede permissão); leituras são somente leitura.
      assert.equal(tool.annotations.readOnlyHint,!write,tool.name)
      assert.equal(tool.annotations.destructiveHint,write,tool.name)
      assert.equal(tool.annotations.openWorldHint,false,tool.name)
      assert.equal(tool._meta?.ui?.resourceUri,CARDS_URI,tool.name)
    }
    assert.equal(listed.filter(t=>writeNames.includes(t.name)).length,22)
    const text=JSON.stringify(body)
    assert(!text.includes('openai/'),'sem chaves da OpenAI');assert(!text.includes('securitySchemes'),'sem securitySchemes')
    assert.match(listed.find(t=>t.name==='registrar_baixa')!.description,/não movimenta dinheiro/)
  })
  await check('Recurso dos cards com ui.domain do Claude',async()=>{
    assert.equal(claudeUiDomain('https://example.com/mcp'),'c3d80a4ed901ee05b21755a88273b4a4.claudemcpcontent.com')
    const resources=(await rpc('resources/list')).body.result.resources as {uri:string}[]
    assert.deepEqual(resources.map(r=>r.uri),[CARDS_URI])
    const content=(await rpc('resources/read',{uri:CARDS_URI})).body.result.contents[0]
    assert.equal(content.mimeType,'text/html;profile=mcp-app')
    assert.deepEqual(content._meta.ui,{prefersBorder:true,domain:claudeUiDomain(settings.resource),csp:{connectDomains:[],resourceDomains:[]}})
    assert(content.text.includes('"claudeplugin-cards"'));assert(!content.text.includes('chatgptplugin'));assert(!content.text.includes(principal.clerkUserId))
  })
  await check('Sem token: 401 com metadados do recurso do Claude',async()=>{
    const {response}=await rpc('tools/list',{},{},'')
    assert.equal(response.status,401)
    assert.equal(response.headers.get('www-authenticate'),`Bearer resource_metadata="${settings.metadataUrl}", scope="erp:read", error="invalid_token"`)
  })
  await check('Origem e host',async()=>{
    assert.equal((await rpc('tools/list',{},{origin:'https://claude.ai'})).response.status,200)
    assert.equal((await rpc('tools/list',{},{origin:'https://chatgpt.com'})).response.status,403)
    const other=await handleClaudeRequest(new Request('https://outro.example/api/claude/mcp',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:'{}'}),deps)
    assert.equal(other.status,403)
    const get=await handleClaudeRequest(new Request(settings.resource,{headers:{authorization:'Bearer test'}}),deps)
    assert.equal(get.status,405)
  })
  await check('Consultas auditadas e limitadas como integracao claude',async()=>{
    audit.length=0;limits.length=0
    for (const [name,args] of [['meu_acesso',{}],['resumo_erp',{}],['buscar_cadastros',{tipo:'produtos'}]] as const) {
      const {body}=await rpc('tools/call',{name,arguments:args})
      assert(!body.result.isError,JSON.stringify(body));assert.equal(body.result.structuredContent.ok,true);assert.equal(body.result._meta['cognito/tool'],name)
    }
    assert.deepEqual(audit.map(a=>a.integration),['claude','claude','claude']);assert(limits.length>=3&&limits.every(i=>i==='claude'))
  })
  await check('Escrita em duas etapas usa a configuracao do Claude',async()=>{
    writes.length=0
    const preview=(await rpc('tools/call',{name:'criar_cadastro',arguments:{chave_operacao:randomUUID(),tipo:'cliente',dados:{nome:'Cliente',tipo:'fisica'}}})).body.result
    assert(!preview.isError,JSON.stringify(preview));assert.equal(preview.structuredContent.data.etapa,'previa')
    assert.equal(preview.structuredContent.data.revisao_url,undefined)
    const saved=(await rpc('tools/call',{name:'criar_cadastro',arguments:{empresa_id:1,rascunho_id:draft.rascunho_id}})).body.result
    assert(!saved.isError,JSON.stringify(saved));assert.equal(saved.structuredContent.data.status,'saved')
    assert.deepEqual(writes,[{step:'prepare',integration:'claude'},{step:'execute',integration:'claude'}])
  })
  await check('Dados faltando devolvem campos para o modelo perguntar',async()=>{
    const result=(await rpc('tools/call',{name:'criar_cadastro',arguments:{chave_operacao:randomUUID(),tipo:'cliente',dados:{}}})).body.result
    assert.equal(result.isError,true)
    const error=JSON.parse(result.content[0].text);assert(Array.isArray(error.campos)&&error.campos.length>0,JSON.stringify(error))
  })
  await check('Token: audiencia do ChatGPT recusada; * exige client_id',()=>{
    const token={subject:'user_1',clientId:'dcr_client_9',scopes:['erp:read'],revoked:false,expired:false,expiration:Date.now()+3600000,issuer:settings.issuer,audience:settings.resource}
    validateOAuthToken(token,settings)
    assert.throws(()=>validateOAuthToken({...token,audience:'https://erp.example.invalid/api/mcp'},settings),PluginError)
    assert.throws(()=>validateOAuthToken({...token,clientId:''},settings),PluginError)
    assert.throws(()=>validateOAuthToken(token,{...settings,clientIds:['outro']}),PluginError)
  })
  await check('Configuracao e metadados do recurso',async()=>{
    const saved={...process.env}
    try {
      for (const key of ['CLAUDEPLUGIN_BASE_URL','CLAUDEPLUGIN_OAUTH_ISSUER','CLAUDEPLUGIN_OAUTH_CLIENT_IDS','CLAUDEPLUGIN_ALLOWED_ORIGINS']) delete process.env[key]
      assert.throws(()=>getClaudePluginConfig(),(e:PluginError)=>e.code==='CONFIGURATION_REQUIRED')
      Object.assign(process.env,{CLAUDEPLUGIN_BASE_URL:'https://erp.example',CLAUDEPLUGIN_OAUTH_ISSUER:'https://test.clerk.accounts.dev',CLAUDEPLUGIN_OAUTH_CLIENT_IDS:'*'})
      const config=getClaudePluginConfig()
      assert.equal(config.integration,'claude');assert.equal(config.resource,'https://erp.example/api/claude/mcp')
      assert.equal(config.metadataUrl,'https://erp.example/.well-known/oauth-protected-resource/api/claude/mcp')
      assert(config.origins.includes('https://claude.ai'));assert.equal(config.nativeFormKey,undefined)
      const metadata=await resourceMetadata().json()
      assert.deepEqual(metadata,{resource:'https://erp.example/api/claude/mcp',authorization_servers:['https://test.clerk.accounts.dev'],
        scopes_supported:['erp:read','erp:write'],bearer_methods_supported:['header'],resource_name:'Cognito ERP'})
    } finally { process.env=saved }
  })
  await check('Cliente MCP oficial (como o Claude) conecta, lista, chama e lê o card',async()=>{
    // Substitui o MCP Inspector localmente: o cliente do SDK negocia a versão e usa Streamable HTTP sem sessão.
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js')
    const fetchClaude = async (input: string | URL | Request, init?: RequestInit) =>
      handleClaudeRequest(new Request(input instanceof Request ? input.url : String(input),{...init,headers:{...Object.fromEntries(new Headers(init?.headers)),authorization:'Bearer test'}}),deps)
    const client = new Client({ name:'claude-ai', version:'1.0.0' })
    await client.connect(new StreamableHTTPClientTransport(new URL(settings.resource),{ fetch:fetchClaude }))
    assert.equal(client.getServerVersion()?.name,'cognito-claudeplugin');assert.match(client.getInstructions()||'',/meu_acesso/)
    const listed = await client.listTools()
    assert.equal(listed.tools.length,38)
    const access = await client.callTool({ name:'meu_acesso',arguments:{} })
    assert.equal(access.isError,undefined);assert.equal((access.structuredContent as {ok:boolean}).ok,true)
    const card = await client.readResource({ uri:CARDS_URI })
    assert.equal(card.contents[0].mimeType,'text/html;profile=mcp-app')
    const denied = await client.callTool({ name:'criar_cadastro',arguments:{ chave_operacao:randomUUID(),tipo:'cliente',dados:{} } })
    assert.equal(denied.isError,true)
    await client.close()
  })
  console.log(JSON.stringify({status:'passed',checks:checks.length,tools:38,realClaude:false,realDatabaseAccess:false}))
}
void main().catch(error=>{console.error(error);process.exitCode=1})
