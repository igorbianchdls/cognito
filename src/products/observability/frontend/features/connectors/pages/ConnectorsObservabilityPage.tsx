import ProviderCoverageDashboard from '@/products/observability/frontend/features/connectors/components/ProviderCoverageDashboard'
import { buildConnectorsCoverage } from '@/products/observability/frontend/features/connectors/lib/providerCoverage'
import { getConnectorsObservabilitySnapshot } from '@/products/observability/server/connectorsObservabilityRepository'
import { listIntegrationProviders } from '@/products/integracoes/shared/providers/providerCatalog'

export default async function ConnectorsObservabilityPage() {
  const snapshot = await getConnectorsObservabilitySnapshot().catch((error) => ({
    error: error instanceof Error ? error.message : 'Falha ao carregar observability de connectors.',
    tenants: [],
    connections: [],
    generatedAt: new Date().toISOString(),
  }))
  const coverage = buildConnectorsCoverage({
    providers: listIntegrationProviders(),
    tenants: snapshot.tenants,
    connections: snapshot.connections,
  })

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Internal observability</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Connectors</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Cobertura interna de providers conectados, pendentes, com erro e ainda ausentes por tenant.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
            Atualizado em {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(snapshot.generatedAt))}
          </div>
        </header>

        {'error' in snapshot ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <div className="font-semibold">Nao foi possivel carregar os dados internos.</div>
            <p className="mt-1">{snapshot.error}</p>
          </section>
        ) : null}

        <ProviderCoverageDashboard
          summary={coverage.summary}
          providerRows={coverage.providerRows}
          tenantRows={coverage.tenantRows}
        />
      </div>
    </main>
  )
}
