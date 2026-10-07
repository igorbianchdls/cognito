import { z } from 'zod'
import { lineTotal, sumMoney } from '@/products/erp/shared/erpMoney'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { companySchema, requiredDate } from '../tools/catalog'
import { PluginError } from '../shared/contracts'
import { expandedSchemas } from './expandedContracts'
import {serviceInvoiceInputSchema,simulationScenarioSchema,serviceInvoiceTotals} from '@/products/erp/shared/serviceInvoiceContracts'

const name = z.string().trim().min(1).max(200)
const money = z.number().finite().min(0).max(100000000).multipleOf(0.01)
const commercial = z.object({
  cliente_id:z.number().int().positive(), data_venda:requiredDate, data_vencimento:requiredDate,
  itens:z.array(z.object({tipo:z.enum(['produto','servico']),item_id:z.number().int().positive(),
    quantidade:z.number().finite().positive().max(100000).multipleOf(0.0001),
    valor_unitario:money.refine(v => v > 0),desconto:money.default(0)}).strict()).min(1).max(50),
  observacoes:z.string().trim().max(2000).optional(),
}).strict()
export const proposalSchema = z.discriminatedUnion('tipo', [
  z.object({tipo:z.literal('nota_servico'),dados:serviceInvoiceInputSchema}).strict(),
  z.object({tipo:z.literal('editar_nota_servico'),dados:serviceInvoiceInputSchema.extend({registro_id:z.number().int().positive()}).strict()}).strict(),
  z.object({tipo:z.literal('simular_nota_servico'),dados:z.object({registro_id:z.number().int().positive(),cenario:simulationScenarioSchema.default('sucesso')}).strict()}).strict(),
  z.object({tipo:z.literal('consultar_resultado_nota_servico'),dados:z.object({registro_id:z.number().int().positive()}).strict()}).strict(),
  ...(['cancelar_nota_servico','excluir_nota_servico'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict()),
  ...expandedSchemas,
  z.object({tipo:z.literal('cliente'),dados:z.object({nome:name,tipo:z.enum(['fisica','juridica']).default('fisica'),
    email:z.string().email().max(254).optional(),telefone:z.string().trim().max(30).optional(),cidade:z.string().trim().max(100).optional()}).strict()}).strict(),
  z.object({tipo:z.literal('produto'),dados:z.object({nome:name,sku:z.string().trim().max(60).optional(),preco:money,
    controla_estoque:z.enum(['sim','nao']).default('sim')}).strict()}).strict(),
  z.object({tipo:z.literal('orcamento'),dados:commercial}).strict(),
  z.object({tipo:z.literal('venda'),dados:commercial}).strict(),
  z.object({tipo:z.literal('editar_cliente'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    tipo:z.enum(['fisica','juridica']).optional(),documento:z.string().trim().max(30).optional(),status:z.enum(['ativo','inativo']).optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')}).strict(),
  z.object({tipo:z.literal('editar_produto'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    sku:z.string().trim().max(60).optional(),preco:money.optional(),controla_estoque:z.enum(['sim','nao']).optional(),status:z.enum(['ativo','pausado']).optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteração.')}).strict(),
  ...(['confirmar_venda','confirmar_compra','cancelar_compra','atender_venda'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive()}).strict()}).strict()),
  z.object({tipo:z.literal('cancelar_venda'),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict(),
  ...(['receber_parcela','pagar_parcela'] as const).map(tipo=>z.object({tipo:z.literal(tipo),dados:z.object({registro_id:z.number().int().positive(),
    valor:money.refine(v=>v>0),data_pagamento:requiredDate,conta_financeira_id:z.number().int().positive()}).strict()}).strict()),
  z.object({tipo:z.literal('estornar_pagamento'),dados:z.object({registro_id:z.number().int().positive(),motivo:z.string().trim().min(3).max(1000)}).strict()}).strict(),
])
export type Proposal = z.infer<typeof proposalSchema>
export const prepareSchema = z.object({empresa_id:companySchema,chave_operacao:z.string().uuid(),proposta:proposalSchema}).strict()
export const draftSchema = z.object({empresa_id:companySchema,rascunho_id:z.string().uuid()}).strict()
export const draftsSchema = z.object({empresa_id:companySchema,pagina:z.number().int().min(1).max(10000).default(1),por_pagina:z.number().int().min(10).max(50).default(20)}).strict()
export function proposalCapability(proposal: Proposal): ErpCapability {
  if(proposal.tipo.includes('conta_pagar')||proposal.tipo.includes('conta_receber')||proposal.tipo.includes('conta_financeira'))return 'erp.financeiro.gerenciar'
  if(['fornecedor','vendedor','servico','categoria','excluir_cliente','excluir_produto'].includes(proposal.tipo)||/^(editar|excluir)_(fornecedor|vendedor|servico|categoria)$/.test(proposal.tipo))return 'erp.cadastros.gerenciar'
  if(proposal.tipo==='compra')return 'erp.compras.gerenciar'
  if (['cliente','produto','editar_cliente','editar_produto'].includes(proposal.tipo)) return 'erp.cadastros.gerenciar'
  if (proposal.tipo.endsWith('_compra')) return 'erp.compras.gerenciar'
  if (proposal.tipo === 'receber_parcela' || proposal.tipo === 'pagar_parcela') return 'erp.financeiro.baixar'
  if (proposal.tipo === 'estornar_pagamento') return 'erp.financeiro.estornar'
  if (proposal.tipo === 'atender_venda') return 'erp.estoque.movimentar'
  return 'erp.vendas.gerenciar'
}
export function proposalCapabilities(proposal:Proposal):ErpCapability[] {
  if(['excluir_venda','excluir_orcamento','excluir_compra'].includes(proposal.tipo))return [proposalCapability(proposal),'erp.financeiro.visualizar','erp.estoque.visualizar']
  if(/^excluir_(cliente|fornecedor|vendedor|produto|servico|categoria|conta_financeira)$/.test(proposal.tipo))return [proposalCapability(proposal),'erp.cadastros.gerenciar','erp.vendas.visualizar','erp.compras.visualizar','erp.financeiro.visualizar','erp.estoque.visualizar']
  if(proposal.tipo.includes('conta_financeira'))return ['erp.financeiro.gerenciar','erp.cadastros.gerenciar']
  return proposal.tipo === 'atender_venda' ? [proposalCapability(proposal),'erp.vendas.gerenciar'] : [proposalCapability(proposal)]
}
export function proposalEntity(proposal: Proposal): ErpConnectedModuleId {
  const mapping:Partial<Record<Proposal['tipo'],ErpConnectedModuleId>>={fornecedor:'fornecedores',vendedor:'vendedores',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras',compra:'pedidos-compra',conta_pagar:'contas-a-pagar',conta_receber:'contas-a-receber'}
  if(mapping[proposal.tipo])return mapping[proposal.tipo]!
  return proposal.tipo === 'cliente' ? 'clientes' : proposal.tipo === 'produto' ? 'produtos' : 'pedidos'
}
export function proposalPreview(proposal: Proposal) {
  if(proposal.tipo==='nota_servico'||proposal.tipo==='editar_nota_servico'){
    const {registro_id:_id,...raw}=proposal.dados as Record<string,unknown>
    const totals=serviceInvoiceTotals(serviceInvoiceInputSchema.parse(raw))
    return {tipo:proposal.tipo,dados:{...proposal.dados,itens:totals.items},total:totals.total,modo_operacao:'simulacao',valor_iss:totals.valor_iss,valor_liquido:totals.valor_liquido}
  }
  const raw=proposal.dados as Record<string,unknown>
  if('parcelas' in raw){try{const parts=raw.parcelas as {valor:number}[];if(sumMoney(parts.map(p=>p.valor))!==raw.valor_total)throw new Error();return {tipo:proposal.tipo,dados:proposal.dados,total:Number(raw.valor_total)}}catch{throw new PluginError('INVALID_INPUT','A soma das parcelas deve ser igual ao valor total.')}}
  if (!('itens' in raw)) return {tipo:proposal.tipo,dados:proposal.dados}
  try {
    const itens = (raw.itens as {quantidade:number;valor_unitario:number;desconto:number}[]).map(item => ({...item,total:lineTotal(item.quantidade,item.valor_unitario,item.desconto)}))
    const total = sumMoney(itens.map(item => item.total))
    if (total <= 0) throw new Error('Invalid total')
    return {tipo:proposal.tipo,dados:{...proposal.dados,itens},total}
  } catch { throw new PluginError('INVALID_INPUT','Confira quantidades, preços e descontos dos itens.') }
}
export function purchaseValues(values:Record<string,unknown>):Record<string,unknown>{
  return {...values,itens:(values.itens as {tipo:string;item_id:number;desconto:number}[]).map(item=>({...item,[item.tipo==='produto'?'produto_id':'servico_id']:item.item_id,valor_desconto:item.desconto}))}
}
export function proposalValues(proposal: Proposal): Record<string, unknown> {
  if(proposal.tipo==='compra')return {...purchaseValues(proposal.dados),tipo_movimento:'cotacao',gera_financeiro:true,status:'rascunho'}
  if(['fornecedor','vendedor'].includes(proposal.tipo)){const d=proposal.dados as Record<string,unknown>;return {...d,status:'ativo',...(d.email||d.telefone?{contatos:[{nome:d.nome,email:d.email||'',telefone:d.telefone||'',finalidades:['comercial'],principais:['comercial']}]}:{})}}
  if(['servico','categoria','conta_financeira'].includes(proposal.tipo))return {...proposal.dados,status:'ativo'}
  return {...proposal.dados,...(proposal.tipo === 'cliente' || proposal.tipo === 'produto'
    ? {status:'ativo'} : {tipo_documento:proposal.tipo,status:'rascunho'})}
}
