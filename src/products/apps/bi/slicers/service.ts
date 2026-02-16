import type { BiSlicerDefinition, BiSlicerOptionsSource } from './types'

export function normalizeSlicerDefinition(slicer: BiSlicerDefinition): BiSlicerDefinition {
  const searchEnabled = slicer.search === true
  return { ...slicer, search: searchEnabled }
}

export function isOptionsSource(
  source: BiSlicerDefinition['source'],
): source is BiSlicerOptionsSource {
  return Boolean(source && source.type === 'options')
}

export function createOptionsSource(model: string, field: string, pageSize = 50): BiSlicerOptionsSource {
  return {
    type: 'options',
    model,
    field,
    pageSize,
  }
}

