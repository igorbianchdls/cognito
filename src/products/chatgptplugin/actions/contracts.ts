import { z } from 'zod'
import { lineTotal, sumMoney } from '@/products/erp/shared/erpMoney'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { companySchema, requiredDate } from '../tools/catalog'
import { PluginError } from '../shared/contracts'

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
  z.object({tipo:z.literal('cliente'),dados:z.object({nome:name,tipo:z.enum(['fisica','juridica']).default('fisica'),
    email:z.string().email().max(254).optional(),telefone:z.string().trim().max(30).optional(),cidade:z.string().trim().max(100).optional()}).strict()}).strict(),
  z.object({tipo:z.literal('produto'),dados:z.object({nome:name,sku:z.string().trim().max(60).optional(),preco:money,
    controla_estoque:z.enum(['sim','nao']).default('sim')}).strict()}).strict(),
  z.object({tipo:z.literal('orcamento'),dados:commercial}).strict(),
  z.object({tipo:z.literal('venda'),dados:commercial}).strict(),
  z.object({tipo:z.literal('editar_cliente'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    tipo:z.enum(['fisica','juridica']).optional(),documento:z.string().trim().max(30).optional(),status:z.enum(['ativo','inativo']).optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteracao.')}).strict(),
  z.object({tipo:z.literal('editar_produto'),dados:z.object({registro_id:z.number().int().positive(),nome:name.optional(),
    sku:z.string().trim().max(60).optional(),preco:money.optional(),controla_estoque:z.enum(['sim','nao']).optional(),status:z.enum(['ativo','pausado']).optional()}).strict()
    .refine(d=>Object.keys(d).length>1,'Informe ao menos uma alteracao.')}).strict(),
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
  if (['cliente','produto','editar_cliente','editar_produto'].includes(proposal.tipo)) return 'erp.cadastros.gerenciar'
  if (proposal.tipo.endsWith('_compra')) return 'erp.compras.gerenciar'
  if (proposal.tipo === 'receber_parcela' || proposal.tipo === 'pagar_parcela') return 'erp.financeiro.baixar'
  if (proposal.tipo === 'estornar_pagamento') return 'erp.financeiro.estornar'
  if (proposal.tipo === 'atender_venda') return 'erp.estoque.movimentar'
  return 'erp.vendas.gerenciar'
}
export function proposalCapabilities(proposal:Proposal):ErpCapability[] {
  return proposal.tipo === 'atender_venda' ? [proposalCapability(proposal),'erp.vendas.gerenciar'] : [proposalCapability(proposal)]
}
export function proposalEntity(proposal: Proposal): ErpConnectedModuleId {
  return proposal.tipo === 'cliente' ? 'clientes' : proposal.tipo === 'produto' ? 'produtos' : 'pedidos'
}
export function proposalPreview(proposal: Proposal) {
  if (proposal.tipo !== 'orcamento' && proposal.tipo !== 'venda') return {tipo:proposal.tipo,dados:proposal.dados}
  try {
    const itens = proposal.dados.itens.map(item => ({...item,total:lineTotal(item.quantidade,item.valor_unitario,item.desconto)}))
    const total = sumMoney(itens.map(item => item.total))
    if (total <= 0) throw new Error('Invalid total')
    return {tipo:proposal.tipo,dados:{...proposal.dados,itens},total}
  } catch { throw new PluginError('INVALID_INPUT','Confira quantidades, precos e descontos dos itens.') }
}
export function proposalValues(proposal: Proposal): Record<string, unknown> {
  return {...proposal.dados,...(proposal.tipo === 'cliente' || proposal.tipo === 'produto'
    ? {status:'ativo'} : {tipo_documento:proposal.tipo,status:'rascunho'})}
}
