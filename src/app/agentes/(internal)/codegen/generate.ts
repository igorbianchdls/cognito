import type { Graph } from '@/types/agentes/builder'
import { slugify, validateGraph } from './helpers'
import { genDefinitionJson, genRouteTs } from './templates'
import type { CodeBundle, FileSpec, GenerateOptions } from './types'

export function generateCode(graph: Graph, opts: GenerateOptions = {}): CodeBundle {
  const baseSlug = opts.slug && opts.slug.trim() ? slugify(opts.slug) : 'agente-visual'
  const slug = baseSlug || 'agente-visual'
  const includeRoute = opts.includeRoute !== false
  const includeJson = opts.includeJson !== false

  const { warnings } = validateGraph(graph)

  const files: FileSpec[] = []
  const targetDir = `src/app/agentes/${slug}`

  // route.ts com AI SDK (único arquivo executável no MVP)
  if (includeRoute) {
    files.push({ path: `${targetDir}/route.ts`, contents: genRouteTs(graph, slug) })
  }

  // definition.json (opcional)
  if (includeJson) {
    files.push({ path: `${targetDir}/definition.json`, contents: genDefinitionJson(graph) })
  }

  return { files, warnings, slug, graph }
}
