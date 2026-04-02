'use client'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { DashboardWorkspace } from '@/products/artifacts/dashboard/workspace/DashboardWorkspace'

export default function DashboardPage() {
  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <DashboardWorkspace initialThemeName="dark" />
    </ArtifactWorkspacePage>
  )
}
