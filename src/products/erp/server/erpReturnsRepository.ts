import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { financialCompositionSql } from '@/products/erp/server/erpRepository'
import { createManualFinancialTitle } from '@/products/erp/server/erpCrudRepository'
import { createFinalStockDocument } from '@/products/erp/server/erpStockRepository'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import { nextDocumentNumber } from '@/products/erp/server/erpDocumentNumbers'
import type { CreditUseValues, SaleReturnValues } from '@/products/erp/shared/commercialPolicyContracts'

// Fase 1.5 — devolução de venda e crédito do cliente.
type Actor = { tenantId: number; actorId: number }
type Query = Pick<SQLClient, 'query'>
const cents = (value: number) => Math.round(value * 100)
const fromCents = (value: number) => Number((value / 100).toFixed(2))

async function hasCapability(client: Query, tenantId: number, capability: string) {
  return Boolean((await client.query('SELECT shared.has_erp_capability($1::bigint, $2::text) AS ok', [tenantId, capability])).rows[0]?.ok)
}
async function defaultAccount(client: Query, tenantId: number, preferred: unknown) {
  const rows = (await client.query(
    `SELECT id FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo AND excluido_em IS NULL AND (id = $2 OR $2::bigint IS NULL)
     ORDER BY (id = $2) DESC NULLS LAST, padrao DESC, id LIMIT 1`, [tenantId, preferred ?? null])).rows
  if (!rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cadastre uma conta financeira antes de registrar a devolução.')
  return Number(rows[0].id)
}
// Baixa sem dinheiro: valor e desconto iguais, líquido zero. Liquida a parcela sem mexer no caixa.
async function settleWithoutCash(client: Query, input: Actor & { parcelaId: number; valor: number; data: string; contaId: number; origem: 'devolucao' | 'credito_cliente'; devolucaoId: number; key: string; observacao: string }) {
  await client.query(
    `INSERT INTO erp.pagamentos (empresa_id, tipo, conta_receber_parcela_id, conta_financeira_id, data_pagamento, valor, desconto, valor_liquido,
       origem, devolucao_id, observacoes, chave_idempotencia, criado_por, atualizado_por)
     VALUES ($1, 'receber', $2, $3, $4, $5, $5, 0, $6, $7, $8, $9, $10, $10)`,
    [input.tenantId, input.parcelaId, input.contaId, input.data, input.valor, input.origem, input.devolucaoId, input.observacao, input.key, input.actorId])
}

export async function createSaleReturn(input: Actor & { saleId: number; idempotencyKey: string; values: SaleReturnValues }) {
  const v = input.values
  return withTransaction(async (client) => {
    const replay = await client.query('SELECT id::text, numero FROM erp.devolucoes WHERE empresa_id = $1 AND chave_idempotencia = $2', [input.tenantId, input.idempotencyKey])
    if (replay.rows[0]) return { ...(await readReturn(client, input.tenantId, Number(replay.rows[0].id))), repetido: true }
    const sale = (await client.query(
      `SELECT id, cliente_id, status, tipo_documento, atendimento_status, subtotal, total, frete, local_estoque_id, conta_financeira_id FROM erp.vendas
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, input.saleId])).rows[0]
    if (!sale) throw new ErpDomainError('NOT_FOUND', 'Venda não encontrada.', 404)
    if (sale.status !== 'confirmada' || sale.tipo_documento !== 'venda') throw new ErpDomainError('VALIDATION_ERROR', 'Só é possível devolver itens de venda confirmada.', 409)
    const date = v.data_devolucao || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'vendas', date })
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date })
    // O tratamento financeiro exige a permissão financeira correspondente.
    const needed = v.tratamento === 'reembolso' ? 'erp.financeiro.gerenciar' : 'erp.financeiro.baixar'
    if (!(await hasCapability(client, input.tenantId, needed)) && !(await hasCapability(client, input.tenantId, 'erp.financeiro.gerenciar')))
      throw new ErpDomainError('ACCESS_DENIED', 'Seu perfil não permite o tratamento financeiro escolhido para a devolução.', 403)

    // Valor unitário líquido do item, proporcional ao desconto do cabeçalho (o frete não é devolvido).
    const factor = Number(sale.subtotal) > 0 ? Math.max(Number(sale.total) - Number(sale.frete), 0) / Number(sale.subtotal) : 0
    const items: Array<{ vendaItemId: number; quantidade: number; valor: number; produtoId: number | null; custo: number }> = []
    for (const [index, requested] of v.itens.entries()) {
      const item = (await client.query(
        `SELECT i.id, i.produto_id, i.servico_id, i.quantidade, i.total, i.custo_unitario, coalesce(pr.controla_estoque, false) AS controla_estoque,
           -- Entregue: venda atendida por inteiro, ou o que as reservas/itens registram como atendido.
           CASE WHEN $4 = 'atendido' THEN i.quantidade ELSE greatest(i.quantidade_atendida, coalesce((SELECT sum(r.quantidade_atendida) FROM erp.reservas_estoque r
             WHERE r.empresa_id = i.empresa_id AND r.venda_item_id = i.id), 0)) END AS entregue,
           coalesce((SELECT sum(d.quantidade) FROM erp.devolucoes_itens d WHERE d.empresa_id = i.empresa_id AND d.venda_item_id = i.id), 0) AS devolvido
         FROM erp.vendas_itens i LEFT JOIN erp.produtos pr ON pr.empresa_id = i.empresa_id AND pr.id = i.produto_id
         WHERE i.empresa_id = $1 AND i.venda_id = $2 AND i.id = $3 AND i.excluido_em IS NULL FOR UPDATE OF i`,
        [input.tenantId, input.saleId, requested.venda_item_id, String(sale.atendimento_status)])).rows[0]
      if (!item) throw new ErpDomainError('VALIDATION_ERROR', `Item ${index + 1} não pertence a esta venda.`)
      // Produto: só o que foi entregue; serviço: o que foi vendido. Sempre descontando devoluções anteriores.
      const limit = (item.produto_id ? Number(item.entregue) : Number(item.quantidade)) - Number(item.devolvido)
      if (requested.quantidade > limit + 1e-9) {
        throw new ErpDomainError('VALIDATION_ERROR', item.produto_id
          ? `Item ${index + 1}: só ${limit} unidade(s) entregue(s) ainda podem ser devolvidas. Itens não entregues: cancele a venda.`
          : `Item ${index + 1}: só ${limit} unidade(s) ainda podem ser devolvidas.`)
      }
      const unit = Number(item.total) / Number(item.quantidade) * factor
      items.push({ vendaItemId: Number(item.id), quantidade: requested.quantidade, valor: fromCents(cents(unit * requested.quantidade)),
        produtoId: item.produto_id && item.controla_estoque ? Number(item.produto_id) : null, custo: Number(item.custo_unitario || 0) })
    }
    const total = fromCents(items.reduce((sum, item) => sum + cents(item.valor), 0))
    if (total <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'A devolução precisa ter valor maior que zero.')

    const numero = await nextDocumentNumber(client, input.tenantId, 'devolucao', date)
    // Reembolso: conta a pagar ao cliente (precisa estar marcado também como fornecedor).
    let payableId: number | null = null
    if (v.tratamento === 'reembolso') {
      const customer = (await client.query('SELECT nome, eh_fornecedor FROM erp.entidades WHERE empresa_id = $1 AND id = $2', [input.tenantId, sale.cliente_id])).rows[0]
      if (!customer?.eh_fornecedor) throw new ErpDomainError('VALIDATION_ERROR', 'Para reembolsar, marque o cliente também como fornecedor (o reembolso é uma conta a pagar a ele).')
      if (!v.categoria_id || !v.data_vencimento) throw new ErpDomainError('VALIDATION_ERROR', 'Informe a categoria e o vencimento do reembolso.')
      payableId = Number(await createManualFinancialTitle(client as SQLClient, input.tenantId, input.actorId, 'pagar', {
        fornecedor_id: Number(sale.cliente_id), descricao: `Reembolso da devolução ${numero}`, valor_total: total, data_competencia: date, data_emissao: date,
        categoria_id: v.categoria_id, conta_financeira_id: v.conta_financeira_id ?? null, parcelas: [{ data_vencimento: v.data_vencimento, valor: total }],
      }, `devolucao:${input.idempotencyKey}`, 'api'))
    }
    // Estoque: produtos devolvidos voltam pelo documento de devolução do cliente.
    let stockDocumentId: number | null = null
    const stockItems = items.filter(item => item.produtoId)
    if (stockItems.length) {
      const reservation = (await client.query('SELECT local_estoque_id FROM erp.reservas_estoque WHERE empresa_id = $1 AND venda_id = $2 ORDER BY id LIMIT 1', [input.tenantId, input.saleId])).rows[0]
      const localId = Number(reservation?.local_estoque_id || sale.local_estoque_id || 0) || Number((await client.query(
        'SELECT id FROM erp.locais_estoque WHERE empresa_id = $1 AND ativo AND excluido_em IS NULL ORDER BY padrao DESC, id LIMIT 1', [input.tenantId])).rows[0]?.id || 0)
      if (!localId) throw new ErpDomainError('VALIDATION_ERROR', 'Cadastre um local de estoque para receber a devolução.')
      const document = await createFinalStockDocument(client, { tenantId: input.tenantId, actorId: input.actorId, tipo: 'devolucao_cliente', localEstoqueId: localId,
        entidadeId: Number(sale.cliente_id), vendaId: input.saleId, motivo: v.motivo, chaveIdempotencia: `devolucao:${input.idempotencyKey}`,
        items: stockItems.map(item => ({ produtoId: item.produtoId!, quantidade: item.quantidade, custoUnitario: item.custo, vendaItemId: item.vendaItemId })) })
      stockDocumentId = Number(document.id)
    }
    const created = await client.query(
      `INSERT INTO erp.devolucoes (empresa_id, venda_id, cliente_id, numero, data_devolucao, motivo, tratamento, valor_total, valor_credito,
         conta_pagar_id, documento_estoque_id, chave_idempotencia, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13) RETURNING id`,
      [input.tenantId, input.saleId, sale.cliente_id, numero, date, v.motivo, v.tratamento, total, v.tratamento === 'credito' ? total : 0,
        payableId, stockDocumentId, input.idempotencyKey, input.actorId])
    const returnId = Number(created.rows[0].id)
    for (const item of items) await client.query(
      'INSERT INTO erp.devolucoes_itens (empresa_id, devolucao_id, venda_item_id, quantidade, valor) VALUES ($1, $2, $3, $4, $5)',
      [input.tenantId, returnId, item.vendaItemId, item.quantidade, item.valor])

    // Abater: baixa sem dinheiro nas parcelas em aberto da venda, das últimas para as primeiras.
    if (v.tratamento === 'abater') {
      const open = (await client.query(
        `SELECT parcelas.id, composicao.saldo FROM erp.contas_receber contas
         JOIN erp.contas_receber_parcelas parcelas ON parcelas.empresa_id = contas.empresa_id AND parcelas.conta_receber_id = contas.id AND parcelas.excluido_em IS NULL
         ${financialCompositionSql('receber')}
         WHERE contas.empresa_id = $1 AND contas.venda_id = $2 AND contas.excluido_em IS NULL AND contas.status <> 'cancelado'
           AND parcelas.status IN ('aberto', 'parcial', 'vencido') AND composicao.saldo > 0
         ORDER BY parcelas.data_vencimento DESC, parcelas.id DESC`, [input.tenantId, input.saleId])).rows
      const openTotal = open.reduce((sum, row) => sum + cents(Number(row.saldo)), 0)
      if (openTotal < cents(total)) throw new ErpDomainError('VALIDATION_ERROR',
        `A venda tem ${fromCents(openTotal).toFixed(2)} em aberto, menos que a devolução (${total.toFixed(2)}). Use crédito ou reembolso.`, 409)
      const account = await defaultAccount(client, input.tenantId, sale.conta_financeira_id)
      let remaining = cents(total)
      for (const row of open) {
        if (remaining <= 0) break
        const part = Math.min(remaining, cents(Number(row.saldo)))
        await settleWithoutCash(client, { ...input, parcelaId: Number(row.id), valor: fromCents(part), data: date, contaId: account, origem: 'devolucao',
          devolucaoId: returnId, key: `devolucao:${input.idempotencyKey}:${row.id}`, observacao: `Abatimento da devolução ${numero}` })
        remaining -= part
      }
    }
    // Comissão do item devolvido é reduzida (sem ficar abaixo do que já foi pago).
    for (const item of items) await client.query(
      `UPDATE erp.comissoes_lancamentos SET valor_base = greatest(valor_base - $3, 0),
         valor = greatest(round(greatest(valor_base - $3, 0) * percentual / 100, 2), valor_pago), atualizado_por = $4
       WHERE empresa_id = $1 AND venda_item_id = $2 AND status = 'ativa'`, [input.tenantId, item.vendaItemId, item.valor, input.actorId])
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       SELECT $1, $2, 'devolucao_registrada', status, status, versao, $3::jsonb, $4 FROM erp.vendas WHERE empresa_id = $1 AND id = $2`,
      [input.tenantId, input.saleId, JSON.stringify({ devolucao_id: returnId, numero, tratamento: v.tratamento, valor: total }), input.actorId])
    return readReturn(client, input.tenantId, returnId)
  })
}

async function readReturn(client: Query, tenantId: number, id: number) {
  const record = (await client.query(
    `SELECT d.id::text, d.numero, d.venda_id::text, v.numero AS venda, d.cliente_id::text, c.nome AS cliente, d.data_devolucao::text, d.motivo,
       d.tratamento, d.valor_total, d.valor_credito, d.conta_pagar_id::text, d.documento_estoque_id::text,
       d.valor_credito - coalesce((SELECT sum(p.valor) FROM erp.pagamentos p WHERE p.empresa_id = d.empresa_id AND p.devolucao_id = d.id
         AND p.origem = 'credito_cliente' AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL), 0) AS credito_disponivel
     FROM erp.devolucoes d
     JOIN erp.vendas v ON v.empresa_id = d.empresa_id AND v.id = d.venda_id
     JOIN erp.entidades c ON c.empresa_id = d.empresa_id AND c.id = d.cliente_id
     WHERE d.empresa_id = $1 AND d.id = $2`, [tenantId, id])).rows[0]
  if (!record) throw new ErpDomainError('NOT_FOUND', 'Devolução não encontrada.', 404)
  const items = (await client.query(
    `SELECT di.venda_item_id::text, i.descricao, di.quantidade, di.valor FROM erp.devolucoes_itens di
     JOIN erp.vendas_itens i ON i.empresa_id = di.empresa_id AND i.id = di.venda_item_id
     WHERE di.empresa_id = $1 AND di.devolucao_id = $2 ORDER BY di.id`, [tenantId, id])).rows
  return { record, items }
}
const reader = { query: async (sql: string, params?: unknown[]) => ({ rows: await runQuery<Record<string, unknown>>(sql, params ?? []) }) }
export const getSaleReturn = (tenantId: number, id: number) => readReturn(reader, tenantId, id)

export async function listSaleReturns(tenantId: number, input: { vendaId?: number; clienteId?: number; comCredito?: boolean; page?: number; pageSize?: number } = {}) {
  const limit = Math.min(100, Math.max(1, Number(input.pageSize) || 20)), offset = (Math.max(1, Number(input.page) || 1) - 1) * limit
  const rows = await runQuery(
    `SELECT * FROM (
       SELECT d.id::text, d.numero, d.venda_id::text, v.numero AS venda, d.cliente_id::text, c.nome AS cliente, d.data_devolucao::text, d.tratamento,
         d.valor_total, d.valor_credito - coalesce((SELECT sum(p.valor) FROM erp.pagamentos p WHERE p.empresa_id = d.empresa_id AND p.devolucao_id = d.id
           AND p.origem = 'credito_cliente' AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL), 0) AS credito_disponivel
       FROM erp.devolucoes d
       JOIN erp.vendas v ON v.empresa_id = d.empresa_id AND v.id = d.venda_id
       JOIN erp.entidades c ON c.empresa_id = d.empresa_id AND c.id = d.cliente_id
       WHERE d.empresa_id = $1 AND ($2::bigint IS NULL OR d.venda_id = $2) AND ($3::bigint IS NULL OR d.cliente_id = $3)
     ) x WHERE NOT $4::boolean OR credito_disponivel > 0
     ORDER BY data_devolucao DESC, id DESC LIMIT $5 OFFSET $6`,
    [tenantId, input.vendaId ?? null, input.clienteId ?? null, Boolean(input.comCredito), limit + 1, offset])
  return { records: rows.slice(0, limit), hasMore: rows.length > limit, page: Math.max(1, Number(input.page) || 1), pageSize: limit }
}

// Usa o crédito de uma devolução para quitar (total ou em parte) uma parcela a receber do mesmo cliente.
export async function useCustomerCredit(input: Actor & { returnId: number; idempotencyKey: string; values: CreditUseValues }) {
  const v = input.values
  return withTransaction(async (client) => {
    const replay = await client.query('SELECT id::text FROM erp.pagamentos WHERE empresa_id = $1 AND chave_idempotencia = $2', [input.tenantId, `credito:${input.idempotencyKey}`])
    if (replay.rows[0]) return { pagamento_id: replay.rows[0].id, repetido: true, ...(await readReturn(client, input.tenantId, input.returnId)) }
    if (!(await hasCapability(client, input.tenantId, 'erp.financeiro.baixar')) && !(await hasCapability(client, input.tenantId, 'erp.financeiro.gerenciar')))
      throw new ErpDomainError('ACCESS_DENIED', 'Seu perfil não permite registrar baixas.', 403)
    const credit = (await client.query(
      `SELECT d.id, d.numero, d.cliente_id, d.valor_credito - coalesce((SELECT sum(p.valor) FROM erp.pagamentos p WHERE p.empresa_id = d.empresa_id AND p.devolucao_id = d.id
         AND p.origem = 'credito_cliente' AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL), 0) AS disponivel
       FROM erp.devolucoes d WHERE d.empresa_id = $1 AND d.id = $2 AND d.tratamento = 'credito' FOR UPDATE`, [input.tenantId, input.returnId])).rows[0]
    if (!credit) throw new ErpDomainError('NOT_FOUND', 'Crédito de devolução não encontrado.', 404)
    if (cents(v.valor) > cents(Number(credit.disponivel))) throw new ErpDomainError('VALIDATION_ERROR', `Crédito disponível: ${Number(credit.disponivel).toFixed(2)}.`, 409)
    const parcel = (await client.query(
      `SELECT parcelas.id, composicao.saldo, contas.cliente_id FROM erp.contas_receber_parcelas parcelas
       JOIN erp.contas_receber contas ON contas.empresa_id = parcelas.empresa_id AND contas.id = parcelas.conta_receber_id
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.id = $2 AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL
         AND parcelas.status IN ('aberto', 'parcial', 'vencido')`, [input.tenantId, v.parcela_id])).rows[0]
    if (!parcel || String(parcel.cliente_id) !== String(credit.cliente_id)) throw new ErpDomainError('VALIDATION_ERROR', 'Escolha uma parcela em aberto do mesmo cliente.')
    if (cents(v.valor) > cents(Number(parcel.saldo))) throw new ErpDomainError('VALIDATION_ERROR', `Saldo da parcela: ${Number(parcel.saldo).toFixed(2)}.`, 409)
    const date = v.data || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date })
    const account = await defaultAccount(client, input.tenantId, null)
    await settleWithoutCash(client, { ...input, parcelaId: Number(parcel.id), valor: v.valor, data: date, contaId: account, origem: 'credito_cliente',
      devolucaoId: input.returnId, key: `credito:${input.idempotencyKey}`, observacao: `Crédito da devolução ${credit.numero}` })
    return readReturn(client, input.tenantId, input.returnId)
  })
}
