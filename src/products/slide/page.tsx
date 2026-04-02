'use client'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { SlideWorkspace } from '@/products/slide/workspace/SlideWorkspace'

export default function SlidePage() {
  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, slide: {} }}>
      <SlideWorkspace />
    </ArtifactWorkspacePage>
  )
}
