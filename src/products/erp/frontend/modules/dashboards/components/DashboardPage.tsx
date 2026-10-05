'use client'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DASHBOARDS,
  dashboardFilterSchema,
  dashboardToday,
  type DashboardId,
  type DashboardResponse,
} from '@/products/erp/shared/dashboardContracts'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import {
  DashboardChartView,
  DashboardListView,
  DashboardMetrics,
  dashboardDate,
} from './DashboardViews'
export function DashboardPage({ id }: { id: DashboardId }) {
  const search = useSearchParams(),
    { orgId, userId } = useAuth()
  return <DashboardPageContent key={[id, search.toString(), orgId, userId].join('|')} id={id} />
}
function DashboardPageContent({ id }: { id: DashboardId }) {
  const search = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    today = dashboardToday()
  const from = search.get('from') || today.slice(0, 7) + '-01',
    to = search.get('to') || today,
    compare = search.get('compare') !== 'false',
    includeForecast = search.get('includeForecast') === 'true'
  const [draftFrom, setDraftFrom] = useState(from),
    [draftTo, setDraftTo] = useState(to),
    [data, setData] = useState<DashboardResponse | null>(null),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0)
  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true)
      setError(null)
      setData(null)
      try {
        const response = await fetch(
          '/api/erp/dashboards/' +
            id +
            '?' +
            new URLSearchParams({
              from,
              to,
              compare: String(compare),
              includeForecast: String(includeForecast),
            }),
          { cache: 'no-store', signal },
        )
        const result = await parseErpResponse<DashboardResponse>(response)
        if (!signal.aborted) setData(result)
      } catch (e) {
        if (!signal.aborted)
          setError(e instanceof Error ? e.message : 'Não foi possível carregar o dashboard.')
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    },
    [id, from, to, compare, includeForecast],
  )
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load, revision])
  const apply = (
    nextFrom: string,
    nextTo: string,
    comparison = compare,
    forecast = includeForecast,
  ) => {
    const result = dashboardFilterSchema.safeParse({
      from: nextFrom,
      to: nextTo,
      compare: comparison,
      includeForecast: forecast,
    })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setDraftFrom(nextFrom)
    setDraftTo(nextTo)
    router.replace(
      pathname +
        '?' +
        new URLSearchParams({
          from: nextFrom,
          to: nextTo,
          compare: String(comparison),
          includeForecast: String(forecast),
        }),
      { scroll: false },
    )
  }
  const previousMonth = () => {
    const d = new Date(today + 'T12:00:00Z')
    apply(
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 12)).toISOString().slice(0, 10),
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0, 12)).toISOString().slice(0, 10),
    )
  }
  return (
    <div
      className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-6 p-5 md:p-8"
      data-dashboard={id}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-blue-700">
            Dashboards · ERP
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {DASHBOARDS[id].title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{DASHBOARDS[id].description}</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => setRevision((r) => r + 1)}>
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Atualizar
        </Button>
      </div>
      {data ? (
        <nav aria-label="Dashboards" className="flex flex-wrap gap-2">
          {data.availableDashboards.map((d) => (
            <Link
              key={d}
              href={
                '/erp/dashboards/' +
                d +
                '?' +
                new URLSearchParams({
                  from,
                  to,
                  compare: String(compare),
                  includeForecast: String(includeForecast),
                })
              }
              aria-current={d === id ? 'page' : undefined}
              className={
                'rounded-lg px-3 py-2 text-sm font-medium transition ' +
                (d === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }
            >
              {DASHBOARDS[d].title}
            </Link>
          ))}
        </nav>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply(draftFrom, draftTo)
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
      >
        <CalendarDays className="mb-2 size-5 text-slate-400" aria-hidden="true" />
        <label className="text-xs font-medium text-slate-600">
          De
          <Input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className="mt-1 w-[155px] bg-white"
            required
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Até
          <Input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className="mt-1 w-[155px] bg-white"
            required
          />
        </label>
        <Button type="submit">Aplicar período</Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => apply(today.slice(0, 7) + '-01', today)}
          >
            Mês atual
          </Button>
          <Button type="button" variant="outline" onClick={previousMonth}>
            Mês anterior
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 pb-2 text-xs text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => apply(from, to, e.target.checked)}
            />
            Comparar período anterior
          </label>
          {['financeiro', 'visao-geral'].includes(id) ? (
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeForecast}
                onChange={(e) => apply(from, to, compare, e.target.checked)}
              />
              Incluir previsões financeiras
            </label>
          ) : null}
        </div>
      </form>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setRevision((r) => r + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
      {loading ? (
        <div
          role="status"
          aria-label="Carregando dashboard"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
          <span className="sr-only">Carregando indicadores…</span>
        </div>
      ) : null}
      {!loading && data ? (
        <>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>
              {dashboardDate(data.period.from)} a {dashboardDate(data.period.to)}
              {data.previousPeriod
                ? ' · Comparação: ' +
                  dashboardDate(data.previousPeriod.from) +
                  ' a ' +
                  dashboardDate(data.previousPeriod.to)
                : ''}
            </span>
            <span>
              Posição: {dashboardDate(data.reference)} · Atualizado às{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                timeZone: data.timezone,
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(data.generatedAt))}
            </span>
          </div>
          {data.metrics.length ? (
            <DashboardMetrics metrics={data.metrics} />
          ) : (
            <p className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
              Seu perfil não tem áreas disponíveis para este resumo.
            </p>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {data.charts.map((chart) => (
              <DashboardChartView key={chart.key} chart={chart} />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.lists.map((list) => (
              <DashboardListView key={list.key} list={list} />
            ))}
          </div>
          {data.notes.length ? (
            <aside className="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
              {data.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </aside>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
