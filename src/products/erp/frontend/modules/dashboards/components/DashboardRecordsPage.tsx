'use client'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  DashboardId,
  DashboardRecordsResponse,
} from '@/products/erp/shared/dashboardContracts'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { dashboardDate, dashboardValue } from './DashboardViews'
export function DashboardRecordsPage({ id }: { id: DashboardId }) {
  const search = useSearchParams(),
    { orgId, userId } = useAuth()
  return <DashboardRecordsContent key={[id, search.toString(), orgId, userId].join('|')} id={id} />
}
function DashboardRecordsContent({ id }: { id: DashboardId }) {
  const search = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    query = search.toString()
  const [data, setData] = useState<DashboardRecordsResponse | null>(null),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/erp/dashboards/' + id + '/registros?' + query, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(parseErpResponse<DashboardRecordsResponse>)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Não foi possível consultar os registros.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, query])
  const go = (page: number) => {
    const next = new URLSearchParams(query)
    next.set('page', String(page))
    router.replace(pathname + '?' + next, { scroll: false })
  }
  const back = new URLSearchParams()
  for (const k of ['from', 'to', 'includeForecast']) if (search.has(k)) back.set(k, search.get(k)!)
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5 p-5 md:p-8">
      <Link
        className="inline-flex items-center gap-2 text-sm text-blue-700"
        href={'/erp/dashboards/' + id + (back.size ? '?' + back : '')}
      >
        <ArrowLeft className="size-4" />
        Voltar ao dashboard
      </Link>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          Registros do indicador
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{data?.title || 'Conferir registros'}</h1>
        {data ? (
          <>
            <p className="mt-2 text-sm text-slate-500">{data.criterion}</p>
            <p className="mt-2 text-xs text-slate-500">
              {data.filters.from
                ? dashboardDate(data.filters.from) + ' a ' + dashboardDate(data.filters.to!)
                : 'Posição atual · ' + dashboardDate(data.reference)}
              {data.filters.status ? ' · Filtro: ' + data.filters.status.replaceAll('_', ' ') : ''}
              {data.filters.dimension
                ? ' · ' +
                  data.filters.dimension +
                  ': ' +
                  (data.filters.dimensionId === 'sem' ? 'não informado' : data.filters.dimensionId)
                : ''}
              {['pagar', 'receber'].includes(data.filters.source)
                ? ' · ' + (data.filters.includeForecast ? 'Inclui previsões' : 'Somente efetivos')
                : ''}
            </p>
          </>
        ) : null}
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="flex items-center gap-2 p-6 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Carregando registros…
        </p>
      ) : null}
      {data ? (
        <>
          <div className="flex flex-wrap gap-6 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">Registros encontrados</p>
              <p className="mt-1 text-xl font-semibold">{data.total.toLocaleString('pt-BR')}</p>
            </div>
            {data.filters.source !== 'movimentos' ? (
              <div>
                <p className="text-xs text-slate-500">
                  {data.format === 'currency'
                    ? 'Total da consulta'
                    : 'Disponibilidade total dos produtos selecionados'}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {dashboardValue(data.totalValue, data.format)}
                </p>
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">
                    {data.format === 'currency' ? 'Valor' : 'Quantidade'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.records.length ? (
                  data.records.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{r.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{r.detail}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {r.date ? dashboardDate(r.date) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {r.status.replaceAll('_', ' ')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        {dashboardValue(r.value, data.format)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Nenhum registro corresponde aos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Página {data.filters.page} de{' '}
              {Math.max(1, Math.ceil(data.total / data.filters.pageSize))}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={data.filters.page <= 1}
                onClick={() => go(data.filters.page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={data.filters.page * data.filters.pageSize >= data.total}
                onClick={() => go(data.filters.page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
