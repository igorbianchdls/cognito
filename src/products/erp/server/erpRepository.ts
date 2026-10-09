import { erpListOrder } from '@/products/erp/shared/readQueries'
import { nextDocumentNumber } from '@/products/erp/server/erpDocumentNumbers'
import { applyCardReceipt, cancelCardReceipt, cardMethodConfig } from '@/products/erp/server/erpCardReceipts'
import { assertCustomerCredit, assertDiscountLimit, assertTablePriceRules, saleSeller, sellerRules, cancelSaleCommissions, generateSaleCommissions, resolvePriceTable, saveCustomerCommercialTerms, saleTransport, tablePrice, type TablePrice } from '@/products/erp/server/erpCommercialRules'
import { ERP_TODAY_SQL } from '@/products/erp/server/erpBusinessDate'
import { assertCommercialReplay } from '@/products/erp/shared/commercialContracts'
import { saveRegistrationRelations } from './erpRegistrationRelations'
import { nonNegativeDecimal, paymentTotal, sumMoney, lineTotal, discountAmount } from '@/products/erp/shared/erpMoney'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { assertSettlementReplay, requireOperationKey, settlementIdentity } from './erpSettlementIdentity'
import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { parseNfeXml } from '@/products/erp/server/fiscal/nfeParser'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import {
  receiveStockForPurchase,
  releaseStockForSale,
  reserveStockForSale,
  reverseStockForPurchase,
} from '@/products/erp/server/erpStockRepository'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'
import { erpToday } from '@/products/erp/server/erpBusinessDate'

type ListInput = {
  tenantId: number
  entityId: ErpConnectedModuleId
  query?: string
  filters?: Record<string, string>
  page?: number
  pageSize?: number
  sort?: string
}

type CreateInput = {
  tenantId: number
  actorId: number
  entityId: ErpConnectedModuleId
  values: Record<string, unknown>
  idempotencyKey?: string
  temporary?: boolean
}

type UpdateInput = CreateInput & {
  id: string | number
  expectedVersion: number
}

type ConfirmSaleInput = {
  tenantId: number
  actorId: number
  saleId: string | number
  expectedVersion?: number
  /** Motivo para confirmar acima do limite de crédito (exige erp.financeiro.gerenciar). */
  creditOverrideReason?: string | null
}

type IdActionInput = {
  tenantId: number
  actorId: number
  id: string | number
}

type SettleInstallmentInput = IdActionInput & {
  idempotencyKey?: string
  values: Record<string, unknown>
}

type ReversePaymentInput = IdActionInput & {
  idempotencyKey?: string
  reason?: string | null
}

type SaleRow = {
  id: string | number
  empresa_id: string | number
  cliente_id: string | number | null
  numero: string | null
  data_venda: string | Date | null
  data_competencia: string | Date | null
  status: string
  situacao: string | null
  categoria_id: string | number | null
  centro_custo_id: string | number | null
  conta_financeira_id: string | number | null
  metodo_pagamento_id: string | number | null
  subtotal: string | number | null
  total: string | number | null
  condicao_pagamento: unknown
  cobranca_emails: unknown
  cobranca_whatsapp: string | null
  configuracao_lembretes: unknown
  tipo_documento?: string
  versao?: string | number
}

type PurchaseRow = {
  id: string | number
  empresa_id: string | number
  fornecedor_id: string | number | null
  numero: string | null
  data_compra: string | Date | null
  data_competencia: string | Date | null
  status: string
  tipo_compra: string
  tipo_movimento: string
  origem: string
  categoria_id: string | number | null
  centro_custo_id: string | number | null
  conta_financeira_id: string | number | null
  metodo_pagamento_id: string | number | null
  subtotal: string | number | null
  total: string | number | null
  condicao_pagamento: unknown
  gera_financeiro: boolean
  fornecedor_nome_snapshot: string | null
  fornecedor_documento_snapshot: string | null
}

type ReceivableRow = {
  id: string | number
  status: string
  tipo_lancamento?: string
}

type InstallmentRow = {
  id: string | number
  numero_parcela: string | number
  valor: string | number
  status: string
}

type NormalizedInstallment = {
  numeroParcela: number
  descricao: string | null
  dataVencimento: string
  valor: number
  contaFinanceiraId?: string | number | null
  metodoPagamentoId?: string | number | null
  percentual?: number | null
  observacoes?: string | null
  commercialForecastId?: string | number | null
}

type PurchaseItemInput = {
  produtoId: number | null
  servicoId: number | null
  descricao: string
  detalhes: string | null
  unidade: string | null
  quantidade: number
  valorUnitario: number
  percentualDesconto: number | null
  valorDesconto: number
  valorBruto: number
  valorLiquido: number
}

export type ConfirmErpSaleResult = {
  sale: {
    id: string
    status: string
  }
  receivable: {
    id: string
    status: string
  }
  installments: Array<{
    id: string
    numero_parcela: number
    valor: number
    status: string
  }>
}

type ConfirmErpPurchaseResult = {
  purchase: {
    id: string
    status: string
  }
  payable: {
    id: string
    status: string
  } | null
  installments: Array<{
    id: string
    numero_parcela: number
    valor: number
    status: string
  }>
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function optionalText(value: unknown) {
  const normalized = text(value)
  return normalized || null
}

function money(value: unknown) {
  return nonNegativeDecimal(value === undefined || value === null || value === '' ? 0 : value, 4)
}

function positiveMoney(value: unknown) {
  const parsed = money(value)
  return parsed > 0 ? parsed : null
}

function dateText(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const normalized = text(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(optionalText).filter((item): item is string => Boolean(item)))]
}

function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function normalizedIdempotencyKey(value: unknown) {
  const normalized = optionalText(value)
  if (!normalized) return null
  if (normalized.length > 200) throw new ErpDomainError('VALIDATION_ERROR', 'Chave de idempotencia inválida.')
  return normalized
}

function numericId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ErpDomainError('VALIDATION_ERROR', `${label} invalido.`)
  return parsed
}

function optionalNumericId(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function purchaseType(value: unknown) {
  return text(value).toLowerCase() === 'servico' ? 'servico' : 'produto'
}

function purchaseMovement(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['cotacao', 'pedido_recorrente', 'pedido_compra', 'compra'].includes(normalized)) return normalized
  return 'cotacao'
}

function purchaseStatusForMovement(movement: string) {
  if (movement === 'compra') return 'recebida'
  if (movement === 'pedido_compra' || movement === 'pedido_recorrente') return 'confirmada'
  return 'rascunho'
}

function normalizePurchaseItems(values: Record<string, unknown>): PurchaseItemInput[] {
  const rawItems = Array.isArray(values.itens) ? values.itens : [{
    produto_id: values.produto_id,
    servico_id: values.servico_id,
    descricao: values.descricao,
    detalhes: values.detalhes,
    unidade: values.unidade,
    quantidade: values.quantidade,
    valor_unitario: values.valor_unitario,
    percentual_desconto: values.percentual_desconto,
    valor_desconto: values.valor_desconto,
  }]

  if (rawItems.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'Adicione pelo menos um item a compra.')
  return rawItems.map((rawItem, index) => {
    const item = rawItem as Record<string, unknown>
    const produtoId = optionalNumericId(item.produto_id)
    const servicoId = optionalNumericId(item.servico_id)
    if ((produtoId ? 1 : 0) + (servicoId ? 1 : 0) !== 1) {
      throw new ErpDomainError('VALIDATION_ERROR', `Selecione um produto ou serviço no item ${index + 1}.`)
    }

    const quantidade = Number(String(item.quantidade ?? 1).replace(',', '.'))
    const valorUnitario = Number(String(item.valor_unitario ?? 0).replace(',', '.'))
    const percentual = item.percentual_desconto == null || item.percentual_desconto === ''
      ? null
      : Number(String(item.percentual_desconto).replace(',', '.'))
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Quantidade do item ${index + 1} invalida.`)
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) throw new ErpDomainError('VALIDATION_ERROR', `Valor unitário do item ${index + 1} invalido.`)
    if (percentual != null && (!Number.isFinite(percentual) || percentual < 0 || percentual > 100)) {
      throw new ErpDomainError('VALIDATION_ERROR', `Desconto percentual do item ${index + 1} invalido.`)
    }

    const valorBruto = Number((quantidade * valorUnitario).toFixed(2))
    const informedDiscount = item.valor_desconto == null || item.valor_desconto === ''
      ? null
      : money(item.valor_desconto)
    const valorDesconto = informedDiscount ?? Number((valorBruto * ((percentual || 0) / 100)).toFixed(2))
    if (valorDesconto > valorBruto) throw new ErpDomainError('VALIDATION_ERROR', `Desconto do item ${index + 1} supera o valor bruto.`)

    return {
      produtoId,
      servicoId,
      descricao: optionalText(item.descricao) || `${produtoId ? 'Produto' : 'Servico'} ${produtoId || servicoId}`,
      detalhes: optionalText(item.detalhes),
      unidade: optionalText(item.unidade),
      quantidade,
      valorUnitario,
      percentualDesconto: percentual,
      valorDesconto,
      valorBruto,
      valorLiquido: Number((valorBruto - valorDesconto).toFixed(2)),
    }
  })
}

async function ensureFinancialAccountId(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  _actorId: number,
  value: unknown,
) {
  const requested = Number(value || 0)
  if (Number.isInteger(requested) && requested > 0) {
    const selected = await client.query(
      `SELECT id
       FROM erp.contas_financeiras
       WHERE empresa_id = $1
         AND id = $2
         AND ativo = true
         AND excluido_em IS NULL`,
      [tenantId, requested],
    )
    if (!selected.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Conta financeira inválida ou inativa.')
    return requested
  }

  const existing = await client.query(
    `SELECT id, padrao
     FROM erp.contas_financeiras
     WHERE empresa_id = $1
       AND ativo = true
       AND excluido_em IS NULL
     ORDER BY padrao DESC, id ASC
     LIMIT 2`,
    [tenantId],
  )
  if (existing.rows[0]?.padrao || existing.rows.length === 1) return Number(existing.rows[0]?.id)
  if (existing.rows.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'Cadastre uma conta financeira antes de registrar a baixa.')
  throw new ErpDomainError('VALIDATION_ERROR', 'Selecione uma conta financeira para registrar a baixa.')
}

// Composição do saldo de uma parcela: pagamentos válidos, créditos aplicados e valor levado para renegociação.
// As três somas são calculadas uma única vez por parcela: OFFSET 0 impede o planejador de desdobrar a subconsulta
// e repetir os agregados a cada referência a composicao.* (antes, ~13 vezes por linha nas listas financeiras).
export function financialCompositionSql(financialSide: 'receber' | 'pagar', installmentAlias = 'parcelas') {
  const installmentColumn = `conta_${financialSide}_parcela_id`
  return `CROSS JOIN LATERAL (
    SELECT somas.valor, somas.dinheiro, somas.credito, somas.transferido,
      somas.valor - somas.dinheiro - somas.credito - somas.transferido AS saldo
    FROM (
      SELECT ${installmentAlias}.valor,
        COALESCE((SELECT sum(valor) FROM erp.pagamentos pagamento
          WHERE pagamento.empresa_id=${installmentAlias}.empresa_id AND pagamento.${installmentColumn}=${installmentAlias}.id
            AND pagamento.estorno_de_pagamento_id IS NULL AND pagamento.estornado_em IS NULL AND pagamento.excluido_em IS NULL),0) AS dinheiro,
        COALESCE((SELECT sum(CASE WHEN aplicacao.reversao_de_id IS NULL THEN aplicacao.valor ELSE -aplicacao.valor END)
          FROM erp.adiantamentos_aplicacoes aplicacao WHERE aplicacao.empresa_id=${installmentAlias}.empresa_id
            AND aplicacao.${installmentColumn}=${installmentAlias}.id),0) AS credito,
        COALESCE((SELECT sum(link.valor) FROM erp.renegociacoes_parcelas link
          JOIN erp.renegociacoes acordo ON acordo.empresa_id=link.empresa_id AND acordo.id=link.renegociacao_id
          WHERE link.empresa_id=${installmentAlias}.empresa_id AND link.${installmentColumn}=${installmentAlias}.id
            AND link.papel='origem' AND acordo.status='efetivada'),0) AS transferido
      OFFSET 0
    ) somas
  ) composicao`
}

async function updateReceivableStatus(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  receivableId: string | number,
  actorId: number,
) {
  await client.query(
    `WITH totals AS (
       SELECT
         COALESCE(sum(composicao.saldo), 0) AS saldo,
         COALESCE(sum(composicao.dinheiro + composicao.credito), 0) AS liquidado,
         bool_and(composicao.transferido > 0) AS renegociado
       FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.conta_receber_id = $2
         AND parcelas.excluido_em IS NULL AND parcelas.status <> 'cancelado'
     )
     UPDATE erp.contas_receber
     SET status = CASE
       WHEN totals.renegociado THEN 'renegociado'
       WHEN totals.saldo = 0 THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_receber_parcelas AS vencidas
         WHERE vencidas.empresa_id = $1
           AND vencidas.conta_receber_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.status NOT IN ('pago','renegociado')
           AND vencidas.data_vencimento < ${ERP_TODAY_SQL}
       ) THEN 'vencido'
       WHEN totals.liquidado > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_receber.empresa_id = $1
       AND contas_receber.id = $2`,
    [tenantId, receivableId, actorId],
  )
}

async function updatePayableStatus(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  payableId: string | number,
  actorId: number,
) {
  await client.query(
    `WITH totals AS (
       SELECT
         COALESCE(sum(composicao.saldo), 0) AS saldo,
         COALESCE(sum(composicao.dinheiro + composicao.credito), 0) AS liquidado,
         bool_and(composicao.transferido > 0) AS renegociado
       FROM erp.contas_pagar_parcelas parcelas
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1 AND parcelas.conta_pagar_id = $2
         AND parcelas.excluido_em IS NULL AND parcelas.status <> 'cancelado'
     )
     UPDATE erp.contas_pagar
     SET status = CASE
       WHEN totals.renegociado THEN 'renegociado'
       WHEN totals.saldo = 0 THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_pagar_parcelas AS vencidas
         WHERE vencidas.empresa_id = $1
           AND vencidas.conta_pagar_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.status NOT IN ('pago','renegociado')
           AND vencidas.data_vencimento < ${ERP_TODAY_SQL}
       ) THEN 'vencido'
       WHEN totals.liquidado > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_pagar.empresa_id = $1
       AND contas_pagar.id = $2`,
    [tenantId, payableId, actorId],
  )
}

function normalizePersonType(value: unknown) {
  const normalized = text(value).toUpperCase()
  // O site usa PF/PJ; MCP e banco usam os nomes completos.
  if (normalized === 'PF' || normalized === 'FISICA') return 'fisica'
  if (normalized === 'PJ' || normalized === 'JURIDICA') return 'juridica'
  if (normalized === 'ESTRANGEIRA') return 'estrangeira'
  // Preserve o padrão dos cadastros opcionais, mas não substitua um tipo inválido.
  if (!normalized) return 'juridica'
  throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de pessoa inválido. Informe PF/fisica ou PJ/juridica.')
}

function displayPersonType(value: unknown) {
  if (value === 'fisica') return 'PF'
  if (value === 'juridica') return 'PJ'
  return 'Estrangeira'
}

function activeFromStatus(value: unknown) {
  const normalized = text(value).toLowerCase()
  return normalized !== 'inativo' && normalized !== 'pausado'
}

function booleanValue(value: unknown) {
  return value === true || ['true', '1', 'sim', 'yes'].includes(text(value).toLowerCase())
}

function financialAccountType(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['caixa', 'banco', 'carteira', 'cartao', 'maquininha', 'outro'].includes(normalized)) return normalized
  return 'banco'
}

function appendSearch(params: unknown[], query?: string) {
  const normalized = text(query)
  if (!normalized) return ''
  params.push(`%${normalized}%`)
  return ` AND searchable ILIKE $${params.length}`
}

function appendStatusFilter(filters?: Record<string, string>) {
  const status = text(filters?.status)
  if (!status || status === 'todos' || status === '__all__') return ''
  if (status === 'ativo') return ' AND ativo = true'
  if (status === 'inativo' || status === 'pausado') return ' AND ativo = false'
  return ''
}

function appendRecordStatusFilter(params: unknown[], filters?: Record<string, string>) {
  const status = text(filters?.status)
  if (!status || status === 'todos' || status === '__all__') return ''
  params.push(status)
  return ` AND status = $${params.length}`
}

function normalizedPage(input: ListInput) {
  const page = Number(input.page)
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
}

function normalizedPageSize(input: ListInput) {
  const pageSize = Number(input.pageSize)
  return Number.isFinite(pageSize) ? Math.min(100, Math.max(10, Math.floor(pageSize))) : 50
}

function appendPagination(params: unknown[], input: ListInput) {
  const pageSize = normalizedPageSize(input)
  const offset = (normalizedPage(input) - 1) * pageSize
  params.push(pageSize, offset)
  return ` LIMIT $${params.length - 1} OFFSET $${params.length}`
}

function appendTipoFilter(params: unknown[], filters?: Record<string, string>) {
  const tipo = text(filters?.tipo).toUpperCase()
  if (!tipo || tipo === '__ALL__') return ''
  params.push(normalizePersonType(tipo))
  return ` AND tipo_pessoa = $${params.length}`
}

function assertRequired(value: unknown, label: string) {
  if (!text(value)) throw new ErpDomainError('VALIDATION_ERROR', `${label} é obrigatório.`)
}

// Categoria de cadastro (agrupamento de produtos, serviços, clientes ou fornecedores) pelo nome: usa a
// existente do mesmo tipo ou cria. Categorias financeiras (receita/despesa) ficam em erp.categorias.
export type RegistrationCategoryType = 'produto' | 'servico' | 'cliente' | 'fornecedor'
async function resolveCategoryId(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  actorId: number,
  name: unknown,
  type: RegistrationCategoryType,
) {
  const normalized = text(name)
  if (!normalized) return null

  const existing = await client.query(
    `SELECT id
     FROM erp.categorias_cadastro
     WHERE empresa_id = $1
       AND lower(btrim(nome)) = lower(btrim($2))
       AND tipo = $3
       AND excluido_em IS NULL
     ORDER BY categoria_pai_id NULLS FIRST, id
     LIMIT 1`,
    [tenantId, normalized, type],
  )
  const existingId = existing.rows[0]?.id
  if (existingId) return Number(existingId)

  const created = await client.query(
    `INSERT INTO erp.categorias_cadastro (empresa_id, nome, tipo, criado_por, atualizado_por)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id`,
    [tenantId, normalized, type, actorId],
  )
  return Number(created.rows[0]?.id)
}

// Clientes e fornecedores: categoria de cadastro do papel do cadastro (vendedor não tem categoria).
async function saveEntityCategory(client: Pick<SQLClient, 'query'>, tenantId: number, actorId: number, entityId: ErpConnectedModuleId, id: number, name: unknown) {
  const type = entityId === 'clientes' ? 'cliente' : entityId === 'fornecedores' ? 'fornecedor' : null
  if (!type) return
  const categoryId = await resolveCategoryId(client, tenantId, actorId, name, type)
  await client.query('UPDATE erp.entidades SET categoria_id = $3, categoria_tipo = $4 WHERE empresa_id = $1 AND id = $2',
    [tenantId, id, categoryId, categoryId ? type : null])
}

function validateSaleInstallments(sale: SaleRow, installments: NormalizedInstallment[]) {
  const numbers = new Set<number>()
  for (const installment of installments) {
    if (!Number.isInteger(installment.numeroParcela) || installment.numeroParcela <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Número de parcela inválido.')
    }
    if (numbers.has(installment.numeroParcela)) throw new ErpDomainError('VALIDATION_ERROR', 'Existem parcelas com o mesmo número.')
    numbers.add(installment.numeroParcela)
  }

  const installmentsTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  const saleTotal = Number(money(sale.total).toFixed(2))
  if (installmentsTotal !== saleTotal) {
    throw new ErpDomainError('VALIDATION_ERROR', 'A soma das parcelas precisa ser igual ao total da venda.')
  }
  return installments
}

function normalizePaymentConditionInstallments(sale: SaleRow): NormalizedInstallment[] {
  const paymentCondition = sale.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  if (installments.length === 0) {
    return validateSaleInstallments(sale, [{
      numeroParcela: 1,
      descricao: 'Parcela 1',
      dataVencimento: dateText(sale.data_venda) || erpToday(),
      valor: money(sale.total),
    }])
  }

  const normalized = installments.map((installment, index): NormalizedInstallment => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      const installmentNumber = Number(item.numero_parcela || index + 1)
      if (!value) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${index + 1} invalido.`)

      return {
        numeroParcela: installmentNumber,
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
      }
    })
  return validateSaleInstallments(sale, normalized)
}

async function resolveSaleInstallments(client: Pick<SQLClient, 'query'>, sale: SaleRow) {
  const plannedResult = await client.query(
    `SELECT id, numero_parcela, descricao, data_vencimento, valor, conta_financeira_id, metodo_pagamento_id
     FROM erp.vendas_recebimentos_previstos
     WHERE empresa_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [sale.empresa_id, sale.id],
  )
  if (plannedResult.rows.length === 0) return normalizePaymentConditionInstallments(sale)

  return validateSaleInstallments(sale, plannedResult.rows.map((row) => ({
    numeroParcela: Number(row.numero_parcela),
    descricao: optionalText(row.descricao),
    dataVencimento: dateText(row.data_vencimento) || '',
    valor: money(row.valor),
    contaFinanceiraId: paymentMethodId(row.conta_financeira_id),
    metodoPagamentoId: paymentMethodId(row.metodo_pagamento_id),
    commercialForecastId: row.id as string | number,
  })))
}

function validatePurchaseInstallments(purchase: PurchaseRow, installments: NormalizedInstallment[]) {
  if (installments.length === 0 || installments.length > 48) {
    throw new ErpDomainError('VALIDATION_ERROR', 'A compra deve ter entre 1 e 48 parcelas.')
  }

  const numbers = new Set<number>()
  for (const installment of installments) {
    if (!Number.isInteger(installment.numeroParcela) || installment.numeroParcela <= 0 || installment.numeroParcela > 48) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Número de parcela inválido.')
    }
    if (numbers.has(installment.numeroParcela)) throw new ErpDomainError('VALIDATION_ERROR', 'Existem parcelas com o mesmo número.')
    numbers.add(installment.numeroParcela)
    if (!dateText(installment.dataVencimento)) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${installment.numeroParcela} invalido.`)
    if (money(installment.valor) <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${installment.numeroParcela} invalido.`)
  }

  const installmentsTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  const purchaseTotal = Number(money(purchase.total).toFixed(2))
  if (installmentsTotal !== purchaseTotal) {
    throw new ErpDomainError('VALIDATION_ERROR', 'A soma das parcelas precisa ser igual ao total da compra.')
  }
  return installments
}

function normalizePurchaseInstallments(purchase: PurchaseRow): NormalizedInstallment[] {
  const paymentCondition = purchase.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  const normalized = installments.map((installment, index): NormalizedInstallment => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      if (!value) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${index + 1} invalido.`)

      return {
        numeroParcela: Number(item.numero_parcela || index + 1),
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
        percentual: item.percentual == null ? null : Number(item.percentual),
        contaFinanceiraId: paymentMethodId(item.conta_financeira_id),
        metodoPagamentoId: paymentMethodId(item.metodo_pagamento_id),
        observacoes: optionalText(item.observacoes),
      }
    })

  if (normalized.length > 0) return validatePurchaseInstallments(purchase, normalized)

  return validatePurchaseInstallments(purchase, [{
    numeroParcela: 1,
    descricao: 'Parcela 1',
    dataVencimento: dateText(purchase.data_compra) || erpToday(),
    valor: money(purchase.total),
  }])
}

async function resolvePurchaseInstallments(client: Pick<SQLClient, 'query'>, purchase: PurchaseRow) {
  const plannedResult = await client.query(
    `SELECT id, numero_parcela, descricao, data_vencimento, valor, percentual, conta_financeira_id, metodo_pagamento_id, observacoes
     FROM erp.compras_parcelas_previstas
     WHERE empresa_id = $1
       AND compra_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [purchase.empresa_id, purchase.id],
  )
  if (plannedResult.rows.length === 0) return normalizePurchaseInstallments(purchase)

  return validatePurchaseInstallments(purchase, plannedResult.rows.map((row) => ({
    numeroParcela: Number(row.numero_parcela),
    descricao: optionalText(row.descricao),
    dataVencimento: dateText(row.data_vencimento) || '',
    valor: money(row.valor),
    percentual: row.percentual == null ? null : Number(row.percentual),
    contaFinanceiraId: paymentMethodId(row.conta_financeira_id),
    metodoPagamentoId: paymentMethodId(row.metodo_pagamento_id),
    observacoes: optionalText(row.observacoes),
    commercialForecastId: row.id as string | number,
  })))
}

async function fetchReceivableForSale(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  saleId: string | number,
) {
  const receivableResult = await client.query(
    `SELECT id::text, status
     FROM erp.contas_receber
     WHERE empresa_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, saleId],
  )
  const receivable = receivableResult.rows[0] as ReceivableRow | undefined
  if (!receivable) return null

  const installmentsResult = await client.query(
    `SELECT id::text, numero_parcela, valor, status
     FROM erp.contas_receber_parcelas
     WHERE empresa_id = $1
       AND conta_receber_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [tenantId, receivable.id],
  )

  return {
    receivable,
    installments: installmentsResult.rows as InstallmentRow[],
  }
}

export async function createOrUpdatePurchasePayable(
  client: Pick<SQLClient, 'query'>,
  purchase: PurchaseRow,
  actorId: number,
  type: 'previsao' | 'efetivo',
) {
  if (!purchase.gera_financeiro || money(purchase.total) <= 0) return null

  const installments = await resolvePurchaseInstallments(client, purchase)
  const existing = await fetchPayableForPurchase(client, Number(purchase.empresa_id), purchase.id)
  let payable: ReceivableRow

  if (existing) {
    if (existing.payable.status === 'pago' || existing.payable.status === 'parcial') {
      if (type !== existing.payable.tipo_lancamento) {
        throw new ErpDomainError('VALIDATION_ERROR', 'Não e possível alterar a natureza de uma conta que já possui pagamento.')
      }
      return existing
    }

    const updated = await client.query(
      `UPDATE erp.contas_pagar
       SET tipo_lancamento = $3,
           efetivado_em = CASE WHEN $3 = 'efetivo' THEN COALESCE(efetivado_em, now()) ELSE NULL END,
           descricao = $4,
           numero_documento = $5,
           data_competencia = $6,
           data_emissao = $7,
           valor_total = $8,
           status = 'aberto',
           categoria_id = $9,
           centro_custo_id = $10,
           fornecedor_nome_snapshot = $11,
           fornecedor_documento_snapshot = $12,
           atualizado_por = $13
       WHERE empresa_id = $1 AND id = $2
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.empresa_id,
        existing.payable.id,
        type,
        `${type === 'previsao' ? 'Previsao' : 'Compra'} ${purchase.numero || purchase.id}`,
        purchase.numero,
        dateText(purchase.data_competencia) || dateText(purchase.data_compra),
        dateText(purchase.data_compra),
        money(purchase.total),
        purchase.categoria_id,
        purchase.centro_custo_id,
        purchase.fornecedor_nome_snapshot,
        purchase.fornecedor_documento_snapshot,
        actorId,
      ],
    )
    payable = updated.rows[0] as ReceivableRow
    await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET excluido_em = now(), atualizado_por = $3
       WHERE empresa_id = $1 AND conta_pagar_id = $2 AND excluido_em IS NULL`,
      [purchase.empresa_id, payable.id, actorId],
    )
  } else {
    const created = await client.query(
      `INSERT INTO erp.contas_pagar (
         empresa_id, fornecedor_id, compra_id, descricao, numero_documento,
         data_competencia, data_emissao, valor_total, status, categoria_id,
         centro_custo_id, origem, tipo_lancamento, fornecedor_nome_snapshot,
         fornecedor_documento_snapshot, efetivado_em, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aberto', $9, $10, 'compra', $11, $12, $13,
         CASE WHEN $11 = 'efetivo' THEN now() ELSE NULL END, $14, $14)
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.empresa_id,
        purchase.fornecedor_id,
        purchase.id,
        `${type === 'previsao' ? 'Previsao' : 'Compra'} ${purchase.numero || purchase.id}`,
        purchase.numero,
        dateText(purchase.data_competencia) || dateText(purchase.data_compra),
        dateText(purchase.data_compra),
        money(purchase.total),
        purchase.categoria_id,
        purchase.centro_custo_id,
        type,
        purchase.fornecedor_nome_snapshot,
        purchase.fornecedor_documento_snapshot,
        actorId,
      ],
    )
    payable = created.rows[0] as ReceivableRow
  }

  const createdInstallments: InstallmentRow[] = []
  for (const installment of installments) {
    const result = await client.query(
      `INSERT INTO erp.contas_pagar_parcelas (
         empresa_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
         data_pagamento_previsto, valor, valor_bruto, valor_liquido, valor_pago,
         status, conta_financeira_id, metodo_pagamento_id, observacoes, parcela_prevista_id, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $11, $11)
       RETURNING id::text, numero_parcela, valor, status`,
      [
        purchase.empresa_id,
        payable.id,
        installment.numeroParcela,
        installment.descricao,
        installment.dataVencimento,
        installment.valor,
        installment.contaFinanceiraId || purchase.conta_financeira_id,
        installment.metodoPagamentoId || purchase.metodo_pagamento_id,
        installment.observacoes,
        installment.commercialForecastId,
        actorId,
      ],
    )
    createdInstallments.push(result.rows[0] as InstallmentRow)
  }

  await client.query(
    `INSERT INTO erp.contas_pagar_eventos (empresa_id, conta_pagar_id, evento, dados, criado_por)
     VALUES ($1, $2, $3, $4::jsonb, $5)`,
    [purchase.empresa_id, payable.id, type === 'efetivo' ? 'efetivada' : 'previsao_criada', JSON.stringify({ compra_id: purchase.id }), actorId],
  )
  return { payable, installments: createdInstallments }
}

async function fetchPayableForPurchase(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  purchaseId: string | number,
) {
  const payableResult = await client.query(
    `SELECT id::text, status, tipo_lancamento
     FROM erp.contas_pagar
     WHERE empresa_id = $1
       AND compra_id = $2
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, purchaseId],
  )
  const payable = payableResult.rows[0] as ReceivableRow | undefined
  if (!payable) return null

  const installmentsResult = await client.query(
    `SELECT id::text, numero_parcela, valor, status
     FROM erp.contas_pagar_parcelas
     WHERE empresa_id = $1
       AND conta_pagar_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [tenantId, payable.id],
  )

  return {
    payable,
    installments: installmentsResult.rows as InstallmentRow[],
  }
}

function mapConfirmSaleResult(sale: SaleRow, receivable: ReceivableRow, installments: InstallmentRow[]): ConfirmErpSaleResult {
  return {
    sale: {
      id: String(sale.id),
      status: String(sale.status),
    },
    receivable: {
      id: String(receivable.id),
      status: String(receivable.status),
    },
    installments: installments.map((installment) => ({
      id: String(installment.id),
      numero_parcela: Number(installment.numero_parcela),
      valor: Number(installment.valor),
      status: String(installment.status),
    })),
  }
}

function mapConfirmPurchaseResult(
  purchase: PurchaseRow,
  payable: ReceivableRow | null,
  installments: InstallmentRow[],
): ConfirmErpPurchaseResult {
  return {
    purchase: {
      id: String(purchase.id),
      status: String(purchase.status),
    },
    payable: payable
      ? {
          id: String(payable.id),
          status: String(payable.status),
        }
      : null,
    installments: installments.map((installment) => ({
      id: String(installment.id),
      numero_parcela: Number(installment.numero_parcela),
      valor: Number(installment.valor),
      status: String(installment.status),
    })),
  }
}

export async function listErpPurchaseCatalogs(tenantId: number) {
  const [suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, locations, purchaseCandidates] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento FROM erp.entidades WHERE empresa_id = $1 AND eh_fornecedor = true AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, custo AS valor_padrao FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, custo AS valor_padrao FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome FROM erp.categorias categorias LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id WHERE categorias.empresa_id = $1 AND categorias.tipo = 'despesa' AND categorias.ativo = true AND categorias.excluido_em IS NULL AND ${FINANCIAL_CATEGORY_LEAF_SQL} ORDER BY 2`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, codigo, atualiza_estoque, gera_financeiro_padrao FROM erp.naturezas_operacao_compra WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, codigo, padrao FROM erp.locais_estoque WHERE empresa_id = $1 AND ativo = true AND permite_compra = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT compras.id::text, compras.numero, compras.total, entidades.nome AS fornecedor
      FROM erp.compras AS compras
      JOIN erp.entidades AS entidades ON entidades.empresa_id = compras.empresa_id AND entidades.id = compras.fornecedor_id
      WHERE compras.empresa_id = $1 AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM erp.notas_fiscais AS notas
          WHERE notas.empresa_id = compras.empresa_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
        )
      ORDER BY compras.data_compra DESC, compras.id DESC LIMIT 200`, [tenantId]),
  ])

  return { suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, locations, purchaseCandidates }
}

export async function listErpSalesCatalogs(tenantId: number) {
  const [customers, responsibles, products, services, categories, costCenters, financialAccounts, paymentMethods] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento, email, celular, telefone, contato_cobranca_emails, contato_cobranca_whatsapp
      FROM erp.entidades WHERE empresa_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, documento FROM erp.entidades
      WHERE empresa_id = $1 AND eh_vendedor = true AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, preco_venda AS valor_padrao
      FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, preco AS valor_padrao
      FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome FROM erp.categorias categorias LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id WHERE categorias.empresa_id = $1 AND categorias.tipo = 'receita' AND categorias.ativo = true AND categorias.excluido_em IS NULL AND ${FINANCIAL_CATEGORY_LEAF_SQL} ORDER BY 2`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
  ])
  return { customers, responsibles, products, services, categories, costCenters, financialAccounts, paymentMethods }
}

export async function getErpOverview(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
      (SELECT COALESCE(sum(composicao.saldo), 0)
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas ON contas.empresa_id = parcelas.empresa_id AND contas.id = parcelas.conta_receber_id
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_receber,
      (SELECT COALESCE(sum(composicao.saldo), 0)
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas ON contas.empresa_id = parcelas.empresa_id AND contas.id = parcelas.conta_pagar_id
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1 AND contas.tipo_lancamento='efetivo' AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_pagar,
      (SELECT COALESCE(sum(composicao.saldo), 0) FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.data_vencimento < ${ERP_TODAY_SQL} AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado') AND parcelas.excluido_em IS NULL) AS receber_vencido,
      (SELECT count(*)::int FROM erp.vendas WHERE empresa_id = $1 AND status = 'rascunho' AND excluido_em IS NULL) AS vendas_rascunho,
      (SELECT count(*)::int FROM erp.compras WHERE empresa_id = $1 AND tipo_movimento IN ('cotacao', 'pedido_compra', 'pedido_recorrente') AND excluido_em IS NULL) AS compras_abertas,
      (SELECT count(*)::int FROM erp.entidades WHERE empresa_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL) AS clientes_ativos`,
    [tenantId],
  )
  const row = rows[0] || {}
  return {
    saldoReceber: Number(row.saldo_receber || 0), saldoPagar: Number(row.saldo_pagar || 0),
    receberVencido: Number(row.receber_vencido || 0), vendasRascunho: Number(row.vendas_rascunho || 0),
    comprasAbertas: Number(row.compras_abertas || 0), clientesAtivos: Number(row.clientes_ativos || 0),
  }
}

export async function listErpPurchaseInvoices(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
       notas.id::text,
       notas.chave_acesso,
       notas.numero,
       notas.serie,
       notas.status,
       notas.valor_total,
       notas.emitida_em,
       notas.compra_id::text,
       entidades.nome AS fornecedor,
       compras.numero AS compra_numero
     FROM erp.notas_fiscais AS notas
     JOIN erp.entidades AS entidades
       ON entidades.empresa_id = notas.empresa_id AND entidades.id = notas.entidade_id
     LEFT JOIN erp.compras AS compras
       ON compras.empresa_id = notas.empresa_id AND compras.id = notas.compra_id
     WHERE notas.empresa_id = $1
       AND notas.direcao = 'entrada'
       AND notas.excluido_em IS NULL
     ORDER BY notas.emitida_em DESC NULLS LAST, notas.id DESC
     LIMIT 300`,
    [tenantId],
  )
  return rows.map((row) => ({
    id: String(row.id),
    chave_acesso: String(row.chave_acesso || ''),
    numero: String(row.numero || ''),
    serie: String(row.serie || ''),
    fornecedor: String(row.fornecedor || ''),
    valor_total: Number(row.valor_total || 0),
    emitida_em: row.emitida_em ? new Date(String(row.emitida_em)).toISOString() : '',
    status: String(row.status || ''),
    compra_id: String(row.compra_id || ''),
    compra_numero: String(row.compra_numero || ''),
  }))
}

export async function listErpPayments(input: { tenantId: number; type: 'receber' | 'pagar'; accountId: number }) {
  const receiving = input.type === 'receber'
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT pagamentos.id::text, pagamentos.tipo, pagamentos.origem, pagamentos.data_pagamento,
       pagamentos.valor, pagamentos.juros, pagamentos.multa, pagamentos.desconto, pagamentos.taxa,
       pagamentos.valor_liquido, pagamentos.estornado_em, pagamentos.estorno_de_pagamento_id::text,
       parcelas.numero_parcela, financeiras.nome AS conta_financeira, metodos.nome AS metodo_pagamento
     FROM erp.pagamentos AS pagamentos
     JOIN ${receiving ? 'erp.contas_receber_parcelas' : 'erp.contas_pagar_parcelas'} AS parcelas
       ON parcelas.empresa_id = pagamentos.empresa_id
      AND parcelas.id = pagamentos.${receiving ? 'conta_receber_parcela_id' : 'conta_pagar_parcela_id'}
     LEFT JOIN erp.contas_financeiras AS financeiras
       ON financeiras.empresa_id = pagamentos.empresa_id AND financeiras.id = pagamentos.conta_financeira_id
     LEFT JOIN erp.metodos_pagamento AS metodos
       ON metodos.empresa_id = pagamentos.empresa_id AND metodos.id = pagamentos.metodo_pagamento_id
     WHERE pagamentos.empresa_id = $1
       AND parcelas.${receiving ? 'conta_receber_id' : 'conta_pagar_id'} = $2
       AND pagamentos.excluido_em IS NULL
     ORDER BY pagamentos.data_pagamento DESC, pagamentos.id DESC`,
    [input.tenantId, input.accountId],
  )
  return rows.map((row) => ({
    id: String(row.id), tipo: String(row.tipo), origem: String(row.origem),
    data_pagamento: dateText(row.data_pagamento) || '', valor: Number(row.valor || 0),
    juros: Number(row.juros || 0), multa: Number(row.multa || 0), desconto: Number(row.desconto || 0),
    taxa: Number(row.taxa || 0), valor_liquido: Number(row.valor_liquido || 0),
    estornado_em: row.estornado_em ? new Date(String(row.estornado_em)).toISOString() : '',
    estorno_de_pagamento_id: String(row.estorno_de_pagamento_id || ''),
    numero_parcela: Number(row.numero_parcela || 0), conta_financeira: String(row.conta_financeira || ''),
    metodo_pagamento: String(row.metodo_pagamento || ''),
  }))
}

export async function getErpSaleDetails(tenantId: number, idValue: string | number) {
  const id = numericId(idValue, 'Venda')
  const [sales, items, installments, events] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT vendas.*, COALESCE(vendas.cliente_snapshot->>'nome',entidades.nome) AS cliente_nome, COALESCE(vendas.cliente_snapshot->>'documento',entidades.documento) AS cliente_documento
       FROM erp.vendas JOIN erp.entidades
         ON entidades.empresa_id = vendas.empresa_id AND entidades.id = vendas.cliente_id
       WHERE vendas.empresa_id = $1 AND vendas.id = $2 AND vendas.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.quantidade,
         itens.valor_unitario, itens.desconto, itens.total, itens.quantidade_atendida
       FROM erp.vendas_itens itens WHERE itens.empresa_id = $1 AND itens.venda_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.vendas_recebimentos_previstos WHERE empresa_id = $1 AND venda_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, status_anterior, status_novo, versao, dados, criado_em
       FROM erp.vendas_eventos WHERE empresa_id = $1 AND venda_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!sales[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
  return { sale: sales[0], items, installments, events }
}

export async function getErpPurchaseDetails(tenantId: number, idValue: string | number) {
  const id = numericId(idValue, 'Compra')
  const [purchases, items, installments, events, invoices] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT compras.*, entidades.nome AS fornecedor_nome, entidades.documento AS fornecedor_documento
       FROM erp.compras JOIN erp.entidades
         ON entidades.empresa_id = compras.empresa_id AND entidades.id = compras.fornecedor_id
       WHERE compras.empresa_id = $1 AND compras.id = $2 AND compras.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.detalhes,
         itens.unidade, itens.quantidade, itens.quantidade_recebida, itens.local_estoque_id::text,
         itens.valor_unitario, itens.valor_desconto, itens.total, COALESCE(produtos.controla_estoque, false) AS controla_estoque
       FROM erp.compras_itens itens
       LEFT JOIN erp.produtos produtos ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
       WHERE itens.empresa_id = $1 AND itens.compra_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.compras_parcelas_previstas WHERE empresa_id = $1 AND compra_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, dados, criado_em FROM erp.compras_eventos
       WHERE empresa_id = $1 AND compra_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero, serie, chave_acesso, status, valor_total, emitida_em
       FROM erp.notas_fiscais WHERE empresa_id = $1 AND compra_id = $2 AND excluido_em IS NULL
       ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!purchases[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
  return { purchase: purchases[0], items, installments, events, invoices }
}

export async function importErpPurchaseInvoice(input: {
  tenantId: number
  actorId: number
  values: Record<string, unknown>
}) {
  return withTransaction(async (client) => {
    const parsedNfe = parseNfeXml(input.values.xml)
    const values = { ...input.values, ...parsedNfe }
    const key = parsedNfe.chave_acesso
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:nfe-entrada:${input.tenantId}:${key}`])
    const supplierData = jsonObject(values.fornecedor) as Record<string, unknown>
    const supplierName = optionalText(supplierData.nome)
    const supplierDocument = text(supplierData.documento).replace(/\D/g, '')
    if (!supplierName || !supplierDocument) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor da NF-e inválido.')
    const total = money(values.valor_total)
    const issueDate = dateText(values.data_emissao) || erpToday()
    const recipientDocument = text(values.destinatario_documento).replace(/\D/g, '')
    if (!recipientDocument) throw new ErpDomainError('VALIDATION_ERROR', 'Destinatario da NF-e não identificado.')

    const fiscalConfig = await client.query(
      `SELECT regexp_replace(cnpj, '\\D', '', 'g') AS cnpj
       FROM erp.fiscal_issuer_for_operations($1,$2) AS config(empresa_id,id,cnpj,inscricao_estadual,endereco_codigo_municipio)
       WHERE empresa_id = $1
       ORDER BY id LIMIT 1`,
      [input.tenantId, parsedNfe.ambiente || 'producao'],
    )
    const configuredDocument = text(fiscalConfig.rows[0]?.cnpj)
    if (!configuredDocument) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Configure o CNPJ da empresa antes de importar NF-e de entrada.')
    }
    if (configuredDocument !== recipientDocument) {
      throw new ErpDomainError('VALIDATION_ERROR', 'A NF-e não foi emitida para o CNPJ configurado neste tenant.')
    }

    const existingResult = await client.query(
      `SELECT id::text, compra_id::text, status
       FROM erp.notas_fiscais
       WHERE empresa_id = $1 AND chave_acesso = $2 AND direcao = 'entrada' AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, key],
    )
    if (existingResult.rows[0]) return { invoice: existingResult.rows[0], reused: true }

    let supplierResult = await client.query(
      `SELECT id, nome, documento, eh_fornecedor FROM erp.entidades
       WHERE empresa_id = $1 AND regexp_replace(COALESCE(documento, ''), '\\D', '', 'g') = $2
         AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, supplierDocument],
    )
    if (!supplierResult.rows[0]) {
      supplierResult = await client.query(
        `INSERT INTO erp.entidades (
           empresa_id, tipo_pessoa, nome, documento, eh_cliente, eh_fornecedor,
           ativo, criado_por, atualizado_por, metadata
         ) VALUES ($1, 'juridica', $2, $3, false, true, true, $4, $4, $5::jsonb)
         RETURNING id, nome, documento`,
        [input.tenantId, supplierName, supplierDocument, input.actorId, JSON.stringify({ origem: 'xml_nfe' })],
      )
    } else if (!Boolean((supplierResult.rows[0] as Record<string, unknown>).eh_fornecedor)) {
      await client.query(
        `UPDATE erp.entidades SET eh_fornecedor = true, atualizado_por = $3 WHERE empresa_id = $1 AND id = $2`,
        [input.tenantId, supplierResult.rows[0].id, input.actorId],
      )
    }
    const supplier = supplierResult.rows[0]

    const items = Array.isArray(values.itens) ? values.itens as Record<string, unknown>[] : []
    if (items.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'A NF-e não possui itens válidos.')
    const generatePurchase = booleanValue(input.values.gerar_compra ?? true)
    const generateFinancial = booleanValue(input.values.gera_financeiro ?? true)
    const additionalTaxes = Math.max(0, Number((
      total - money(values.valor_produtos) + money(values.desconto) - money(values.frete)
    ).toFixed(2)))
    let purchase: PurchaseRow | null = null

    if (generatePurchase) {
      const requestedPurchaseId = optionalNumericId(input.values.compra_id)
      if (requestedPurchaseId) {
        const existingPurchase = await client.query(
          `SELECT compras.*
           FROM erp.compras AS compras
           WHERE compras.empresa_id = $1 AND compras.id = $2
             AND compras.fornecedor_id = $3 AND compras.total = $4
             AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM erp.notas_fiscais AS notas
               WHERE notas.empresa_id = compras.empresa_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
             )
           FOR UPDATE`,
          [input.tenantId, requestedPurchaseId, supplier.id, total],
        )
        purchase = existingPurchase.rows[0] as PurchaseRow | undefined || null
        if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'A compra escolhida não pertence ao fornecedor ou possui total diferente da NF-e.')
        if (Math.abs(money(purchase.subtotal) - money(values.valor_produtos)) > 0.02) {
          throw new ErpDomainError('VALIDATION_ERROR', 'O subtotal da compra escolhida não confere com os produtos da NF-e.')
        }
      }

      if (!purchase) {
        const purchaseResult = await client.query(
          `INSERT INTO erp.compras (
             empresa_id, fornecedor_id, numero, data_compra, data_competencia,
             status, tipo_compra, tipo_movimento, origem, fornecedor_nome_snapshot,
             fornecedor_documento_snapshot, categoria_id, natureza_operacao_id,
             subtotal, desconto, frete, impostos_adicionais, total, gera_financeiro, condicao_pagamento,
             confirmada_em, recebida_em, criado_por, atualizado_por
           ) VALUES ($1, $2, $3, $4, $4, 'recebida', 'produto', 'compra', 'xml', $5, $6,
             $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, now(), now(), $16, $16)
           RETURNING *`,
          [
            input.tenantId, supplier.id, optionalText(values.numero) || `NFE-${key.slice(-8)}`,
            issueDate, supplier.nome, supplier.documento, optionalNumericId(input.values.categoria_id),
            optionalNumericId(input.values.natureza_operacao_id), money(values.valor_produtos) || total,
            money(values.desconto), money(values.frete), additionalTaxes, total, generateFinancial,
            JSON.stringify({ parcelas: [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dateText(values.data_vencimento) || issueDate, valor: total }] }),
            input.actorId,
          ],
        )
        purchase = purchaseResult.rows[0] as PurchaseRow

        for (const rawItem of items) {
          const code = optionalText(rawItem.codigo)
          const description = optionalText(rawItem.descricao) || 'Item importado da NF-e'
          let productResult = await client.query(
            `SELECT produtos.id, produtos.nome, produtos.unidade_medida
             FROM erp.fornecedores_produtos AS vinculos
             JOIN erp.produtos AS produtos
               ON produtos.empresa_id = vinculos.empresa_id AND produtos.id = vinculos.produto_id
             WHERE vinculos.empresa_id = $1 AND vinculos.fornecedor_id = $2
               AND lower(vinculos.codigo_fornecedor) = lower($3)
               AND vinculos.ativo = true AND vinculos.excluido_em IS NULL
               AND produtos.excluido_em IS NULL
             LIMIT 1`,
            [input.tenantId, supplier.id, code],
          )
          if (!productResult.rows[0]) {
            productResult = await client.query(
              `INSERT INTO erp.produtos (
                 empresa_id, nome, codigo, sku, unidade_medida, ncm, custo, preco_venda,
                 ativo, criado_por, atualizado_por, metadata
               ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $6, true, $7, $7, $8::jsonb)
               RETURNING id, nome, unidade_medida`,
              [input.tenantId, description, `FORN-${supplier.id}-${code || key.slice(-8)}`, optionalText(rawItem.unidade) || 'UN', optionalText(rawItem.ncm), money(rawItem.valor_unitario), input.actorId, JSON.stringify({ origem: 'xml_nfe' })],
            )
          }
          const product = productResult.rows[0]
          const itemTotal = money(rawItem.valor_total)
          const quantity = Number(rawItem.quantidade || 1)
          const unitValue = money(rawItem.valor_unitario)
          if (code) {
            await client.query(
              `INSERT INTO erp.fornecedores_produtos (
                 empresa_id, fornecedor_id, produto_id, codigo_fornecedor,
                 descricao_fornecedor, unidade_fornecedor, ultimo_custo, ultima_compra_em,
                 criado_por, atualizado_por
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
               ON CONFLICT (empresa_id, fornecedor_id, lower(codigo_fornecedor))
                 WHERE excluido_em IS NULL
               DO UPDATE SET produto_id = EXCLUDED.produto_id,
                 descricao_fornecedor = EXCLUDED.descricao_fornecedor,
                 unidade_fornecedor = EXCLUDED.unidade_fornecedor,
                 ultimo_custo = EXCLUDED.ultimo_custo,
                 ultima_compra_em = EXCLUDED.ultima_compra_em,
                 ativo = true,
                 atualizado_por = EXCLUDED.atualizado_por`,
              [input.tenantId, supplier.id, product.id, code, description, optionalText(rawItem.unidade) || 'UN', unitValue, issueDate, input.actorId],
            )
          }
          await client.query(
            `INSERT INTO erp.compras_itens (
               empresa_id, compra_id, produto_id, descricao, unidade, quantidade,
               valor_unitario, valor_bruto, valor_liquido, total, item_codigo_snapshot,
               item_descricao_snapshot, item_unidade_snapshot, criado_por, atualizado_por,
               metadata
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, $9, $4, $5, $10, $10, $11::jsonb)`,
            [input.tenantId, purchase.id, product.id, description, optionalText(rawItem.unidade) || 'UN', quantity, unitValue, itemTotal, code, input.actorId, JSON.stringify({ ncm: rawItem.ncm, cfop: rawItem.cfop })],
          )
        }
        await client.query(
          `INSERT INTO erp.compras_parcelas_previstas (
             empresa_id, compra_id, numero_parcela, descricao, data_vencimento, valor, criado_por, atualizado_por
           ) VALUES ($1, $2, 1, 'Parcela 1', $3, $4, $5, $5)`,
          [input.tenantId, purchase.id, dateText(values.data_vencimento) || issueDate, total, input.actorId],
        )
      } else {
        const updatedPurchase = await client.query(
          `UPDATE erp.compras SET status = 'recebida', tipo_movimento = 'compra', origem = 'xml',
             gera_financeiro = $3, recebida_em = COALESCE(recebida_em, now()), atualizado_por = $4
           WHERE empresa_id = $1 AND id = $2 RETURNING *`,
          [input.tenantId, purchase.id, generateFinancial, input.actorId],
        )
        purchase = updatedPurchase.rows[0] as PurchaseRow
      }

      if (generateFinancial && purchase) await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'efetivo')
    }

    const invoiceResult = await client.query(
      `INSERT INTO erp.notas_fiscais (
         empresa_id, compra_id, entidade_id, tipo, direcao, finalidade, status,
         numero, serie, chave_acesso, protocolo, valor_produtos, valor_total, emitida_em,
         xml_hash, destinatario_documento, codigo_status_sefaz, motivo_status_sefaz,
         payload_enviado, criado_por, atualizado_por, modelo_emissao, ambiente, emitente_snapshot, destinatario_snapshot
       ) VALUES ($1, $2, $3, 'nfe', 'entrada', 'normal', 'emitida', $4, $5, $6,
         $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $16, 'nfe', $17, $18::jsonb, $19::jsonb)
       RETURNING id::text, compra_id::text, status, chave_acesso`,
      [input.tenantId, purchase?.id || null, supplier.id, optionalText(values.numero), optionalText(values.serie), key,
        parsedNfe.protocolo, money(values.valor_produtos), total, issueDate, parsedNfe.xml_hash,
        recipientDocument, parsedNfe.codigo_status_sefaz, parsedNfe.motivo_status_sefaz,
        JSON.stringify({ xml: parsedNfe.xml }), input.actorId, parsedNfe.ambiente ?? null,
        JSON.stringify(parsedNfe.emitente_snapshot), JSON.stringify(parsedNfe.destinatario_snapshot)],
    )
    const invoice = invoiceResult.rows[0]

    await client.query(
      `INSERT INTO erp.notas_fiscais_totais (
         empresa_id, nota_fiscal_id, base_icms, valor_icms, base_icms_st, valor_icms_st,
         valor_fcp, valor_fcp_st, valor_ipi, valor_ii, valor_pis, valor_cofins,
         valor_seguro, outras_despesas, desconto, frete, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)`,
      [input.tenantId, invoice.id, parsedNfe.totais.base_icms, parsedNfe.totais.valor_icms,
        parsedNfe.totais.base_icms_st, parsedNfe.totais.valor_icms_st, parsedNfe.totais.valor_fcp,
        parsedNfe.totais.valor_fcp_st, parsedNfe.totais.valor_ipi, parsedNfe.totais.valor_ii,
        parsedNfe.totais.valor_pis, parsedNfe.totais.valor_cofins, parsedNfe.totais.valor_seguro,
        parsedNfe.totais.outras_despesas, money(values.desconto), money(values.frete), input.actorId],
    )

    for (const [itemIndex, rawItem] of items.entries()) {
      const fiscalItem = parsedNfe.itens[itemIndex]
      await client.query(
        `INSERT INTO erp.notas_fiscais_itens (
           empresa_id, nota_fiscal_id, tipo_item, descricao, quantidade, valor_unitario,
           valor_total, ncm, cfop, payload_item, criado_por, atualizado_por, numero_item, codigo_item, unidade, desconto, tributos
         ) VALUES ($1, $2, 'produto', $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $10, $11, $12, $13, $14, $15::jsonb)`,
        [input.tenantId, invoice.id, optionalText(rawItem.descricao) || 'Item NF-e', Number(rawItem.quantidade || 1), money(rawItem.valor_unitario), money(rawItem.valor_total), optionalText(rawItem.ncm), optionalText(rawItem.cfop), JSON.stringify(rawItem), input.actorId,
          fiscalItem.numero_item, fiscalItem.codigo, fiscalItem.unidade, fiscalItem.desconto, JSON.stringify(fiscalItem.tributos)],
      )
    }
    return { invoice, purchase: purchase ? { id: String(purchase.id), numero: purchase.numero } : null, reused: false }
  })
}

type EntityRoleModuleId = 'clientes' | 'fornecedores' | 'vendedores'

function isEntityRoleModule(entityId: ErpConnectedModuleId): entityId is EntityRoleModuleId {
  return entityId === 'clientes' || entityId === 'fornecedores' || entityId === 'vendedores'
}

function entityRoleColumn(entityId: EntityRoleModuleId) {
  if (entityId === 'clientes') return 'eh_cliente'
  if (entityId === 'fornecedores') return 'eh_fornecedor'
  return 'eh_vendedor'
}

export async function listErpEntityRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  if (isEntityRoleModule(input.entityId)) {
    return listEntityRoleRecords(input)
  }

  if (input.entityId === 'produtos') {
    return listProductRecords(input)
  }

  if (input.entityId === 'servicos') {
    return listServiceRecords(input)
  }

  if (input.entityId === 'categorias') {
    return listCategoryRecords(input)
  }

  if (input.entityId === 'categorias-cadastro') {
    return listRegistrationCategoryRecords(input)
  }

  if (input.entityId === 'pedidos') {
    return listSaleRecords(input)
  }

  if (input.entityId === 'pedidos-compra') {
    return listPurchaseRecords(input)
  }

  if (input.entityId === 'contas-a-receber') {
    return listReceivables(input)
  }

  if (input.entityId === 'contas-a-pagar') {
    return listPayables(input)
  }

  if (input.entityId === 'contas-financeiras') {
    return listFinancialAccountRecords(input)
  }

  return []
}

export async function listErpEntityPage(input: ListInput) {
  const rawRecords = await listErpEntityRecords(input)
  // As contagens e os totais financeiros acompanham as linhas da consulta.
  // Uma pagina fora do intervalo nao tem linha para carrega-los: recuperar
  // somente a primeira pagina com os mesmos filtros preserva esses metadados.
  const metadataRecords = rawRecords.length === 0 && normalizedPage(input) > 1
    ? await listErpEntityRecords({ ...input, page: 1, pageSize: 10 })
    : rawRecords
  const total = metadataRecords.length > 0 ? Number(metadataRecords[0].__total ?? metadataRecords.length) : 0
  const summaryRecord = metadataRecords[0] ?? {}
  const summary = {
    overdue: Number(summaryRecord.__summary_overdue ?? 0),
    dueToday: Number(summaryRecord.__summary_due_today ?? 0),
    upcoming: Number(summaryRecord.__summary_upcoming ?? 0),
    paid: Number(summaryRecord.__summary_paid ?? 0),
    total: Number(summaryRecord.__summary_total ?? 0),
  }
  const records = rawRecords.map((rawRecord) => {
    const record = { ...rawRecord }
    delete record.__total
    delete record.__summary_overdue
    delete record.__summary_due_today
    delete record.__summary_upcoming
    delete record.__summary_paid
    delete record.__summary_total
    return record as ErpEntityRecord
  })

  return {
    records,
    total,
    summary,
    page: normalizedPage(input),
    pageSize: normalizedPageSize(input),
  }
}

async function listEntityRoleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  if (!isEntityRoleModule(input.entityId)) throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de entidade inválido.')
  const roleColumn = entityRoleColumn(input.entityId)
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         id::text,
         nome,
         documento,
         COALESCE((SELECT NULLIF(c.email,'') FROM erp.entidades_contatos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo ORDER BY ('comercial'=ANY(c.principais)) DESC, c.id LIMIT 1), '') AS email,
         COALESCE((SELECT NULLIF(c.telefone,'') FROM erp.entidades_contatos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo ORDER BY ('comercial'=ANY(c.principais)) DESC, c.id LIMIT 1), '') AS telefone,
         COALESCE((SELECT NULLIF(c.cidade,'') FROM erp.entidades_enderecos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo ORDER BY ('comercial'=ANY(c.principais)) DESC, c.id LIMIT 1), '') AS cidade,
         tipo_pessoa,
         versao,
         ativo,
         COALESCE((SELECT c.nome FROM erp.categorias_cadastro c WHERE c.empresa_id = entidades.empresa_id AND c.id = entidades.categoria_id), '') AS categoria,
         concat_ws(' ', nome, documento, email, cidade, (SELECT c.nome FROM erp.categorias_cadastro c WHERE c.empresa_id = entidades.empresa_id AND c.id = entidades.categoria_id),
           (SELECT string_agg(concat_ws(' ',c.nome,c.email,c.telefone),' ') FROM erp.entidades_contatos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo),
           (SELECT string_agg(concat_ws(' ',e.cidade,e.logradouro),' ') FROM erp.entidades_enderecos e WHERE e.empresa_id=entidades.empresa_id AND e.entidade_id=entidades.id AND e.ativo)) AS searchable
       FROM erp.entidades
       WHERE empresa_id = $1
         AND ${roleColumn} = true
         AND excluido_em IS NULL
     )
     SELECT id, nome, documento, email, telefone, cidade, tipo_pessoa, versao, ativo, categoria,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${appendTipoFilter(params, input.filters)}
     ORDER BY nome ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    documento: String(row.documento ?? ''),
    email: String(row.email ?? ''),
    telefone: String(row.telefone ?? ''),
    cidade: String(row.cidade ?? ''),
    categoria: String(row.categoria ?? ''),
    tipo: displayPersonType(row.tipo_pessoa),
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}

async function listProductRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const category = text(input.filters?.categoria)
  let categorySql = ''
  if (category && category !== '__all__') {
    params.push(category)
    categorySql = ` AND categoria = $${params.length}`
  }

  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         produtos.id::text,
         produtos.nome,
         produtos.sku,
         produtos.preco_venda,
         produtos.controla_estoque,
         produtos.estoque_minimo,
         produtos.versao,
         produtos.ativo,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', produtos.nome, produtos.sku, produtos.codigo, categorias.nome) AS searchable
       FROM erp.produtos AS produtos
       LEFT JOIN erp.categorias_cadastro AS categorias
         ON categorias.empresa_id = produtos.empresa_id
        AND categorias.id = produtos.categoria_id
       WHERE produtos.empresa_id = $1
         AND produtos.excluido_em IS NULL
     )
     SELECT id, nome, sku, preco_venda, controla_estoque, estoque_minimo, categoria, versao, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${categorySql}
     ORDER BY nome ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    sku: String(row.sku ?? ''),
    categoria: String(row.categoria ?? ''),
    preco: Number(row.preco_venda ?? 0),
    controla_estoque: row.controla_estoque ? 'Sim' : 'Nao',
    estoque_minimo: Number(row.estoque_minimo ?? 0),
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'pausado',
    __total: Number(row.__total ?? 0),
  }))
}

async function listServiceRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         servicos.id::text,
         servicos.nome,
         servicos.codigo,
         servicos.preco,
         servicos.custo,
         servicos.versao,
         servicos.ativo,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', servicos.nome, servicos.codigo, servicos.descricao, servicos.categoria_id::text, categorias.nome) AS searchable
       FROM erp.servicos AS servicos
       LEFT JOIN erp.categorias_cadastro AS categorias
         ON categorias.empresa_id = servicos.empresa_id
        AND categorias.id = servicos.categoria_id
       WHERE servicos.empresa_id = $1
         AND servicos.excluido_em IS NULL
     )
     SELECT id, nome, codigo, preco, custo, categoria, versao, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}
     ORDER BY nome ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    codigo: String(row.codigo ?? ''),
    categoria: String(row.categoria ?? ''),
    preco: Number(row.preco ?? 0),
    custo: Number(row.custo ?? 0),
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'pausado',
    __total: Number(row.__total ?? 0),
  }))
}

const REGISTRATION_CATEGORY_LABELS: Record<string, string> = { produto: 'Produto', servico: 'Serviço', cliente: 'Cliente', fornecedor: 'Fornecedor' }

// Categorias de cadastro: agrupamentos de produtos, serviços, clientes e fornecedores, com quantos cadastros usam.
async function listRegistrationCategoryRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT categorias.id::text, categorias.nome, categorias.tipo, categorias.ativo, categorias.versao,
         COALESCE(categorias.descricao, '') AS descricao, pai.nome AS categoria_pai,
         CASE categorias.tipo
           WHEN 'produto' THEN (SELECT count(*)::int FROM erp.produtos x WHERE x.empresa_id = categorias.empresa_id AND x.categoria_id = categorias.id AND x.excluido_em IS NULL)
           WHEN 'servico' THEN (SELECT count(*)::int FROM erp.servicos x WHERE x.empresa_id = categorias.empresa_id AND x.categoria_id = categorias.id AND x.excluido_em IS NULL)
           ELSE (SELECT count(*)::int FROM erp.entidades x WHERE x.empresa_id = categorias.empresa_id AND x.categoria_id = categorias.id AND x.excluido_em IS NULL)
         END AS itens,
         concat_ws(' ', categorias.nome, categorias.descricao, pai.nome) AS searchable,
         COALESCE(pai.nome || ' › ', '') || categorias.nome AS ordem_arvore
       FROM erp.categorias_cadastro categorias
       LEFT JOIN erp.categorias_cadastro pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
       WHERE categorias.empresa_id = $1 AND categorias.excluido_em IS NULL
     )
     SELECT id, nome, tipo, ativo, versao, descricao, categoria_pai, itens, ordem_arvore, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${appendTipoFilter(params, input.filters)}
     ORDER BY tipo, ordem_arvore${appendPagination(params, input)}`,
    params,
  )
  return rows.map((row) => ({
    id: String(row.id),
    nome: row.categoria_pai ? `${row.categoria_pai} › ${row.nome}` : String(row.nome ?? ''),
    tipo: String(row.tipo ?? ''),
    descricao: String(row.descricao ?? ''),
    itens: Number(row.itens ?? 0),
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}

async function createRegistrationCategoryRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da categoria')
  const values = await registrationCategoryValues(client, input.tenantId, input.values)
  const result = await client.query(
    `INSERT INTO erp.categorias_cadastro (empresa_id, tipo, nome, descricao, categoria_pai_id, ativo, criado_por, atualizado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`,
    [input.tenantId, values.tipo, text(input.values.nome), optionalText(input.values.descricao), values.parentId, activeFromStatus(input.values.status), input.actorId],
  )
  return { id: String(result.rows[0]?.id) }
}

async function registrationCategoryValues(client: Pick<SQLClient, 'query'>, tenantId: number, values: Record<string, unknown>, id?: number) {
  const tipo = text(values.tipo)
  if (!REGISTRATION_CATEGORY_TYPES.includes(tipo)) throw new ErpDomainError('VALIDATION_ERROR', 'Categoria de cadastro é de produto, serviço, cliente ou fornecedor.')
  const parentId = optionalNumericId(values.categoria_pai_id)
  if (parentId) {
    const parent = await client.query('SELECT tipo, categoria_pai_id FROM erp.categorias_cadastro WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [tenantId, parentId])
    if (!parent.rows[0] || parent.rows[0].tipo !== tipo) throw new ErpDomainError('VALIDATION_ERROR', 'A categoria-pai precisa ser do mesmo tipo.')
    if (parent.rows[0].categoria_pai_id || parentId === id) throw new ErpDomainError('VALIDATION_ERROR', 'Categorias têm no máximo 2 níveis.')
  }
  return { tipo, parentId }
}

async function listCategoryRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         categorias.id::text,
         categorias.nome,
         COALESCE(categorias.metadata ->> 'descricao', '') AS descricao,
         categorias.ativo,
         categorias.tipo,
         categorias.versao,
         pai.nome AS categoria_pai,
         CASE WHEN categorias.fora_dre THEN 'Não entra na DRE' ELSE COALESCE(grupos.nome, 'Não classificado') END AS grupo_dre,
         (SELECT count(*)::int FROM erp.contas_receber t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id AND t.excluido_em IS NULL)
         + (SELECT count(*)::int FROM erp.contas_pagar t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id AND t.excluido_em IS NULL)
         + (SELECT count(*)::int FROM erp.rateios_financeiros t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id AND t.excluido_em IS NULL) AS itens,
         concat_ws(' ', categorias.nome, categorias.metadata ->> 'descricao', pai.nome, grupos.nome) AS searchable,
         COALESCE(pai.nome || ' › ', '') || categorias.nome AS ordem_arvore
       FROM erp.categorias AS categorias
       LEFT JOIN erp.categorias AS pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
       LEFT JOIN erp.dre_grupos AS grupos ON grupos.empresa_id = categorias.empresa_id AND grupos.id = categorias.dre_grupo_id
       WHERE categorias.empresa_id = $1
         AND categorias.excluido_em IS NULL
     )
     SELECT id, nome, descricao, tipo, versao, itens, ativo, categoria_pai, grupo_dre, ordem_arvore,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${appendTipoFilter(params, input.filters)}
     ORDER BY tipo DESC, ordem_arvore ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: row.categoria_pai ? `${row.categoria_pai} › ${row.nome}` : String(row.nome ?? ''),
    descricao: String(row.descricao ?? ''),
    tipo: String(row.tipo ?? ''),
    grupo_dre: String(row.grupo_dre ?? ''),
    versao: Number(row.versao ?? 1),
    itens: Number(row.itens ?? 0),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}

async function listSaleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const documentType = optionalText(input.filters?.tipo_documento)
  const documentClause = documentType ? ` AND vendas.tipo_documento = $${params.push(documentType)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         vendas.id::text,
         vendas.numero,
         vendas.data_venda,
          vendas.status,
          vendas.atendimento_status,
          vendas.fiscal_status,
          vendas.situacao,
          vendas.tipo_documento,
          vendas.validade_em,
          vendas.versao,
          vendas.total,
         entidades.nome AS cliente,
         entidades.id::text AS entidade_id,
         COALESCE(resumo.primeiro_item, 'Sem itens') || CASE WHEN resumo.quantidade_itens > 1 THEN ' + ' || (resumo.quantidade_itens - 1)::text || CASE WHEN resumo.quantidade_itens = 2 THEN ' item' ELSE ' itens' END ELSE '' END AS descricao,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', vendas.numero, entidades.nome, vendas.status, resumo.primeiro_item, categorias.nome) AS searchable
       FROM erp.vendas AS vendas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = vendas.empresa_id
        AND entidades.id = vendas.cliente_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = vendas.empresa_id AND categorias.id = vendas.categoria_id
       LEFT JOIN LATERAL (
         SELECT (array_agg(itens.descricao ORDER BY itens.id))[1] AS primeiro_item, count(*)::int AS quantidade_itens
         FROM erp.vendas_itens AS itens WHERE itens.empresa_id = vendas.empresa_id AND itens.venda_id = vendas.id AND itens.excluido_em IS NULL
       ) AS resumo ON true
        WHERE vendas.empresa_id = $1
          AND vendas.excluido_em IS NULL
          ${documentClause}
      )
      SELECT id, numero, data_venda, status, atendimento_status, fiscal_status, situacao, tipo_documento, validade_em, versao,
        total, cliente, entidade_id, descricao, categoria, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_venda DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    cliente: String(row.cliente ?? ''),
    descricao: String(row.descricao ?? ''),
    categoria: String(row.categoria ?? ''),
    entidade_id: String(row.entidade_id ?? ''),
    data: dateText(row.data_venda) || '',
    total: Number(row.total ?? 0),
    status: String(row.status ?? ''),
    atendimento_status: String(row.atendimento_status ?? 'pendente'),
    fiscal_status: String(row.fiscal_status ?? 'nao_emitida'),
    situacao: String(row.situacao ?? ''),
    tipo_documento: String(row.tipo_documento ?? 'venda'),
    validade: dateText(row.validade_em) || '',
    versao: Number(row.versao ?? 1),
    __total: Number(row.__total ?? 0),
  }))
}

async function listPurchaseRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const movement = optionalText(input.filters?.tipo_movimento)
  const movementClause = movement ? ` AND compras.tipo_movimento = $${params.push(movement)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         compras.id::text,
         compras.numero,
         compras.data_compra,
         compras.data_prevista_entrega,
         compras.status,
         compras.tipo_compra,
         compras.tipo_movimento,
         compras.total,
         compras.gera_financeiro,
         entidades.nome AS fornecedor,
         entidades.id::text AS entidade_id,
         contas.tipo_lancamento,
         COALESCE(resumo.primeiro_item, 'Sem itens') || CASE WHEN resumo.quantidade_itens > 1 THEN ' + ' || (resumo.quantidade_itens - 1)::text || CASE WHEN resumo.quantidade_itens = 2 THEN ' item' ELSE ' itens' END ELSE '' END AS descricao,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', compras.numero, entidades.nome, compras.status, compras.tipo_movimento, resumo.primeiro_item, categorias.nome) AS searchable
       FROM erp.compras AS compras
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = compras.empresa_id
        AND entidades.id = compras.fornecedor_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = compras.empresa_id AND categorias.id = compras.categoria_id
       LEFT JOIN LATERAL (
         SELECT (array_agg(itens.descricao ORDER BY itens.id))[1] AS primeiro_item, count(*)::int AS quantidade_itens
         FROM erp.compras_itens AS itens WHERE itens.empresa_id = compras.empresa_id AND itens.compra_id = compras.id AND itens.excluido_em IS NULL
       ) AS resumo ON true
       LEFT JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = compras.empresa_id
        AND contas.compra_id = compras.id
        AND contas.excluido_em IS NULL
       WHERE compras.empresa_id = $1
         AND compras.excluido_em IS NULL
         ${movementClause}
     )
     SELECT id, numero, data_compra, data_prevista_entrega, status, tipo_compra, tipo_movimento,
       total, gera_financeiro, fornecedor, entidade_id, descricao, categoria, tipo_lancamento, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_compra DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    descricao: String(row.descricao ?? ''),
    categoria: String(row.categoria ?? ''),
    data: dateText(row.data_compra) || '',
    entrega: dateText(row.data_prevista_entrega) || '',
    total: Number(row.total ?? 0),
    tipo_compra: String(row.tipo_compra ?? ''),
    tipo_movimento: String(row.tipo_movimento ?? ''),
    financeiro: row.gera_financeiro ? (row.tipo_lancamento === 'previsao' ? 'Previsao' : row.tipo_lancamento === 'efetivo' ? 'Efetivo' : 'Ao efetivar') : 'Não gera',
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
  }))
}

async function listReceivables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const dueStart = dateText(input.filters?.vencimento_inicio)
  const dueEnd = dateText(input.filters?.vencimento_fim)
  const dueStartClause = dueStart ? ` AND parcelas.data_vencimento >= $${params.push(dueStart)}` : ''
  const dueEndClause = dueEnd ? ` AND parcelas.data_vencimento <= $${params.push(dueEnd)}` : ''
  const launchType = ['previsao', 'efetivo'].includes(text(input.filters?.tipo_lancamento)) ? text(input.filters?.tipo_lancamento) : ''
  const launchTypeClause = launchType ? ` AND contas.tipo_lancamento = $${params.push(launchType)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text AS conta_id,
         parcelas.id::text AS parcela_id,
         contas.descricao,
         contas.numero_documento,
         contas.origem,
         contas.tipo_lancamento,
         parcelas.numero_parcela,
         parcelas.data_vencimento,
         composicao.valor,
         composicao.dinheiro AS valor_pago,
         composicao.credito,
         composicao.transferido AS renegociado,
         composicao.saldo,
         parcelas.valor_bruto,
         parcelas.valor_liquido AS valor_liquido_previsto,
         parcelas.juros AS juros_previstos,
         parcelas.multa AS multa_prevista,
         parcelas.desconto AS desconto_previsto,
         parcelas.taxa AS taxa_prevista,
         parcelas.recebimento_previsto_id::text,
         CASE
           WHEN contas.status = 'cancelado' OR parcelas.status = 'cancelado' THEN 'cancelado'
           WHEN composicao.transferido > 0 THEN 'renegociado'
           WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
           WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial'
           ELSE parcelas.status
         END AS status,
         entidades.nome AS cliente,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status, categorias.nome) AS searchable
       FROM erp.contas_receber AS contas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id
        AND entidades.id = contas.cliente_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = contas.empresa_id AND categorias.id = contas.categoria_id
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id
        AND parcelas.conta_receber_id = contas.id
        AND parcelas.excluido_em IS NULL
       ${financialCompositionSql('receber')}
       WHERE contas.empresa_id = $1
         AND contas.excluido_em IS NULL
         ${dueStartClause}
         ${dueEndClause}
         ${launchTypeClause}
     )
     SELECT *,
       count(*) OVER ()::int AS __total,
       sum(CASE WHEN status = 'vencido' THEN saldo ELSE 0 END) OVER () AS __summary_overdue,
       sum(CASE WHEN data_vencimento = ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_due_today,
       sum(CASE WHEN data_vencimento > ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_upcoming,
       sum(valor_pago) OVER () AS __summary_paid,
       sum(valor) OVER () AS __summary_total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY ${erpListOrder('financeiro', input.sort, 'data_vencimento ASC NULLS LAST')}, parcela_id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.parcela_id),
    conta_id: String(row.conta_id),
    parcela_id: String(row.parcela_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    cliente: String(row.cliente ?? ''),
    categoria: String(row.categoria ?? ''),
    parcela: Number(row.numero_parcela ?? 0),
    vencimento: dateText(row.data_vencimento) || '',
    valor: Number(row.valor ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    credito: Number(row.credito ?? 0),
    renegociado: Number(row.renegociado ?? 0),
    saldo: Number(row.saldo ?? 0),
    origem: String(row.origem ?? ''),
    tipo_lancamento: String(row.tipo_lancamento ?? 'efetivo'),
    recebimento_previsto_id: String(row.recebimento_previsto_id ?? ''),
    valor_bruto: Number(row.valor_bruto ?? 0),
    valor_liquido_previsto: Number(row.valor_liquido_previsto ?? 0),
    juros_previstos: Number(row.juros_previstos ?? 0),
    multa_prevista: Number(row.multa_prevista ?? 0),
    desconto_previsto: Number(row.desconto_previsto ?? 0),
    taxa_prevista: Number(row.taxa_prevista ?? 0),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
    __summary_overdue: Number(row.__summary_overdue ?? 0),
    __summary_due_today: Number(row.__summary_due_today ?? 0),
    __summary_upcoming: Number(row.__summary_upcoming ?? 0),
    __summary_paid: Number(row.__summary_paid ?? 0),
    __summary_total: Number(row.__summary_total ?? 0),
  }))
}

async function listPayables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const origin = optionalText(input.filters?.origem)
  const launchType = optionalText(input.filters?.tipo_lancamento)
  const dueStart = dateText(input.filters?.vencimento_inicio)
  const dueEnd = dateText(input.filters?.vencimento_fim)
  const originClause = origin ? ` AND contas.origem = $${params.push(origin)}` : ''
  const launchTypeClause = launchType ? ` AND contas.tipo_lancamento = $${params.push(launchType)}` : ''
  const dueStartClause = dueStart ? ` AND parcelas.data_vencimento >= $${params.push(dueStart)}` : ''
  const dueEndClause = dueEnd ? ` AND parcelas.data_vencimento <= $${params.push(dueEnd)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text AS conta_id,
         parcelas.id::text AS parcela_id,
         contas.descricao,
         contas.numero_documento,
         contas.origem,
         contas.tipo_lancamento,
         parcelas.numero_parcela,
         parcelas.data_vencimento,
         composicao.valor,
         composicao.dinheiro AS valor_pago,
         composicao.credito,
         composicao.transferido AS renegociado,
         composicao.saldo,
         parcelas.valor_bruto,
         parcelas.valor_liquido AS valor_liquido_previsto,
         parcelas.juros AS juros_previstos,
         parcelas.multa AS multa_prevista,
         parcelas.desconto AS desconto_previsto,
         parcelas.taxa AS taxa_prevista,
         parcelas.parcela_prevista_id::text,
         CASE
           WHEN contas.status = 'cancelado' OR parcelas.status = 'cancelado' THEN 'cancelado'
           WHEN composicao.transferido > 0 THEN 'renegociado'
           WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
           WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial'
           ELSE parcelas.status
         END AS status,
         entidades.nome AS fornecedor,
         entidades.id::text AS entidade_id,
         categorias.nome AS categoria,
         centros.nome AS centro_custo,
         financeiras.nome AS conta_financeira,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status, contas.origem) AS searchable
       FROM erp.contas_pagar AS contas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id
        AND entidades.id = contas.fornecedor_id
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id
        AND parcelas.conta_pagar_id = contas.id
        AND parcelas.excluido_em IS NULL
       ${financialCompositionSql('pagar')}
       LEFT JOIN erp.categorias AS categorias
         ON categorias.empresa_id = contas.empresa_id AND categorias.id = contas.categoria_id
       LEFT JOIN erp.centros_custo AS centros
         ON centros.empresa_id = contas.empresa_id AND centros.id = contas.centro_custo_id
       LEFT JOIN erp.contas_financeiras AS financeiras
         ON financeiras.empresa_id = parcelas.empresa_id AND financeiras.id = parcelas.conta_financeira_id
       WHERE contas.empresa_id = $1
         AND contas.excluido_em IS NULL
         ${originClause}
         ${launchTypeClause}
         ${dueStartClause}
         ${dueEndClause}
     )
     SELECT conta_id, parcela_id, descricao, numero_documento, origem, tipo_lancamento,
       numero_parcela, data_vencimento, valor, valor_pago, credito, renegociado, saldo,
       valor_bruto, valor_liquido_previsto, juros_previstos, multa_prevista, desconto_previsto,
       taxa_prevista, parcela_prevista_id, status, fornecedor, entidade_id,
       categoria, centro_custo, conta_financeira, count(*) OVER ()::int AS __total,
       sum(CASE WHEN status = 'vencido' THEN saldo ELSE 0 END) OVER () AS __summary_overdue,
       sum(CASE WHEN data_vencimento = ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_due_today,
       sum(CASE WHEN data_vencimento > ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_upcoming,
       sum(valor_pago) OVER () AS __summary_paid,
       sum(valor) OVER () AS __summary_total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY ${erpListOrder('financeiro', input.sort, 'data_vencimento ASC NULLS LAST')}, parcela_id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.parcela_id),
    conta_id: String(row.conta_id),
    parcela_id: String(row.parcela_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    entidade_id: String(row.entidade_id ?? ''),
    parcela: Number(row.numero_parcela ?? 0),
    vencimento: dateText(row.data_vencimento) || '',
    valor: Number(row.valor ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    credito: Number(row.credito ?? 0),
    renegociado: Number(row.renegociado ?? 0),
    saldo: Number(row.saldo ?? 0),
    origem: String(row.origem ?? ''),
    tipo_lancamento: String(row.tipo_lancamento ?? ''),
    parcela_prevista_id: String(row.parcela_prevista_id ?? ''),
    valor_bruto: Number(row.valor_bruto ?? 0),
    valor_liquido_previsto: Number(row.valor_liquido_previsto ?? 0),
    juros_previstos: Number(row.juros_previstos ?? 0),
    multa_prevista: Number(row.multa_prevista ?? 0),
    desconto_previsto: Number(row.desconto_previsto ?? 0),
    taxa_prevista: Number(row.taxa_prevista ?? 0),
    categoria: String(row.categoria ?? ''),
    centro_custo: String(row.centro_custo ?? ''),
    conta_financeira: String(row.conta_financeira ?? ''),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
    __summary_overdue: Number(row.__summary_overdue ?? 0),
    __summary_due_today: Number(row.__summary_due_today ?? 0),
    __summary_upcoming: Number(row.__summary_upcoming ?? 0),
    __summary_paid: Number(row.__summary_paid ?? 0),
    __summary_total: Number(row.__summary_total ?? 0),
  }))
}

async function listFinancialAccountRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const tipo = text(input.filters?.tipo)
  let typeSql = ''
  if (tipo && tipo !== '__all__') {
    params.push(tipo)
    typeSql = ` AND tipo = $${params.length}`
  }

  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         id::text,
         nome,
         tipo,
         banco,
         agencia,
         conta,
         saldo_inicial,
         padrao,
         versao,
         ativo,
         concat_ws(' ', nome, tipo, banco, agencia, conta) AS searchable
       FROM erp.contas_financeiras
       WHERE empresa_id = $1
         AND excluido_em IS NULL
     )
     SELECT id, nome, tipo, banco, agencia, conta, saldo_inicial, padrao, versao, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${typeSql}
     ORDER BY nome ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    tipo: String(row.tipo ?? ''),
    banco: String(row.banco ?? ''),
    agencia: String(row.agencia ?? ''),
    conta: String(row.conta ?? ''),
    saldo_inicial: Number(row.saldo_inicial ?? 0),
    padrao: row.padrao ? 'Sim' : 'Nao',
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}

const editableModuleTables = {
  clientes: { table: 'entidades', eventType: 'entidade' },
  fornecedores: { table: 'entidades', eventType: 'entidade' },
  vendedores: { table: 'entidades', eventType: 'entidade' },
  produtos: { table: 'produtos', eventType: 'produto' },
  servicos: { table: 'servicos', eventType: 'servico' },
  categorias: { table: 'categorias', eventType: 'categoria' },
  'categorias-cadastro': { table: 'categorias_cadastro', eventType: 'categoria_cadastro' },
  'contas-financeiras': { table: 'contas_financeiras', eventType: 'conta_financeira' },
} as const

type EditableModuleId = keyof typeof editableModuleTables

function assertEditableModule(entityId: ErpConnectedModuleId): asserts entityId is EditableModuleId {
  if (!(entityId in editableModuleTables)) throw new ErpDomainError('VALIDATION_ERROR', 'Este módulo não permite edição por esta rota.')
}

export async function getErpEntityRecord(input: {
  tenantId: number
  entityId: ErpConnectedModuleId
  id: string | number
}): Promise<ErpEntityRecord> {
  assertEditableModule(input.entityId)
  const id = numericId(input.id, 'Registro')
  let sql = ''
  if (isEntityRoleModule(input.entityId)) {
    const role = entityRoleColumn(input.entityId)
    sql = `SELECT id::text, nome, documento, email, telefone, cidade,
      CASE tipo_pessoa WHEN 'fisica' THEN 'PF' WHEN 'juridica' THEN 'PJ' ELSE 'Estrangeira' END AS tipo,
      COALESCE((SELECT c.nome FROM erp.categorias_cadastro c WHERE c.empresa_id = entidades.empresa_id AND c.id = entidades.categoria_id), '') AS categoria,
      limite_credito, CASE WHEN bloqueio_comercial THEN 'sim' ELSE 'nao' END AS bloqueio_comercial, bloqueio_motivo, tabela_preco_id::text,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao,
      (SELECT COALESCE(jsonb_agg((to_jsonb(c) - 'empresa_id' - 'entidade_id' - 'ativo' - 'criado_em' - 'criado_por' - 'atualizado_em') || jsonb_build_object('id',c.id::text) ORDER BY c.id), '[]'::jsonb)::text FROM erp.entidades_contatos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo) AS contatos_json,
      (SELECT COALESCE(jsonb_agg((to_jsonb(e) - 'empresa_id' - 'entidade_id' - 'ativo' - 'criado_em' - 'criado_por' - 'atualizado_em') || jsonb_build_object('id',e.id::text) ORDER BY e.id), '[]'::jsonb)::text FROM erp.entidades_enderecos e WHERE e.empresa_id=entidades.empresa_id AND e.entidade_id=entidades.id AND e.ativo) AS enderecos_json
      FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND ${role} = true AND excluido_em IS NULL`
  } else if (input.entityId === 'produtos') {
    sql = `SELECT produtos.id::text, produtos.nome, produtos.sku,
      COALESCE(categorias.nome, '') AS categoria, produtos.preco_venda AS preco,
      CASE WHEN produtos.controla_estoque THEN 'sim' ELSE 'nao' END AS controla_estoque,
      CASE WHEN produtos.permite_estoque_negativo THEN 'sim' ELSE 'nao' END AS permite_estoque_negativo,
      produtos.estoque_minimo, produtos.ponto_reposicao,
      CASE WHEN produtos.ativo THEN 'ativo' ELSE 'pausado' END AS status, produtos.versao
      FROM erp.produtos LEFT JOIN erp.categorias_cadastro AS categorias
        ON categorias.empresa_id = produtos.empresa_id AND categorias.id = produtos.categoria_id
      WHERE produtos.empresa_id = $1 AND produtos.id = $2 AND produtos.excluido_em IS NULL`
  } else if (input.entityId === 'servicos') {
    sql = `SELECT servicos.id::text, servicos.nome, servicos.codigo, servicos.descricao, servicos.categoria_id::text,
      COALESCE(categorias.nome, '') AS categoria, servicos.preco, servicos.custo,
      COALESCE(servicos.codigo_tributacao_nacional, '') AS codigo_tributacao_nacional,
      COALESCE(servicos.codigo_servico_municipal, '') AS codigo_servico_municipal, COALESCE(servicos.codigo_nbs, '') AS codigo_nbs,
      CASE WHEN servicos.ativo THEN 'ativo' ELSE 'pausado' END AS status, servicos.versao
      FROM erp.servicos LEFT JOIN erp.categorias_cadastro AS categorias
        ON categorias.empresa_id = servicos.empresa_id AND categorias.id = servicos.categoria_id
      WHERE servicos.empresa_id = $1 AND servicos.id = $2 AND servicos.excluido_em IS NULL`
  } else if (input.entityId === 'categorias-cadastro') {
    sql = `SELECT id::text, nome, tipo, COALESCE(descricao, '') AS descricao, COALESCE(categoria_pai_id::text, 'nenhuma') AS categoria_pai_id,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.categorias_cadastro WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  } else if (input.entityId === 'categorias') {
    sql = `SELECT id::text, nome, tipo, COALESCE(metadata ->> 'descricao', '') AS descricao,
      COALESCE(categoria_pai_id::text, 'nenhuma') AS categoria_pai_id, CASE WHEN fora_dre THEN 'fora' ELSE COALESCE(dre_grupo_id::text, 'nao_classificado') END AS dre_grupo_id,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  } else {
    sql = `SELECT id::text, nome, tipo, banco, agencia, conta, digito, saldo_inicial,
      data_saldo_inicial, CASE WHEN padrao THEN 'sim' ELSE 'nao' END AS padrao,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.contas_financeiras WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  }

  const rows = await runQuery<Record<string, unknown>>(sql, [input.tenantId, id])
  if (!rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  ])) as ErpEntityRecord
}

async function appendRegistrationEvent(
  client: SQLClient,
  input: { tenantId: number; actorId: number; entityId: EditableModuleId; id: number },
  event: string,
  version: number,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  await client.query(
    `INSERT INTO erp.cadastros_eventos (
       empresa_id, entidade_tipo, entidade_id, evento, versao, dados, criado_por
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [input.tenantId, editableModuleTables[input.entityId].eventType, input.id, event, version,
      JSON.stringify({ antes: before, depois: after }), input.actorId],
  )
}

export async function updateErpEntityRecord(input: UpdateInput): Promise<ErpEntityRecord> {
  assertEditableModule(input.entityId)
  const entityId = input.entityId as EditableModuleId
  const id = numericId(input.id, 'Registro')
  await withTransaction(async (client) => {
    const table = editableModuleTables[entityId].table
    const roleClause = isEntityRoleModule(input.entityId) ? ` AND ${entityRoleColumn(input.entityId)} = true` : ''
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE empresa_id = $1 AND id = $2${roleClause} AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
    if (Number(current.versao) !== input.expectedVersion) {
      throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a página.')
    }

    let result: { rows: Record<string, unknown>[] }
    if (isEntityRoleModule(input.entityId)) {
      assertRequired(input.values.nome, 'Nome')
      const category = optionalText(input.values.categoria)
      result = await client.query(
        `UPDATE erp.entidades SET tipo_pessoa = $3, nome = $4, documento = $5, email = $6,
           telefone = $7, cidade = $8, ativo = $9,
           metadata = metadata - 'categoria', categoria_id = CASE WHEN $10::text = '' THEN NULL ELSE categoria_id END,
           categoria_tipo = CASE WHEN $10::text = '' THEN NULL ELSE categoria_tipo END,
           versao = versao + 1, atualizado_por = $11
         WHERE empresa_id = $1 AND id = $2 AND ${entityRoleColumn(input.entityId)} = true AND versao = $12 RETURNING *`,
        [input.tenantId, id, normalizePersonType(input.values.tipo), text(input.values.nome),
          optionalText(input.values.documento), current.email, current.telefone,
          current.cidade, activeFromStatus(input.values.status), category || '', input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'produtos') {
      assertRequired(input.values.nome, 'Nome do produto')
      const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'produto')
      result = await client.query(
        `UPDATE erp.produtos SET nome = $3, sku = $4, codigo = $4, preco_venda = $5,
           categoria_id = $6, ativo = $7, controla_estoque = $8, permite_estoque_negativo = $9,
           estoque_minimo = $10, ponto_reposicao = $11, versao = versao + 1, atualizado_por = $12
         WHERE empresa_id = $1 AND id = $2 AND versao = $13 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.sku), money(input.values.preco),
          categoryId, activeFromStatus(input.values.status), input.values.controla_estoque !== 'nao',
          input.values.permite_estoque_negativo === 'sim', money(input.values.estoque_minimo),
          money(input.values.ponto_reposicao), input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'servicos') {
      assertRequired(input.values.nome, 'Nome do serviço')
      const categoryId = await resolveServiceCategory(client, input)
      const fiscal = serviceFiscalCodes({ codigo_tributacao_nacional: current.codigo_tributacao_nacional, codigo_servico_municipal: current.codigo_servico_municipal, codigo_nbs: current.codigo_nbs, ...input.values })
      result = await client.query(
        `UPDATE erp.servicos SET nome = $3, codigo = $4, descricao = $5, preco = $6, custo = $7,
           categoria_id = $8, ativo = $9, versao = versao + 1, atualizado_por = $10,
           codigo_tributacao_nacional = $12, codigo_servico_municipal = $13, codigo_nbs = $14
         WHERE empresa_id = $1 AND id = $2 AND versao = $11 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.codigo), optionalText(input.values.descricao),
          money(input.values.preco), money(input.values.custo), categoryId, activeFromStatus(input.values.status),
          input.actorId, input.expectedVersion, fiscal.national, fiscal.municipal, fiscal.nbs],
      )
    } else if (input.entityId === 'categorias-cadastro') {
      assertRequired(input.values.nome, 'Nome da categoria')
      const values = await registrationCategoryValues(client, input.tenantId, input.values, id)
      if (values.tipo !== current.tipo) throw new ErpDomainError('VALIDATION_ERROR', 'O tipo da categoria de cadastro não muda; crie outra categoria.')
      result = await client.query(
        `UPDATE erp.categorias_cadastro SET nome = $3, descricao = $4, categoria_pai_id = $5, ativo = $6,
           versao = versao + 1, atualizado_por = $7
         WHERE empresa_id = $1 AND id = $2 AND versao = $8 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.descricao), values.parentId,
          activeFromStatus(input.values.status), input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'categorias') {
      assertRequired(input.values.nome, 'Nome da categoria')
      const classification = await financialCategoryClassification(client, input.tenantId, input.values, id)
      result = await client.query(
        `UPDATE erp.categorias SET nome = $3, tipo = $4, ativo = $5,
           metadata = metadata || jsonb_build_object('descricao', $6::text),
           categoria_pai_id = $9, dre_grupo_id = $10, fora_dre = $11,
           versao = versao + 1, atualizado_por = $7
         WHERE empresa_id = $1 AND id = $2 AND versao = $8 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), classification.tipo, activeFromStatus(input.values.status),
          optionalText(input.values.descricao) || '', input.actorId, input.expectedVersion,
          classification.parentId, classification.groupId, classification.outsideDre],
      )
    } else {
      assertRequired(input.values.nome, 'Nome da conta financeira')
      const makeDefault = booleanValue(input.values.padrao)
      if (makeDefault) {
        await client.query(
          `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2
           WHERE empresa_id = $1 AND id <> $3 AND padrao = true`,
          [input.tenantId, input.actorId, id],
        )
      }
      result = await client.query(
        `UPDATE erp.contas_financeiras SET nome = $3, tipo = $4, banco = $5, agencia = $6,
           conta = $7, digito = $8, saldo_inicial = $9, data_saldo_inicial = $10,
           padrao = $11, ativo = $12, versao = versao + 1, atualizado_por = $13
         WHERE empresa_id = $1 AND id = $2 AND versao = $14 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), financialAccountType(input.values.tipo),
          optionalText(input.values.banco), optionalText(input.values.agencia), optionalText(input.values.conta),
          optionalText(input.values.digito), money(input.values.saldo_inicial), dateText(input.values.data_saldo_inicial),
          makeDefault, activeFromStatus(input.values.status), input.actorId, input.expectedVersion],
      )
    }

    const updated = result.rows[0]
    if (!updated) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a página.')
    const relations = isEntityRoleModule(input.entityId)
      ? await saveRegistrationRelations(client, input.tenantId, id, input.actorId, input.values) : undefined
    if (isEntityRoleModule(input.entityId) && optionalText(input.values.categoria)) await saveEntityCategory(client, input.tenantId, input.actorId, input.entityId, id, input.values.categoria)
    if (input.entityId === 'clientes') await saveCustomerCommercialTerms(client, input.tenantId, id, input.actorId, input.values)
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'atualizado', Number(updated.versao), current, { ...updated, relations })
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}

export async function deactivateErpEntityRecord(input: IdActionInput & { entityId: ErpConnectedModuleId; expectedVersion: number }) {
  assertEditableModule(input.entityId)
  const entityId = input.entityId as EditableModuleId
  const id = numericId(input.id, 'Registro')
  await withTransaction(async (client) => {
    const table = editableModuleTables[entityId].table
    const roleClause = isEntityRoleModule(input.entityId) ? ` AND ${entityRoleColumn(input.entityId)} = true` : ''
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE empresa_id = $1 AND id = $2${roleClause} AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
    if (Number(current.versao) !== input.expectedVersion) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    const result = await client.query(
      `UPDATE erp.${table} SET ativo = false, versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2${roleClause} AND versao = $4 RETURNING *`,
      [input.tenantId, id, input.actorId, input.expectedVersion],
    )
    const updated = result.rows[0]
    if (!updated) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'desativado', Number(updated.versao), current, updated)
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}

export async function getErpEntitySummary(tenantId: number, entityId: ErpConnectedModuleId) {
  assertEditableModule(entityId)
  let sql = ''
  if (isEntityRoleModule(entityId)) {
    const role = entityRoleColumn(entityId)
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE NOT ativo)::int AS inativos,
      count(DISTINCT categoria_id)::int AS categorias
      FROM erp.entidades WHERE empresa_id = $1 AND ${role} = true AND excluido_em IS NULL`
  } else if (entityId === 'produtos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco_venda) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.produtos WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'servicos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.servicos WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'categorias-cadastro') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE ativo AND tipo IN ('produto', 'servico'))::int AS itens,
      count(*) FILTER (WHERE ativo AND tipo IN ('cliente', 'fornecedor'))::int AS pessoas
      FROM erp.categorias_cadastro WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'categorias') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE ativo AND dre_grupo_id IS NULL AND NOT fora_dre)::int AS nao_classificadas,
      count(*) FILTER (WHERE ativo AND NOT EXISTS (SELECT 1 FROM erp.contas_receber t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id) AND NOT EXISTS (SELECT 1 FROM erp.contas_pagar t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id) AND NOT EXISTS (SELECT 1 FROM erp.rateios_financeiros t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id))::int AS sem_itens,
      count(DISTINCT tipo)::int AS tipos FROM erp.categorias WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(*) FILTER (WHERE padrao AND ativo)::int AS padrao,
      COALESCE(sum(saldo_inicial) FILTER (WHERE ativo), 0)::numeric(18,2) AS saldo
      FROM erp.contas_financeiras WHERE empresa_id = $1 AND excluido_em IS NULL`
  }
  const row = (await runQuery<Record<string, unknown>>(sql, [tenantId]))[0] || {}
  const currency = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
  if (entityId === 'produtos' || entityId === 'servicos') return { metrics: [
    { label: entityId === 'produtos' ? 'SKUs ativos' : 'Serviços ativos', value: String(row.ativos || 0), detail: 'catálogo conectado', tone: 'success' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificação em uso' },
    { label: 'Preço médio', value: currency(row.media), detail: 'itens ativos' },
  ] }
  if (entityId === 'categorias-cadastro') return { metrics: [
    { label: 'Categorias ativas', value: String(row.ativos || 0), detail: 'todos os tipos' },
    { label: 'Produtos e serviços', value: String(row.itens || 0), detail: 'categorias de catálogo' },
    { label: 'Clientes e fornecedores', value: String(row.pessoas || 0), detail: 'categorias de pessoas' },
  ] }
  if (entityId === 'categorias') return { metrics: [
    { label: 'Categorias ativas', value: String(row.ativos || 0), detail: 'receitas e despesas' },
    { label: 'Não classificadas', value: String(row.nao_classificadas || 0), detail: 'sem grupo da DRE', tone: 'warning' },
    { label: 'Sem lançamentos', value: String(row.sem_itens || 0), detail: 'ainda não usadas' },
  ] }
  if (entityId === 'contas-financeiras') return { metrics: [
    { label: 'Contas ativas', value: String(row.ativos || 0), detail: 'disponíveis para baixas' },
    { label: 'Conta padrão', value: String(row.padrao || 0), detail: 'selecionada automaticamente' },
    { label: 'Saldo inicial', value: currency(row.saldo), detail: 'soma das contas ativas' },
  ] }
  const roleLabel = entityId === 'clientes' ? 'Clientes' : entityId === 'fornecedores' ? 'Fornecedores' : 'Vendedores'
  return { metrics: [
    { label: `${roleLabel} ativos`, value: String(row.ativos || 0), detail: 'base conectada', tone: 'success' },
    { label: 'Inativos', value: String(row.inativos || 0), detail: 'cadastros pausados' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificacoes em uso' },
  ] }
}

const REGISTRATION_CATEGORY_TYPES = ['produto', 'servico', 'cliente', 'fornecedor']
// Categoria financeira que aceita lançamento: ativa e sem subcategorias (lançamento só no nível mais detalhado).
export const FINANCIAL_CATEGORY_LEAF_SQL = `NOT EXISTS (SELECT 1 FROM erp.categorias filhas WHERE filhas.empresa_id = categorias.empresa_id
  AND filhas.categoria_pai_id = categorias.id AND filhas.excluido_em IS NULL AND filhas.ativo)`

export async function listErpCategoryOptions(tenantId: number, type?: string, useId = false) {
  const requested = text(type)
  if (REGISTRATION_CATEGORY_TYPES.includes(requested)) {
    const rows = await runQuery<{ id: string; nome: string; tipo: string }>(
      `SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome, categorias.tipo
       FROM erp.categorias_cadastro categorias
       LEFT JOIN erp.categorias_cadastro pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
       WHERE categorias.empresa_id = $1 AND categorias.tipo = $2 AND categorias.ativo AND categorias.excluido_em IS NULL
       ORDER BY 2 LIMIT 200`, [tenantId, requested],
    )
    // Clientes e fornecedores guardam o nome; produtos e serviços podem pedir o id.
    return rows.map((row) => ({ value: useId ? row.id : row.nome.split(' › ').pop() || row.nome, label: row.nome, tipo: row.tipo }))
  }
  const params: unknown[] = [tenantId]
  const typeClause = ['receita', 'despesa'].includes(requested) ? ` AND categorias.tipo = $${params.push(requested)}` : ''
  const rows = await runQuery<{ id: string; nome: string; tipo: string }>(
    `SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome, categorias.tipo
     FROM erp.categorias categorias
     LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
     WHERE categorias.empresa_id = $1 AND categorias.ativo = true AND categorias.excluido_em IS NULL
       AND ${FINANCIAL_CATEGORY_LEAF_SQL}${typeClause}
     ORDER BY 2 ASC LIMIT 200`, params,
  )
  return rows.map((row) => ({ value: useId ? row.id : row.nome, label: row.nome, tipo: row.tipo }))
}

// Categorias principais de cadastro (possíveis categorias-pai), de todos os tipos.
export async function listRegistrationCategoryRoots(tenantId: number) {
  const rows = await runQuery<{ id: string; nome: string; tipo: string }>(
    'SELECT id::text, nome, tipo FROM erp.categorias_cadastro WHERE empresa_id = $1 AND categoria_pai_id IS NULL AND ativo AND excluido_em IS NULL ORDER BY tipo, nome', [tenantId])
  return [{ value: 'nenhuma', label: 'Nenhuma: é uma categoria principal' },
    ...rows.map(row => ({ value: row.id, label: `${REGISTRATION_CATEGORY_LABELS[row.tipo] || row.tipo} · ${row.nome}` }))]
}

// Estrutura para a tela de categorias financeiras: grupos da DRE (na ordem da empresa) e categorias principais
// (possíveis categorias-pai).
export async function listFinancialCategoryStructure(tenantId: number) {
  const [groups, roots] = await Promise.all([
    runQuery<{ id: string; codigo: number; nome: string }>('SELECT id::text, codigo, nome FROM erp.dre_grupos WHERE empresa_id = $1 ORDER BY ordem, codigo', [tenantId]),
    runQuery<{ id: string; nome: string; tipo: string }>(
      `SELECT id::text, nome, tipo FROM erp.categorias WHERE empresa_id = $1 AND categoria_pai_id IS NULL AND ativo AND excluido_em IS NULL ORDER BY tipo DESC, nome`, [tenantId]),
  ])
  return {
    grupos: [...groups.map(group => ({ value: group.id, label: `${group.codigo}. ${group.nome}`, codigo: group.codigo })),
      { value: 'fora', label: 'Não entra na DRE (empréstimo, aporte, lucros, equipamento)' },
      { value: 'nao_classificado', label: 'Não classificado (definir depois)' }],
    raizes: [{ value: 'nenhuma', label: 'Nenhuma: é uma categoria principal' },
      ...roots.map(root => ({ value: root.id, label: `${root.tipo === 'receita' ? 'Receita' : 'Despesa'} · ${root.nome}`, tipo: root.tipo }))],
  }
}

// Classificação de uma categoria financeira recebida da tela ou do chat: tipo, categoria-pai, grupo da DRE
// (ou "fora" = não entra na DRE). A subcategoria herda o grupo da pai (o banco garante).
async function financialCategoryClassification(client: Pick<SQLClient, 'query'>, tenantId: number, values: Record<string, unknown>, id?: number) {
  const tipo = text(values.tipo)
  if (tipo !== 'receita' && tipo !== 'despesa') throw new ErpDomainError('VALIDATION_ERROR', 'Categoria financeira é de receita ou de despesa.')
  const parentId = optionalNumericId(values.categoria_pai_id)
  if (parentId) {
    const parent = await client.query('SELECT tipo, categoria_pai_id FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [tenantId, parentId])
    if (!parent.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Categoria-pai não encontrada.', 422)
    if (parent.rows[0].tipo !== tipo) throw new ErpDomainError('VALIDATION_ERROR', 'A subcategoria precisa ser do mesmo tipo da categoria-pai.')
    if (parent.rows[0].categoria_pai_id) throw new ErpDomainError('VALIDATION_ERROR', 'Categorias têm no máximo 2 níveis: escolha uma categoria principal como pai.')
    if (id && parentId === id) throw new ErpDomainError('VALIDATION_ERROR', 'Categoria não pode ser pai dela mesma.')
  }
  // Prioridade: fora da DRE explícito > código do grupo (chat) > grupo escolhido na tela ('fora' = não entra na DRE).
  const code = Number(values.dre_grupo_codigo)
  const hasCode = Number.isInteger(code) && code >= 1 && code <= 9
  const group = values.fora_dre === true ? 'fora' : hasCode || values.fora_dre === false && text(values.dre_grupo_id) === 'fora' ? '' : text(values.dre_grupo_id)
  const outsideDre = group === 'fora'
  let groupId: number | null = null
  if (!outsideDre && hasCode) {
    const found = await client.query('SELECT id FROM erp.dre_grupos WHERE empresa_id = $1 AND codigo = $2', [tenantId, code])
    groupId = Number(found.rows[0]?.id) || null
  } else if (!outsideDre && group && group !== 'nao_classificado') {
    groupId = numericId(group, 'Grupo da DRE')
    const found = await client.query('SELECT id FROM erp.dre_grupos WHERE empresa_id = $1 AND id = $2', [tenantId, groupId])
    if (!found.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Grupo da DRE não encontrado.', 422)
  }
  return { tipo, parentId, groupId: parentId ? null : groupId, outsideDre: parentId ? false : outsideDre }
}

export async function searchErpCatalog(input: {
  tenantId: number
  type: 'cliente' | 'fornecedor' | 'produto' | 'servico' | 'categoria'
  query?: string
  categoryType?: string
  limit?: number
}) {
  const query = `%${text(input.query)}%`
  const limit = Math.min(100, Math.max(10, Math.floor(Number(input.limit || 30))))
  if (input.type === 'cliente' || input.type === 'fornecedor') {
    const role = input.type === 'cliente' ? 'eh_cliente' : 'eh_fornecedor'
    return runQuery(
      `SELECT id::text, nome, documento, email, celular, telefone,
         contato_cobranca_emails, contato_cobranca_whatsapp
       FROM erp.entidades
       WHERE empresa_id = $1 AND ${role} = true AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, documento, email) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'produto') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, unidade_medida AS unidade, preco_venda AS valor_padrao
       FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, sku, codigo, codigo_barras) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'servico') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(codigo, '') AS codigo, preco AS valor_padrao
       FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, codigo, descricao) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  const categoryType = text(input.categoryType)
  if (REGISTRATION_CATEGORY_TYPES.includes(categoryType)) {
    return runQuery(
      `SELECT id::text, nome, tipo FROM erp.categorias_cadastro
       WHERE empresa_id = $1 AND tipo = $4 AND ativo = true AND excluido_em IS NULL AND nome ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit, categoryType],
    )
  }
  const params: unknown[] = [input.tenantId, query, limit]
  const typeClause = ['receita', 'despesa'].includes(categoryType) ? ` AND categorias.tipo = $${params.push(categoryType)}` : ''
  return runQuery(
    `SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome, categorias.tipo
     FROM erp.categorias categorias
     LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
     WHERE categorias.empresa_id = $1 AND categorias.ativo = true AND categorias.excluido_em IS NULL
       AND concat_ws(' ', pai.nome, categorias.nome) ILIKE $2 AND ${FINANCIAL_CATEGORY_LEAF_SQL}${typeClause}
     ORDER BY 2 LIMIT $3`, params,
  )
}

export async function createErpEntityRecord(input: CreateInput): Promise<ErpEntityRecord> {
  const created = await withTransaction(client => createErpEntityWithClient(client,input))
  if (input.entityId === 'contas-a-pagar') return created
  return fetchCreatedRecord(input.tenantId, input.entityId, created.id)
}

export async function createErpEntityWithClient(client: SQLClient, input: CreateInput): Promise<ErpEntityRecord> {
    if (isEntityRoleModule(input.entityId)) {
      return createEntityRoleRecord(client, input)
    }

    if (input.entityId === 'produtos') {
      return createProductRecord(client, input)
    }

    if (input.entityId === 'servicos') {
      return createServiceRecord(client, input)
    }

    if (input.entityId === 'pedidos') {
      return createSaleRecord(client, input)
    }

    if (input.entityId === 'pedidos-compra') {
      return createPurchaseRecord(client, input)
    }

    if (input.entityId === 'contas-a-pagar') {
      return createManualPayableRecord(client, input)
    }

    if (input.entityId === 'contas-a-receber') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Crie contas a receber a partir de vendas.')
    }

    if (input.entityId === 'contas-financeiras') {
      return createFinancialAccountRecord(client, input)
    }

    if (input.entityId === 'categorias-cadastro') {
      return createRegistrationCategoryRecord(client, input)
    }

    return createCategoryRecord(client, input)
}

export async function confirmErpSale(input: ConfirmSaleInput): Promise<ConfirmErpSaleResult> {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT
         id,
         empresa_id,
         cliente_id,
         numero,
         data_venda,
         data_competencia,
         status,
         situacao,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         cobranca_emails,
         cobranca_whatsapp,
          configuracao_lembretes,
          tipo_documento,
          versao
       FROM erp.vendas
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0] as SaleRow | undefined
    if (!sale) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if(input.expectedVersion !== undefined && Number(saleResult.rows[0].versao)!==input.expectedVersion)throw new ErpDomainError('VERSION_CONFLICT','Venda alterada; atualize antes de continuar.',409,undefined,'refresh')
    if (sale.tipo_documento === 'orcamento') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Converta o orçamento em venda antes de confirmar o financeiro.')
    }

    if (sale.status === 'cancelada') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda cancelada não pode ser confirmada.')
    }

    const existingFinancial = await fetchReceivableForSale(client, input.tenantId, sale.id)
    if (existingFinancial) {
      if (sale.status === 'confirmada' && existingFinancial.receivable.status !== 'cancelado') {
        return mapConfirmSaleResult(sale, existingFinancial.receivable, existingFinancial.installments)
      }
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda e conta a receber estao em estados inconsistentes e precisam ser revisadas.')
    }

    if (sale.status !== 'rascunho') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda já saiu de rascunho e ainda não possui contas a receber.')
    }

    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'vendas', date: dateText(sale.data_venda)! })
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: dateText(sale.data_venda)! })

    if (!sale.cliente_id) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter cliente para ser confirmada.')
    }

    if (money(sale.total) <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter total maior que zero para ser confirmada.')
    }

    const customerResult = await client.query(
      `SELECT
         id,
         nome,
         documento,
         email,
         telefone,
         celular,
         contato_cobranca_emails,
         contato_cobranca_whatsapp
       FROM erp.entidades
       WHERE empresa_id = $1
         AND id = $2
         AND eh_cliente = true
         AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, sale.cliente_id],
    )
    const customer = customerResult.rows[0] as Record<string, unknown> | undefined
    if (!customer) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Cliente da venda não foi encontrado ou não esta marcado como cliente.')
    }

    const itemsResult = await client.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE produto_id IS NOT NULL)::int AS produtos
       FROM erp.vendas_itens
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id],
    )
    if (Number(itemsResult.rows[0]?.total || 0) <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter pelo menos um item para ser confirmada.')
    }
    // Bloqueio comercial e limite de crédito do cliente (saldo em aberto + esta venda).
    await assertCustomerCredit(client, { tenantId: input.tenantId, actorId: input.actorId, saleId: Number(sale.id), customerId: Number(sale.cliente_id),
      saleTotal: money(sale.total), override: input.creditOverrideReason ? { motivo: input.creditOverrideReason } : null })

    const updatedSaleResult = await client.query(
      `UPDATE erp.vendas
       SET
         status = 'confirmada',
         situacao = 'aprovada',
         atendimento_status = CASE WHEN $4 > 0 THEN 'pendente' ELSE 'nao_aplicavel' END,
         confirmada_em = COALESCE(confirmada_em, now()),
         versao = versao + 1,
         atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING
         id,
         empresa_id,
         cliente_id,
         numero,
         data_venda,
         data_competencia,
         status,
         situacao,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         cobranca_emails,
         cobranca_whatsapp,
         configuracao_lembretes,
         versao`,
      [input.tenantId, sale.id, input.actorId, Number(itemsResult.rows[0]?.produtos || 0)],
    )
    const updatedSale = updatedSaleResult.rows[0] as SaleRow
    await reserveStockForSale(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      saleId: Number(sale.id),
    })
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'confirmada', $3, $4, $5, '{}'::jsonb, $6)`,
      [input.tenantId, sale.id, sale.status, updatedSale.status, Number(updatedSale.versao || Number(sale.versao || 1) + 1), input.actorId],
    )
    const installments = await resolveSaleInstallments(client, updatedSale)
    const customerEmails = stringArray(customer.contato_cobranca_emails)
    const billingEmails = stringArray(updatedSale.cobranca_emails)
    if (billingEmails.length === 0) {
      billingEmails.push(...(customerEmails.length > 0 ? customerEmails : stringArray([customer.email])))
    }
    const billingWhatsapp = optionalText(updatedSale.cobranca_whatsapp)
      || optionalText(customer.contato_cobranca_whatsapp)
      || optionalText(customer.celular)
      || optionalText(customer.telefone)

    const receivableResult = await client.query(
      `INSERT INTO erp.contas_receber (
         empresa_id,
         cliente_id,
         venda_id,
         descricao,
         numero_documento,
         data_competencia,
         data_emissao,
         valor_total,
         status,
         origem,
         categoria_id,
         centro_custo_id,
         cliente_nome_snapshot,
         cliente_documento_snapshot,
         cobranca_emails,
         cobranca_whatsapp,
         configuracao_lembretes,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aberto', 'venda', $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $16)
       RETURNING id::text, status`,
      [
        input.tenantId,
        updatedSale.cliente_id,
        updatedSale.id,
        `Venda ${updatedSale.numero || updatedSale.id}`,
        updatedSale.numero,
        dateText(updatedSale.data_competencia),
        dateText(updatedSale.data_venda) || erpToday(),
        money(updatedSale.total),
        updatedSale.categoria_id,
        updatedSale.centro_custo_id,
        optionalText(customer.nome),
        optionalText(customer.documento),
        billingEmails,
        billingWhatsapp,
        JSON.stringify(jsonObject(updatedSale.configuracao_lembretes)),
        input.actorId,
      ],
    )
    const receivable = receivableResult.rows[0] as ReceivableRow

    const createdInstallments: InstallmentRow[] = []
    for (const installment of installments) {
      const installmentResult = await client.query(
        `INSERT INTO erp.contas_receber_parcelas (
           empresa_id,
           conta_receber_id,
           numero_parcela,
           descricao,
           data_vencimento,
           data_pagamento_previsto,
           valor,
           valor_bruto,
           valor_liquido,
           valor_pago,
           status,
           conta_financeira_id,
           metodo_pagamento_id,
           recebimento_previsto_id,
           criado_por,
           atualizado_por
         )
         VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $10)
         RETURNING id::text, numero_parcela, valor, status`,
        [
          input.tenantId,
          receivable.id,
          installment.numeroParcela,
          installment.descricao,
          installment.dataVencimento,
          installment.valor,
          installment.contaFinanceiraId ?? updatedSale.conta_financeira_id,
          installment.metodoPagamentoId ?? updatedSale.metodo_pagamento_id,
          installment.commercialForecastId,
          input.actorId,
        ],
      )
      createdInstallments.push(installmentResult.rows[0] as InstallmentRow)
    }

    // Comissões por item, pela regra mais específica do vendedor da venda.
    await generateSaleCommissions(client, input.tenantId, Number(sale.id), input.actorId)
    return mapConfirmSaleResult(updatedSale, receivable, createdInstallments)
  })
}

export async function cancelErpSale(input: IdActionInput & { reason?: string | null; expectedVersion?: number }) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, empresa_id, status, versao
       FROM erp.vendas
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const sale = saleResult.rows[0] as { id: string | number; status: string } | undefined
    if (!sale) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if(input.expectedVersion !== undefined && Number(saleResult.rows[0].versao)!==input.expectedVersion)throw new ErpDomainError('VERSION_CONFLICT','Venda alterada; atualize antes de continuar.',409,undefined,'refresh')
    if (sale.status === 'cancelada') return { id: String(sale.id), status: 'cancelada' }

    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (invoiceResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cancele ou exclua a nota fiscal antes de cancelar a venda.')

    const chargeResult = await client.query(
      `SELECT cobrancas.id
       FROM erp.cobrancas AS cobrancas
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = cobrancas.empresa_id
        AND parcelas.id = cobrancas.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       WHERE cobrancas.empresa_id = $1
         AND contas.venda_id = $2
         AND cobrancas.excluido_em IS NULL
         AND cobrancas.status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (chargeResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cancele a cobrança ativa antes de cancelar a venda.')

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = pagamentos.empresa_id
        AND parcelas.id = pagamentos.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       WHERE pagamentos.empresa_id = $1
         AND contas.venda_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (paymentResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Venda com pagamento não pode ser cancelada sem estorno.')

    await releaseStockForSale(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      saleId: Number(sale.id),
    })

    await client.query(
      `UPDATE erp.contas_receber_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_receber AS contas
       WHERE parcelas.empresa_id = contas.empresa_id
         AND parcelas.conta_receber_id = contas.id
         AND contas.empresa_id = $1
         AND contas.venda_id = $2
         AND parcelas.excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId],
    )
    await client.query(
      `UPDATE erp.contas_receber
       SET
         status = 'cancelado',
         cancelado_em = COALESCE(cancelado_em, now()),
         motivo_cancelamento = COALESCE($4, motivo_cancelamento),
         atualizado_por = $3
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId, optionalText(input.reason)],
    )
    const updated = await client.query(
      `UPDATE erp.vendas
       SET status = 'cancelada', situacao = 'cancelada', atendimento_status = 'cancelado',
         fiscal_status = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()),
         versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING id::text, status, versao`,
      [input.tenantId, sale.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'cancelada', $3, 'cancelada', $4, $5::jsonb, $6)`,
      [input.tenantId, sale.id, sale.status, Number(updated.rows[0]?.versao || 1),
        JSON.stringify({ motivo: optionalText(input.reason) }), input.actorId],
    )
    await cancelSaleCommissions(client, input.tenantId, Number(sale.id), input.actorId)
    return updated.rows[0]
  })
}

export async function confirmErpPurchase(input: IdActionInput): Promise<ConfirmErpPurchaseResult> {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT
         id,
         empresa_id,
         fornecedor_id,
         numero,
         data_compra,
         data_competencia,
         status,
         tipo_compra,
         tipo_movimento,
         origem,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro,
         fornecedor_nome_snapshot,
         fornecedor_documento_snapshot
       FROM erp.compras
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as PurchaseRow | undefined
    if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    if (purchase.status === 'cancelada') throw new ErpDomainError('VALIDATION_ERROR', 'Compra cancelada não pode ser confirmada.')
    if (!purchase.fornecedor_id) throw new ErpDomainError('VALIDATION_ERROR', 'Compra precisa ter fornecedor para ser confirmada.')
    if (money(purchase.total) <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Compra precisa ter total maior que zero para ser confirmada.')

    const itemResult = await client.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE itens.produto_id IS NOT NULL AND produtos.controla_estoque)::int AS itens_estoque
       FROM erp.compras_itens itens
       LEFT JOIN erp.produtos produtos ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
       WHERE itens.empresa_id = $1
         AND itens.compra_id = $2
         AND itens.excluido_em IS NULL`,
      [input.tenantId, purchase.id],
    )
    if (Number(itemResult.rows[0]?.total || 0) <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Compra precisa ter pelo menos um item para ser confirmada.')
    }

    const existingFinancial = await fetchPayableForPurchase(client, input.tenantId, purchase.id)
    if (purchase.tipo_movimento === 'compra' && ['confirmada', 'parcialmente_recebida', 'recebida'].includes(String(purchase.status))
      && (!purchase.gera_financeiro || existingFinancial?.payable.tipo_lancamento === 'efetivo')) {
      return mapConfirmPurchaseResult(purchase, existingFinancial?.payable || null, existingFinancial?.installments || [])
    }

    const purchaseDate=dateText(purchase.data_compra)
    if(!purchaseDate)throw new ErpDomainError('VALIDATION_ERROR','Compra precisa ter data valida para ser confirmada.')
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'compras', date: purchaseDate })
    if (purchase.gera_financeiro) {
      await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: purchaseDate })
    }

    const updatedPurchaseResult = await client.query(
      `UPDATE erp.compras
       SET status = CASE WHEN $4::int = 0 THEN 'recebida' ELSE 'confirmada' END,
           tipo_movimento = 'compra',
           confirmada_em = COALESCE(confirmada_em, now()),
           recebida_em = CASE WHEN $4::int = 0 THEN COALESCE(recebida_em, now()) ELSE recebida_em END,
           versao = versao + 1,
           atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING
         id,
         empresa_id,
         fornecedor_id,
         numero,
         data_compra,
         data_competencia,
         status,
         tipo_compra,
         tipo_movimento,
         origem,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro,
         fornecedor_nome_snapshot,
         fornecedor_documento_snapshot`,
      [input.tenantId, purchase.id, input.actorId, Number(itemResult.rows[0]?.itens_estoque || 0)],
    )
    const updatedPurchase = updatedPurchaseResult.rows[0] as PurchaseRow
    if (!updatedPurchase.gera_financeiro) {
      await client.query(
        `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
         VALUES ($1, $2, 'confirmada_sem_financeiro', '{}'::jsonb, $3)`,
        [input.tenantId, updatedPurchase.id, input.actorId],
      )
      return mapConfirmPurchaseResult(updatedPurchase, null, [])
    }
    const financial = await createOrUpdatePurchasePayable(client, updatedPurchase, input.actorId, 'efetivo')
    if (!financial) return mapConfirmPurchaseResult(updatedPurchase, null, [])
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'confirmada', $3::jsonb, $4)`,
      [input.tenantId, updatedPurchase.id, JSON.stringify({ conta_pagar_id: financial.payable.id }), input.actorId],
    )
    return mapConfirmPurchaseResult(updatedPurchase, financial.payable, financial.installments)
  })
}

export async function cancelErpPurchase(input: IdActionInput) {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT id, empresa_id, status
       FROM erp.compras
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as { id: string | number; status: string } | undefined
    if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    if (purchase.status === 'cancelada') return { id: String(purchase.id), status: 'cancelada' }

    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE empresa_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    if (invoiceResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Desvincule ou cancele a nota fiscal antes de cancelar a compra.')

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = pagamentos.empresa_id
        AND parcelas.id = pagamentos.conta_pagar_parcela_id
       JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_pagar_id
       WHERE pagamentos.empresa_id = $1
         AND contas.compra_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    if (paymentResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Compra com pagamento não pode ser cancelada sem estorno.')

    await reverseStockForPurchase(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      purchaseId: Number(purchase.id),
    })

    await client.query(
      `UPDATE erp.contas_pagar_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_pagar AS contas
       WHERE parcelas.empresa_id = contas.empresa_id
         AND parcelas.conta_pagar_id = contas.id
         AND contas.empresa_id = $1
         AND contas.compra_id = $2
         AND parcelas.excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `UPDATE erp.contas_pagar
       SET status = 'cancelado', cancelado_em = COALESCE(cancelado_em, now()), atualizado_por = $3
       WHERE empresa_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    const updated = await client.query(
      `UPDATE erp.compras
       SET status = 'cancelada', tipo_movimento = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()), versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING id::text, status`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'cancelada', '{}'::jsonb, $3)`,
      [input.tenantId, purchase.id, input.actorId],
    )
    return updated.rows[0]
  })
}

function paymentAdjustment(value: unknown) {
  return nonNegativeDecimal(value === undefined || value === null || value === '' ? 0 : value)
}

function paymentMethodId(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function paymentOrigin(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['manual', 'conciliacao', 'boleto', 'pix', 'cartao', 'api'].includes(normalized)) return normalized
  return 'manual'
}

function paymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  const netValue = paymentTotal(amount, juros, multa, desconto, taxa, 'receber')
  if (netValue < 0) throw new ErpDomainError('VALIDATION_ERROR', 'Desconto e taxa não podem superar o valor recebido.')
  return netValue
}

function payablePaymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  const netValue = paymentTotal(amount, juros, multa, desconto, taxa, 'pagar')
  if (netValue < 0) throw new ErpDomainError('VALIDATION_ERROR', 'O desconto não pode superar o valor do pagamento.')
  return netValue
}

async function recalculateReceivableInstallment(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  installmentId: string | number,
  actorId: number,
  paymentDate?: string | null,
) {
  const result = await client.query(
    `WITH totals AS (
       SELECT composicao.* FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id=$1 AND parcelas.id=$2
     )
     UPDATE erp.contas_receber_parcelas AS parcelas
     SET
       valor_pago = totals.dinheiro,
       data_pagamento = CASE
         WHEN totals.saldo = 0 THEN COALESCE($4::date, parcelas.data_pagamento, ${ERP_TODAY_SQL})
         ELSE NULL
       END,
       status = CASE
         WHEN totals.transferido > 0 THEN 'renegociado'
         WHEN totals.saldo = 0 THEN 'pago'
         WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
         WHEN totals.dinheiro + totals.credito > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.empresa_id = $1
       AND parcelas.id = $2
     RETURNING parcelas.id::text, parcelas.conta_receber_id::text, parcelas.valor, parcelas.valor_pago, parcelas.status`,
    [tenantId, installmentId, actorId, paymentDate || null],
  )
  return result.rows[0] as Record<string, unknown>
}

async function recalculatePayableInstallment(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  installmentId: string | number,
  actorId: number,
  paymentDate?: string | null,
) {
  const result = await client.query(
    `WITH totals AS (
       SELECT composicao.* FROM erp.contas_pagar_parcelas parcelas
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id=$1 AND parcelas.id=$2
     )
     UPDATE erp.contas_pagar_parcelas AS parcelas
     SET
       valor_pago = totals.dinheiro,
       data_pagamento = CASE
         WHEN totals.saldo = 0 THEN COALESCE($4::date, parcelas.data_pagamento, ${ERP_TODAY_SQL})
         ELSE NULL
       END,
       status = CASE
         WHEN totals.transferido > 0 THEN 'renegociado'
         WHEN totals.saldo = 0 THEN 'pago'
         WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
         WHEN totals.dinheiro + totals.credito > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.empresa_id = $1
       AND parcelas.id = $2
     RETURNING parcelas.id::text, parcelas.conta_pagar_id::text, parcelas.valor, parcelas.valor_pago, parcelas.status`,
    [tenantId, installmentId, actorId, paymentDate || null],
  )
  return result.rows[0] as Record<string, unknown>
}

export async function settleReceivableInstallment(input: SettleInstallmentInput) {
  const idempotencyKey = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const requestIdentity = settlementIdentity('receber', input.id, input.values)
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:pagamento:${input.tenantId}:${idempotencyKey}`])
    const existingPaymentResult = await client.query(
      `SELECT id::text, tipo, conta_receber_parcela_id::text, valor, valor_liquido, metadata
       FROM erp.pagamentos WHERE empresa_id=$1 AND chave_idempotencia=$2 LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
    if (existingPayment) {
      if (existingPayment.tipo !== 'receber' || String(existingPayment.conta_receber_parcela_id) !== String(input.id)) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada em outra baixa.', 409)
      assertSettlementReplay(existingPayment.metadata, requestIdentity)
    }
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_receber_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id,
         composicao.credito,
         composicao.transferido,
         composicao.saldo
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new ErpDomainError('VALIDATION_ERROR', 'Parcela a receber não encontrada.')
    if (existingPayment) return {
      payment: { id: String(existingPayment.id), valor: existingPayment.valor, valor_liquido: existingPayment.valor_liquido },
      installment: { id: String(installment.id), conta_receber_id: String(installment.conta_receber_id), valor: installment.valor, valor_pago: installment.valor_pago, status: installment.status },
    }
    if (installment.status === 'cancelado') throw new ErpDomainError('VALIDATION_ERROR', 'Parcela cancelada não pode ser baixada.')
    if (installment.status === 'pago') throw new ErpDomainError('VALIDATION_ERROR', 'Parcela já esta paga.')

    const remaining = money(installment.saldo)
    const amount = requestIdentity.amount === 'remaining' ? remaining : paymentAdjustment(input.values.valor)
    if (amount <= 0 || amount > remaining) throw new ErpDomainError('VALIDATION_ERROR', 'Valor da baixa inválido.')

    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    // Cartão pela maquininha: o recebimento entra na conta da maquininha (a taxa e os repasses vêm depois).
    const card = await cardMethodConfig(client, input.tenantId, methodId)
    if (card && (paymentAdjustment(input.values.taxa) || 0) > 0) throw new ErpDomainError('VALIDATION_ERROR', 'Com esta forma de pagamento a taxa do cartão é calculada pelo ERP; não informe a taxa.')
    const financialAccountId = card ? card.conta_maquininha_id : await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const paymentDate = dateText(input.values.data_pagamento) || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: paymentDate })
    const netValue = paymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_receber_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         criado_por,
         atualizado_por,
         metadata
       )
       VALUES ($1, 'receber', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15::jsonb)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
        paymentOrigin(input.values.origem),
        idempotencyKey,
        installment.id,
        financialAccountId,
        methodId,
        paymentDate,
        amount,
        paymentAdjustment(input.values.juros),
        paymentAdjustment(input.values.multa),
        paymentAdjustment(input.values.desconto),
        paymentAdjustment(input.values.taxa),
        netValue,
        input.actorId,
        JSON.stringify({ settlementRequest: requestIdentity }),
      ],
    )

// Uma conta/método já iguais não devem atualizar o resumo antes do recálculo.
    await client.query(
      `UPDATE erp.contas_receber_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE empresa_id = $1
         AND id = $2
         AND (conta_financeira_id IS DISTINCT FROM $3::bigint OR metodo_pagamento_id IS DISTINCT FROM $4::bigint)`,
      [input.tenantId, installment.id, financialAccountId, methodId, input.actorId],
    )
    const updatedInstallment = await recalculateReceivableInstallment(
      client,
      input.tenantId,
      String(installment.id),
      input.actorId,
      paymentDate,
    )
    await updateReceivableStatus(client, input.tenantId, String(updatedInstallment.conta_receber_id), input.actorId)
    const cardResult = card ? await applyCardReceipt(client, {
      tenantId: input.tenantId, actorId: input.actorId, paymentId: Number(paymentResult.rows[0].id), gross: netValue, date: paymentDate,
      installments: input.values.parcelas_cartao, config: card, settlePayable: settlePayableInstallment,
    }) : null

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
      ...(cardResult ? { cartao: cardResult } : {}),
    }
  })
}

export async function settlePayableInstallment(input: SettleInstallmentInput) {
  const idempotencyKey = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const requestIdentity = settlementIdentity('pagar', input.id, input.values)
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:pagamento:${input.tenantId}:${idempotencyKey}`])
    const existingPaymentResult = await client.query(
      `SELECT id::text, tipo, conta_pagar_parcela_id::text, valor, valor_liquido, metadata
       FROM erp.pagamentos WHERE empresa_id=$1 AND chave_idempotencia=$2 LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
    if (existingPayment) {
      if (existingPayment.tipo !== 'pagar' || String(existingPayment.conta_pagar_parcela_id) !== String(input.id)) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada em outra baixa.', 409)
      assertSettlementReplay(existingPayment.metadata, requestIdentity)
    }
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_pagar_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id,
         contas.tipo_lancamento,
         composicao.credito,
         composicao.transferido,
         composicao.saldo
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_pagar_id
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new ErpDomainError('VALIDATION_ERROR', 'Parcela a pagar não encontrada.')
    if (existingPayment) return {
      payment: { id: String(existingPayment.id), valor: existingPayment.valor, valor_liquido: existingPayment.valor_liquido },
      installment: { id: String(installment.id), conta_pagar_id: String(installment.conta_pagar_id), valor: installment.valor, valor_pago: installment.valor_pago, status: installment.status },
    }
    if (installment.status === 'cancelado') throw new ErpDomainError('VALIDATION_ERROR', 'Parcela cancelada não pode ser baixada.')
    if (installment.status === 'pago') throw new ErpDomainError('VALIDATION_ERROR', 'Parcela já esta paga.')
    if (installment.tipo_lancamento === 'previsao') throw new ErpDomainError('VALIDATION_ERROR', 'Efetive a previsão antes de registrar o pagamento.')

    const remaining = money(installment.saldo)
    const amount = requestIdentity.amount === 'remaining' ? remaining : paymentAdjustment(input.values.valor)
    if (amount <= 0 || amount > remaining) throw new ErpDomainError('VALIDATION_ERROR', 'Valor da baixa inválido.')

    const financialAccountId = await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    const paymentDate = dateText(input.values.data_pagamento) || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: paymentDate })
    const netValue = payablePaymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         criado_por,
         atualizado_por,
         metadata
       )
       VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15::jsonb)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
        paymentOrigin(input.values.origem),
        idempotencyKey,
        installment.id,
        financialAccountId,
        methodId,
        paymentDate,
        amount,
        paymentAdjustment(input.values.juros),
        paymentAdjustment(input.values.multa),
        paymentAdjustment(input.values.desconto),
        paymentAdjustment(input.values.taxa),
        netValue,
        input.actorId,
        JSON.stringify({ settlementRequest: requestIdentity }),
      ],
    )

// Uma conta/método já iguais não devem atualizar o resumo antes do recálculo.
    await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE empresa_id = $1
         AND id = $2
         AND (conta_financeira_id IS DISTINCT FROM $3::bigint OR metodo_pagamento_id IS DISTINCT FROM $4::bigint)`,
      [input.tenantId, installment.id, financialAccountId, methodId, input.actorId],
    )
    const updatedInstallment = await recalculatePayableInstallment(
      client,
      input.tenantId,
      String(installment.id),
      input.actorId,
      paymentDate,
    )
    await updatePayableStatus(client, input.tenantId, String(updatedInstallment.conta_pagar_id), input.actorId)

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
    }
  })
}

export async function reverseErpPayment(input: ReversePaymentInput) {
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT
         id,
         tipo,
         conta_receber_parcela_id,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         data_pagamento,
         estornado_em,
         estorno_de_pagamento_id
       FROM erp.pagamentos
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
    if (!payment) throw new ErpDomainError('VALIDATION_ERROR', 'Pagamento não encontrado.')
    if (payment.estorno_de_pagamento_id) throw new ErpDomainError('VALIDATION_ERROR', 'Um estorno não pode ser estornado diretamente.')

    if (payment.estornado_em) {
      const existingReversal = await client.query(
        `SELECT id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text
         FROM erp.pagamentos
         WHERE empresa_id = $1
           AND estorno_de_pagamento_id = $2
           AND excluido_em IS NULL
         ORDER BY id ASC
         LIMIT 1`,
        [input.tenantId, payment.id],
      )
      return { payment, reversal: existingReversal.rows[0] || null }
    }

    const reversalDate = erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: reversalDate })

    const receivableInstallmentId = payment.conta_receber_parcela_id
    const payableInstallmentId = payment.conta_pagar_parcela_id
    const installmentTable = payment.tipo === 'receber' ? 'erp.contas_receber_parcelas' : 'erp.contas_pagar_parcelas'
    const installmentId = payment.tipo === 'receber' ? receivableInstallmentId : payableInstallmentId
    await client.query(
      `SELECT id FROM ${installmentTable} WHERE empresa_id = $1 AND id = $2 FOR UPDATE`,
      [input.tenantId, installmentId],
    )

    const idempotencyKey = requireOperationKey(input.idempotencyKey)
    const reason = optionalText(input.reason)
    if (!reason) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o motivo do estorno.')
    await client.query(
      `UPDATE erp.pagamentos
       SET estornado_em = now(), atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2 AND estornado_em IS NULL`,
      [input.tenantId, payment.id, input.actorId],
    )
    const reversalResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_receber_parcela_id,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         estorno_de_pagamento_id,
         motivo_estorno,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, 'estorno', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
       RETURNING id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text`,
      [
        input.tenantId,
        payment.tipo,
        idempotencyKey,
        receivableInstallmentId,
        payableInstallmentId,
        payment.conta_financeira_id,
        payment.metodo_pagamento_id,
        reversalDate,
        payment.valor,
        payment.juros,
        payment.multa,
        payment.desconto,
        payment.taxa,
        payment.valor_liquido,
        payment.id,
        reason,
        input.actorId,
      ],
    )

    if (payment.tipo === 'receber') {
      const installment = await recalculateReceivableInstallment(
        client,
        input.tenantId,
        String(receivableInstallmentId),
        input.actorId,
      )
      await updateReceivableStatus(client, input.tenantId, String(installment.conta_receber_id), input.actorId)
    } else {
      const installment = await recalculatePayableInstallment(
        client,
        input.tenantId,
        String(payableInstallmentId),
        input.actorId,
      )
      await updatePayableStatus(client, input.tenantId, String(installment.conta_pagar_id), input.actorId)
    }

    // Recebimento no cartão: cancela os repasses pendentes e estorna a taxa.
    if (payment.tipo === 'receber') await cancelCardReceipt(client, { tenantId: input.tenantId, actorId: input.actorId, paymentId: Number(payment.id), reversePayment: reverseErpPayment })

    return { payment: { ...payment, estornado_em: new Date().toISOString() }, reversal: reversalResult.rows[0] }
  })
}

async function createEntityRoleRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome')
  if (!isEntityRoleModule(input.entityId)) throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de entidade inválido.')
  const category = optionalText(input.values.categoria)
  const result = await client.query(
    `INSERT INTO erp.entidades (
       empresa_id,
       tipo_pessoa,
       nome,
       documento,
       email,
       telefone,
       cidade,
       eh_cliente,
       eh_fornecedor,
       eh_vendedor,
       ativo,
       metadata,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $13)
     RETURNING id`,
    [
      input.tenantId,
      normalizePersonType(input.values.tipo),
      text(input.values.nome),
      optionalText(input.values.documento),
      optionalText(input.values.email),
      optionalText(input.values.telefone),
      optionalText(input.values.cidade),
      input.entityId === 'clientes',
      input.entityId === 'fornecedores',
      input.entityId === 'vendedores',
      activeFromStatus(input.values.status),
      JSON.stringify({}),
      input.actorId,
    ],
  )
  const id = Number(result.rows[0]?.id)
  await saveEntityCategory(client, input.tenantId, input.actorId, input.entityId, id, category)
  const relations = await saveRegistrationRelations(client, input.tenantId, id, input.actorId, input.values)
  if (input.entityId === 'clientes') await saveCustomerCommercialTerms(client, input.tenantId, id, input.actorId, input.values)
  await appendRegistrationEvent(client, { ...input, entityId: input.entityId, id }, 'criado', 1, {}, { ...input.values, relations })
  return { id: String(id) }
}

async function createProductRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome do produto')
  const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'produto')
  const result = await client.query(
    `INSERT INTO erp.produtos (
       empresa_id,
       nome,
       sku,
       codigo,
       preco_venda,
       categoria_id,
       controla_estoque,
       permite_estoque_negativo,
       estoque_minimo,
       ponto_reposicao,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      optionalText(input.values.sku),
      money(input.values.preco),
      categoryId,
      input.values.controla_estoque !== 'nao',
      input.values.permite_estoque_negativo === 'sim',
      money(input.values.estoque_minimo),
      money(input.values.ponto_reposicao),
      activeFromStatus(input.values.status),
      input.actorId,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function resolveServiceCategory(client: Pick<SQLClient, 'query'>, input: CreateInput | UpdateInput) {
  if (input.values.categoria_id === '' || input.values.categoria_id === null) return null
  if (input.values.categoria_id === undefined) return resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'servico')
  const id = numericId(input.values.categoria_id, 'Categoria')
  const result = await client.query("SELECT id FROM erp.categorias_cadastro WHERE empresa_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL AND tipo='servico'", [input.tenantId,id])
  if (!result.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Selecione uma categoria ativa de serviços da empresa.', 422)
  return id
}

// Códigos fiscais do serviço para a NFS-e: aceita com ou sem pontuação (ex.: 01.07.01 vira 010701).
function serviceFiscalCodes(values: Record<string, unknown>) {
  const digitsOf = (value: unknown) => String(value ?? '').replace(/\D/g, '')
  const national = digitsOf(values.codigo_tributacao_nacional), nbs = digitsOf(values.codigo_nbs)
  if (national && national.length !== 6) throw new ErpDomainError('VALIDATION_ERROR', 'O código de tributação nacional tem 6 dígitos (item da LC 116 + desdobro, ex.: 01.07.01).', 422, { field: 'codigo_tributacao_nacional' })
  if (nbs && nbs.length !== 9) throw new ErpDomainError('VALIDATION_ERROR', 'O código NBS tem 9 dígitos.', 422, { field: 'codigo_nbs' })
  return { national: national || null, municipal: optionalText(values.codigo_servico_municipal), nbs: nbs || null }
}

async function createServiceRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome do serviço')
  const categoryId = await resolveServiceCategory(client, input)
  const fiscal = serviceFiscalCodes(input.values)
  const result = await client.query(
    `INSERT INTO erp.servicos (
       empresa_id,
       nome,
       codigo,
       descricao,
       preco,
       custo,
       categoria_id,
       ativo,
       criado_por,
       atualizado_por,
       codigo_tributacao_nacional,
       codigo_servico_municipal,
       codigo_nbs
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      optionalText(input.values.codigo),
      optionalText(input.values.descricao),
      money(input.values.preco),
      money(input.values.custo),
      categoryId,
      activeFromStatus(input.values.status),
      input.actorId,
      fiscal.national,
      fiscal.municipal,
      fiscal.nbs,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function createFinancialAccountRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da conta financeira')
  const existingResult = await client.query(
    `SELECT id FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId],
  )
  const shouldBeDefault = booleanValue(input.values.padrao) || !existingResult.rows[0]
  if (shouldBeDefault) {
    await client.query(
      `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2 WHERE empresa_id = $1 AND padrao = true`,
      [input.tenantId, input.actorId],
    )
  }
  const result = await client.query(
    `INSERT INTO erp.contas_financeiras (
       empresa_id,
       nome,
       tipo,
       banco,
       agencia,
       conta,
       digito,
       saldo_inicial,
       data_saldo_inicial,
       padrao,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      financialAccountType(input.values.tipo),
      optionalText(input.values.banco),
      optionalText(input.values.agencia),
      optionalText(input.values.conta),
      optionalText(input.values.digito),
      money(input.values.saldo_inicial),
      dateText(input.values.data_saldo_inicial),
      shouldBeDefault,
      activeFromStatus(input.values.status),
      input.actorId,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

export async function createSaleRecord(client: SQLClient, input: CreateInput) {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:venda:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT id, metadata FROM erp.vendas
       WHERE empresa_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) { assertCommercialReplay((existing.rows[0].metadata as Record<string,unknown>)?.commercialRequest,input.values); return { id: String(existing.rows[0].id) } }
  }

  const customerId = numericId(input.values.cliente_id, 'Cliente')
  const documentType = ['orcamento', 'pedido', 'venda'].includes(text(input.values.tipo_documento))
    ? text(input.values.tipo_documento)
    : 'venda'
  const saleDate = dateText(input.values.data_venda) || erpToday()
  const number = optionalText(input.values.numero) || await nextDocumentNumber(client, input.tenantId, documentType as 'orcamento' | 'pedido' | 'venda', saleDate)

  const customerResult = await client.query(
    `SELECT id
     FROM erp.entidades
     WHERE empresa_id = $1
       AND id = $2
       AND eh_cliente = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, customerId],
  )
  if (!customerResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cliente não encontrado.')
  // Tabela de preço (informada, do cliente ou padrão) e dados de transporte para a NF-e.
  const priceTableId = await resolvePriceTable(client, input.tenantId, customerId, input.values.tabela_preco_id, saleDate)
  const transport = await saleTransport(client, input.tenantId, input.values)

  const rawItems = Array.isArray(input.values.itens) && input.values.itens.length > 0
    ? input.values.itens as Record<string, unknown>[]
    : [{
        tipo: 'produto',
        item_id: input.values.produto_id,
        descricao: input.values.descricao,
        quantidade: input.values.quantidade,
        valor_unitario: input.values.valor_unitario,
      }]
  if (rawItems.length > 100) throw new ErpDomainError('VALIDATION_ERROR', 'A venda aceita no máximo 100 itens.')

  const items: Array<{
    tipo: 'produto' | 'servico'
    itemId: number
    descricao: string
    quantidade: number
    valorUnitario: number
    desconto: number
    total: number
    custo: number
    precoTabela: number | null
  }> = []
  for (const [index, raw] of rawItems.entries()) {
    const tipo = text(raw.tipo || raw.kind) === 'servico' ? 'servico' : 'produto'
    const itemId = numericId(raw.item_id || raw.produto_id || raw.servico_id, `Item ${index + 1}`)
    const quantity = Number(raw.quantidade || 1)
    const discount = money(raw.desconto)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Quantidade do item ${index + 1} invalida.`)
    const catalog = await client.query(
      tipo === 'servico'
        ? `SELECT nome, custo, preco AS preco_catalogo FROM erp.servicos WHERE empresa_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`
        : `SELECT nome, custo, preco_venda AS preco_catalogo FROM erp.produtos WHERE empresa_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`,
      [input.tenantId, itemId],
    )
    if (!catalog.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', `Item ${index + 1} não encontrado.`)
    // Sem valor informado, vale o preço da tabela (faixa de quantidade) ou o do cadastro.
    const listed: TablePrice | null = await tablePrice(client, input.tenantId, priceTableId, tipo, itemId, quantity)
    const unitValue = positiveMoney(raw.valor_unitario) || (listed ? listed.preco : 0) || positiveMoney(catalog.rows[0].preco_catalogo)
    if (!unitValue) throw new ErpDomainError('VALIDATION_ERROR', `Valor unitário do item ${index + 1} precisa ser maior que zero.`)
    const gross = lineTotal(quantity, unitValue)
    if (discount > gross) throw new ErpDomainError('VALIDATION_ERROR', `Desconto do item ${index + 1} supera o valor bruto.`)
    assertTablePriceRules(index + 1, listed, quantity, gross, discount)
    items.push({
      tipo,
      itemId,
      descricao: optionalText(raw.descricao) || String(catalog.rows[0].nome),
      quantidade: quantity,
      valorUnitario: unitValue,
      desconto: discount,
      total: sumMoney([gross, -discount]),
      custo: money(catalog.rows[0].custo),
      precoTabela: listed ? listed.preco : null,
    })
  }

  const subtotal = sumMoney(items.map(item => item.total))
  const discount = money(input.values.desconto)
  const freight = money(input.values.frete)
  const discountType = input.values.tipo_desconto || 'valor'
  if (discountType !== 'valor' && discountType !== 'percentual') throw new ErpDomainError('INVALID_DISCOUNT','Tipo de desconto inválido.')
  const appliedDiscount = discountAmount(subtotal, discount, discountType)
  const total = sumMoney([subtotal, -appliedDiscount, freight])
  if (total <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Total da venda precisa ser maior que zero.')
  // Permissões do usuário (1.7): vendedor da venda e desconto máximo (itens + venda sobre o bruto).
  const seller = await sellerRules(client)
  const sellerId = saleSeller(seller, input.values.vendedor_id)
  assertDiscountLimit(seller, sumMoney(items.map(item => item.total + item.desconto)),
    sumMoney([...items.map(item => item.desconto), appliedDiscount]))

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas as Record<string, unknown>[]
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dateText(input.values.data_vencimento) || saleDate, valor: total }]
  if (rawInstallments.length > 48) throw new ErpDomainError('VALIDATION_ERROR', 'A condição de pagamento aceita no máximo 48 parcelas.')
  const installments = rawInstallments.map((raw, index) => {
    const value = positiveMoney(raw.valor)
    const dueDate = dateText(raw.data_vencimento)
    if (!value || !dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Parcela ${index + 1} invalida.`)
    return {
      numero: Number(raw.numero_parcela || index + 1),
      descricao: optionalText(raw.descricao) || `Parcela ${index + 1}`,
      vencimento: dueDate,
      valor: value,
      contaFinanceiraId: optionalNumericId(raw.conta_financeira_id) || optionalNumericId(input.values.conta_financeira_id),
      metodoPagamentoId: optionalNumericId(raw.metodo_pagamento_id) || optionalNumericId(input.values.metodo_pagamento_id),
    }
  })
  const installmentTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  if (installmentTotal !== total) throw new ErpDomainError('VALIDATION_ERROR', 'A soma das parcelas precisa ser igual ao total da venda.')

  const saleResult = await client.query(
    `INSERT INTO erp.vendas (
       empresa_id,
       cliente_id,
       vendedor_id,
       numero,
       data_venda,
       data_competencia,
       status,
       situacao,
       tipo_documento,
       categoria_id,
       centro_custo_id,
       conta_financeira_id,
       metodo_pagamento_id,
       subtotal,
       desconto,
       frete,
       total,
       condicao_pagamento,
       observacoes,
       observacoes_pagamento,
       cobranca_emails,
       cobranca_whatsapp,
       validade_em,
       previsao_entrega,
       local_estoque_id,
       venda_origem_id,
       chave_idempotencia,
       criado_por,
       atualizado_por, tipo_desconto
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'rascunho', 'em_andamento', $7, $8, $9, $10, $11,
       $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $26, $27)
     RETURNING id`,
    [
      input.tenantId,
      customerId,
      sellerId,
      number,
      saleDate,
      dateText(input.values.data_competencia) || saleDate,
      documentType,
      optionalNumericId(input.values.categoria_id),
      optionalNumericId(input.values.centro_custo_id),
      optionalNumericId(input.values.conta_financeira_id),
      optionalNumericId(input.values.metodo_pagamento_id),
      subtotal,
      discount,
      freight,
      total,
      JSON.stringify({ parcelas: installments.map((installment) => ({
        numero_parcela: installment.numero,
        descricao: installment.descricao,
        data_vencimento: installment.vencimento,
        valor: installment.valor,
        conta_financeira_id: installment.contaFinanceiraId,
        metodo_pagamento_id: installment.metodoPagamentoId,
      })) }),
      optionalText(input.values.observacoes),
      optionalText(input.values.observacoes_pagamento),
      stringArray(input.values.cobranca_emails),
      optionalText(input.values.cobranca_whatsapp),
      dateText(input.values.validade_em),
      optionalText(input.values.previsao_entrega),
      optionalNumericId(input.values.local_estoque_id),
      optionalNumericId(input.values.venda_origem_id),
      idempotencyKey,
      input.actorId,
      discountType,
    ],
  )
  const saleId = Number(saleResult.rows[0]?.id)
  await client.query(
    `UPDATE erp.vendas SET tabela_preco_id = $3, transportadora_id = $4, modalidade_frete = $5, volumes = $6, especie_volumes = $7,
       peso_bruto = $8, peso_liquido = $9 WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, saleId, priceTableId, transport.transportadoraId, transport.modalidadeFrete, transport.volumes,
      transport.especieVolumes, transport.pesoBruto, transport.pesoLiquido],
  )
  await client.query("UPDATE erp.vendas SET metadata=metadata || jsonb_build_object('commercialRequest',$3::jsonb) WHERE empresa_id=$1 AND id=$2",[input.tenantId,saleId,JSON.stringify(input.values)])

  for (const installment of installments) {
    await client.query(
      `INSERT INTO erp.vendas_recebimentos_previstos (
         empresa_id, venda_id, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id, metodo_pagamento_id, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [input.tenantId, saleId, installment.numero, installment.descricao, installment.vencimento,
        installment.valor, installment.contaFinanceiraId, installment.metodoPagamentoId, input.actorId],
    )
  }

  for (const item of items) {
    await client.query(
      `INSERT INTO erp.vendas_itens (
         empresa_id, venda_id, produto_id, servico_id, descricao, quantidade,
         valor_unitario, custo_unitario, desconto, total, preco_tabela, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $12, $11, $11)`,
      [input.tenantId, saleId, item.tipo === 'produto' ? item.itemId : null,
        item.tipo === 'servico' ? item.itemId : null, item.descricao, item.quantidade,
        item.valorUnitario, item.custo, item.desconto, item.total, input.actorId, item.precoTabela],
    )
  }

  if (!input.temporary) {
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'criada', 'rascunho', 1, '{}'::jsonb, $3)`,
      [input.tenantId, saleId, input.actorId],
    )
  }

  return { id: String(saleId) }
}

async function createPurchaseRecord(client: SQLClient, input: CreateInput) {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:compra:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT id FROM erp.compras
       WHERE empresa_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) return { id: String(existing.rows[0].id) }
  }
  const supplierId = numericId(input.values.fornecedor_id, 'Fornecedor')
  const items = normalizePurchaseItems(input.values)
  const subtotal = Number(items.reduce((sum, item) => sum + item.valorLiquido, 0).toFixed(2))
  const discount = money(input.values.desconto)
  const freight = money(input.values.frete)
  const insurance = money(input.values.seguro)
  const otherExpenses = money(input.values.outras_despesas)
  const retainedTaxes = money(input.values.impostos_retidos)
  const total = Number((subtotal - discount + freight + insurance + otherExpenses - retainedTaxes).toFixed(2))
  if (total < 0) throw new ErpDomainError('VALIDATION_ERROR', 'Descontos e retencoes não podem superar o valor da compra.')
  const purchaseDate = dateText(input.values.data_compra) || erpToday()
  const dueDate = dateText(input.values.data_vencimento) || purchaseDate
  const number = optionalText(input.values.numero) || await nextDocumentNumber(client, input.tenantId, 'compra', purchaseDate)
  const generateFinancial = booleanValue(input.values.gera_financeiro ?? true)
  const movement = purchaseMovement(input.values.tipo_movimento)
  const type = purchaseType(input.values.tipo_compra)
  const status = purchaseStatusForMovement(movement)

  const supplierResult = await client.query(
    `SELECT id, nome, documento
     FROM erp.entidades
     WHERE empresa_id = $1
       AND id = $2
       AND eh_fornecedor = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, supplierId],
  )
  if (!supplierResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor não encontrado.')
  const supplier = supplierResult.rows[0]

  const rawInstallments = Array.isArray(input.values.parcelas)
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dueDate, valor: total }]
  const condition = { parcelas: rawInstallments }

  const purchaseResult = await client.query(
    `INSERT INTO erp.compras (
       empresa_id,
       fornecedor_id,
       numero,
       data_compra,
       data_competencia,
       data_prevista_entrega,
       status,
       tipo_compra,
       tipo_movimento,
       natureza_operacao_id,
       atualiza_estoque,
       origem,
       fornecedor_nome_snapshot,
       fornecedor_documento_snapshot,
       categoria_id,
       centro_custo_id,
       conta_financeira_id,
       metodo_pagamento_id,
       subtotal,
       tipo_desconto,
       desconto,
       frete,
       seguro,
       outras_despesas,
       impostos_retidos,
       total,
       condicao_pagamento,
       gera_financeiro,
       observacoes,
       chave_idempotencia,
       criado_por,
       atualizado_por
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       COALESCE((SELECT atualiza_estoque FROM erp.naturezas_operacao_compra WHERE empresa_id = $1 AND id = $10), false),
       'manual', $11, $12,
       $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
       $25::jsonb, $26, $27, $28, $29, $29
     )
     RETURNING id, empresa_id, fornecedor_id, numero, data_compra, data_competencia,
       status, tipo_compra, tipo_movimento, origem, categoria_id, centro_custo_id,
       conta_financeira_id, metodo_pagamento_id, total, condicao_pagamento,
       gera_financeiro, fornecedor_nome_snapshot, fornecedor_documento_snapshot`,
    [
      input.tenantId,
      supplierId,
      number,
      purchaseDate,
      dateText(input.values.data_competencia) || purchaseDate,
      dateText(input.values.data_prevista_entrega),
      status,
      type,
      movement,
      optionalNumericId(input.values.natureza_operacao_id),
      supplier.nome,
      supplier.documento,
      optionalNumericId(input.values.categoria_id),
      optionalNumericId(input.values.centro_custo_id),
      optionalNumericId(input.values.conta_financeira_id),
      optionalNumericId(input.values.metodo_pagamento_id),
      subtotal,
      optionalText(input.values.tipo_desconto),
      discount,
      freight,
      insurance,
      otherExpenses,
      retainedTaxes,
      total,
      JSON.stringify(condition),
      generateFinancial,
      optionalText(input.values.observacoes),
      idempotencyKey,
      input.actorId,
    ],
  )
  const purchaseId = Number(purchaseResult.rows[0]?.id)

  for (const item of items) {
    await client.query(
      `INSERT INTO erp.compras_itens (
         empresa_id, compra_id, produto_id, servico_id, descricao, detalhes, unidade,
         quantidade, valor_unitario, percentual_desconto, valor_desconto, valor_bruto,
         valor_liquido, total, item_descricao_snapshot, item_unidade_snapshot,
         criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $5, $7, $14, $14)`,
      [
        input.tenantId,
        purchaseId,
        item.produtoId,
        item.servicoId,
        item.descricao,
        item.detalhes,
        item.unidade,
        item.quantidade,
        item.valorUnitario,
        item.percentualDesconto,
        item.valorDesconto,
        item.valorBruto,
        item.valorLiquido,
        input.actorId,
      ],
    )
  }

  const purchase = purchaseResult.rows[0] as PurchaseRow
  const normalizedInstallments = total > 0 ? normalizePurchaseInstallments(purchase) : []
  for (const installment of normalizedInstallments) {
    await client.query(
      `INSERT INTO erp.compras_parcelas_previstas (
         empresa_id, compra_id, numero_parcela, descricao, data_vencimento, valor,
         percentual, conta_financeira_id, metodo_pagamento_id, observacoes,
         criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
      [
        input.tenantId,
        purchaseId,
        installment.numeroParcela,
        installment.descricao,
        installment.dataVencimento,
        installment.valor,
        installment.percentual,
        installment.contaFinanceiraId || optionalNumericId(input.values.conta_financeira_id),
        installment.metodoPagamentoId || optionalNumericId(input.values.metodo_pagamento_id),
        installment.observacoes,
        input.actorId,
      ],
    )
  }

  if (!input.temporary) {
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'criada', $3::jsonb, $4)`,
      [input.tenantId, purchaseId, JSON.stringify({ tipo_movimento: movement }), input.actorId],
    )
  }

  // Orders retain commercial forecasts; the database accepts financial origins only after effectuation.
  if (generateFinancial && movement === 'compra' && total > 0) {
    await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'efetivo')
  }

  return { id: String(purchaseId) }
}

export async function updateErpSaleDraft(input: {
  tenantId: number
  actorId: number
  id: string | number
  expectedVersion: number
  values: Record<string, unknown>
}) {
  const id = numericId(input.id, 'Venda')
  await withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT id, numero, status, versao FROM erp.vendas
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if (current.status !== 'rascunho') throw new ErpDomainError('VALIDATION_ERROR', 'Somente vendas em rascunho podem ser editadas.')
    if (Number(current.versao) !== input.expectedVersion) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: esta venda foi alterada por outra pessoa.')

    const staged = await createSaleRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos', temporary: true,
      values: { ...input.values, numero: `TMP-VEN-${id}-${Date.now()}` },
    })
    const stagedId = numericId(staged.id, 'Venda temporaria')
    await client.query(`DELETE FROM erp.vendas_itens WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.vendas_recebimentos_previstos WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.vendas_itens SET venda_id = $3 WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.vendas_recebimentos_previstos SET venda_id = $3 WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.vendas AS target SET
         cliente_id = source.cliente_id, numero = $4, data_venda = source.data_venda,
         data_competencia = source.data_competencia, vendedor_id = source.vendedor_id,
         tipo_documento = source.tipo_documento, validade_em = source.validade_em,
         previsao_entrega = source.previsao_entrega, local_estoque_id = source.local_estoque_id,
         categoria_id = source.categoria_id,
         centro_custo_id = source.centro_custo_id, conta_financeira_id = source.conta_financeira_id,
         metodo_pagamento_id = source.metodo_pagamento_id, subtotal = source.subtotal,
         tipo_desconto = source.tipo_desconto, desconto = source.desconto, frete = source.frete, total = source.total,
         condicao_pagamento = source.condicao_pagamento, observacoes = source.observacoes,
         observacoes_pagamento = source.observacoes_pagamento, cobranca_emails = source.cobranca_emails,
         cobranca_whatsapp = source.cobranca_whatsapp, tabela_preco_id = source.tabela_preco_id,
         transportadora_id = source.transportadora_id, modalidade_frete = source.modalidade_frete, volumes = source.volumes,
         especie_volumes = source.especie_volumes, peso_bruto = source.peso_bruto, peso_liquido = source.peso_liquido,
         versao = target.versao + 1, atualizado_por = $5
       FROM erp.vendas AS source
       WHERE target.empresa_id = $1 AND target.id = $2 AND source.empresa_id = target.empresa_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: esta venda foi alterada por outra pessoa.')
    await client.query(`DELETE FROM erp.vendas WHERE empresa_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'atualizada', 'rascunho', 'rascunho', $3, $4::jsonb, $5)`,
      [input.tenantId, id, updated.rows[0].versao, JSON.stringify({ numero: updated.rows[0].numero, total: updated.rows[0].total }), input.actorId],
    )
  })
  return getErpSaleDetails(input.tenantId, id)
}

export async function updateErpPurchaseDraft(input: {
  tenantId: number
  actorId: number
  id: string | number
  expectedVersion: number
  values: Record<string, unknown>
}) {
  const id = numericId(input.id, 'Compra')
  await withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT id, numero, status, tipo_movimento, versao FROM erp.compras
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    if (current.status !== 'rascunho' || current.tipo_movimento !== 'cotacao') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Somente cotacoes em rascunho podem ser editadas.')
    }
    if (Number(current.versao) !== input.expectedVersion) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: esta compra foi alterada por outra pessoa.')

    const staged = await createPurchaseRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos-compra', temporary: true,
      values: { ...input.values, numero: `TMP-COM-${id}-${Date.now()}`, tipo_movimento: 'cotacao' },
    })
    const stagedId = numericId(staged.id, 'Compra temporaria')
    await client.query(`DELETE FROM erp.compras_itens WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.compras_parcelas_previstas WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.compras_itens SET compra_id = $3 WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.compras_parcelas_previstas SET compra_id = $3 WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.compras AS target SET
         fornecedor_id = source.fornecedor_id, numero = $4, data_compra = source.data_compra,
         data_competencia = source.data_competencia, data_prevista_entrega = source.data_prevista_entrega,
         tipo_compra = source.tipo_compra, natureza_operacao_id = source.natureza_operacao_id,
         atualiza_estoque = source.atualiza_estoque,
         fornecedor_nome_snapshot = source.fornecedor_nome_snapshot,
         fornecedor_documento_snapshot = source.fornecedor_documento_snapshot,
         categoria_id = source.categoria_id, centro_custo_id = source.centro_custo_id,
         conta_financeira_id = source.conta_financeira_id, metodo_pagamento_id = source.metodo_pagamento_id,
         subtotal = source.subtotal, tipo_desconto = source.tipo_desconto, desconto = source.desconto,
         frete = source.frete, seguro = source.seguro, outras_despesas = source.outras_despesas,
         impostos_retidos = source.impostos_retidos, total = source.total,
         condicao_pagamento = source.condicao_pagamento, gera_financeiro = source.gera_financeiro,
         observacoes = source.observacoes, versao = target.versao + 1, atualizado_por = $5
       FROM erp.compras AS source
       WHERE target.empresa_id = $1 AND target.id = $2 AND source.empresa_id = target.empresa_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: esta compra foi alterada por outra pessoa.')
    await client.query(`DELETE FROM erp.compras WHERE empresa_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'atualizada', $3::jsonb, $4)`,
      [input.tenantId, id, JSON.stringify({ versao: updated.rows[0].versao, numero: updated.rows[0].numero, total: updated.rows[0].total }), input.actorId],
    )
  })
  return getErpPurchaseDetails(input.tenantId, id)
}

export function shiftDate(value: string, frequency: string, interval: number, occurrence: number) {
  const date = new Date(`${value}T12:00:00.000Z`)
  const amount = interval * occurrence
  if (frequency === 'dia') date.setUTCDate(date.getUTCDate() + amount)
  else if (frequency === 'semana') date.setUTCDate(date.getUTCDate() + (amount * 7))
  else {
    const originalDay = date.getUTCDate()
    const targetMonths = frequency === 'ano' ? amount * 12 : amount
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + targetMonths)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate()
    date.setUTCDate(Math.min(originalDay, lastDay))
  }
  return date.toISOString().slice(0, 10)
}

async function createManualPayableRecord(client: SQLClient, input: CreateInput): Promise<ErpEntityRecord> {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:conta-pagar:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT parcelas.id::text, contas.descricao, entidades.nome AS fornecedor,
         parcelas.data_vencimento, parcelas.valor, parcelas.valor_pago, contas.origem,
         contas.tipo_lancamento, parcelas.status
       FROM erp.contas_pagar AS contas
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id AND parcelas.conta_pagar_id = contas.id AND parcelas.excluido_em IS NULL
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id AND entidades.id = contas.fornecedor_id
       WHERE contas.empresa_id = $1 AND contas.chave_idempotencia = $2 AND contas.excluido_em IS NULL
       ORDER BY parcelas.numero_parcela LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) {
      const row = existing.rows[0]
      return { id: String(row.id), descricao: String(row.descricao), fornecedor: String(row.fornecedor), vencimento: dateText(row.data_vencimento) || '', valor: Number(row.valor), valor_pago: Number(row.valor_pago), saldo: Number(row.valor) - Number(row.valor_pago), origem: String(row.origem), tipo_lancamento: String(row.tipo_lancamento), status: String(row.status) }
    }
  }
  const supplierId = numericId(input.values.fornecedor_id, 'Fornecedor')
  const description = optionalText(input.values.descricao)
  if (!description) throw new ErpDomainError('VALIDATION_ERROR', 'Descrição é obrigatória.')
  const total = positiveMoney(input.values.valor_total ?? input.values.valor)
  if (!total) throw new ErpDomainError('VALIDATION_ERROR', 'Valor precisa ser maior que zero.')
  const categoryId = numericId(input.values.categoria_id, 'Categoria')
  const competence = dateText(input.values.data_competencia) || erpToday()
  const issueDate = dateText(input.values.data_emissao) || competence
  const firstDueDate = dateText(input.values.data_vencimento) || competence

  const supplierResult = await client.query(
    `SELECT id, nome, documento FROM erp.entidades
     WHERE empresa_id = $1 AND id = $2 AND eh_fornecedor = true AND excluido_em IS NULL`,
    [input.tenantId, supplierId],
  )
  const supplier = supplierResult.rows[0]
  if (!supplier) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor não encontrado.')

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: firstDueDate, valor: total }]
  if (rawInstallments.length > 48) throw new ErpDomainError('VALIDATION_ERROR', 'A condição de pagamento aceita no máximo 48 parcelas.')
  const installments = rawInstallments.map((raw, index) => {
    const row = raw as Record<string, unknown>
    const value = positiveMoney(row.valor)
    const dueDate = dateText(row.data_vencimento)
    if (!value || !dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Parcela ${index + 1} invalida.`)
    return {
      numero: Number(row.numero_parcela || index + 1),
      descricao: optionalText(row.descricao) || `Parcela ${index + 1}`,
      vencimento: dueDate,
      valor: value,
      observacoes: optionalText(row.observacoes),
    }
  })
  const installmentTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  if (installmentTotal !== Number(total.toFixed(2))) throw new ErpDomainError('VALIDATION_ERROR', 'A soma das parcelas precisa ser igual ao total da despesa.')

  const recurrence = jsonObject(input.values.recorrencia) as Record<string, unknown>
  const repeat = booleanValue(input.values.repetir) || Object.keys(recurrence).length > 0
  const frequency = ['dia', 'semana', 'mes', 'ano'].includes(text(recurrence.frequencia)) ? text(recurrence.frequencia) : 'mes'
  const interval = Math.max(1, Number(recurrence.intervalo || 1))
  const endType = text(recurrence.termino_tipo) || 'ocorrencias'
  if (!['data','ocorrencias','indeterminado'].includes(endType)) throw new ErpDomainError('VALIDATION_ERROR','Término de recorrência inválido.')
  const occurrenceCount = endType === 'ocorrencias' ? Math.min(366, Math.max(1, Number(recurrence.quantidade_ocorrencias || 1))) : null
  const endDate = endType === 'data' ? dateText(recurrence.termino_em) : null
  if (endType === 'data' && (!endDate || endDate < competence)) throw new ErpDomainError('VALIDATION_ERROR','Informe uma data final igual ou posterior ao início.')
  let recurrenceId: number | null = null
  if (repeat) {
    const recurrenceResult = await client.query(
      `INSERT INTO erp.recorrencias_financeiras (
         empresa_id, tipo, intervalo, frequencia, inicio_em, termino_tipo,
         termino_em, quantidade_ocorrencias, proxima_competencia, gerado_ate,
         criado_por, atualizado_por, metadata
       ) VALUES ($1, 'pagar', $2, $3, $4, $10, $5, $6, $7, $4, $8, $8, $9::jsonb)
       RETURNING id`,
      [input.tenantId, interval, frequency, competence, endDate, occurrenceCount,
        occurrenceCount === 1 || (endDate && shiftDate(competence,frequency,interval,1)>endDate) ? null : shiftDate(competence, frequency, interval, 1), input.actorId,
        JSON.stringify({ descricao: description, modelo: { ...input.values, repetir: false, recorrencia: null } }),endType],
    )
    recurrenceId = Number(recurrenceResult.rows[0]?.id)
  }

  let firstInstallmentId = ''
  // Recorrencias sao materializadas uma competencia por vez pelo processador.
  for (let occurrence = 0; occurrence < 1; occurrence += 1) {
    const occurrenceCompetence = shiftDate(competence, frequency, interval, occurrence)
    const payableResult = await client.query(
      `INSERT INTO erp.contas_pagar (
         empresa_id, fornecedor_id, descricao, numero_documento, data_competencia,
         data_emissao, valor_total, status, categoria_id, centro_custo_id, observacoes,
         origem, tipo_lancamento, recorrencia_financeira_id, fornecedor_nome_snapshot,
         fornecedor_documento_snapshot, efetivado_em, chave_idempotencia, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'aberto', $8, $9, $10,
         $11, 'efetivo', $12, $13, $14, now(), $15, $16, $16)
       RETURNING id`,
      [
        input.tenantId,
        supplierId,
        description,
        optionalText(input.values.numero_documento),
        occurrenceCompetence,
        shiftDate(issueDate, frequency, interval, occurrence),
        total,
        categoryId,
        optionalNumericId(input.values.centro_custo_id),
        optionalText(input.values.observacoes),
        repeat ? 'recorrencia' : 'manual',
        recurrenceId,
        supplier.nome,
        supplier.documento,
        idempotencyKey ? (occurrence === 0 ? idempotencyKey : `${idempotencyKey}:${occurrence + 1}`) : null,
        input.actorId,
      ],
    )
    const payableId = Number(payableResult.rows[0]?.id)

    for (const installment of installments) {
      const installmentResult = await client.query(
        `INSERT INTO erp.contas_pagar_parcelas (
           empresa_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
           data_pagamento_previsto, valor, valor_bruto, valor_liquido, valor_pago,
           status, conta_financeira_id, metodo_pagamento_id, observacoes, criado_por, atualizado_por
         ) VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $10)
         RETURNING id::text`,
        [
          input.tenantId,
          payableId,
          installment.numero,
          installment.descricao,
          shiftDate(installment.vencimento, frequency, interval, occurrence),
          installment.valor,
          optionalNumericId(input.values.conta_financeira_id),
          optionalNumericId(input.values.metodo_pagamento_id),
          installment.observacoes,
          input.actorId,
        ],
      )
      if (!firstInstallmentId) firstInstallmentId = String(installmentResult.rows[0]?.id || '')
    }

    const rateios = Array.isArray(input.values.rateios) ? input.values.rateios : []
    if (rateios.length > 0) {
      const rateioTotal = Number(rateios.reduce((sum, raw) => sum + money((raw as Record<string, unknown>).valor), 0).toFixed(2))
      if (rateioTotal !== Number(total.toFixed(2))) throw new ErpDomainError('VALIDATION_ERROR', 'O rateio precisa distribuir o valor total da despesa.')
      for (const raw of rateios) {
        const rateio = raw as Record<string, unknown>
        await client.query(
          `INSERT INTO erp.rateios_financeiros (
             empresa_id, tipo, conta_pagar_id, categoria_id, centro_custo_id, valor,
             percentual, observacoes, criado_por, atualizado_por
           ) VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $8)`,
          [input.tenantId, payableId, optionalNumericId(rateio.categoria_id), optionalNumericId(rateio.centro_custo_id), money(rateio.valor), rateio.percentual == null ? null : Number(rateio.percentual), optionalText(rateio.observacoes), input.actorId],
        )
      }
    }
  }

  if(recurrenceId)await client.query(`UPDATE erp.recorrencias_financeiras SET ativa=false,encerrada_em=now(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2 AND proxima_competencia IS NULL`,[input.tenantId,recurrenceId,input.actorId])
  return {
    id: firstInstallmentId,
    descricao: description,
    fornecedor: String(supplier.nome || ''),
    vencimento: firstDueDate,
    valor: total,
    valor_pago: 0,
    saldo: total,
    origem: repeat ? 'recorrencia' : 'manual',
    tipo_lancamento: 'efetivo',
    status: 'aberto',
  }
}

export async function processErpFinancialRecurrences(input: {
  tenantId: number
  actorId: number
  throughDate?: string
  limit?: number
}) {
  const throughDate = dateText(input.throughDate) || erpToday()
  const limit = Math.min(100, Math.max(1, Math.floor(Number(input.limit || 50))))
  return withTransaction(async (client) => {
    const recurrenceResult = await client.query(
      `SELECT * FROM erp.recorrencias_financeiras
       WHERE empresa_id = $1 AND ativa = true
         AND pausada_em IS NULL AND encerrada_em IS NULL AND excluido_em IS NULL
         AND proxima_competencia IS NOT NULL AND proxima_competencia <= $2
       ORDER BY proxima_competencia, id
           FOR UPDATE SKIP LOCKED
       LIMIT $3`,
      [input.tenantId, throughDate, limit],
    )
    let generated = 0
    const processed: Array<{ id: string; generated: number; next: string | null }> = []

    for (const recurrence of recurrenceResult.rows) {
      if (generated >= limit) break
      const metadata = jsonObject(recurrence.metadata) as Record<string, unknown>
      const model = jsonObject(metadata.modelo) as Record<string, unknown>
      if (Object.keys(model).length === 0) throw new ErpDomainError('RECURRENCE_MODEL_MISSING',`Recorrência ${recurrence.id}: modelo ausente. Revise a configuração.`,422)

      const countResult = await client.query(
        `SELECT count(*)::int AS total FROM erp.${recurrence.tipo === 'receber' ? 'contas_receber' : 'contas_pagar'}
         WHERE empresa_id = $1 AND recorrencia_financeira_id = $2`,
        [input.tenantId, recurrence.id],
      )
      let occurrence = Number(countResult.rows[0]?.total || 0)
      let next = dateText(recurrence.proxima_competencia)
      let generatedForRecurrence = 0
      const maxOccurrences = recurrence.termino_tipo === 'ocorrencias' ? Number(recurrence.quantidade_ocorrencias) : Infinity
      const frequency = text(recurrence.frequencia)
      const interval = Number(recurrence.intervalo || 1)
      const start = dateText(recurrence.inicio_em) || throughDate

      // The calendar, not the count of surviving documents, identifies an occurrence.
      occurrence = recurrenceOccurrenceIndex(start,next || start,frequency,interval)
      while (next && next <= throughDate && (!recurrence.termino_em || next <= dateText(recurrence.termino_em)!) && occurrence < maxOccurrences && generated < limit) {
        await assertErpPeriodOpen(client,{tenantId:input.tenantId,module:'financeiro',date:next})
        const shiftModelDate = (value: unknown) => {
          const date = dateText(value)
          return date ? shiftDate(date, frequency, interval, occurrence) : undefined
        }
        const installments = Array.isArray(model.parcelas)
          ? model.parcelas.map((raw) => {
            const row = raw as Record<string, unknown>
            return { ...row, data_vencimento: shiftModelDate(row.data_vencimento) }
          })
          : undefined
        const values = {
          ...model,
          repetir: false,
          recorrencia: null,
          data_competencia: next,
          data_emissao: shiftModelDate(model.data_emissao) || next,
          data_vencimento: shiftModelDate(model.data_vencimento) || next,
          parcelas: installments,
        }
        const idempotencyKey = `recorrencia:${recurrence.id}:${next}`
        if (recurrence.tipo === 'receber') {
          await createRecurringReceivable(client, {...input,recurrenceId:Number(recurrence.id),key:idempotencyKey,values})
        } else {
        const record = await createManualPayableRecord(client, {
          tenantId: input.tenantId, actorId: input.actorId, entityId: 'contas-a-pagar', values, idempotencyKey,
        })
        await client.query(
          `UPDATE erp.contas_pagar AS contas SET recorrencia_financeira_id = $3,
             origem = 'recorrencia', atualizado_por = $4
           FROM erp.contas_pagar_parcelas AS parcelas
           WHERE contas.empresa_id = $1 AND parcelas.empresa_id = contas.empresa_id
             AND parcelas.conta_pagar_id = contas.id AND parcelas.id = $2`,
          [input.tenantId, numericId(record.id, 'Parcela'), recurrence.id, input.actorId],
        )
        }
        generated += 1
        generatedForRecurrence += 1
        occurrence += 1
        next = occurrence < maxOccurrences ? shiftDate(start, frequency, interval, occurrence) : null
      }

      const endedByDate = Boolean(recurrence.termino_em && next && next > dateText(recurrence.termino_em)!)
      const ended = occurrence >= maxOccurrences || endedByDate
      await client.query(
        `UPDATE erp.recorrencias_financeiras SET proxima_competencia = $3,
           gerado_ate = $4, ativa = $5, encerrada_em = CASE WHEN $5 THEN NULL ELSE COALESCE(encerrada_em, now()) END,
           atualizado_por = $6
         WHERE empresa_id = $1 AND id = $2`,
        [input.tenantId, recurrence.id, ended ? null : next, generatedForRecurrence > 0 ? shiftDate(start, frequency, interval, occurrence - 1) : recurrence.gerado_ate,
          !ended, input.actorId],
      )
      processed.push({ id: String(recurrence.id), generated: generatedForRecurrence, next: ended ? null : next })
    }
    return { generated, throughDate, processed }
  })
}

export function recurrenceOccurrenceIndex(start:string,current:string,frequency:string,interval:number) {
  const a=new Date(`${start}T12:00:00Z`),b=new Date(`${current}T12:00:00Z`)
  const units=frequency==='dia'?(b.getTime()-a.getTime())/86400000:frequency==='semana'?(b.getTime()-a.getTime())/(86400000*7):frequency==='mes'?(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth():b.getUTCFullYear()-a.getUTCFullYear()
  const index=units/interval
  if (!Number.isInteger(index)||index<0||shiftDate(start,frequency,interval,index)!==current) throw new ErpDomainError('VALIDATION_ERROR','Próxima ocorrência fora do calendário da recorrência.')
  return index
}

async function createRecurringReceivable(client:SQLClient,input:{tenantId:number;actorId:number;recurrenceId:number;key:string;values:Record<string,unknown>}) {
  const existing=await client.query(`SELECT id FROM erp.contas_receber WHERE empresa_id=$1 AND recorrencia_financeira_id=$2 AND data_competencia=$3`,[input.tenantId,input.recurrenceId,input.values.data_competencia])
  if(existing.rows.length)return
  const total=positiveMoney(input.values.valor_total ?? input.values.valor),customer=numericId(input.values.cliente_id,'Cliente')
  const valid=await client.query(`SELECT id FROM erp.entidades WHERE empresa_id=$1 AND id=$2 AND eh_cliente AND excluido_em IS NULL`,[input.tenantId,customer])
  if(!valid.rows.length||!total)throw new ErpDomainError('VALIDATION_ERROR','Modelo recorrente exige cliente válido e valor positivo.')
  const parts=Array.isArray(input.values.parcelas)&&input.values.parcelas.length?input.values.parcelas as Record<string,unknown>[]:[{valor:total,data_vencimento:input.values.data_vencimento}]
  if(sumMoney(parts.map(p=>String(p.valor)))!==total)throw new ErpDomainError('VALIDATION_ERROR','Parcelas devem distribuir integralmente o valor da recorrência.')
  const title=await client.query(`INSERT INTO erp.contas_receber(empresa_id,cliente_id,descricao,valor_total,data_competencia,data_emissao,status,origem,recorrencia_financeira_id,chave_idempotencia,categoria_id,centro_custo_id,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$6,'aberto','api',$7,$8,$9,$10,$11,$11) RETURNING id`,[input.tenantId,customer,optionalText(input.values.descricao)||'Receita recorrente',total,input.values.data_competencia,input.values.data_emissao,input.recurrenceId,input.key,optionalNumericId(input.values.categoria_id),optionalNumericId(input.values.centro_custo_id),input.actorId])
  for(const [index,p] of parts.entries())await client.query(`INSERT INTO erp.contas_receber_parcelas(empresa_id,conta_receber_id,numero_parcela,data_vencimento,valor,valor_bruto,valor_liquido,status,conta_financeira_id,metodo_pagamento_id,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$5,$5,'aberto',$6,$7,$8,$8)`,[input.tenantId,title.rows[0].id,index+1,dateText(p.data_vencimento),positiveMoney(p.valor),optionalNumericId(input.values.conta_financeira_id),optionalNumericId(input.values.metodo_pagamento_id),input.actorId])
}

async function createCategoryRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da categoria')
  const classification = await financialCategoryClassification(client, input.tenantId, input.values)
  const result = await client.query(
    `INSERT INTO erp.categorias (
       empresa_id,
       nome,
       tipo,
       ativo,
       metadata,
       categoria_pai_id,
       dre_grupo_id,
       fora_dre,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $7, $8, $9, $6, $6)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      classification.tipo,
      activeFromStatus(input.values.status),
      JSON.stringify({ descricao: optionalText(input.values.descricao) }),
      input.actorId,
      classification.parentId,
      classification.groupId,
      classification.outsideDre,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function fetchCreatedRecord(tenantId: number, entityId: ErpConnectedModuleId, id: unknown) {
  if (entityId in editableModuleTables) {
    return getErpEntityRecord({ tenantId, entityId, id: String(id) })
  }
  const records = await listErpEntityRecords({ tenantId, entityId, page: 1, pageSize: 100 })
  const created = records.find((record) => record.id === String(id))
  if (!created) throw new ErpDomainError('VALIDATION_ERROR', 'Registro criado, mas não foi possível recarrega-lo.')
  return created
}
