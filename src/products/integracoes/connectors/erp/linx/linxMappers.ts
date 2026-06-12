import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'id',
  'uuid',
  'codigo',
  'code',
  'numero',
  'documento',
  'cliente.id',
  'produto.id',
  'loja.id',
  'vendedor.id',
]

function getNestedValue(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    return (current as Record<string, unknown>)[key]
  }, row)
}

function getExternalId(row: Record<string, unknown>, index: number) {
  for (const key of EXTERNAL_ID_CANDIDATES) {
    const value = getNestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return `linx_row_${index + 1}`
}

export function mapLinxRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return {
    external_id: getExternalId(input.row, input.index),
    linx_resource: input.resource,
    linx_page: input.page,
    raw: input.row,
  }
}

export function mapLinxRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapLinxRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
