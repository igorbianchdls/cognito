// Part of the ERP repository, split by area from erpRepository.ts. erpRepository.ts re-exports the public names.
import { runQuery, type SQLClient } from '@/lib/postgres'
import { saveCustomerCommercialTerms } from '@/products/erp/server/erpCommercialRules'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import { accountingLink } from './erpAccountingRepository'
import { FINANCIAL_CATEGORY_LEAF_SQL, financialCategoryClassification } from './erpReceivablesPayablesRepository'
import { saveRegistrationRelations } from './erpRegistrationRelations'
import { activeFromStatus, appendPagination, appendSearch, appendStatusFilter, appendTipoFilter, assertRequired, displayPersonType, editableModuleTables, money, normalizePersonType, numericId, optionalNumericId, optionalText, resolveCategoryId, saveEntityCategory, text, type CreateInput, type EditableModuleId, type ListInput, type UpdateInput } from './erpRepositoryCore'

type EntityRoleModuleId = 'clientes' | 'fornecedores' | 'vendedores'
export function isEntityRoleModule(entityId: ErpConnectedModuleId): entityId is EntityRoleModuleId {
  return entityId === 'clientes' || entityId === 'fornecedores' || entityId === 'vendedores'
}
export function entityRoleColumn(entityId: EntityRoleModuleId) {
  if (entityId === 'clientes') return 'eh_cliente'
  if (entityId === 'fornecedores') return 'eh_fornecedor'
  return 'eh_vendedor'
}
export async function listEntityRoleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
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
     ORDER BY nome ASC, id ASC${appendPagination(params, input)}`,
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
export async function listProductRecords(input: ListInput): Promise<ErpEntityRecord[]> {
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
         coalesce(nullif(trim(produtos.unidade_medida), ''), 'UN') AS unidade_medida,
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
     SELECT id, nome, sku, unidade_medida, preco_venda, controla_estoque, estoque_minimo, categoria, versao, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${categorySql}
     ORDER BY nome ASC, id ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    sku: String(row.sku ?? ''),
    categoria: String(row.categoria ?? ''),
    preco: Number(row.preco_venda ?? 0),
    unidade_medida: String(row.unidade_medida || 'UN'),
    controla_estoque: row.controla_estoque ? 'Sim' : 'Nao',
    estoque_minimo: Number(row.estoque_minimo ?? 0),
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'pausado',
    __total: Number(row.__total ?? 0),
  }))
}
export async function listServiceRecords(input: ListInput): Promise<ErpEntityRecord[]> {
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
     ORDER BY nome ASC, id ASC${appendPagination(params, input)}`,
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
export async function listRegistrationCategoryRecords(input: ListInput): Promise<ErpEntityRecord[]> {
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
export async function createRegistrationCategoryRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da categoria')
  const values = await registrationCategoryValues(client, input.tenantId, input.values)
  const result = await client.query(
    `INSERT INTO erp.categorias_cadastro (empresa_id, tipo, nome, descricao, categoria_pai_id, ativo, criado_por, atualizado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`,
    [input.tenantId, values.tipo, text(input.values.nome), optionalText(input.values.descricao), values.parentId, activeFromStatus(input.values.status), input.actorId],
  )
  return { id: String(result.rows[0]?.id) }
}
export async function registrationCategoryValues(client: Pick<SQLClient, 'query'>, tenantId: number, values: Record<string, unknown>, id?: number) {
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
export async function listCategoryRecords(input: ListInput): Promise<ErpEntityRecord[]> {
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
         coalesce((SELECT a.codigo||' - '||a.nome FROM erp.contas_contabeis a WHERE a.empresa_id=categorias.empresa_id AND a.id=categorias.conta_contabil_id),'') conta_contabil,
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
     SELECT id, nome, descricao, tipo, versao, itens, ativo, categoria_pai, grupo_dre, conta_contabil, ordem_arvore,
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
    conta_contabil: String(row.conta_contabil ?? ''),
    versao: Number(row.versao ?? 1),
    itens: Number(row.itens ?? 0),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}
export async function appendRegistrationEvent(
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
export const REGISTRATION_CATEGORY_TYPES = ['produto', 'servico', 'cliente', 'fornecedor']
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
export async function createEntityRoleRecord(client: SQLClient, input: CreateInput) {
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
export function productStockUnit(value: unknown) {
  const unit = String(value ?? 'UN').trim().toUpperCase()
  if (!/^[A-Z0-9]{1,12}$/.test(unit)) throw new ErpDomainError('VALIDATION_ERROR', 'Informe uma unidade de estoque com até 12 letras ou números, como UN, KG ou M2.', 422)
  return unit
}
export async function createProductRecord(client: SQLClient, input: CreateInput) {
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
       atualizado_por,
       unidade_medida
     )
     VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12)
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
      productStockUnit(input.values.unidade_medida),
    ],
  )
  return { id: String(result.rows[0]?.id) }
}
export async function resolveServiceCategory(client: Pick<SQLClient, 'query'>, input: CreateInput | UpdateInput) {
  if (input.values.categoria_id === '' || input.values.categoria_id === null) return null
  if (input.values.categoria_id === undefined) return resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'servico')
  const id = numericId(input.values.categoria_id, 'Categoria')
  const result = await client.query("SELECT id FROM erp.categorias_cadastro WHERE empresa_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL AND tipo='servico'", [input.tenantId,id])
  if (!result.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Selecione uma categoria ativa de serviços da empresa.', 422)
  return id
}
// Códigos fiscais do serviço para a NFS-e: aceita com ou sem pontuação (ex.: 01.07.01 vira 010701).
export function serviceFiscalCodes(values: Record<string, unknown>) {
  const digitsOf = (value: unknown) => String(value ?? '').replace(/\D/g, '')
  const national = digitsOf(values.codigo_tributacao_nacional), nbs = digitsOf(values.codigo_nbs)
  if (national && national.length !== 6) throw new ErpDomainError('VALIDATION_ERROR', 'O código de tributação nacional tem 6 dígitos (item da LC 116 + desdobro, ex.: 01.07.01).', 422, { field: 'codigo_tributacao_nacional' })
  if (nbs && nbs.length !== 9) throw new ErpDomainError('VALIDATION_ERROR', 'O código NBS tem 9 dígitos.', 422, { field: 'codigo_nbs' })
  return { national: national || null, municipal: optionalText(values.codigo_servico_municipal), nbs: nbs || null }
}
export async function createServiceRecord(client: SQLClient, input: CreateInput) {
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
export async function createCategoryRecord(client: SQLClient, input: CreateInput) {
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
       conta_contabil_id,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, $7, $8, $9, $10, $6, $6)
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
      accountingLink(input.values.conta_contabil_id),
    ],
  )
  return { id: String(result.rows[0]?.id) }
}
