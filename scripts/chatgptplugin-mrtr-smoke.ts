import assert from 'node:assert/strict'
import { randomUUID,randomBytes } from 'node:crypto'
import { handlePluginRequest,type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
import { nativeProposalForm,proposalKinds } from '../src/products/chatgptplugin/extensions/nativeForm'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import { PluginError,type PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'
import type { ExecutionDependencies } from '../src/products/chatgptplugin/application/executeTool'
import { MODERN_VERSION,versionKey,capabilitiesKey } from '../src/products/chatgptplugin/mcp/modernProtocol'

const config:PluginConfig={resource:'https://erp.example.invalid/api/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp',issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['client_test'],origins:['https://chatgpt.com'],toolTimeoutMs:1000,requestsPerMinute:60,nativeFormKey:randomBytes(32).toString('base64')}
const principal:PluginPrincipal={userId:1,clerkUserId:'user_1',clientId:'client_test',scopes:['erp:read','erp:write'],companies:[{id:1,name:'Empresa 1',profile:'administrador',capabilities:[...ERP_CAPABILITIES]}]}
const saved=new Map<string,{input:string;draft:object}>(),events:{status:string;code:string|null}[]=[]
let calls=0,resolved=0,limited=0,checked=0,sequence=0
const execution={reserve:async()=>randomUUID(),finish:async(_id:string,status:string,code:string|null)=>{events.push({status,code})},
  preferences:{read:async()=>({empresa_preferida:'',por_pagina:20})},
  actions:{prepare:async(_p:PluginPrincipal,company:number,key:string,proposal:object)=>{
    calls++;const input=JSON.stringify(proposal),previous=saved.get(key)
    if(previous){if(previous.input!==input)throw new PluginError('IDEMPOTENCY_CONFLICT','Chave já usada.');return previous.draft}
    const draft={rascunho_id:randomUUID(),empresa_id:company,status:'pending',registro_id:null,alvo:null,proposta:proposal,revisao_url:'https://erp.example.invalid/chatgptplugin/approvals/'+randomUUID(),criado_em:new Date().toISOString(),expira_em:new Date(Date.now()+86400000).toISOString()}
    saved.set(key,{input,draft});return draft
  }},queries:{},
} as unknown as ExecutionDependencies
const deps:HttpDependencies={config:()=>config,execution,resolve:async()=>{resolved++;return principal},limit:async()=>{limited++}}
const capabilities={extensions:{'openai/elicitation':{form:{}}}}
async function rpc(method:string,params:Record<string,unknown>={},options:{deps?:HttpDependencies;headers?:Record<string,string>;meta?:Record<string,unknown>;id?:number}={}) {
  const id=options.id??++sequence,meta=options.meta??{[versionKey]:MODERN_VERSION,[capabilitiesKey]:capabilities}
  const response=await handlePluginRequest(new Request(config.resource,{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':MODERN_VERSION,'mcp-method':method,...(params.name||params.uri?{'mcp-name':String(params.name||params.uri)}:{}),...options.headers},body:JSON.stringify({jsonrpc:'2.0',id,method,params:{...params,_meta:meta}})}),options.deps||deps)
  return {response,body:await response.json()}
}
const parameters=(tipo='cliente')=>({name:'preparar_formulario_nativo',arguments:{empresa_id:1,tipo,chave_operacao:randomUUID()}})
async function check(name:string,fn:()=>Promise<void>){await fn();checked++;console.log('PASS '+name)}
async function main(){
  const {OpenAIFormSchema,createOpenAIFormContentSchema}=await import('@openai/mcp-extensions/server')
  await check('Discovery e consultas modernas sem initialize',async()=>{
    const discovery=await rpc('server/discover');assert.equal(discovery.body.result.resultType,'complete');assert(discovery.body.result.supportedVersions.includes(MODERN_VERSION));assert(discovery.body.result.capabilities.extensions['openai/settings']);assert.deepEqual(discovery.body.result.capabilities.tools,{})
    const tools=await rpc('tools/list');assert.equal(tools.body.result.tools.length,29);assert.equal(tools.body.result.resultType,'complete');assert.deepEqual(tools.body.result.tools.find((t:{name:string})=>t.name==='preparar_formulario_nativo').securitySchemes[0].scopes,['erp:read','erp:write'])
    const access=await rpc('tools/call',{name:'meu_acesso',arguments:{}});assert.equal(access.body.result.structuredContent.data.empresas[0].id,1)
    const resource=await rpc('resources/read',{uri:'ui://chatgptplugin/form/v1.html'});assert.equal(resource.body.result.resultType,'complete');assert(resource.body.result.contents[0].text.includes('ui/initialize'))
  })
  await check('Metadados e cabeçalhos obrigatórios, incluindo encoding',async()=>{
    assert.equal((await rpc('tools/list',{}, {meta:{[versionKey]:MODERN_VERSION}})).body.error.code,-32602)
    for(const headers of [{'mcp-method':'other'},{'mcp-protocol-version':'2025-11-25'},{'mcp-method':''}] as Record<string,string>[])assert.equal((await rpc('tools/list',{}, {headers})).body.error.code,-32020)
    assert.equal((await rpc('tools/list',{}, {headers:{'mcp-protocol-version':'2099-01-01'},meta:{[versionKey]:'2099-01-01',[capabilitiesKey]:{}}})).body.error.code,-32022)
    const encoded='=?base64?'+Buffer.from('meu_acesso').toString('base64')+'?='
    assert.equal((await rpc('tools/call',{name:'meu_acesso',arguments:{}},{headers:{'mcp-name':encoded}})).body.result.resultType,'complete')
    assert.equal((await rpc('tools/call',{name:'meu_acesso',arguments:{}},{headers:{'mcp-name':'other'}})).body.error.code,-32020)
    assert.equal((await rpc('tools/list',{}, {headers:{accept:'application/json'}})).response.status,406)
    const unknown=await rpc('unknown/method');assert.equal(unknown.response.status,404);assert.equal(unknown.body.error.code,-32601)
    const malformed=await handlePluginRequest(new Request(config.resource,{method:'POST',headers:{'content-type':'application/json','mcp-protocol-version':MODERN_VERSION},body:'{' }),deps);assert.equal(malformed.status,400);assert.equal((await malformed.json()).error.code,-32700)
  })
  await check('Capacidade de formulário verificada em cada POST',async()=>{
    const before=calls,no=await rpc('tools/call',parameters(),{meta:{[versionKey]:MODERN_VERSION,[capabilitiesKey]:{}}})
    assert.equal(no.body.error.code,-32021);assert.equal(no.response.status,400);assert.equal(calls,before)
  })
  await check('Todos os 44 tipos usam esquemas oficiais de formulário',async()=>{
    for(const tipo of proposalKinds){const form=OpenAIFormSchema.parse(nativeProposalForm(tipo));assert(form.required!.length>0);const request=await rpc('tools/call',parameters(tipo));assert.equal(request.body.result.resultType,'input_required');assert.equal(request.body.result.inputRequests.proposta.method,'openai/elicitation/create');assert(!createOpenAIFormContentSchema(form).safeParse({}).success)}
  })
  await check('MRTR prepara rascunho e repetições retornam o mesmo resultado',async()=>{
    const params=parameters(),initial=await rpc('tools/call',params),state=initial.body.result.requestState
    assert.equal(initial.body.result.inputRequests.proposta.params.requestedSchema.properties.tipo.oneOf[0].title,'Pessoa física')
    const continuation={...params,requestState:state,inputResponses:{proposta:{action:'accept',content:{nome:'Cliente teste',tipo:'fisica'}}}}
    const before=saved.size,result=await rpc('tools/call',continuation);assert.equal(result.body.result.resultType,'complete');assert.equal(result.body.result.structuredContent.data.status,'pending');assert.equal(saved.size,before+1)
    const retry=await rpc('tools/call',continuation);assert.equal(retry.body.result.structuredContent.data.rascunho_id,result.body.result.structuredContent.data.rascunho_id);assert.equal(saved.size,before+1)
    const changed=await rpc('tools/call',{...continuation,inputResponses:{proposta:{action:'accept',content:{nome:'Outra proposta',tipo:'fisica'}}}});assert.equal(changed.body.result.isError,true);assert.equal(saved.size,before+1)
    assert.equal((await rpc('tools/call',continuation,{id:initial.body.id})).body.error.code,-32602)
  })
  await check('Cancelamento, recusa e resposta faltante não criam proposta',async()=>{
    const before=calls
    for(const action of ['cancel','decline']){const params=parameters(),initial=await rpc('tools/call',params);const cancelled=await rpc('tools/call',{...params,requestState:initial.body.result.requestState,inputResponses:{proposta:{action}}});assert.equal(cancelled.body.result.structuredContent.data.cancelled,true)}
    const params=parameters(),initial=await rpc('tools/call',params),missing=await rpc('tools/call',{...params,requestState:initial.body.result.requestState,inputResponses:{unknown:{action:'accept'}}});assert.equal(missing.body.result.resultType,'input_required');assert.equal(missing.body.result.requestState,initial.body.result.requestState);assert.equal(calls,before)
  })
  await check('Estado alterado, outro usuário/cliente/empresa e argumentos trocados bloqueados',async()=>{
    const params=parameters(),initial=await rpc('tools/call',params),state=initial.body.result.requestState,before=calls
    const retry={...params,requestState:state,inputResponses:{proposta:{action:'accept',content:{nome:'Teste',tipo:'fisica'}}}}
    assert.equal((await rpc('tools/call',{...retry,requestState:(state[0]==='a'?'b':'a')+state.slice(1)})).body.error.code,-32602)
    for(const p of [{...principal,userId:2},{...principal,clerkUserId:'user_2'},{...principal,clientId:'other'},{...principal,companies:[{...principal.companies[0],id:2}]}]) {
      const result=await rpc('tools/call',retry,{deps:{...deps,resolve:async()=>p}});assert(result.body.error||result.response.status===403)
    }
    assert.equal((await rpc('tools/call',{...retry,arguments:{...params.arguments,tipo:'produto'}})).body.error.code,-32602)
    assert.equal((await rpc('tools/call',{name:'meu_acesso',arguments:{},requestState:state})).body.error.code,-32602);assert.equal(calls,before)
  })
  await check('Expiração de 10 minutos e chave ausente bloqueiam continuidade',async()=>{
    const params=parameters(),initial=await rpc('tools/call',params),now=Date.now
    try {Date.now=()=>now()+11*60*1000;assert.equal((await rpc('tools/call',{...params,requestState:initial.body.result.requestState})).body.error.code,-32602)}finally{Date.now=now}
    assert.equal((await rpc('tools/call',parameters(),{deps:{...deps,config:()=>({...config,nativeFormKey:undefined})}})).response.status,503)
  })
  await check('Permissões e escopos revogados entre as duas chamadas',async()=>{
    const params=parameters(),initial=await rpc('tools/call',params),retry={...params,requestState:initial.body.result.requestState,inputResponses:{proposta:{action:'accept',content:{nome:'Teste',tipo:'fisica'}}}},before=calls
    for(const p of [{...principal,scopes:['erp:read']},{...principal,companies:[{...principal.companies[0],capabilities:[]}]}])assert.equal((await rpc('tools/call',retry,{deps:{...deps,resolve:async()=>p}})).response.status,403)
    const noWrite=await rpc('tools/call',retry,{deps:{...deps,resolve:async()=>({...principal,scopes:['erp:read']})}});assert(noWrite.response.headers.get('www-authenticate')?.includes('erp:read erp:write'))
    const multi={...principal,companies:[...principal.companies,{...principal.companies[0],id:2}]}
    assert.equal((await rpc('tools/call',{...retry,arguments:{...params.arguments,empresa_id:2}},{deps:{...deps,resolve:async()=>multi}})).body.error.code,-32602)
    assert.equal(calls,before)
  })
  await check('Conteúdo inválido, campos extras e datas impossíveis rejeitados',async()=>{
    const before=calls
    for(const [tipo,content] of [['cliente',{nome:'Teste',tipo:'fisica',empresa_id:2}],['cliente',{tipo:'fisica'}],['produto',{nome:'Teste',preco:-1,controla_estoque:'sim'}],['venda',{cliente_id:1,data_venda:'2026-02-31',data_vencimento:'2026-03-01',itens:'[]'}],['venda',{cliente_id:1,data_venda:'2026-03-01',data_vencimento:'2026-03-01',itens:'not json'}],['editar_cliente',{registro_id:1}]] as const){const params=parameters(tipo),initial=await rpc('tools/call',params);assert.equal((await rpc('tools/call',{...params,requestState:initial.body.result.requestState,inputResponses:{proposta:{action:'accept',content}}})).body.error.code,-32602)}
    assert.equal((await rpc('tools/call',{...parameters(),inputResponses:{proposta:{action:'accept',content:{nome:'Teste',tipo:'fisica'}}}})).body.error.code,-32602);assert.equal(calls,before)
  })
  await check('Venda e baixa válidas atravessam o mesmo preparo auditado',async()=>{
    for(const [tipo,content] of [['venda',{cliente_id:1,data_venda:'2026-10-03',data_vencimento:'2026-10-10',itens:JSON.stringify([{tipo:'produto',item_id:1,quantidade:2,valor_unitario:10}])}],['pagar_parcela',{registro_id:1,valor:20,data_pagamento:'2026-10-03',conta_financeira_id:1}]] as const){const params=parameters(tipo),initial=await rpc('tools/call',params),result=await rpc('tools/call',{...params,requestState:initial.body.result.requestState,inputResponses:{proposta:{action:'accept',content}}});assert.equal(result.body.result.structuredContent.data.status,'pending')}
  })
  await check('Novas contas compras edicoes e exclusoes atravessam MRTR',async()=>{
    for(const [tipo,content] of [['conta_pagar',{fornecedor_id:1,descricao:'Aluguel',valor_total:100,data_competencia:'2026-10-04',data_emissao:'2026-10-04',categoria_id:1,parcelas:JSON.stringify([{data_vencimento:'2026-10-20',valor:100}])}],['compra',{fornecedor_id:1,data_compra:'2026-10-04',data_vencimento:'2026-10-20',itens:JSON.stringify([{tipo:'produto',item_id:1,quantidade:2,valor_unitario:10}])}],['editar_fornecedor',{registro_id:1,nome:'Fornecedor revisado'}],['excluir_conta_receber',{registro_id:1,motivo:'Conta criada por engano'}]] as const){const params=parameters(tipo),initial=await rpc('tools/call',params),result=await rpc('tools/call',{...params,requestState:initial.body.result.requestState,inputResponses:{proposta:{action:'accept',content}}});assert.equal(result.body.result.structuredContent.data.status,'pending')}
  })
  await check('Falha de auditoria impede solicitar formulário e autenticação é renovada',async()=>{
    const before=calls,result=await rpc('tools/call',parameters(),{deps:{...deps,execution:{...execution,reserve:async()=>{throw new Error('secret database')}}}});assert.equal(result.response.status,503);assert(!JSON.stringify(result.body).includes('secret'));assert.equal(calls,before);assert(events.some(e=>e.status==='failed'))
    const rBefore=resolved,lBefore=limited;await rpc('tools/list');await rpc('tools/list');assert.equal(resolved-rBefore,2);assert.equal(limited-lBefore,2)
  })
  console.log(JSON.stringify({status:'passed',groups:checked,protocol:MODERN_VERSION,mrtr:true,remoteChatGPT:false}))
}
main().catch(error=>{console.error(error);process.exitCode=1})
