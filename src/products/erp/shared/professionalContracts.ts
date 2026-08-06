import { z } from 'zod'

export const ERP_CAPABILITIES = [
  'erp.vendas.visualizar',
  'erp.vendas.gerenciar',
  'erp.compras.visualizar',
  'erp.compras.gerenciar',
  'erp.financeiro.visualizar',
  'erp.financeiro.gerenciar',
  'erp.financeiro.baixar',
  'erp.financeiro.estornar',
  'erp.estoque.visualizar',
  'erp.estoque.movimentar',
  'erp.estoque.ajustar',
  'erp.relatorios.visualizar',
  'erp.cadastros.visualizar',
  'erp.cadastros.gerenciar',
  'erp.configuracoes.gerenciar',
] as const

export type ErpCapability = (typeof ERP_CAPABILITIES)[number]
export type ErpAccessProfile = 'administrador' | 'financeiro' | 'vendas' | 'compras' | 'estoque' | 'consulta'

const id = z.coerce.number().int().positive()
const optionalId = z.union([id, z.literal(''), z.null()]).optional().transform((value) => value || null)
const money = z.coerce.number().finite().nonnegative()
const quantity = z.coerce.number().finite().positive()
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.')

export const serviceOrderItemSchema = z.object({
  tipo: z.enum(['produto', 'servico']),
  item_id: id,
  descricao: z.string().trim().min(1).max(500),
  quantidade: quantity,
  valor_unitario: money,
  desconto: money.default(0),
})

export const serviceOrderCreateSchema = z.object({
  cliente_id: id,
  responsavel_id: optionalId,
  numero: z.string().trim().max(60).optional(),
  status: z.enum(['rascunho', 'orcamento_pendente', 'aprovada', 'em_execucao']).default('rascunho'),
  data_inicio: isoDate,
  previsao_entrega: isoDate.optional().nullable(),
  equipamento: z.string().trim().max(200).optional().nullable(),
  marca: z.string().trim().max(120).optional().nullable(),
  modelo: z.string().trim().max(120).optional().nullable(),
  numero_serie: z.string().trim().max(120).optional().nullable(),
  problema_informado: z.string().trim().max(5000).optional().nullable(),
  diagnostico: z.string().trim().max(5000).optional().nullable(),
  observacoes_publicas: z.string().trim().max(5000).optional().nullable(),
  observacoes_internas: z.string().trim().max(5000).optional().nullable(),
  desconto: money.default(0),
  itens: z.array(serviceOrderItemSchema).min(1).max(100),
})

export const serviceOrderActionSchema = z.object({
  action: z.enum(['aprovar', 'iniciar', 'concluir', 'cancelar', 'gerar_orcamento', 'gerar_venda']),
  expectedVersion: z.coerce.number().int().positive(),
})

export const quoteConvertSchema = z.object({
  expectedVersion: z.coerce.number().int().positive(),
})

export const quoteActionSchema = z.object({
  action: z.enum(['enviar', 'aprovar', 'recusar', 'cancelar']),
  expectedVersion: z.coerce.number().int().positive(),
})

export const partialStockItemSchema = z.object({
  item_id: id,
  quantidade: quantity,
  local_estoque_id: optionalId,
})

export const partialStockActionSchema = z.object({
  items: z.array(partialStockItemSchema).min(1).max(100),
  data: isoDate.optional(),
  observacoes: z.string().trim().max(2000).optional().nullable(),
})

export const reconciliationRuleSchema = z.object({
  conta_financeira_id: optionalId,
  nome: z.string().trim().min(1).max(120),
  correspondencia_exata: z.boolean().default(true),
  correspondencia_aproximada: z.boolean().default(true),
  tolerancia_dias: z.coerce.number().int().min(0).max(30).default(5),
  tolerancia_valor: money.default(0),
})

export const automationRunSchema = z.object({
  tipo: z.enum(['contratos', 'recorrencias_financeiras', 'titulos_vencidos', 'indicadores', 'estoque_minimo']),
  competencia: isoDate.optional(),
})

export const periodCloseSchema = z.object({
  modulo: z.enum(['financeiro', 'estoque', 'vendas', 'compras', 'todos']),
  periodo_inicio: isoDate,
  periodo_fim: isoDate,
  motivo: z.string().trim().max(1000).optional().nullable(),
}).refine((value) => value.periodo_fim >= value.periodo_inicio, { message: 'Periodo final deve ser igual ou posterior ao inicial.' })

export const periodReopenSchema = z.object({ id: id })

export type ServiceOrderCreateInput = z.infer<typeof serviceOrderCreateSchema>
export type PartialStockActionInput = z.infer<typeof partialStockActionSchema>

export type FiscalPreflightIssue = {
  code: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

export type FiscalPreflightResult = {
  ready: boolean
  issues: FiscalPreflightIssue[]
}
