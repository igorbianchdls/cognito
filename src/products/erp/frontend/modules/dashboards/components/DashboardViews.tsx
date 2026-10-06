'use client'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  Info,
  ShoppingCart,
  Truck,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  DashboardChart,
  DashboardFormat,
  DashboardList,
  DashboardMetric,
} from '@/products/erp/shared/dashboardContracts'
export function dashboardValue(value: number, format: DashboardFormat = 'currency') {
  return (
    new Intl.NumberFormat(
      'pt-BR',
      format === 'currency'
        ? { style: 'currency', currency: 'BRL' }
        : format === 'percent'
          ? { maximumFractionDigits: 1 }
          : { maximumFractionDigits: 4 },
    ).format(value) + (format === 'percent' ? '%' : '')
  )
}
export function dashboardDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.slice(8) + '/' + value.slice(5, 7) + '/' + value.slice(0, 4)
    : value
}
const colors = {
  neutral: 'text-slate-900',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
}
export function DashboardMetrics({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.key.endsWith('saldo')
          ? Wallet
          : m.key.endsWith('vendas')
            ? ShoppingCart
            : m.key.endsWith('compras')
              ? Truck
              : ChartNoAxesCombined
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span title={m.description} className="cursor-help text-slate-400">
                <Info className="size-3.5" aria-hidden="true" />
                <span className="sr-only">{m.description}</span>
              </span>
            </div>
            <span className="mt-3 block text-xs font-medium text-slate-500">{m.label}</span>
            <div
              className={
                'mt-1.5 break-words text-[clamp(20px,2vw,28px)] font-semibold tracking-tight tabular-nums ' +
                (m.tone === 'danger' ? colors.danger : colors.neutral)
              }
            >
              {dashboardValue(m.value, m.format)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {m.variation !== undefined ? (
                <>
                  {m.variation === null ? (
                    'Sem base de comparação'
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                        {m.variation >= 0 ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {m.variation > 0 ? '+' : ''}
                        {m.variation.toLocaleString('pt-BR')}%
                      </span>
                      <span>vs. período anterior</span>
                    </>
                  )}
                </>
              ) : m.scope === 'atual' ? (
                'Posição atual'
              ) : (
                'No período'
              )}
            </div>
          </>
        )
        return m.href ? (
          <Link
            key={m.key}
            href={m.href}
            title="Abrir registros correspondentes"
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {content}
          </Link>
        ) : (
          <div key={m.key} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
            {content}
          </div>
        )
      })}
    </section>
  )
}
export function DashboardChartView({ chart }: { chart: DashboardChart }) {
  const axis = (v: number) =>
    Math.abs(v) >= 1000
      ? new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
      : dashboardValue(v, chart.format === 'currency' ? 'number' : chart.format)
  const common = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />,
    <XAxis
      key="date-axis"
      dataKey="label"
      tickFormatter={(value) => dashboardDate(String(value)).slice(0, 5)}
      tick={{ fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      minTickGap={24}
    />,
    <YAxis
      key="value-axis"
      tickFormatter={axis}
      tick={{ fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      width={55}
    />,
    <Tooltip
      key="tooltip"
      labelFormatter={(v) => dashboardDate(String(v))}
      formatter={(value) => dashboardValue(Number(value), chart.format)}
      contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }}
    />,
    <Legend key="legend" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />,
  ]
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{chart.title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{chart.description}</p>
      {chart.records.length ? (
        <>
          <div className="mt-5 h-[280px] w-full" aria-label={chart.title}>
            <ResponsiveContainer width="100%" height="100%">
              {chart.kind === 'line' ? (
                <LineChart
                  data={chart.records}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  accessibilityLayer
                >
                  {common}
                  {chart.series.map((s) => (
                    <Line
                      key={s.key}
                      type="linear"
                      dataKey={s.key}
                      name={s.label}
                      stroke={s.color}
                      strokeWidth={2.5}
                      dot={chart.records.length < 15}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart
                  data={chart.records}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  accessibilityLayer
                >
                  {common}
                  {chart.series.map((s) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.label}
                      fill={s.color}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={36}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer">Ver dados do gráfico</summary>
            <div className="mt-2 max-h-64 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2">Data</th>
                    {chart.series.map((s) => (
                      <th key={s.key}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.records.map((r) => (
                    <tr key={r.label} className="border-t">
                      <td className="py-2">{dashboardDate(r.label)}</td>
                      {chart.series.map((s) => (
                        <td key={s.key}>{dashboardValue(Number(r[s.key] || 0), chart.format)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="flex h-[200px] items-center justify-center text-sm text-slate-500">
          Nenhum movimento neste período.
        </p>
      )}
    </section>
  )
}
export function DashboardListView({ list }: { list: DashboardList }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">{list.title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{list.description}</p>
        </div>
        {list.href ? (
          <Link
            className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
            href={list.href}
          >
            Ver registros
          </Link>
        ) : null}
      </div>
      {list.rows.length ? (
        <ul className="divide-y divide-slate-100">
          {list.rows.map((r, index) => {
            const body = (
              <>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800">{r.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{r.detail}</span>
                </span>
                <span className="shrink-0 text-right text-sm font-semibold text-slate-800">
                  {dashboardValue(Number(r.value), r.format)}
                </span>
                {r.href ? <ChevronRight className="size-4 shrink-0 text-slate-400" /> : null}
              </>
            )
            return (
              <li key={r.id + '-' + index}>
                {r.href ? (
                  <Link
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                    href={r.href}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="px-5 pb-6 text-sm text-slate-500">Nenhum registro para esta consulta.</p>
      )}
    </section>
  )
}
