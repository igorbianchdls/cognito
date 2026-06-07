import type { ConnectorRow } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'id',
  'uuid',
  'codigo',
  'numero',
  'numeroPedido',
  'numeroNota',
  'chaveAcesso',
  'codigoRastreamento',
  'pedido.id',
  'contato.id',
  'produto.id',
  'categoria.id',
  'deposito.id',
  'vendedor.id',
  'transportador.id',
  'transportadora.id',
  'loja.id',
  'canalVenda.id',
  'formaPagamento.id',
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
  return `bling_row_${index + 1}`
}

export function mapBlingRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return {
    external_id: getExternalId(input.row, input.index),
    bling_resource: input.resource,
    bling_page: input.page,
    raw: input.row,
  }
}

export function mapBlingRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapBlingRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
