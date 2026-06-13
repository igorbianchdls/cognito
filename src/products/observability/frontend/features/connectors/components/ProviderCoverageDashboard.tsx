import { AlertTriangle, CheckCircle2, Clock3, PlugZap, RadioTower, XCircle } from 'lucide-react'

import type {
  ConnectorsCoverageSummary,
  ProviderCoverageRow,
  TenantCoverageRow,
} from '@/products/observability/frontend/features/connectors/lib/providerCoverage'

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusBadge(status: ProviderCoverageRow['status']) {
  const map = {
    connected: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    attention: 'border-red-200 bg-red-50 text-red-700',
    disabled: 'border-slate-200 bg-slate-50 text-slate-600',
    missing: 'border-slate-200 bg-white text-slate-500',
  }
  const label = {
    connected: 'conectado',
    pending: 'pendente',
    attention: 'atencao',
    disabled: 'desabilitado',
    missing: 'faltando',
  }

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${map[status]}`}>
      {label[status]}
    </span>
  )
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
  tone: 'neutral' | 'good' | 'warn' | 'danger' | 'info'
}) {
  const iconMap = {
    neutral: PlugZap,
    good: CheckCircle2,
    warn: Clock3,
    danger: AlertTriangle,
    info: RadioTower,
  }
  const toneMap = {
    neutral: 'text-slate-600 bg-slate-100',
    good: 'text-emerald-700 bg-emerald-50',
    warn: 'text-amber-700 bg-amber-50',
    danger: 'text-red-700 bg-red-50',
    info: 'text-blue-700 bg-blue-50',
  }
  const Icon = iconMap[tone]

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

export default function ProviderCoverageDashboard({
  summary,
  providerRows,
  tenantRows,
}: {
  summary: ConnectorsCoverageSummary
  providerRows: ProviderCoverageRow[]
  tenantRows: TenantCoverageRow[]
}) {
  const missingRows = providerRows.filter((row) => row.connectionCount === 0).slice(0, 8)
  const attentionRows = providerRows.filter((row) => row.attentionTenants > 0).slice(0, 8)
  const visibleProviderRows = [...providerRows]
    .sort((a, b) => b.connectionCount - a.connectionCount || a.providerName.localeCompare(b.providerName))
    .slice(0, 14)
  const visibleTenantRows = tenantRows.slice(0, 10)

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Providers" value={summary.totalProviders} detail="catalogo registrado" tone="neutral" />
        <KpiCard label="Conectados" value={summary.connectedProviders} detail={`${summary.coveragePercent}% do catalogo`} tone="good" />
        <KpiCard label="Faltando" value={summary.missingProviders} detail="sem nenhuma conexao" tone="info" />
        <KpiCard label="Pendentes" value={summary.pendingProviders} detail="draft ou OAuth pendente" tone="warn" />
        <KpiCard label="Atencao" value={summary.attentionProviders} detail="warning ou error" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Matriz de providers</h2>
            <p className="mt-1 text-sm text-slate-500">Providers conectados, pendentes e ausentes no ambiente.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Tenants</th>
                  <th className="px-5 py-3">Conexoes</th>
                  <th className="px-5 py-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProviderRows.map((row) => (
                  <tr key={row.providerSlug} className="text-slate-700">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{row.providerName}</div>
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-400">{row.domain} / {row.authType}</div>
                    </td>
                    <td className="px-5 py-4">{statusBadge(row.status)}</td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-emerald-700">{row.connectedTenants}</span>
                      <span className="text-slate-400"> conectados / </span>
                      <span className="font-medium text-slate-700">{row.missingTenants}</span>
                      <span className="text-slate-400"> faltando</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-950">{row.connectionCount}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(row.lastUpdatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Faltando conectar</h2>
            <div className="mt-4 space-y-3">
              {missingRows.length ? missingRows.map((row) => (
                <div key={row.providerSlug} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{row.providerName}</div>
                    <div className="text-xs text-slate-500">{row.domain}</div>
                  </div>
                  <XCircle className="text-slate-300" size={18} strokeWidth={2.4} />
                </div>
              )) : (
                <p className="text-sm text-slate-500">Nenhum provider totalmente ausente.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Com atencao</h2>
            <div className="mt-4 space-y-3">
              {attentionRows.length ? attentionRows.map((row) => (
                <div key={row.providerSlug} className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50/60 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{row.providerName}</div>
                    <div className="text-xs text-red-700">{row.attentionTenants} tenant(s) com warning/error</div>
                  </div>
                  <AlertTriangle className="text-red-600" size={18} strokeWidth={2.4} />
                </div>
              )) : (
                <p className="text-sm text-slate-500">Sem providers em atencao.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Cobertura por tenant</h2>
          <p className="mt-1 text-sm text-slate-500">Tenants com menor cobertura aparecem primeiro.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Cobertura</th>
                <th className="px-5 py-3">Conectados</th>
                <th className="px-5 py-3">Pendentes</th>
                <th className="px-5 py-3">Atencao</th>
                <th className="px-5 py-3">Ultima mudanca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTenantRows.map((row) => (
                <tr key={row.tenantId} className="text-slate-700">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-950">{row.tenantName}</div>
                    <div className="text-xs text-slate-500">{row.tenantSlug || `tenant-${row.tenantId}`}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-36 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-950" style={{ width: `${row.coveragePercent}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-950">{row.coveragePercent}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-emerald-700">{row.connectedProviders}</td>
                  <td className="px-5 py-4 font-medium text-amber-700">{row.pendingProviders}</td>
                  <td className="px-5 py-4 font-medium text-red-700">{row.attentionProviders}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(row.lastUpdatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
