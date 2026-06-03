import type { ConnectorRow } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'id',
  'uuid',
  'codigo',
  'numero',
  'numeroPedido',
  'idContato',
  'contato.id',
  'cliente.id',
  'produto.id',
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
  return `tiny_row_${index + 1}`
}

export function mapTinyRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return {
    external_id: getExternalId(input.row, input.index),
    tiny_resource: input.resource,
    tiny_page: input.page,
    raw: input.row,
  }
}

export function mapTinyRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapTinyRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
