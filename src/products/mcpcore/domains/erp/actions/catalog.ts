import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { proposalSchema,proposalCapabilities,type Proposal } from '../schemas/actionContracts'
import type { ActionDependencies } from './dependencies'
import { companySchema } from '../tools/catalog'
import {toolDescription} from '../tools/descriptions'
import {documentInputSchema} from '../tools/inputDocumentation'
import { PluginError,type PluginPrincipal } from '../../../shared/contracts'
import type { PluginConfig } from '../../../shared/config'

export type ActionDefinition = {name:string;title:string;description:string;schema:z.AnyZodObject;write:true;destructive:boolean;
  kinds:readonly Proposal['tipo'][];
  kindFor:(input:Record<string,unknown>) => Proposal['tipo']|undefined;
  requiredCapabilities:(input:Record<string,unknown>) => ErpCapability[];
  execute:(deps:ActionDependencies,principal:PluginPrincipal,id:number,input:Record<string,unknown>,config:PluginConfig) => Promise<unknown>}

// Cada tool cobre uma ação; o parâmetro tipo escolhe apenas o objeto (ex.: venda ou orçamento).
type Spec = {name:string;title:string;destructive:boolean;types?:Record<string,Proposal['tipo']>;kind?:Proposal['tipo']}
const registrations = ['cliente','fornecedor','vendedor','produto','servico','categoria','conta_financeira'] as const
const byRegistration = (prefix:string) => Object.fromEntries(registrations.map(t => [t,`${prefix}${t}`])) as Record<string,Proposal['tipo']>
const specs: Spec[] = [
  {name:'alterar_contrato',title:'Suspender, retomar ou encerrar contrato',destructive:true,types:{suspender:'suspender_contrato',retomar:'retomar_contrato',encerrar:'encerrar_contrato'}},
  {name:'devolver_compra',title:'Devolver compra integral ao fornecedor',destructive:true,kind:'devolver_compra'},
  {name:'criar_ordem_servico',title:'Criar ordem de serviço',destructive:false,kind:'ordem_servico'},
  {name:'editar_ordem_servico',title:'Editar ordem de serviço',destructive:false,kind:'editar_ordem_servico'},
  {name:'alterar_ordem_servico',title:'Alterar situação da ordem de serviço',destructive:true,types:{aprovar:'aprovar_ordem_servico',iniciar:'iniciar_ordem_servico',concluir:'concluir_ordem_servico',cancelar:'cancelar_ordem_servico'}},
  {name:'converter_ordem_servico',title:'Gerar orçamento ou venda da ordem',destructive:false,types:{orcamento:'gerar_orcamento_os',venda:'gerar_venda_os'}},
  {name:'alterar_orcamento',title:'Alterar situação do orçamento',destructive:true,types:{enviar:'enviar_orcamento',aprovar:'aprovar_orcamento',recusar:'recusar_orcamento',cancelar:'cancelar_orcamento'}},
  {name:'arquivar_documento_comercial',title:'Arquivar PDF comercial',destructive:false,types:{orcamento:'arquivar_pdf_orcamento',ordem_servico:'arquivar_pdf_ordem_servico'}},
  {name:'criar_cadastro',title:'Criar cadastro',destructive:false,types:byRegistration('')},
  {name:'editar_cadastro',title:'Editar cadastro',destructive:false,types:byRegistration('editar_')},
  {name:'excluir_cadastro',title:'Excluir cadastro',destructive:true,types:byRegistration('excluir_')},
  {name:'criar_venda',title:'Criar venda ou orçamento',destructive:false,types:{venda:'venda',orcamento:'orcamento'}},
  {name:'editar_venda',title:'Editar venda ou orçamento',destructive:false,types:{venda:'editar_venda',orcamento:'editar_orcamento'}},
  {name:'excluir_venda',title:'Excluir venda ou orçamento',destructive:true,types:{venda:'excluir_venda',orcamento:'excluir_orcamento'}},
  {name:'converter_orcamento',title:'Converter orçamento em venda',destructive:false,kind:'converter_orcamento'},
  {name:'registrar_devolucao',title:'Registrar devolução de venda',destructive:true,kind:'devolucao_venda'},
  {name:'confirmar_venda',title:'Confirmar venda',destructive:false,kind:'confirmar_venda'},
  {name:'cancelar_venda',title:'Cancelar venda',destructive:true,kind:'cancelar_venda'},
  {name:'atender_venda',title:'Atender venda',destructive:false,kind:'atender_venda'},
  {name:'criar_compra',title:'Criar compra',destructive:false,kind:'compra'},
  {name:'editar_compra',title:'Editar compra',destructive:false,kind:'editar_compra'},
  {name:'excluir_compra',title:'Excluir compra',destructive:true,kind:'excluir_compra'},
  {name:'confirmar_compra',title:'Confirmar compra',destructive:false,kind:'confirmar_compra'},
  {name:'cancelar_compra',title:'Cancelar compra',destructive:true,kind:'cancelar_compra'},
  {name:'criar_titulo',title:'Criar conta a pagar ou receber',destructive:false,types:{pagar:'conta_pagar',receber:'conta_receber'}},
  {name:'efetivar_previsao',title:'Efetivar previsão',destructive:false,types:{pagar:'efetivar_conta_pagar',receber:'efetivar_conta_receber'}},
  {name:'editar_titulo',title:'Editar conta a pagar ou receber',destructive:false,types:{pagar:'editar_conta_pagar',receber:'editar_conta_receber'}},
  {name:'excluir_titulo',title:'Excluir conta a pagar ou receber',destructive:true,types:{pagar:'excluir_conta_pagar',receber:'excluir_conta_receber'}},
  {name:'registrar_baixa',title:'Registrar pagamento ou recebimento',destructive:false,types:{pagar:'pagar_parcela',receber:'receber_parcela'}},
  {name:'estornar_pagamento',title:'Estornar pagamento',destructive:true,kind:'estornar_pagamento'},
  // NFS-e simulada (sem validade fiscal): rascunho → emitir → (consultar) → cancelar; rascunho pode ser editado ou excluído.
  {name:'criar_nota_servico',title:'Criar nota de serviço',destructive:false,kind:'nota_servico'},
  {name:'editar_nota_servico',title:'Editar nota de serviço',destructive:false,kind:'editar_nota_servico'},
  {name:'emitir_nota_servico',title:'Emitir nota de serviço (simulação)',destructive:false,kind:'simular_nota_servico'},
  {name:'consultar_nota_servico',title:'Consultar retorno da nota de serviço',destructive:false,kind:'consultar_resultado_nota_servico'},
  {name:'cancelar_nota_servico',title:'Cancelar nota de serviço',destructive:true,kind:'cancelar_nota_servico'},
  {name:'excluir_nota_servico',title:'Excluir nota de serviço',destructive:true,kind:'excluir_nota_servico'},
]

// O SDK valida os argumentos antes do handler. Variantes diferentes são afrouxadas (sem defaults,
// sem strict) para que a primeira que casar não altere os dados; a validação exata vem depois.
function loosen(schema:z.ZodTypeAny):z.ZodTypeAny {
  if(schema instanceof z.ZodEffects)return loosen(schema.innerType())
  if(schema instanceof z.ZodDefault)return loosen(schema.removeDefault()).optional()
  if(schema instanceof z.ZodOptional)return loosen(schema.unwrap()).optional()
  if(schema instanceof z.ZodNullable)return loosen(schema.unwrap()).nullable()
  if(schema instanceof z.ZodArray)return z.array(loosen(schema.element))
  if(schema instanceof z.ZodObject)return z.object(Object.fromEntries(Object.entries(schema.shape as Record<string,z.ZodTypeAny>).map(([k,v])=>[k,loosen(v)]))).passthrough()
  return schema
}
const dataSchema = (kind:Proposal['tipo']) => proposalSchema.optionsMap.get(kind)!.shape.dados as z.ZodTypeAny
function dadosSchema(kinds:Proposal['tipo'][]):z.ZodTypeAny {
  const schemas=kinds.map(dataSchema)
  const same=schemas.every(s=>JSON.stringify(loosenedShape(s))===JSON.stringify(loosenedShape(schemas[0])))
  // A última opção aceita qualquer objeto: a mensagem genérica do SDK para uniões não diz o campo;
  // a validação exata do tipo escolhido devolve campos e motivos.
  return same ? schemas[0] : z.union([...schemas.map(loosen),z.record(z.unknown())] as unknown as [z.ZodTypeAny,z.ZodTypeAny,...z.ZodTypeAny[]])
}
function loosenedShape(schema:z.ZodTypeAny):unknown {
  const base=loosen(schema)
  return base instanceof z.ZodObject ? Object.fromEntries(Object.entries(base.shape as Record<string,z.ZodTypeAny>).map(([k,v])=>[k,v._def.typeName+(v instanceof z.ZodOptional?'?':'')])) : base._def.typeName
}
function issues(error:z.ZodError) {
  return error.issues.slice(0,8).map(issue=>({campo:issue.path.join('.')||'(dados)',motivo:issue.message}))
}
export function parseProposal(spec:{types?:Record<string,Proposal['tipo']>;kind?:Proposal['tipo']},input:Record<string,unknown>):Proposal {
  const kind=spec.kind || spec.types?.[String(input.tipo)]
  if(!kind)throw new PluginError('INVALID_INPUT',`Informe tipo: ${Object.keys(spec.types||{}).join(', ')}.`,400,undefined,[{campo:'tipo',motivo:'Obrigatório'}])
  const parsed=proposalSchema.safeParse({tipo:kind,dados:input.dados})
  if(!parsed.success){
    const fields=issues(parsed.error).map(item=>({...item,campo:item.campo.replace(/^dados\.?/,'dados.').replace(/\.$/,'')}))
    throw new PluginError('INVALID_INPUT','Confira os campos: '+fields.map(f=>`${f.campo} (${f.motivo})`).join('; '),400,undefined,fields)
  }
  return parsed.data
}
function previewOnly(input:Record<string,unknown>) {
  if(input.rascunho_id!==undefined)return null
  if(!input.chave_operacao||input.dados===undefined)throw new PluginError('INVALID_INPUT','Para a prévia, informe chave_operacao e dados.',400,undefined,
    [...(!input.chave_operacao?[{campo:'chave_operacao',motivo:'Obrigatório'}]:[]),...(input.dados===undefined?[{campo:'dados',motivo:'Obrigatório'}]:[])])
  return input
}
function definition(spec:Spec):ActionDefinition {
  const kinds=spec.kind?[spec.kind]:Object.values(spec.types!)
  const typeNames=Object.keys(spec.types||{}) as [string,...string[]]
  const schema=documentInputSchema(z.object({
    empresa_id:companySchema,
    ...(spec.types?{tipo:z.enum(typeNames).optional().describe('Objeto da operação. Obrigatório na prévia.')}:{}),
    chave_operacao:z.string().uuid().optional().describe('UUID gerado por você para a prévia. Repita o mesmo valor ao reenviar os mesmos dados; dados diferentes exigem nova chave.'),
    dados:dadosSchema(kinds).optional().describe('Dados da operação. Use IDs retornados pelas consultas desta empresa; não invente IDs, preços ou datas.'),
    rascunho_id:z.string().uuid().optional().describe('Somente para executar: ID da prévia aprovada pelo usuário. Envie sozinho, sem tipo, chave_operacao ou dados.'),
  }).strict(),spec.name)
  return {name:spec.name,title:spec.title,write:true,destructive:spec.destructive,kinds,schema,
    kindFor:input=>spec.kind || spec.types?.[String(input.tipo)],
    description:`${toolDescription(spec.name)} Funciona em duas etapas: 1) envie empresa_id, chave_operacao UUID, dados e tipo quando aplicável, sem rascunho_id, para gerar a prévia com os valores calculados pelo ERP e mostre-a ao usuário; 2) somente após confirmação explícita do usuário, use confirmar.argumentos (empresa_id e rascunho_id) na mesma tool para executar. Somente status saved com registro_id confirma a execução; verifique a situação do registro de negócio na consulta correspondente.`,
    requiredCapabilities:input=>{
      // A execução revalida as permissões da proposta salva dentro da transação.
      if(!previewOnly(input))return []
      try{return proposalCapabilities(parseProposal(spec,input))}catch{return []}
    },
    execute:async(deps,principal,companyId,input,config)=>{
      if(input.rascunho_id!==undefined){
        if(input.tipo!==undefined||input.chave_operacao!==undefined||input.dados!==undefined)
          throw new PluginError('INVALID_INPUT','Para executar, envie somente empresa_id e rascunho_id.')
        const view=await deps.execute(principal,companyId,String(input.rascunho_id),kinds,spec.name,config)
        return {...view,etapa:'executado'}
      }
      previewOnly(input)
      const proposal=parseProposal(spec,input)
      const view=await runWithErpDatabaseContext({tenantId:companyId,userId:principal.userId,readOnly:true,statementTimeoutMs:10000,
        timeZone:principal.companies.find(item=>item.id===companyId)?.timeZone},
        ()=>deps.prepare(principal,companyId,String(input.chave_operacao),proposal,config))
      return {...view,etapa:'previa',confirmar:{tool:spec.name,argumentos:{empresa_id:companyId,rascunho_id:view.rascunho_id}}}
    }}
}
export const actionTools:ActionDefinition[] = specs.map(definition)
// Tool e argumentos que produzem uma proposta, usados por testes e formulários.
export function toolCallForProposal(proposal:{tipo:string;dados:unknown}):{name:string;arguments:Record<string,unknown>} {
  for(const spec of specs){
    if(spec.kind===proposal.tipo)return {name:spec.name,arguments:{dados:proposal.dados}}
    const tipo=Object.entries(spec.types||{}).find(([,kind])=>kind===proposal.tipo)?.[0]
    if(tipo)return {name:spec.name,arguments:{tipo,dados:proposal.dados}}
  }
  throw new PluginError('INVALID_INPUT',`Operação indisponível no chat: ${proposal.tipo}.`)
}
