'use client'
import Link from 'next/link'
import { AlertCircle, ChevronRight, Clock3, Package, Wrench } from 'lucide-react'
import type { DashboardList, DashboardResponse } from '@/products/erp/shared/dashboardContracts'
import {
  DashboardChartView,
  DashboardListView,
  DashboardMetrics,
  dashboardDate,
  dashboardValue,
} from '../components/DashboardViews'

function OverviewTable({ list, upcoming = false }: { list: DashboardList; upcoming?: boolean }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">{list.title}</h2>
        {list.href ? (
          <Link
            href={list.href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
          >
            Ver todos
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {list.rows.length ? (
        <div className="overflow-x-auto px-5 pb-3">
          <table className="w-full text-left text-sm" aria-label={list.title}>
            <thead className="border-y border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th scope="col" className="rounded-l-lg px-3 py-3">
                  {upcoming ? 'Descrição' : 'Cliente'}
                </th>
                {upcoming ? (
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    Vencimento
                  </th>
                ) : null}
                <th scope="col" className="whitespace-nowrap px-3 py-3 text-right">
                  {upcoming ? 'Saldo a pagar' : 'Vendas no período'}
                </th>
                {upcoming ? (
                  <th scope="col" className="rounded-r-lg px-3 py-3">
                    Situação
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.rows.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="min-w-[170px] px-3 py-3.5">
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="font-medium text-slate-800 hover:text-blue-700 hover:underline"
                      >
                        {row.label}
                      </Link>
                    ) : (
                      row.label
                    )}
                    {upcoming && row.detail ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{row.detail}</span>
                    ) : null}
                  </td>
                  {upcoming ? (
                    <td className="whitespace-nowrap px-3 py-3.5 text-slate-500">
                      {row.date ? dashboardDate(row.date).slice(0, 5) : '—'}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-3 py-3.5 text-right font-medium tabular-nums text-slate-800">
                    {dashboardValue(row.value, row.format)}
                  </td>
                  {upcoming ? (
                    <td className="px-3 py-3.5">
                      <span
                        className={
                          'whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ' +
                          (row.status === 'A vencer'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-800')
                        }
                      >
                        {row.status || 'Em aberto'}
                      </span>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 pb-6 text-sm text-slate-500">
          {upcoming
            ? 'Nenhuma parcela a pagar nos próximos sete dias.'
            : 'Nenhuma venda confirmada neste período.'}
        </p>
      )}
    </section>
  )
}

export function OverviewDashboardView({ data }: { data: DashboardResponse }) {
  const mainKeys = [
    'erp.financeiro.visualizar-saldo',
    'erp.vendas.visualizar-vendas',
    'erp.compras.visualizar-compras',
    'erp.relatorios.visualizar-resultado',
  ]
  const main = mainKeys.flatMap((key) => {
    const m = data.metrics.find((metric) => metric.key === key)
    return m ? [{ ...m, label: key.endsWith('-saldo') ? 'Saldo disponível' : m.label }] : []
  })
  const attentionItems = [
    {
      key: 'erp.financeiro.visualizar-pagar-vencido',
      icon: AlertCircle,
      label: 'Pagamentos vencidos',
      urgent: true,
    },
    {
      key: 'erp.financeiro.visualizar-proximos',
      icon: Clock3,
      label: 'A pagar em 7 dias',
      urgent: false,
    },
    {
      key: 'erp.estoque.visualizar-repor',
      icon: Package,
      label: 'Produtos para repor',
      urgent: false,
    },
    {
      key: 'erp.vendas.visualizar-atrasadas',
      icon: Wrench,
      label: 'Ordens atrasadas',
      urgent: false,
    },
  ].flatMap((item) => {
    const metric = data.metrics.find((m) => m.key === item.key)
    return metric ? [{ ...item, metric }] : []
  })
  const upcoming = data.lists.find((l) => l.key === 'proximos-vencimentos')
  const clients = data.lists.find((l) => l.key === 'clientes')
  const other = data.lists.filter((l) => !['proximos-vencimentos', 'clientes'].includes(l.key))
  return (
    <>
      {main.length ? <DashboardMetrics metrics={main} /> : null}
      {attentionItems.length ? (
        <section
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          aria-label="Precisa da sua atenção"
        >
          <h2 className="mb-3 text-base font-semibold tracking-tight text-slate-950">
            Precisa da sua atenção
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attentionItems.map(({ metric, icon: Icon, label, urgent }) => {
              const tone =
                metric.value === 0
                  ? 'bg-slate-50 text-slate-600'
                  : urgent
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-800'
              const content = (
                <>
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-700">{label}</span>
                    <span className="mt-1 block break-words text-lg font-semibold tabular-nums">
                      {dashboardValue(metric.value, metric.format)}
                      {metric.key.endsWith('-repor')
                        ? ' produtos'
                        : metric.key.endsWith('-atrasadas')
                          ? ' ordens'
                          : ''}
                    </span>
                  </span>
                  {metric.href ? (
                    <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                  ) : null}
                </>
              )
              return metric.href ? (
                <Link
                  key={metric.key}
                  href={metric.href}
                  title={metric.description}
                  className={
                    'flex min-w-0 items-center gap-3 rounded-xl p-3 transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                    tone
                  }
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={metric.key}
                  className={'flex min-w-0 items-center gap-3 rounded-xl p-3 ' + tone}
                >
                  {content}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
      {!main.length && !attentionItems.length ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Seu perfil não tem áreas disponíveis para este resumo.
        </p>
      ) : null}
      {data.charts.length ? (
        <div className="grid gap-5 lg:grid-cols-5">
          {data.charts.map((chart, index) => (
            <div
              key={chart.key}
              className={
                'min-w-0 ' +
                (data.charts.length === 1
                  ? 'lg:col-span-5'
                  : index === 0
                    ? 'lg:col-span-3'
                    : 'lg:col-span-2')
              }
            >
              <DashboardChartView chart={chart} />
            </div>
          ))}
        </div>
      ) : null}
      {upcoming || clients ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {upcoming ? <OverviewTable list={upcoming} upcoming /> : null}
          {clients ? <OverviewTable list={clients} /> : null}
        </div>
      ) : null}
      {other.length ? (
        <details className="rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Outras pendências e registros
          </summary>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {other.map((list) => (
              <DashboardListView key={list.key} list={list} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  )
}
