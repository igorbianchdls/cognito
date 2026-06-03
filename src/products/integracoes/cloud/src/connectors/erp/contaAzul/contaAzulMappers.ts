import type { ConnectorRow } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'id',
  'uuid',
  'codigo',
  'numero',
  'id_legado',
  'legacy_id',
  'referencia',
  'evento.id',
  'parcela.id',
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
  return `conta_azul_row_${index + 1}`
}

export function mapContaAzulRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return {
    external_id: getExternalId(input.row, input.index),
    conta_azul_resource: input.resource,
    conta_azul_page: input.page,
    raw: input.row,
  }
}

export function mapContaAzulRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapContaAzulRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
