import type { Graph } from '@/types/agentes/builder'

export interface FileSpec {
  path: string
  contents: string
}

export interface CodeBundle {
  files: FileSpec[]
  warnings: string[]
  slug: string
  graph: Graph
}

export interface GenerateOptions {
  slug?: string
  includeRoute?: boolean
  includeJson?: boolean
}
