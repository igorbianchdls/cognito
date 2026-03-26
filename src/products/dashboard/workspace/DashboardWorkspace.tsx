'use client'

import { useMemo, useState } from 'react'

import { buildDashboardWorkspaceFiles } from '@/products/dashboard/workspace/workspaceFiles'
import { getDashboardTitleFromSource } from '@/products/dashboard/workspace/compileDashboardSource'
import { DashboardWorkspaceCode } from '@/products/dashboard/workspace/DashboardWorkspaceCode'
import { DashboardWorkspaceHeader } from '@/products/dashboard/workspace/DashboardWorkspaceHeader'
import { DashboardWorkspacePreview } from '@/products/dashboard/workspace/DashboardWorkspacePreview'

export function DashboardWorkspace({
  appliedThemeName,
  onOpenTheme,
}: {
  appliedThemeName: string
  onOpenTheme: () => void
}) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [selectedCodePath, setSelectedCodePath] = useState('app/dashboard-classico.tsx')
  const [selectedDashboardPath, setSelectedDashboardPath] = useState('app/dashboard-classico.tsx')
  const [zoom, setZoom] = useState(1)

  const files = useMemo(() => buildDashboardWorkspaceFiles(appliedThemeName), [appliedThemeName])
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

  return (
    <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
      <DashboardWorkspaceHeader
        title={title}
        activeView={activeView}
        zoom={zoom}
        onChangeView={setActiveView}
        onZoomChange={setZoom}
        onOpenTheme={onOpenTheme}
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
  )
}
