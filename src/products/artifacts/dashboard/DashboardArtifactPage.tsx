'use client'

import type { DashboardArtifactWorkspaceProps } from '@/products/artifacts/dashboard/DashboardArtifactWorkspace'
import { DashboardArtifactWorkspace } from '@/products/artifacts/dashboard/DashboardArtifactWorkspace'

export function DashboardArtifactPage(props: DashboardArtifactWorkspaceProps) {
  return <DashboardArtifactWorkspace {...props} />
}
