'use client'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { ReportWorkspace } from '@/products/artifacts/report/workspace/ReportWorkspace'

export function ReportArtifactPage({ source }: { source: string }) {
  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, report: {} }}>
      <ReportWorkspace initialSource={source} />
    </ArtifactWorkspacePage>
  )
}
