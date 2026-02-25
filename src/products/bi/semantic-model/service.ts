import type { BiSemanticModel } from './types'

export type BiValidationResult = {
  valid: boolean
  errors: string[]
}

export function validateSemanticModel(model: BiSemanticModel): BiValidationResult {
  const errors: string[] = []
  const tableIds = new Set(model.tables.map((table) => table.id))

  for (const rel of model.relationships) {
    if (!tableIds.has(rel.fromTableId)) {
      errors.push(`relationship ${rel.id}: fromTableId "${rel.fromTableId}" does not exist`)
    }
    if (!tableIds.has(rel.toTableId)) {
      errors.push(`relationship ${rel.id}: toTableId "${rel.toTableId}" does not exist`)
    }
    if (!rel.fromField) {
      errors.push(`relationship ${rel.id}: fromField is required`)
    }
    if (!rel.toField) {
      errors.push(`relationship ${rel.id}: toField is required`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function getRelatedTables(model: BiSemanticModel, tableId: string): string[] {
  const related = new Set<string>()
  for (const rel of model.relationships) {
    if (rel.fromTableId === tableId) related.add(rel.toTableId)
    if (rel.toTableId === tableId) related.add(rel.fromTableId)
  }
  return Array.from(related)
}

export function normalizeSemanticModel(model: BiSemanticModel): BiSemanticModel {
  return {
    tables: model.tables.map((table) => ({ ...table })),
    relationships: model.relationships.map((rel) => ({ active: true, ...rel })),
    defaultDateFieldByTable: { ...(model.defaultDateFieldByTable || {}) },
  }
}

