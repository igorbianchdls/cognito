const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { Client } = require('pg')

for (const file of ['.env.local', '.env', '.env.development.local', '.env.development', '.env.production.local', '.env.production']) {
  const envPath = path.join(process.cwd(), file)
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
}

const TENANT_ID = 1
const REFERENCE_DATE = '2026-05-19'
const MONTHS = [
  { key: '2026-01', month: 1, days: 31, sales: 80, purchases: 35, manualReceivable: 18, manualPayable: 36 },
  { key: '2026-02', month: 2, days: 28, sales: 90, purchases: 40, manualReceivable: 18, manualPayable: 38 },
  { key: '2026-03', month: 3, days: 31, sales: 105, purchases: 45, manualReceivable: 20, manualPayable: 40 },
  { key: '2026-04', month: 4, days: 30, sales: 115, purchases: 50, manualReceivable: 22, manualPayable: 44 },
  { key: '2026-05', month: 5, days: 31, sales: 150, purchases: 60, manualReceivable: 25, manualPayable: 48 },
  { key: '2026-06', month: 6, days: 30, sales: 70, purchases: 30, manualReceivable: 15, manualPayable: 30 },
]

const dbUrl = (process.env.SUPABASE_DB_URL || '').trim()
if (!dbUrl) {
  console.error('missing SUPABASE_DB_URL')
  process.exit(1)
}

function createRng(seed = 20260519) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const rng = createRng()

function pad2(value) {
  return String(value).padStart(2, '0')
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function randomInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pick(list) {
  if (!list.length) throw new Error('tentativa de escolher item em lista vazia')
  return list[Math.floor(rng() * list.length)]
}

function weighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = rng() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item.value
  }
  return items[items.length - 1].value
}

function dateFor(month, day = randomInt(1, month.days)) {
  return `2026-${pad2(month.month)}-${pad2(day)}`
}

function timestampFor(date) {
  return `${date} ${pad2(randomInt(8, 18))}:${pad2(randomInt(0, 59))}:${pad2(randomInt(0, 59))}`
}

function addDays(dateIso, days) {
  const date = new Date(`${isoDate(dateIso)}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

function isoDate(value) {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`
  }
  return String(value).slice(0, 10)
}

function isBeforeReference(dateIso) {
  return isoDate(dateIso) < REFERENCE_DATE
}

function monthFactor(monthKey, kind) {
  const factors = {
    receita: {
      '2026-01': 0.92,
      '2026-02': 0.98,
      '2026-03': 1.04,
      '2026-04': 1.12,
      '2026-05': 1.28,
      '2026-06': 0.72,
    },
    despesa: {
      '2026-01': 0.9,
      '2026-02': 0.96,
      '2026-03': 1.03,
      '2026-04': 1.1,
      '2026-05': 1.32,
      '2026-06': 0.95,
    },
  }
  return factors[kind][monthKey] || 1
}

function maybeNull(value, chance) {
  return rng() < chance ? null : value
}

async function queryRows(client, sql, params = []) {
  const result = await client.query(sql, params)
  return result.rows
}

async function loadMasters(client) {
  const [
    clientes,
    fornecedores,
    canais,
    vendedores,
    categoriasReceita,
    categoriasDespesa,
    centrosLucro,
    centrosCusto,
    departamentos,
    filiais,
    unidades,
    contasFinanceiras,
    metodosPagamento,
    produtos,
    servicos,
  ] = await Promise.all([
    queryRows(client, `SELECT id, nome_fantasia AS nome FROM entidades.clientes WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome_fantasia AS nome FROM entidades.fornecedores ORDER BY id`),
    queryRows(client, `SELECT id, nome FROM vendas.canais_venda ORDER BY id`),
    queryRows(client, `SELECT id FROM comercial.vendedores ORDER BY id`),
    queryRows(client, `SELECT id, nome FROM financeiro.categorias_receita WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM financeiro.categorias_despesa WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.centros_lucro WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.centros_custo WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.departamentos WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome, unidade_negocio_id FROM empresa.filiais WHERE COALESCE(ativo, true) = true ORDER BY id`),
    queryRows(client, `SELECT id, nome FROM empresa.unidades_negocio WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome_conta AS nome FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM financeiro.metodos_pagamento WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM produtos.produto WHERE COALESCE(ativo, true) = true ORDER BY id`),
    queryRows(client, `SELECT id, nome FROM servicos.catalogo_servicos ORDER BY id`),
  ])

  const required = {
    clientes,
    fornecedores,
    canais,
    vendedores,
    categoriasReceita,
    categoriasDespesa,
    centrosLucro,
    centrosCusto,
    departamentos,
    filiais,
    unidades,
    contasFinanceiras,
    metodosPagamento,
    produtos,
    servicos,
  }

  for (const [name, rows] of Object.entries(required)) {
    if (!rows.length) throw new Error(`cadastro mestre vazio: ${name}`)
  }

  return required
}

async function nextIds(client) {
  const rows = await queryRows(client, `
    SELECT 'contas_receber' AS name, COALESCE(MAX(id), 0)::bigint AS max_id FROM financeiro.contas_receber
    UNION ALL SELECT 'contas_pagar', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_pagar
    UNION ALL SELECT 'contas_receber_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_receber_linhas
    UNION ALL SELECT 'contas_pagar_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_pagar_linhas
    UNION ALL SELECT 'pagamentos_recebidos', COALESCE(MAX(id), 0)::bigint FROM financeiro.pagamentos_recebidos
    UNION ALL SELECT 'pagamentos_recebidos_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.pagamentos_recebidos_linhas
    UNION ALL SELECT 'pagamentos_efetuados', COALESCE(MAX(id), 0)::bigint FROM financeiro.pagamentos_efetuados
    UNION ALL SELECT 'pagamentos_efetuados_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.pagamentos_efetuados_linhas
  `)
  const counters = {}
  for (const row of rows) counters[row.name] = Number(row.max_id)
  return (name) => {
    counters[name] += 1
    return counters[name]
  }
}

async function insertRows(client, table, columns, rows, returning = '') {
  if (!rows.length) return []
  const inserted = []
  const chunkSize = 250
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const params = []
    const values = []
    for (let r = 0; r < chunk.length; r += 1) {
      const base = r * columns.length
      values.push(`(${columns.map((_, c) => `$${base + c + 1}`).join(', ')})`)
      for (const column of columns) params.push(chunk[r][column] ?? null)
    }
    const result = await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')} ${returning}`,
      params,
    )
    inserted.push(...result.rows)
  }
  return inserted
}

async function resetTransactionalData(client) {
  await client.query(`DELETE FROM financeiro.pagamentos_recebidos_linhas WHERE pagamento_id IN (SELECT id FROM financeiro.pagamentos_recebidos WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_efetuados_linhas WHERE pagamento_id IN (SELECT id FROM financeiro.pagamentos_efetuados WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.liquidacoes WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_recebidos WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_efetuados WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_receber_linhas WHERE conta_receber_id IN (SELECT id FROM financeiro.contas_receber WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_pagar_linhas WHERE conta_pagar_id IN (SELECT id FROM financeiro.contas_pagar WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_receber WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_pagar WHERE tenant_id = $1`, [TENANT_ID])

  await client.query(`DELETE FROM vendas.cupons_uso WHERE pedido_id IN (SELECT id FROM vendas.pedidos WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM vendas.devolucoes WHERE pedido_id IN (SELECT id FROM vendas.pedidos WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM vendas.pedidos_pagamentos WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM vendas.pedidos_itens WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM vendas.pedidos WHERE tenant_id = $1`, [TENANT_ID])

  await client.query(`DELETE FROM compras.devolucoes_compra WHERE compra_id IN (SELECT id FROM compras.compras WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM compras.recebimentos WHERE compra_id IN (SELECT id FROM compras.compras WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM compras.compras_linhas WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM compras.compras WHERE tenant_id = $1`, [TENANT_ID])
}

function buildSaleRows(masters) {
  const rows = []
  for (const month of MONTHS) {
    for (let i = 0; i < month.sales; i += 1) {
      const cliente = pick(masters.clientes)
      const canal = pick(masters.canais)
      const filial = pick(masters.filiais)
      const unidadeId = filial.unidade_negocio_id || pick(masters.unidades).id
      const date = dateFor(month)
      const base = randomInt(620, 7800) * monthFactor(month.key, 'receita')
      const subtotal = round2(base * (0.96 + rng() * 0.18))
      const desconto = round2(subtotal * weighted([
        { value: 0, weight: 55 },
        { value: 0.03, weight: 22 },
        { value: 0.06, weight: 14 },
        { value: 0.1, weight: 9 },
      ]))
      const valor = round2(subtotal - desconto)
      const status = weighted([
        { value: 'concluido', weight: month.month <= 4 ? 58 : 34 },
        { value: 'aprovado', weight: 23 },
        { value: 'pendente', weight: month.month >= 5 ? 34 : 14 },
        { value: 'cancelado', weight: 5 },
      ])

      rows.push({
        tenant_id: TENANT_ID,
        cliente_id: cliente.id,
        vendedor_id: pick(masters.vendedores).id,
        territorio_id: null,
        canal_venda_id: canal.id,
        data_pedido: timestampFor(date),
        status,
        subtotal,
        desconto_total: desconto,
        valor_total: valor,
        criado_em: timestampFor(date),
        atualizado_em: timestampFor(date),
        cupom_id: null,
        centro_lucro_id: maybeNull(pick(masters.centrosLucro).id, 0.03),
        campanha_venda_id: null,
        filial_id: filial.id,
        unidade_negocio_id: unidadeId,
        sales_office_id: null,
        observacoes: status === 'cancelado' ? 'Pedido cancelado por revisao comercial antes do faturamento.' : 'Pedido gerado para base demo integrada.',
        descricao: `Pedido demo ${month.key} - ${cliente.nome}`,
        categoria_receita_id: maybeNull(pick(masters.categoriasReceita).id, 0.03),
        data_documento: date,
        data_lancamento: date,
        data_vencimento: addDays(date, randomInt(7, 28)),
        departamento_id: pick(masters.departamentos).id,
      })
    }
  }
  return rows
}

function buildPurchaseRows(masters) {
  const rows = []
  let index = 1
  for (const month of MONTHS) {
    for (let i = 0; i < month.purchases; i += 1) {
      const fornecedor = pick(masters.fornecedores)
      const filial = pick(masters.filiais)
      const date = dateFor(month)
      const valor = round2(randomInt(1800, 39000) * monthFactor(month.key, 'despesa') * (0.82 + rng() * 0.38))
      const status = weighted([
        { value: 'recebido', weight: month.month <= 4 ? 34 : 18 },
        { value: 'recebimento_parcial', weight: 18 },
        { value: 'aprovado', weight: month.month >= 5 ? 42 : 28 },
        { value: 'em_analise', weight: 15 },
        { value: 'cancelado', weight: 5 },
      ])

      rows.push({
        tenant_id: TENANT_ID,
        fornecedor_id: fornecedor.id,
        filial_id: filial.id,
        centro_custo_id: maybeNull(pick(masters.centrosCusto).id, 0.03),
        projeto_id: null,
        categoria_financeira_id: null,
        numero_oc: `OC-2026-${pad2(month.month)}-${String(index++).padStart(5, '0')}`,
        data_pedido: date,
        data_entrega_prevista: addDays(date, randomInt(3, 18)),
        status,
        valor_total: valor,
        observacoes: status === 'cancelado' ? 'Compra cancelada por renegociacao com fornecedor.' : 'Compra demo integrada ao contas a pagar.',
        criado_por: null,
        criado_em: timestampFor(date),
        atualizado_em: timestampFor(date),
        categoria_despesa_id: maybeNull(pick(masters.categoriasDespesa).id, 0.03),
        data_documento: date,
        data_lancamento: date,
        data_vencimento: addDays(date, randomInt(10, 35)),
        departamento_id: pick(masters.departamentos).id,
      })
    }
  }
  return rows
}

function termsForOrder(total, status) {
  if (status === 'cancelado') return rng() < 0.55 ? 0 : 1
  if (total > 6200 && rng() < 0.4) return 3
  if (total > 2500 && rng() < 0.62) return 2
  return 1
}

function receivableStatus(orderStatus, dueDate) {
  if (orderStatus === 'cancelado') return 'cancelado'
  if (!isBeforeReference(dueDate)) {
    return weighted([
      { value: 'pendente', weight: 70 },
      { value: 'recebido', weight: 18 },
      { value: 'parcial', weight: 8 },
      { value: 'cancelado', weight: 4 },
    ])
  }
  return weighted([
    { value: 'recebido', weight: 58 },
    { value: 'vencido', weight: 19 },
    { value: 'parcial', weight: 14 },
    { value: 'pendente', weight: 6 },
    { value: 'cancelado', weight: 3 },
  ])
}

function payableStatus(purchaseStatus, dueDate) {
  if (purchaseStatus === 'cancelado') return 'cancelado'
  if (purchaseStatus === 'em_analise' && rng() < 0.75) return 'pendente'
  if (!isBeforeReference(dueDate)) {
    return weighted([
      { value: 'pendente', weight: 72 },
      { value: 'pago', weight: 15 },
      { value: 'parcial', weight: 9 },
      { value: 'cancelado', weight: 4 },
    ])
  }
  return weighted([
    { value: 'pago', weight: 54 },
    { value: 'vencido', weight: 20 },
    { value: 'parcial', weight: 16 },
    { value: 'pendente', weight: 7 },
    { value: 'cancelado', weight: 3 },
  ])
}

function splitAmount(total, parts) {
  const base = Math.floor((total / parts) * 100) / 100
  const values = Array(parts).fill(base)
  values[parts - 1] = round2(total - base * (parts - 1))
  return values
}

function buildFinancialRowsFromSales(sales, masters, nextId) {
  const contas = []
  const linhas = []
  for (const sale of sales) {
    const terms = termsForOrder(Number(sale.valor_total), sale.status)
    if (!terms) continue
    const values = splitAmount(Number(sale.valor_total), terms)
    for (let i = 0; i < terms; i += 1) {
      const dueDate = addDays(sale.data_documento, 14 + i * 30 + randomInt(-2, 4))
      const status = receivableStatus(sale.status, dueDate)
      const value = values[i]
      const id = nextId('contas_receber')
      const discount = round2(value * (rng() < 0.12 ? randomInt(1, 5) / 100 : 0))
      const taxes = round2(value * (rng() < 0.28 ? randomInt(1, 4) / 100 : 0))
      const liquid = round2(value - discount + taxes)
      contas.push({
        id,
        tenant_id: TENANT_ID,
        numero_documento: `CR-${String(sale.id).padStart(5, '0')}-${i + 1}/${terms}`,
        serie_documento: 'R26',
        tipo_documento: terms > 1 ? 'fatura' : 'nota_fiscal',
        moeda: 'BRL',
        cliente_id: sale.cliente_id,
        nome_cliente_snapshot: sale.cliente_nome,
        data_documento: isoDate(sale.data_documento),
        data_lancamento: isoDate(sale.data_lancamento),
        data_vencimento: dueDate,
        valor_bruto: value,
        valor_desconto: discount,
        valor_impostos: taxes,
        valor_liquido: liquid,
        status,
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: sale.departamento_id,
        projeto_id: null,
        filial_id: sale.filial_id,
        unidade_negocio_id: sale.unidade_negocio_id,
        observacao: status === 'vencido' ? 'Recebivel vencido de pedido de venda; exige acao de cobranca.' : 'Recebivel derivado automaticamente de pedido de venda.',
        lancamento_contabil_id: null,
        criado_em: sale.criado_em,
        atualizado_em: sale.atualizado_em,
        criado_por: null,
        centro_lucro_id: sale.centro_lucro_id,
        categoria_receita_id: sale.categoria_receita_id,
        pedido_id: sale.id,
      })
      linhas.push({
        id: nextId('contas_receber_linhas'),
        conta_receber_id: id,
        tipo_linha: 'servico',
        produto_id: null,
        servico_id: pick(masters.servicos).id,
        descricao: `Parcela ${i + 1}/${terms} do pedido ${sale.id}`,
        quantidade: 1,
        valor_unitario: value,
        valor_bruto: value,
        desconto: discount,
        impostos: taxes,
        valor_liquido: liquid,
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: sale.departamento_id,
        projeto_id: null,
        unidade_negocio_id: sale.unidade_negocio_id,
        criado_em: sale.criado_em,
      })
    }
  }
  return { contas, linhas }
}

function buildFinancialRowsFromPurchases(purchases, masters, nextId) {
  const contas = []
  const linhas = []
  for (const purchase of purchases) {
    const terms = purchase.status === 'cancelado' ? (rng() < 0.6 ? 0 : 1) : (Number(purchase.valor_total) > 16000 && rng() < 0.55 ? 2 : 1)
    if (!terms) continue
    const values = splitAmount(Number(purchase.valor_total), terms)
    for (let i = 0; i < terms; i += 1) {
      const dueDate = addDays(purchase.data_documento, 12 + i * 28 + randomInt(-2, 6))
      const status = payableStatus(purchase.status, dueDate)
      const value = values[i]
      const id = nextId('contas_pagar')
      const discount = round2(value * (rng() < 0.1 ? randomInt(1, 4) / 100 : 0))
      const taxes = round2(value * (rng() < 0.22 ? randomInt(1, 7) / 100 : 0))
      const liquid = round2(value - discount + taxes)
      const contaFinanceiraId = status === 'pago' || status === 'parcial' ? pick(masters.contasFinanceiras).id : null
      const unidadeNegocioId = purchase.unidade_negocio_id || pick(masters.unidades).id
      contas.push({
        id,
        tenant_id: TENANT_ID,
        numero_documento: `CP-${purchase.numero_oc}-${i + 1}/${terms}`,
        serie_documento: 'P26',
        tipo_documento: terms > 1 ? 'fatura' : 'nota_fiscal',
        moeda: 'BRL',
        fornecedor_id: purchase.fornecedor_id,
        nome_fornecedor_snapshot: purchase.fornecedor_nome,
        data_documento: isoDate(purchase.data_documento),
        data_lancamento: isoDate(purchase.data_lancamento),
        data_vencimento: dueDate,
        valor_bruto: value,
        valor_desconto: discount,
        valor_impostos: taxes,
        valor_liquido: liquid,
        status,
        categoria_financeira_id: null,
        centro_custo_id: purchase.centro_custo_id,
        departamento_id: purchase.departamento_id,
        projeto_id: purchase.projeto_id,
        filial_id: purchase.filial_id,
        unidade_negocio_id: unidadeNegocioId,
        observacao: status === 'vencido' ? 'Conta vencida associada a compra; revisar prazo com fornecedor.' : 'Conta derivada automaticamente de ordem de compra.',
        criado_em: purchase.criado_em,
        atualizado_em: purchase.atualizado_em,
        criado_por: null,
        categoria_despesa_id: purchase.categoria_despesa_id,
        lancamento_contabil_id: null,
        conta_financeira_id: contaFinanceiraId,
        compra_id: purchase.id,
      })
      linhas.push({
        id: nextId('contas_pagar_linhas'),
        conta_pagar_id: id,
        tipo_linha: 'despesa',
        produto_id: pick(masters.produtos).id,
        servico_id: null,
        descricao: `Parcela ${i + 1}/${terms} da compra ${purchase.numero_oc}`,
        quantidade: 1,
        valor_unitario: value,
        valor_bruto: value,
        desconto: discount,
        impostos: taxes,
        valor_liquido: liquid,
        categoria_financeira_id: null,
        centro_custo_id: purchase.centro_custo_id,
        departamento_id: purchase.departamento_id,
        projeto_id: purchase.projeto_id,
        criado_em: purchase.criado_em,
        categoria_despesa_id: purchase.categoria_despesa_id,
        unidade_negocio_id: unidadeNegocioId,
      })
    }
  }
  return { contas, linhas }
}

function buildManualReceivables(masters, nextId) {
  const contas = []
  const linhas = []
  let index = 1
  for (const month of MONTHS) {
    for (let i = 0; i < month.manualReceivable; i += 1) {
      const cliente = pick(masters.clientes)
      const filial = pick(masters.filiais)
      const date = dateFor(month)
      const dueDate = addDays(date, randomInt(10, 30))
      const status = receivableStatus('aprovado', dueDate)
      const bruto = round2(randomInt(900, 9500) * monthFactor(month.key, 'receita'))
      const id = nextId('contas_receber')
      const centroLucroId = maybeNull(pick(masters.centrosLucro).id, 0.04)
      const categoriaId = maybeNull(pick(masters.categoriasReceita).id, 0.04)
      const unidadeId = filial.unidade_negocio_id || pick(masters.unidades).id
      contas.push({
        id,
        tenant_id: TENANT_ID,
        numero_documento: `CR-MAN-2026-${pad2(month.month)}-${String(index++).padStart(4, '0')}`,
        serie_documento: 'R26',
        tipo_documento: weighted([{ value: 'contrato', weight: 45 }, { value: 'fatura', weight: 35 }, { value: 'outro', weight: 20 }]),
        moeda: 'BRL',
        cliente_id: cliente.id,
        nome_cliente_snapshot: cliente.nome,
        data_documento: date,
        data_lancamento: date,
        data_vencimento: dueDate,
        valor_bruto: bruto,
        valor_desconto: 0,
        valor_impostos: round2(bruto * (rng() < 0.25 ? 0.02 : 0)),
        valor_liquido: round2(bruto * (rng() < 0.25 ? 1.02 : 1)),
        status,
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: pick(masters.departamentos).id,
        projeto_id: null,
        filial_id: filial.id,
        unidade_negocio_id: unidadeId,
        observacao: 'Recebivel manual/recorrente sem pedido de venda, usado para simular contratos e ajustes.',
        lancamento_contabil_id: null,
        criado_em: timestampFor(date),
        atualizado_em: timestampFor(date),
        criado_por: null,
        centro_lucro_id: centroLucroId,
        categoria_receita_id: categoriaId,
        pedido_id: null,
      })
      linhas.push({
        id: nextId('contas_receber_linhas'),
        conta_receber_id: id,
        tipo_linha: 'servico',
        produto_id: null,
        servico_id: pick(masters.servicos).id,
        descricao: 'Receita recorrente/manual',
        quantidade: 1,
        valor_unitario: contas[contas.length - 1].valor_bruto,
        valor_bruto: contas[contas.length - 1].valor_bruto,
        desconto: 0,
        impostos: contas[contas.length - 1].valor_impostos,
        valor_liquido: contas[contas.length - 1].valor_liquido,
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: contas[contas.length - 1].departamento_id,
        projeto_id: null,
        unidade_negocio_id: unidadeId,
        criado_em: contas[contas.length - 1].criado_em,
      })
    }
  }
  return { contas, linhas }
}

function buildManualPayables(masters, nextId) {
  const contas = []
  const linhas = []
  let index = 1
  const descriptions = ['Folha e encargos', 'Aluguel e condominio', 'SaaS e infraestrutura', 'Marketing recorrente', 'Honorarios contabeis', 'Tarifas bancarias', 'Impostos e taxas']
  for (const month of MONTHS) {
    for (let i = 0; i < month.manualPayable; i += 1) {
      const fornecedor = pick(masters.fornecedores)
      const filial = pick(masters.filiais)
      const date = dateFor(month)
      const dueDate = addDays(date, randomInt(8, 32))
      const status = payableStatus('aprovado', dueDate)
      const bruto = round2(randomInt(700, 26000) * monthFactor(month.key, 'despesa'))
      const id = nextId('contas_pagar')
      const centroCustoId = maybeNull(pick(masters.centrosCusto).id, 0.04)
      const categoriaId = maybeNull(pick(masters.categoriasDespesa).id, 0.04)
      const unidadeId = filial.unidade_negocio_id || pick(masters.unidades).id
      const contaFinanceiraId = status === 'pago' || status === 'parcial' ? pick(masters.contasFinanceiras).id : null
      const descricao = pick(descriptions)
      contas.push({
        id,
        tenant_id: TENANT_ID,
        numero_documento: `CP-MAN-2026-${pad2(month.month)}-${String(index++).padStart(4, '0')}`,
        serie_documento: 'P26',
        tipo_documento: weighted([{ value: 'fatura', weight: 42 }, { value: 'nota_fiscal', weight: 38 }, { value: 'recibo', weight: 12 }, { value: 'outro', weight: 8 }]),
        moeda: 'BRL',
        fornecedor_id: fornecedor.id,
        nome_fornecedor_snapshot: fornecedor.nome,
        data_documento: date,
        data_lancamento: date,
        data_vencimento: dueDate,
        valor_bruto: bruto,
        valor_desconto: round2(bruto * (rng() < 0.1 ? 0.02 : 0)),
        valor_impostos: round2(bruto * (rng() < 0.18 ? 0.04 : 0)),
        valor_liquido: 0,
        status,
        categoria_financeira_id: null,
        centro_custo_id: centroCustoId,
        departamento_id: pick(masters.departamentos).id,
        projeto_id: null,
        filial_id: filial.id,
        unidade_negocio_id: unidadeId,
        observacao: `${descricao}; despesa operacional sem ordem de compra.`,
        criado_em: timestampFor(date),
        atualizado_em: timestampFor(date),
        criado_por: null,
        categoria_despesa_id: categoriaId,
        lancamento_contabil_id: null,
        conta_financeira_id: contaFinanceiraId,
        compra_id: null,
      })
      const last = contas[contas.length - 1]
      last.valor_liquido = round2(last.valor_bruto - last.valor_desconto + last.valor_impostos)
      linhas.push({
        id: nextId('contas_pagar_linhas'),
        conta_pagar_id: id,
        tipo_linha: 'despesa',
        produto_id: null,
        servico_id: null,
        descricao,
        quantidade: 1,
        valor_unitario: last.valor_bruto,
        valor_bruto: last.valor_bruto,
        desconto: last.valor_desconto,
        impostos: last.valor_impostos,
        valor_liquido: last.valor_liquido,
        categoria_financeira_id: null,
        centro_custo_id: last.centro_custo_id,
        departamento_id: last.departamento_id,
        projeto_id: null,
        criado_em: last.criado_em,
        categoria_despesa_id: last.categoria_despesa_id,
        unidade_negocio_id: unidadeId,
      })
    }
  }
  return { contas, linhas }
}

function buildReceipts(contasReceber, masters, nextId) {
  const payments = []
  const lines = []
  for (const conta of contasReceber) {
    if (conta.status !== 'recebido' && conta.status !== 'parcial') continue
    const ratio = conta.status === 'parcial' ? (0.35 + rng() * 0.42) : 1
    const original = Number(conta.valor_liquido)
    const juros = conta.data_vencimento < REFERENCE_DATE && rng() < 0.24 ? round2(original * randomInt(1, 4) / 100) : 0
    const multa = conta.data_vencimento < REFERENCE_DATE && rng() < 0.18 ? round2(original * 0.02) : 0
    const desconto = rng() < 0.1 ? round2(original * randomInt(1, 3) / 100) : 0
    const received = round2((original - desconto + juros + multa) * ratio)
    const saldo = conta.status === 'parcial' ? round2(original - received) : 0
    const date = addDays(conta.data_vencimento, conta.status === 'parcial' ? randomInt(-3, 6) : randomInt(-6, 8))
    const paymentId = nextId('pagamentos_recebidos')
    payments.push({
      id: paymentId,
      tenant_id: TENANT_ID,
      numero_pagamento: `PR-2026-${String(paymentId).padStart(6, '0')}`,
      data_recebimento: date,
      data_lancamento: date,
      conta_financeira_id: pick(masters.contasFinanceiras).id,
      metodo_pagamento_id: pick(masters.metodosPagamento).id,
      moeda: 'BRL',
      valor_total_recebido: received,
      status: 'confirmado',
      observacao: `${conta.status === 'parcial' ? 'Recebimento parcial' : 'Recebimento confirmado'} de ${conta.numero_documento}`,
      criado_em: timestampFor(date),
      atualizado_em: timestampFor(date),
      criado_por: null,
    })
    lines.push({
      id: nextId('pagamentos_recebidos_linhas'),
      pagamento_id: paymentId,
      conta_receber_id: conta.id,
      valor_original_documento: original,
      valor_recebido: received,
      saldo_apos_recebimento: saldo,
      desconto_financeiro: desconto,
      juros,
      multa,
      criado_em: timestampFor(date),
    })
  }
  return { payments, lines }
}

function buildPayments(contasPagar, masters, nextId) {
  const payments = []
  const lines = []
  for (const conta of contasPagar) {
    if (conta.status !== 'pago' && conta.status !== 'parcial') continue
    const ratio = conta.status === 'parcial' ? (0.38 + rng() * 0.4) : 1
    const original = Number(conta.valor_liquido)
    const juros = conta.data_vencimento < REFERENCE_DATE && rng() < 0.2 ? round2(original * randomInt(1, 4) / 100) : 0
    const multa = conta.data_vencimento < REFERENCE_DATE && rng() < 0.16 ? round2(original * 0.02) : 0
    const desconto = rng() < 0.12 ? round2(original * randomInt(1, 3) / 100) : 0
    const paid = round2((original - desconto + juros + multa) * ratio)
    const saldo = conta.status === 'parcial' ? round2(original - paid) : 0
    const date = addDays(conta.data_vencimento, conta.status === 'parcial' ? randomInt(-2, 7) : randomInt(-5, 5))
    const paymentId = nextId('pagamentos_efetuados')
    const contaFinanceiraId = conta.conta_financeira_id || pick(masters.contasFinanceiras).id
    conta.conta_financeira_id = contaFinanceiraId
    payments.push({
      id: paymentId,
      tenant_id: TENANT_ID,
      numero_pagamento: `PE-2026-${String(paymentId).padStart(6, '0')}`,
      data_pagamento: date,
      data_lancamento: date,
      conta_financeira_id: contaFinanceiraId,
      metodo_pagamento_id: pick(masters.metodosPagamento).id,
      moeda: 'BRL',
      valor_total_pagamento: paid,
      status: 'confirmado',
      observacao: `${conta.status === 'parcial' ? 'Pagamento parcial' : 'Pagamento confirmado'} de ${conta.numero_documento}`,
      criado_em: timestampFor(date),
      atualizado_em: timestampFor(date),
      criado_por: null,
      lancamento_contabil_id: null,
    })
    lines.push({
      id: nextId('pagamentos_efetuados_linhas'),
      pagamento_id: paymentId,
      conta_pagar_id: conta.id,
      valor_original_documento: original,
      valor_pago: paid,
      saldo_apos_pagamento: saldo,
      desconto_financeiro: desconto,
      juros,
      multa,
      criado_em: timestampFor(date),
    })
  }
  return { payments, lines }
}

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    query_timeout: 120000,
    statement_timeout: 120000,
  })

  await client.connect()
  try {
    await client.query('BEGIN')
    const masters = await loadMasters(client)

    await resetTransactionalData(client)
    const nextId = await nextIds(client)

    const salesRows = buildSaleRows(masters)
    const sales = await insertRows(client, 'vendas.pedidos', [
      'tenant_id',
      'cliente_id',
      'vendedor_id',
      'territorio_id',
      'canal_venda_id',
      'data_pedido',
      'status',
      'subtotal',
      'desconto_total',
      'valor_total',
      'criado_em',
      'atualizado_em',
      'cupom_id',
      'centro_lucro_id',
      'campanha_venda_id',
      'filial_id',
      'unidade_negocio_id',
      'sales_office_id',
      'observacoes',
      'descricao',
      'categoria_receita_id',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'departamento_id',
    ], salesRows, 'RETURNING id, tenant_id, cliente_id, (SELECT nome_fantasia FROM entidades.clientes WHERE id = vendas.pedidos.cliente_id) AS cliente_nome, data_documento, data_lancamento, data_vencimento, status, valor_total, criado_em, atualizado_em, centro_lucro_id, categoria_receita_id, departamento_id, filial_id, unidade_negocio_id')

    const saleItemRows = sales.map((sale) => {
      const servico = pick(masters.servicos)
      const subtotal = Number(sale.valor_total)
      return {
        tenant_id: TENANT_ID,
        pedido_id: sale.id,
        produto_id: null,
        quantidade: 1,
        preco_unitario: subtotal,
        desconto: 0,
        subtotal,
        criado_em: sale.criado_em,
        atualizado_em: sale.atualizado_em,
        servico_id: servico.id,
      }
    })
    await insertRows(client, 'vendas.pedidos_itens', [
      'tenant_id',
      'pedido_id',
      'produto_id',
      'quantidade',
      'preco_unitario',
      'desconto',
      'subtotal',
      'criado_em',
      'atualizado_em',
      'servico_id',
    ], saleItemRows)

    const salePaymentRows = sales.map((sale) => ({
      tenant_id: TENANT_ID,
      pedido_id: sale.id,
      metodo_pagamento: weighted([{ value: 'boleto', weight: 34 }, { value: 'pix', weight: 28 }, { value: 'cartao', weight: 24 }, { value: 'transferencia', weight: 14 }]),
      valor: sale.valor_total,
      status: sale.status === 'cancelado' ? 'cancelado' : sale.status === 'pendente' ? 'pendente' : 'aprovado',
      transacao_externa_id: `TX-${String(sale.id).padStart(6, '0')}`,
      criado_em: sale.criado_em,
      atualizado_em: sale.atualizado_em,
    }))
    await insertRows(client, 'vendas.pedidos_pagamentos', [
      'tenant_id',
      'pedido_id',
      'metodo_pagamento',
      'valor',
      'status',
      'transacao_externa_id',
      'criado_em',
      'atualizado_em',
    ], salePaymentRows)

    const purchaseRows = buildPurchaseRows(masters)
    const purchases = await insertRows(client, 'compras.compras', [
      'tenant_id',
      'fornecedor_id',
      'filial_id',
      'centro_custo_id',
      'projeto_id',
      'categoria_financeira_id',
      'numero_oc',
      'data_pedido',
      'data_entrega_prevista',
      'status',
      'valor_total',
      'observacoes',
      'criado_por',
      'criado_em',
      'atualizado_em',
      'categoria_despesa_id',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'departamento_id',
    ], purchaseRows, 'RETURNING id, tenant_id, fornecedor_id, (SELECT nome_fantasia FROM entidades.fornecedores WHERE id = compras.compras.fornecedor_id) AS fornecedor_nome, numero_oc, data_documento, data_lancamento, data_vencimento, status, valor_total, criado_em, atualizado_em, centro_custo_id, categoria_despesa_id, departamento_id, filial_id, projeto_id, (SELECT unidade_negocio_id FROM empresa.filiais WHERE id = compras.compras.filial_id) AS unidade_negocio_id')

    const purchaseLineRows = purchases.map((purchase) => {
      const product = pick(masters.produtos)
      const total = Number(purchase.valor_total)
      const qty = randomInt(1, 12)
      return {
        tenant_id: TENANT_ID,
        compra_id: purchase.id,
        produto_id: product.id,
        quantidade: qty,
        quantidade_recebida: purchase.status === 'recebido' ? qty : purchase.status === 'recebimento_parcial' ? Math.max(1, Math.floor(qty / 2)) : 0,
        unidade_medida: 'un',
        preco_unitario: round2(total / qty),
        total,
        centro_custo_id: purchase.centro_custo_id,
        projeto_id: purchase.projeto_id,
        categoria_financeira_id: null,
        criado_em: purchase.criado_em,
        categoria_despesa_id: purchase.categoria_despesa_id,
      }
    })
    await insertRows(client, 'compras.compras_linhas', [
      'tenant_id',
      'compra_id',
      'produto_id',
      'quantidade',
      'quantidade_recebida',
      'unidade_medida',
      'preco_unitario',
      'total',
      'centro_custo_id',
      'projeto_id',
      'categoria_financeira_id',
      'criado_em',
      'categoria_despesa_id',
    ], purchaseLineRows)

    const derivedReceivables = buildFinancialRowsFromSales(sales, masters, nextId)
    const manualReceivables = buildManualReceivables(masters, nextId)
    const contasReceber = [...derivedReceivables.contas, ...manualReceivables.contas]
    const contasReceberLinhas = [...derivedReceivables.linhas, ...manualReceivables.linhas]

    const derivedPayables = buildFinancialRowsFromPurchases(purchases, masters, nextId)
    const manualPayables = buildManualPayables(masters, nextId)
    const contasPagar = [...derivedPayables.contas, ...manualPayables.contas]
    const contasPagarLinhas = [...derivedPayables.linhas, ...manualPayables.linhas]

    const receipts = buildReceipts(contasReceber, masters, nextId)
    const payments = buildPayments(contasPagar, masters, nextId)

    await insertRows(client, 'financeiro.contas_receber', [
      'id',
      'tenant_id',
      'numero_documento',
      'serie_documento',
      'tipo_documento',
      'moeda',
      'cliente_id',
      'nome_cliente_snapshot',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'valor_bruto',
      'valor_desconto',
      'valor_impostos',
      'valor_liquido',
      'status',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'filial_id',
      'unidade_negocio_id',
      'observacao',
      'lancamento_contabil_id',
      'criado_em',
      'atualizado_em',
      'criado_por',
      'centro_lucro_id',
      'categoria_receita_id',
      'pedido_id',
    ], contasReceber)
    await insertRows(client, 'financeiro.contas_receber_linhas', [
      'id',
      'conta_receber_id',
      'tipo_linha',
      'produto_id',
      'servico_id',
      'descricao',
      'quantidade',
      'valor_unitario',
      'valor_bruto',
      'desconto',
      'impostos',
      'valor_liquido',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'unidade_negocio_id',
      'criado_em',
    ], contasReceberLinhas)

    await insertRows(client, 'financeiro.contas_pagar', [
      'id',
      'tenant_id',
      'numero_documento',
      'serie_documento',
      'tipo_documento',
      'moeda',
      'fornecedor_id',
      'nome_fornecedor_snapshot',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'valor_bruto',
      'valor_desconto',
      'valor_impostos',
      'valor_liquido',
      'status',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'filial_id',
      'unidade_negocio_id',
      'observacao',
      'criado_em',
      'atualizado_em',
      'criado_por',
      'categoria_despesa_id',
      'lancamento_contabil_id',
      'conta_financeira_id',
      'compra_id',
    ], contasPagar)
    await insertRows(client, 'financeiro.contas_pagar_linhas', [
      'id',
      'conta_pagar_id',
      'tipo_linha',
      'produto_id',
      'servico_id',
      'descricao',
      'quantidade',
      'valor_unitario',
      'valor_bruto',
      'desconto',
      'impostos',
      'valor_liquido',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'criado_em',
      'categoria_despesa_id',
      'unidade_negocio_id',
    ], contasPagarLinhas)

    await insertRows(client, 'financeiro.pagamentos_recebidos', [
      'id',
      'tenant_id',
      'numero_pagamento',
      'data_recebimento',
      'data_lancamento',
      'conta_financeira_id',
      'metodo_pagamento_id',
      'moeda',
      'valor_total_recebido',
      'status',
      'observacao',
      'criado_em',
      'atualizado_em',
      'criado_por',
    ], receipts.payments)
    await insertRows(client, 'financeiro.pagamentos_recebidos_linhas', [
      'id',
      'pagamento_id',
      'conta_receber_id',
      'valor_original_documento',
      'valor_recebido',
      'saldo_apos_recebimento',
      'desconto_financeiro',
      'juros',
      'multa',
      'criado_em',
    ], receipts.lines)

    await insertRows(client, 'financeiro.pagamentos_efetuados', [
      'id',
      'tenant_id',
      'numero_pagamento',
      'data_pagamento',
      'data_lancamento',
      'conta_financeira_id',
      'metodo_pagamento_id',
      'moeda',
      'valor_total_pagamento',
      'status',
      'observacao',
      'criado_em',
      'atualizado_em',
      'criado_por',
      'lancamento_contabil_id',
    ], payments.payments)
    await insertRows(client, 'financeiro.pagamentos_efetuados_linhas', [
      'id',
      'pagamento_id',
      'conta_pagar_id',
      'valor_original_documento',
      'valor_pago',
      'saldo_apos_pagamento',
      'desconto_financeiro',
      'juros',
      'multa',
      'criado_em',
    ], payments.lines)

    const summary = await queryRows(client, `
      SELECT 'vendas' AS tabela, COUNT(*)::int AS total, ROUND(SUM(valor_total)::numeric, 2) AS valor FROM vendas.pedidos WHERE tenant_id = $1
      UNION ALL SELECT 'compras', COUNT(*)::int, ROUND(SUM(valor_total)::numeric, 2) FROM compras.compras WHERE tenant_id = $1
      UNION ALL SELECT 'contas_receber', COUNT(*)::int, ROUND(SUM(valor_liquido)::numeric, 2) FROM financeiro.contas_receber WHERE tenant_id = $1
      UNION ALL SELECT 'contas_pagar', COUNT(*)::int, ROUND(SUM(valor_liquido)::numeric, 2) FROM financeiro.contas_pagar WHERE tenant_id = $1
      UNION ALL SELECT 'recebimentos', COUNT(*)::int, ROUND(SUM(valor_total_recebido)::numeric, 2) FROM financeiro.pagamentos_recebidos WHERE tenant_id = $1
      UNION ALL SELECT 'pagamentos', COUNT(*)::int, ROUND(SUM(valor_total_pagamento)::numeric, 2) FROM financeiro.pagamentos_efetuados WHERE tenant_id = $1
    `, [TENANT_ID])

    const links = await queryRows(client, `
      SELECT 'receber_com_pedido_id' AS metrica, COUNT(*)::int AS total FROM financeiro.contas_receber WHERE tenant_id = $1 AND pedido_id IS NOT NULL
      UNION ALL SELECT 'pagar_com_compra_id', COUNT(*)::int FROM financeiro.contas_pagar WHERE tenant_id = $1 AND compra_id IS NOT NULL
      UNION ALL SELECT 'receber_sem_categoria', COUNT(*)::int FROM financeiro.contas_receber WHERE tenant_id = $1 AND categoria_receita_id IS NULL
      UNION ALL SELECT 'pagar_sem_categoria', COUNT(*)::int FROM financeiro.contas_pagar WHERE tenant_id = $1 AND categoria_despesa_id IS NULL
    `, [TENANT_ID])

    await client.query('COMMIT')
    console.log(JSON.stringify({ ok: true, tenant_id: TENANT_ID, reference_date: REFERENCE_DATE, summary, links }, null, 2))
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error))
  process.exit(1)
})
