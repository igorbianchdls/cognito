import type { BiMeasureDefinition } from './types'

export type BiMeasureValidationResult = {
  valid: boolean
  errors: string[]
}

export function validateMeasureDefinition(measure: BiMeasureDefinition): BiMeasureValidationResult {
  const errors: string[] = []
  if (!measure.id) errors.push('id is required')
  if (!measure.label) errors.push('label is required')
  if (!measure.model) errors.push('model is required')
  if (!measure.expression) errors.push('expression is required')
  return { valid: errors.length === 0, errors }
}

export function listMeasuresForModel(measures: BiMeasureDefinition[], model: string): BiMeasureDefinition[] {
  return measures.filter((measure) => measure.model === model)
}

export function getMeasureById(measures: BiMeasureDefinition[], id: string): BiMeasureDefinition | null {
  return measures.find((measure) => measure.id === id) || null
}

