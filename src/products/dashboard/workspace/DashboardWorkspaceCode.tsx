'use client'

import type { DashboardCodeFile } from '@/products/dashboard/workspace/types'
import { WorkspaceCodeEditor } from '@/products/dashboard/workspace/WorkspaceCodeEditor'
import { WorkspaceFileTree } from '@/products/dashboard/workspace/WorkspaceFileTree'

export function DashboardWorkspaceCode({
  files,
  selectedFile,
  dashboardFiles,
  selectedDashboardPath,
  onSelectFile,
  onSelectDashboard,
}: {
  files: DashboardCodeFile[]
  selectedFile: DashboardCodeFile | undefined
  dashboardFiles: DashboardCodeFile[]
  selectedDashboardPath: string
  onSelectFile: (path: string) => void
  onSelectDashboard: (path: string) => void
}) {
  const dashboardFilePaths = new Set(dashboardFiles.map((dashboardFile) => dashboardFile.path))

  function handleSelectPath(path: string) {
    onSelectFile(path)
    if (dashboardFilePaths.has(path)) onSelectDashboard(path)
  }

  return (
    <div className="flex min-h-full w-full">
      <WorkspaceFileTree
        files={files}
        selectedPath={selectedFile?.path ?? 'app/dashboard-classico.tsx'}
        onSelect={handleSelectPath}
      />
      <WorkspaceCodeEditor
        file={selectedFile}
        dashboardFiles={files}
        selectedDashboardPath={selectedFile?.path ?? selectedDashboardPath}
        onSelectDashboard={handleSelectPath}
      />
    </div>
  )
}
