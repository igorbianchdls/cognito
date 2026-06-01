import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'

export type SlideSizePreset = 'wide' | 'standard' | 'custom'

export type SlideSizeModel = {
  widthPx: number
  heightPx: number
  aspectRatio: number
  preset: SlideSizePreset
}

export type SlideFrameModel = {
  x?: number
  y?: number
  w?: number
  h?: number
  unit: 'px'
}

export type SlideThemeModel = {
  name: string
  headerTheme?: string
  chartPalette?: string
  managers: Record<string, unknown>
  rawProps: Record<string, unknown>
  rawNode?: ArtifactTreeNode
}

export type SlideElementKind =
  | 'bullets'
  | 'card'
  | 'chart'
  | 'container'
  | 'footer'
  | 'html'
  | 'image'
  | 'lineBreak'
  | 'logo'
  | 'pivotTable'
  | 'query'
  | 'shape'
  | 'stat'
  | 'subtitle'
  | 'table'
  | 'text'
  | 'textBox'
  | 'title'
  | 'unknown'

export type SlideElementModel = {
  id: string
  kind: SlideElementKind
  sourceType: string
  props: Record<string, unknown>
  style?: Record<string, unknown>
  frame?: SlideFrameModel
  text?: string
  children: SlideElementModel[]
  rawNode?: ArtifactTreeNode
}

export type SlideModel = {
  id: string
  index: number
  title: string
  size: SlideSizeModel
  props: Record<string, unknown>
  elements: SlideElementModel[]
  rawNode: ArtifactTreeNode
}

export type SlideDeckModel = {
  kind: 'slide-deck'
  title: string
  name?: string
  theme: SlideThemeModel
  slides: SlideModel[]
  rawTree: ArtifactTreeNode
}
