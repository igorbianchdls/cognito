import { createCipheriv,createDecipheriv,createHash,randomBytes } from 'node:crypto'
import { z } from 'zod'
import type { OpenAIForm,OpenAIFormField } from '@openai/mcp-extensions/server'
import { proposalSchema,proposalCapabilities,type Proposal } from '../actions/contracts'
import { companySchema } from '../tools/catalog'
import { PluginError,selectCompany,type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import { executeTool,type ExecutionDependencies } from '../application/executeTool'
import { baseSchema,proposalFields,fieldLabels } from './proposalFields'

const legacyKinds=['cliente','produto','orcamento','venda','editar_cliente','editar_produto','confirmar_venda','confirmar_compra','cancelar_compra','atender_venda','cancelar_venda','receber_parcela','pagar_parcela','estornar_pagamento'] as const
export const proposalKinds=proposalSchema.options.map(option=>option.shape.tipo.value) as [Proposal['tipo'],...Proposal['tipo'][]]
export const nativeFormArgumentsSchema=z.object({empresa_id:companySchema,tipo:z.enum(proposalKinds),chave_operacao:z.string().uuid()}).strict()
type Arguments=z.infer<typeof nativeFormArgumentsSchema>
const text=(title:string,maxLength=200):OpenAIFormField=>({type:'string',title,maxLength})
const identifier=(title:string):OpenAIFormField=>({type:'integer',title,minimum:1,maximum:Number.MAX_SAFE_INTEGER})
const amount=(title:string):OpenAIFormField=>({type:'number',title,minimum:0,maximum:100000000})
const choice=(title:string,options:[string,string][]):OpenAIFormField=>({type:'string',title,oneOf:options.map(([value,label])=>({const:value,title:label}))})
const person=()=>choice('Tipo de pessoa',[['fisica','Pessoa física'],['juridica','Pessoa jurídica']])
const stock=()=>choice('Controlar estoque',[['sim','Sim'],['nao','Não']])
const date=(title:string):OpenAIFormField=>({type:'string',title,format:'date'})

export function nativeProposalForm(tipo:Arguments['tipo']):OpenAIForm {
  if(!(legacyKinds as readonly string[]).includes(tipo)){
    const shape=proposalFields(tipo),properties:Record<string,OpenAIFormField>={},required:string[]=[]
    for(const [field,schema] of Object.entries(shape)){
      const base=baseSchema(schema),label=fieldLabels[field]||field
      properties[field]=base instanceof z.ZodArray?{type:'string',title:label,minLength:2,maxLength:20000,description:field==='parcelas'?'Lista JSON com data_vencimento e valor. A soma deve ser igual ao valor_total.':'Lista JSON de itens com tipo, item_id, quantidade, valor_unitario e desconto.'}
        :base instanceof z.ZodEnum?choice(label,base.options.map((value:string)=>[value,value==='fisica'?'Pessoa física':value==='juridica'?'Pessoa jurídica':value]))
        :base instanceof z.ZodNumber?field.endsWith('_id')?identifier(label):amount(label)
        :field.startsWith('data_')?date(label):text(label,field==='motivo'?1000:field==='descricao'||field==='observacoes'?2000:200)
      if(!schema.isOptional())required.push(field)
    }
    return {type:'object',properties,required}
  }
  let properties:Record<string,OpenAIFormField>,required:string[]
  if(tipo==='cliente') {
    properties={nome:text('Nome'),tipo:person(),email:{type:'string',title:'E-mail',format:'email',maxLength:254},telefone:text('Telefone',30),cidade:text('Cidade',100)};required=['nome','tipo']
  } else if(tipo==='produto') {
    properties={nome:text('Nome'),sku:text('Código SKU',60),preco:amount('Preço'),controla_estoque:stock()};required=['nome','preco','controla_estoque']
  } else if(tipo==='venda'||tipo==='orcamento') {
    properties={cliente_id:identifier('ID do cliente'),data_venda:date('Data da venda'),data_vencimento:date('Vencimento'),
      itens:{type:'string',title:'Itens (JSON)',minLength:2,maxLength:20000,description:'Lista com tipo (produto/servico), item_id, quantidade, valor_unitario e desconto opcional. Use os IDs consultados nesta empresa.'},observacoes:text('Observações',2000)};required=['cliente_id','data_venda','data_vencimento','itens']
  } else {
    properties={registro_id:identifier('ID do registro nesta empresa')};required=['registro_id']
    if(tipo==='editar_cliente')Object.assign(properties,{nome:text('Novo nome'),tipo:person(),documento:text('Documento',30),status:choice('Status',[['ativo','Ativo'],['inativo','Inativo']])})
    if(tipo==='editar_produto')Object.assign(properties,{nome:text('Novo nome'),sku:text('Código SKU',60),preco:amount('Preço'),controla_estoque:stock(),status:choice('Status',[['ativo','Ativo'],['pausado','Pausado']])})
    if(tipo==='cancelar_venda'||tipo==='estornar_pagamento'){properties.motivo={type:'string',title:'Motivo',minLength:3,maxLength:1000};required.push('motivo')}
    if(tipo==='receber_parcela'||tipo==='pagar_parcela') {
      Object.assign(properties,{valor:amount('Valor da baixa'),data_pagamento:date('Data do pagamento'),conta_financeira_id:identifier('ID da conta financeira')})
      required.push('valor','data_pagamento','conta_financeira_id')
    }
  }
  return {type:'object',properties,required}
}
function canonical(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
  if(value&&typeof value==='object')return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}'
  return JSON.stringify(value)
}
function digest(args:Arguments,company:number,p:PluginPrincipal,c:PluginConfig) {
  return createHash('sha256').update(canonical({args,company,user:p.userId,subject:p.clerkUserId,client:p.clientId,resource:c.resource})).digest('hex')
}
function key(config:PluginConfig) {
  const value=config.nativeFormKey
  if(!value||!/^[A-Za-z0-9+/]{43}=$/.test(value)||Buffer.from(value,'base64').length!==32)
    throw new PluginError('CONFIGURATION_REQUIRED','Configure a chave de continuidade dos formulários nativos.',503)
  return Buffer.from(value,'base64')
}
export function nativeFormKeyReady(config:PluginConfig):boolean {try{key(config);return true}catch{return false}}
function seal(payload:object,config:PluginConfig) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(config),iv)
  cipher.setAAD(Buffer.from('chatgptplugin/native-form/v1'))
  return Buffer.concat([iv,cipher.update(JSON.stringify(payload)),cipher.final(),cipher.getAuthTag()]).toString('base64url')
}
const stateSchema=z.object({digest:z.string().length(64),expires:z.number().int(),originId:z.union([z.string(),z.number()])}).strict()
function unseal(value:unknown,config:PluginConfig) {
  const secret=key(config)
  try {
    if(typeof value!=='string'||value.length>2048||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error()
    const blob=Buffer.from(value,'base64url'),decipher=createDecipheriv('aes-256-gcm',secret,blob.subarray(0,12))
    decipher.setAAD(Buffer.from('chatgptplugin/native-form/v1'));decipher.setAuthTag(blob.subarray(-16))
    return stateSchema.parse(JSON.parse(Buffer.concat([decipher.update(blob.subarray(12,-16)),decipher.final()]).toString('utf8')))
  } catch {throw new PluginError('INVALID_REQUEST_STATE','Formulário inválido ou expirado. Abra uma nova proposta.')}
}
export async function handleNativeForm(params:Record<string,unknown>,id:string|number,principal:PluginPrincipal,config:PluginConfig,deps:ExecutionDependencies) {
  const parsed=nativeFormArgumentsSchema.safeParse(params.arguments)
  if(!parsed.success)throw new PluginError('INVALID_INPUT','Informe empresa, tipo de proposta e chave_operacao UUID válidos.')
  const args=parsed.data,company=selectCompany(principal,args.empresa_id)
  const audit=await deps.reserve(principal,'preparar_formulario_nativo',company.id),start=Date.now()
  try {
    if(!principal.scopes.includes('erp:write'))throw new PluginError('INSUFFICIENT_SCOPE','Propostas exigem erp:write.',403)
    if(proposalCapabilities({tipo:args.tipo} as Proposal).some(cap=>!company.capabilities.includes(cap)))throw new PluginError('ACCESS_DENIED','Sem permissão para esta proposta.',403)
    const {OpenAIFormSchema,OpenAIFormResultSchema,createOpenAIFormContentSchema}=await import('@openai/mcp-extensions/server')
    const form=OpenAIFormSchema.parse(nativeProposalForm(args.tipo)),hash=digest(args,company.id,principal,config)
    const state=params.requestState===undefined?undefined:unseal(params.requestState,config)
    if(state&&(state.digest!==hash||state.expires<=Date.now()||state.originId===id))throw new PluginError('INVALID_REQUEST_STATE','Formulário inválido ou expirado. Abra uma nova proposta.')
    if(params.inputResponses!==undefined&&(!state||!params.inputResponses||typeof params.inputResponses!=='object'||Array.isArray(params.inputResponses)))throw new PluginError('INVALID_INPUT','Resposta de formulário inválida.')
    const answer=(params.inputResponses as Record<string,unknown>|undefined)?.proposta
    if(answer===undefined) {
      const requestState=state?String(params.requestState):seal({digest:hash,expires:Date.now()+10*60*1000,originId:id},config)
      await deps.finish(audit,'succeeded',null,Date.now()-start)
      return {resultType:'input_required',requestState,inputRequests:{proposta:{method:'openai/elicitation/create',params:{mode:'form',
        message:`Empresa ${company.name} · ${args.tipo}. O envio prepara um rascunho; salvar exige revisão no ERP.`,requestedSchema:form}}}}
    }
    const result=OpenAIFormResultSchema.safeParse(answer)
    if(!result.success)throw new PluginError('INVALID_INPUT','Resposta de formulário inválida.')
    if(result.data.action!=='accept') {
      await deps.finish(audit,'succeeded',null,Date.now()-start)
      return {resultType:'complete',content:[{type:'text',text:'Formulário encerrado. Nenhuma proposta criada.'}],structuredContent:{ok:true,execution_id:audit,empresa_id:company.id,data:{cancelled:true}}}
    }
    const content=result.data.content
    if(Object.keys(content).some(field=>!Object.hasOwn(form.properties,field))||!createOpenAIFormContentSchema(form).safeParse(content).success)
      throw new PluginError('INVALID_INPUT','Confira os campos obrigatórios e os valores do formulário.')
    const data:Record<string,unknown>={...content}
    for(const field of ['itens','parcelas'])if(data[field]!==undefined){try{data[field]=JSON.parse(String(data[field]))}catch{throw new PluginError('INVALID_INPUT',field+' precisa ser uma lista JSON válida.')}}
    const proposal=proposalSchema.safeParse({tipo:args.tipo,dados:data})
    if(!proposal.success)throw new PluginError('INVALID_INPUT','Confira os campos, datas, valores e alterações da proposta.')
    const prepared=await executeTool(principal,'preparar_rascunho',{empresa_id:company.id,chave_operacao:args.chave_operacao,proposta:proposal.data},config,deps)
    await deps.finish(audit,prepared.isError?'failed':'succeeded',prepared.isError?'PREPARATION_FAILED':null,Date.now()-start)
    return {...prepared,resultType:'complete'}
  }catch(error){await deps.finish(audit,'failed',error instanceof PluginError?error.code:'FORM_UNAVAILABLE',Date.now()-start).catch(()=>undefined);throw error}
}
