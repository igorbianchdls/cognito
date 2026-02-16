export type BiTableRef = {
  id: string
  schema?: string
  name: string
  alias?: string
}

export type BiRelationshipCardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
export type BiRelationshipDirection = 'single' | 'both'

export type BiRelationship = {
  id: string
  fromTableId: string
  fromField: string
  toTableId: string
  toField: string
  cardinality: BiRelationshipCardinality
  direction: BiRelationshipDirection
  active?: boolean
}

export type BiSemanticModel = {
  tables: BiTableRef[]
  relationships: BiRelationship[]
  defaultDateFieldByTable?: Record<string, string>
}

