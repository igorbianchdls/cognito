'use client'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { ReportWorkspace } from '@/products/artifacts/report/workspace/ReportWorkspace'

export default function ReportPage() {
  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, report: {} }}>
      <ReportWorkspace />
    </ArtifactWorkspacePage>
  )
}
