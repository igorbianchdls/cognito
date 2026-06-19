import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

const EXTERNAL_ID_CANDIDATES = [
  'codigo_cliente_omie',
  'codigo_cliente_integracao',
  'codigo_produto',
  'codigo_produto_integracao',
  'codigo_lancamento_omie',
  'codigo_lancamento_integracao',
  'nCodTitulo',
  'detalhes.nCodTitulo',
  'detalhes.cCodIntTitulo',
  'nCodMovCC',
  'detalhes.nCodMovCC',
  'nCodServ',
  'cCodIntServ',
  'cabecalho.nCodCtr',
  'cabecalho.cCodIntCtr',
  'nCodCtr',
  'cCodIntCtr',
  'codigo_pedido',
  'codigo_pedido_integracao',
  'numero_pedido',
  'numero_pedido_integracao',
  'nCodPed',
  'cCodIntPed',
  'cNumero',
  'nCodNF',
  'nNF',
  'cChaveNFe',
  'nChaveNFe',
  'Cabecalho.nCodNF',
  'Cabecalho.nNumeroNFSe',
  'Cabecalho.cCodigoVerifNFSe',
  'nCodProd',
  'cCodIntProd',
  'cCodigo',
  'idProd',
  'id_prod',
  'nCodCC',
  'cCodCCInt',
  'codigo_categoria',
  'codigo',
  'id',
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
  return `omie_row_${index + 1}`
}

export function mapOmieRow(input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  return {
    external_id: getExternalId(input.row, input.index),
    omie_resource: input.resource,
    omie_page: input.page,
    raw: input.row,
  }
}

export function mapOmieRows(input: {
  resource: string
  rows: Record<string, unknown>[]
  page: number
}): ConnectorRow[] {
  return input.rows.map((row, index) => mapOmieRow({
    resource: input.resource,
    row,
    page: input.page,
    index,
  }))
}
