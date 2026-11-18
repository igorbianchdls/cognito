// Part of the ERP repository, split by area from erpRepository.ts. erpRepository.ts re-exports the public names.
import { type SQLClient } from '@/lib/postgres'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { nonNegativeDecimal } from '@/products/erp/shared/erpMoney'


export type ListInput = {
  tenantId: number
  entityId: ErpConnectedModuleId
  query?: string
  filters?: Record<string, string>
  page?: number
  pageSize?: number
  sort?: string
}
export type CreateInput = {
  tenantId: number
  actorId: number
  entityId: ErpConnectedModuleId
  values: Record<string, unknown>
  idempotencyKey?: string
  temporary?: boolean
}
export type UpdateInput = CreateInput & {
  id: string | number
  expectedVersion: number
}
export type ConfirmSaleInput = {
  tenantId: number
  actorId: number
  saleId: string | number
  expectedVersion?: number
  /** Motivo para confirmar acima do limite de crédito (exige erp.financeiro.gerenciar). */
  creditOverrideReason?: string | null
}
export type IdActionInput = {
  tenantId: number
  actorId: number
  id: string | number
}
export type SettleInstallmentInput = IdActionInput & {
  idempotencyKey?: string
  values: Record<string, unknown>
}
export type ReversePaymentInput = IdActionInput & {
  idempotencyKey?: string
  reason?: string | null
}
export type SaleRow = {
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
export type PurchaseRow = {
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
export type ReceivableRow = {
  id: string | number
  status: string
  tipo_lancamento?: string
}
export type InstallmentRow = {
  id: string | number
  numero_parcela: string | number
  valor: string | number
  status: string
}
export type NormalizedInstallment = {
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
export type PurchaseItemInput = {
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
export type ConfirmErpPurchaseResult = {
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
export function text(value: unknown) {
  return String(value ?? '').trim()
}
export function optionalText(value: unknown) {
  const normalized = text(value)
  return normalized || null
}
export function money(value: unknown) {
  return nonNegativeDecimal(value === undefined || value === null || value === '' ? 0 : value, 4)
}
export function positiveMoney(value: unknown) {
  const parsed = money(value)
  return parsed > 0 ? parsed : null
}
export function dateText(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const normalized = text(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null
}
export function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(optionalText).filter((item): item is string => Boolean(item)))]
}
export function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
export function normalizedIdempotencyKey(value: unknown) {
  const normalized = optionalText(value)
  if (!normalized) return null
  if (normalized.length > 200) throw new ErpDomainError('VALIDATION_ERROR', 'Chave de idempotencia inválida.')
  return normalized
}
export function numericId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ErpDomainError('VALIDATION_ERROR', `${label} invalido.`)
  return parsed
}
export function optionalNumericId(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
export function normalizePersonType(value: unknown) {
  const normalized = text(value).toUpperCase()
  // O site usa PF/PJ; MCP e banco usam os nomes completos.
  if (normalized === 'PF' || normalized === 'FISICA') return 'fisica'
  if (normalized === 'PJ' || normalized === 'JURIDICA') return 'juridica'
  if (normalized === 'ESTRANGEIRA') return 'estrangeira'
  // Preserve o padrão dos cadastros opcionais, mas não substitua um tipo inválido.
  if (!normalized) return 'juridica'
  throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de pessoa inválido. Informe PF/fisica ou PJ/juridica.')
}
export function displayPersonType(value: unknown) {
  if (value === 'fisica') return 'PF'
  if (value === 'juridica') return 'PJ'
  return 'Estrangeira'
}
export function activeFromStatus(value: unknown) {
  const normalized = text(value).toLowerCase()
  return normalized !== 'inativo' && normalized !== 'pausado'
}
export function booleanValue(value: unknown) {
  return value === true || ['true', '1', 'sim', 'yes'].includes(text(value).toLowerCase())
}
export function appendSearch(params: unknown[], query?: string) {
  const normalized = text(query)
  if (!normalized) return ''
  params.push(`%${normalized}%`)
  return ` AND searchable ILIKE $${params.length}`
}
export function appendStatusFilter(filters?: Record<string, string>) {
  const status = text(filters?.status)
  if (!status || status === 'todos' || status === '__all__') return ''
  if (status === 'ativo') return ' AND ativo = true'
  if (status === 'inativo' || status === 'pausado') return ' AND ativo = false'
  return ''
}
export function appendRecordStatusFilter(params: unknown[], filters?: Record<string, string>) {
  const status = text(filters?.status)
  if (!status || status === 'todos' || status === '__all__') return ''
  params.push(status)
  return ` AND status = $${params.length}`
}
export function normalizedPage(input: ListInput) {
  const page = Number(input.page)
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
}
export function normalizedPageSize(input: ListInput) {
  const pageSize = Number(input.pageSize)
  return Number.isFinite(pageSize) ? Math.min(100, Math.max(10, Math.floor(pageSize))) : 50
}
export function appendPagination(params: unknown[], input: ListInput) {
  const pageSize = normalizedPageSize(input)
  const offset = (normalizedPage(input) - 1) * pageSize
  params.push(pageSize, offset)
  return ` LIMIT $${params.length - 1} OFFSET $${params.length}`
}
export function appendTipoFilter(params: unknown[], filters?: Record<string, string>) {
  const tipo = text(filters?.tipo).toUpperCase()
  if (!tipo || tipo === '__ALL__') return ''
  params.push(normalizePersonType(tipo))
  return ` AND tipo_pessoa = $${params.length}`
}
export function assertRequired(value: unknown, label: string) {
  if (!text(value)) throw new ErpDomainError('VALIDATION_ERROR', `${label} é obrigatório.`)
}
// Categoria de cadastro (agrupamento de produtos, serviços, clientes ou fornecedores) pelo nome: usa a
// existente do mesmo tipo ou cria. Categorias financeiras (receita/despesa) ficam em erp.categorias.
export type RegistrationCategoryType = 'produto' | 'servico' | 'cliente' | 'fornecedor'
export async function resolveCategoryId(
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
export async function saveEntityCategory(client: Pick<SQLClient, 'query'>, tenantId: number, actorId: number, entityId: ErpConnectedModuleId, id: number, name: unknown) {
  const type = entityId === 'clientes' ? 'cliente' : entityId === 'fornecedores' ? 'fornecedor' : null
  if (!type) return
  const categoryId = await resolveCategoryId(client, tenantId, actorId, name, type)
  await client.query('UPDATE erp.entidades SET categoria_id = $3, categoria_tipo = $4 WHERE empresa_id = $1 AND id = $2',
    [tenantId, id, categoryId, categoryId ? type : null])
}
export const editableModuleTables = {
  'contas-contabeis': { table: 'contas_contabeis', eventType: 'conta_contabil' },
  clientes: { table: 'entidades', eventType: 'entidade' },
  fornecedores: { table: 'entidades', eventType: 'entidade' },
  vendedores: { table: 'entidades', eventType: 'entidade' },
  produtos: { table: 'produtos', eventType: 'produto' },
  servicos: { table: 'servicos', eventType: 'servico' },
  categorias: { table: 'categorias', eventType: 'categoria' },
  'categorias-cadastro': { table: 'categorias_cadastro', eventType: 'categoria_cadastro' },
  'contas-financeiras': { table: 'contas_financeiras', eventType: 'conta_financeira' },
} as const
export type EditableModuleId = keyof typeof editableModuleTables
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
