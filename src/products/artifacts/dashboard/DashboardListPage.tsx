import Link from 'next/link'

import type { DashboardListItem } from '@/products/artifacts/backend/dashboardArtifactsService'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function statusLabel(status: DashboardListItem['status']) {
  if (status === 'published') return 'Publicado'
  if (status === 'archived') return 'Arquivado'
  return 'Rascunho'
}

export function DashboardListPage({ dashboards }: { dashboards: DashboardListItem[] }) {
  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 py-10 text-[#2d2a26]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7f73]">Artifacts</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Dashboards</h1>
          <p className="max-w-2xl text-sm text-[#6b6259]">
            Lista de dashboards persistidos em `artifacts.dashboards`, ordenados pela atualização mais recente.
          </p>
        </header>

        {dashboards.length === 0 ? (
          <section className="rounded-3xl border border-[#ddd5ca] bg-white p-10 shadow-sm">
            <h2 className="text-lg font-semibold tracking-[-0.03em]">Nenhum dashboard cadastrado</h2>
            <p className="mt-2 max-w-xl text-sm text-[#6b6259]">
              Ainda não existem registros em `artifacts.dashboards`. Quando os dashboards forem criados pelo fluxo
              database-first, eles aparecerão aqui.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-[#ddd5ca] bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(280px,2fr)_120px_120px_140px_180px] gap-4 border-b border-[#ebe4da] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7f73]">
              <div>Título</div>
              <div>Status</div>
              <div>Draft</div>
              <div>Published</div>
              <div>Atualizado em</div>
            </div>

            <div className="divide-y divide-[#f0ebe3]">
              {dashboards.map((dashboard) => (
                <article
                  key={dashboard.id}
                  className="grid grid-cols-[minmax(280px,2fr)_120px_120px_140px_180px] gap-4 px-6 py-5 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/artifacts/dashboards/${dashboard.id}`}
                      className="truncate font-medium tracking-[-0.02em] text-[#2d2a26] underline-offset-4 hover:underline"
                    >
                      {dashboard.title}
                    </Link>
                    <div className="mt-1 truncate text-xs text-[#8a7f73]">
                      id: {dashboard.id}
                      {dashboard.slug ? `  |  slug: ${dashboard.slug}` : ''}
                    </div>
                  </div>
                  <div>{statusLabel(dashboard.status)}</div>
                  <div>{dashboard.current_draft_version ?? '-'}</div>
                  <div>{dashboard.current_published_version ?? '-'}</div>
                  <div className="text-[#6b6259]">{formatDate(dashboard.updated_at)}</div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
