import { z } from 'zod'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { proposalSchema,proposalCapabilities,type Proposal } from './contracts'
import type { ActionDependencies } from './dependencies'
import { companySchema } from '../tools/catalog'
import { PluginError,type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type ActionDefinition = {name:string;title:string;description:string;schema:z.AnyZodObject;write:true;destructive:boolean;
  kinds:readonly Proposal['tipo'][];
  kindFor:(input:Record<string,unknown>) => Proposal['tipo']|undefined;
  requiredCapabilities:(input:Record<string,unknown>) => ErpCapability[];
  execute:(deps:ActionDependencies,principal:PluginPrincipal,id:number,input:Record<string,unknown>,config:PluginConfig) => Promise<unknown>}

// Cada tool cobre uma ação; o parâmetro tipo escolhe apenas o objeto (ex.: venda ou orçamento).
type Spec = {name:string;title:string;destructive:boolean;use:string;avoid:string;types?:Record<string,Proposal['tipo']>;kind?:Proposal['tipo']}
const registrations = ['cliente','fornecedor','vendedor','produto','servico','categoria','conta_financeira'] as const
const byRegistration = (prefix:string) => Object.fromEntries(registrations.map(t => [t,`${prefix}${t}`])) as Record<string,Proposal['tipo']>
const specs: Spec[] = [
  {name:'criar_cadastro',title:'Criar cadastro',destructive:false,types:byRegistration(''),
    use:'Use quando o usuário quiser cadastrar cliente, fornecedor, vendedor, produto, serviço, categoria ou conta financeira.',avoid:'Não use para alterar um cadastro existente (editar_cadastro).'},
  {name:'editar_cadastro',title:'Editar cadastro',destructive:false,types:byRegistration('editar_'),
    use:'Use quando o usuário quiser alterar campos de um cadastro existente. Envie registro_id e somente os campos alterados.',avoid:'Não use para criar (criar_cadastro) nem para excluir (excluir_cadastro).'},
  {name:'excluir_cadastro',title:'Excluir cadastro',destructive:true,types:byRegistration('excluir_'),
    use:'Use quando o usuário pedir para excluir um cadastro sem vínculos ou histórico. Exige motivo.',avoid:'Não use para inativar um cadastro com histórico (editar_cadastro com status inativo).'},
  {name:'criar_venda',title:'Criar venda ou orçamento',destructive:false,types:{venda:'venda',orcamento:'orcamento'},
    use:'Use quando o usuário quiser registrar uma venda ou um orçamento. O documento é criado em rascunho comercial.',avoid:'Não use para confirmar a venda (confirmar_venda).'},
  {name:'editar_venda',title:'Editar venda ou orçamento',destructive:false,types:{venda:'editar_venda',orcamento:'editar_orcamento'},
    use:'Use para alterar uma venda ou orçamento em rascunho. Envie os dados completos e a lista nova de itens.',avoid:'Não use em documento confirmado ou com várias parcelas; nesses casos oriente o uso do ERP.'},
  {name:'excluir_venda',title:'Excluir venda ou orçamento',destructive:true,types:{venda:'excluir_venda',orcamento:'excluir_orcamento'},
    use:'Use para excluir uma venda ou orçamento em rascunho, sem efeitos financeiros, fiscais ou de estoque. Exige motivo.',avoid:'Não use para documento confirmado (cancelar_venda).'},
  {name:'confirmar_venda',title:'Confirmar venda',destructive:false,kind:'confirmar_venda',
    use:'Use quando o usuário quiser confirmar uma venda em rascunho, gerando os efeitos financeiros e de estoque previstos no ERP.',avoid:'Não use para orçamentos nem para dar saída no estoque (atender_venda).'},
  {name:'cancelar_venda',title:'Cancelar venda',destructive:true,kind:'cancelar_venda',
    use:'Use quando o usuário quiser cancelar uma venda confirmada. Exige motivo.',avoid:'Não use para rascunhos (excluir_venda).'},
  {name:'atender_venda',title:'Atender venda',destructive:false,kind:'atender_venda',
    use:'Use quando o usuário quiser registrar a saída de estoque de uma venda confirmada.',avoid:'Não emite nota fiscal.'},
  {name:'criar_compra',title:'Criar compra',destructive:false,kind:'compra',
    use:'Use quando o usuário quiser registrar uma compra de fornecedor. É criada como cotação em rascunho.',avoid:'Não use para confirmar a compra (confirmar_compra).'},
  {name:'editar_compra',title:'Editar compra',destructive:false,kind:'editar_compra',
    use:'Use para alterar uma compra em rascunho. Envie os dados completos e a lista nova de itens.',avoid:'Não use em compra confirmada ou com várias parcelas.'},
  {name:'excluir_compra',title:'Excluir compra',destructive:true,kind:'excluir_compra',
    use:'Use para excluir uma compra em rascunho, sem efeitos financeiros ou de estoque. Exige motivo.',avoid:'Não use para compra confirmada (cancelar_compra).'},
  {name:'confirmar_compra',title:'Confirmar compra',destructive:false,kind:'confirmar_compra',
    use:'Use quando o usuário quiser confirmar uma compra em rascunho, gerando títulos a pagar e recebimento de estoque conforme o ERP.',avoid:'Não use para criar a compra (criar_compra).'},
  {name:'cancelar_compra',title:'Cancelar compra',destructive:true,kind:'cancelar_compra',
    use:'Use quando o usuário quiser cancelar uma compra confirmada.',avoid:'Não use para rascunhos (excluir_compra).'},
  {name:'criar_titulo',title:'Criar conta a pagar ou receber',destructive:false,types:{pagar:'conta_pagar',receber:'conta_receber'},
    use:'Use quando o usuário quiser lançar uma conta a pagar ou a receber manual, com até 48 parcelas cuja soma é igual ao valor total.',avoid:'Não use para registrar um pagamento (registrar_baixa).'},
  {name:'editar_titulo',title:'Editar conta a pagar ou receber',destructive:false,types:{pagar:'editar_conta_pagar',receber:'editar_conta_receber'},
    use:'Use para alterar um título manual sem movimentações. Envie os dados completos do título (ID de obter_titulo_financeiro) e a lista nova de parcelas.',avoid:'Não use com ID de parcela nem em títulos gerados por venda, compra ou recorrência.'},
  {name:'excluir_titulo',title:'Excluir conta a pagar ou receber',destructive:true,types:{pagar:'excluir_conta_pagar',receber:'excluir_conta_receber'},
    use:'Use para excluir um título manual sem pagamentos, cobranças ou rateios. Exige motivo.',avoid:'Não use em títulos gerados por venda, compra ou recorrência.'},
  {name:'registrar_baixa',title:'Registrar pagamento ou recebimento',destructive:false,types:{pagar:'pagar_parcela',receber:'receber_parcela'},
    use:'Use quando o usuário informar que pagou ou recebeu uma parcela. Informe a parcela (consultar_financeiro), o valor, a data e a conta financeira (buscar_cadastros tipo contas-financeiras).',avoid:'Não use para desfazer um pagamento (estornar_pagamento).'},
  {name:'estornar_pagamento',title:'Estornar pagamento',destructive:true,kind:'estornar_pagamento',
    use:'Use quando o usuário quiser desfazer um pagamento ou recebimento registrado (ID de listar_pagamentos). Exige motivo.',avoid:'Não use para cancelar vendas ou compras.'},
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
  const schema=z.object({
    empresa_id:companySchema,
    ...(spec.types?{tipo:z.enum(typeNames).optional().describe('Objeto da operação. Obrigatório na prévia.')}:{}),
    chave_operacao:z.string().uuid().optional().describe('UUID gerado por você para a prévia. Repita o mesmo valor ao reenviar os mesmos dados; dados diferentes exigem nova chave.'),
    dados:dadosSchema(kinds).optional().describe('Dados da operação. Use IDs retornados pelas consultas desta empresa; não invente IDs, preços ou datas.'),
    rascunho_id:z.string().uuid().optional().describe('Somente para executar: ID da prévia aprovada pelo usuário. Envie sozinho, sem tipo, chave_operacao ou dados.'),
  }).strict()
  return {name:spec.name,title:spec.title,write:true,destructive:spec.destructive,kinds,schema,
    kindFor:input=>spec.kind || spec.types?.[String(input.tipo)],
    description:`${spec.use} ${spec.avoid} Funciona em duas etapas: 1) chame sem rascunho_id para gerar a prévia com os valores calculados pelo ERP e mostre-a ao usuário; 2) somente após confirmação explícita do usuário, chame de novo apenas com rascunho_id para executar.`,
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
