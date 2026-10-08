import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { commissionReleasedSql } from '@/products/erp/server/erpFinancialReports'
import { createManualFinancialTitle } from '@/products/erp/server/erpCrudRepository'
import type { CommissionPaymentValues, CommissionRuleValues, PriceTableValues } from '@/products/erp/shared/commercialPolicyContracts'

// Fase 1 — cadastro de tabelas de preço e regras de comissão, relatório e pagamento de comissões.
type Actor = { tenantId: number; actorId: number }
const page = (n?: number) => Math.max(1, Math.floor(Number(n) || 1))
const size = (n?: number, max = 100) => Math.min(max, Math.max(1, Math.floor(Number(n) || 20)))
const versionConflict = () => new ErpDomainError('VERSION_CONFLICT', 'Registro alterado por outra pessoa; atualize antes de salvar.', 409)

// ------------------------------------------------------------------ tabelas de preço

export async function listPriceTables(tenantId: number, input: { page?: number; pageSize?: number; query?: string } = {}) {
  const limit = size(input.pageSize), offset = (page(input.page) - 1) * limit
  const rows = await runQuery(
    `SELECT t.id::text, t.nome, t.descricao, t.padrao, t.ativo, t.vigencia_inicio::text, t.vigencia_fim::text, t.versao,
       (SELECT count(*)::int FROM erp.tabelas_preco_itens i WHERE i.empresa_id = t.empresa_id AND i.tabela_preco_id = t.id AND i.excluido_em IS NULL) AS itens,
       (SELECT count(*)::int FROM erp.entidades e WHERE e.empresa_id = t.empresa_id AND e.tabela_preco_id = t.id AND e.excluido_em IS NULL) AS clientes,
       count(*) OVER ()::int AS total
     FROM erp.tabelas_preco t
     WHERE t.empresa_id = $1 AND t.excluido_em IS NULL AND ($2::text = '' OR t.nome ILIKE '%' || $2 || '%')
     ORDER BY t.padrao DESC, t.nome LIMIT $3 OFFSET $4`,
    [tenantId, (input.query || '').trim(), limit, offset],
  )
  return { records: rows.map(({ total: _total, ...row }) => row), total: Number(rows[0]?.total || 0), page: page(input.page), pageSize: limit }
}

export async function getPriceTable(tenantId: number, id: number) {
  const [table] = await runQuery(
    `SELECT id::text, nome, descricao, padrao, ativo, vigencia_inicio::text, vigencia_fim::text, versao FROM erp.tabelas_preco
     WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`, [tenantId, id])
  if (!table) throw new ErpDomainError('NOT_FOUND', 'Tabela de preço não encontrada.', 404)
  const items = await runQuery(
    `SELECT i.id::text, CASE WHEN i.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
       coalesce(i.produto_id, i.servico_id)::text AS item_id, coalesce(p.nome, s.nome) AS item, coalesce(p.preco_venda, s.preco) AS preco_cadastro,
       i.preco, i.preco_minimo, i.desconto_maximo_percentual, i.quantidade_minima
     FROM erp.tabelas_preco_itens i
     LEFT JOIN erp.produtos p ON p.empresa_id = i.empresa_id AND p.id = i.produto_id
     LEFT JOIN erp.servicos s ON s.empresa_id = i.empresa_id AND s.id = i.servico_id
     WHERE i.empresa_id = $1 AND i.tabela_preco_id = $2 AND i.excluido_em IS NULL
     ORDER BY 4, i.quantidade_minima`, [tenantId, id])
  return { record: table, items }
}

export async function savePriceTable(input: Actor & { id?: number; expectedVersion?: number; values: PriceTableValues }) {
  const v = input.values
  const id = await withTransaction(async (client) => {
    if (v.padrao) await client.query(`UPDATE erp.tabelas_preco SET padrao = false, atualizado_por = $2 WHERE empresa_id = $1 AND padrao AND ($3::bigint IS NULL OR id <> $3)`,
      [input.tenantId, input.actorId, input.id ?? null])
    let tableId: number
    if (input.id) {
      const updated = await client.query(
        `UPDATE erp.tabelas_preco SET nome = $3, descricao = $4, padrao = $5, ativo = $6, vigencia_inicio = $7, vigencia_fim = $8,
           versao = versao + 1, atualizado_por = $9
         WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL AND versao = $10 RETURNING id`,
        [input.tenantId, input.id, v.nome, v.descricao ?? null, v.padrao, v.ativo, v.vigencia_inicio ?? null, v.vigencia_fim ?? null, input.actorId, input.expectedVersion])
      if (!updated.rows[0]) throw versionConflict()
      tableId = input.id
      await client.query(`UPDATE erp.tabelas_preco_itens SET excluido_em = now(), atualizado_por = $3 WHERE empresa_id = $1 AND tabela_preco_id = $2 AND excluido_em IS NULL`,
        [input.tenantId, tableId, input.actorId])
    } else {
      const created = await client.query(
        `INSERT INTO erp.tabelas_preco (empresa_id, nome, descricao, padrao, ativo, vigencia_inicio, vigencia_fim, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`,
        [input.tenantId, v.nome, v.descricao ?? null, v.padrao, v.ativo, v.vigencia_inicio ?? null, v.vigencia_fim ?? null, input.actorId])
      tableId = Number(created.rows[0].id)
    }
    const seen = new Set<string>()
    for (const item of v.itens) {
      const key = `${item.tipo}:${item.item_id}:${item.quantidade_minima}`
      if (seen.has(key)) throw new ErpDomainError('VALIDATION_ERROR', 'Item repetido na mesma faixa de quantidade.')
      seen.add(key)
      const catalog = await client.query(item.tipo === 'servico'
        ? 'SELECT id FROM erp.servicos WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL'
        : 'SELECT id FROM erp.produtos WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [input.tenantId, item.item_id])
      if (!catalog.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', `${item.tipo === 'servico' ? 'Serviço' : 'Produto'} ${item.item_id} não encontrado nesta empresa.`)
      await client.query(
        `INSERT INTO erp.tabelas_preco_itens (empresa_id, tabela_preco_id, produto_id, servico_id, preco, preco_minimo, desconto_maximo_percentual, quantidade_minima, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
        [input.tenantId, tableId, item.tipo === 'produto' ? item.item_id : null, item.tipo === 'servico' ? item.item_id : null,
          item.preco, item.preco_minimo ?? null, item.desconto_maximo_percentual ?? null, item.quantidade_minima, input.actorId])
    }
    return tableId
  })
  return getPriceTable(input.tenantId, id)
}

export async function deletePriceTable(input: Actor & { id: number; expectedVersion: number }) {
  await withTransaction(async (client) => {
    const used = await client.query('SELECT count(*)::int AS n FROM erp.entidades WHERE empresa_id = $1 AND tabela_preco_id = $2 AND excluido_em IS NULL', [input.tenantId, input.id])
    if (Number(used.rows[0].n) > 0) throw new ErpDomainError('VALIDATION_ERROR', `Tabela usada por ${used.rows[0].n} cliente(s); troque a tabela deles antes de excluir.`, 409)
    const removed = await client.query(
      `UPDATE erp.tabelas_preco SET excluido_em = now(), ativo = false, padrao = false, versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL AND versao = $4 RETURNING id`,
      [input.tenantId, input.id, input.actorId, input.expectedVersion])
    if (!removed.rows[0]) throw versionConflict()
  })
  return { id: String(input.id), excluido: true }
}

// ------------------------------------------------------------------ regras de comissão

export async function listCommissionRules(tenantId: number, input: { page?: number; pageSize?: number } = {}) {
  const limit = size(input.pageSize), offset = (page(input.page) - 1) * limit
  const rows = await runQuery(
    `SELECT r.id::text, r.nome, r.percentual, r.base, r.ativo, r.vigencia_inicio::text, r.vigencia_fim::text, r.versao,
       r.vendedor_id::text, v.nome AS vendedor, r.produto_id::text, p.nome AS produto, r.servico_id::text, s.nome AS servico,
       r.categoria_id::text, c.nome AS categoria, count(*) OVER ()::int AS total
     FROM erp.comissoes_regras r
     LEFT JOIN erp.entidades v ON v.empresa_id = r.empresa_id AND v.id = r.vendedor_id
     LEFT JOIN erp.produtos p ON p.empresa_id = r.empresa_id AND p.id = r.produto_id
     LEFT JOIN erp.servicos s ON s.empresa_id = r.empresa_id AND s.id = r.servico_id
     LEFT JOIN erp.categorias_cadastro c ON c.empresa_id = r.empresa_id AND c.id = r.categoria_id
     WHERE r.empresa_id = $1 AND r.excluido_em IS NULL
     ORDER BY r.ativo DESC, v.nome NULLS FIRST, r.nome LIMIT $2 OFFSET $3`, [tenantId, limit, offset])
  return { records: rows.map(({ total: _total, ...row }) => row), total: Number(rows[0]?.total || 0), page: page(input.page), pageSize: limit }
}

async function assertRuleReferences(client: Pick<SQLClient, 'query'>, tenantId: number, v: CommissionRuleValues) {
  const checks: Array<[unknown, string, string]> = [
    [v.vendedor_id, 'SELECT id FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND eh_vendedor AND excluido_em IS NULL', 'Vendedor'],
    [v.produto_id, 'SELECT id FROM erp.produtos WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', 'Produto'],
    [v.servico_id, 'SELECT id FROM erp.servicos WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', 'Serviço'],
    [v.categoria_id, "SELECT id FROM erp.categorias_cadastro WHERE empresa_id = $1 AND id = $2 AND tipo IN ('produto', 'servico') AND excluido_em IS NULL", 'Categoria de produto ou serviço'],
  ]
  for (const [value, sql, label] of checks) if (value != null && !(await client.query(sql, [tenantId, value])).rows[0])
    throw new ErpDomainError('VALIDATION_ERROR', `${label} não encontrado nesta empresa.`)
}

export async function saveCommissionRule(input: Actor & { id?: number; expectedVersion?: number; values: CommissionRuleValues }) {
  const v = input.values
  return withTransaction(async (client) => {
    await assertRuleReferences(client, input.tenantId, v)
    const params = [v.nome, v.vendedor_id ?? null, v.produto_id ?? null, v.servico_id ?? null, v.categoria_id ?? null, v.percentual, v.base, v.ativo,
      v.vigencia_inicio ?? null, v.vigencia_fim ?? null, input.actorId]
    if (input.id) {
      const updated = await client.query(
        `UPDATE erp.comissoes_regras SET nome = $3, vendedor_id = $4, produto_id = $5, servico_id = $6, categoria_id = $7, percentual = $8, base = $9,
           ativo = $10, vigencia_inicio = $11, vigencia_fim = $12, atualizado_por = $13, versao = versao + 1
         WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL AND versao = $14 RETURNING id::text, versao`,
        [input.tenantId, input.id, ...params, input.expectedVersion])
      if (!updated.rows[0]) throw versionConflict()
      return updated.rows[0]
    }
    const created = await client.query(
      `INSERT INTO erp.comissoes_regras (empresa_id, nome, vendedor_id, produto_id, servico_id, categoria_id, percentual, base, ativo, vigencia_inicio, vigencia_fim, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12) RETURNING id::text, versao`, [input.tenantId, ...params])
    return created.rows[0]
  })
}

export async function deleteCommissionRule(input: Actor & { id: number; expectedVersion: number }) {
  const removed = await withTransaction(client => client.query(
    `UPDATE erp.comissoes_regras SET excluido_em = now(), ativo = false, versao = versao + 1, atualizado_por = $3
     WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL AND versao = $4 RETURNING id`, [input.tenantId, input.id, input.actorId, input.expectedVersion]))
  if (!removed.rows[0]) throw versionConflict()
  return { id: String(input.id), excluido: true }
}

// ------------------------------------------------------------------ relatório e pagamento

export async function commissionReport(tenantId: number, input: { inicio: string; fim: string; vendedor_id?: number; pagina?: number; por_pagina?: number }) {
  const limit = size(input.por_pagina), offset = (page(input.pagina) - 1) * limit
  const filter = `competencia BETWEEN $2::date AND $3::date AND ($4::bigint IS NULL OR vendedor_id = $4)`
  const [summary, records] = await Promise.all([
    runQuery(`${commissionReleasedSql()} SELECT vendedor_id::text, vendedor, count(*)::int AS lancamentos, sum(valor)::numeric(18,2) AS valor,
        sum(liberado)::numeric(18,2) AS liberado, sum(valor_pago)::numeric(18,2) AS pago, sum(greatest(liberado - valor_pago, 0))::numeric(18,2) AS a_pagar
      FROM lancamentos WHERE ${filter} GROUP BY vendedor_id, vendedor ORDER BY vendedor`, [tenantId, input.inicio, input.fim, input.vendedor_id ?? null]),
    runQuery(`${commissionReleasedSql()} SELECT id::text, venda_id::text, venda, cliente, vendedor_id::text, vendedor, competencia::text, base, valor_base, percentual, valor,
        liberado, valor_pago, greatest(liberado - valor_pago, 0)::numeric(18,2) AS a_pagar, count(*) OVER ()::int AS total
      FROM lancamentos WHERE ${filter} ORDER BY competencia, venda, id LIMIT $5 OFFSET $6`,
      [tenantId, input.inicio, input.fim, input.vendedor_id ?? null, limit, offset]),
  ])
  return { summary, records: records.map(({ total: _total, ...row }) => row), total: Number(records[0]?.total || 0), page: page(input.pagina), pageSize: limit }
}

// Gera uma conta a pagar ao vendedor com o que está liberado e ainda não pago até a data, e registra o
// pagamento em cada lançamento. Repetir com a mesma chave devolve o mesmo resultado.
export async function payCommissions(input: Actor & { idempotencyKey: string; values: CommissionPaymentValues }) {
  const v = input.values
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:comissao:${input.tenantId}:${v.vendedor_id}`])
    const existing = await client.query('SELECT id::text, conta_pagar_id::text, valor FROM erp.comissoes_pagamentos WHERE empresa_id = $1 AND chave_idempotencia = $2', [input.tenantId, input.idempotencyKey])
    if (existing.rows[0]) return { ...existing.rows[0], repetido: true }
    const seller = (await client.query('SELECT nome, eh_fornecedor FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND eh_vendedor AND excluido_em IS NULL', [input.tenantId, v.vendedor_id])).rows[0]
    if (!seller) throw new ErpDomainError('VALIDATION_ERROR', 'Vendedor não encontrado nesta empresa.')
    if (!seller.eh_fornecedor) throw new ErpDomainError('VALIDATION_ERROR', 'Marque o vendedor também como fornecedor para gerar a conta a pagar das comissões.')
    const due = await client.query(
      `${commissionReleasedSql()} SELECT id, greatest(liberado - valor_pago, 0)::numeric(18,2) AS a_pagar FROM lancamentos
       WHERE vendedor_id = $2 AND competencia <= $3::date AND liberado > valor_pago ORDER BY id`, [input.tenantId, v.vendedor_id, v.ate])
    const rows = due.rows.filter(row => Number(row.a_pagar) > 0)
    const total = Number(rows.reduce((sum, row) => sum + Math.round(Number(row.a_pagar) * 100), 0) / 100)
    if (!rows.length || total <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Não há comissão liberada a pagar até essa data.')
    const today = erpToday()
    const titleId = await createManualFinancialTitle(client as SQLClient, input.tenantId, input.actorId, 'pagar', {
      fornecedor_id: v.vendedor_id, descricao: `Comissões de ${seller.nome} até ${v.ate.split('-').reverse().join('/')}`,
      valor_total: total, data_competencia: v.ate, data_emissao: today, categoria_id: v.categoria_id,
      conta_financeira_id: v.conta_financeira_id ?? null, parcelas: [{ data_vencimento: v.data_vencimento, valor: total }],
    }, `comissao:${input.idempotencyKey}`, 'api')
    const payment = await client.query(
      `INSERT INTO erp.comissoes_pagamentos (empresa_id, vendedor_id, conta_pagar_id, valor, competencia_fim, chave_idempotencia, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`, [input.tenantId, v.vendedor_id, titleId, total, v.ate, input.idempotencyKey, input.actorId])
    const paymentId = Number(payment.rows[0].id)
    for (const row of rows) {
      await client.query('INSERT INTO erp.comissoes_pagamentos_itens (empresa_id, pagamento_id, lancamento_id, valor) VALUES ($1, $2, $3, $4)',
        [input.tenantId, paymentId, row.id, row.a_pagar])
      await client.query('UPDATE erp.comissoes_lancamentos SET valor_pago = valor_pago + $3, atualizado_por = $4 WHERE empresa_id = $1 AND id = $2',
        [input.tenantId, row.id, row.a_pagar, input.actorId])
    }
    return { id: String(paymentId), conta_pagar_id: titleId, valor: total, lancamentos: rows.length }
  })
}

