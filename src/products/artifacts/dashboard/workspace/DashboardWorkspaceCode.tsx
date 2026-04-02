'use client'

import { ArtifactWorkspaceCodeEditor } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceCodeEditor'
import { ArtifactWorkspaceFileTree } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceFileTree'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'

export function DashboardWorkspaceCode({
  files,
  selectedFile,
  dashboardFiles,
  selectedDashboardPath,
  onSelectFile,
  onSelectDashboard,
}: {
  files: ArtifactCodeFile[]
  selectedFile: ArtifactCodeFile | undefined
  dashboardFiles: ArtifactCodeFile[]
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
      <ArtifactWorkspaceFileTree
        files={files}
        selectedPath={selectedFile?.path ?? 'app/dashboard-classico.tsx'}
        onSelect={handleSelectPath}
      />
      <ArtifactWorkspaceCodeEditor
        file={selectedFile}
        selectableFiles={files}
        selectedSelectablePath={selectedFile?.path ?? selectedDashboardPath}
        onSelectSelectable={handleSelectPath}
        selectableLabel="Arquivo"
      />
    </div>
  )
}
