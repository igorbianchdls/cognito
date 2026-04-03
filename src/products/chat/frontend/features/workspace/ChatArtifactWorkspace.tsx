'use client'

import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import FileExplorer from '@/components/file-explorer/FileExplorer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { sandboxActions, $previewArtifactPath, $sandboxActiveTab } from '@/chat/sandbox'
import { ArtifactPreviewStage } from '@/products/artifacts/core/workspace/components/ArtifactPreviewStage'
import { ArtifactWorkspaceHeader } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceHeader'
import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import {
  DASHBOARD_CHART_PALETTE_OPTIONS,
  getDashboardChartPaletteValueFromColors,
} from '@/products/artifacts/dashboard/chartPalettes'
import { DASHBOARD_BORDER_PRESET_OPTIONS, type DashboardBorderPreset } from '@/products/artifacts/dashboard/borderPresets'
import {
  getDashboardBorderPresetFromSource,
  getDashboardChartColorsFromSource,
  getDashboardChartPaletteNameFromSource,
  getDashboardThemeNameFromSource,
  replaceDashboardBorderPresetInSource,
  replaceDashboardChartPaletteNameInSource,
  replaceDashboardThemeNameInSource,
} from '@/products/artifacts/dashboard/parser/dashboardJsxParser'
import {
  DashboardThemeModal,
  type DashboardAppearanceMode,
} from '@/products/artifacts/dashboard/workspace/DashboardThemeModal'
import HeaderActions from '@/products/chat/shared/chat-ui/components/HeaderActions'
import DashboardPicker from '@/products/chat/shared/chat-ui/components/json-render/DashboardPicker'
import JsonRenderPreview from '@/products/chat/shared/chat-ui/components/json-render/JsonRenderPreview'

function getTitleFromPreviewPath(path: string) {
  const fileName = String(path || '').split('/').filter(Boolean).pop() || 'workspace'
  return fileName.replace(/\.(dsl|tsx)$/i, '') || 'workspace'
}

function isDashboardArtifactPath(path: string) {
  return String(path || '').startsWith('/vercel/sandbox/dashboard/') && String(path || '').endsWith('.tsx')
}

async function readSandboxTextFile(chatId: string, path: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fs-read', chatId, path }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    content?: string
    isBinary?: boolean
    error?: string
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Falha ao ler arquivo ${path}`)
  }
  if (data.isBinary) {
    throw new Error(`Arquivo binario nao suportado: ${path}`)
  }
  return String(data.content || '')
}

async function writeSandboxTextFile(chatId: string, path: string, content: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fs-write', chatId, path, content }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Falha ao salvar arquivo ${path}`)
  }
}

export function ChatArtifactWorkspace({
  chatId,
  onClose,
  onExpand,
  expanded,
  className,
}: {
  chatId?: string
  onClose?: () => void
  onExpand?: () => void
  expanded?: boolean
  className?: string
}) {
  const activeTab = useStore($sandboxActiveTab)
  const previewPath = useStore($previewArtifactPath)
  const [zoom, setZoom] = useState(1)
  const [artifactPickerOpen, setArtifactPickerOpen] = useState(false)
  const activeView = activeTab === 'code' ? 'code' : 'preview'
  const title = useMemo(() => getTitleFromPreviewPath(previewPath), [previewPath])
  const isDashboardArtifact = useMemo(() => isDashboardArtifactPath(previewPath), [previewPath])
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [appearanceMode, setAppearanceMode] = useState<DashboardAppearanceMode>('theme')
  const [draftThemeName, setDraftThemeName] = useState('light')
  const [themeModalBaseName, setThemeModalBaseName] = useState('light')
  const [draftChartPalette, setDraftChartPalette] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [chartPaletteBaseName, setChartPaletteBaseName] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [draftBorderPreset, setDraftBorderPreset] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [borderPresetBaseName, setBorderPresetBaseName] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [dashboardSource, setDashboardSource] = useState('')
  const [themeBusy, setThemeBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!chatId || !isDashboardArtifact || !previewPath) {
        if (!cancelled) {
          setDashboardSource('')
        }
        return
      }

      try {
        const source = await readSandboxTextFile(chatId, previewPath)
        if (cancelled) return
        setDashboardSource(source)
        const themeName = getDashboardThemeNameFromSource(source, 'light')
        const paletteName = getDashboardChartPaletteNameFromSource(source, '')
          || getDashboardChartPaletteValueFromColors(
            getDashboardChartColorsFromSource(source, DASHBOARD_CHART_PALETTE_OPTIONS[0].colors),
          )
        const borderPreset = getDashboardBorderPresetFromSource(source, DASHBOARD_BORDER_PRESET_OPTIONS[0].value) as DashboardBorderPreset
        setThemeModalBaseName(themeName)
        setDraftThemeName(themeName)
        setChartPaletteBaseName(paletteName)
        setDraftChartPalette(paletteName)
        setBorderPresetBaseName(borderPreset)
        setDraftBorderPreset(borderPreset)
      } catch {
        if (!cancelled) setDashboardSource('')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [chatId, isDashboardArtifact, previewPath])

  async function applyDashboardAppearance(themeName: string, chartPaletteValue: string, borderPreset: string) {
    if (!chatId || !previewPath || !isDashboardArtifact) return
    const nextContent = replaceDashboardBorderPresetInSource(
      replaceDashboardChartPaletteNameInSource(
        replaceDashboardThemeNameInSource(dashboardSource, themeName),
        chartPaletteValue,
      ),
      borderPreset,
    )
    setThemeBusy(true)
    try {
      await writeSandboxTextFile(chatId, previewPath, nextContent)
      setDashboardSource(nextContent)
      window.dispatchEvent(new CustomEvent('sandbox-preview-refresh', { detail: { path: previewPath } }))
    } finally {
      setThemeBusy(false)
    }
  }

  return (
    <>
      <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${className ?? ''}`}>
        <ArtifactWorkspaceHeader
          title={title}
          titleIcon="solar:document-bold"
          activeView={activeView}
          zoom={zoom}
          onChangeView={(view) => sandboxActions.setActiveTab(view)}
          onZoomChange={setZoom}
          showChromeActions={false}
          extraActions={
            <>
              <Popover open={artifactPickerOpen} onOpenChange={setArtifactPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    title="Selecionar artefato"
                    aria-label="Selecionar artefato"
                    className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
                  >
                    <Icon icon="solar:widget-5-bold" className="mr-1 h-4 w-4" />
                    Artefatos
                    <Icon icon="solar:alt-arrow-down-outline" className="ml-1 h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" side="bottom" sideOffset={8} className="w-auto p-2">
                  <DashboardPicker chatId={chatId} compact onSelected={() => setArtifactPickerOpen(false)} />
                </PopoverContent>
              </Popover>
              {isDashboardArtifact ? (
                <button
                  type="button"
                  title="Selecionar tema"
                  aria-label="Selecionar tema"
                  disabled={themeBusy}
                  onClick={() => {
                    setAppearanceMode('theme')
                    setThemeModalOpen(true)
                  }}
                  className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B] disabled:cursor-default disabled:opacity-60"
                >
                  <Icon icon="solar:palette-round-bold" className="mr-1 h-4 w-4" />
                  Tema
                </button>
              ) : null}
              <HeaderActions chatId={chatId} />
              {onExpand ? (
                <button
                  type="button"
                  aria-label={expanded ? 'Collapse to split' : 'Expand'}
                  onClick={onExpand}
                  className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
                >
                  {expanded ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </button>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  aria-label="Fechar computador"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </>
          }
        />
        <div className="min-h-0 flex-1 overflow-hidden bg-[#EEEEEB]">
          {activeView === 'code' ? (
            <FileExplorer chatId={chatId} />
          ) : (
            <ArtifactPreviewStage zoom={zoom} scaledStyle={{ width: '100%' }}>
              <JsonRenderPreview chatId={chatId} />
            </ArtifactPreviewStage>
          )}
        </div>
      </div>
      <DashboardThemeModal
        isOpen={themeModalOpen}
        onClose={() => {
          void applyDashboardAppearance(themeModalBaseName, chartPaletteBaseName, borderPresetBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
          setThemeModalOpen(false)
        }}
        onConfirm={() => {
          setThemeModalBaseName(draftThemeName)
          setChartPaletteBaseName(draftChartPalette)
          setBorderPresetBaseName(draftBorderPreset)
          setThemeModalOpen(false)
        }}
        onRevert={() => {
          void applyDashboardAppearance(themeModalBaseName, chartPaletteBaseName, borderPresetBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
        }}
        mode={appearanceMode}
        onModeChange={setAppearanceMode}
        onSelect={(themeName) => {
          setDraftThemeName(themeName)
          void applyDashboardAppearance(themeName, draftChartPalette, draftBorderPreset)
        }}
        onSelectChartPalette={(paletteValue) => {
          setDraftChartPalette(paletteValue)
          void applyDashboardAppearance(draftThemeName, paletteValue, draftBorderPreset)
        }}
        onSelectBorderPreset={(borderPreset) => {
          setDraftBorderPreset(borderPreset as DashboardBorderPreset)
          void applyDashboardAppearance(draftThemeName, draftChartPalette, borderPreset)
        }}
        selectedTheme={draftThemeName}
        selectedChartPalette={draftChartPalette}
        selectedBorderPreset={draftBorderPreset}
        chartPalettes={DASHBOARD_CHART_PALETTE_OPTIONS}
        borderPresets={DASHBOARD_BORDER_PRESET_OPTIONS}
        revertDisabled={
          draftThemeName === themeModalBaseName
          && draftChartPalette === chartPaletteBaseName
          && draftBorderPreset === borderPresetBaseName
        }
        themes={APPS_THEME_OPTIONS}
      />
    </>
  )
}
