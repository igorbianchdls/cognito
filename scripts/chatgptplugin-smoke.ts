import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handlePluginRequest, type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
import { resolvePluginPrincipal, validateOAuthToken } from '../src/products/chatgptplugin/auth/resolvePrincipal'
import { PluginError, selectCompany, type PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import { getErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { assertErpTenantScopedQuery } from '../src/lib/postgres'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import { executeTool, type ExecutionDependencies } from '../src/products/chatgptplugin/application/executeTool'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'

const settings: PluginConfig = {resource:'http://localhost:3187/api/mcp',metadataUrl:'http://localhost:3187/.well-known/oauth-protected-resource/api/mcp',
  issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['client_test'],origins:['http://localhost:3187','https://chatgpt.com'],toolTimeoutMs:100,requestsPerMinute:60}
const principal: PluginPrincipal = {userId:1,clerkUserId:'user_1',clientId:'client_test',scopes:['erp:read'],
  companies:[{id:1,name:'Empresa um',profile:'administrador',capabilities:[...ERP_CAPABILITIES]}]}
const events: {id:string;status:string;code?:string | null}[] = []
const calls: {company:number;user:number}[] = []
function context(company: number) {
  const current = getErpDatabaseContext()
  assert.equal(current?.tenantId,company); assert.equal(current?.userId,1)
  assert.equal(current?.readOnly,true); assert.equal(current?.statementTimeoutMs,10000)
  assertErpTenantScopedQuery('SELECT * FROM erp.entidades WHERE tenant_id = $1',[company])
  assert.throws(() => assertErpTenantScopedQuery('SELECT * FROM erp.entidades WHERE tenant_id = $1',[company+10]))
  calls.push({company,user:current!.userId})
}
const execution: ExecutionDependencies = {
  reserve:async () => {const id=randomUUID();events.push({id,status:'running'});return id},
  finish:async (id,status,code) => {events.push({id,status,code})},
  queries:{
    overview:async id => {context(id);return {saldoReceber:1,saldoPagar:2,receberVencido:0,vendasRascunho:3,comprasAbertas:4,clientesAtivos:5}},
    page:async (id,_type,input) => {context(id);return {records:[{id:'1',nome:'Produto'}],total:1,page:input.page || 1,pageSize:input.pageSize || 20}},
    sale:async (id,saleId) => {context(id);return {sale:{id:saleId},items:[],totalItems:0,itemsTruncated:false}},
    stock:async (id,input) => {context(id);return {records:[],total:0,page:input.page || 1,pageSize:input.pageSize || 20}},
  },
}
let checked = 0
async function check(_name: string,fn: () => unknown) {await fn();checked++}
const dependencies: HttpDependencies = {config:() => settings,execution,limit:async () => undefined,
  resolve:async request => {
    if (request.headers.get('authorization') !== 'Bearer test') throw new PluginError('UNAUTHENTICATED','Conecte.',401)
    return principal
  }}
async function rpc(method: string,params: unknown = {},deps=dependencies,extra: Record<string,string> = {}) {
  const response = await handlePluginRequest(new Request(settings.resource,{method:'POST',
    headers:{authorization:'Bearer test','content-type':'application/json',accept:'application/json, text/event-stream',...extra},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),deps)
  return {response,body:await response.json()}
}
async function main() {
  await check('OAuth valido em segundos e milissegundos',() => {
    for (const expiration of [Math.floor(Date.now()/1000)+3600,Date.now()+3600000]) {
      validateOAuthToken({subject:'user_1',clientId:'client_test',scopes:['erp:read'],revoked:false,expired:false,expiration},settings)
    }
  })
  await check('OAuth invalido revogado expirado scope audience',() => {
    const token={subject:'user_1',clientId:'client_test',scopes:['erp:read'],revoked:false,expired:false,expiration:Date.now()+3600000}
    for (const overrides of [{revoked:true},{expired:true},{expiration:1},{scopes:[]},{clientId:'another'},{subject:'org_1'}]) {
      assert.throws(() => validateOAuthToken({...token,...overrides},settings),PluginError)
    }
  })
  await check('Cookies nao substituem OAuth',async () => {
    await assert.rejects(resolvePluginPrincipal(new Request(settings.resource,{headers:{cookie:'session=anything'}}),settings),e => e instanceof PluginError && e.status===401)
  })
  await check('Inicializacao real do SDK',async () => {
    const {response,body}=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'smoke',version:'1'}})
    assert.equal(response.status,200);assert.equal(body.result.serverInfo.name,'cognito-chatgptplugin')
  })
  await check('Catalogo contratos OAuth e anotacoes',async () => {
    const {body}=await rpc('tools/list')
    assert.equal(body.result.tools.length,7)
    for (const tool of body.result.tools) {assert.equal(tool.annotations.readOnlyHint,true);assert.equal(tool.securitySchemes[0].type,'oauth2');assert(tool.outputSchema)}
  })
  for (const [name,args] of [['meu_acesso',{}],['resumo_erp',{}],['buscar_cadastros',{tipo:'produtos'}],['listar_vendas',{}],['obter_venda',{venda_id:1}],['consultar_financeiro',{tipo:'pagar'}],['consultar_estoque',{}]] as const) {
    await check(name,async () => {const {body}=await rpc('tools/call',{name,arguments:args});assert(!body.result?.isError,JSON.stringify(body));assert.equal(body.result.structuredContent.ok,true)})
  }
  await check('Empresa externa e perfil sem permissao',async () => {
    const before=calls.length
    const denied=await executeTool(principal,'listar_vendas',{empresa_id:999},settings,execution)
    assert.equal(denied.isError,true)
    const restricted={...principal,companies:[{...principal.companies[0],capabilities:[]}]}
    assert.equal((await executeTool(restricted,'resumo_erp',{},settings,execution)).isError,true)
    assert.equal(calls.length,before)
  })
  await check('Multiplas empresas exigem escolha e contexto concorrente isolado',async () => {
    const multi={...principal,companies:[...principal.companies,{...principal.companies[0],id:2}]}
    assert.throws(() => selectCompany(multi))
    const results=await Promise.all([1,2].map(empresa_id => executeTool(multi,'listar_vendas',{empresa_id},settings,execution)))
    assert(results.every(r => !r.isError));assert.equal(getErpDatabaseContext(),null)
  })
  await check('Validacao de campos desconhecidos limites datas',async () => {
    for (const args of [{tenant_id:2},{por_pagina:100},{pagina:0}]) assert.equal((await executeTool(principal,'listar_vendas',args,settings,execution)).isError,true)
    assert.equal((await executeTool(principal,'consultar_financeiro',{tipo:'pagar',vencimento_inicio:'2026-02-31'},settings,execution)).isError,true)
    assert.equal((await executeTool(principal,'consultar_financeiro',{tipo:'pagar',vencimento_inicio:'2026-02-20',vencimento_fim:'2026-02-01'},settings,execution)).isError,true)
    const invalid=await rpc('tools/call',{name:'listar_vendas',arguments:{por_pagina:100}});assert(invalid.body.result?.isError || invalid.body.error)
  })
  await check('Auditoria indisponivel bloqueia consulta',async () => {
    const before=calls.length
    const result=await executeTool(principal,'listar_vendas',{},settings,{...execution,reserve:async () => {throw new Error('database secret')}})
    assert.equal(result.isError,true);assert.equal(calls.length,before);assert(!JSON.stringify(result).includes('secret'))
  })
  await check('Tempo limite de consulta',async () => {
    const result=await executeTool(principal,'resumo_erp',{}, {...settings,toolTimeoutMs:5},{...execution,queries:{...execution.queries,overview:async () => new Promise(() => {})}})
    assert.equal(result.isError,true);assert(JSON.stringify(result).includes('TIMEOUT'))
  })
  await check('401 com descoberta e 429',async () => {
    const unauth=await rpc('tools/list',{},dependencies,{authorization:''});assert.equal(unauth.response.status,401);assert(unauth.response.headers.get('www-authenticate')?.includes(settings.metadataUrl))
    const limited=await rpc('tools/list',{}, {...dependencies,limit:async () => {throw new PluginError('RATE_LIMITED','Limite',429)}})
    assert.equal(limited.response.status,429);assert.equal(limited.response.headers.get('retry-after'),'60')
  })
  await check('Origem externa batch corpo excessivo e GET stateless',async () => {
    assert.equal((await rpc('tools/list',{},dependencies,{origin:'https://evil.test'})).response.status,403)
    for(const [body,status] of [[JSON.stringify([{jsonrpc:'2.0',id:1,method:'tools/list'}]),400],['x'.repeat(65537),413]] as const) {
      assert.equal((await handlePluginRequest(new Request(settings.resource,{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body}),dependencies)).status,status)
    }
    assert.equal((await handlePluginRequest(new Request(settings.resource,{headers:{authorization:'Bearer test'}}),dependencies)).status,405)
    assert.equal((await handlePluginRequest(new Request(settings.resource,{method:'OPTIONS',headers:{origin:'https://chatgpt.com'}}),dependencies)).status,204)
  })
  assert(events.some(event => event.status==='succeeded'));assert(events.some(event => event.code==='ACCESS_DENIED'))
  console.log(JSON.stringify({status:'passed',checks:checked,realDatabaseAccess:false}))
}
void main().catch(error => {console.error(error);process.exitCode=1})
