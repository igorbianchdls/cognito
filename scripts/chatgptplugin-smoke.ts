import {serviceInvoiceQueryStubs} from './erp/service-invoice-query-stubs'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handlePluginRequest, type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
import { resolvePluginPrincipal, validateOAuthToken } from '../src/products/mcpcore/auth/resolvePrincipal'
import { PluginError, selectCompany, type PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import { getErpDatabaseContext,runWithErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { assertErpTenantScopedQuery,runWithErpTransactionClient,getErpTransactionClient } from '../src/lib/postgres'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import { executeTool, type ExecutionDependencies } from '../src/products/mcpcore/application/executeTool'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'

const settings: PluginConfig = {integration:'chatgpt',resource:'http://localhost:3187/api/mcp',metadataUrl:'http://localhost:3187/.well-known/oauth-protected-resource/api/mcp',
  issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['client_test'],origins:['http://localhost:3187','https://chatgpt.com'],toolTimeoutMs:100,requestsPerMinute:60}
const principal: PluginPrincipal = {userId:1,clerkUserId:'user_1',clientId:'client_test',scopes:['erp:read'],
  companies:[{id:1,name:'Empresa um',profile:'administrador',capabilities:[...ERP_CAPABILITIES]}]}
const events: {id:string;status:string;code?:string | null}[] = []
const calls: {company:number;user:number}[] = []
function context(company: number) {
  const current = getErpDatabaseContext()
  assert.equal(current?.tenantId,company); assert.equal(current?.userId,1)
  assert.equal(current?.readOnly,true); assert.equal(current?.statementTimeoutMs,10000)
  assertErpTenantScopedQuery('SELECT * FROM erp.entidades WHERE empresa_id = $1',[company])
  assert.throws(() => assertErpTenantScopedQuery('SELECT * FROM erp.entidades WHERE empresa_id = $1',[company+10]))
  calls.push({company,user:current!.userId})
}
const execution: ExecutionDependencies = {
  preferences:{read:async()=>({empresa_preferida:'',por_pagina:20}),update:async(_p,set)=>({empresa_preferida:'',por_pagina:20,...set as object})},
  reserve:async () => {const id=randomUUID();events.push({id,status:'running'});return id},
  finish:async (id,status,code) => {events.push({id,status,code})},
  queries:{...serviceInvoiceQueryStubs,
    financialTitle:async()=>({record:{id:"1"},installments:[],installmentsTruncated:false,history:[],historyTruncated:false}),
    attachments:async(id)=>{context(id);return {records:[],total:0,hasMore:false}},
    registration:async(id,_type,recordId)=>{context(id);return {record:{id:String(recordId),nome:"Cadastro"}}},
    installment:async(id,side,recordId)=>{context(id);return {record:{id:String(recordId),saldo:12},history:[],historyTruncated:false}},
    analysis:async(id,type,from,to)=>{context(id);return {tipo:type,inicio:from,fim:to,criterio:"Teste",summary:{quantidade:0,valor_total:0,valor_medio:0},records:[]}},
    customer:async(id,customerId)=>{context(id);return {record:{id:String(customerId),nome:'Cliente'}}},
    fiscal:async id=>{context(id);return {ready:false,issues:[]}},
    financialAccounts:async id=>{context(id);return {records:[],hasMore:false}},
    payments:async(id,input)=>{context(id);return {records:[],page:input.page,pageSize:input.pageSize,hasMore:false}},
    overview:async id => {context(id);return {saldoReceber:1,saldoPagar:2,receberVencido:0,vendasRascunho:3,comprasAbertas:4,clientesAtivos:5}},
    page:async (id,_type,input) => {context(id);return {records:[{id:'1',nome:'Produto'}],total:1,page:input.page || 1,pageSize:input.pageSize || 20}},
    sale:async (id,saleId) => {context(id);return {sale:{id:saleId,data_vencimento:null},items:[],totalItems:0,itemsTruncated:false,installments:[],installmentsTruncated:false}},
    stock:async (id,input) => {context(id);return {records:[],total:0,page:input.page || 1,pageSize:input.pageSize || 20}},
    purchase:async(id,purchaseId) => {context(id);return {purchase:{id:purchaseId,data_vencimento:null},items:[],totalItems:0,itemsTruncated:false,installments:[],installmentsTruncated:false}},
    report:async(id,report,from,to,input) => {context(id);return {report,from,to,records:[],page:input.page || 1,pageSize:input.pageSize || 20,hasMore:false}},
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
      validateOAuthToken({subject:'user_1',clientId:'client_test',scopes:['erp:read'],revoked:false,expired:false,expiration,issuer:settings.issuer,audience:settings.resource},settings)
    }
  })
  await check('OAuth invalido revogado expirado scope audience',() => {
    const token={subject:'user_1',clientId:'client_test',scopes:['erp:read'],revoked:false,expired:false,expiration:Date.now()+3600000,issuer:settings.issuer,audience:settings.resource}
    for (const overrides of [{revoked:true},{expired:true},{expiration:1},{expiration:null},{scopes:[]},{clientId:'another'},{subject:'org_1'},
      {audience:undefined},{audience:'https://other.example/api/mcp'},{audience:settings.resource+'/'},{issuer:'https://another.clerk.accounts.dev'}]) {
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
    type Listed={name:string;annotations:{readOnlyHint:boolean;destructiveHint:boolean};securitySchemes:{type:string;scopes:string[]}[];outputSchema?:object;inputSchema:{properties:Record<string,unknown>}}
    const listed=body.result.tools as Listed[],byName=(name:string)=>listed.find(t=>t.name===name)!
    // 15 consultas (com meu_acesso), 20 escritas, painel, configuracoes e a tool de mencoes do SDK.
    assert.equal(listed.length,42)
    const writes=['criar_cadastro','editar_cadastro','excluir_cadastro','criar_venda','editar_venda','excluir_venda','converter_orcamento','registrar_devolucao','confirmar_venda','cancelar_venda','atender_venda',
      'criar_compra','editar_compra','excluir_compra','confirmar_compra','cancelar_compra','criar_titulo','editar_titulo','excluir_titulo','efetivar_previsao','registrar_baixa','estornar_pagamento']
    const destructive=['excluir_cadastro','excluir_venda','cancelar_venda','excluir_compra','cancelar_compra','excluir_titulo','estornar_pagamento','registrar_devolucao']
    for(const removed of ['preparar_rascunho','preparar_formulario_nativo','renderizar_card','abrir_formulario','obter_rascunho','listar_rascunhos','obter_cliente','listar_orcamentos','listar_contas_financeiras','listar_notas_servico','verificar_fiscal_venda'])
      assert(!listed.some(t=>t.name===removed),removed)
    for (const tool of listed) {
      const write=writes.includes(tool.name)
      assert.equal(tool.annotations.readOnlyHint,!write&&tool.name!=='atualizar_configuracoes',tool.name)
      assert.equal(tool.annotations.destructiveHint,destructive.includes(tool.name),tool.name)
      assert.equal(tool.securitySchemes[0].type,'oauth2');assert(tool.outputSchema,tool.name)
      if(write){assert.deepEqual(tool.securitySchemes[0].scopes,['erp:read','erp:write']);assert(tool.inputSchema.properties.rascunho_id&&tool.inputSchema.properties.dados,tool.name)}
    }
    assert(byName('criar_cadastro').inputSchema.properties.tipo);assert(!byName('confirmar_venda').inputSchema.properties.tipo)
    const profileTool=(listed as unknown as {name:string;_meta:Record<string,unknown>}[]).find(t=>t.name==='meu_acesso')!;assert.equal(profileTool._meta['openai/profile'],true)
    const access=(await rpc('tools/call',{name:'meu_acesso',arguments:{}})).body.result.structuredContent
    assert.equal(access.id,'user_1');assert.equal(access.nickname,'Usuário do Cognito ERP · Empresa um');assert.equal(access.data.empresas[0].id,1)
    assert.deepEqual(body.result.tools.find((t:{name:string})=>t.name==='abrir_painel')._meta['openai/ui'].entrypoints,[{type:'global'},{type:'thread'},{type:'settings',searchTerms:['empresa','preferencias']}])
  })
  for (const [name,args] of [['meu_acesso',{}],['resumo_erp',{}],['buscar_cadastros',{tipo:'produtos'}],['listar_vendas',{}],['obter_venda',{venda_id:1}],['consultar_financeiro',{tipo:'pagar'}],['consultar_estoque',{}]] as const) {
    await check(name,async () => {const {body}=await rpc('tools/call',{name,arguments:args});assert(!body.result?.isError,JSON.stringify(body));assert.equal(body.result.structuredContent.ok,true)})
  }
  for (const [name,args] of [['listar_compras',{}],['obter_compra',{compra_id:1}],['listar_vendas',{tipo_documento:'orcamento'}],['obter_cadastro',{tipo:'clientes',registro_id:1}],['consultar_relatorio',{tipo:'vendas-clientes',inicio:'2026-01-01',fim:'2026-10-03'}],['abrir_painel',{}]] as const) {
    await check(name,async()=>{const {body}=await rpc('tools/call',{name,arguments:args});assert(!body.result?.isError,JSON.stringify(body))})
  }
  await check('Recurso UI registrado e sem dados privados',async()=>{
    const resources=await rpc('resources/list');assert.equal(resources.body.result.resources.length,2)
    const cards=await rpc('resources/read',{uri:'ui://chatgptplugin/cards/v2.html'});assert.deepEqual(cards.body.result.contents[0]._meta.ui.csp,{connectDomains:[],resourceDomains:[]});assert(!cards.body.result.contents[0].text.includes(principal.clerkUserId))
    const listed=(await rpc('tools/list')).body.result.tools as {name:string;_meta?:{ui?:{resourceUri?:string}}}[]
    assert(listed.filter(t=>t._meta?.ui?.resourceUri==='ui://chatgptplugin/cards/v2.html').length===38,'cards em 16 consultas e 22 escritas')
    const resource=await rpc('resources/read',{uri:'ui://chatgptplugin/panel/v1.html'})
    assert.equal(resource.body.result.contents[0].mimeType,'text/html;profile=mcp-app')
    assert(resource.body.result.contents[0].text.includes('ui/initialize'))
    assert(!resource.body.result.contents[0].text.includes(principal.clerkUserId))
  })
  const p={...principal,scopes:['erp:read','erp:write']}
  const draft={rascunho_id:randomUUID(),empresa_id:1,status:'pending' as const,registro_id:null,alvo:null,criado_em:new Date().toISOString(),expira_em:new Date().toISOString(),proposta:{tipo:'cliente',dados:{nome:'Cliente',tipo:'fisica'}}}
  const writeCalls={prepared:[] as {tipo:string;dados:Record<string,unknown>}[],executed:[] as {id:string;kinds:readonly string[];tool:string}[]}
  const writeDeps:ExecutionDependencies={...execution,actions:{
    prepare:async(_p,_c,_k,proposal)=>{writeCalls.prepared.push(proposal as never);return draft as never},
    execute:async(_p,_c,id,kinds,tool)=>{writeCalls.executed.push({id,kinds,tool});return {...draft,status:'saved',registro_id:'7'} as never}}}
  const parsedResult=(result:Awaited<ReturnType<typeof executeTool>>)=>result.isError?JSON.parse((result.content[0] as {text:string}).text):result.structuredContent
  await check('Escritas exigem scope escrita e permissao ERP',async()=>{
    const args={chave_operacao:randomUUID(),tipo:'cliente',dados:{nome:'Cliente'}}
    const denied=await executeTool(principal,'criar_cadastro',args,settings,writeDeps)
    assert.equal(denied.isError,true);assert(denied._meta?.['mcp/www_authenticate'])
    const readonly={...p,companies:[{...p.companies[0],capabilities:['erp.cadastros.visualizar'] as typeof p.companies[0]['capabilities']}]}
    assert.equal(parsedResult(await executeTool(readonly,'criar_cadastro',args,settings,writeDeps)).code,'ACCESS_DENIED')
    // Conta financeira exige tambem a gestao financeira.
    const registrationOnly={...p,companies:[{...p.companies[0],capabilities:['erp.cadastros.gerenciar'] as typeof p.companies[0]['capabilities']}]}
    assert.equal(parsedResult(await executeTool(registrationOnly,'criar_cadastro',{chave_operacao:randomUUID(),tipo:'conta_financeira',dados:{nome:'Banco',tipo:'banco',data_saldo_inicial:'2026-01-01'}},settings,writeDeps)).code,'ACCESS_DENIED')
    assert.equal(writeCalls.prepared.length,0)
  })
  await check('Previa mapeia tipo para a proposta e devolve como confirmar',async()=>{
    const result=parsedResult(await executeTool(p,'criar_cadastro',{chave_operacao:randomUUID(),tipo:'fornecedor',dados:{nome:'Fornecedor',documento:'123'}},settings,writeDeps))
    assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.data.etapa,'previa')
    assert.deepEqual(result.data.confirmar,{tool:'criar_cadastro',argumentos:{empresa_id:1,rascunho_id:draft.rascunho_id}})
    assert.deepEqual(writeCalls.prepared.at(-1),{tipo:'fornecedor',dados:{nome:'Fornecedor',documento:'123',tipo:'fisica'}})
    // Dados validos para produto, mas a tool exige o esquema exato do tipo escolhido.
    const wrong=parsedResult(await executeTool(p,'criar_cadastro',{chave_operacao:randomUUID(),tipo:'servico',dados:{nome:'Item',preco:10,controla_estoque:'sim'}},settings,writeDeps))
    assert.equal(wrong.code,'INVALID_INPUT');assert(wrong.campos.length>0,JSON.stringify(wrong))
    for(const [tool,args] of [['criar_venda',{chave_operacao:randomUUID(),tipo:'orcamento',dados:{cliente_id:1,data_venda:'2026-10-01',data_vencimento:'2026-10-31',itens:[{tipo:'produto',item_id:2,quantidade:1,valor_unitario:10}]}}],
      ['registrar_baixa',{chave_operacao:randomUUID(),tipo:'receber',dados:{registro_id:3,valor:10,data_pagamento:'2026-10-01',conta_financeira_id:4}}],
      ['cancelar_venda',{chave_operacao:randomUUID(),dados:{registro_id:5,motivo:'Cliente desistiu'}}]] as const) {
      const ok=parsedResult(await executeTool(p,tool,args,settings,writeDeps));assert.equal(ok.ok,true,JSON.stringify(ok))
    }
    assert.deepEqual(writeCalls.prepared.slice(-3).map(item=>item.tipo),['orcamento','receber_parcela','cancelar_venda'])
  })
  await check('Erros informam campo e motivo',async()=>{
    const missingType=parsedResult(await executeTool(p,'criar_cadastro',{chave_operacao:randomUUID(),dados:{nome:'Sem tipo'}},settings,writeDeps))
    assert.equal(missingType.code,'INVALID_INPUT');assert.equal(missingType.campos[0].campo,'tipo')
    const missingKey=parsedResult(await executeTool(p,'confirmar_venda',{dados:{registro_id:1}},settings,writeDeps))
    assert.deepEqual(missingKey.campos,[{campo:'chave_operacao',motivo:'Obrigatório'}])
    const badDate=parsedResult(await executeTool(p,'registrar_baixa',{chave_operacao:randomUUID(),tipo:'pagar',dados:{registro_id:3,valor:10,data_pagamento:'2026-02-31',conta_financeira_id:4}},settings,writeDeps))
    assert(badDate.campos.some((f:{campo:string})=>f.campo==='dados.data_pagamento'),JSON.stringify(badDate))
    const extra=parsedResult(await executeTool(p,'listar_vendas',{por_pagina:100},settings,writeDeps))
    assert.equal(extra.campos[0].campo,'por_pagina')
  })
  await check('Execucao usa somente rascunho_id e a tool da operacao',async()=>{
    const id=randomUUID()
    const mixed=parsedResult(await executeTool(p,'excluir_venda',{rascunho_id:id,dados:{registro_id:1,motivo:'xxx'}},settings,writeDeps))
    assert.equal(mixed.code,'INVALID_INPUT');assert.equal(writeCalls.executed.length,0)
    const done=parsedResult(await executeTool(p,'excluir_venda',{rascunho_id:id},settings,writeDeps))
    assert.equal(done.data.etapa,'executado');assert.equal(done.data.status,'saved')
    assert.deepEqual(writeCalls.executed,[{id,kinds:['excluir_venda','excluir_orcamento'],tool:'excluir_venda'}])
    const noScope=await executeTool({...p,scopes:['erp:read']},'excluir_venda',{rascunho_id:id},settings,writeDeps)
    assert.equal(noScope.isError,true);assert.equal(writeCalls.executed.length,1)
  })
  await check('Relatorio respeita periodo e acesso a area',async()=>{
    const args={tipo:'vendas-clientes',inicio:'2024-01-01',fim:'2026-01-01'}
    assert.equal((await executeTool(principal,'consultar_relatorio',args,settings,execution)).isError,true)
    const p={...principal,companies:[{...principal.companies[0],capabilities:['erp.relatorios.visualizar'] as typeof principal.companies[0]['capabilities']}]}
    assert.equal((await executeTool(p,'consultar_relatorio',{...args,inicio:'2026-01-01'},settings,execution)).isError,true)
  })
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
    for (const args of [{empresa_id:2},{por_pagina:100},{pagina:0}]) assert.equal((await executeTool(principal,'listar_vendas',args,settings,execution)).isError,true)
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
  await check('Corpo sem fim expira sem executar ferramenta, mesmo se o cancelamento falhar',async()=>{
    const body=JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'meu_acesso',arguments:{}}})
    await Promise.all(['valid','partial','cancel-rejects','cancel-pending','closed'].map(async scenario=>{
      let executions=0,cancelled=false
      const deps:HttpDependencies={...dependencies,execution:{...execution,
        reserve:async()=>{executions++;return randomUUID()},finish:async()=>undefined}}
      const bytes=new TextEncoder().encode(scenario==='partial'?body.slice(0,-1):body)
      const stream=new ReadableStream<Uint8Array>({
        start(controller){
          controller.enqueue(bytes.slice(0,20));controller.enqueue(bytes.slice(20))
          if(scenario==='closed')controller.close()
        },
        cancel(){
          cancelled=true
          if(scenario==='cancel-rejects')return Promise.reject(new Error('Cancelamento falhou'))
          if(scenario==='cancel-pending')return new Promise<void>(()=>{})
        },
      })
      const response=await handlePluginRequest(new Request(settings.resource,{method:'POST',
        headers:{authorization:'Bearer test','content-type':'application/json',accept:'application/json, text/event-stream'},
        body:stream,duplex:'half'} as RequestInit),deps)
      const result=await response.json()
      assert.equal(response.status,scenario==='closed'?200:408,scenario)
      assert.equal(executions,scenario==='closed'?1:0,scenario)
      assert.equal(cancelled,scenario!=='closed',scenario)
      if(scenario==='closed')assert.equal(result.result.isError,undefined)
      else assert.equal(result.error,'TIMEOUT',scenario)
      assert.equal(stream.locked,false,scenario)
    }))
  })
  await check('Extensoes oficiais anunciam e validam configuracoes',async()=>{
    const initialized=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'smoke',version:'1'}})
    assert.equal(initialized.body.result.capabilities.extensions['openai/settings'].readTool,'ler_configuracoes')
    const read=await rpc('tools/call',{name:'ler_configuracoes',arguments:{}});assert.equal(read.body.result.structuredContent.values.por_pagina,20)
    const update=await rpc('tools/call',{name:'atualizar_configuracoes',arguments:{set:{por_pagina:30}}});assert.equal(update.body.result.structuredContent.values.por_pagina,30)
    const invalid=await rpc('tools/call',{name:'atualizar_configuracoes',arguments:{set:{por_pagina:1000}}});assert(invalid.body.result?.isError||invalid.body.error)
    const empty=await rpc('tools/call',{name:'atualizar_configuracoes',arguments:{set:{}}});assert(empty.body.result?.isError||empty.body.error)
  })
  await check('Mencoes e leitura de recursos revalidam empresa e permissoes',async()=>{
    const mentions=await rpc('tools/call',{name:'search_mentions',arguments:{query:'Cliente'}});assert.equal(mentions.body.result.structuredContent.items[0].resourceUri,'erp://empresa/1/clientes/1')
    const resource=await rpc('resources/read',{uri:'erp://empresa/1/clientes/1'});assert.equal(JSON.parse(resource.body.result.contents[0].text).id,'1')
    const foreign=await rpc('resources/read',{uri:'erp://empresa/999/clientes/1'});assert(foreign.body.error)
    const multi={...dependencies,resolve:async()=>({...principal,companies:[...principal.companies,{...principal.companies[0],id:2}]})}
    const noSelection=await rpc('tools/call',{name:'search_mentions',arguments:{query:'Cliente'}},multi);assert.equal(noSelection.body.result.structuredContent.items.length,0)
    const selection=await rpc('tools/call',{name:'search_mentions',arguments:{query:'2: Cliente'}},multi);assert.equal(selection.body.result.structuredContent.items[0].resourceUri,'erp://empresa/2/clientes/1')
  })
  await check('Escrita pelo protocolo valida a saida declarada',async()=>{
    const writer={...dependencies,execution:writeDeps,resolve:async()=>p}
    const {body}=await rpc('tools/call',{name:'criar_venda',arguments:{chave_operacao:randomUUID(),tipo:'venda',dados:{cliente_id:1,data_venda:'2026-10-01',data_vencimento:'2026-10-31',itens:[{tipo:'servico',item_id:2,quantidade:2,valor_unitario:50}]}}},writer)
    assert(!body.result?.isError,JSON.stringify(body));assert.equal(body.result.structuredContent.data.etapa,'previa')
    const instructions=(await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'smoke',version:'1'}})).body.result.instructions as string
    assert(instructions.slice(0,512).includes('rascunho_id')&&instructions.slice(0,512).includes('meu_acesso'))
  })
  await check('Transacao composta nao troca empresa usuario ou modo de leitura',async()=>{
    const client={release(){},query:async()=>({rows:[]})}
    assert.equal(getErpTransactionClient(),undefined)
    await runWithErpDatabaseContext({tenantId:1,userId:1},()=>runWithErpTransactionClient(client,async()=>{
      assert.equal(getErpTransactionClient(),client)
      for(const change of [{tenantId:2,userId:1},{tenantId:1,userId:2},{tenantId:1,userId:1,readOnly:true}]) {
        assert.throws(()=>runWithErpDatabaseContext(change,()=>getErpTransactionClient()))
      }
    }))
    assert.equal(getErpTransactionClient(),undefined)
    assert.throws(()=>runWithErpDatabaseContext({tenantId:1,userId:1,readOnly:true},()=>runWithErpTransactionClient(client,async()=>undefined)))
  })
  assert(events.some(event => event.status==='succeeded'));assert(events.some(event => event.code==='ACCESS_DENIED'))
  console.log(JSON.stringify({status:'passed',checks:checked,realDatabaseAccess:false}))
}
void main().catch(error => {console.error(error);process.exitCode=1})
