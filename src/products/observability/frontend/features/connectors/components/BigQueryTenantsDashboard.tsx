'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, Search, UsersRound } from 'lucide-react'

import type { ObservabilityBigQueryTenantRow } from '@/products/observability/server/connectorsObservabilityRepository'

type FilterMode = 'all' | 'ok' | 'attention' | 'missing_dataset' | 'failed'

function statusBadge(status: string, ok?: boolean) {
  const normalized = status || (ok ? 'ok' : 'attention')
  const map: Record<string, string> = {
    succeeded: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    unknown: 'border-amber-200 bg-amber-50 text-amber-700',
    failed: 'border-red-200 bg-red-50 text-red-700',
    error: 'border-red-200 bg-red-50 text-red-700',
    missing: 'border-red-200 bg-red-50 text-red-700',
    attention: 'border-red-200 bg-red-50 text-red-700',
  }

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${map[normalized] || map.attention}`}>
      {normalized}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function KpiCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string | number
  detail: string
  tone: 'neutral' | 'good' | 'warn' | 'danger'
}) {
  const Icon = tone === 'good' ? CheckCircle2 : tone === 'danger' ? AlertTriangle : tone === 'warn' ? Database : UsersRound
  const toneMap = {
    neutral: 'bg-slate-100 text-slate-600',
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon size={16} strokeWidth={2.4} />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  )
}

function datasetCell(row: ObservabilityBigQueryTenantRow, kind: 'raw' | 'normalized') {
  const dataset = row.datasets[kind]
  const detail = dataset.exists
    ? `${dataset.tableCount} tabelas / ${dataset.totalRows} linhas`
    : dataset.issueType === 'auth_error'
      ? 'erro de credencial Google'
      : dataset.issueType === 'not_found'
        ? 'dataset ausente'
        : 'falha na consulta'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {dataset.ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
        )}
        <span className="font-mono text-xs font-semibold text-slate-950">{dataset.dataset}</span>
      </div>
      <div className="text-xs text-slate-500">
        {detail}
      </div>
      {dataset.error ? <div className="max-w-xs truncate text-xs text-red-700">{dataset.error}</div> : null}
    </div>
  )
}

function matchesFilter(row: ObservabilityBigQueryTenantRow, filter: FilterMode) {
  if (filter === 'ok') return row.ok
  if (filter === 'attention') return !row.ok
  if (filter === 'missing_dataset') return row.datasets.raw.issueType === 'not_found' || row.datasets.normalized.issueType === 'not_found'
  if (filter === 'failed') return row.provisioningStatus === 'failed'
  return true
}

export default function BigQueryTenantsDashboard({
  generatedAt,
  projectId,
  rows,
  summary,
}: {
  generatedAt: string
  projectId: string
  rows: ObservabilityBigQueryTenantRow[]
  summary: {
    totalTenants: number
    okTenants: number
    attentionTenants: number
    missingDestinations: number
    missingDatasets: number
  }
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((row) => matchesFilter(row, filter))
      .filter((row) => {
        if (!q) return true
        const haystack = [
          row.tenantId,
          row.tenantName,
          row.tenantSlug,
          row.clerkOrganizationId,
          row.expectedDatasets.rawDataset,
          row.expectedDatasets.normalizedDataset,
          ...row.members.map((member) => `${member.email} ${member.fullName || ''}`),
        ].join(' ').toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => Number(a.ok) - Number(b.ok) || a.tenantId - b.tenantId)
  }, [filter, query, rows])

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Tenants" value={summary.totalTenants} detail={`Projeto ${projectId}`} tone="neutral" />
        <KpiCard label="OK" value={summary.okTenants} detail="config e datasets existem" tone="good" />
        <KpiCard label="Atencao" value={summary.attentionTenants} detail="divergencia ou erro" tone="danger" />
        <KpiCard label="Sem destino" value={summary.missingDestinations} detail="default BigQuery ausente" tone="warn" />
        <KpiCard label="Datasets faltando" value={summary.missingDatasets} detail="checagem live BigQuery" tone="danger" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por tenant, usuário, org ou dataset"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterMode)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-slate-500"
          >
            <option value="all">Todos</option>
            <option value="ok">OK</option>
            <option value="attention">Com atencao</option>
            <option value="missing_dataset">Dataset faltando</option>
            <option value="failed">Provisioning failed</option>
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-500">Checagem live atualizada em {formatDate(generatedAt)}.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Tenant / usuários</th>
                <th className="px-5 py-3">Destino</th>
                <th className="px-5 py-3">Raw</th>
                <th className="px-5 py-3">Normalized</th>
                <th className="px-5 py-3">Provisioning</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.tenantId} className="align-top text-slate-700">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-950">{row.tenantName}</div>
                    <div className="text-xs text-slate-500">tenant {row.tenantId} / {row.tenantSlug || '-'}</div>
                    <div className="mt-3 space-y-1">
                      {row.members.length ? row.members.slice(0, 3).map((member) => (
                        <div key={`${row.tenantId}-${member.userId}`} className="text-xs text-slate-600">
                          <span className="font-medium text-slate-800">{member.email}</span>
                          <span className="text-slate-400"> / {member.role}</span>
                        </div>
                      )) : (
                        <div className="text-xs text-slate-400">Sem membros ativos</div>
                      )}
                      {row.members.length > 3 ? <div className="text-xs text-slate-400">+{row.members.length - 3} membros</div> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {row.destination ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-950">{row.destination.name}</div>
                        <div className="text-xs text-slate-500">id {row.destination.id}</div>
                        {statusBadge(row.destination.status)}
                      </div>
                    ) : (
                      statusBadge('missing')
                    )}
                  </td>
                  <td className="px-5 py-4">{datasetCell(row, 'raw')}</td>
                  <td className="px-5 py-4">{datasetCell(row, 'normalized')}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      {statusBadge(row.provisioningStatus, row.ok)}
                      <div className="text-xs text-slate-500">{formatDate(row.provisioningUpdatedAt)}</div>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500">metadata</summary>
                        <pre className="mt-2 max-h-48 max-w-sm overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
                          {JSON.stringify(row.destination?.metadata || {}, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {row.ok ? statusBadge('ok') : (
                      <div className="space-y-2">
                        {statusBadge('attention')}
                        <div className="max-w-xs text-xs text-red-700">{row.issue}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum tenant encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
