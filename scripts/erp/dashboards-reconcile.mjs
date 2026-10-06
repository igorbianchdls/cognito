import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { connection } from './evolution-db.mjs'

// Independent reference: fetch raw rows and calculate in JavaScript, without
// importing the dashboard SQL, financial balance SQL, or drilldown functions.
// Run immediately after dashboards-smoke.ts against an unchanged database.
const source = JSON.parse(readFileSync('.cache/dashboards/read-smoke.json', 'utf8'))
assert.equal(source.status, 'passed')
assert.equal(source.empresaId, 2)
const panels = source.dashboards
const { reference, period, previousPeriod } = panels.financeiro
assert(Date.now() - Date.parse(panels.financeiro.generatedAt) < 10 * 60000, 'Run dashboards-smoke.ts first; evidence must be fresh')
const db = connection()
const report = { status: 'running', companyId: 2, period, reference, generatedAt: new Date().toISOString(), checks: [] }
const sum = (rows, value) => rows.reduce((n, r) => n + value(r), 0)
const day = (value) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
const within = (date, range = period) => day(date) >= range.from && day(date) <= range.to
const metric = (id, key) => {
  const found = panels[id].metrics.find((m) => m.key === key)
  assert(found, id + '.' + key)
  return found
}
function compare(label, actual, expected, tolerance = 0.000001) {
  assert(Number.isFinite(actual) && Number.isFinite(expected), label)
  assert(Math.abs(actual - expected) <= tolerance, `${label}: dashboard=${actual}; raw=${expected}`)
  report.checks.push({ label, actual, expected })
}
const check = (id, key, expected) => compare(id + '.' + key, metric(id, key).value, expected)
async function table(name) {
  assert(/^[a-z_]+$/.test(name))
  return (await db.query(`SELECT * FROM erp.${name} WHERE empresa_id=$1`, [2])).rows
}
try {
  await db.connect()
  await db.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const names = ['pagamentos', 'adiantamentos_aplicacoes', 'renegociacoes_parcelas', 'renegociacoes', 'contas_financeiras', 'adiantamentos', 'transferencias_financeiras', 'saldos_estoque', 'produtos', 'locais_estoque', 'movimentacoes_estoque', 'ordens_servico', 'contratos_vendas', 'contratos_vendas_versoes', 'contratos_vendas_itens', 'vendas', 'compras']
  const data = {}
  for (const name of names) data[name] = await table(name)
  const payments = data.pagamentos.filter((p) => !p.excluido_em)
  const nextWeek = new Date(Date.parse(reference) + 7 * 86400000).toISOString().slice(0, 10)
  for (const side of ['pagar', 'receber']) {
    const titles = (await table('contas_' + side)).filter((r) => !r.excluido_em)
    const parts = (await table('contas_' + side + '_parcelas')).filter((r) => !r.excluido_em)
    const partColumn = 'conta_' + side + '_parcela_id'
    const titleColumn = 'conta_' + side + '_id'
    const open = []
    for (const p of parts) {
      const title = titles.find((t) => String(t.id) === String(p[titleColumn]))
      if (!title || title.status === 'cancelado' || p.status === 'cancelado') continue
      if (side === 'pagar' && title.tipo_lancamento !== 'efetivo') continue
      const related = (r) => String(r[partColumn]) === String(p.id)
      const paid = sum(payments.filter((r) => related(r) && !r.estorno_de_pagamento_id && !r.estornado_em), (r) => Number(r.valor))
      const credit = sum(data.adiantamentos_aplicacoes.filter(related), (r) => Number(r.valor) * (r.reversao_de_id ? -1 : 1))
      const moved = sum(data.renegociacoes_parcelas.filter((r) => related(r) && r.papel === 'origem' && data.renegociacoes.some((a) => String(a.id) === String(r.renegociacao_id) && a.status === 'efetivada')), (r) => Number(r.valor))
      const balance = Math.round((Number(p.valor) - paid - credit - moved) * 100) / 100
      if (balance > 0 && moved === 0 && (paid + credit > 0 || day(p.data_vencimento) < reference || !['pago', 'renegociado'].includes(p.status))) open.push({ due: day(p.data_vencimento), balance })
    }
    check('financeiro', side, sum(open.filter((r) => within(r.due)), (r) => r.balance))
    check('financeiro', side + '-vencido', sum(open.filter((r) => r.due < reference), (r) => r.balance))
    if (side === 'pagar') check('financeiro', 'proximos', sum(open.filter((r) => r.due >= reference && r.due <= nextWeek), (r) => r.balance))
  }
  const cash = payments.map((p) => ({ account: p.conta_financeira_id, date: day(p.data_pagamento), value: Number(p.valor_liquido) * (p.estorno_de_pagamento_id ? -1 : 1) * (p.tipo === 'receber' ? 1 : -1) }))
  for (const a of data.adiantamentos) {
    const original = data.adiantamentos.find((r) => String(r.id) === String(a.reversao_de_id))
    const sign = a.tipo === 'reversao'
      ? ((original?.lado === 'receber') === (original?.tipo === 'constituicao') ? -1 : 1)
      : ((a.lado === 'receber') === (a.tipo === 'constituicao') ? 1 : -1)
    cash.push({ account: a.conta_financeira_id, date: day(a.data_movimento), value: Number(a.valor) * sign })
  }
  let totalBalance = 0
  for (const a of data.contas_financeiras.filter((r) => !r.excluido_em && day(r.data_saldo_inicial) <= reference)) {
    const eligible = (date) => day(date) >= day(a.data_saldo_inicial) && day(date) <= reference
    const balance = Number(a.saldo_inicial)
      + sum(cash.filter((r) => String(r.account) === String(a.id) && eligible(r.date)), (r) => r.value)
      + sum(data.transferencias_financeiras.filter((r) => !r.excluido_em && r.status === 'concluida' && eligible(r.data_transferencia) && [r.conta_origem_id, r.conta_destino_id].some((id) => String(id) === String(a.id))), (r) => Number(r.valor) * (String(r.conta_destino_id) === String(a.id) ? 1 : -1))
    totalBalance += balance
    const row = panels.financeiro.lists.find((l) => l.key === 'contas').rows.find((r) => String(r.id) === String(a.id))
    assert(row, 'Account missing from dashboard')
    compare('financeiro.conta.' + a.id, row.value, balance)
  }
  check('financeiro', 'saldo', totalBalance)

  const positions = data.saldos_estoque.filter((s) => data.produtos.some((p) => String(p.id) === String(s.produto_id) && !p.excluido_em) && data.locais_estoque.some((l) => String(l.id) === String(s.local_estoque_id)))
  check('estoque', 'valor', sum(positions, (r) => Number(r.quantidade_fisica) * Number(r.custo_medio)))
  const products = [...new Set(positions.map((r) => String(r.produto_id)))]
  check('estoque', 'produtos', products.length)
  check('estoque', 'reservas', positions.filter((r) => Number(r.quantidade_reservada) > 0).length)
  check('estoque', 'repor', products.filter((id) => sum(positions.filter((r) => String(r.produto_id) === id), (r) => Number(r.quantidade_fisica) - Number(r.quantidade_reservada)) < Number(data.produtos.find((p) => String(p.id) === id).estoque_minimo)).length)
  const operationalDay = (m) => m.data_operacional ? day(m.data_operacional) : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(m.ocorrido_em)
  const movements = data.movimentacoes_estoque.filter((r) => within(operationalDay(r)))
  check('estoque', 'entradas', movements.filter((r) => Number(r.quantidade) > 0).length)
  check('estoque', 'saidas', movements.filter((r) => Number(r.quantidade) < 0).length)
  const localDate = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
  const orders = data.ordens_servico.filter((r) => !r.excluido_em)
  const pending = orders.filter((r) => !['concluida', 'cancelada'].includes(r.status))
  check('servicos', 'abertas', pending.length)
  check('servicos', 'atrasadas', pending.filter((r) => r.previsao_entrega && day(r.previsao_entrega) < reference).length)
  check('servicos', 'concluidas', orders.filter((r) => r.status === 'concluida' && r.concluida_em && within(localDate(r.concluida_em))).length)
  const contracts = []
  for (const c of data.contratos_vendas.filter((r) => !r.excluido_em && r.status === 'ativo' && day(r.data_inicio) <= reference && (!r.data_fim || day(r.data_fim) >= reference))) {
    const versions = data.contratos_vendas_versoes.filter((v) => String(v.contrato_id) === String(c.id) && v.status === 'efetivada' && day(v.vigencia_inicio) <= reference && (!v.vigencia_fim || day(v.vigencia_fim) >= reference)).sort((a, b) => day(b.vigencia_inicio).localeCompare(day(a.vigencia_inicio)) || Number(b.numero) - Number(a.numero))
    if (versions.length) contracts.push(versions[0])
  }
  check('servicos', 'contratos', contracts.length)
  check('servicos', 'mensal', sum(data.contratos_vendas_itens.filter((i) => contracts.some((v) => v.periodicidade === 'mensal' && String(v.id) === String(i.contrato_versao_id))), (r) => Number(r.total)))
  const sales = data.vendas.filter((r) => !r.excluido_em && r.tipo_documento === 'venda' && ['confirmada', 'faturada'].includes(r.status))
  const currentSales = sales.filter((r) => within(r.data_venda))
  const salesAmount = sum(currentSales, (r) => Number(r.total))
  check('vendas', 'vendas', salesAmount)
  check('vendas', 'quantidade', currentSales.length)
  check('vendas', 'ticket', currentSales.length ? salesAmount / currentSales.length : 0)
  const quotes = data.vendas.filter((r) => !r.excluido_em && r.tipo_documento === 'orcamento' && r.status !== 'cancelada' && within(r.data_venda))
  check('vendas', 'orcamentos', quotes.length)
  check('vendas', 'conversao', quotes.length ? quotes.filter((q) => sales.some((s) => String(s.venda_origem_id) === String(q.id))).length / quotes.length * 100 : 0)
  compare('vendas.previous', metric('vendas', 'vendas').previous, sum(sales.filter((r) => within(r.data_venda, previousPeriod)), (r) => Number(r.total)))
  const purchases = data.compras.filter((r) => !r.excluido_em && r.tipo_movimento === 'compra' && ['confirmada', 'parcialmente_recebida', 'recebida'].includes(r.status))
  const currentPurchases = purchases.filter((r) => within(r.data_compra))
  check('compras', 'compras', sum(currentPurchases, (r) => Number(r.total)))
  check('compras', 'quantidade', currentPurchases.length)
  check('compras', 'pendentes', currentPurchases.filter((r) => r.status === 'confirmada').length)
  check('compras', 'parciais', currentPurchases.filter((r) => r.status === 'parcialmente_recebida').length)
  compare('compras.previous', metric('compras', 'compras').previous, sum(purchases.filter((r) => within(r.data_compra, previousPeriod)), (r) => Number(r.total)))
  for (const side of ['receber', 'pagar']) check('resultados', side === 'receber' ? 'recebimentos' : 'pagamentos', sum(payments.filter((r) => r.tipo === side && within(r.data_pagamento)), (r) => Number(r.valor_liquido) * (r.estorno_de_pagamento_id ? -1 : 1)))
  check('resultados', 'resultado', metric('resultados', 'recebimentos').value - metric('resultados', 'pagamentos').value)
  for (const [id, capability, keys] of [['financeiro', 'erp.financeiro.visualizar', ['saldo', 'receber-vencido', 'pagar-vencido', 'proximos']], ['vendas', 'erp.vendas.visualizar', ['vendas']], ['compras', 'erp.compras.visualizar', ['compras']], ['estoque', 'erp.estoque.visualizar', ['repor']], ['servicos', 'erp.vendas.visualizar', ['abertas', 'atrasadas']], ['resultados', 'erp.relatorios.visualizar', ['resultado']]]) {
    for (const key of keys) check('visao-geral', capability + '-' + key, metric(id, key).value)
  }
  await db.query('ROLLBACK')
  report.status = 'passed'
  console.log(JSON.stringify({ status: report.status, checks: report.checks.length, period, reference }))
} catch (error) {
  report.status = 'failed'
  report.error = error.message
  console.error(error.message)
  process.exitCode = 1
} finally {
  await db.end().catch(() => {})
  writeFileSync('.cache/dashboards/reconcile-smoke.json', JSON.stringify(report, null, 2))
}
