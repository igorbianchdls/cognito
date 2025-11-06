import type { Graph } from '@/types/agentes/builder'
import { slugify, validateGraph, collectTools } from './helpers'
import { genDefinitionJson, genRouteTs } from './templates'
import type { CodeBundle, FileSpec, GenerateOptions } from './types'
import { buildToolImports } from './tool-map'

export function generateCode(graph: Graph, opts: GenerateOptions = {}): CodeBundle {
  const baseSlug = opts.slug && opts.slug.trim() ? slugify(opts.slug) : 'agente-visual'
  const slug = baseSlug || 'agente-visual'
  const includeRoute = opts.includeRoute !== false
  const includeJson = opts.includeJson !== false

  const base = validateGraph(graph)
  const warnings = [...base.warnings]
  // Add warnings for unmapped tools selected in the visual graph
  const selectedToolIds = collectTools(graph)
  if (selectedToolIds.length) {
    const { missing } = buildToolImports(selectedToolIds)
    for (const id of missing) warnings.push(`Tool id \"${id}\" não mapeado — ignorado no codegen.`)
  }

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
