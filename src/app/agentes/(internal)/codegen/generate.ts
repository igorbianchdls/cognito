import type { Graph } from '@/types/agentes/builder'
import { slugify, validateGraph, collectTools, getStepSettings } from './helpers'
import { genDefinitionJson, genRouteTs } from './templates'
import type { CodeBundle, FileSpec, GenerateOptions } from './types'

export function generateCode(graph: Graph, opts: GenerateOptions = {}): CodeBundle {
  const baseSlug = opts.slug && opts.slug.trim() ? slugify(opts.slug) : 'agente-visual'
  const slug = baseSlug || 'agente-visual'
  const includeRoute = opts.includeRoute !== false
  const includeJson = opts.includeJson !== false

  const base = validateGraph(graph)
  const warnings = [...base.warnings]
  const selectedToolIds = collectTools(graph)
  if (selectedToolIds.length) warnings.push('Agent Builder: usando tools de src/tools/agentbuilder quando disponíveis; ids desconhecidos usam stub.')

  // STEP guidance: only toolChoice is used in codegen; loop settings come from StopWhen node
  const step = getStepSettings(graph)
  if (step.count > 0) {
    warnings.push('STEP: toolChoice aplicado. Para loop de passos, use o nó StopWhen (stepCountIs / hasToolCall).')
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
