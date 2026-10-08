import { z } from 'zod'

// Contratos da Fase 1 (tabelas de preço, comissões) usados pela API e pelo chat.
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato AAAA-MM-DD.')
const optionalDate = date.nullable().optional()
const id = z.number().int().positive()

export const priceTableItemSchema = z.object({
  tipo: z.enum(['produto', 'servico']).default('produto'),
  item_id: id,
  preco: z.number().min(0).max(1e12),
  preco_minimo: z.number().min(0).max(1e12).nullable().optional(),
  desconto_maximo_percentual: z.number().min(0).max(100).nullable().optional(),
  quantidade_minima: z.number().positive().max(1e9).default(1),
}).strict().refine(item => item.preco_minimo == null || item.preco_minimo <= item.preco, { message: 'Preço mínimo acima do preço da tabela.', path: ['preco_minimo'] })

export const priceTableSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().trim().max(500).nullable().optional(),
  padrao: z.boolean().default(false),
  ativo: z.boolean().default(true),
  vigencia_inicio: optionalDate,
  vigencia_fim: optionalDate,
  itens: z.array(priceTableItemSchema).max(2000).default([]),
}).strict().refine(v => !v.vigencia_inicio || !v.vigencia_fim || v.vigencia_fim >= v.vigencia_inicio, { message: 'Fim da vigência antes do início.', path: ['vigencia_fim'] })
export type PriceTableValues = z.infer<typeof priceTableSchema>

export const commissionRuleSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  vendedor_id: id.nullable().optional(),
  produto_id: id.nullable().optional(),
  servico_id: id.nullable().optional(),
  categoria_id: id.nullable().optional(),
  percentual: z.number().gt(0).max(100),
  base: z.enum(['faturamento', 'recebimento']).default('faturamento'),
  ativo: z.boolean().default(true),
  vigencia_inicio: optionalDate,
  vigencia_fim: optionalDate,
}).strict().refine(v => [v.produto_id, v.servico_id, v.categoria_id].filter(x => x != null).length <= 1,
  { message: 'A regra vale para um produto, um serviço ou uma categoria (no máximo um).', path: ['produto_id'] })
export type CommissionRuleValues = z.infer<typeof commissionRuleSchema>

export const commissionReportSchema = z.object({
  inicio: date, fim: date, vendedor_id: id.optional(),
  pagina: z.number().int().min(1).max(10000).default(1), por_pagina: z.number().int().min(10).max(100).default(50),
}).strict()

export const commissionPaymentSchema = z.object({
  vendedor_id: id,
  ate: date,
  categoria_id: id,
  data_vencimento: date,
  conta_financeira_id: id.nullable().optional(),
}).strict()
export type CommissionPaymentValues = z.infer<typeof commissionPaymentSchema>

export const saleReturnSchema = z.object({
  tratamento: z.enum(['abater', 'credito', 'reembolso']),
  motivo: z.string().trim().min(3).max(1000),
  data_devolucao: date.optional(),
  itens: z.array(z.object({ venda_item_id: id, quantidade: z.number().positive().max(1e9) }).strict()).min(1).max(100),
  // Só para reembolso: conta a pagar ao cliente.
  categoria_id: id.optional(),
  data_vencimento: date.optional(),
  conta_financeira_id: id.nullable().optional(),
}).strict().refine(v => v.tratamento !== 'reembolso' || (v.categoria_id && v.data_vencimento),
  { message: 'Reembolso exige categoria (despesa) e vencimento.', path: ['categoria_id'] })
  .refine(v => new Set(v.itens.map(i => i.venda_item_id)).size === v.itens.length, { message: 'Item repetido na devolução.', path: ['itens'] })
export type SaleReturnValues = z.infer<typeof saleReturnSchema>

export const creditUseSchema = z.object({
  parcela_id: id,
  valor: z.number().positive().max(1e12).multipleOf(0.01),
  data: date.optional(),
}).strict()
export type CreditUseValues = z.infer<typeof creditUseSchema>
