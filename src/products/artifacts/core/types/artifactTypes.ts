'use client'

export type WorkspaceSourceFile = {
  path: string
  content: string
}

export type ArtifactTreeNode = {
  type: string
  props: Record<string, unknown>
  children: Array<ArtifactTreeNode | string>
}

export type ArtifactKind = 'dashboard' | 'report' | 'slide'

export type ParsedArtifactJsx = {
  kind: ArtifactKind
  tree: ArtifactTreeNode
}
