import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { config } from 'dotenv'
import { connection } from './evolution-db.mjs'
import { closePool } from '../../src/lib/postgres'
import { runWithErpDatabaseContext } from '../../src/lib/erpDatabaseContext'
import { loadDashboard } from '../../src/products/erp/server/dashboards/dashboardService'
import {
  DASHBOARD_IDS,
  dashboardFilterSchema,
  dashboardRecordsSchema,
  previousDashboardPeriod,
  type DashboardId,
  type DashboardResponse,
} from '../../src/products/erp/shared/dashboardContracts'
import { loadDashboardRecords } from '../../src/products/erp/server/dashboards/drilldownQueries'
import { cashResultSql } from '../../src/products/erp/server/erpCashReport'
import { ERP_CAPABILITIES } from '../../src/products/erp/shared/professionalContracts'
import type { ErpAccessContext } from '../../src/products/erp/server/erpAccess'
config({ path: '.env.local', quiet: true })
const db = connection(),
  report = {
    status: 'running',
    empresaId: 2,
    checks: [] as string[],
    dashboards: {} as Record<string, DashboardResponse>,
    drilldownQueries: 0,
    failures: [] as {href:string;message:string}[],
    unchangedTables: 0,
  }
const near = (a: number, b: number, label: string) =>
  assert(Math.abs(a - b) < 0.021, `${label}: ${a} != ${b}`)
async function fingerprint() {
  const tables = (
    await db.query(
      "SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema='erp' AND c.column_name='empresa_id' AND t.table_type='BASE TABLE' ORDER BY c.table_name",
    )
  ).rows
  assert(tables.every((t: { table_name: string }) => /^[a-z_]+$/.test(t.table_name)))
  return (
    await db.query(
      tables
        .map(
          (t: { table_name: string }) =>
            `SELECT '${t.table_name}' name,empresa_id,count(*)::int count,md5(coalesce(string_agg(to_jsonb(r)::text,'|' ORDER BY to_jsonb(r)::text),'')) hash FROM erp.${t.table_name} r WHERE empresa_id IN (1,2) GROUP BY empresa_id`,
        )
        .join(' UNION ALL ') + ' ORDER BY name,empresa_id',
    )
  ).rows
}
async function main() {
  await db.connect()
  const before = await fingerprint()
  const identity = (
    await db.query(
      "SELECT t.name,u.email,u.clerk_user_id FROM shared.empresas t JOIN shared.usuarios_empresas m ON m.empresa_id=t.id JOIN shared.usuarios u ON u.id=m.usuario_id WHERE t.id=2 AND m.usuario_id=3 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND t.status='active' AND u.status='active'",
    )
  ).rows[0]
  assert(identity)
  const session: ErpAccessContext = {
    tenantId: 2,
    sharedUserId: 3,
    clerkUserId: identity.clerk_user_id,
    email: identity.email,
    tenantName: identity.name,
    role: 'owner',
    authMode: 'clerk',
    erpProfile: 'administrador',
    capabilities: [...ERP_CAPABILITIES],
  }
  const filters = { from: '2026-09-01', to: '2026-09-30', compare: true, includeForecast: false }
  const scope = { tenantId: 2, userId: 3, readOnly: true, statementTimeoutMs: 10000 }
  assert.deepEqual(previousDashboardPeriod(filters), { from: '2026-08-01', to: '2026-08-31' })
  for (const id of DASHBOARD_IDS) {
    const start = Date.now()
    const data = await runWithErpDatabaseContext(scope, () => loadDashboard(session, id, filters))
    assert(data.metrics.length > 0)
    assert(data.metrics.every((m) => Number.isFinite(m.value)))
    assert.equal(data.id, id)
    report.dashboards[id] = data
    report.checks.push('consulta_' + id)
    console.log(
      JSON.stringify({
        id,
        status: 'passed',
        elapsedMs: Date.now() - start,
        metrics: data.metrics.map((m) => ({ key: m.key, value: m.value })),
      }),
    )
  }
  const metric = (id: DashboardId, key: string) =>
    report.dashboards[id].metrics.find((m) => m.key === key)!
  const commercial = (
    await db.query(
      "SELECT (SELECT sum(total) FROM erp.vendas WHERE empresa_id=2 AND excluido_em IS NULL AND tipo_documento='venda' AND status IN ('confirmada','faturada') AND data_venda BETWEEN '2026-09-01' AND '2026-09-30') sales,(SELECT count(*) FROM erp.vendas WHERE empresa_id=2 AND excluido_em IS NULL AND tipo_documento='venda' AND status IN ('confirmada','faturada') AND data_venda BETWEEN '2026-09-01' AND '2026-09-30') sale_count,(SELECT sum(total) FROM erp.compras WHERE empresa_id=2 AND excluido_em IS NULL AND tipo_movimento='compra' AND status IN ('confirmada','parcialmente_recebida','recebida') AND data_compra BETWEEN '2026-09-01' AND '2026-09-30') purchases",
    )
  ).rows[0]
  near(metric('vendas', 'vendas').value, Number(commercial.sales), 'raw_sales')
  assert.equal(metric('vendas', 'quantidade').value, Number(commercial.sale_count))
  near(metric('compras', 'compras').value, Number(commercial.purchases), 'raw_purchases')
  near(metric('visao-geral', 'erp.relatorios.visualizar-resultado').value, metric('resultados', 'resultado').value, 'overview_cash_result')
  assert.equal(metric('visao-geral', 'erp.vendas.visualizar-atrasadas').value, metric('servicos', 'atrasadas').value)
  const upcoming = report.dashboards['visao-geral'].lists.find((l) => l.key === 'proximos-vencimentos')!
  const reference = report.dashboards['visao-geral'].reference
  const until = new Date(Date.parse(reference) + 7 * 86400000).toISOString().slice(0, 10)
  assert(upcoming.rows.length <= 5)
  assert(upcoming.rows.every((r) => r.value > 0 && r.date! >= reference && r.date! <= until && ['A vencer', 'Parcial', 'Previsão'].includes(r.status!)))
  report.checks.push('overview_result_and_overdue_orders', 'upcoming_payables_have_dates_and_balances')
  const payments = (
    await db.query(
      "SELECT tipo,sum(valor_liquido*CASE WHEN estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END) value FROM erp.pagamentos WHERE empresa_id=2 AND excluido_em IS NULL AND data_pagamento BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY tipo",
    )
  ).rows
  near(
    metric('resultados', 'recebimentos').value,
    Number(payments.find((r: { tipo: string }) => r.tipo === 'receber')?.value || 0),
    'raw_received',
  )
  near(
    metric('resultados', 'pagamentos').value,
    Number(payments.find((r: { tipo: string }) => r.tipo === 'pagar')?.value || 0),
    'raw_paid',
  )
  const oldReport = (await db.query(cashResultSql, [2, filters.from, filters.to])).rows
  near(
    metric('resultados', 'resultado').value,
    oldReport.reduce((n: number, r: { valor: string }) => n + Number(r.valor), 0),
    'existing_cash_report_regression',
  )
  report.checks.push(
    'raw_commercial_totals',
    'raw_payment_totals',
    'existing_cash_report_regression',
  )
  const urls = new Set<string>()
  for (const panel of Object.values(report.dashboards)) {
    for (const m of panel.metrics) if (m.href) urls.add(m.href)
    for (const l of panel.lists) {
      if (l.href) urls.add(l.href)
      for (const r of l.rows) if (r.href) urls.add(r.href)
    }
  }
  const records = new Map<string, Awaited<ReturnType<typeof loadDashboardRecords>>>()
  const all = [...urls]
  for (let i = 0; i < all.length; i += 4) {
    await Promise.all(
      all.slice(i, i + 4).map(async (href) => {
        const url = new URL(href, 'https://erp.local'),
          id = url.pathname.split('/')[3] as DashboardId,
          params = Object.fromEntries(url.searchParams),
          parsed = dashboardRecordsSchema.parse({
            ...params,
            includeForecast: params.includeForecast === 'true',
          })
        try {
          const data = await runWithErpDatabaseContext(scope, () =>
            loadDashboardRecords(session, id, parsed),
          )
          assert(data.records.length <= 20)
          assert(data.records.every((r) => Number.isFinite(r.value)))
          records.set(href, data)
          report.drilldownQueries++
        } catch (e) {
          report.failures.push({href,message:(e as Error).message})
          console.log(JSON.stringify({status:'failed_drilldown',href,message:(e as Error).message}))
        }
      }),
    )
    if (i % 32 === 0)
      console.log(
        JSON.stringify({
          status: 'checking_drilldowns',
          completed: records.size,
          total: all.length,
        }),
      )
  }
  const countKeys = [
    'quantidade',
    'orcamentos',
    'repor',
    'reservas',
    'produtos',
    'entradas',
    'saidas',
    'abertas',
    'atrasadas',
    'concluidas',
    'contratos',
    'pendentes',
    'parciais',
  ]
  for (const [id, panel] of Object.entries(report.dashboards)) {
    if (id !== 'visao-geral')
      for (const m of panel.metrics) {
        if (!m.href || ['conversao', 'ticket'].includes(m.key)) continue
        const result = records.get(m.href)!
        if (!result) continue
        if (countKeys.includes(m.key)) assert.equal(m.value, result.total, id + '.' + m.key)
        else
          near(
            m.value,
            m.key === 'pagamentos' ? -result.totalValue : result.totalValue,
            id + '.' + m.key,
          )
      }
    for (const l of panel.lists)
      for (const row of l.rows)
        if (row.href && records.has(row.href))
          near(
            Number(row.value),
            records.get(row.href)!.totalValue,
            id + '.' + l.key + '.' + row.id,
          )
  }
  report.checks.push(
    'successful_indicator_drilldowns_reconcile',
    'successful_ranking_drilldowns_reconcile',
    'drilldown_pagination',
  )
  const reader = {
    ...session,
    capabilities: ['erp.vendas.visualizar'] as ErpAccessContext['capabilities'],
  }
  const restricted = await runWithErpDatabaseContext(scope, () =>
    loadDashboard(reader, 'visao-geral', filters),
  )
  assert.deepEqual(restricted.availableDashboards, ['visao-geral', 'vendas', 'servicos'])
  assert(restricted.metrics.every((m) => m.key.startsWith('erp.vendas.visualizar-')))
  const financeOnly = await runWithErpDatabaseContext(scope, () => loadDashboard({ ...session, capabilities: ['erp.financeiro.visualizar'] }, 'visao-geral', filters))
  assert(!financeOnly.metrics.some((m) => m.key.endsWith('-resultado')))
  assert(!financeOnly.lists.some((l) => l.key === 'clientes'))
  assert(financeOnly.metrics.every((m) => m.key.startsWith('erp.financeiro.visualizar-')))
  report.checks.push('overview_result_requires_finance_and_reports')
  await assert.rejects(
    runWithErpDatabaseContext(scope, () => loadDashboard(reader, 'financeiro', filters)),
    (e: { status?: number }) => e.status === 403,
  )
  await assert.rejects(
    runWithErpDatabaseContext({ ...scope, tenantId: 1 }, () =>
      loadDashboard(session, 'vendas', filters),
    ),
    (e: { status?: number }) => e.status === 403,
  )
  await assert.rejects(
    runWithErpDatabaseContext(scope, () =>
      loadDashboardRecords(
        reader,
        'visao-geral',
        dashboardRecordsSchema.parse({ source: 'pagar' }),
      ),
    ),
    (e: { status?: number }) => e.status === 403,
  )
  report.checks.push(
    'overview_hides_unauthorized_areas',
    'dashboard_denies_missing_capability',
    'foreign_company_denied',
    'drilldown_denies_missing_capability',
  )
  const empty = await runWithErpDatabaseContext(scope, () =>
    loadDashboard(session, 'vendas', { ...filters, from: '2025-01-01', to: '2025-01-31' }),
  )
  assert(empty.metrics.every((m) => m.value === 0))
  assert(empty.charts.every((c) => c.records.length === 0))
  assert.equal(empty.metrics[0].variation, null)
  const noCompare = await runWithErpDatabaseContext(scope, () =>
    loadDashboard(session, 'vendas', { ...filters, compare: false }),
  )
  assert.equal(noCompare.previousPeriod, null)
  assert(noCompare.metrics.every((m) => m.previous === undefined && m.variation === undefined))
  const forecasts = await runWithErpDatabaseContext(scope, () =>
    loadDashboard(session, 'financeiro', {
      ...filters,
      from: '2026-11-01',
      to: '2026-12-31',
      includeForecast: true,
    }),
  )
  assert(forecasts.metrics.find((m) => m.key === 'previsoes')!.value > 0)
  const partial = await runWithErpDatabaseContext(scope, () =>
    loadDashboard(session, 'compras', { ...filters, from: '2026-07-01', to: '2026-10-06' }),
  )
  assert(partial.metrics.find((m) => m.key === 'parciais')!.value > 0)
  assert.equal(dashboardFilterSchema.safeParse({ ...filters, from: '2026-02-30' }).success, false)
  assert.equal(dashboardFilterSchema.safeParse({ ...filters, to: '2026-08-31' }).success, false)
  assert.equal(dashboardFilterSchema.safeParse({ ...filters, tenantId: 1 }).success, false)
  assert.equal(dashboardRecordsSchema.safeParse({ source: 'vendas', id: '0' }).success, false)
  report.checks.push(
    'empty_period_and_zero_comparison',
    'comparison_disabled',
    'forecast_option',
    'partial_purchase_included',
    'invalid_dates_and_company_filter_rejected',
  )
  const after = await fingerprint()
  assert.deepEqual(after, before)
  report.unchangedTables = new Set(before.map((r: { name: string }) => r.name)).size
  report.checks.push('business_data_unchanged_both_companies')
  console.log(
    JSON.stringify({
      status: report.failures.length ? 'failed' : 'passed',
      checks: report.checks.length,
      drilldownQueries: report.drilldownQueries,
      unchangedTables: report.unchangedTables,
    }),
  )
  report.status = report.failures.length ? 'failed' : 'passed'
  if (report.failures.length) process.exitCode = 1
}
main()
  .catch((e) => {
    report.status = 'failed'
    console.error(JSON.stringify({ code: e.code, message: e.message }))
    process.exitCode = 1
  })
  .finally(async () => {
    await db.end().catch(() => {})
    await closePool()
    mkdirSync('.cache/dashboards', { recursive: true })
    writeFileSync('.cache/dashboards/read-smoke.json', JSON.stringify(report, null, 2))
  })
