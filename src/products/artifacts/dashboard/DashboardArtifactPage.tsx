'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ArtifactWorkspaceHeader } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceHeader'
import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import { applyDashboardTreeLayoutToSource } from '@/products/artifacts/dashboard/source/dashboardLayoutPersistence'
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
  currentDraftVersion: number
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
  currentDraftVersion,
  availableVersions,
  source,
  updatedAt,
}: DashboardArtifactPageProps) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.72)
  const [draftSource, setDraftSource] = useState(source)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHistoricalVersion = version !== currentDraftVersion
  const isDirty = draftSource !== source
  const files = useMemo<ArtifactCodeFile[]>(
    () => [
      {
        path: 'app/dashboard.tsx',
        name: 'dashboard.tsx',
        directory: 'app',
        extension: 'tsx',
        language: 'typescript',
        content: draftSource,
      },
    ],
    [draftSource],
  )

  useEffect(() => {
    setDraftSource(source)
    setSaveError(null)
    setSaveMessage(null)
  }, [source, version])

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

  const handleTreeChange = useCallback((nextTree: any) => {
    setDraftSource(applyDashboardTreeLayoutToSource(source, nextTree))
    setSaveError(null)
    setSaveMessage(null)
  }, [source])

  async function handleSave() {
    if (!isDirty || isHistoricalVersion || saving) return

    try {
      setSaving(true)
      setSaveError(null)
      setSaveMessage(null)

      const response = await fetch(`/api/artifacts/dashboards/${artifactId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          expected_version: currentDraftVersion,
          title,
          source: draftSource,
          change_summary: 'Ajuste de layout',
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) {
        throw new Error(String(json?.error || `Falha ao salvar (${response.status})`))
      }

      const params = new URLSearchParams(searchParams?.toString() || '')
      params.delete('version')
      const query = params.toString()
      setSaveMessage(`Layout salvo como v${json?.artifact?.next_version ?? currentDraftVersion + 1}`)
      router.replace(query ? `${pathname}?${query}` : pathname)
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro ao salvar dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
        <ArtifactWorkspaceHeader
          title={title}
          titleIcon="solar:database-bold"
          activeView={activeView}
          zoom={zoom}
          onChangeView={setActiveView}
          onZoomChange={setZoom}
          showChromeActions={false}
          leadingActions={
            <div className="rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#5F5F5A]">
              Artifacts
            </div>
          }
          extraActions={
            <>
              <div className="flex items-center gap-2 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-3 py-[0.35rem] text-[12px] font-medium text-[#5F5F5A]">
                <span>v</span>
                <select
                  value={String(version)}
                  onChange={(event) => handleVersionChange(event.target.value)}
                  className="bg-transparent text-[12px] font-medium text-[#1F1F1D] outline-none"
                >
                  {availableVersions.map((item) => (
                    <option key={`${item.kind}-${item.version}`} value={String(item.version)}>
                      {`v${item.version}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[12px] font-medium text-[#5F5F5A]">
                {status}
              </div>
              <div className="rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[12px] font-medium text-[#5F5F5A]">
                {`draft v${version}`}
              </div>
              {isDirty ? (
                <div className="rounded-md border-[0.5px] border-amber-300 bg-amber-50 px-2 py-[0.35rem] text-[12px] font-medium text-amber-800">
                  alterações não salvas
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isHistoricalVersion || saving}
                className={`flex items-center justify-center rounded-md px-2 py-[0.35rem] text-[14px] font-medium transition ${
                  !isDirty || isHistoricalVersion || saving
                    ? 'cursor-not-allowed bg-[#E2E2E0] text-[#9A9A95]'
                    : 'bg-[#039AFE] text-white hover:bg-[#028ae0]'
                }`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          }
        />

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB] px-6 py-6">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm text-[#5F5F5A]">
              <span>{`id: ${artifactId}`}</span>
              <span>{`atualizado: ${formatDate(updatedAt)}`}</span>
              <span>{activeView === 'preview' ? 'Preview ativo' : 'Source ativo'}</span>
              {isHistoricalVersion ? (
                <span className="text-[#8B5E00]">Você está vendo uma versão histórica. Para salvar mudanças, volte para a draft atual.</span>
              ) : null}
              {saveError ? <span className="text-red-700">{saveError}</span> : null}
              {saveMessage ? <span className="text-emerald-700">{saveMessage}</span> : null}
            </div>

            {activeView === 'preview' ? (
              <DashboardWorkspacePreview
                sourcePath="app/dashboard.tsx"
                files={files}
                zoom={zoom}
                onTreeChange={handleTreeChange}
              />
            ) : (
              <div className="overflow-auto border-[0.5px] border-[#DDDDD8] bg-[#1f1b18]">
                <pre className="min-w-full overflow-x-auto p-5 text-sm leading-6 text-[#f6f2eb]">
                  <code>{draftSource}</code>
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </ArtifactWorkspacePage>
  )
}
