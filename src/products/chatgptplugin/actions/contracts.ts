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
])
export type Proposal = z.infer<typeof proposalSchema>
export const prepareSchema = z.object({empresa_id:companySchema,chave_operacao:z.string().uuid(),proposta:proposalSchema}).strict()
export const draftSchema = z.object({empresa_id:companySchema,rascunho_id:z.string().uuid()}).strict()
export const draftsSchema = z.object({empresa_id:companySchema,pagina:z.number().int().min(1).max(10000).default(1),por_pagina:z.number().int().min(10).max(50).default(20)}).strict()
export function proposalCapability(proposal: Proposal): ErpCapability {
  return ['cliente','produto'].includes(proposal.tipo) ? 'erp.cadastros.gerenciar' : 'erp.vendas.gerenciar'
}
export function proposalEntity(proposal: Proposal): ErpConnectedModuleId {
  return proposal.tipo === 'cliente' ? 'clientes' : proposal.tipo === 'produto' ? 'produtos' : 'pedidos'
}
export function proposalPreview(proposal: Proposal) {
  if (proposal.tipo === 'cliente' || proposal.tipo === 'produto') return {tipo:proposal.tipo,dados:proposal.dados}
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
