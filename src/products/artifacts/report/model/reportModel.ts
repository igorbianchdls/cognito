import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'

export type ReportElementKind = 'box' | 'chart' | 'group' | 'pivotTable' | 'table' | 'text' | 'unknown'

export type ReportFrameModel = {
  x: number
  y: number
  w: number
  h: number
}

export type ReportElementModel = {
  id: string
  kind: ReportElementKind
  sourceType: string
  frame: ReportFrameModel
  props: Record<string, unknown>
  style: Record<string, unknown>
  text?: string
  children?: ReportElementModel[]
}

export type ReportPageModel = {
  id: string
  index: number
  title: string
  widthPx: number
  heightPx: number
  props: Record<string, unknown>
  elements: ReportElementModel[]
  rawNode: ArtifactTreeNode
}

export type ReportDeckModel = {
  kind: 'report-deck'
  title: string
  name?: string
  pages: ReportPageModel[]
  rawTree: ArtifactTreeNode
}
