import type { ConnectorResourceManifest } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ContaAzulResourceConfig } from '@/products/integracoes/cloud/src/connectors/erp/contaAzul/contaAzulTypes'

const DEFAULT_PAGE_SIZE = 50

function envResourcePath(resource: string, fallback: string) {
  const key = `CONTA_AZUL_RESOURCE_${resource.toUpperCase()}_PATH`
  return process.env[key]?.trim() || fallback
}

function pageQuery({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    tamanho_pagina: pageSize,
  }
}

function payableReceivableBody({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    tamanho_pagina: pageSize,
  }
}

export const CONTA_AZUL_RESOURCE_CONFIGS: ContaAzulResourceConfig[] = [
  {
    resource: 'clientes',
    path: envResourcePath('clientes', '/v1/pessoas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'pessoas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: envResourcePath('fornecedores', '/v1/pessoas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'pessoas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: envResourcePath('produtos', '/v1/produtos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: envResourcePath('categorias', '/v1/categorias'),
    itemKeys: ['itens', 'items', 'data', 'content', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'centros_custo',
    path: envResourcePath('centros_custo', '/v1/centro-de-custo'),
    itemKeys: ['itens', 'items', 'data', 'content', 'centros_custo'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: envResourcePath('contas_receber', '/v1/financeiro/eventos-financeiros/contas-a-receber/buscar'),
    method: 'POST',
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildBody: payableReceivableBody,
  },
  {
    resource: 'contas_pagar',
    path: envResourcePath('contas_pagar', '/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar'),
    method: 'POST',
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildBody: payableReceivableBody,
  },
  {
    resource: 'servicos',
    path: envResourcePath('servicos', '/v1/servicos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'servicos', 'services'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'vendas',
    path: envResourcePath('vendas', '/v1/vendas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendas', 'sales'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'itens_venda',
    path: envResourcePath('itens_venda', '/v1/vendas/itens'),
    itemKeys: ['itens', 'items', 'data', 'content', 'itens_venda', 'saleItems'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'parcelas_venda',
    path: envResourcePath('parcelas_venda', '/v1/vendas/parcelas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'parcelas_venda', 'installments'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contratos',
    path: envResourcePath('contratos', '/v1/contratos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contratos', 'contracts'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_bancarias',
    path: envResourcePath('contas_bancarias', '/v1/contas-bancarias'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contas_bancarias', 'bankAccounts'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'vendedores',
    path: envResourcePath('vendedores', '/v1/vendedores'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendedores', 'sellers'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'notas_fiscais',
    path: envResourcePath('notas_fiscais', '/v1/notas-fiscais'),
    itemKeys: ['itens', 'items', 'data', 'content', 'notas_fiscais', 'invoices'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'estoque',
    path: envResourcePath('estoque', '/v1/estoque'),
    itemKeys: ['itens', 'items', 'data', 'content', 'estoque', 'saldos', 'stock'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'movimentacoes_estoque',
    path: envResourcePath('movimentacoes_estoque', '/v1/estoque/movimentacoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'movimentacoes_estoque', 'movements'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
]

const CONTA_AZUL_RESOURCE_MAP = new Map(CONTA_AZUL_RESOURCE_CONFIGS.map((config) => [config.resource, config]))

export const CONTA_AZUL_RESOURCE_MANIFEST: ConnectorResourceManifest[] = CONTA_AZUL_RESOURCE_CONFIGS.map((config) => ({
  resource: config.resource,
  supportsIncremental: config.supportsIncremental,
  defaultPageSize: config.defaultPageSize,
  requiredFields: ['accessToken'],
}))

export function getContaAzulResourceConfig(resource: string): ContaAzulResourceConfig | undefined {
  return CONTA_AZUL_RESOURCE_MAP.get(resource)
}

export function listContaAzulSupportedResources(): string[] {
  return CONTA_AZUL_RESOURCE_CONFIGS.map((config) => config.resource)
}
