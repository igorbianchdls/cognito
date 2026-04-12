'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import { DashboardWorkspacePreview } from '@/products/artifacts/dashboard/workspace/DashboardWorkspacePreview'

type DashboardSourceVersionListItem = {
  version: number
  kind: 'draft' | 'published'
  change_summary: string | null
  created_at: string
}

type DashboardArtifactPageProps = {
  artifactId: string
  title: string
  status: string
  version: number
  availableVersions: DashboardSourceVersionListItem[]
  source: string
  updatedAt: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function DashboardArtifactPage({
  artifactId,
  title,
  status,
  version,
  availableVersions,
  source,
  updatedAt,
}: DashboardArtifactPageProps) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const files = useMemo<ArtifactCodeFile[]>(
    () => [
      {
        path: 'app/dashboard.tsx',
        name: 'dashboard.tsx',
        directory: 'app',
        extension: 'tsx',
        language: 'typescript',
        content: source,
      },
    ],
    [source],
  )

  function handleVersionChange(nextVersion: string) {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (!nextVersion || Number(nextVersion) === version) {
      params.delete('version')
    } else {
      params.set('version', nextVersion)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <main className="min-h-screen bg-[#f5f3ef] px-6 py-8 text-[#2d2a26]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
          <header className="rounded-3xl border border-[#ddd5ca] bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7f73]">Artifacts / Dashboards</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
                <p className="mt-2 text-sm text-[#6b6259]">
                  id: {artifactId}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6259]">
                <label className="flex items-center gap-2 rounded-full border border-[#ddd5ca] bg-[#f8f5ef] px-3 py-1.5">
                  <span>versão:</span>
                  <select
                    value={String(version)}
                    onChange={(event) => handleVersionChange(event.target.value)}
                    className="bg-transparent text-xs font-medium text-[#2d2a26] outline-none"
                  >
                    {availableVersions.map((item) => (
                      <option key={`${item.kind}-${item.version}`} value={String(item.version)}>
                        {`v${item.version}`}
                        {item.change_summary ? ` - ${item.change_summary}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="rounded-full border border-[#ddd5ca] bg-[#f8f5ef] px-3 py-1.5">status: {status}</span>
                <span className="rounded-full border border-[#ddd5ca] bg-[#f8f5ef] px-3 py-1.5">draft: v{version}</span>
                <span className="rounded-full border border-[#ddd5ca] bg-[#f8f5ef] px-3 py-1.5">
                  atualizado: {formatDate(updatedAt)}
                </span>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-[#ddd5ca] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ebe4da] px-4 py-3">
              <div className="text-sm font-medium tracking-[-0.02em]">Dashboard Persistido</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    activeView === 'preview' ? 'bg-[#2d2a26] text-white' : 'bg-[#f3eee6] text-[#5c544c]'
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('code')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    activeView === 'code' ? 'bg-[#2d2a26] text-white' : 'bg-[#f3eee6] text-[#5c544c]'
                  }`}
                >
                  Source
                </button>
              </div>
            </div>

            {activeView === 'preview' ? (
              <div className="overflow-auto bg-[#ebe7df] p-5">
                <DashboardWorkspacePreview sourcePath="app/dashboard.tsx" files={files} zoom={0.72} />
              </div>
            ) : (
              <div className="overflow-auto bg-[#1f1b18] p-0">
                <pre className="min-w-full overflow-x-auto p-5 text-sm leading-6 text-[#f6f2eb]">
                  <code>{source}</code>
                </pre>
              </div>
            )}
          </section>
        </div>
      </main>
    </ArtifactWorkspacePage>
  )
}
