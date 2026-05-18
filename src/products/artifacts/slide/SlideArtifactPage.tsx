'use client'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { SlideWorkspace } from '@/products/artifacts/slide/workspace/SlideWorkspace'

export function SlideArtifactPage({ source }: { source: string }) {
  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, slide: {} }}>
      <SlideWorkspace initialSource={source} />
    </ArtifactWorkspacePage>
  )
}
