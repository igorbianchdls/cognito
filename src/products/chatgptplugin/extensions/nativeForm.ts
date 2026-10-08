import { createCipheriv,createDecipheriv,createHash,randomBytes } from 'node:crypto'
import { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { OpenAIForm,OpenAIFormField } from '@openai/mcp-extensions/server'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { proposalSchema,type Proposal } from '@/products/mcpcore/actions/contracts'
import { actionTools,type ActionDefinition } from '@/products/mcpcore/actions/catalog'
import { operationLabels } from '@/products/mcpcore/actions/labels'
import { fieldLabels } from '@/products/mcpcore/actions/fieldLabels'
import { PluginError,selectCompany,type PluginCompany,type PluginPrincipal } from '@/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../shared/config'
import { executeTool,type ExecutionDependencies } from '@/products/mcpcore/application/executeTool'

// Formulário nativo dentro das tools de escrita (MCP 2026-07-28 / MRTR): quando faltam campos
// obrigatórios na prévia, a própria tool pede os dados ao usuário, com listas no lugar de IDs.
const FORM_TTL_MS=10*60*1000,MAX_OPTIONS=50
const references:Record<string,ErpConnectedModuleId>={cliente_id:'clientes',fornecedor_id:'fornecedores',vendedor_id:'vendedores',
  categoria_id:'categorias',conta_financeira_id:'contas-financeiras'}
const registrationModules:Record<string,ErpConnectedModuleId>={cliente:'clientes',fornecedor:'fornecedores',vendedor:'vendedores',produto:'produtos',
  servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras'}
const valueLabels:Record<string,string>={fisica:'Pessoa física',juridica:'Pessoa jurídica',sim:'Sim',nao:'Não',ativo:'Ativo',inativo:'Inativo',pausado:'Pausado',
  receita:'Receita',despesa:'Despesa',produto:'Produto',servico:'Serviço',geral:'Geral',cliente:'Cliente',fornecedor:'Fornecedor',
  caixa:'Caixa',banco:'Banco',carteira:'Carteira',cartao:'Cartão',outro:'Outro'}

function unwrap(schema:z.ZodTypeAny):z.ZodTypeAny {
  if(schema instanceof z.ZodEffects)return unwrap(schema.innerType())
  if(schema instanceof z.ZodOptional||schema instanceof z.ZodNullable)return unwrap(schema.unwrap())
  if(schema instanceof z.ZodDefault)return unwrap(schema.removeDefault())
  return schema
}
function dataShape(kind:Proposal['tipo']) {
  return (unwrap(proposalSchema.optionsMap.get(kind)!.shape.dados) as z.AnyZodObject).shape as Record<string,z.ZodTypeAny>
}
const isScalar=(schema:z.ZodTypeAny)=>!(unwrap(schema) instanceof z.ZodArray||unwrap(schema) instanceof z.ZodObject)
// Campos obrigatórios exceto listas (itens e parcelas são montados pelo modelo a partir da conversa).
export function missingFields(kind:Proposal['tipo'],dados:unknown) {
  const values=(dados&&typeof dados==='object'&&!Array.isArray(dados)?dados:{}) as Record<string,unknown>
  return Object.entries(dataShape(kind)).filter(([key,schema])=>isScalar(schema)&&!schema.isOptional()&&(values[key]===undefined||values[key]===''||values[key]===null)).map(([key])=>key)
}

async function options(module:ErpConnectedModuleId,company:PluginCompany,principal:PluginPrincipal,deps:ExecutionDependencies) {
  const needed=module==='contas-financeiras'?['erp.cadastros.visualizar','erp.financeiro.visualizar']:['erp.cadastros.visualizar']
  if(!needed.every(capability=>company.capabilities.includes(capability as never)))return null
  const page=await runWithErpDatabaseContext({tenantId:company.id,userId:principal.userId,readOnly:true,statementTimeoutMs:10000,timeZone:company.timeZone},
    ()=>deps.queries.page(company.id,module,{page:1,pageSize:MAX_OPTIONS,filters:{status:'ativo'}})) as {records:{id:unknown;nome?:unknown}[];total?:unknown}
  // Acima do limite a lista ficaria incompleta; o campo vira ID e o modelo busca pelo nome.
  if(Number(page.total??0)>MAX_OPTIONS||!page.records.length)return null
  return page.records.map(row=>({const:String(row.id),title:String(row.nome??`#${row.id}`)}))
}
export async function buildForm(action:ActionDefinition,kind:Proposal['tipo'],dados:Record<string,unknown>,company:PluginCompany,
  principal:PluginPrincipal,deps:ExecutionDependencies):Promise<OpenAIForm> {
  const properties:Record<string,OpenAIFormField>={},required:string[]=[]
  const tipo=kind.replace(/^(editar|excluir)_/,'')
  for(const [key,schema] of Object.entries(dataShape(kind))){
    if(!isScalar(schema))continue
    const base=unwrap(schema),title=fieldLabels[key]||key.replaceAll('_',' '),current=dados[key]
    const module=references[key]||(key==='registro_id'&&action.name.endsWith('_cadastro')?registrationModules[tipo]:undefined)
    const choices=module?await options(module,company,principal,deps):null
    let field:OpenAIFormField
    if(choices)field={type:'string',title,oneOf:choices,...(current!==undefined&&choices.some(c=>c.const===String(current))?{default:String(current)}:{})}
    else if(base instanceof z.ZodEnum)field={type:'string',title,oneOf:(base.options as string[]).map(value=>({const:value,title:valueLabels[value]||value})),
      ...(typeof current==='string'?{default:current}:{})}
    else if(base instanceof z.ZodBoolean)field={type:'boolean',title,...(typeof current==='boolean'?{default:current}:{})}
    else if(base instanceof z.ZodNumber)field=key.endsWith('_id')
      ?{type:'integer',title,minimum:1,maximum:Number.MAX_SAFE_INTEGER,description:'ID retornado pelas consultas desta empresa.',...(typeof current==='number'?{default:current}:{})}
      :{type:'number',title,minimum:0,maximum:100000000,...(typeof current==='number'?{default:current}:{})}
    else field={type:'string',title,...(key.startsWith('data_')?{format:'date'}:key==='email'?{format:'email',maxLength:254}:{maxLength:key==='motivo'?1000:['descricao','observacoes'].includes(key)?2000:200}),
      ...(typeof current==='string'?{default:current}:{})}
    properties[key]=field
    if(!schema.isOptional())required.push(key)
  }
  return {type:'object',properties,required}
}

// Converte respostas do formulário (IDs chegam como texto nas listas) para os tipos da proposta.
function convert(kind:Proposal['tipo'],content:Record<string,unknown>) {
  const shape=dataShape(kind),values:Record<string,unknown>={}
  for(const [key,value] of Object.entries(content)){
    if(value===''||value===undefined)continue
    values[key]=unwrap(shape[key]) instanceof z.ZodNumber&&typeof value==='string'?Number(value):value
  }
  return values
}
function canonical(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
  if(value&&typeof value==='object')return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}'
  return JSON.stringify(value)
}
function digest(tool:string,args:unknown,company:number,p:PluginPrincipal,c:PluginConfig) {
  return createHash('sha256').update(canonical({tool,args,company,user:p.userId,subject:p.clerkUserId,client:p.clientId,resource:c.resource})).digest('hex')
}
function key(config:PluginConfig) {
  const value=config.nativeFormKey
  if(!value||!/^[A-Za-z0-9+/]{43}=$/.test(value)||Buffer.from(value,'base64').length!==32)
    throw new PluginError('CONFIGURATION_REQUIRED','Configure a chave de continuidade dos formulários nativos.',503)
  return Buffer.from(value,'base64')
}
export function nativeFormKeyReady(config:PluginConfig):boolean {try{key(config);return true}catch{return false}}
const AAD=Buffer.from('chatgptplugin/native-form/v2')
function seal(payload:object,config:PluginConfig) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(config),iv)
  cipher.setAAD(AAD)
  return Buffer.concat([iv,cipher.update(JSON.stringify(payload)),cipher.final(),cipher.getAuthTag()]).toString('base64url')
}
const stateSchema=z.object({digest:z.string().length(64),expires:z.number().int(),originId:z.union([z.string(),z.number()])}).strict()
function unseal(value:unknown,config:PluginConfig) {
  const secret=key(config)
  try {
    if(typeof value!=='string'||value.length>2048||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error()
    const blob=Buffer.from(value,'base64url'),decipher=createDecipheriv('aes-256-gcm',secret,blob.subarray(0,12))
    decipher.setAAD(AAD);decipher.setAuthTag(blob.subarray(-16))
    return stateSchema.parse(JSON.parse(Buffer.concat([decipher.update(blob.subarray(12,-16)),decipher.final()]).toString('utf8')))
  } catch {throw new PluginError('INVALID_REQUEST_STATE','Formulário inválido ou expirado. Peça a prévia novamente.')}
}

export type FormStep = {resultType:'input_required';requestState:string;inputRequests:Record<string,unknown>} | (CallToolResult & {resultType:'complete'})
/** Retorna null quando a chamada não precisa de formulário e deve seguir o fluxo normal. */
export async function nativeFormStep(params:Record<string,unknown>,id:string|number,principal:PluginPrincipal,config:PluginConfig,
  deps:ExecutionDependencies):Promise<FormStep|null> {
  const action=actionTools.find(tool=>tool.name===params.name)
  const continuing=params.requestState!==undefined||params.inputResponses!==undefined
  if(!action)return null
  const args=(params.arguments&&typeof params.arguments==='object'&&!Array.isArray(params.arguments)?params.arguments:{}) as Record<string,unknown>
  const kind=action.kindFor(args)
  if(!continuing&&(args.rascunho_id!==undefined||!kind||!missingFields(kind,args.dados).length))return null
  if(!kind)throw new PluginError('INVALID_INPUT','Informe o tipo da operação.')
  const company=selectCompany(principal,args.empresa_id as number|undefined)
  if(!principal.scopes.includes('erp:write'))throw new PluginError('INSUFFICIENT_SCOPE','A conexão precisa da permissão erp:write para alterar dados.',403)
  const {OpenAIFormSchema,OpenAIFormResultSchema,createOpenAIFormContentSchema}=await import('@openai/mcp-extensions/server')
  const dados=(args.dados&&typeof args.dados==='object'?args.dados:{}) as Record<string,unknown>
  const form=OpenAIFormSchema.parse(await buildForm(action,kind,dados,company,principal,deps)),hash=digest(action.name,args,company.id,principal,config)
  const state=params.requestState===undefined?undefined:unseal(params.requestState,config)
  if(continuing&&!state)throw new PluginError('INVALID_REQUEST_STATE','Formulário inválido ou expirado. Peça a prévia novamente.')
  if(state&&(state.digest!==hash||state.expires<=Date.now()||state.originId===id))throw new PluginError('INVALID_REQUEST_STATE','Formulário inválido ou expirado. Peça a prévia novamente.')
  const responses=params.inputResponses
  if(responses!==undefined&&(!responses||typeof responses!=='object'||Array.isArray(responses)))throw new PluginError('INVALID_INPUT','Resposta de formulário inválida.')
  const answer=(responses as Record<string,unknown>|undefined)?.dados
  if(answer===undefined){
    // Pedir o formulário também fica registrado na auditoria, sem dados do usuário.
    const audit=await deps.reserve(principal,action.name,company.id,config.integration)
    await deps.finish(audit,'succeeded',null,0,config.integration)
    const requestState=state?String(params.requestState):seal({digest:hash,expires:Date.now()+FORM_TTL_MS,originId:id},config)
    return {resultType:'input_required',requestState,inputRequests:{dados:{method:'openai/elicitation/create',params:{mode:'form',
      message:`${operationLabels[kind]||action.title} · ${company.name}. Enviar gera uma prévia; nada muda no ERP até você confirmar.`,requestedSchema:form}}}}
  }
  const result=OpenAIFormResultSchema.safeParse(answer)
  if(!result.success)throw new PluginError('INVALID_INPUT','Resposta de formulário inválida.')
  if(result.data.action!=='accept')
    return {resultType:'complete',isError:true,content:[{type:'text',text:JSON.stringify({ok:false,code:'FORM_CANCELLED',message:'O usuário fechou o formulário. Nenhuma prévia foi criada.'})}]}
  const content=result.data.content
  if(Object.keys(content).some(field=>!Object.hasOwn(form.properties,field))||!createOpenAIFormContentSchema(form).safeParse(content).success)
    throw new PluginError('INVALID_INPUT','Confira os campos obrigatórios e os valores do formulário.')
  const merged={...args,dados:{...dados,...convert(kind,content)}}
  return {...await executeTool(principal,action.name,merged,config,deps),resultType:'complete'}
}
