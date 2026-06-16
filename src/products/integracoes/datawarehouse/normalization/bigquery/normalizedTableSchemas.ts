import type { NormalizedTableName } from '@/products/integracoes/datawarehouse/normalization/contracts'

export type BigQueryFieldSchema = {
  name: string
  type: 'STRING' | 'INTEGER' | 'NUMERIC' | 'DATE' | 'TIMESTAMP' | 'JSON'
  mode?: 'REQUIRED' | 'NULLABLE'
}

const COMMON_FIELDS: BigQueryFieldSchema[] = [
  { name: 'tenant_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'connection_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'provider', type: 'STRING', mode: 'REQUIRED' },
  { name: 'resource', type: 'STRING', mode: 'REQUIRED' },
  { name: 'external_id', type: 'STRING' },
  { name: 'source_run_id', type: 'STRING' },
  { name: 'source_table', type: 'STRING' },
  { name: 'synced_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'normalized_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
]

const CONTACT_FIELDS: BigQueryFieldSchema[] = [
  { name: 'nome', type: 'STRING' },
  { name: 'documento', type: 'STRING' },
  { name: 'tipo_pessoa', type: 'STRING' },
  { name: 'email', type: 'STRING' },
  { name: 'telefone', type: 'STRING' },
  { name: 'cidade', type: 'STRING' },
  { name: 'uf', type: 'STRING' },
  { name: 'status', type: 'STRING' },
]

const TABLE_FIELDS: Record<NormalizedTableName, BigQueryFieldSchema[]> = {
  clientes: CONTACT_FIELDS,
  fornecedores: CONTACT_FIELDS,
  produtos: [
    { name: 'nome', type: 'STRING' },
    { name: 'codigo', type: 'STRING' },
    { name: 'sku', type: 'STRING' },
    { name: 'descricao', type: 'STRING' },
    { name: 'unidade', type: 'STRING' },
    { name: 'preco', type: 'NUMERIC' },
    { name: 'custo', type: 'NUMERIC' },
    { name: 'status', type: 'STRING' },
  ],
  contas_receber: [
    { name: 'pessoa_id', type: 'STRING' },
    { name: 'pessoa_nome', type: 'STRING' },
    { name: 'documento', type: 'STRING' },
    { name: 'valor', type: 'NUMERIC' },
    { name: 'valor_pago', type: 'NUMERIC' },
    { name: 'data_emissao', type: 'DATE' },
    { name: 'data_vencimento', type: 'DATE' },
    { name: 'data_pagamento', type: 'DATE' },
    { name: 'status', type: 'STRING' },
    { name: 'categoria', type: 'STRING' },
    { name: 'descricao', type: 'STRING' },
  ],
  contas_pagar: [
    { name: 'pessoa_id', type: 'STRING' },
    { name: 'pessoa_nome', type: 'STRING' },
    { name: 'documento', type: 'STRING' },
    { name: 'valor', type: 'NUMERIC' },
    { name: 'valor_pago', type: 'NUMERIC' },
    { name: 'data_emissao', type: 'DATE' },
    { name: 'data_vencimento', type: 'DATE' },
    { name: 'data_pagamento', type: 'DATE' },
    { name: 'status', type: 'STRING' },
    { name: 'categoria', type: 'STRING' },
    { name: 'descricao', type: 'STRING' },
  ],
  vendas: [
    { name: 'cliente_id', type: 'STRING' },
    { name: 'cliente_nome', type: 'STRING' },
    { name: 'numero', type: 'STRING' },
    { name: 'valor_total', type: 'NUMERIC' },
    { name: 'data_emissao', type: 'DATE' },
    { name: 'data_pedido', type: 'DATE' },
    { name: 'status', type: 'STRING' },
  ],
  estoque_atual: [
    { name: 'produto_id', type: 'STRING' },
    { name: 'produto_nome', type: 'STRING' },
    { name: 'codigo', type: 'STRING' },
    { name: 'sku', type: 'STRING' },
    { name: 'quantidade', type: 'NUMERIC' },
    { name: 'unidade', type: 'STRING' },
    { name: 'local', type: 'STRING' },
    { name: 'updated_at', type: 'DATE' },
  ],
}

export function getNormalizedTableSchema(table: NormalizedTableName): BigQueryFieldSchema[] {
  return [
    ...COMMON_FIELDS,
    ...TABLE_FIELDS[table],
    { name: 'source_payload', type: 'JSON', mode: 'REQUIRED' },
  ]
}
