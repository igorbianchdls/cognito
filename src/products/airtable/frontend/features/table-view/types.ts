export type SchemaRow = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type TableRow = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export type FieldRow = {
  id: string
  name: string
  slug: string
  type: string
  required: boolean
  order: number
}

export type RecordApiRow = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  cells: Record<string, unknown>
}

export type HeaderMenuTarget = {
  fieldId: string | null
  label: string
  type: string
  required?: boolean
} | null
