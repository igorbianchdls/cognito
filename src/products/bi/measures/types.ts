export type BiMeasureFormat = 'currency' | 'number' | 'percent'
export type BiMeasureAggregation = 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max' | 'custom'

export type BiMeasureDefinition = {
  id: string
  label: string
  model: string
  expression: string
  aggregation?: BiMeasureAggregation
  format?: BiMeasureFormat
  description?: string
}

