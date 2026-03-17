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
  return (
    <div className="flex min-h-full w-full">
      <WorkspaceFileTree
        files={files}
        selectedPath={selectedFile?.path ?? 'app/dashboard-vendas.dsl'}
        onSelect={onSelectFile}
      />
      <WorkspaceCodeEditor
        file={selectedFile}
        dashboardFiles={dashboardFiles}
        selectedDashboardPath={selectedDashboardPath}
        onSelectDashboard={onSelectDashboard}
      />
    </div>
  )
}
