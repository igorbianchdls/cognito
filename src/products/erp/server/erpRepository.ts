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

export async function listErpEntityRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
    return listEntityRoleRecords(input)
  }

  if (input.entityId === 'produtos') {
    return listProductRecords(input)
  }

  return listCategoryRecords(input)
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
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}
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

export async function createErpEntityRecord(input: CreateInput): Promise<ErpEntityRecord> {
  return withTransaction(async (client) => {
    if (input.entityId === 'clientes' || input.entityId === 'fornecedores') {
      return createEntityRoleRecord(client, input)
    }

    if (input.entityId === 'produtos') {
      return createProductRecord(client, input)
    }

    return createCategoryRecord(client, input)
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
