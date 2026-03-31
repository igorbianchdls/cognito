'use client'

import { useMemo, useState } from 'react'

import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import {
  DashboardThemeModal,
  type DashboardAppearanceMode,
  type DashboardChartPaletteOption,
} from '@/products/dashboard/theme-modal'
import { buildDashboardTemplateVariantByPath } from '@/products/dashboard/shared/templates/dashboardTemplate'
import { buildDashboardWorkspaceFiles } from '@/products/dashboard/workspace/workspaceFiles'
import {
  getDashboardChartColorsFromSource,
  getDashboardThemeNameFromSource,
  getDashboardTitleFromSource,
  replaceDashboardChartColorsInSource,
} from '@/products/dashboard/workspace/compileDashboardSource'
import { DashboardWorkspaceCode } from '@/products/dashboard/workspace/DashboardWorkspaceCode'
import { DashboardWorkspaceHeader } from '@/products/dashboard/workspace/DashboardWorkspaceHeader'
import { DashboardWorkspacePreview } from '@/products/dashboard/workspace/DashboardWorkspacePreview'

const CHART_PALETTE_OPTIONS: DashboardChartPaletteOption[] = [
  { value: 'teal', label: 'Teal', colors: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'] },
  { value: 'blue', label: 'Blue', colors: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  { value: 'purple', label: 'Purple', colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'] },
  { value: 'orange', label: 'Orange', colors: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'] },
  { value: 'red', label: 'Red', colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'] },
  { value: 'lime', label: 'Lime', colors: ['#4D7C0F', '#65A30D', '#84CC16', '#A3E635', '#BEF264'] },
]

function getChartPaletteValueFromColors(colors: string[]) {
  const normalized = JSON.stringify(colors || [])
  const matched = CHART_PALETTE_OPTIONS.find((option) => JSON.stringify(option.colors) === normalized)
  return matched?.value || CHART_PALETTE_OPTIONS[0].value
}

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
  const [draftChartPalette, setDraftChartPalette] = useState(CHART_PALETTE_OPTIONS[0].value)
  const [chartPaletteBaseName, setChartPaletteBaseName] = useState(CHART_PALETTE_OPTIONS[0].value)
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
    () => getChartPaletteValueFromColors(getDashboardChartColorsFromSource(selectedDashboardFile?.content ?? '', CHART_PALETTE_OPTIONS[0].colors)),
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
    const nextPalette = CHART_PALETTE_OPTIONS.find((option) => option.value === chartPaletteValue)?.colors
    const nextContent = nextPalette
      ? replaceDashboardChartColorsInSource(nextVariant.content, nextPalette)
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
            <DashboardWorkspacePreview source={selectedDashboardFile?.content ?? ''} zoom={zoom} />
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
        chartPalettes={CHART_PALETTE_OPTIONS}
        revertDisabled={draftThemeName === themeModalBaseName && draftChartPalette === chartPaletteBaseName}
        themes={APPS_THEME_OPTIONS}
      />
    </>
  )
}
