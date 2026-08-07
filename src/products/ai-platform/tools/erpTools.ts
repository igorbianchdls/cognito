import { z } from 'zod4'

import { createAiApproval, executeWithAiApproval } from '@/products/ai-platform/approvals/aiApprovalRepository'
import { defineAiTool, type AiToolDefinition } from '@/products/ai-platform/shared/types'
import { erpAiApplication, listErpCostCenters, saveErpCostCenter } from '@/products/erp/application/erpAiApplication'

const id = z.coerce.number().int().positive()
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const money = z.coerce.number().finite().nonnegative()
const nullableId = id.nullable().optional()
const page = {
  query: z.string().trim().max(200).optional(),
  filters: z.record(z.string(), z.string()).optional(),
  page: z.coerce.number().int().positive().max(10000).optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
}
const recordOutput = z.record(z.string(), z.unknown())
const listOutput = z.object({ records: z.array(recordOutput), total: z.number() }).passthrough()
const idempotencyKey = z.string().trim().min(8).max(120).optional()
const entityValues = z.object({
  nome: z.string().trim().min(1).max(240), tipo: z.enum(['PF', 'PJ']).optional(),
  documento: z.string().trim().max(30).nullable().optional(), email: z.string().email().max(320).nullable().optional(),
  telefone: z.string().trim().max(30).nullable().optional(), cidade: z.string().trim().max(180).nullable().optional(),
  categoria: z.string().trim().max(160).nullable().optional(), status: z.enum(['ativo', 'inativo']).optional(),
}).passthrough()
const productValues = z.object({
  nome: z.string().trim().min(1).max(240), sku: z.string().trim().max(120).nullable().optional(),
  categoria: z.union([z.string().trim().max(160), id]).nullable().optional(), preco: money,
  controla_estoque: z.enum(['sim', 'nao']).optional(), permite_estoque_negativo: z.enum(['sim', 'nao']).optional(),
  estoque_minimo: money.optional(), ponto_reposicao: money.optional(), status: z.enum(['ativo', 'pausado']).optional(),
}).passthrough()
const serviceValues = z.object({
  nome: z.string().trim().min(1).max(240), codigo: z.string().trim().max(120).nullable().optional(),
  descricao: z.string().trim().max(5000).nullable().optional(), categoria: z.union([z.string().trim().max(160), id]).nullable().optional(),
  preco: money, custo: money.optional(), status: z.enum(['ativo', 'pausado']).optional(),
}).passthrough()
const categoryValues = z.object({
  nome: z.string().trim().min(1).max(160), descricao: z.string().trim().max(1000).nullable().optional(),
  tipo: z.enum(['produto', 'servico', 'receita', 'despesa', 'geral']), status: z.enum(['ativo', 'inativo']).optional(),
}).passthrough()
const financialAccountValues = z.object({
  nome: z.string().trim().min(1).max(160), tipo: z.enum(['caixa', 'banco', 'carteira', 'cartao', 'outro']),
  banco: z.string().trim().max(160).nullable().optional(), agencia: z.string().trim().max(30).nullable().optional(),
  conta: z.string().trim().max(60).nullable().optional(), digito: z.string().trim().max(10).nullable().optional(),
  saldo_inicial: money.optional(), data_saldo_inicial: date.nullable().optional(), padrao: z.boolean().optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
}).passthrough()
const saleItem = z.object({
  tipo: z.enum(['produto', 'servico']), item_id: id, descricao: z.string().trim().max(500).optional(),
  quantidade: z.coerce.number().finite().positive(), valor_unitario: money.positive(), desconto: money.optional(),
}).passthrough()
const installment = z.object({
  numero_parcela: z.coerce.number().int().positive(), descricao: z.string().trim().max(160).optional(),
  data_vencimento: date, valor: money, conta_financeira_id: nullableId, metodo_pagamento_id: nullableId,
}).passthrough()
const saleValues = z.object({
  cliente_id: id, tipo_documento: z.enum(['orcamento', 'pedido', 'venda']).default('venda'),
  numero: z.string().trim().max(60).optional(), data_venda: date.optional(), data_competencia: date.optional(),
  validade_ate: date.nullable().optional(), previsao_entrega: date.nullable().optional(), vendedor_id: nullableId,
  categoria_id: nullableId, centro_custo_id: nullableId, conta_financeira_id: nullableId, metodo_pagamento_id: nullableId,
  desconto: money.optional(), frete: money.optional(), observacoes: z.string().trim().max(5000).nullable().optional(),
  itens: z.array(saleItem).min(1).max(100), parcelas: z.array(installment).max(120).optional(),
}).passthrough()
const purchaseItem = z.object({
  tipo: z.enum(['produto', 'servico']).optional(), produto_id: nullableId, servico_id: nullableId,
  item_id: nullableId, descricao: z.string().trim().max(500).optional(), unidade: z.string().trim().max(20).optional(),
  quantidade: z.coerce.number().finite().positive(), valor_unitario: money.positive(),
  percentual_desconto: z.coerce.number().min(0).max(100).optional(), valor_desconto: money.optional(),
}).passthrough().refine((value) => value.item_id || value.produto_id || value.servico_id, 'Informe o item da compra.')
const purchaseValues = z.object({
  fornecedor_id: id, numero: z.string().trim().max(60).optional(), data_compra: date.optional(),
  data_competencia: date.optional(), data_prevista_entrega: date.nullable().optional(),
  tipo_movimento: z.enum(['cotacao', 'pedido_recorrente', 'pedido_compra', 'compra']).default('compra'),
  tipo_compra: z.string().trim().max(60).optional(), natureza_operacao_id: nullableId,
  categoria_id: nullableId, centro_custo_id: nullableId, conta_financeira_id: nullableId, metodo_pagamento_id: nullableId,
  gera_financeiro: z.boolean().default(true), desconto: money.optional(), frete: money.optional(),
  seguro: money.optional(), outras_despesas: money.optional(), impostos_retidos: money.optional(),
  observacoes: z.string().trim().max(5000).nullable().optional(), itens: z.array(purchaseItem).min(1).max(100),
  parcelas: z.array(installment).max(120).optional(),
}).passthrough()
const settlementValues = z.object({
  valor: money.positive().optional(), data_pagamento: date.optional(), conta_financeira_id: nullableId,
  metodo_pagamento_id: nullableId, juros: money.optional(), multa: money.optional(), desconto: money.optional(),
  taxa: money.optional(), origem: z.enum(['manual', 'importacao', 'conciliacao', 'automacao']).optional(),
}).passthrough()

function saveEnvelope<TSchema extends z.ZodType>(schema: TSchema) {
  return z.object({ id: id.optional(), expectedVersion: id.optional(), values: schema, idempotencyKey })
}
const recordAction = z.object({ id, idempotencyKey: z.string().trim().min(8).max(120).optional() })

function annotations(readOnly: boolean, destructive = false, idempotent = false) {
  return { readOnlyHint: readOnly, destructiveHint: destructive, idempotentHint: idempotent, openWorldHint: false }
}

function listTool(input: {
  name: string
  title: string
  description: string
  capability: AiToolDefinition['capability']
  entityId: 'clientes' | 'fornecedores' | 'vendedores' | 'produtos' | 'servicos' | 'categorias' | 'pedidos' | 'pedidos-compra' | 'contas-a-receber' | 'contas-a-pagar' | 'contas-financeiras'
}) {
  return defineAiTool({
    ...input, version: '1', risk: 'read', inputSchema: z.object(page), outputSchema: listOutput, annotations: annotations(true),
    execute: ({ principal }, args) => erpAiApplication.listModule({ tenantId: principal.tenantId, entityId: input.entityId, ...args }),
  })
}

function saveTool(input: {
  name: string
  title: string
  description: string
  entityId: 'clientes' | 'fornecedores' | 'vendedores' | 'produtos' | 'servicos' | 'categorias' | 'contas-financeiras'
  valuesSchema: z.ZodType<Record<string, unknown>>
  capability?: AiToolDefinition['capability']
}) {
  return defineAiTool({
    ...input, version: '1', capability: input.capability || 'erp.cadastros.gerenciar', risk: 'write-low',
    inputSchema: saveEnvelope(input.valuesSchema), outputSchema: recordOutput,
    annotations: annotations(false, false, true),
    execute: ({ principal }, args) => erpAiApplication.saveModuleRecord({
      tenantId: principal.tenantId, actorId: principal.userId, entityId: input.entityId, ...args,
    }),
  })
}

function criticalPair<TSchema extends z.ZodObject<z.ZodRawShape>>(input: {
  baseName: string
  title: string
  description: string
  capability: AiToolDefinition['capability']
  payloadSchema: TSchema
  execute: (principal: { tenantId: number; userId: number }, payload: z.infer<TSchema>) => Promise<unknown>
}) {
  const commitName = `${input.baseName}_commit`
  const prepare = defineAiTool({
    name: `${input.baseName}_prepare`, version: '1', title: `Preparar ${input.title}`,
    description: `${input.description} Apenas prepara uma solicitacao para aprovacao humana.`,
    capability: input.capability, risk: 'write-medium', inputSchema: input.payloadSchema,
    outputSchema: z.object({ approvalId: z.string().uuid(), status: z.literal('pending'), expiresInMinutes: z.number(), preview: recordOutput }),
    annotations: annotations(false, false, true),
    execute: ({ principal }, payload) => createAiApproval({
      principal, commitToolName: commitName, payload, preview: { action: input.title, payload },
    }),
  })
  const commit = defineAiTool({
    name: commitName, version: '1', title: `Concluir ${input.title}`,
    description: `${input.description} Exige uma aprovacao humana valida criada no Otto.`,
    capability: input.capability, risk: 'write-critical',
    inputSchema: input.payloadSchema.extend({ approvalId: z.string().uuid() }),
    outputSchema: recordOutput,
    annotations: annotations(false, true, true),
    execute: ({ principal }, args) => {
      const approvalId = String(args.approvalId)
      const payload = input.payloadSchema.parse(args)
      return executeWithAiApproval({
        principal, approvalId, commitToolName: commitName, payload: payload as Record<string, unknown>,
        execute: () => input.execute({ tenantId: principal.tenantId, userId: principal.userId }, payload),
      })
    },
  })
  return [prepare, commit]
}

const catalogTools = [
  listTool({ name: 'erp_search_customers', title: 'Buscar clientes', description: 'Lista e pesquisa clientes do ERP.', capability: 'erp.cadastros.visualizar', entityId: 'clientes' }),
  listTool({ name: 'erp_search_suppliers', title: 'Buscar fornecedores', description: 'Lista e pesquisa fornecedores do ERP.', capability: 'erp.cadastros.visualizar', entityId: 'fornecedores' }),
  listTool({ name: 'erp_search_sellers', title: 'Buscar vendedores', description: 'Lista os responsaveis comerciais.', capability: 'erp.cadastros.visualizar', entityId: 'vendedores' }),
  listTool({ name: 'erp_search_products', title: 'Buscar produtos', description: 'Lista e pesquisa produtos sem consultar estoque.', capability: 'erp.cadastros.visualizar', entityId: 'produtos' }),
  listTool({ name: 'erp_search_services', title: 'Buscar servicos', description: 'Lista e pesquisa servicos.', capability: 'erp.cadastros.visualizar', entityId: 'servicos' }),
  listTool({ name: 'erp_search_categories', title: 'Buscar categorias', description: 'Lista categorias comerciais e financeiras.', capability: 'erp.cadastros.visualizar', entityId: 'categorias' }),
  listTool({ name: 'erp_search_financial_accounts', title: 'Buscar contas financeiras', description: 'Lista caixas, bancos e demais contas financeiras.', capability: 'erp.financeiro.visualizar', entityId: 'contas-financeiras' }),
  saveTool({ name: 'erp_save_customer', title: 'Salvar cliente', description: 'Cria ou atualiza um cliente.', entityId: 'clientes', valuesSchema: entityValues }),
  saveTool({ name: 'erp_save_supplier', title: 'Salvar fornecedor', description: 'Cria ou atualiza um fornecedor.', entityId: 'fornecedores', valuesSchema: entityValues }),
  saveTool({ name: 'erp_save_seller', title: 'Salvar vendedor', description: 'Cria ou atualiza um responsavel comercial.', entityId: 'vendedores', valuesSchema: entityValues }),
  saveTool({ name: 'erp_save_product', title: 'Salvar produto', description: 'Cria ou atualiza produto sem movimentar estoque.', entityId: 'produtos', valuesSchema: productValues }),
  saveTool({ name: 'erp_save_service', title: 'Salvar servico', description: 'Cria ou atualiza um servico.', entityId: 'servicos', valuesSchema: serviceValues }),
  saveTool({ name: 'erp_save_category', title: 'Salvar categoria', description: 'Cria ou atualiza categoria comercial ou financeira.', entityId: 'categorias', valuesSchema: categoryValues }),
  saveTool({ name: 'erp_save_financial_account', title: 'Salvar conta financeira', description: 'Cria ou atualiza uma conta financeira.', entityId: 'contas-financeiras', valuesSchema: financialAccountValues, capability: 'erp.configuracoes.gerenciar' }),
  defineAiTool({
    name: 'erp_search_cost_centers', version: '1', title: 'Buscar centros de custo', description: 'Lista e pesquisa centros de custo.',
    capability: 'erp.cadastros.visualizar', risk: 'read', inputSchema: z.object({ query: z.string().max(200).optional(), active: z.boolean().optional() }),
    annotations: annotations(true), execute: ({ principal }, args) => listErpCostCenters({ tenantId: principal.tenantId, ...args }),
  }),
  defineAiTool({
    name: 'erp_save_cost_center', version: '1', title: 'Salvar centro de custo', description: 'Cria ou atualiza um centro de custo.',
    capability: 'erp.cadastros.gerenciar', risk: 'write-low',
    inputSchema: z.object({ id: id.optional(), name: z.string().trim().min(1).max(160), code: z.string().trim().max(60).nullable().optional(), active: z.boolean().optional() }),
    annotations: annotations(false), execute: ({ principal }, args) => saveErpCostCenter({ tenantId: principal.tenantId, actorId: principal.userId, ...args }),
  }),
]

const salesTools = [
  listTool({ name: 'erp_search_sales', title: 'Buscar vendas', description: 'Lista vendas e orcamentos.', capability: 'erp.vendas.visualizar', entityId: 'pedidos' }),
  defineAiTool({ name: 'erp_get_sale', version: '1', title: 'Obter venda', description: 'Retorna cabecalho, itens, parcelas previstas e historico.', capability: 'erp.vendas.visualizar', risk: 'read', inputSchema: z.object({ id }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.getSale(principal.tenantId, args.id) }),
  defineAiTool({ name: 'erp_save_sale_draft', version: '1', title: 'Salvar venda', description: 'Cria uma venda ou atualiza uma venda em rascunho.', capability: 'erp.vendas.gerenciar', risk: 'write-medium', inputSchema: saveEnvelope(saleValues), outputSchema: recordOutput, annotations: annotations(false, false, true), execute: ({ principal }, args) => erpAiApplication.saveSale({ tenantId: principal.tenantId, actorId: principal.userId, ...args }) }),
  defineAiTool({ name: 'erp_manage_quote_status', version: '1', title: 'Alterar orcamento', description: 'Envia, aprova, recusa ou cancela um orcamento.', capability: 'erp.vendas.gerenciar', risk: 'write-medium', inputSchema: z.object({ id, action: z.enum(['enviar', 'aprovar', 'recusar', 'cancelar']), expectedVersion: id }), annotations: annotations(false), execute: ({ principal }, args) => erpAiApplication.runQuoteAction({ tenantId: principal.tenantId, actorId: principal.userId, quoteId: args.id, action: args.action, expectedVersion: args.expectedVersion }) }),
  defineAiTool({ name: 'erp_convert_quote_to_sale', version: '1', title: 'Converter orcamento', description: 'Converte um orcamento aprovado em venda de forma idempotente.', capability: 'erp.vendas.gerenciar', risk: 'write-medium', inputSchema: z.object({ id, expectedVersion: id }), annotations: annotations(false, false, true), execute: ({ principal }, args) => erpAiApplication.convertQuoteToSale({ tenantId: principal.tenantId, actorId: principal.userId, quoteId: args.id, expectedVersion: args.expectedVersion }) }),
  ...criticalPair({ baseName: 'erp_confirm_sale', title: 'confirmacao de venda', description: 'Confirma a venda e gera o financeiro correspondente.', capability: 'erp.vendas.gerenciar', payloadSchema: recordAction, execute: (principal, payload) => erpAiApplication.confirmSale({ tenantId: principal.tenantId, actorId: principal.userId, id: payload.id }) }),
  ...criticalPair({ baseName: 'erp_cancel_sale', title: 'cancelamento de venda', description: 'Cancela venda elegivel e seus efeitos financeiros.', capability: 'erp.vendas.gerenciar', payloadSchema: recordAction.extend({ reason: z.string().trim().max(1000).nullable().optional() }), execute: (principal, payload) => erpAiApplication.cancelSale({ tenantId: principal.tenantId, actorId: principal.userId, id: payload.id, reason: 'reason' in payload ? payload.reason as string | null | undefined : undefined }) }),
]

const purchaseTools = [
  listTool({ name: 'erp_search_purchases', title: 'Buscar compras', description: 'Lista cotacoes, pedidos e compras.', capability: 'erp.compras.visualizar', entityId: 'pedidos-compra' }),
  defineAiTool({ name: 'erp_get_purchase', version: '1', title: 'Obter compra', description: 'Retorna cabecalho, itens, parcelas, notas e historico.', capability: 'erp.compras.visualizar', risk: 'read', inputSchema: z.object({ id }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.getPurchase(principal.tenantId, args.id) }),
  defineAiTool({ name: 'erp_save_purchase_draft', version: '1', title: 'Salvar compra', description: 'Cria uma compra ou atualiza cotacao em rascunho.', capability: 'erp.compras.gerenciar', risk: 'write-medium', inputSchema: saveEnvelope(purchaseValues), outputSchema: recordOutput, annotations: annotations(false, false, true), execute: ({ principal }, args) => erpAiApplication.savePurchase({ tenantId: principal.tenantId, actorId: principal.userId, ...args }) }),
  ...criticalPair({ baseName: 'erp_confirm_purchase', title: 'confirmacao de compra', description: 'Confirma a compra e gera o financeiro quando configurado.', capability: 'erp.compras.gerenciar', payloadSchema: recordAction, execute: (principal, payload) => erpAiApplication.confirmPurchase({ tenantId: principal.tenantId, actorId: principal.userId, id: payload.id }) }),
  ...criticalPair({ baseName: 'erp_cancel_purchase', title: 'cancelamento de compra', description: 'Cancela uma compra elegivel.', capability: 'erp.compras.gerenciar', payloadSchema: recordAction, execute: (principal, payload) => erpAiApplication.cancelPurchase({ tenantId: principal.tenantId, actorId: principal.userId, id: payload.id }) }),
]

const settlementSchema = z.object({ id, values: settlementValues, idempotencyKey: z.string().trim().min(8).max(120) })
const financeTools = [
  listTool({ name: 'erp_search_receivables', title: 'Buscar contas a receber', description: 'Lista titulos e parcelas a receber.', capability: 'erp.financeiro.visualizar', entityId: 'contas-a-receber' }),
  listTool({ name: 'erp_search_payables', title: 'Buscar contas a pagar', description: 'Lista titulos e parcelas a pagar.', capability: 'erp.financeiro.visualizar', entityId: 'contas-a-pagar' }),
  defineAiTool({ name: 'erp_list_payments', version: '1', title: 'Listar pagamentos', description: 'Lista baixas e estornos de um titulo.', capability: 'erp.financeiro.visualizar', risk: 'read', inputSchema: z.object({ type: z.enum(['receber', 'pagar']), accountId: id }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.listPayments({ tenantId: principal.tenantId, ...args }) }),
  ...criticalPair({ baseName: 'erp_settle_receivable', title: 'baixa de conta a receber', description: 'Registra recebimento parcial ou total.', capability: 'erp.financeiro.baixar', payloadSchema: settlementSchema, execute: (principal, payload) => erpAiApplication.settleReceivable({ tenantId: principal.tenantId, actorId: principal.userId, ...payload }) }),
  ...criticalPair({ baseName: 'erp_settle_payable', title: 'baixa de conta a pagar', description: 'Registra pagamento parcial ou total.', capability: 'erp.financeiro.baixar', payloadSchema: settlementSchema, execute: (principal, payload) => erpAiApplication.settlePayable({ tenantId: principal.tenantId, actorId: principal.userId, ...payload }) }),
  ...criticalPair({ baseName: 'erp_reverse_payment', title: 'estorno financeiro', description: 'Estorna uma baixa financeira.', capability: 'erp.financeiro.estornar', payloadSchema: recordAction.extend({ reason: z.string().trim().max(1000).nullable().optional() }), execute: (principal, payload) => erpAiApplication.reversePayment({ tenantId: principal.tenantId, actorId: principal.userId, id: payload.id, idempotencyKey: payload.idempotencyKey, reason: 'reason' in payload ? payload.reason as string | null | undefined : undefined }) }),
]

const operationsTools = [
  defineAiTool({ name: 'erp_search_service_orders', version: '1', title: 'Buscar ordens de servico', description: 'Lista ordens de servico.', capability: 'erp.vendas.visualizar', risk: 'read', inputSchema: z.object({ query: z.string().max(200).optional(), status: z.string().max(60).optional() }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.listServiceOrders({ tenantId: principal.tenantId, ...args }) }),
  defineAiTool({ name: 'erp_get_service_order', version: '1', title: 'Obter ordem de servico', description: 'Retorna ordem, itens e historico.', capability: 'erp.vendas.visualizar', risk: 'read', inputSchema: z.object({ id }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.getServiceOrder(principal.tenantId, args.id) }),
  defineAiTool({ name: 'erp_create_service_order', version: '1', title: 'Criar ordem de servico', description: 'Cria ordem de servico com produtos e servicos.', capability: 'erp.vendas.gerenciar', risk: 'write-medium', inputSchema: z.object({ values: z.object({ cliente_id: id, responsavel_id: nullableId, numero: z.string().trim().max(60).optional(), status: z.enum(['rascunho', 'orcamento_pendente', 'aprovada', 'em_execucao']).default('rascunho'), data_inicio: date, previsao_entrega: date.nullable().optional(), equipamento: z.string().trim().max(200).nullable().optional(), marca: z.string().trim().max(120).nullable().optional(), modelo: z.string().trim().max(120).nullable().optional(), numero_serie: z.string().trim().max(120).nullable().optional(), problema_informado: z.string().trim().max(5000).nullable().optional(), diagnostico: z.string().trim().max(5000).nullable().optional(), observacoes_publicas: z.string().trim().max(5000).nullable().optional(), observacoes_internas: z.string().trim().max(5000).nullable().optional(), desconto: money.default(0), itens: z.array(saleItem).min(1).max(100) }).passthrough(), idempotencyKey }), outputSchema: recordOutput, annotations: annotations(false, false, true), execute: ({ principal }, args) => erpAiApplication.createServiceOrder({ tenantId: principal.tenantId, actorId: principal.userId, values: args.values as never, idempotencyKey: args.idempotencyKey }) }),
  defineAiTool({ name: 'erp_manage_service_order', version: '1', title: 'Alterar ordem de servico', description: 'Avanca, cancela ou converte uma ordem de servico.', capability: 'erp.vendas.gerenciar', risk: 'write-medium', inputSchema: z.object({ id, action: z.enum(['aprovar', 'iniciar', 'concluir', 'cancelar', 'gerar_orcamento', 'gerar_venda']), expectedVersion: id }), annotations: annotations(false), execute: ({ principal }, args) => erpAiApplication.runServiceOrderAction({ tenantId: principal.tenantId, actorId: principal.userId, orderId: args.id, action: args.action, expectedVersion: args.expectedVersion }) }),
  defineAiTool({ name: 'erp_get_business_overview', version: '1', title: 'Obter visao do negocio', description: 'Retorna indicadores consolidados do ERP.', capability: 'erp.relatorios.visualizar', risk: 'read', inputSchema: z.object({}), annotations: annotations(true), execute: ({ principal }) => erpAiApplication.getOverview(principal.tenantId) }),
  defineAiTool({ name: 'erp_run_report', version: '1', title: 'Executar relatorio', description: 'Executa um relatorio gerencial permitido.', capability: 'erp.relatorios.visualizar', risk: 'read', inputSchema: z.object({ report: z.enum(['dre-competencia', 'dre-caixa', 'fluxo-diario', 'fluxo-mensal', 'posicao-financeira', 'vendas-clientes', 'vendas-vendedores', 'vendas-produtos', 'compras-fornecedores', 'compras-categorias']), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }), annotations: annotations(true), execute: ({ principal }, args) => erpAiApplication.runReport({ tenantId: principal.tenantId, ...args }) }),
]

export const ERP_AI_TOOLS: AiToolDefinition<Record<string, unknown>>[] = [
  ...catalogTools, ...salesTools, ...purchaseTools, ...financeTools, ...operationsTools,
] as AiToolDefinition<Record<string, unknown>>[]
