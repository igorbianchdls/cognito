'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import {
  DASHBOARD_CHART_PALETTE_OPTIONS,
  getDashboardChartPaletteValueFromColors,
} from '@/products/artifacts/dashboard/chartPalettes'
import {
  DASHBOARD_BORDER_PRESET_OPTIONS,
  type DashboardBorderPreset,
} from '@/products/artifacts/dashboard/borderPresets'
import { ArtifactWorkspaceCodeEditor } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceCodeEditor'
import { ArtifactWorkspaceHeader } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceHeader'
import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import {
  DashboardThemeModal,
  type DashboardAppearanceMode,
} from '@/products/artifacts/dashboard/workspace/DashboardThemeModal'
import {
  getDashboardBorderPresetFromSource,
  getDashboardChartColorsFromSource,
  getDashboardChartPaletteNameFromSource,
  getDashboardThemeNameFromSource,
  replaceDashboardBorderPresetInSource,
  replaceDashboardChartPaletteNameInSource,
  replaceDashboardThemeNameInSource,
} from '@/products/artifacts/dashboard/parser/dashboardJsxParser'
import { applyDashboardTreeLayoutToSource } from '@/products/artifacts/dashboard/source/dashboardLayoutPersistence'
import { DashboardWorkspacePreview } from '@/products/artifacts/dashboard/workspace/DashboardWorkspacePreview'
import type { DashboardAppearanceOverrides } from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import type { DashboardListItem } from '@/products/artifacts/backend/dashboardArtifactsService'

type DashboardSourceVersionListItem = {
  version: number
  kind: 'draft' | 'published'
  change_summary: string | null
  created_at: string
}

export type DashboardArtifactWorkspaceProps = {
  artifactId: string
  dashboards: DashboardListItem[]
  title: string
  status: string
  version: number
  currentDraftVersion: number
  metadata: Record<string, unknown>
  availableVersions: DashboardSourceVersionListItem[]
  source: string
  updatedAt: string
  containerHeightClass?: 'h-screen' | 'h-full'
  allowSourceEditing?: boolean
  showHeaderStatusBadges?: boolean
  onSelectDashboard?: (dashboardId: string) => void
  onSelectVersion?: (version: number | null) => void
  onSaveSuccess?: (nextVersion: number) => void | Promise<void>
}

function cloneAppearanceOverrides(overrides: DashboardAppearanceOverrides): DashboardAppearanceOverrides {
  return JSON.parse(JSON.stringify(overrides || {})) as DashboardAppearanceOverrides
}

function areAppearanceOverridesEqual(left: DashboardAppearanceOverrides, right: DashboardAppearanceOverrides) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

function readAppearanceOverridesFromMetadata(metadata: Record<string, unknown>): DashboardAppearanceOverrides {
  const value = metadata?.appearanceOverrides
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return cloneAppearanceOverrides(value as DashboardAppearanceOverrides)
}

export function DashboardArtifactWorkspace({
  artifactId,
  dashboards,
  title,
  status,
  version,
  currentDraftVersion,
  metadata,
  availableVersions,
  source,
  updatedAt: _updatedAt,
  containerHeightClass = 'h-screen',
  allowSourceEditing = false,
  showHeaderStatusBadges = true,
  onSelectDashboard,
  onSelectVersion,
  onSaveSuccess,
}: DashboardArtifactWorkspaceProps) {
  const dashboardThemeOptions = useMemo(
    () => APPS_THEME_OPTIONS.filter((option) => String(option.value).trim().toLowerCase() !== 'aero'),
    [],
  )
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(1)
  const [draftSource, setDraftSource] = useState(source)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [appearanceMode, setAppearanceMode] = useState<DashboardAppearanceMode>('theme')
  const [themeModalBaseSource, setThemeModalBaseSource] = useState(source)
  const [draftThemeName, setDraftThemeName] = useState('light')
  const [themeModalBaseName, setThemeModalBaseName] = useState('light')
  const [draftChartPalette, setDraftChartPalette] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [chartPaletteBaseName, setChartPaletteBaseName] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [draftBorderPreset, setDraftBorderPreset] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [borderPresetBaseName, setBorderPresetBaseName] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [loadedAppearanceOverrides, setLoadedAppearanceOverrides] = useState<DashboardAppearanceOverrides>({})
  const [draftAppearanceOverrides, setDraftAppearanceOverrides] = useState<DashboardAppearanceOverrides>({})
  const [appearanceOverridesBase, setAppearanceOverridesBase] = useState<DashboardAppearanceOverrides>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHistoricalVersion = version !== currentDraftVersion
  const hasAppearanceChanges = !areAppearanceOverridesEqual(draftAppearanceOverrides, loadedAppearanceOverrides)
  const isDirty = draftSource !== source || hasAppearanceChanges
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
    const sourceThemeName = getDashboardThemeNameFromSource(source, 'light')
    const sourceChartPalette = (() => {
      const paletteName = getDashboardChartPaletteNameFromSource(source, '')
      if (paletteName) return paletteName
      return getDashboardChartPaletteValueFromColors(
        getDashboardChartColorsFromSource(source, DASHBOARD_CHART_PALETTE_OPTIONS[0].colors),
      )
    })()
    const sourceBorderPreset = getDashboardBorderPresetFromSource(
      source,
      DASHBOARD_BORDER_PRESET_OPTIONS[0].value,
    ) as DashboardBorderPreset
    const appearanceOverrides = readAppearanceOverridesFromMetadata(metadata)

    setDraftSource(source)
    setThemeModalBaseSource(source)
    setDraftThemeName(sourceThemeName)
    setThemeModalBaseName(sourceThemeName)
    setDraftChartPalette(sourceChartPalette)
    setChartPaletteBaseName(sourceChartPalette)
    setDraftBorderPreset(sourceBorderPreset)
    setBorderPresetBaseName(sourceBorderPreset)
    setLoadedAppearanceOverrides(appearanceOverrides)
    setDraftAppearanceOverrides(cloneAppearanceOverrides(appearanceOverrides))
    setAppearanceOverridesBase(cloneAppearanceOverrides(appearanceOverrides))
    setSaveError(null)
    setSaveMessage(null)
  }, [source, version, metadata])

  function applyAppearanceToSource(baseSource: string, themeName: string, chartPaletteValue: string, borderPreset: string) {
    return replaceDashboardBorderPresetInSource(
      replaceDashboardChartPaletteNameInSource(
        replaceDashboardThemeNameInSource(baseSource, themeName),
        chartPaletteValue,
      ),
      borderPreset,
    )
  }

  function handleVersionChange(nextVersion: string) {
    const normalizedVersion = !nextVersion || Number(nextVersion) === version ? null : Number(nextVersion)
    if (onSelectVersion) {
      onSelectVersion(normalizedVersion)
      return
    }

    const params = new URLSearchParams(searchParams?.toString() || '')
    if (normalizedVersion == null) {
      params.delete('version')
    } else {
      params.set('version', String(normalizedVersion))
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleDashboardChange(nextDashboardId: string) {
    if (!nextDashboardId || nextDashboardId === artifactId) return
    if (onSelectDashboard) {
      onSelectDashboard(nextDashboardId)
      return
    }
    router.push(`/artifacts/dashboards/${nextDashboardId}`)
  }

  const handleTreeChange = useCallback((nextTree: any) => {
    setDraftSource((currentDraftSource) => applyDashboardTreeLayoutToSource(currentDraftSource, nextTree))
    setSaveError(null)
    setSaveMessage(null)
  }, [])

  const handleSourceChange = useCallback((nextSource: string) => {
    setDraftSource(nextSource)
    setSaveError(null)
    setSaveMessage(null)
  }, [])

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
          metadata: {
            ...metadata,
            appearanceOverrides: draftAppearanceOverrides,
          },
          change_summary: 'Ajustes do dashboard',
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) {
        throw new Error(String(json?.error || `Falha ao salvar (${response.status})`))
      }

      const nextVersion = Number(json?.artifact?.next_version ?? currentDraftVersion + 1)
      setSaveMessage(`Alterações salvas como v${nextVersion}`)
      setLoadedAppearanceOverrides(cloneAppearanceOverrides(draftAppearanceOverrides))
      setThemeModalBaseSource(draftSource)

      if (onSaveSuccess) {
        await onSaveSuccess(nextVersion)
      } else {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.delete('version')
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname)
        router.refresh()
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro ao salvar dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <div className={`flex ${containerHeightClass} flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]`}>
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
                <span>Dashboard</span>
                <select
                  value={artifactId}
                  onChange={(event) => handleDashboardChange(event.target.value)}
                  className="max-w-[240px] bg-transparent text-[12px] font-medium text-[#1F1F1D] outline-none"
                >
                  {dashboards.map((dashboard) => (
                    <option key={dashboard.id} value={dashboard.id}>
                      {dashboard.title}
                    </option>
                  ))}
                </select>
              </div>
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
              {showHeaderStatusBadges ? (
                <>
                  <div className="rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[12px] font-medium text-[#5F5F5A]">
                    {status}
                  </div>
                  <div className="rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[12px] font-medium text-[#5F5F5A]">
                    {`draft v${version}`}
                  </div>
                </>
              ) : null}
              {isDirty ? (
                <div className="rounded-md border-[0.5px] border-amber-300 bg-amber-50 px-2 py-[0.35rem] text-[12px] font-medium text-amber-800">
                  alterações não salvas
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setPreviewRefreshKey((current) => current + 1)}
                disabled={activeView !== 'preview'}
                aria-label="Atualizar preview"
                title="Atualizar preview"
                className={`flex items-center justify-center rounded-md border-[0.5px] px-2 py-[0.35rem] text-[14px] transition ${
                  activeView !== 'preview'
                    ? 'cursor-not-allowed border-[#DDDDD8] bg-[#ECECEB] text-[#9A9A95]'
                    : 'border-[#DDDDD8] bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13.5 3.5v3h-3" />
                  <path d="M12.6 6.5A5.25 5.25 0 1 0 13 10" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppearanceMode('theme')
                  setThemeModalBaseSource(draftSource)
                  setThemeModalBaseName(draftThemeName)
                  setChartPaletteBaseName(draftChartPalette)
                  setBorderPresetBaseName(draftBorderPreset)
                  setAppearanceOverridesBase(cloneAppearanceOverrides(draftAppearanceOverrides))
                  setIsThemeModalOpen(true)
                }}
                disabled={isHistoricalVersion}
                className={`flex items-center justify-center rounded-md border-[0.5px] px-2 py-[0.35rem] text-[14px] font-medium transition ${
                  isHistoricalVersion
                    ? 'cursor-not-allowed border-[#DDDDD8] bg-[#ECECEB] text-[#9A9A95]'
                    : 'border-[#DDDDD8] bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
                }`}
              >
                Tema
              </button>
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

        <main
          className={`min-h-0 flex-1 border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB] ${
            activeView === 'preview' ? 'overflow-auto' : 'overflow-hidden'
          }`}
        >
          <div className={`flex ${activeView === 'code' ? 'h-full min-h-0' : ''} flex-col gap-4`}>
            {isHistoricalVersion || saveError || saveMessage ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-4 text-sm text-[#5F5F5A]">
                {isHistoricalVersion ? (
                  <span className="text-[#8B5E00]">Você está vendo uma versão histórica. Para salvar mudanças, volte para a draft atual.</span>
                ) : null}
                {saveError ? <span className="text-red-700">{saveError}</span> : null}
                {saveMessage ? <span className="text-emerald-700">{saveMessage}</span> : null}
              </div>
            ) : null}

            {activeView === 'preview' ? (
              <DashboardWorkspacePreview
                key={previewRefreshKey}
                sourcePath="app/dashboard.tsx"
                files={files}
                zoom={zoom}
                appearanceOverrides={draftAppearanceOverrides}
                onTreeChange={handleTreeChange}
              />
            ) : (
              allowSourceEditing ? (
                <div className="flex min-h-0 flex-1">
                  <ArtifactWorkspaceCodeEditor
                    file={files[0]}
                    selectableFiles={files}
                    selectedSelectablePath={files[0]?.path ?? 'app/dashboard.tsx'}
                    onSelectSelectable={() => {}}
                    editable
                    disabled={isHistoricalVersion}
                    onChange={handleSourceChange}
                  />
                </div>
              ) : (
                <div className="overflow-auto border-[0.5px] border-[#DDDDD8] bg-[#1f1b18]">
                  <pre className="min-w-full overflow-x-auto p-5 text-sm leading-6 text-[#f6f2eb]">
                    <code>{draftSource}</code>
                  </pre>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      <DashboardThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => {
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
          setDraftAppearanceOverrides(cloneAppearanceOverrides(appearanceOverridesBase))
          setDraftSource(themeModalBaseSource)
          setIsThemeModalOpen(false)
        }}
        onConfirm={() => {
          setIsThemeModalOpen(false)
        }}
        onRevert={() => {
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
          setDraftAppearanceOverrides(cloneAppearanceOverrides(appearanceOverridesBase))
          setDraftSource(themeModalBaseSource)
        }}
        mode={appearanceMode}
        onModeChange={setAppearanceMode}
        onSelect={(themeName) => {
          setDraftThemeName(themeName)
          setDraftSource((currentDraftSource) =>
            applyAppearanceToSource(currentDraftSource, themeName, draftChartPalette, draftBorderPreset),
          )
        }}
        onSelectChartPalette={(paletteValue) => {
          setDraftChartPalette(paletteValue)
          setDraftSource((currentDraftSource) =>
            applyAppearanceToSource(currentDraftSource, draftThemeName, paletteValue, draftBorderPreset),
          )
        }}
        onSelectBorderPreset={(borderPreset) => {
          setDraftBorderPreset(borderPreset as DashboardBorderPreset)
          setDraftSource((currentDraftSource) =>
            applyAppearanceToSource(currentDraftSource, draftThemeName, draftChartPalette, borderPreset),
          )
        }}
        appearanceOverrides={draftAppearanceOverrides}
        onAppearanceOverridesChange={setDraftAppearanceOverrides}
        selectedTheme={draftThemeName}
        selectedChartPalette={draftChartPalette}
        selectedBorderPreset={draftBorderPreset}
        chartPalettes={DASHBOARD_CHART_PALETTE_OPTIONS}
        borderPresets={DASHBOARD_BORDER_PRESET_OPTIONS}
        revertDisabled={
          draftThemeName === themeModalBaseName &&
          draftChartPalette === chartPaletteBaseName &&
          draftBorderPreset === borderPresetBaseName &&
          areAppearanceOverridesEqual(draftAppearanceOverrides, appearanceOverridesBase)
        }
        themes={dashboardThemeOptions}
      />
    </ArtifactWorkspacePage>
  )
}
