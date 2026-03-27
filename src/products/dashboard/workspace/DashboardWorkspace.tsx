'use client'

import { useMemo, useState } from 'react'

import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import { DashboardThemeModal } from '@/products/dashboard/theme-modal'
import { buildDashboardTemplateVariantByPath } from '@/products/dashboard/shared/templates/dashboardTemplate'
import { buildDashboardWorkspaceFiles } from '@/products/dashboard/workspace/workspaceFiles'
import {
  getDashboardThemeNameFromSource,
  getDashboardTitleFromSource,
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
  const [draftThemeName, setDraftThemeName] = useState('light')
  const [themeModalBaseName, setThemeModalBaseName] = useState('light')
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

  function updateFileContent(path: string, nextContent: string) {
    setFiles((currentFiles) =>
      currentFiles.map((file) => (file.path === path ? { ...file, content: nextContent } : file)),
    )
  }

  function applyThemeToSelectedDashboard(themeName: string) {
    if (!selectedDashboardFile) return
    const nextVariant = buildDashboardTemplateVariantByPath(selectedDashboardFile.path, themeName)
    if (!nextVariant) return
    updateFileContent(selectedDashboardFile.path, nextVariant.content)
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
            setThemeModalBaseName(selectedThemeName)
            setDraftThemeName(selectedThemeName)
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
          applyThemeToSelectedDashboard(themeModalBaseName)
          setDraftThemeName(themeModalBaseName)
          setIsThemeModalOpen(false)
        }}
        onConfirm={() => {
          setIsThemeModalOpen(false)
        }}
        onRevert={() => {
          applyThemeToSelectedDashboard(themeModalBaseName)
          setDraftThemeName(themeModalBaseName)
        }}
        onSelect={(themeName) => {
          setDraftThemeName(themeName)
          applyThemeToSelectedDashboard(themeName)
        }}
        selectedTheme={draftThemeName}
        revertDisabled={draftThemeName === themeModalBaseName}
        themes={APPS_THEME_OPTIONS}
      />
    </>
  )
}
