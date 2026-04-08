'use client'

import { useMemo, useState } from 'react'

import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import {
  DashboardThemeModal,
  type DashboardAppearanceMode,
} from '@/products/artifacts/dashboard/workspace/DashboardThemeModal'
import {
  DASHBOARD_CHART_PALETTE_OPTIONS,
  getDashboardChartPaletteValueFromColors,
} from '@/products/artifacts/dashboard/chartPalettes'
import { DASHBOARD_BORDER_PRESET_OPTIONS, type DashboardBorderPreset } from '@/products/artifacts/dashboard/borderPresets'
import { buildDashboardWorkspaceFiles } from '@/products/artifacts/dashboard/workspace/workspaceFiles'
import {
  getDashboardBorderPresetFromSource,
  getDashboardChartColorsFromSource,
  getDashboardChartPaletteNameFromSource,
  getDashboardThemeNameFromSource,
  getDashboardTitleFromSource,
  replaceDashboardBorderPresetInSource,
  replaceDashboardChartPaletteNameInSource,
  replaceDashboardThemeNameInSource,
} from '@/products/artifacts/dashboard/parser/dashboardJsxParser'
import type { DashboardAppearanceOverrides } from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import { ArtifactWorkspaceHeader } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceHeader'
import { DashboardWorkspaceCode } from '@/products/artifacts/dashboard/workspace/DashboardWorkspaceCode'
import { DashboardWorkspacePreview } from '@/products/artifacts/dashboard/workspace/DashboardWorkspacePreview'

function cloneAppearanceOverrides(overrides: DashboardAppearanceOverrides): DashboardAppearanceOverrides {
  return JSON.parse(JSON.stringify(overrides || {})) as DashboardAppearanceOverrides
}

function areAppearanceOverridesEqual(left: DashboardAppearanceOverrides, right: DashboardAppearanceOverrides) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {})
}

export function DashboardWorkspace({
  initialThemeName,
}: {
  initialThemeName: string
}) {
  const dashboardThemeOptions = useMemo(
    () => APPS_THEME_OPTIONS.filter((option) => String(option.value).trim().toLowerCase() !== 'aero'),
    [],
  )
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [selectedCodePath, setSelectedCodePath] = useState('app/dashboard-classico.tsx')
  const [selectedDashboardPath, setSelectedDashboardPath] = useState('app/dashboard-classico.tsx')
  const [zoom, setZoom] = useState(1)
  const [files, setFiles] = useState(() => buildDashboardWorkspaceFiles(initialThemeName))
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [appearanceMode, setAppearanceMode] = useState<DashboardAppearanceMode>('theme')
  const [draftThemeName, setDraftThemeName] = useState('light')
  const [themeModalBaseName, setThemeModalBaseName] = useState('light')
  const [draftChartPalette, setDraftChartPalette] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [chartPaletteBaseName, setChartPaletteBaseName] = useState(DASHBOARD_CHART_PALETTE_OPTIONS[0].value)
  const [draftBorderPreset, setDraftBorderPreset] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [borderPresetBaseName, setBorderPresetBaseName] = useState<DashboardBorderPreset>(DASHBOARD_BORDER_PRESET_OPTIONS[0].value)
  const [draftAppearanceOverrides, setDraftAppearanceOverrides] = useState<DashboardAppearanceOverrides>({})
  const [appearanceOverridesBase, setAppearanceOverridesBase] = useState<DashboardAppearanceOverrides>({})
  const dashboardFiles = useMemo(() => files.filter((file) => file.extension === 'tsx'), [files])
  const selectedDashboardFile = useMemo(
    () => dashboardFiles.find((file) => file.path === selectedDashboardPath) ?? dashboardFiles[0],
    [dashboardFiles, selectedDashboardPath],
  )
  const selectedCodeFile = useMemo(
    () => files.find((file) => file.path === selectedCodePath) ?? files[0],
    [files, selectedCodePath],
  )
  const title = useMemo(
    () => getDashboardTitleFromSource(selectedDashboardFile?.content ?? '', selectedDashboardFile?.name || 'Dashboard'),
    [selectedDashboardFile],
  )
  const selectedThemeName = useMemo(
    () => getDashboardThemeNameFromSource(selectedDashboardFile?.content ?? '', 'light'),
    [selectedDashboardFile],
  )
  const selectedChartPalette = useMemo(
    () => {
      const source = selectedDashboardFile?.content ?? ''
      const paletteName = getDashboardChartPaletteNameFromSource(source, '')
      if (paletteName) return paletteName
      return getDashboardChartPaletteValueFromColors(
        getDashboardChartColorsFromSource(source, DASHBOARD_CHART_PALETTE_OPTIONS[0].colors),
      )
    },
    [selectedDashboardFile],
  )
  const selectedBorderPreset = useMemo(
    () => getDashboardBorderPresetFromSource(selectedDashboardFile?.content ?? '', DASHBOARD_BORDER_PRESET_OPTIONS[0].value) as DashboardBorderPreset,
    [selectedDashboardFile],
  )

  function updateFileContent(path: string, nextContent: string) {
    setFiles((currentFiles) =>
      currentFiles.map((file) => (file.path === path ? { ...file, content: nextContent } : file)),
    )
  }

  function applyAppearanceToSelectedDashboard(themeName: string, chartPaletteValue: string, borderPreset: string) {
    if (!selectedDashboardFile) return
    const nextContent = replaceDashboardBorderPresetInSource(
      replaceDashboardChartPaletteNameInSource(
        replaceDashboardThemeNameInSource(selectedDashboardFile.content, themeName),
        chartPaletteValue,
      ),
      borderPreset,
    )
    updateFileContent(selectedDashboardFile.path, nextContent)
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
        <ArtifactWorkspaceHeader
          title={title}
          activeView={activeView}
          zoom={zoom}
          onChangeView={setActiveView}
          onZoomChange={setZoom}
          onOpenTheme={() => {
            setAppearanceMode('theme')
            setThemeModalBaseName(selectedThemeName)
            setDraftThemeName(selectedThemeName)
            setChartPaletteBaseName(selectedChartPalette)
            setDraftChartPalette(selectedChartPalette)
            setBorderPresetBaseName(selectedBorderPreset)
            setDraftBorderPreset(selectedBorderPreset)
            setAppearanceOverridesBase(cloneAppearanceOverrides(draftAppearanceOverrides))
            setDraftAppearanceOverrides(cloneAppearanceOverrides(draftAppearanceOverrides))
            setIsThemeModalOpen(true)
          }}
        />
        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB]">
          {activeView === 'preview' ? (
            <DashboardWorkspacePreview
              sourcePath={selectedDashboardFile?.path ?? ''}
              files={files}
              zoom={zoom}
              appearanceOverrides={draftAppearanceOverrides}
            />
          ) : (
            <DashboardWorkspaceCode
              files={files}
              selectedFile={selectedCodeFile}
              dashboardFiles={dashboardFiles}
              selectedDashboardPath={selectedDashboardPath}
              onSelectFile={setSelectedCodePath}
              onSelectDashboard={(path) => {
                setSelectedDashboardPath(path)
                setSelectedCodePath(path)
              }}
            />
          )}
        </main>
      </div>

      <DashboardThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => {
          applyAppearanceToSelectedDashboard(themeModalBaseName, chartPaletteBaseName, borderPresetBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
          setDraftAppearanceOverrides(cloneAppearanceOverrides(appearanceOverridesBase))
          setIsThemeModalOpen(false)
        }}
        onConfirm={() => {
          setIsThemeModalOpen(false)
        }}
        onRevert={() => {
          applyAppearanceToSelectedDashboard(themeModalBaseName, chartPaletteBaseName, borderPresetBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setDraftBorderPreset(borderPresetBaseName)
          setDraftAppearanceOverrides(cloneAppearanceOverrides(appearanceOverridesBase))
        }}
        mode={appearanceMode}
        onModeChange={setAppearanceMode}
        onSelect={(themeName) => {
          setDraftThemeName(themeName)
          applyAppearanceToSelectedDashboard(themeName, draftChartPalette, draftBorderPreset)
        }}
        onSelectChartPalette={(paletteValue) => {
          setDraftChartPalette(paletteValue)
          applyAppearanceToSelectedDashboard(draftThemeName, paletteValue, draftBorderPreset)
        }}
        onSelectBorderPreset={(borderPreset) => {
          setDraftBorderPreset(borderPreset as DashboardBorderPreset)
          applyAppearanceToSelectedDashboard(draftThemeName, draftChartPalette, borderPreset)
        }}
        appearanceOverrides={draftAppearanceOverrides}
        onAppearanceOverridesChange={setDraftAppearanceOverrides}
        selectedTheme={draftThemeName}
        selectedChartPalette={draftChartPalette}
        selectedBorderPreset={draftBorderPreset}
        chartPalettes={DASHBOARD_CHART_PALETTE_OPTIONS}
        borderPresets={DASHBOARD_BORDER_PRESET_OPTIONS}
        revertDisabled={
          draftThemeName === themeModalBaseName
          && draftChartPalette === chartPaletteBaseName
          && draftBorderPreset === borderPresetBaseName
          && areAppearanceOverridesEqual(draftAppearanceOverrides, appearanceOverridesBase)
        }
        themes={dashboardThemeOptions}
      />
    </>
  )
}
