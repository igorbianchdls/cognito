import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { parseNfeXml } from '@/products/erp/server/fiscal/nfeParser'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

type ListInput = {
  tenantId: number
  entityId: ErpConnectedModuleId
  query?: string
  filters?: Record<string, string>
  page?: number
  pageSize?: number
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
  tenant_id: string | number
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
  versao?: string | number
}

type PurchaseRow = {
  id: string | number
  tenant_id: string | number
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
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
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
  if (normalized.length > 200) throw new Error('Chave de idempotencia invalida.')
  return normalized
}

function numericId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} invalido.`)
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

  if (rawItems.length === 0) throw new Error('Adicione pelo menos um item a compra.')
  return rawItems.map((rawItem, index) => {
    const item = rawItem as Record<string, unknown>
    const produtoId = optionalNumericId(item.produto_id)
    const servicoId = optionalNumericId(item.servico_id)
    if ((produtoId ? 1 : 0) + (servicoId ? 1 : 0) !== 1) {
      throw new Error(`Selecione um produto ou servico no item ${index + 1}.`)
    }

    const quantidade = Number(String(item.quantidade ?? 1).replace(',', '.'))
    const valorUnitario = Number(String(item.valor_unitario ?? 0).replace(',', '.'))
    const percentual = item.percentual_desconto == null || item.percentual_desconto === ''
      ? null
      : Number(String(item.percentual_desconto).replace(',', '.'))
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw new Error(`Quantidade do item ${index + 1} invalida.`)
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) throw new Error(`Valor unitario do item ${index + 1} invalido.`)
    if (percentual != null && (!Number.isFinite(percentual) || percentual < 0 || percentual > 100)) {
      throw new Error(`Desconto percentual do item ${index + 1} invalido.`)
    }

    const valorBruto = Number((quantidade * valorUnitario).toFixed(2))
    const informedDiscount = item.valor_desconto == null || item.valor_desconto === ''
      ? null
      : money(item.valor_desconto)
    const valorDesconto = informedDiscount ?? Number((valorBruto * ((percentual || 0) / 100)).toFixed(2))
    if (valorDesconto > valorBruto) throw new Error(`Desconto do item ${index + 1} supera o valor bruto.`)

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
       WHERE tenant_id = $1
         AND id = $2
         AND ativo = true
         AND excluido_em IS NULL`,
      [tenantId, requested],
    )
    if (!selected.rows[0]) throw new Error('Conta financeira invalida ou inativa.')
    return requested
  }

  const existing = await client.query(
    `SELECT id, padrao
     FROM erp.contas_financeiras
     WHERE tenant_id = $1
       AND ativo = true
       AND excluido_em IS NULL
     ORDER BY padrao DESC, id ASC
     LIMIT 2`,
    [tenantId],
  )
  if (existing.rows[0]?.padrao || existing.rows.length === 1) return Number(existing.rows[0]?.id)
  if (existing.rows.length === 0) throw new Error('Cadastre uma conta financeira antes de registrar a baixa.')
  throw new Error('Selecione uma conta financeira para registrar a baixa.')
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
         COALESCE(sum(valor), 0) AS total,
         COALESCE(sum(valor_pago), 0) AS paid
       FROM erp.contas_receber_parcelas
       WHERE tenant_id = $1
         AND conta_receber_id = $2
         AND excluido_em IS NULL
         AND status <> 'cancelado'
     )
     UPDATE erp.contas_receber
     SET status = CASE
       WHEN totals.total > 0 AND totals.paid >= totals.total THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_receber_parcelas AS vencidas
         WHERE vencidas.tenant_id = $1
           AND vencidas.conta_receber_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.valor_pago < vencidas.valor
           AND vencidas.data_vencimento < CURRENT_DATE
       ) THEN 'vencido'
       WHEN totals.paid > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_receber.tenant_id = $1
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
         COALESCE(sum(valor), 0) AS total,
         COALESCE(sum(valor_pago), 0) AS paid
       FROM erp.contas_pagar_parcelas
       WHERE tenant_id = $1
         AND conta_pagar_id = $2
         AND excluido_em IS NULL
         AND status <> 'cancelado'
     )
     UPDATE erp.contas_pagar
     SET status = CASE
       WHEN totals.total > 0 AND totals.paid >= totals.total THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_pagar_parcelas AS vencidas
         WHERE vencidas.tenant_id = $1
           AND vencidas.conta_pagar_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.valor_pago < vencidas.valor
           AND vencidas.data_vencimento < CURRENT_DATE
       ) THEN 'vencido'
       WHEN totals.paid > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_pagar.tenant_id = $1
       AND contas_pagar.id = $2`,
    [tenantId, payableId, actorId],
  )
}

function normalizePersonType(value: unknown) {
  const normalized = text(value).toUpperCase()
  if (normalized === 'PF') return 'fisica'
  if (normalized === 'PJ') return 'juridica'
  return 'juridica'
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
  if (['caixa', 'banco', 'carteira', 'cartao', 'outro'].includes(normalized)) return normalized
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
  if (!text(value)) throw new Error(`${label} e obrigatorio.`)
}

async function resolveCategoryId(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  actorId: number,
  name: unknown,
  type: 'produto' | 'servico' | 'geral' = 'geral',
) {
  const normalized = text(name)
  if (!normalized) return null

  const existing = await client.query(
    `SELECT id
     FROM erp.categorias
     WHERE tenant_id = $1
       AND lower(nome) = lower($2)
       AND tipo IN ($3, 'geral')
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, normalized, type],
  )
  const existingId = existing.rows[0]?.id
  if (existingId) return Number(existingId)

  const created = await client.query(
    `INSERT INTO erp.categorias (tenant_id, nome, tipo, criado_por, atualizado_por)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id`,
    [tenantId, normalized, type, actorId],
  )
  return Number(created.rows[0]?.id)
}

function validateSaleInstallments(sale: SaleRow, installments: NormalizedInstallment[]) {
  const numbers = new Set<number>()
  for (const installment of installments) {
    if (!Number.isInteger(installment.numeroParcela) || installment.numeroParcela <= 0) {
      throw new Error('Numero de parcela invalido.')
    }
    if (numbers.has(installment.numeroParcela)) throw new Error('Existem parcelas com o mesmo numero.')
    numbers.add(installment.numeroParcela)
  }

  const installmentsTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  const saleTotal = Number(money(sale.total).toFixed(2))
  if (installmentsTotal !== saleTotal) {
    throw new Error('A soma das parcelas precisa ser igual ao total da venda.')
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
      dataVencimento: dateText(sale.data_venda) || new Date().toISOString().slice(0, 10),
      valor: money(sale.total),
    }])
  }

  const normalized = installments.map((installment, index): NormalizedInstallment => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      const installmentNumber = Number(item.numero_parcela || index + 1)
      if (!value) throw new Error(`Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new Error(`Vencimento da parcela ${index + 1} invalido.`)

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
    `SELECT numero_parcela, descricao, data_vencimento, valor, conta_financeira_id, metodo_pagamento_id
     FROM erp.vendas_recebimentos_previstos
     WHERE tenant_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [sale.tenant_id, sale.id],
  )
  if (plannedResult.rows.length === 0) return normalizePaymentConditionInstallments(sale)

  return validateSaleInstallments(sale, plannedResult.rows.map((row) => ({
    numeroParcela: Number(row.numero_parcela),
    descricao: optionalText(row.descricao),
    dataVencimento: dateText(row.data_vencimento) || '',
    valor: money(row.valor),
    contaFinanceiraId: paymentMethodId(row.conta_financeira_id),
    metodoPagamentoId: paymentMethodId(row.metodo_pagamento_id),
  })))
}

function validatePurchaseInstallments(purchase: PurchaseRow, installments: NormalizedInstallment[]) {
  if (installments.length === 0 || installments.length > 48) {
    throw new Error('A compra deve ter entre 1 e 48 parcelas.')
  }

  const numbers = new Set<number>()
  for (const installment of installments) {
    if (!Number.isInteger(installment.numeroParcela) || installment.numeroParcela <= 0 || installment.numeroParcela > 48) {
      throw new Error('Numero de parcela invalido.')
    }
    if (numbers.has(installment.numeroParcela)) throw new Error('Existem parcelas com o mesmo numero.')
    numbers.add(installment.numeroParcela)
    if (!dateText(installment.dataVencimento)) throw new Error(`Vencimento da parcela ${installment.numeroParcela} invalido.`)
    if (money(installment.valor) <= 0) throw new Error(`Valor da parcela ${installment.numeroParcela} invalido.`)
  }

  const installmentsTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  const purchaseTotal = Number(money(purchase.total).toFixed(2))
  if (installmentsTotal !== purchaseTotal) {
    throw new Error('A soma das parcelas precisa ser igual ao total da compra.')
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
      if (!value) throw new Error(`Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new Error(`Vencimento da parcela ${index + 1} invalido.`)

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
    dataVencimento: dateText(purchase.data_compra) || new Date().toISOString().slice(0, 10),
    valor: money(purchase.total),
  }])
}

async function resolvePurchaseInstallments(client: Pick<SQLClient, 'query'>, purchase: PurchaseRow) {
  const plannedResult = await client.query(
    `SELECT numero_parcela, descricao, data_vencimento, valor, percentual, conta_financeira_id, metodo_pagamento_id, observacoes
     FROM erp.compras_parcelas_previstas
     WHERE tenant_id = $1
       AND compra_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [purchase.tenant_id, purchase.id],
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
     WHERE tenant_id = $1
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
     WHERE tenant_id = $1
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

async function createOrUpdatePurchasePayable(
  client: Pick<SQLClient, 'query'>,
  purchase: PurchaseRow,
  actorId: number,
  type: 'previsao' | 'efetivo',
) {
  if (!purchase.gera_financeiro || money(purchase.total) <= 0) return null

  const installments = await resolvePurchaseInstallments(client, purchase)
  const existing = await fetchPayableForPurchase(client, Number(purchase.tenant_id), purchase.id)
  let payable: ReceivableRow

  if (existing) {
    if (existing.payable.status === 'pago' || existing.payable.status === 'parcial') {
      if (type !== existing.payable.tipo_lancamento) {
        throw new Error('Nao e possivel alterar a natureza de uma conta que ja possui pagamento.')
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
       WHERE tenant_id = $1 AND id = $2
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.tenant_id,
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
       WHERE tenant_id = $1 AND conta_pagar_id = $2 AND excluido_em IS NULL`,
      [purchase.tenant_id, payable.id, actorId],
    )
  } else {
    const created = await client.query(
      `INSERT INTO erp.contas_pagar (
         tenant_id, fornecedor_id, compra_id, descricao, numero_documento,
         data_competencia, data_emissao, valor_total, status, categoria_id,
         centro_custo_id, origem, tipo_lancamento, fornecedor_nome_snapshot,
         fornecedor_documento_snapshot, efetivado_em, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aberto', $9, $10, 'compra', $11, $12, $13,
         CASE WHEN $11 = 'efetivo' THEN now() ELSE NULL END, $14, $14)
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.tenant_id,
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
         tenant_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
         data_pagamento_previsto, valor, valor_bruto, valor_liquido, valor_pago,
         status, conta_financeira_id, metodo_pagamento_id, observacoes, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $10)
       RETURNING id::text, numero_parcela, valor, status`,
      [
        purchase.tenant_id,
        payable.id,
        installment.numeroParcela,
        installment.descricao,
        installment.dataVencimento,
        installment.valor,
        installment.contaFinanceiraId || purchase.conta_financeira_id,
        installment.metodoPagamentoId || purchase.metodo_pagamento_id,
        installment.observacoes,
        actorId,
      ],
    )
    createdInstallments.push(result.rows[0] as InstallmentRow)
  }

  await client.query(
    `INSERT INTO erp.contas_pagar_eventos (tenant_id, conta_pagar_id, evento, dados, criado_por)
     VALUES ($1, $2, $3, $4::jsonb, $5)`,
    [purchase.tenant_id, payable.id, type === 'efetivo' ? 'efetivada' : 'previsao_criada', JSON.stringify({ compra_id: purchase.id }), actorId],
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
     WHERE tenant_id = $1
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
     WHERE tenant_id = $1
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
  const [suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, purchaseCandidates] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento FROM erp.entidades WHERE tenant_id = $1 AND eh_fornecedor = true AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, custo AS valor_padrao FROM erp.produtos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, custo AS valor_padrao FROM erp.servicos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.categorias WHERE tenant_id = $1 AND tipo IN ('despesa', 'geral') AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, codigo, atualiza_estoque, gera_financeiro_padrao FROM erp.naturezas_operacao_compra WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT compras.id::text, compras.numero, compras.total, entidades.nome AS fornecedor
      FROM erp.compras AS compras
      JOIN erp.entidades AS entidades ON entidades.tenant_id = compras.tenant_id AND entidades.id = compras.fornecedor_id
      WHERE compras.tenant_id = $1 AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM erp.notas_fiscais AS notas
          WHERE notas.tenant_id = compras.tenant_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
        )
      ORDER BY compras.data_compra DESC, compras.id DESC LIMIT 200`, [tenantId]),
  ])

  return { suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, purchaseCandidates }
}

export async function listErpSalesCatalogs(tenantId: number) {
  const [customers, products, services, categories, costCenters, financialAccounts, paymentMethods] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento, email, celular, telefone, contato_cobranca_emails, contato_cobranca_whatsapp
      FROM erp.entidades WHERE tenant_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, preco_venda AS valor_padrao
      FROM erp.produtos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, preco AS valor_padrao
      FROM erp.servicos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.categorias WHERE tenant_id = $1 AND tipo IN ('receita', 'geral') AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
  ])
  return { customers, products, services, categories, costCenters, financialAccounts, paymentMethods }
}

export async function getErpOverview(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
      (SELECT COALESCE(sum(GREATEST(parcelas.valor - parcelas.valor_pago, 0)), 0)
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas ON contas.tenant_id = parcelas.tenant_id AND contas.id = parcelas.conta_receber_id
       WHERE parcelas.tenant_id = $1 AND parcelas.status NOT IN ('pago', 'cancelado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_receber,
      (SELECT COALESCE(sum(GREATEST(parcelas.valor - parcelas.valor_pago, 0)), 0)
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas ON contas.tenant_id = parcelas.tenant_id AND contas.id = parcelas.conta_pagar_id
       WHERE parcelas.tenant_id = $1 AND parcelas.status NOT IN ('pago', 'cancelado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_pagar,
      (SELECT COALESCE(sum(GREATEST(valor - valor_pago, 0)), 0) FROM erp.contas_receber_parcelas
       WHERE tenant_id = $1 AND data_vencimento < CURRENT_DATE AND status NOT IN ('pago', 'cancelado') AND excluido_em IS NULL) AS receber_vencido,
      (SELECT count(*)::int FROM erp.vendas WHERE tenant_id = $1 AND status = 'rascunho' AND excluido_em IS NULL) AS vendas_rascunho,
      (SELECT count(*)::int FROM erp.compras WHERE tenant_id = $1 AND tipo_movimento IN ('cotacao', 'pedido_compra', 'pedido_recorrente') AND excluido_em IS NULL) AS compras_abertas,
      (SELECT count(*)::int FROM erp.entidades WHERE tenant_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL) AS clientes_ativos`,
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
       ON entidades.tenant_id = notas.tenant_id AND entidades.id = notas.entidade_id
     LEFT JOIN erp.compras AS compras
       ON compras.tenant_id = notas.tenant_id AND compras.id = notas.compra_id
     WHERE notas.tenant_id = $1
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
       ON parcelas.tenant_id = pagamentos.tenant_id
      AND parcelas.id = pagamentos.${receiving ? 'conta_receber_parcela_id' : 'conta_pagar_parcela_id'}
     LEFT JOIN erp.contas_financeiras AS financeiras
       ON financeiras.tenant_id = pagamentos.tenant_id AND financeiras.id = pagamentos.conta_financeira_id
     LEFT JOIN erp.metodos_pagamento AS metodos
       ON metodos.tenant_id = pagamentos.tenant_id AND metodos.id = pagamentos.metodo_pagamento_id
     WHERE pagamentos.tenant_id = $1
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
      `SELECT vendas.*, entidades.nome AS cliente_nome, entidades.documento AS cliente_documento
       FROM erp.vendas JOIN erp.entidades
         ON entidades.tenant_id = vendas.tenant_id AND entidades.id = vendas.cliente_id
       WHERE vendas.tenant_id = $1 AND vendas.id = $2 AND vendas.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.quantidade,
         itens.valor_unitario, itens.desconto, itens.total
       FROM erp.vendas_itens itens WHERE itens.tenant_id = $1 AND itens.venda_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.vendas_recebimentos_previstos WHERE tenant_id = $1 AND venda_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, status_anterior, status_novo, versao, dados, criado_em
       FROM erp.vendas_eventos WHERE tenant_id = $1 AND venda_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!sales[0]) throw new Error('Venda nao encontrada.')
  return { sale: sales[0], items, installments, events }
}

export async function getErpPurchaseDetails(tenantId: number, idValue: string | number) {
  const id = numericId(idValue, 'Compra')
  const [purchases, items, installments, events, invoices] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT compras.*, entidades.nome AS fornecedor_nome, entidades.documento AS fornecedor_documento
       FROM erp.compras JOIN erp.entidades
         ON entidades.tenant_id = compras.tenant_id AND entidades.id = compras.fornecedor_id
       WHERE compras.tenant_id = $1 AND compras.id = $2 AND compras.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.detalhes,
         itens.unidade, itens.quantidade, itens.valor_unitario, itens.valor_desconto, itens.total
       FROM erp.compras_itens itens WHERE itens.tenant_id = $1 AND itens.compra_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.compras_parcelas_previstas WHERE tenant_id = $1 AND compra_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, dados, criado_em FROM erp.compras_eventos
       WHERE tenant_id = $1 AND compra_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero, serie, chave_acesso, status, valor_total, emitida_em
       FROM erp.notas_fiscais WHERE tenant_id = $1 AND compra_id = $2 AND excluido_em IS NULL
       ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!purchases[0]) throw new Error('Compra nao encontrada.')
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
    if (!supplierName || !supplierDocument) throw new Error('Fornecedor da NF-e invalido.')
    const total = money(values.valor_total)
    const issueDate = dateText(values.data_emissao) || new Date().toISOString().slice(0, 10)
    const recipientDocument = text(values.destinatario_documento).replace(/\D/g, '')
    if (!recipientDocument) throw new Error('Destinatario da NF-e nao identificado.')

    const fiscalConfig = await client.query(
      `SELECT regexp_replace(cnpj, '\\D', '', 'g') AS cnpj
       FROM erp.configuracoes_fiscais
       WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL
       ORDER BY id LIMIT 1`,
      [input.tenantId],
    )
    const configuredDocument = text(fiscalConfig.rows[0]?.cnpj)
    if (!configuredDocument) {
      throw new Error('Configure o CNPJ da empresa antes de importar NF-e de entrada.')
    }
    if (configuredDocument !== recipientDocument) {
      throw new Error('A NF-e nao foi emitida para o CNPJ configurado neste tenant.')
    }

    const existingResult = await client.query(
      `SELECT id::text, compra_id::text, status
       FROM erp.notas_fiscais
       WHERE tenant_id = $1 AND chave_acesso = $2 AND direcao = 'entrada' AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, key],
    )
    if (existingResult.rows[0]) return { invoice: existingResult.rows[0], reused: true }

    let supplierResult = await client.query(
      `SELECT id, nome, documento, eh_fornecedor FROM erp.entidades
       WHERE tenant_id = $1 AND regexp_replace(COALESCE(documento, ''), '\\D', '', 'g') = $2
         AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, supplierDocument],
    )
    if (!supplierResult.rows[0]) {
      supplierResult = await client.query(
        `INSERT INTO erp.entidades (
           tenant_id, tipo_pessoa, nome, documento, eh_cliente, eh_fornecedor,
           ativo, criado_por, atualizado_por, metadata
         ) VALUES ($1, 'juridica', $2, $3, false, true, true, $4, $4, $5::jsonb)
         RETURNING id, nome, documento`,
        [input.tenantId, supplierName, supplierDocument, input.actorId, JSON.stringify({ origem: 'xml_nfe' })],
      )
    } else if (!Boolean((supplierResult.rows[0] as Record<string, unknown>).eh_fornecedor)) {
      await client.query(
        `UPDATE erp.entidades SET eh_fornecedor = true, atualizado_por = $3 WHERE tenant_id = $1 AND id = $2`,
        [input.tenantId, supplierResult.rows[0].id, input.actorId],
      )
    }
    const supplier = supplierResult.rows[0]

    const items = Array.isArray(values.itens) ? values.itens as Record<string, unknown>[] : []
    if (items.length === 0) throw new Error('A NF-e nao possui itens validos.')
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
           WHERE compras.tenant_id = $1 AND compras.id = $2
             AND compras.fornecedor_id = $3 AND compras.total = $4
             AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM erp.notas_fiscais AS notas
               WHERE notas.tenant_id = compras.tenant_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
             )
           FOR UPDATE`,
          [input.tenantId, requestedPurchaseId, supplier.id, total],
        )
        purchase = existingPurchase.rows[0] as PurchaseRow | undefined || null
        if (!purchase) throw new Error('A compra escolhida nao pertence ao fornecedor ou possui total diferente da NF-e.')
        if (Math.abs(money(purchase.subtotal) - money(values.valor_produtos)) > 0.02) {
          throw new Error('O subtotal da compra escolhida nao confere com os produtos da NF-e.')
        }
      }

      if (!purchase) {
        const purchaseResult = await client.query(
          `INSERT INTO erp.compras (
             tenant_id, fornecedor_id, numero, data_compra, data_competencia,
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
               ON produtos.tenant_id = vinculos.tenant_id AND produtos.id = vinculos.produto_id
             WHERE vinculos.tenant_id = $1 AND vinculos.fornecedor_id = $2
               AND lower(vinculos.codigo_fornecedor) = lower($3)
               AND vinculos.ativo = true AND vinculos.excluido_em IS NULL
               AND produtos.excluido_em IS NULL
             LIMIT 1`,
            [input.tenantId, supplier.id, code],
          )
          if (!productResult.rows[0]) {
            productResult = await client.query(
              `INSERT INTO erp.produtos (
                 tenant_id, nome, codigo, sku, unidade_medida, ncm, custo, preco_venda,
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
                 tenant_id, fornecedor_id, produto_id, codigo_fornecedor,
                 descricao_fornecedor, unidade_fornecedor, ultimo_custo, ultima_compra_em,
                 criado_por, atualizado_por
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
               ON CONFLICT (tenant_id, fornecedor_id, lower(codigo_fornecedor))
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
               tenant_id, compra_id, produto_id, descricao, unidade, quantidade,
               valor_unitario, valor_bruto, valor_liquido, total, item_codigo_snapshot,
               item_descricao_snapshot, item_unidade_snapshot, criado_por, atualizado_por,
               metadata
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, $9, $4, $5, $10, $10, $11::jsonb)`,
            [input.tenantId, purchase.id, product.id, description, optionalText(rawItem.unidade) || 'UN', quantity, unitValue, itemTotal, code, input.actorId, JSON.stringify({ ncm: rawItem.ncm, cfop: rawItem.cfop })],
          )
        }
        await client.query(
          `INSERT INTO erp.compras_parcelas_previstas (
             tenant_id, compra_id, numero_parcela, descricao, data_vencimento, valor, criado_por, atualizado_por
           ) VALUES ($1, $2, 1, 'Parcela 1', $3, $4, $5, $5)`,
          [input.tenantId, purchase.id, dateText(values.data_vencimento) || issueDate, total, input.actorId],
        )
      } else {
        const updatedPurchase = await client.query(
          `UPDATE erp.compras SET status = 'recebida', tipo_movimento = 'compra', origem = 'xml',
             gera_financeiro = $3, recebida_em = COALESCE(recebida_em, now()), atualizado_por = $4
           WHERE tenant_id = $1 AND id = $2 RETURNING *`,
          [input.tenantId, purchase.id, generateFinancial, input.actorId],
        )
        purchase = updatedPurchase.rows[0] as PurchaseRow
      }

      if (generateFinancial && purchase) await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'efetivo')
    }

    const invoiceResult = await client.query(
      `INSERT INTO erp.notas_fiscais (
         tenant_id, compra_id, entidade_id, tipo, direcao, finalidade, status,
         numero, serie, chave_acesso, protocolo, valor_produtos, valor_total, emitida_em,
         xml_hash, destinatario_documento, codigo_status_sefaz, motivo_status_sefaz,
         payload_enviado, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, 'nfe', 'entrada', 'normal', 'emitida', $4, $5, $6,
         $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $16)
       RETURNING id::text, compra_id::text, status, chave_acesso`,
      [input.tenantId, purchase?.id || null, supplier.id, optionalText(values.numero), optionalText(values.serie), key,
        parsedNfe.protocolo, money(values.valor_produtos), total, issueDate, parsedNfe.xml_hash,
        recipientDocument, parsedNfe.codigo_status_sefaz, parsedNfe.motivo_status_sefaz,
        JSON.stringify({ xml: parsedNfe.xml }), input.actorId],
    )
    const invoice = invoiceResult.rows[0]

    await client.query(
      `INSERT INTO erp.notas_fiscais_totais (
         tenant_id, nota_fiscal_id, base_icms, valor_icms, base_icms_st, valor_icms_st,
         valor_fcp, valor_fcp_st, valor_ipi, valor_ii, valor_pis, valor_cofins,
         valor_seguro, outras_despesas, desconto, frete, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)`,
      [input.tenantId, invoice.id, parsedNfe.totais.base_icms, parsedNfe.totais.valor_icms,
        parsedNfe.totais.base_icms_st, parsedNfe.totais.valor_icms_st, parsedNfe.totais.valor_fcp,
        parsedNfe.totais.valor_fcp_st, parsedNfe.totais.valor_ipi, parsedNfe.totais.valor_ii,
        parsedNfe.totais.valor_pis, parsedNfe.totais.valor_cofins, parsedNfe.totais.valor_seguro,
        parsedNfe.totais.outras_despesas, money(values.desconto), money(values.frete), input.actorId],
    )

    for (const rawItem of items) {
      await client.query(
        `INSERT INTO erp.notas_fiscais_itens (
           tenant_id, nota_fiscal_id, tipo_item, descricao, quantidade, valor_unitario,
           valor_total, ncm, cfop, payload_item, criado_por, atualizado_por
         ) VALUES ($1, $2, 'produto', $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $10)`,
        [input.tenantId, invoice.id, optionalText(rawItem.descricao) || 'Item NF-e', Number(rawItem.quantidade || 1), money(rawItem.valor_unitario), money(rawItem.valor_total), optionalText(rawItem.ncm), optionalText(rawItem.cfop), JSON.stringify(rawItem), input.actorId],
      )
    }
    return { invoice, purchase: purchase ? { id: String(purchase.id), numero: purchase.numero } : null, reused: false }
  })
}

export async function listErpEntityRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
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
  const total = rawRecords.length > 0 ? Number(rawRecords[0].__total ?? rawRecords.length) : 0
  const records = rawRecords.map(({ __total: _total, ...record }) => record as ErpEntityRecord)

  return {
    records,
    total,
    page: normalizedPage(input),
    pageSize: normalizedPageSize(input),
  }
}

async function listEntityRoleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const roleColumn = input.entityId === 'clientes' ? 'eh_cliente' : 'eh_fornecedor'
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         id::text,
         nome,
         documento,
         email,
         cidade,
         tipo_pessoa,
         versao,
         ativo,
         COALESCE(metadata ->> 'categoria', '') AS categoria,
         concat_ws(' ', nome, documento, email, cidade, COALESCE(metadata ->> 'categoria', '')) AS searchable
       FROM erp.entidades
       WHERE tenant_id = $1
         AND ${roleColumn} = true
         AND excluido_em IS NULL
     )
     SELECT id, nome, documento, email, cidade, tipo_pessoa, versao, ativo, categoria,
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
         produtos.versao,
         produtos.ativo,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', produtos.nome, produtos.sku, produtos.codigo, categorias.nome) AS searchable
       FROM erp.produtos AS produtos
       LEFT JOIN erp.categorias AS categorias
         ON categorias.tenant_id = produtos.tenant_id
        AND categorias.id = produtos.categoria_id
       WHERE produtos.tenant_id = $1
         AND produtos.excluido_em IS NULL
     )
     SELECT id, nome, sku, preco_venda, categoria, versao, ativo,
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
         concat_ws(' ', servicos.nome, servicos.codigo, servicos.descricao, categorias.nome) AS searchable
       FROM erp.servicos AS servicos
       LEFT JOIN erp.categorias AS categorias
         ON categorias.tenant_id = servicos.tenant_id
        AND categorias.id = servicos.categoria_id
       WHERE servicos.tenant_id = $1
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
         (
           SELECT count(*)::int
           FROM erp.produtos AS produtos
           WHERE produtos.tenant_id = categorias.tenant_id
             AND produtos.categoria_id = categorias.id
             AND produtos.excluido_em IS NULL
         ) + (
           SELECT count(*)::int
           FROM erp.servicos AS servicos
           WHERE servicos.tenant_id = categorias.tenant_id
             AND servicos.categoria_id = categorias.id
             AND servicos.excluido_em IS NULL
         ) AS itens,
         concat_ws(' ', categorias.nome, categorias.metadata ->> 'descricao') AS searchable
       FROM erp.categorias AS categorias
       WHERE categorias.tenant_id = $1
         AND categorias.excluido_em IS NULL
     )
     SELECT id, nome, descricao, tipo, versao, itens, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}
     ORDER BY nome ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    descricao: String(row.descricao ?? ''),
    tipo: String(row.tipo ?? 'geral'),
    versao: Number(row.versao ?? 1),
    itens: Number(row.itens ?? 0),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}

async function listSaleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         vendas.id::text,
         vendas.numero,
         vendas.data_venda,
         vendas.status,
         vendas.total,
         entidades.nome AS cliente,
         concat_ws(' ', vendas.numero, entidades.nome, vendas.status) AS searchable
       FROM erp.vendas AS vendas
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = vendas.tenant_id
        AND entidades.id = vendas.cliente_id
       WHERE vendas.tenant_id = $1
         AND vendas.excluido_em IS NULL
     )
     SELECT id, numero, data_venda, status, total, cliente, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_venda DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    cliente: String(row.cliente ?? ''),
    data: dateText(row.data_venda) || '',
    total: Number(row.total ?? 0),
    status: String(row.status ?? ''),
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
         contas.tipo_lancamento,
         concat_ws(' ', compras.numero, entidades.nome, compras.status, compras.tipo_movimento) AS searchable
       FROM erp.compras AS compras
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = compras.tenant_id
        AND entidades.id = compras.fornecedor_id
       LEFT JOIN erp.contas_pagar AS contas
         ON contas.tenant_id = compras.tenant_id
        AND contas.compra_id = compras.id
        AND contas.excluido_em IS NULL
       WHERE compras.tenant_id = $1
         AND compras.excluido_em IS NULL
         ${movementClause}
     )
     SELECT id, numero, data_compra, data_prevista_entrega, status, tipo_compra, tipo_movimento,
       total, gera_financeiro, fornecedor, tipo_lancamento, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_compra DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    data: dateText(row.data_compra) || '',
    entrega: dateText(row.data_prevista_entrega) || '',
    total: Number(row.total ?? 0),
    tipo_compra: String(row.tipo_compra ?? ''),
    tipo_movimento: String(row.tipo_movimento ?? ''),
    financeiro: row.gera_financeiro ? (row.tipo_lancamento === 'previsao' ? 'Previsao' : row.tipo_lancamento === 'efetivo' ? 'Efetivo' : 'Ao efetivar') : 'Nao gera',
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
  }))
}

async function listReceivables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text,
         contas.descricao,
         contas.numero_documento,
         contas.valor_total,
         CASE
           WHEN contas.status = 'cancelado' THEN 'cancelado'
           WHEN COALESCE(sum(parcelas.valor) FILTER (WHERE parcelas.status <> 'cancelado'), 0) > 0
             AND COALESCE(sum(parcelas.valor_pago) FILTER (WHERE parcelas.status <> 'cancelado'), 0)
               >= COALESCE(sum(parcelas.valor) FILTER (WHERE parcelas.status <> 'cancelado'), 0) THEN 'pago'
           WHEN bool_or(parcelas.status <> 'cancelado' AND parcelas.valor_pago < parcelas.valor AND parcelas.data_vencimento < CURRENT_DATE)
             THEN 'vencido'
           WHEN COALESCE(sum(parcelas.valor_pago) FILTER (WHERE parcelas.status <> 'cancelado'), 0) > 0 THEN 'parcial'
           ELSE 'aberto'
         END AS status,
         entidades.nome AS cliente,
         min(parcelas.data_vencimento) FILTER (WHERE parcelas.status NOT IN ('pago', 'cancelado')) AS vencimento,
         (array_agg(parcelas.id::text ORDER BY CASE WHEN parcelas.status <> 'pago' THEN 0 ELSE 1 END, parcelas.data_vencimento ASC, parcelas.id ASC)
           FILTER (WHERE parcelas.status NOT IN ('pago', 'cancelado')))[1] AS parcela_id,
         COALESCE(sum(parcelas.valor_pago) FILTER (WHERE parcelas.status <> 'cancelado'), 0) AS valor_pago,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status) AS searchable
       FROM erp.contas_receber AS contas
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = contas.tenant_id
        AND entidades.id = contas.cliente_id
       LEFT JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.tenant_id = contas.tenant_id
        AND parcelas.conta_receber_id = contas.id
        AND parcelas.excluido_em IS NULL
       WHERE contas.tenant_id = $1
         AND contas.excluido_em IS NULL
       GROUP BY contas.id, contas.descricao, contas.numero_documento, contas.valor_total, contas.status, entidades.nome
     )
     SELECT id, descricao, numero_documento, valor_total, valor_pago, status, cliente, vencimento, parcela_id,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY vencimento ASC NULLS LAST, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    parcela_id: String(row.parcela_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    cliente: String(row.cliente ?? ''),
    vencimento: dateText(row.vencimento) || '',
    valor: Number(row.valor_total ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
  }))
}

async function listPayables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const origin = optionalText(input.filters?.origem)
  const launchType = optionalText(input.filters?.tipo_lancamento)
  const originClause = origin ? ` AND contas.origem = $${params.push(origin)}` : ''
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
         parcelas.valor,
         parcelas.valor_pago,
         GREATEST(parcelas.valor - parcelas.valor_pago, 0) AS saldo,
         CASE
           WHEN contas.status = 'cancelado' OR parcelas.status = 'cancelado' THEN 'cancelado'
           WHEN parcelas.valor_pago >= parcelas.valor THEN 'pago'
           WHEN parcelas.data_vencimento < CURRENT_DATE THEN 'vencido'
           WHEN parcelas.valor_pago > 0 THEN 'parcial'
           ELSE parcelas.status
         END AS status,
         entidades.nome AS fornecedor,
         categorias.nome AS categoria,
         centros.nome AS centro_custo,
         financeiras.nome AS conta_financeira,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status, contas.origem) AS searchable
       FROM erp.contas_pagar AS contas
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = contas.tenant_id
        AND entidades.id = contas.fornecedor_id
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.tenant_id = contas.tenant_id
        AND parcelas.conta_pagar_id = contas.id
        AND parcelas.excluido_em IS NULL
       LEFT JOIN erp.categorias AS categorias
         ON categorias.tenant_id = contas.tenant_id AND categorias.id = contas.categoria_id
       LEFT JOIN erp.centros_custo AS centros
         ON centros.tenant_id = contas.tenant_id AND centros.id = contas.centro_custo_id
       LEFT JOIN erp.contas_financeiras AS financeiras
         ON financeiras.tenant_id = parcelas.tenant_id AND financeiras.id = parcelas.conta_financeira_id
       WHERE contas.tenant_id = $1
         AND contas.excluido_em IS NULL
         ${originClause}
         ${launchTypeClause}
     )
     SELECT conta_id, parcela_id, descricao, numero_documento, origem, tipo_lancamento,
       numero_parcela, data_vencimento, valor, valor_pago, saldo, status, fornecedor,
       categoria, centro_custo, conta_financeira, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_vencimento ASC, parcela_id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.parcela_id),
    conta_id: String(row.conta_id),
    parcela_id: String(row.parcela_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    parcela: Number(row.numero_parcela ?? 0),
    vencimento: dateText(row.data_vencimento) || '',
    valor: Number(row.valor ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    saldo: Number(row.saldo ?? 0),
    origem: String(row.origem ?? ''),
    tipo_lancamento: String(row.tipo_lancamento ?? ''),
    categoria: String(row.categoria ?? ''),
    centro_custo: String(row.centro_custo ?? ''),
    conta_financeira: String(row.conta_financeira ?? ''),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
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
       WHERE tenant_id = $1
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
  produtos: { table: 'produtos', eventType: 'produto' },
  servicos: { table: 'servicos', eventType: 'servico' },
  categorias: { table: 'categorias', eventType: 'categoria' },
  'contas-financeiras': { table: 'contas_financeiras', eventType: 'conta_financeira' },
} as const

type EditableModuleId = keyof typeof editableModuleTables

function assertEditableModule(entityId: ErpConnectedModuleId): asserts entityId is EditableModuleId {
  if (!(entityId in editableModuleTables)) throw new Error('Este modulo nao permite edicao por esta rota.')
}

export async function getErpEntityRecord(input: {
  tenantId: number
  entityId: ErpConnectedModuleId
  id: string | number
}): Promise<ErpEntityRecord> {
  assertEditableModule(input.entityId)
  const id = numericId(input.id, 'Registro')
  let sql = ''
  if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
    const role = input.entityId === 'clientes' ? 'eh_cliente' : 'eh_fornecedor'
    sql = `SELECT id::text, nome, documento, email, telefone, cidade,
      CASE tipo_pessoa WHEN 'fisica' THEN 'PF' WHEN 'juridica' THEN 'PJ' ELSE 'Estrangeira' END AS tipo,
      COALESCE(metadata ->> 'categoria', '') AS categoria,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.entidades WHERE tenant_id = $1 AND id = $2 AND ${role} = true AND excluido_em IS NULL`
  } else if (input.entityId === 'produtos') {
    sql = `SELECT produtos.id::text, produtos.nome, produtos.sku,
      COALESCE(categorias.nome, '') AS categoria, produtos.preco_venda AS preco,
      CASE WHEN produtos.ativo THEN 'ativo' ELSE 'pausado' END AS status, produtos.versao
      FROM erp.produtos LEFT JOIN erp.categorias
        ON categorias.tenant_id = produtos.tenant_id AND categorias.id = produtos.categoria_id
      WHERE produtos.tenant_id = $1 AND produtos.id = $2 AND produtos.excluido_em IS NULL`
  } else if (input.entityId === 'servicos') {
    sql = `SELECT servicos.id::text, servicos.nome, servicos.codigo, servicos.descricao,
      COALESCE(categorias.nome, '') AS categoria, servicos.preco, servicos.custo,
      CASE WHEN servicos.ativo THEN 'ativo' ELSE 'pausado' END AS status, servicos.versao
      FROM erp.servicos LEFT JOIN erp.categorias
        ON categorias.tenant_id = servicos.tenant_id AND categorias.id = servicos.categoria_id
      WHERE servicos.tenant_id = $1 AND servicos.id = $2 AND servicos.excluido_em IS NULL`
  } else if (input.entityId === 'categorias') {
    sql = `SELECT id::text, nome, tipo, COALESCE(metadata ->> 'descricao', '') AS descricao,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.categorias WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL`
  } else {
    sql = `SELECT id::text, nome, tipo, banco, agencia, conta, digito, saldo_inicial,
      data_saldo_inicial, CASE WHEN padrao THEN 'sim' ELSE 'nao' END AS padrao,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.contas_financeiras WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL`
  }

  const rows = await runQuery<Record<string, unknown>>(sql, [input.tenantId, id])
  if (!rows[0]) throw new Error('Registro nao encontrado.')
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
       tenant_id, entidade_tipo, entidade_id, evento, versao, dados, criado_por
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
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Registro nao encontrado.')
    if (Number(current.versao) !== input.expectedVersion) {
      throw new Error('CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a pagina.')
    }

    let result: { rows: Record<string, unknown>[] }
    if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
      assertRequired(input.values.nome, 'Nome')
      const category = optionalText(input.values.categoria)
      result = await client.query(
        `UPDATE erp.entidades SET tipo_pessoa = $3, nome = $4, documento = $5, email = $6,
           telefone = $7, cidade = $8, ativo = $9,
           metadata = metadata || jsonb_build_object('categoria', $10::text),
           versao = versao + 1, atualizado_por = $11
         WHERE tenant_id = $1 AND id = $2 AND versao = $12 RETURNING *`,
        [input.tenantId, id, normalizePersonType(input.values.tipo), text(input.values.nome),
          optionalText(input.values.documento), optionalText(input.values.email), optionalText(input.values.telefone),
          optionalText(input.values.cidade), activeFromStatus(input.values.status), category || '', input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'produtos') {
      assertRequired(input.values.nome, 'Nome do produto')
      const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'produto')
      result = await client.query(
        `UPDATE erp.produtos SET nome = $3, sku = $4, codigo = $4, preco_venda = $5,
           categoria_id = $6, ativo = $7, versao = versao + 1, atualizado_por = $8
         WHERE tenant_id = $1 AND id = $2 AND versao = $9 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.sku), money(input.values.preco),
          categoryId, activeFromStatus(input.values.status), input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'servicos') {
      assertRequired(input.values.nome, 'Nome do servico')
      const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'servico')
      result = await client.query(
        `UPDATE erp.servicos SET nome = $3, codigo = $4, descricao = $5, preco = $6, custo = $7,
           categoria_id = $8, ativo = $9, versao = versao + 1, atualizado_por = $10
         WHERE tenant_id = $1 AND id = $2 AND versao = $11 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.codigo), optionalText(input.values.descricao),
          money(input.values.preco), money(input.values.custo), categoryId, activeFromStatus(input.values.status),
          input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'categorias') {
      assertRequired(input.values.nome, 'Nome da categoria')
      const categoryType = ['receita', 'despesa', 'produto', 'servico', 'geral'].includes(text(input.values.tipo))
        ? text(input.values.tipo) : 'geral'
      result = await client.query(
        `UPDATE erp.categorias SET nome = $3, tipo = $4, ativo = $5,
           metadata = metadata || jsonb_build_object('descricao', $6::text),
           versao = versao + 1, atualizado_por = $7
         WHERE tenant_id = $1 AND id = $2 AND versao = $8 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), categoryType, activeFromStatus(input.values.status),
          optionalText(input.values.descricao) || '', input.actorId, input.expectedVersion],
      )
    } else {
      assertRequired(input.values.nome, 'Nome da conta financeira')
      const makeDefault = booleanValue(input.values.padrao)
      if (makeDefault) {
        await client.query(
          `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2
           WHERE tenant_id = $1 AND id <> $3 AND padrao = true`,
          [input.tenantId, input.actorId, id],
        )
      }
      result = await client.query(
        `UPDATE erp.contas_financeiras SET nome = $3, tipo = $4, banco = $5, agencia = $6,
           conta = $7, digito = $8, saldo_inicial = $9, data_saldo_inicial = $10,
           padrao = $11, ativo = $12, versao = versao + 1, atualizado_por = $13
         WHERE tenant_id = $1 AND id = $2 AND versao = $14 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), financialAccountType(input.values.tipo),
          optionalText(input.values.banco), optionalText(input.values.agencia), optionalText(input.values.conta),
          optionalText(input.values.digito), money(input.values.saldo_inicial), dateText(input.values.data_saldo_inicial),
          makeDefault, activeFromStatus(input.values.status), input.actorId, input.expectedVersion],
      )
    }

    const updated = result.rows[0]
    if (!updated) throw new Error('CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a pagina.')
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'atualizado', Number(updated.versao), current, updated)
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}

export async function deactivateErpEntityRecord(input: IdActionInput & { entityId: ErpConnectedModuleId; expectedVersion: number }) {
  assertEditableModule(input.entityId)
  const entityId = input.entityId as EditableModuleId
  const id = numericId(input.id, 'Registro')
  await withTransaction(async (client) => {
    const table = editableModuleTables[entityId].table
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Registro nao encontrado.')
    if (Number(current.versao) !== input.expectedVersion) throw new Error('CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    const result = await client.query(
      `UPDATE erp.${table} SET ativo = false, versao = versao + 1, atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2 AND versao = $4 RETURNING *`,
      [input.tenantId, id, input.actorId, input.expectedVersion],
    )
    const updated = result.rows[0]
    if (!updated) throw new Error('CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'desativado', Number(updated.versao), current, updated)
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}

export async function getErpEntitySummary(tenantId: number, entityId: ErpConnectedModuleId) {
  assertEditableModule(entityId)
  let sql = ''
  if (entityId === 'clientes' || entityId === 'fornecedores') {
    const role = entityId === 'clientes' ? 'eh_cliente' : 'eh_fornecedor'
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE NOT ativo)::int AS inativos,
      count(DISTINCT NULLIF(metadata ->> 'categoria', ''))::int AS categorias
      FROM erp.entidades WHERE tenant_id = $1 AND ${role} = true AND excluido_em IS NULL`
  } else if (entityId === 'produtos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco_venda) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.produtos WHERE tenant_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'servicos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.servicos WHERE tenant_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'categorias') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE ativo AND NOT EXISTS (SELECT 1 FROM erp.produtos p WHERE p.tenant_id = categorias.tenant_id AND p.categoria_id = categorias.id AND p.excluido_em IS NULL) AND NOT EXISTS (SELECT 1 FROM erp.servicos s WHERE s.tenant_id = categorias.tenant_id AND s.categoria_id = categorias.id AND s.excluido_em IS NULL))::int AS sem_itens,
      count(DISTINCT tipo)::int AS tipos FROM erp.categorias WHERE tenant_id = $1 AND excluido_em IS NULL`
  } else {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(*) FILTER (WHERE padrao AND ativo)::int AS padrao,
      COALESCE(sum(saldo_inicial) FILTER (WHERE ativo), 0)::numeric(18,2) AS saldo
      FROM erp.contas_financeiras WHERE tenant_id = $1 AND excluido_em IS NULL`
  }
  const row = (await runQuery<Record<string, unknown>>(sql, [tenantId]))[0] || {}
  const currency = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
  if (entityId === 'produtos' || entityId === 'servicos') return { metrics: [
    { label: entityId === 'produtos' ? 'SKUs ativos' : 'Servicos ativos', value: String(row.ativos || 0), detail: 'catalogo conectado', tone: 'success' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificacao em uso' },
    { label: 'Preco medio', value: currency(row.media), detail: 'itens ativos' },
  ] }
  if (entityId === 'categorias') return { metrics: [
    { label: 'Categorias ativas', value: String(row.ativos || 0), detail: 'em uso no ERP' },
    { label: 'Sem itens', value: String(row.sem_itens || 0), detail: 'avaliar classificacao', tone: 'warning' },
    { label: 'Tipos em uso', value: String(row.tipos || 0), detail: 'finalidades distintas' },
  ] }
  if (entityId === 'contas-financeiras') return { metrics: [
    { label: 'Contas ativas', value: String(row.ativos || 0), detail: 'disponiveis para baixas' },
    { label: 'Conta padrao', value: String(row.padrao || 0), detail: 'selecionada automaticamente' },
    { label: 'Saldo inicial', value: currency(row.saldo), detail: 'soma das contas ativas' },
  ] }
  return { metrics: [
    { label: entityId === 'clientes' ? 'Clientes ativos' : 'Fornecedores ativos', value: String(row.ativos || 0), detail: 'base conectada', tone: 'success' },
    { label: 'Inativos', value: String(row.inativos || 0), detail: 'cadastros pausados' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificacoes em uso' },
  ] }
}

export async function listErpCategoryOptions(tenantId: number, type?: string) {
  const allowedType = ['receita', 'despesa', 'produto', 'servico', 'geral'].includes(text(type)) ? text(type) : null
  const params: unknown[] = [tenantId]
  const typeClause = allowedType ? ` AND tipo IN ($${params.push(allowedType)}, 'geral')` : ''
  const rows = await runQuery<{ nome: string; tipo: string }>(
    `SELECT nome, tipo FROM erp.categorias
     WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL${typeClause}
     ORDER BY nome ASC LIMIT 100`, params,
  )
  return rows.map((row) => ({ value: row.nome, label: row.nome, tipo: row.tipo }))
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
      `SELECT id::text, nome, documento, email FROM erp.entidades
       WHERE tenant_id = $1 AND ${role} = true AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, documento, email) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'produto') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, unidade_medida AS unidade, preco_venda AS valor_padrao
       FROM erp.produtos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, sku, codigo, codigo_barras) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'servico') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(codigo, '') AS codigo, preco AS valor_padrao
       FROM erp.servicos WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, codigo, descricao) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  const categoryType = ['receita', 'despesa', 'produto', 'servico', 'geral'].includes(text(input.categoryType))
    ? text(input.categoryType) : null
  const params: unknown[] = [input.tenantId, query, limit]
  const typeClause = categoryType ? ` AND tipo IN ($${params.push(categoryType)}, 'geral')` : ''
  return runQuery(
    `SELECT id::text, nome, tipo FROM erp.categorias
     WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL AND nome ILIKE $2${typeClause}
     ORDER BY nome LIMIT $3`, params,
  )
}

export async function createErpEntityRecord(input: CreateInput): Promise<ErpEntityRecord> {
  const created = await withTransaction(async (client) => {
    if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
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
      throw new Error('Crie contas a receber a partir de vendas.')
    }

    if (input.entityId === 'contas-financeiras') {
      return createFinancialAccountRecord(client, input)
    }

    return createCategoryRecord(client, input)
  })
  if (input.entityId === 'contas-a-pagar') return created
  return fetchCreatedRecord(input.tenantId, input.entityId, created.id)
}

export async function confirmErpSale(input: ConfirmSaleInput): Promise<ConfirmErpSaleResult> {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT
         id,
         tenant_id,
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
         versao
       FROM erp.vendas
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0] as SaleRow | undefined
    if (!sale) throw new Error('Venda nao encontrada.')

    if (sale.status === 'cancelada') {
      throw new Error('Venda cancelada nao pode ser confirmada.')
    }

    const existingFinancial = await fetchReceivableForSale(client, input.tenantId, sale.id)
    if (existingFinancial) {
      if ((sale.status === 'confirmada' || sale.status === 'faturada') && existingFinancial.receivable.status !== 'cancelado') {
        return mapConfirmSaleResult(sale, existingFinancial.receivable, existingFinancial.installments)
      }
      throw new Error('Venda e conta a receber estao em estados inconsistentes e precisam ser revisadas.')
    }

    if (sale.status !== 'rascunho') {
      throw new Error('Venda ja saiu de rascunho e ainda nao possui contas a receber.')
    }

    if (!sale.cliente_id) {
      throw new Error('Venda precisa ter cliente para ser confirmada.')
    }

    if (money(sale.total) <= 0) {
      throw new Error('Venda precisa ter total maior que zero para ser confirmada.')
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
       WHERE tenant_id = $1
         AND id = $2
         AND eh_cliente = true
         AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, sale.cliente_id],
    )
    const customer = customerResult.rows[0] as Record<string, unknown> | undefined
    if (!customer) {
      throw new Error('Cliente da venda nao foi encontrado ou nao esta marcado como cliente.')
    }

    const itemsResult = await client.query(
      `SELECT count(*)::int AS total
       FROM erp.vendas_itens
       WHERE tenant_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id],
    )
    if (Number(itemsResult.rows[0]?.total || 0) <= 0) {
      throw new Error('Venda precisa ter pelo menos um item para ser confirmada.')
    }

    const updatedSaleResult = await client.query(
      `UPDATE erp.vendas
       SET
         status = 'confirmada',
         situacao = 'aprovada',
         confirmada_em = COALESCE(confirmada_em, now()),
         versao = versao + 1,
         atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING
         id,
         tenant_id,
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
      [input.tenantId, sale.id, input.actorId],
    )
    const updatedSale = updatedSaleResult.rows[0] as SaleRow
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
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
         tenant_id,
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
        dateText(updatedSale.data_venda) || new Date().toISOString().slice(0, 10),
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
           tenant_id,
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
           criado_por,
           atualizado_por
         )
         VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $9)
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
          input.actorId,
        ],
      )
      createdInstallments.push(installmentResult.rows[0] as InstallmentRow)
    }

    return mapConfirmSaleResult(updatedSale, receivable, createdInstallments)
  })
}

export async function cancelErpSale(input: IdActionInput & { reason?: string | null }) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, tenant_id, status, versao
       FROM erp.vendas
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const sale = saleResult.rows[0] as { id: string | number; status: string } | undefined
    if (!sale) throw new Error('Venda nao encontrada.')
    if (sale.status === 'cancelada') return { id: String(sale.id), status: 'cancelada' }

    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE tenant_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (invoiceResult.rows[0]) throw new Error('Cancele ou exclua a nota fiscal antes de cancelar a venda.')

    const chargeResult = await client.query(
      `SELECT cobrancas.id
       FROM erp.cobrancas AS cobrancas
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.tenant_id = cobrancas.tenant_id
        AND parcelas.id = cobrancas.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.tenant_id = parcelas.tenant_id
        AND contas.id = parcelas.conta_receber_id
       WHERE cobrancas.tenant_id = $1
         AND contas.venda_id = $2
         AND cobrancas.excluido_em IS NULL
         AND cobrancas.status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (chargeResult.rows[0]) throw new Error('Cancele a cobranca ativa antes de cancelar a venda.')

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.tenant_id = pagamentos.tenant_id
        AND parcelas.id = pagamentos.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.tenant_id = parcelas.tenant_id
        AND contas.id = parcelas.conta_receber_id
       WHERE pagamentos.tenant_id = $1
         AND contas.venda_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (paymentResult.rows[0]) throw new Error('Venda com pagamento nao pode ser cancelada sem estorno.')

    await client.query(
      `UPDATE erp.contas_receber_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_receber AS contas
       WHERE parcelas.tenant_id = contas.tenant_id
         AND parcelas.conta_receber_id = contas.id
         AND contas.tenant_id = $1
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
       WHERE tenant_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId, optionalText(input.reason)],
    )
    const updated = await client.query(
      `UPDATE erp.vendas
       SET status = 'cancelada', situacao = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()),
         versao = versao + 1, atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, status, versao`,
      [input.tenantId, sale.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'cancelada', $3, 'cancelada', $4, $5::jsonb, $6)`,
      [input.tenantId, sale.id, sale.status, Number(updated.rows[0]?.versao || 1),
        JSON.stringify({ motivo: optionalText(input.reason) }), input.actorId],
    )
    return updated.rows[0]
  })
}

export async function confirmErpPurchase(input: IdActionInput): Promise<ConfirmErpPurchaseResult> {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT
         id,
         tenant_id,
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
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as PurchaseRow | undefined
    if (!purchase) throw new Error('Compra nao encontrada.')
    if (purchase.status === 'cancelada') throw new Error('Compra cancelada nao pode ser confirmada.')
    if (!purchase.fornecedor_id) throw new Error('Compra precisa ter fornecedor para ser confirmada.')
    if (money(purchase.total) <= 0) throw new Error('Compra precisa ter total maior que zero para ser confirmada.')

    const itemResult = await client.query(
      `SELECT count(*)::int AS total
       FROM erp.compras_itens
       WHERE tenant_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, purchase.id],
    )
    if (Number(itemResult.rows[0]?.total || 0) <= 0) {
      throw new Error('Compra precisa ter pelo menos um item para ser confirmada.')
    }

    const existingFinancial = await fetchPayableForPurchase(client, input.tenantId, purchase.id)
    if (purchase.tipo_movimento === 'compra' && existingFinancial?.payable.tipo_lancamento === 'efetivo') {
      return mapConfirmPurchaseResult(purchase, existingFinancial.payable, existingFinancial.installments)
    }

    const updatedPurchaseResult = await client.query(
      `UPDATE erp.compras
       SET status = 'recebida',
           tipo_movimento = 'compra',
           confirmada_em = COALESCE(confirmada_em, now()),
           recebida_em = COALESCE(recebida_em, now()),
           versao = versao + 1,
           atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING
         id,
         tenant_id,
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
      [input.tenantId, purchase.id, input.actorId],
    )
    const updatedPurchase = updatedPurchaseResult.rows[0] as PurchaseRow

    if (!updatedPurchase.gera_financeiro) {
      await client.query(
        `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
         VALUES ($1, $2, 'efetivada_sem_financeiro', '{}'::jsonb, $3)`,
        [input.tenantId, updatedPurchase.id, input.actorId],
      )
      return mapConfirmPurchaseResult(updatedPurchase, null, [])
    }
    const financial = await createOrUpdatePurchasePayable(client, updatedPurchase, input.actorId, 'efetivo')
    if (!financial) return mapConfirmPurchaseResult(updatedPurchase, null, [])
    await client.query(
      `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'efetivada', $3::jsonb, $4)`,
      [input.tenantId, updatedPurchase.id, JSON.stringify({ conta_pagar_id: financial.payable.id }), input.actorId],
    )
    return mapConfirmPurchaseResult(updatedPurchase, financial.payable, financial.installments)
  })
}

export async function cancelErpPurchase(input: IdActionInput) {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT id, tenant_id, status
       FROM erp.compras
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as { id: string | number; status: string } | undefined
    if (!purchase) throw new Error('Compra nao encontrada.')
    if (purchase.status === 'cancelada') return { id: String(purchase.id), status: 'cancelada' }

    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE tenant_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    if (invoiceResult.rows[0]) throw new Error('Desvincule ou cancele a nota fiscal antes de cancelar a compra.')

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.tenant_id = pagamentos.tenant_id
        AND parcelas.id = pagamentos.conta_pagar_parcela_id
       JOIN erp.contas_pagar AS contas
         ON contas.tenant_id = parcelas.tenant_id
        AND contas.id = parcelas.conta_pagar_id
       WHERE pagamentos.tenant_id = $1
         AND contas.compra_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    if (paymentResult.rows[0]) throw new Error('Compra com pagamento nao pode ser cancelada sem estorno.')

    await client.query(
      `UPDATE erp.contas_pagar_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_pagar AS contas
       WHERE parcelas.tenant_id = contas.tenant_id
         AND parcelas.conta_pagar_id = contas.id
         AND contas.tenant_id = $1
         AND contas.compra_id = $2
         AND parcelas.excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `UPDATE erp.contas_pagar
       SET status = 'cancelado', cancelado_em = COALESCE(cancelado_em, now()), atualizado_por = $3
       WHERE tenant_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    const updated = await client.query(
      `UPDATE erp.compras
       SET status = 'cancelada', tipo_movimento = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()), versao = versao + 1, atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, status`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'cancelada', '{}'::jsonb, $3)`,
      [input.tenantId, purchase.id, input.actorId],
    )
    return updated.rows[0]
  })
}

function paymentAdjustment(value: unknown) {
  return money(value)
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
  const netValue = Number((amount + juros + multa - desconto - taxa).toFixed(2))
  if (netValue < 0) throw new Error('Desconto e taxa nao podem superar o valor recebido.')
  return netValue
}

function payablePaymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  const netValue = Number((amount + juros + multa - desconto + taxa).toFixed(2))
  if (netValue < 0) throw new Error('O desconto nao pode superar o valor do pagamento.')
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
       SELECT COALESCE(sum(valor), 0) AS paid
       FROM erp.pagamentos
       WHERE tenant_id = $1
         AND conta_receber_parcela_id = $2
         AND estorno_de_pagamento_id IS NULL
         AND estornado_em IS NULL
         AND excluido_em IS NULL
     )
     UPDATE erp.contas_receber_parcelas AS parcelas
     SET
       valor_pago = totals.paid,
       data_pagamento = CASE
         WHEN totals.paid >= parcelas.valor THEN COALESCE($4::date, parcelas.data_pagamento, CURRENT_DATE)
         ELSE NULL
       END,
       status = CASE
         WHEN totals.paid >= parcelas.valor THEN 'pago'
         WHEN parcelas.data_vencimento < CURRENT_DATE THEN 'vencido'
         WHEN totals.paid > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.tenant_id = $1
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
       SELECT COALESCE(sum(valor), 0) AS paid
       FROM erp.pagamentos
       WHERE tenant_id = $1
         AND conta_pagar_parcela_id = $2
         AND estorno_de_pagamento_id IS NULL
         AND estornado_em IS NULL
         AND excluido_em IS NULL
     )
     UPDATE erp.contas_pagar_parcelas AS parcelas
     SET
       valor_pago = totals.paid,
       data_pagamento = CASE
         WHEN totals.paid >= parcelas.valor THEN COALESCE($4::date, parcelas.data_pagamento, CURRENT_DATE)
         ELSE NULL
       END,
       status = CASE
         WHEN totals.paid >= parcelas.valor THEN 'pago'
         WHEN parcelas.data_vencimento < CURRENT_DATE THEN 'vencido'
         WHEN totals.paid > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.tenant_id = $1
       AND parcelas.id = $2
     RETURNING parcelas.id::text, parcelas.conta_pagar_id::text, parcelas.valor, parcelas.valor_pago, parcelas.status`,
    [tenantId, installmentId, actorId, paymentDate || null],
  )
  return result.rows[0] as Record<string, unknown>
}

export async function settleReceivableInstallment(input: SettleInstallmentInput) {
  return withTransaction(async (client) => {
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_receber_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas
         ON contas.tenant_id = parcelas.tenant_id
        AND contas.id = parcelas.conta_receber_id
       WHERE parcelas.tenant_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new Error('Parcela a receber nao encontrada.')
    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
    if (idempotencyKey) {
      const existingPaymentResult = await client.query(
        `SELECT id::text, tipo, conta_receber_parcela_id::text, valor, valor_liquido
         FROM erp.pagamentos
         WHERE tenant_id = $1
           AND chave_idempotencia = $2
           AND excluido_em IS NULL
         LIMIT 1`,
        [input.tenantId, idempotencyKey],
      )
      const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
      if (existingPayment) {
        if (existingPayment.tipo !== 'receber' || String(existingPayment.conta_receber_parcela_id) !== String(installment.id)) {
          throw new Error('Chave de idempotencia ja utilizada em outra baixa.')
        }
        return { payment: existingPayment, installment }
      }
    }
    if (installment.status === 'cancelado') throw new Error('Parcela cancelada nao pode ser baixada.')
    if (installment.status === 'pago') throw new Error('Parcela ja esta paga.')

    const total = money(installment.valor)
    const paid = money(installment.valor_pago)
    const remaining = Number((total - paid).toFixed(2))
    const amount = positiveMoney(input.values.valor) ?? remaining
    if (amount <= 0 || amount > remaining) throw new Error('Valor da baixa invalido.')

    const financialAccountId = await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    const paymentDate = dateText(input.values.data_pagamento) || new Date().toISOString().slice(0, 10)
    const netValue = paymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         tenant_id,
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
         atualizado_por
       )
       VALUES ($1, 'receber', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
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
      ],
    )

    await client.query(
      `UPDATE erp.contas_receber_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE tenant_id = $1
         AND id = $2`,
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

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
    }
  })
}

export async function settlePayableInstallment(input: SettleInstallmentInput) {
  return withTransaction(async (client) => {
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_pagar_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas
         ON contas.tenant_id = parcelas.tenant_id
        AND contas.id = parcelas.conta_pagar_id
       WHERE parcelas.tenant_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new Error('Parcela a pagar nao encontrada.')
    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
    if (idempotencyKey) {
      const existingPaymentResult = await client.query(
        `SELECT id::text, tipo, conta_pagar_parcela_id::text, valor, valor_liquido
         FROM erp.pagamentos
         WHERE tenant_id = $1
           AND chave_idempotencia = $2
           AND excluido_em IS NULL
         LIMIT 1`,
        [input.tenantId, idempotencyKey],
      )
      const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
      if (existingPayment) {
        if (existingPayment.tipo !== 'pagar' || String(existingPayment.conta_pagar_parcela_id) !== String(installment.id)) {
          throw new Error('Chave de idempotencia ja utilizada em outra baixa.')
        }
        return { payment: existingPayment, installment }
      }
    }
    if (installment.status === 'cancelado') throw new Error('Parcela cancelada nao pode ser baixada.')
    if (installment.status === 'pago') throw new Error('Parcela ja esta paga.')

    const total = money(installment.valor)
    const paid = money(installment.valor_pago)
    const remaining = Number((total - paid).toFixed(2))
    const amount = positiveMoney(input.values.valor) ?? remaining
    if (amount <= 0 || amount > remaining) throw new Error('Valor da baixa invalido.')

    const financialAccountId = await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    const paymentDate = dateText(input.values.data_pagamento) || new Date().toISOString().slice(0, 10)
    const netValue = payablePaymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         tenant_id,
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
         atualizado_por
       )
       VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
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
      ],
    )

    await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE tenant_id = $1
         AND id = $2`,
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
         estornado_em,
         estorno_de_pagamento_id
       FROM erp.pagamentos
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
    if (!payment) throw new Error('Pagamento nao encontrado.')
    if (payment.estorno_de_pagamento_id) throw new Error('Um estorno nao pode ser estornado diretamente.')

    if (payment.estornado_em) {
      const existingReversal = await client.query(
        `SELECT id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text
         FROM erp.pagamentos
         WHERE tenant_id = $1
           AND estorno_de_pagamento_id = $2
           AND excluido_em IS NULL
         ORDER BY id ASC
         LIMIT 1`,
        [input.tenantId, payment.id],
      )
      return { payment, reversal: existingReversal.rows[0] || null }
    }

    const receivableInstallmentId = payment.conta_receber_parcela_id
    const payableInstallmentId = payment.conta_pagar_parcela_id
    const installmentTable = payment.tipo === 'receber' ? 'erp.contas_receber_parcelas' : 'erp.contas_pagar_parcelas'
    const installmentId = payment.tipo === 'receber' ? receivableInstallmentId : payableInstallmentId
    await client.query(
      `SELECT id FROM ${installmentTable} WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
      [input.tenantId, installmentId],
    )

    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey) || `estorno-pagamento-${payment.id}`
    const reason = optionalText(input.reason)
    const reversalResult = await client.query(
      `INSERT INTO erp.pagamentos (
         tenant_id,
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
       VALUES ($1, $2, 'estorno', $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
       RETURNING id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text`,
      [
        input.tenantId,
        payment.tipo,
        idempotencyKey,
        receivableInstallmentId,
        payableInstallmentId,
        payment.conta_financeira_id,
        payment.metodo_pagamento_id,
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

    await client.query(
      `UPDATE erp.pagamentos
       SET estornado_em = now(), motivo_estorno = $3, atualizado_por = $4
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, payment.id, reason, input.actorId],
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

    return { payment: { ...payment, estornado_em: new Date().toISOString() }, reversal: reversalResult.rows[0] }
  })
}

async function createEntityRoleRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome')
  const isCustomer = input.entityId === 'clientes'
  const category = optionalText(input.values.categoria)
  const result = await client.query(
    `INSERT INTO erp.entidades (
       tenant_id,
       tipo_pessoa,
       nome,
       documento,
       email,
       telefone,
       cidade,
       eh_cliente,
       eh_fornecedor,
       ativo,
       metadata,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $12)
     RETURNING id`,
    [
      input.tenantId,
      normalizePersonType(input.values.tipo),
      text(input.values.nome),
      optionalText(input.values.documento),
      optionalText(input.values.email),
      optionalText(input.values.telefone),
      optionalText(input.values.cidade),
      isCustomer,
      !isCustomer,
      activeFromStatus(input.values.status),
      JSON.stringify(category ? { categoria: category } : {}),
      input.actorId,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function createProductRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome do produto')
  const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'produto')
  const result = await client.query(
    `INSERT INTO erp.produtos (
       tenant_id,
       nome,
       sku,
       codigo,
       preco_venda,
       categoria_id,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $7)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      optionalText(input.values.sku),
      money(input.values.preco),
      categoryId,
      activeFromStatus(input.values.status),
      input.actorId,
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function createServiceRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome do servico')
  const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'servico')
  const result = await client.query(
    `INSERT INTO erp.servicos (
       tenant_id,
       nome,
       codigo,
       descricao,
       preco,
       custo,
       categoria_id,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
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
    ],
  )
  return { id: String(result.rows[0]?.id) }
}

async function createFinancialAccountRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da conta financeira')
  const existingResult = await client.query(
    `SELECT id FROM erp.contas_financeiras WHERE tenant_id = $1 AND ativo = true AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId],
  )
  const shouldBeDefault = booleanValue(input.values.padrao) || !existingResult.rows[0]
  if (shouldBeDefault) {
    await client.query(
      `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2 WHERE tenant_id = $1 AND padrao = true`,
      [input.tenantId, input.actorId],
    )
  }
  const result = await client.query(
    `INSERT INTO erp.contas_financeiras (
       tenant_id,
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

async function createSaleRecord(client: SQLClient, input: CreateInput) {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:venda:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT id FROM erp.vendas
       WHERE tenant_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) return { id: String(existing.rows[0].id) }
  }

  const customerId = numericId(input.values.cliente_id, 'Cliente')
  const saleDate = dateText(input.values.data_venda) || new Date().toISOString().slice(0, 10)
  const number = optionalText(input.values.numero) || `VEN-${Date.now()}`

  const customerResult = await client.query(
    `SELECT id
     FROM erp.entidades
     WHERE tenant_id = $1
       AND id = $2
       AND eh_cliente = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, customerId],
  )
  if (!customerResult.rows[0]) throw new Error('Cliente nao encontrado.')

  const rawItems = Array.isArray(input.values.itens) && input.values.itens.length > 0
    ? input.values.itens as Record<string, unknown>[]
    : [{
        tipo: 'produto',
        item_id: input.values.produto_id,
        descricao: input.values.descricao,
        quantidade: input.values.quantidade,
        valor_unitario: input.values.valor_unitario,
      }]
  if (rawItems.length > 100) throw new Error('A venda aceita no maximo 100 itens.')

  const items: Array<{
    tipo: 'produto' | 'servico'
    itemId: number
    descricao: string
    quantidade: number
    valorUnitario: number
    desconto: number
    total: number
    custo: number
  }> = []
  for (const [index, raw] of rawItems.entries()) {
    const tipo = text(raw.tipo || raw.kind) === 'servico' ? 'servico' : 'produto'
    const itemId = numericId(raw.item_id || raw.produto_id || raw.servico_id, `Item ${index + 1}`)
    const quantity = Number(raw.quantidade || 1)
    const unitValue = positiveMoney(raw.valor_unitario)
    const discount = money(raw.desconto)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Quantidade do item ${index + 1} invalida.`)
    if (!unitValue) throw new Error(`Valor unitario do item ${index + 1} precisa ser maior que zero.`)
    const catalog = await client.query(
      tipo === 'servico'
        ? `SELECT nome, custo FROM erp.servicos WHERE tenant_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`
        : `SELECT nome, custo FROM erp.produtos WHERE tenant_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`,
      [input.tenantId, itemId],
    )
    if (!catalog.rows[0]) throw new Error(`Item ${index + 1} nao encontrado.`)
    const gross = Number((quantity * unitValue).toFixed(2))
    if (discount > gross) throw new Error(`Desconto do item ${index + 1} supera o valor bruto.`)
    items.push({
      tipo,
      itemId,
      descricao: optionalText(raw.descricao) || String(catalog.rows[0].nome),
      quantidade: quantity,
      valorUnitario: unitValue,
      desconto: discount,
      total: Number((gross - discount).toFixed(2)),
      custo: money(catalog.rows[0].custo),
    })
  }

  const subtotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2))
  const discount = money(input.values.desconto)
  const freight = money(input.values.frete)
  const total = Number((subtotal - discount + freight).toFixed(2))
  if (total <= 0) throw new Error('Total da venda precisa ser maior que zero.')

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas as Record<string, unknown>[]
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dateText(input.values.data_vencimento) || saleDate, valor: total }]
  if (rawInstallments.length > 48) throw new Error('A condicao de pagamento aceita no maximo 48 parcelas.')
  const installments = rawInstallments.map((raw, index) => {
    const value = positiveMoney(raw.valor)
    const dueDate = dateText(raw.data_vencimento)
    if (!value || !dueDate) throw new Error(`Parcela ${index + 1} invalida.`)
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
  if (installmentTotal !== total) throw new Error('A soma das parcelas precisa ser igual ao total da venda.')

  const saleResult = await client.query(
    `INSERT INTO erp.vendas (
       tenant_id,
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
       subtotal,
       desconto,
       frete,
       total,
       condicao_pagamento,
       observacoes,
       observacoes_pagamento,
       cobranca_emails,
       cobranca_whatsapp,
       chave_idempotencia,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, 'rascunho', 'em_andamento', $6, $7, $8, $9,
       $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $20)
     RETURNING id`,
    [
      input.tenantId,
      customerId,
      number,
      saleDate,
      dateText(input.values.data_competencia) || saleDate,
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
      idempotencyKey,
      input.actorId,
    ],
  )
  const saleId = Number(saleResult.rows[0]?.id)

  for (const installment of installments) {
    await client.query(
      `INSERT INTO erp.vendas_recebimentos_previstos (
         tenant_id, venda_id, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id, metodo_pagamento_id, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [input.tenantId, saleId, installment.numero, installment.descricao, installment.vencimento,
        installment.valor, installment.contaFinanceiraId, installment.metodoPagamentoId, input.actorId],
    )
  }

  for (const item of items) {
    await client.query(
      `INSERT INTO erp.vendas_itens (
         tenant_id, venda_id, produto_id, servico_id, descricao, quantidade,
         valor_unitario, custo_unitario, desconto, total, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
      [input.tenantId, saleId, item.tipo === 'produto' ? item.itemId : null,
        item.tipo === 'servico' ? item.itemId : null, item.descricao, item.quantidade,
        item.valorUnitario, item.custo, item.desconto, item.total, input.actorId],
    )
  }

  if (!input.temporary) {
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_novo, versao, dados, criado_por)
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
       WHERE tenant_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
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
  if (total < 0) throw new Error('Descontos e retencoes nao podem superar o valor da compra.')
  const purchaseDate = dateText(input.values.data_compra) || new Date().toISOString().slice(0, 10)
  const dueDate = dateText(input.values.data_vencimento) || purchaseDate
  const number = optionalText(input.values.numero) || `COM-${Date.now()}`
  const generateFinancial = booleanValue(input.values.gera_financeiro ?? true)
  const movement = purchaseMovement(input.values.tipo_movimento)
  const type = purchaseType(input.values.tipo_compra)
  const status = purchaseStatusForMovement(movement)

  const supplierResult = await client.query(
    `SELECT id, nome, documento
     FROM erp.entidades
     WHERE tenant_id = $1
       AND id = $2
       AND eh_fornecedor = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, supplierId],
  )
  if (!supplierResult.rows[0]) throw new Error('Fornecedor nao encontrado.')
  const supplier = supplierResult.rows[0]

  const rawInstallments = Array.isArray(input.values.parcelas)
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dueDate, valor: total }]
  const condition = { parcelas: rawInstallments }

  const purchaseResult = await client.query(
    `INSERT INTO erp.compras (
       tenant_id,
       fornecedor_id,
       numero,
       data_compra,
       data_competencia,
       data_prevista_entrega,
       status,
       tipo_compra,
       tipo_movimento,
       natureza_operacao_id,
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
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'manual', $11, $12,
       $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
       $25::jsonb, $26, $27, $28, $29, $29
     )
     RETURNING id, tenant_id, fornecedor_id, numero, data_compra, data_competencia,
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
         tenant_id, compra_id, produto_id, servico_id, descricao, detalhes, unidade,
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
         tenant_id, compra_id, numero_parcela, descricao, data_vencimento, valor,
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
      `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'criada', $3::jsonb, $4)`,
      [input.tenantId, purchaseId, JSON.stringify({ tipo_movimento: movement }), input.actorId],
    )
  }

  if (generateFinancial && (movement === 'pedido_compra' || movement === 'pedido_recorrente')) {
    await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'previsao')
  } else if (generateFinancial && movement === 'compra' && total > 0) {
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
       WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Venda nao encontrada.')
    if (current.status !== 'rascunho') throw new Error('Somente vendas em rascunho podem ser editadas.')
    if (Number(current.versao) !== input.expectedVersion) throw new Error('CONFLITO_VERSAO: esta venda foi alterada por outra pessoa.')

    const staged = await createSaleRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos', temporary: true,
      values: { ...input.values, numero: `TMP-VEN-${id}-${Date.now()}` },
    })
    const stagedId = numericId(staged.id, 'Venda temporaria')
    await client.query(`DELETE FROM erp.vendas_itens WHERE tenant_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.vendas_recebimentos_previstos WHERE tenant_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.vendas_itens SET venda_id = $3 WHERE tenant_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.vendas_recebimentos_previstos SET venda_id = $3 WHERE tenant_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.vendas AS target SET
         cliente_id = source.cliente_id, numero = $4, data_venda = source.data_venda,
         data_competencia = source.data_competencia, categoria_id = source.categoria_id,
         centro_custo_id = source.centro_custo_id, conta_financeira_id = source.conta_financeira_id,
         metodo_pagamento_id = source.metodo_pagamento_id, subtotal = source.subtotal,
         desconto = source.desconto, frete = source.frete, total = source.total,
         condicao_pagamento = source.condicao_pagamento, observacoes = source.observacoes,
         observacoes_pagamento = source.observacoes_pagamento, cobranca_emails = source.cobranca_emails,
         cobranca_whatsapp = source.cobranca_whatsapp, versao = target.versao + 1, atualizado_por = $5
       FROM erp.vendas AS source
       WHERE target.tenant_id = $1 AND target.id = $2 AND source.tenant_id = target.tenant_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) throw new Error('CONFLITO_VERSAO: esta venda foi alterada por outra pessoa.')
    await client.query(`DELETE FROM erp.vendas WHERE tenant_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
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
       WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new Error('Compra nao encontrada.')
    if (current.status !== 'rascunho' || current.tipo_movimento !== 'cotacao') {
      throw new Error('Somente cotacoes em rascunho podem ser editadas.')
    }
    if (Number(current.versao) !== input.expectedVersion) throw new Error('CONFLITO_VERSAO: esta compra foi alterada por outra pessoa.')

    const staged = await createPurchaseRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos-compra', temporary: true,
      values: { ...input.values, numero: `TMP-COM-${id}-${Date.now()}`, tipo_movimento: 'cotacao' },
    })
    const stagedId = numericId(staged.id, 'Compra temporaria')
    await client.query(`DELETE FROM erp.compras_itens WHERE tenant_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.compras_parcelas_previstas WHERE tenant_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.compras_itens SET compra_id = $3 WHERE tenant_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.compras_parcelas_previstas SET compra_id = $3 WHERE tenant_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.compras AS target SET
         fornecedor_id = source.fornecedor_id, numero = $4, data_compra = source.data_compra,
         data_competencia = source.data_competencia, data_prevista_entrega = source.data_prevista_entrega,
         tipo_compra = source.tipo_compra, natureza_operacao_id = source.natureza_operacao_id,
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
       WHERE target.tenant_id = $1 AND target.id = $2 AND source.tenant_id = target.tenant_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) throw new Error('CONFLITO_VERSAO: esta compra foi alterada por outra pessoa.')
    await client.query(`DELETE FROM erp.compras WHERE tenant_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'atualizada', $3::jsonb, $4)`,
      [input.tenantId, id, JSON.stringify({ versao: updated.rows[0].versao, numero: updated.rows[0].numero, total: updated.rows[0].total }), input.actorId],
    )
  })
  return getErpPurchaseDetails(input.tenantId, id)
}

function shiftDate(value: string, frequency: string, interval: number, occurrence: number) {
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
         ON parcelas.tenant_id = contas.tenant_id AND parcelas.conta_pagar_id = contas.id AND parcelas.excluido_em IS NULL
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = contas.tenant_id AND entidades.id = contas.fornecedor_id
       WHERE contas.tenant_id = $1 AND contas.chave_idempotencia = $2 AND contas.excluido_em IS NULL
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
  if (!description) throw new Error('Descricao e obrigatoria.')
  const total = positiveMoney(input.values.valor_total ?? input.values.valor)
  if (!total) throw new Error('Valor precisa ser maior que zero.')
  const categoryId = numericId(input.values.categoria_id, 'Categoria')
  const competence = dateText(input.values.data_competencia) || new Date().toISOString().slice(0, 10)
  const issueDate = dateText(input.values.data_emissao) || competence
  const firstDueDate = dateText(input.values.data_vencimento) || competence

  const supplierResult = await client.query(
    `SELECT id, nome, documento FROM erp.entidades
     WHERE tenant_id = $1 AND id = $2 AND eh_fornecedor = true AND excluido_em IS NULL`,
    [input.tenantId, supplierId],
  )
  const supplier = supplierResult.rows[0]
  if (!supplier) throw new Error('Fornecedor nao encontrado.')

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: firstDueDate, valor: total }]
  if (rawInstallments.length > 48) throw new Error('A condicao de pagamento aceita no maximo 48 parcelas.')
  const installments = rawInstallments.map((raw, index) => {
    const row = raw as Record<string, unknown>
    const value = positiveMoney(row.valor)
    const dueDate = dateText(row.data_vencimento)
    if (!value || !dueDate) throw new Error(`Parcela ${index + 1} invalida.`)
    return {
      numero: Number(row.numero_parcela || index + 1),
      descricao: optionalText(row.descricao) || `Parcela ${index + 1}`,
      vencimento: dueDate,
      valor: value,
      observacoes: optionalText(row.observacoes),
    }
  })
  const installmentTotal = Number(installments.reduce((sum, installment) => sum + installment.valor, 0).toFixed(2))
  if (installmentTotal !== Number(total.toFixed(2))) throw new Error('A soma das parcelas precisa ser igual ao total da despesa.')

  const recurrence = jsonObject(input.values.recorrencia) as Record<string, unknown>
  const repeat = booleanValue(input.values.repetir) || Object.keys(recurrence).length > 0
  const frequency = ['dia', 'semana', 'mes', 'ano'].includes(text(recurrence.frequencia)) ? text(recurrence.frequencia) : 'mes'
  const interval = Math.max(1, Number(recurrence.intervalo || 1))
  const occurrenceCount = repeat ? Math.min(366, Math.max(1, Number(recurrence.quantidade_ocorrencias || 1))) : 1
  let recurrenceId: number | null = null
  if (repeat) {
    const recurrenceResult = await client.query(
      `INSERT INTO erp.recorrencias_financeiras (
         tenant_id, tipo, intervalo, frequencia, inicio_em, termino_tipo,
         termino_em, quantidade_ocorrencias, proxima_competencia, gerado_ate,
         criado_por, atualizado_por, metadata
       ) VALUES ($1, 'pagar', $2, $3, $4, 'ocorrencias', $5, $6, $7, $4, $8, $8, $9::jsonb)
       RETURNING id`,
      [input.tenantId, interval, frequency, competence, dateText(recurrence.termino_em), occurrenceCount,
        shiftDate(competence, frequency, interval, 1), input.actorId,
        JSON.stringify({ descricao: description, modelo: { ...input.values, repetir: false, recorrencia: null } })],
    )
    recurrenceId = Number(recurrenceResult.rows[0]?.id)
  }

  let firstInstallmentId = ''
  // Recorrencias sao materializadas uma competencia por vez pelo processador.
  for (let occurrence = 0; occurrence < 1; occurrence += 1) {
    const occurrenceCompetence = shiftDate(competence, frequency, interval, occurrence)
    const payableResult = await client.query(
      `INSERT INTO erp.contas_pagar (
         tenant_id, fornecedor_id, descricao, numero_documento, data_competencia,
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
           tenant_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
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
      if (rateioTotal !== Number(total.toFixed(2))) throw new Error('O rateio precisa distribuir o valor total da despesa.')
      for (const raw of rateios) {
        const rateio = raw as Record<string, unknown>
        await client.query(
          `INSERT INTO erp.rateios_financeiros (
             tenant_id, tipo, conta_pagar_id, categoria_id, centro_custo_id, valor,
             percentual, observacoes, criado_por, atualizado_por
           ) VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $8)`,
          [input.tenantId, payableId, optionalNumericId(rateio.categoria_id), optionalNumericId(rateio.centro_custo_id), money(rateio.valor), rateio.percentual == null ? null : Number(rateio.percentual), optionalText(rateio.observacoes), input.actorId],
        )
      }
    }
  }

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
  const throughDate = dateText(input.throughDate) || new Date().toISOString().slice(0, 10)
  const limit = Math.min(100, Math.max(1, Math.floor(Number(input.limit || 50))))
  return withTransaction(async (client) => {
    const recurrenceResult = await client.query(
      `SELECT * FROM erp.recorrencias_financeiras
       WHERE tenant_id = $1 AND tipo = 'pagar' AND ativa = true
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
      if (Object.keys(model).length === 0) {
        await client.query(
          `UPDATE erp.recorrencias_financeiras SET ativa = false, encerrada_em = now(),
             metadata = metadata || '{"erro":"modelo_ausente"}'::jsonb, atualizado_por = $3
           WHERE tenant_id = $1 AND id = $2`,
          [input.tenantId, recurrence.id, input.actorId],
        )
        continue
      }

      const countResult = await client.query(
        `SELECT count(*)::int AS total FROM erp.contas_pagar
         WHERE tenant_id = $1 AND recorrencia_financeira_id = $2 AND excluido_em IS NULL`,
        [input.tenantId, recurrence.id],
      )
      let occurrence = Number(countResult.rows[0]?.total || 0)
      let next = dateText(recurrence.proxima_competencia)
      let generatedForRecurrence = 0
      const maxOccurrences = Number(recurrence.quantidade_ocorrencias || 366)
      const frequency = text(recurrence.frequencia)
      const interval = Number(recurrence.intervalo || 1)
      const start = dateText(recurrence.inicio_em) || throughDate

      while (next && next <= throughDate && occurrence < maxOccurrences && generated < limit) {
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
        const record = await createManualPayableRecord(client, {
          tenantId: input.tenantId, actorId: input.actorId, entityId: 'contas-a-pagar', values, idempotencyKey,
        })
        await client.query(
          `UPDATE erp.contas_pagar AS contas SET recorrencia_financeira_id = $3,
             origem = 'recorrencia', atualizado_por = $4
           FROM erp.contas_pagar_parcelas AS parcelas
           WHERE contas.tenant_id = $1 AND parcelas.tenant_id = contas.tenant_id
             AND parcelas.conta_pagar_id = contas.id AND parcelas.id = $2`,
          [input.tenantId, numericId(record.id, 'Parcela'), recurrence.id, input.actorId],
        )
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
         WHERE tenant_id = $1 AND id = $2`,
        [input.tenantId, recurrence.id, ended ? null : next, generatedForRecurrence > 0 ? shiftDate(start, frequency, interval, occurrence - 1) : recurrence.gerado_ate,
          !ended, input.actorId],
      )
      processed.push({ id: String(recurrence.id), generated: generatedForRecurrence, next: ended ? null : next })
    }
    return { generated, throughDate, processed }
  })
}

async function createCategoryRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da categoria')
  const categoryType = ['receita', 'despesa', 'produto', 'servico', 'geral'].includes(text(input.values.tipo))
    ? text(input.values.tipo)
    : 'geral'
  const result = await client.query(
    `INSERT INTO erp.categorias (
       tenant_id,
       nome,
       tipo,
       ativo,
       metadata,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $6)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      categoryType,
      activeFromStatus(input.values.status),
      JSON.stringify({ descricao: optionalText(input.values.descricao) }),
      input.actorId,
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
  if (!created) throw new Error('Registro criado, mas nao foi possivel recarrega-lo.')
  return created
}
