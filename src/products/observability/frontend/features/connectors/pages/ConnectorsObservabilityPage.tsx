import Link from 'next/link'
import type { ReactNode } from 'react'

import ProviderCoverageDashboard from '@/products/observability/frontend/features/connectors/components/ProviderCoverageDashboard'
import ProviderReadinessDashboard from '@/products/observability/frontend/features/connectors/components/ProviderReadinessDashboard'
import { buildConnectorsCoverage } from '@/products/observability/frontend/features/connectors/lib/providerCoverage'
import { buildProviderReadinessSnapshot } from '@/products/observability/frontend/features/connectors/lib/providerReadiness'
import { getConnectorsObservabilitySnapshot } from '@/products/observability/server/connectorsObservabilityRepository'
import { listIntegrationProviders } from '@/products/integracoes/shared/providers/providerCatalog'

export type ConnectorsObservabilityTab = 'connections' | 'providers'

function tabClass(active: boolean) {
  return active
    ? 'border-slate-950 bg-slate-950 text-white'
    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
}

export default async function ConnectorsObservabilityPage({
  activeTab = 'connections',
}: {
  activeTab?: ConnectorsObservabilityTab
}) {
  const providers = listIntegrationProviders()
  const isProvidersTab = activeTab === 'providers'

  let generatedAt = new Date().toISOString()
  let errorMessage: string | null = null
  let content: ReactNode = null

  if (isProvidersTab) {
    const snapshot = await buildProviderReadinessSnapshot(providers).catch((error) => ({
      error: error instanceof Error ? error.message : 'Falha ao carregar readiness de providers.',
      summary: {
        totalProviders: providers.length,
        readyProviders: 0,
        partialProviders: 0,
        blockedProviders: 0,
        manualProviders: 0,
        unknownProviders: providers.length,
        connectorRegisteredProviders: 0,
        secretManagerChecked: false,
        generatedAt: new Date().toISOString(),
      },
      rows: [],
      generatedAt: new Date().toISOString(),
    }))
    generatedAt = snapshot.generatedAt
    errorMessage = 'error' in snapshot ? snapshot.error : null
    content = <ProviderReadinessDashboard summary={snapshot.summary} rows={snapshot.rows} />
  } else {
    const snapshot = await getConnectorsObservabilitySnapshot().catch((error) => ({
      error: error instanceof Error ? error.message : 'Falha ao carregar observability de connectors.',
      tenants: [],
      connections: [],
      generatedAt: new Date().toISOString(),
    }))
    generatedAt = snapshot.generatedAt
    errorMessage = 'error' in snapshot ? snapshot.error : null
    const coverage = buildConnectorsCoverage({
      providers,
      tenants: snapshot.tenants,
      connections: snapshot.connections,
    })
    content = (
      <ProviderCoverageDashboard
        summary={coverage.summary}
        providerRows={coverage.providerRows}
        tenantRows={coverage.tenantRows}
      />
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Internal observability</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Connectors</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Observability separada entre providers habilitados e conexoes criadas por tenant.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
            Atualizado em {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(generatedAt))}
          </div>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Abas de observability de connectors">
          <Link
            href="/internal/observability/connectors?tab=connections"
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${tabClass(activeTab === 'connections')}`}
          >
            Conexoes por tenant
          </Link>
          <Link
            href="/internal/observability/connectors?tab=providers"
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${tabClass(activeTab === 'providers')}`}
          >
            Providers habilitados
          </Link>
        </nav>

        {errorMessage ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <div className="font-semibold">Nao foi possivel carregar os dados internos.</div>
            <p className="mt-1">{errorMessage}</p>
          </section>
        ) : null}

        {content}
      </div>
    </main>
  )
}
