import { AlertTriangle, CircleHelp, KeyRound, PlugZap, ShieldCheck, Wrench } from 'lucide-react'

import type {
  ProviderReadinessRow,
  ProviderReadinessStatus,
  ProviderReadinessSummary,
} from '@/products/observability/frontend/features/connectors/lib/providerReadiness'

function statusBadge(status: ProviderReadinessStatus) {
  const map = {
    ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    partial: 'border-amber-200 bg-amber-50 text-amber-700',
    blocked: 'border-red-200 bg-red-50 text-red-700',
    manual: 'border-blue-200 bg-blue-50 text-blue-700',
    unknown: 'border-slate-200 bg-white text-slate-600',
  }
  const label = {
    ready: 'pronto',
    partial: 'parcial',
    blocked: 'bloqueado',
    manual: 'manual',
    unknown: 'desconhecido',
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
    good: ShieldCheck,
    warn: AlertTriangle,
    danger: KeyRound,
    info: Wrench,
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

function issueText(row: ProviderReadinessRow) {
  if (row.missingRequired.length) return `Falta: ${row.missingRequired.join(', ')}`
  if (!row.connectorRegistered) return 'Connector nao registrado'
  if (!row.supportsOAuthCallback && row.authType === 'oauth2') return 'Callback OAuth nao suportado'
  if (row.unknownChecks.length) return `Nao verificado: ${row.unknownChecks.join(', ')}`
  if (row.missingOptional.length) return `Opcional ausente: ${row.missingOptional.join(', ')}`
  return 'Sem pendencias bloqueantes'
}

function checkSummary(row: ProviderReadinessRow) {
  const present = row.checks.filter((check) => check.status === 'present').length
  const missing = row.checks.filter((check) => check.status === 'missing').length
  const unknown = row.checks.filter((check) => check.status === 'unknown').length
  return `${present} ok / ${missing} faltando / ${unknown} desconhecido`
}

export default function ProviderReadinessDashboard({
  summary,
  rows,
}: {
  summary: ProviderReadinessSummary
  rows: ProviderReadinessRow[]
}) {
  const visibleRows = [...rows].sort((a, b) => {
    const weight: Record<ProviderReadinessStatus, number> = {
      blocked: 0,
      unknown: 1,
      partial: 2,
      ready: 3,
      manual: 4,
    }
    return weight[a.status] - weight[b.status] || a.providerName.localeCompare(b.providerName)
  })
  const problemRows = visibleRows.filter((row) => row.status === 'blocked' || row.status === 'unknown' || row.status === 'partial').slice(0, 8)

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Providers" value={summary.totalProviders} detail="catalogo registrado" tone="neutral" />
        <KpiCard label="Prontos" value={summary.readyProviders} detail="OAuth e connector ok" tone="good" />
        <KpiCard label="Parciais" value={summary.partialProviders} detail="sem bloqueio critico" tone="warn" />
        <KpiCard label="Bloqueados" value={summary.blockedProviders} detail="faltam requisitos" tone="danger" />
        <KpiCard label="Manuais" value={summary.manualProviders} detail="credencial por tenant" tone="info" />
      </section>

      {!summary.secretManagerChecked ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <div className="font-semibold">Secret Manager nao foi verificado neste runtime.</div>
          <p className="mt-1">
            A aba ainda mostra env vars e registro de connectors, mas OAuth sem env local fica como desconhecido ate o servidor ter acesso GCP.
          </p>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Readiness de providers</h2>
            <p className="mt-1 text-sm text-slate-500">Configuracao de provider, secrets OAuth e connector registrado.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Connector</th>
                  <th className="px-5 py-3">Config</th>
                  <th className="px-5 py-3">Pendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => (
                  <tr key={row.providerSlug} className="text-slate-700">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{row.providerName}</div>
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-400">{row.domain} / {row.authType}</div>
                    </td>
                    <td className="px-5 py-4">{statusBadge(row.status)}</td>
                    <td className="px-5 py-4">
                      <span className={row.connectorRegistered ? 'font-medium text-emerald-700' : 'font-medium text-red-700'}>
                        {row.connectorRegistered ? 'registrado' : 'ausente'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{checkSummary(row)}</td>
                    <td className="max-w-md px-5 py-4 text-slate-600">{issueText(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Pendencias</h2>
          <div className="mt-4 space-y-3">
            {problemRows.length ? problemRows.map((row) => (
              <div key={row.providerSlug} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-950">{row.providerName}</div>
                  <div className="text-xs text-slate-500">{issueText(row)}</div>
                </div>
                {row.status === 'blocked' ? (
                  <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={18} strokeWidth={2.4} />
                ) : (
                  <CircleHelp className="mt-0.5 shrink-0 text-slate-400" size={18} strokeWidth={2.4} />
                )}
              </div>
            )) : (
              <p className="text-sm text-slate-500">Sem pendencias de readiness.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
