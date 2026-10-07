import assert from 'node:assert/strict'
import { randomUUID,randomBytes } from 'node:crypto'
import { handlePluginRequest,type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
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
  }},queries:{page:async(_c:number,type:string)=>({records:type==='clientes'?[{id:'5',nome:'Padaria Central'},{id:'6',nome:'Mercado Sol'}]:[],total:type==='clientes'?2:0})},
} as unknown as ExecutionDependencies
const deps:HttpDependencies={config:()=>config,execution,resolve:async()=>{resolved++;return principal},limit:async()=>{limited++}}
const capabilities={extensions:{'openai/elicitation':{form:{}}}}
async function rpc(method:string,params:Record<string,unknown>={},options:{deps?:HttpDependencies;headers?:Record<string,string>;meta?:Record<string,unknown>;id?:number}={}) {
  const id=options.id??++sequence,meta=options.meta??{[versionKey]:MODERN_VERSION,[capabilitiesKey]:capabilities}
  const response=await handlePluginRequest(new Request(config.resource,{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':MODERN_VERSION,'mcp-method':method,...(params.name||params.uri?{'mcp-name':String(params.name||params.uri)}:{}),...options.headers},body:JSON.stringify({jsonrpc:'2.0',id,method,params:{...params,_meta:meta}})}),options.deps||deps)
  return {response,body:await response.json()}
}
const preview=()=>({name:'criar_cadastro',arguments:{empresa_id:1,tipo:'cliente',chave_operacao:randomUUID(),dados:{nome:'Cliente teste'}}})
async function check(name:string,fn:()=>Promise<void>){await fn();checked++;console.log('PASS '+name)}
async function main(){
  await check('Discovery e consultas modernas sem initialize',async()=>{
    const discovery=await rpc('server/discover');assert.equal(discovery.body.result.resultType,'complete');assert(discovery.body.result.supportedVersions.includes(MODERN_VERSION));assert(discovery.body.result.capabilities.extensions['openai/settings']);assert.deepEqual(discovery.body.result.capabilities.tools,{})
    assert(String(discovery.body.result.instructions).includes('rascunho_id'))
    const tools=await rpc('tools/list');assert.equal(tools.body.result.tools.length,38);assert.equal(tools.body.result.resultType,'complete')
    assert.deepEqual(tools.body.result.tools.find((t:{name:string})=>t.name==='criar_cadastro').securitySchemes[0].scopes,['erp:read','erp:write'])
    const access=await rpc('tools/call',{name:'meu_acesso',arguments:{}});assert.equal(access.body.result.structuredContent.data.empresas[0].id,1)
    const resource=await rpc('resources/read',{uri:'ui://chatgptplugin/panel/v1.html'});assert.equal(resource.body.result.resultType,'complete');assert(resource.body.result.contents[0].text.includes('ui/initialize'))
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
  await check('Prévia de escrita no protocolo moderno é idempotente pela chave',async()=>{
    const params=preview(),first=await rpc('tools/call',params)
    assert.equal(first.body.result.resultType,'complete');assert.equal(first.body.result.structuredContent.data.etapa,'previa')
    const again=await rpc('tools/call',params)
    assert.equal(again.body.result.structuredContent.data.rascunho_id,first.body.result.structuredContent.data.rascunho_id)
    const changed=await rpc('tools/call',{...params,arguments:{...params.arguments,dados:{nome:'Outro nome'}}})
    assert.equal(changed.body.result.isError,true);assert.equal(saved.size,1)
  })
  await check('Continuidade de formulário recusada em todas as tools',async()=>{
    const before=calls,params=preview()
    assert.equal((await rpc('tools/call',{...params,requestState:'x'})).body.error.code,-32602)
    assert.equal((await rpc('tools/call',{name:'meu_acesso',arguments:{},inputResponses:{}})).body.error.code,-32602);assert.equal(calls,before)
  })
  await check('Falha de auditoria impede escrita e autenticação é renovada',async()=>{
    const before=calls,params=preview(),result=await rpc('tools/call',params,{deps:{...deps,execution:{...execution,reserve:async()=>{throw new Error('secret database')}}}})
    assert.equal(result.body.result.isError,true);assert(!JSON.stringify(result.body).includes('secret'));assert.equal(calls,before)
    const rBefore=resolved,lBefore=limited;await rpc('tools/list');await rpc('tools/list');assert.equal(resolved-rBefore,2);assert.equal(limited-lBefore,2)
  })
  const lastProposal=()=>JSON.parse([...saved.values()].at(-1)!.input)
  await check('Formulário nativo pede campos faltantes dentro da própria tool',async()=>{
    const params={name:'criar_cadastro',arguments:{empresa_id:1,tipo:'cliente',chave_operacao:randomUUID(),dados:{email:'contato@example.invalid'}}}
    const initial=await rpc('tools/call',params),request=initial.body.result
    assert.equal(request.resultType,'input_required');assert.equal(request.inputRequests.dados.method,'openai/elicitation/create')
    const schema=request.inputRequests.dados.params.requestedSchema;assert(schema.required.includes('nome'));assert.equal(schema.properties.email.default,'contato@example.invalid')
    assert.equal(schema.properties.tipo.oneOf[0].title,'Pessoa física')
    const before=calls,done=await rpc('tools/call',{...params,requestState:request.requestState,inputResponses:{dados:{action:'accept',content:{nome:'Cliente do formulário',email:'contato@example.invalid',tipo:'juridica'}}}})
    assert.equal(done.body.result.resultType,'complete');assert.equal(done.body.result.structuredContent.data.etapa,'previa');assert.equal(calls,before+1)
    assert.deepEqual(lastProposal(),{tipo:'cliente',dados:{email:'contato@example.invalid',nome:'Cliente do formulário',tipo:'juridica'}})
  })
  await check('Referências viram lista com nomes e voltam como ID numérico',async()=>{
    const params={name:'criar_venda',arguments:{empresa_id:1,tipo:'venda',chave_operacao:randomUUID(),dados:{data_venda:'2026-10-07',data_vencimento:'2026-10-31',itens:[{tipo:'produto',item_id:9,quantidade:1,valor_unitario:10}]}}}
    const request=(await rpc('tools/call',params)).body.result,field=request.inputRequests.dados.params.requestedSchema.properties.cliente_id
    assert.deepEqual(field.oneOf,[{const:'5',title:'Padaria Central'},{const:'6',title:'Mercado Sol'}]);assert(!('itens' in request.inputRequests.dados.params.requestedSchema.properties))
    const done=await rpc('tools/call',{...params,requestState:request.requestState,inputResponses:{dados:{action:'accept',content:{cliente_id:'6',data_venda:'2026-10-07',data_vencimento:'2026-10-31'}}}})
    assert.equal(done.body.result.resultType,'complete',JSON.stringify(done.body));assert.equal(lastProposal().dados.cliente_id,6)
  })
  await check('Cancelamento, estado adulterado, outro usuário e expiração não criam prévia',async()=>{
    const params={name:'criar_cadastro',arguments:{empresa_id:1,tipo:'fornecedor',chave_operacao:randomUUID(),dados:{}}}
    const request=(await rpc('tools/call',params)).body.result,before=calls,answer={dados:{action:'accept',content:{nome:'Fornecedor',tipo:'fisica'}}}
    const cancelled=await rpc('tools/call',{...params,requestState:request.requestState,inputResponses:{dados:{action:'cancel'}}})
    assert.equal(cancelled.body.result.isError,true);assert.match(cancelled.body.result.content[0].text,/FORM_CANCELLED/)
    const state=request.requestState as string
    assert.equal((await rpc('tools/call',{...params,requestState:(state[0]==='a'?'b':'a')+state.slice(1),inputResponses:answer})).body.error.code,-32602)
    assert.equal((await rpc('tools/call',{...params,requestState:state,inputResponses:answer},{deps:{...deps,resolve:async()=>({...principal,userId:2})}})).body.error.code,-32602)
    assert.equal((await rpc('tools/call',{...params,arguments:{...params.arguments,tipo:'vendedor'},requestState:state,inputResponses:answer})).body.error.code,-32602)
    const now=Date.now;try{Date.now=()=>now()+11*60*1000;assert.equal((await rpc('tools/call',{...params,requestState:state,inputResponses:answer})).body.error.code,-32602)}finally{Date.now=now}
    assert.equal(calls,before)
  })
  await check('Sem capacidade de formulário a tool devolve os campos faltantes',async()=>{
    const params={name:'criar_cadastro',arguments:{empresa_id:1,tipo:'cliente',chave_operacao:randomUUID(),dados:{}}},meta={[versionKey]:MODERN_VERSION,[capabilitiesKey]:{}}
    const result=await rpc('tools/call',params,{meta});assert.equal(result.body.result.isError,true)
    assert(JSON.parse(result.body.result.content[0].text).campos.some((f:{campo:string})=>f.campo==='dados.nome'))
    assert.equal((await rpc('tools/call',{...params,requestState:'x'},{meta})).body.error.code,-32021)
    assert.equal((await rpc('tools/call',params,{deps:{...deps,config:()=>({...config,nativeFormKey:undefined})}})).response.status,503)
    const noWrite=await rpc('tools/call',params,{deps:{...deps,resolve:async()=>({...principal,scopes:['erp:read']})}})
    assert.equal(noWrite.response.status,403);assert(noWrite.response.headers.get('www-authenticate')?.includes('erp:read erp:write'))
  })
  console.log(JSON.stringify({status:'passed',groups:checked,protocol:MODERN_VERSION,nativeForms:true,remoteChatGPT:false}))
}
main().catch(error=>{console.error(error);process.exitCode=1})
