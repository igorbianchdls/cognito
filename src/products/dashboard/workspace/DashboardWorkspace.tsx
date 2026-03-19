'use client'

import { useMemo, useState } from 'react'

import { buildDashboardWorkspaceFiles } from '@/products/dashboard/workspace/workspaceFiles'
import { DashboardWorkspaceCode } from '@/products/dashboard/workspace/DashboardWorkspaceCode'
import { DashboardWorkspaceHeader } from '@/products/dashboard/workspace/DashboardWorkspaceHeader'
import { DashboardWorkspacePreview } from '@/products/dashboard/workspace/DashboardWorkspacePreview'

type AnyRecord = Record<string, any>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getDashboardTitle(tree: unknown) {
  if (!isRecord(tree) || String(tree.type || '').trim() !== 'DashboardTemplate') return 'Dashboard'
  const props = isRecord(tree.props) ? (tree.props as AnyRecord) : {}
  const title = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
  const name = typeof props.name === 'string' && props.name.trim() ? props.name.trim() : ''
  return title || name || 'Dashboard'
}

export function DashboardWorkspace({
  appliedThemeName,
  onOpenTheme,
}: {
  appliedThemeName: string
  onOpenTheme: () => void
}) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [selectedCodePath, setSelectedCodePath] = useState('app/dashboard-vendas.tsx')
  const [selectedDashboardPath, setSelectedDashboardPath] = useState('app/dashboard-vendas.tsx')
  const [zoom, setZoom] = useState(1)

  const files = useMemo(() => buildDashboardWorkspaceFiles(appliedThemeName), [appliedThemeName])
  const dashboardFiles = useMemo(() => files.filter((file) => file.extension === 'tsx' && file.tree), [files])
  const selectedDashboardFile = useMemo(
    () => dashboardFiles.find((file) => file.path === selectedDashboardPath) ?? dashboardFiles[0],
    [dashboardFiles, selectedDashboardPath],
  )
  const selectedCodeFile = useMemo(
    () => files.find((file) => file.path === selectedCodePath) ?? files[0],
    [files, selectedCodePath],
  )
  const parsed = useMemo(() => selectedDashboardFile?.tree ?? dashboardFiles[0]?.tree ?? null, [selectedDashboardFile, dashboardFiles])
  const title = useMemo(() => getDashboardTitle(parsed), [parsed])

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
          <DashboardWorkspacePreview tree={parsed} zoom={zoom} />
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
