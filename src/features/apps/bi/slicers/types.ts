export type BiSlicerType = 'dropdown' | 'multi' | 'list' | 'tile' | 'tile-multi' | 'range'

export type BiSlicerStaticSource = {
  type: 'static'
  options: Array<{ value: string | number; label: string }>
}

export type BiSlicerApiSource = {
  type: 'api'
  url: string
  method?: 'GET' | 'POST'
}

export type BiSlicerOptionsSource = {
  type: 'options'
  model: string
  field: string
  pageSize?: number
  dependsOn?: string[]
}

export type BiSlicerSource = BiSlicerStaticSource | BiSlicerApiSource | BiSlicerOptionsSource

export type BiSlicerDefinition = {
  id: string
  label?: string
  type: BiSlicerType
  storePath: string
  search?: boolean
  clearable?: boolean
  source?: BiSlicerSource
}

