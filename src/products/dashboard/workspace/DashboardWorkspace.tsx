'use client'

import { useMemo, useState } from 'react'

import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import {
  DashboardThemeModal,
  type DashboardAppearanceMode,
} from '@/products/dashboard/theme-modal'
import { buildDashboardTemplateVariantByPath } from '@/products/dashboard/shared/templates/dashboardTemplate'
import {
  DASHBOARD_CHART_PALETTE_OPTIONS,
  getDashboardChartPaletteValueFromColors,
} from '@/products/dashboard/workspace/chartPalettes'
import { buildDashboardWorkspaceFiles } from '@/products/dashboard/workspace/workspaceFiles'
import {
  getDashboardChartColorsFromSource,
  getDashboardChartPaletteNameFromSource,
  getDashboardThemeNameFromSource,
  getDashboardTitleFromSource,
  replaceDashboardChartPaletteNameInSource,
  replaceDashboardChartColorsInSource,
} from '@/products/dashboard/workspace/compileDashboardSource'
import { DashboardWorkspaceCode } from '@/products/dashboard/workspace/DashboardWorkspaceCode'
import { DashboardWorkspaceHeader } from '@/products/dashboard/workspace/DashboardWorkspaceHeader'
import { DashboardWorkspacePreview } from '@/products/dashboard/workspace/DashboardWorkspacePreview'

export function DashboardWorkspace({
  initialThemeName,
}: {
  initialThemeName: string
}) {
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

  function updateFileContent(path: string, nextContent: string) {
    setFiles((currentFiles) =>
      currentFiles.map((file) => (file.path === path ? { ...file, content: nextContent } : file)),
    )
  }

  function applyAppearanceToSelectedDashboard(themeName: string, chartPaletteValue: string) {
    if (!selectedDashboardFile) return
    const nextVariant = buildDashboardTemplateVariantByPath(selectedDashboardFile.path, themeName)
    if (!nextVariant) return
    const nextPalette = DASHBOARD_CHART_PALETTE_OPTIONS.find((option) => option.value === chartPaletteValue)?.colors
    const nextContent = nextPalette
      ? replaceDashboardChartPaletteNameInSource(
          replaceDashboardChartColorsInSource(nextVariant.content, nextPalette),
          chartPaletteValue,
        )
      : nextVariant.content
    updateFileContent(selectedDashboardFile.path, nextContent)
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
        <DashboardWorkspaceHeader
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
            setIsThemeModalOpen(true)
          }}
        />
        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB]">
          {activeView === 'preview' ? (
            <DashboardWorkspacePreview sourcePath={selectedDashboardFile?.path ?? ''} files={files} zoom={zoom} />
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
          applyAppearanceToSelectedDashboard(themeModalBaseName, chartPaletteBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
          setIsThemeModalOpen(false)
        }}
        onConfirm={() => {
          setIsThemeModalOpen(false)
        }}
        onRevert={() => {
          applyAppearanceToSelectedDashboard(themeModalBaseName, chartPaletteBaseName)
          setDraftThemeName(themeModalBaseName)
          setDraftChartPalette(chartPaletteBaseName)
        }}
        mode={appearanceMode}
        onModeChange={setAppearanceMode}
        onSelect={(themeName) => {
          setDraftThemeName(themeName)
          applyAppearanceToSelectedDashboard(themeName, draftChartPalette)
        }}
        onSelectChartPalette={(paletteValue) => {
          setDraftChartPalette(paletteValue)
          applyAppearanceToSelectedDashboard(draftThemeName, paletteValue)
        }}
        selectedTheme={draftThemeName}
        selectedChartPalette={draftChartPalette}
        chartPalettes={DASHBOARD_CHART_PALETTE_OPTIONS}
        revertDisabled={draftThemeName === themeModalBaseName && draftChartPalette === chartPaletteBaseName}
        themes={APPS_THEME_OPTIONS}
      />
    </>
  )
}
