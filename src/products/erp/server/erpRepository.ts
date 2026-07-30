import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

type ListInput = {
  tenantId: number
  entityId: ErpConnectedModuleId
  query?: string
  filters?: Record<string, string>
}

type CreateInput = {
  tenantId: number
  actorId: number
  entityId: ErpConnectedModuleId
  values: Record<string, unknown>
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
  values: Record<string, unknown>
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
  total: string | number | null
  condicao_pagamento: unknown
}

type PurchaseRow = {
  id: string | number
  tenant_id: string | number
  fornecedor_id: string | number | null
  numero: string | null
  data_compra: string | Date | null
  data_competencia: string | Date | null
  status: string
  categoria_id: string | number | null
  centro_custo_id: string | number | null
  conta_financeira_id: string | number | null
  metodo_pagamento_id: string | number | null
  total: string | number | null
  condicao_pagamento: unknown
  gera_financeiro: boolean
}

type ReceivableRow = {
  id: string | number
  status: string
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

function numericId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} invalido.`)
  return parsed
}

async function ensureFinancialAccountId(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  actorId: number,
  value: unknown,
) {
  const requested = Number(value || 0)
  if (Number.isInteger(requested) && requested > 0) return requested

  const existing = await client.query(
    `SELECT id
     FROM erp.contas_financeiras
     WHERE tenant_id = $1
       AND excluido_em IS NULL
     ORDER BY id ASC
     LIMIT 1`,
    [tenantId],
  )
  const existingId = existing.rows[0]?.id
  if (existingId) return Number(existingId)

  const created = await client.query(
    `INSERT INTO erp.contas_financeiras (tenant_id, nome, tipo, criado_por, atualizado_por)
     VALUES ($1, 'Caixa', 'caixa', $2, $2)
     RETURNING id`,
    [tenantId, actorId],
  )
  return Number(created.rows[0]?.id)
}

async function updateReceivableStatus(client: Pick<SQLClient, 'query'>, tenantId: number, receivableId: string | number) {
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
       WHEN totals.paid > 0 THEN 'parcial'
       ELSE 'aberto'
     END
     FROM totals
     WHERE contas_receber.tenant_id = $1
       AND contas_receber.id = $2`,
    [tenantId, receivableId],
  )
}

async function updatePayableStatus(client: Pick<SQLClient, 'query'>, tenantId: number, payableId: string | number) {
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
       WHEN totals.paid > 0 THEN 'parcial'
       ELSE 'aberto'
     END
     FROM totals
     WHERE contas_pagar.tenant_id = $1
       AND contas_pagar.id = $2`,
    [tenantId, payableId],
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
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, normalized],
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

function normalizePaymentConditionInstallments(sale: SaleRow): NormalizedInstallment[] {
  const paymentCondition = sale.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  const normalized = installments
    .map((installment, index): NormalizedInstallment | null => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      if (!value || !dueDate) return null

      return {
        numeroParcela: Number(item.numero_parcela || index + 1),
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
      }
    })
    .filter((installment): installment is NormalizedInstallment => Boolean(installment))

  if (normalized.length > 0) return normalized

  return [{
    numeroParcela: 1,
    descricao: 'Parcela 1',
    dataVencimento: dateText(sale.data_venda) || new Date().toISOString().slice(0, 10),
    valor: money(sale.total),
  }]
}

function normalizePurchaseInstallments(purchase: PurchaseRow): NormalizedInstallment[] {
  const paymentCondition = purchase.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  const normalized = installments
    .map((installment, index): NormalizedInstallment | null => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      if (!value || !dueDate) return null

      return {
        numeroParcela: Number(item.numero_parcela || index + 1),
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
      }
    })
    .filter((installment): installment is NormalizedInstallment => Boolean(installment))

  if (normalized.length > 0) return normalized

  return [{
    numeroParcela: 1,
    descricao: 'Parcela 1',
    dataVencimento: dateText(purchase.data_compra) || new Date().toISOString().slice(0, 10),
    valor: money(purchase.total),
  }]
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

async function fetchPayableForPurchase(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  purchaseId: string | number,
) {
  const payableResult = await client.query(
    `SELECT id::text, status
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
         ativo,
         COALESCE(metadata ->> 'categoria', '') AS categoria,
         concat_ws(' ', nome, documento, email, cidade, COALESCE(metadata ->> 'categoria', '')) AS searchable
       FROM erp.entidades
       WHERE tenant_id = $1
         AND ${roleColumn} = true
         AND excluido_em IS NULL
     )
     SELECT id, nome, documento, email, cidade, tipo_pessoa, ativo, categoria
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${appendTipoFilter(params, input.filters)}
     ORDER BY nome ASC
     LIMIT 200`,
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
    status: row.ativo ? 'ativo' : 'inativo',
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
     SELECT id, nome, sku, preco_venda, categoria, ativo
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${categorySql}
     ORDER BY nome ASC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    sku: String(row.sku ?? ''),
    categoria: String(row.categoria ?? ''),
    preco: Number(row.preco_venda ?? 0),
    status: row.ativo ? 'ativo' : 'pausado',
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
     SELECT id, nome, codigo, preco, custo, categoria, ativo
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}
     ORDER BY nome ASC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    codigo: String(row.codigo ?? ''),
    categoria: String(row.categoria ?? ''),
    preco: Number(row.preco ?? 0),
    custo: Number(row.custo ?? 0),
    status: row.ativo ? 'ativo' : 'pausado',
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
     SELECT id, nome, descricao, itens, ativo
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY nome ASC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    descricao: String(row.descricao ?? ''),
    itens: Number(row.itens ?? 0),
    status: row.ativo ? 'ativo' : 'inativo',
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
     SELECT id, numero, data_venda, status, total, cliente
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_venda DESC, id DESC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    cliente: String(row.cliente ?? ''),
    data: dateText(row.data_venda) || '',
    total: Number(row.total ?? 0),
    status: String(row.status ?? ''),
  }))
}

async function listPurchaseRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         compras.id::text,
         compras.numero,
         compras.data_compra,
         compras.status,
         compras.total,
         compras.gera_financeiro,
         entidades.nome AS fornecedor,
         concat_ws(' ', compras.numero, entidades.nome, compras.status) AS searchable
       FROM erp.compras AS compras
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = compras.tenant_id
        AND entidades.id = compras.fornecedor_id
       WHERE compras.tenant_id = $1
         AND compras.excluido_em IS NULL
     )
     SELECT id, numero, data_compra, status, total, gera_financeiro, fornecedor
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_compra DESC, id DESC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    data: dateText(row.data_compra) || '',
    total: Number(row.total ?? 0),
    gera_financeiro: Boolean(row.gera_financeiro),
    status: String(row.status ?? ''),
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
         contas.status,
         entidades.nome AS cliente,
         min(parcelas.data_vencimento) FILTER (WHERE parcelas.status <> 'pago') AS vencimento,
         (array_agg(parcelas.id::text ORDER BY CASE WHEN parcelas.status <> 'pago' THEN 0 ELSE 1 END, parcelas.data_vencimento ASC, parcelas.id ASC)
           FILTER (WHERE parcelas.status <> 'cancelado'))[1] AS parcela_id,
         COALESCE(sum(parcelas.valor_pago), 0) AS valor_pago,
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
     SELECT id, descricao, numero_documento, valor_total, valor_pago, status, cliente, vencimento, parcela_id
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY vencimento ASC NULLS LAST, id DESC
     LIMIT 200`,
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
  }))
}

async function listPayables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text,
         contas.descricao,
         contas.numero_documento,
         contas.valor_total,
         contas.status,
         entidades.nome AS fornecedor,
         min(parcelas.data_vencimento) FILTER (WHERE parcelas.status <> 'pago') AS vencimento,
         (array_agg(parcelas.id::text ORDER BY CASE WHEN parcelas.status <> 'pago' THEN 0 ELSE 1 END, parcelas.data_vencimento ASC, parcelas.id ASC)
           FILTER (WHERE parcelas.status <> 'cancelado'))[1] AS parcela_id,
         COALESCE(sum(parcelas.valor_pago), 0) AS valor_pago,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status) AS searchable
       FROM erp.contas_pagar AS contas
       JOIN erp.entidades AS entidades
         ON entidades.tenant_id = contas.tenant_id
        AND entidades.id = contas.fornecedor_id
       LEFT JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.tenant_id = contas.tenant_id
        AND parcelas.conta_pagar_id = contas.id
        AND parcelas.excluido_em IS NULL
       WHERE contas.tenant_id = $1
         AND contas.excluido_em IS NULL
       GROUP BY contas.id, contas.descricao, contas.numero_documento, contas.valor_total, contas.status, entidades.nome
     )
     SELECT id, descricao, numero_documento, valor_total, valor_pago, status, fornecedor, vencimento, parcela_id
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY vencimento ASC NULLS LAST, id DESC
     LIMIT 200`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    parcela_id: String(row.parcela_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    vencimento: dateText(row.vencimento) || '',
    valor: Number(row.valor_total ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    status: String(row.status ?? ''),
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
         ativo,
         concat_ws(' ', nome, tipo, banco, agencia, conta) AS searchable
       FROM erp.contas_financeiras
       WHERE tenant_id = $1
         AND excluido_em IS NULL
     )
     SELECT id, nome, tipo, banco, agencia, conta, saldo_inicial, ativo
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${typeSql}
     ORDER BY nome ASC
     LIMIT 200`,
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
    status: row.ativo ? 'ativo' : 'inativo',
  }))
}

export async function createErpEntityRecord(input: CreateInput): Promise<ErpEntityRecord> {
  return withTransaction(async (client) => {
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

    if (input.entityId === 'contas-a-receber' || input.entityId === 'contas-a-pagar') {
      throw new Error('Crie contas financeiras a partir de vendas, compras ou baixas.')
    }

    if (input.entityId === 'contas-financeiras') {
      return createFinancialAccountRecord(client, input)
    }

    return createCategoryRecord(client, input)
  })
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
         condicao_pagamento
       FROM erp.vendas
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0] as SaleRow | undefined
    if (!sale) throw new Error('Venda nao encontrada.')

    const existingFinancial = await fetchReceivableForSale(client, input.tenantId, sale.id)
    if (existingFinancial) {
      return mapConfirmSaleResult(sale, existingFinancial.receivable, existingFinancial.installments)
    }

    if (sale.status === 'cancelada') {
      throw new Error('Venda cancelada nao pode ser confirmada.')
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
      `SELECT id
       FROM erp.entidades
       WHERE tenant_id = $1
         AND id = $2
         AND eh_cliente = true
         AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, sale.cliente_id],
    )
    if (!customerResult.rows[0]) {
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
         condicao_pagamento`,
      [input.tenantId, sale.id, input.actorId],
    )
    const updatedSale = updatedSaleResult.rows[0] as SaleRow
    const installments = normalizePaymentConditionInstallments(updatedSale)

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
         categoria_id,
         centro_custo_id,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, 'aberto', $8, $9, $10, $10)
       RETURNING id::text, status`,
      [
        input.tenantId,
        updatedSale.cliente_id,
        updatedSale.id,
        `Venda ${updatedSale.numero || updatedSale.id}`,
        updatedSale.numero,
        dateText(updatedSale.data_competencia),
        money(updatedSale.total),
        updatedSale.categoria_id,
        updatedSale.centro_custo_id,
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
          updatedSale.conta_financeira_id,
          updatedSale.metodo_pagamento_id,
          input.actorId,
        ],
      )
      createdInstallments.push(installmentResult.rows[0] as InstallmentRow)
    }

    return mapConfirmSaleResult(updatedSale, receivable, createdInstallments)
  })
}

export async function cancelErpSale(input: IdActionInput) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, tenant_id, status
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
       SET status = 'cancelado', atualizado_por = $3
       WHERE tenant_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId],
    )
    const updated = await client.query(
      `UPDATE erp.vendas
       SET status = 'cancelada', situacao = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()), atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, status`,
      [input.tenantId, sale.id, input.actorId],
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
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro
       FROM erp.compras
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as PurchaseRow | undefined
    if (!purchase) throw new Error('Compra nao encontrada.')

    const existingFinancial = await fetchPayableForPurchase(client, input.tenantId, purchase.id)
    if (existingFinancial) {
      return mapConfirmPurchaseResult(purchase, existingFinancial.payable, existingFinancial.installments)
    }

    if (purchase.status === 'cancelada') throw new Error('Compra cancelada nao pode ser confirmada.')
    if (purchase.status !== 'rascunho') throw new Error('Compra ja saiu de rascunho e ainda nao possui contas a pagar.')
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

    const updatedPurchaseResult = await client.query(
      `UPDATE erp.compras
       SET status = 'confirmada', confirmada_em = COALESCE(confirmada_em, now()), atualizado_por = $3
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
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro`,
      [input.tenantId, purchase.id, input.actorId],
    )
    const updatedPurchase = updatedPurchaseResult.rows[0] as PurchaseRow

    if (!updatedPurchase.gera_financeiro) {
      return mapConfirmPurchaseResult(updatedPurchase, null, [])
    }

    const payableResult = await client.query(
      `INSERT INTO erp.contas_pagar (
         tenant_id,
         fornecedor_id,
         compra_id,
         descricao,
         numero_documento,
         data_competencia,
         data_emissao,
         valor_total,
         status,
         categoria_id,
         centro_custo_id,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, 'aberto', $8, $9, $10, $10)
       RETURNING id::text, status`,
      [
        input.tenantId,
        updatedPurchase.fornecedor_id,
        updatedPurchase.id,
        `Compra ${updatedPurchase.numero || updatedPurchase.id}`,
        updatedPurchase.numero,
        dateText(updatedPurchase.data_competencia),
        money(updatedPurchase.total),
        updatedPurchase.categoria_id,
        updatedPurchase.centro_custo_id,
        input.actorId,
      ],
    )
    const payable = payableResult.rows[0] as ReceivableRow
    const installments = normalizePurchaseInstallments(updatedPurchase)
    const createdInstallments: InstallmentRow[] = []

    for (const installment of installments) {
      const installmentResult = await client.query(
        `INSERT INTO erp.contas_pagar_parcelas (
           tenant_id,
           conta_pagar_id,
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
          payable.id,
          installment.numeroParcela,
          installment.descricao,
          installment.dataVencimento,
          installment.valor,
          updatedPurchase.conta_financeira_id,
          updatedPurchase.metodo_pagamento_id,
          input.actorId,
        ],
      )
      createdInstallments.push(installmentResult.rows[0] as InstallmentRow)
    }

    return mapConfirmPurchaseResult(updatedPurchase, payable, createdInstallments)
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
       SET status = 'cancelado', atualizado_por = $3
       WHERE tenant_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    const updated = await client.query(
      `UPDATE erp.compras
       SET status = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()), atualizado_por = $3
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, status`,
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

function paymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  return Math.max(0, Number((amount + juros + multa - desconto - taxa).toFixed(2)))
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
       VALUES ($1, 'receber', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
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

    const nextPaid = Number((paid + amount).toFixed(2))
    const updatedInstallmentResult = await client.query(
      `UPDATE erp.contas_receber_parcelas
       SET
         valor_pago = $3,
         data_pagamento = CASE WHEN $3 >= valor THEN $4 ELSE data_pagamento END,
         status = CASE WHEN $3 >= valor THEN 'pago' ELSE 'parcial' END,
         conta_financeira_id = $5,
         metodo_pagamento_id = $6,
         atualizado_por = $7
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, conta_receber_id::text, valor, valor_pago, status`,
      [input.tenantId, installment.id, nextPaid, paymentDate, financialAccountId, methodId, input.actorId],
    )

    const updatedInstallment = updatedInstallmentResult.rows[0] as Record<string, unknown>
    await updateReceivableStatus(client, input.tenantId, String(updatedInstallment.conta_receber_id))

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
       VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
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

    const nextPaid = Number((paid + amount).toFixed(2))
    const updatedInstallmentResult = await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET
         valor_pago = $3,
         data_pagamento = CASE WHEN $3 >= valor THEN $4 ELSE data_pagamento END,
         status = CASE WHEN $3 >= valor THEN 'pago' ELSE 'parcial' END,
         conta_financeira_id = $5,
         metodo_pagamento_id = $6,
         atualizado_por = $7
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text, conta_pagar_id::text, valor, valor_pago, status`,
      [input.tenantId, installment.id, nextPaid, paymentDate, financialAccountId, methodId, input.actorId],
    )

    const updatedInstallment = updatedInstallmentResult.rows[0] as Record<string, unknown>
    await updatePayableStatus(client, input.tenantId, String(updatedInstallment.conta_pagar_id))

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
    }
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
  return fetchCreatedRecord(input.tenantId, input.entityId, result.rows[0]?.id)
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
  return fetchCreatedRecord(input.tenantId, input.entityId, result.rows[0]?.id)
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
  return fetchCreatedRecord(input.tenantId, input.entityId, result.rows[0]?.id)
}

async function createFinancialAccountRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da conta financeira')
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
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
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
      activeFromStatus(input.values.status),
      input.actorId,
    ],
  )
  return fetchCreatedRecord(input.tenantId, input.entityId, result.rows[0]?.id)
}

async function createSaleRecord(client: SQLClient, input: CreateInput) {
  const customerId = numericId(input.values.cliente_id, 'Cliente')
  const productId = numericId(input.values.produto_id, 'Produto')
  const quantity = Number(input.values.quantidade || 1)
  const unitValue = positiveMoney(input.values.valor_unitario)
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantidade invalida.')
  if (!unitValue) throw new Error('Valor unitario precisa ser maior que zero.')

  const total = Number((quantity * unitValue).toFixed(2))
  const saleDate = dateText(input.values.data_venda) || new Date().toISOString().slice(0, 10)
  const dueDate = dateText(input.values.data_vencimento) || saleDate
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

  const saleResult = await client.query(
    `INSERT INTO erp.vendas (
       tenant_id,
       cliente_id,
       numero,
       data_venda,
       data_competencia,
       status,
       situacao,
       subtotal,
       total,
       condicao_pagamento,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $4, 'rascunho', 'em_andamento', $5, $5, $6::jsonb, $7, $7)
     RETURNING id`,
    [
      input.tenantId,
      customerId,
      number,
      saleDate,
      total,
      JSON.stringify({ parcelas: [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dueDate, valor: total }] }),
      input.actorId,
    ],
  )
  const saleId = Number(saleResult.rows[0]?.id)

  await client.query(
    `INSERT INTO erp.vendas_itens (
       tenant_id,
       venda_id,
       produto_id,
       descricao,
       quantidade,
       valor_unitario,
       custo_unitario,
       total,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $8)`,
    [
      input.tenantId,
      saleId,
      productId,
      optionalText(input.values.descricao) || `Produto ${productId}`,
      quantity,
      unitValue,
      total,
      input.actorId,
    ],
  )

  return fetchCreatedRecord(input.tenantId, input.entityId, saleId)
}

async function createPurchaseRecord(client: SQLClient, input: CreateInput) {
  const supplierId = numericId(input.values.fornecedor_id, 'Fornecedor')
  const productId = numericId(input.values.produto_id, 'Produto')
  const quantity = Number(input.values.quantidade || 1)
  const unitValue = positiveMoney(input.values.valor_unitario)
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantidade invalida.')
  if (!unitValue) throw new Error('Valor unitario precisa ser maior que zero.')

  const total = Number((quantity * unitValue).toFixed(2))
  const purchaseDate = dateText(input.values.data_compra) || new Date().toISOString().slice(0, 10)
  const dueDate = dateText(input.values.data_vencimento) || purchaseDate
  const number = optionalText(input.values.numero) || `COM-${Date.now()}`
  const generateFinancial = text(input.values.gera_financeiro).toLowerCase() !== 'nao'

  const supplierResult = await client.query(
    `SELECT id
     FROM erp.entidades
     WHERE tenant_id = $1
       AND id = $2
       AND eh_fornecedor = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, supplierId],
  )
  if (!supplierResult.rows[0]) throw new Error('Fornecedor nao encontrado.')

  const purchaseResult = await client.query(
    `INSERT INTO erp.compras (
       tenant_id,
       fornecedor_id,
       numero,
       data_compra,
       data_competencia,
       status,
       subtotal,
       total,
       condicao_pagamento,
       gera_financeiro,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $4, 'rascunho', $5, $5, $6::jsonb, $7, $8, $8)
     RETURNING id`,
    [
      input.tenantId,
      supplierId,
      number,
      purchaseDate,
      total,
      JSON.stringify({ parcelas: [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dueDate, valor: total }] }),
      generateFinancial,
      input.actorId,
    ],
  )
  const purchaseId = Number(purchaseResult.rows[0]?.id)

  await client.query(
    `INSERT INTO erp.compras_itens (
       tenant_id,
       compra_id,
       produto_id,
       descricao,
       quantidade,
       valor_unitario,
       total,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [
      input.tenantId,
      purchaseId,
      productId,
      optionalText(input.values.descricao) || `Produto ${productId}`,
      quantity,
      unitValue,
      total,
      input.actorId,
    ],
  )

  return fetchCreatedRecord(input.tenantId, input.entityId, purchaseId)
}

async function createCategoryRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da categoria')
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
     VALUES ($1, $2, 'geral', $3, $4::jsonb, $5, $5)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      activeFromStatus(input.values.status),
      JSON.stringify({ descricao: optionalText(input.values.descricao) }),
      input.actorId,
    ],
  )
  return fetchCreatedRecord(input.tenantId, input.entityId, result.rows[0]?.id)
}

async function fetchCreatedRecord(tenantId: number, entityId: ErpConnectedModuleId, id: unknown) {
  const records = await listErpEntityRecords({ tenantId, entityId })
  const created = records.find((record) => record.id === String(id))
  if (!created) throw new Error('Registro criado, mas nao foi possivel recarrega-lo.')
  return created
}
