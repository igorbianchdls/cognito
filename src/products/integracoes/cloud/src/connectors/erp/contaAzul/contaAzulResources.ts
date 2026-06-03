import type { ConnectorResourceManifest } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { ContaAzulResourceConfig } from '@/products/integracoes/cloud/src/connectors/erp/contaAzul/contaAzulTypes'

const DEFAULT_PAGE_SIZE = 50

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
    path: '/v1/pessoas',
    itemKeys: ['itens', 'items', 'data', 'content', 'pessoas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'fornecedores',
    path: '/v1/pessoas',
    itemKeys: ['itens', 'items', 'data', 'content', 'pessoas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produtos',
    path: '/v1/produtos',
    itemKeys: ['itens', 'items', 'data', 'content', 'produtos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'categorias',
    path: '/v1/categorias',
    itemKeys: ['itens', 'items', 'data', 'content', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'centros_custo',
    path: '/v1/centro-de-custo',
    itemKeys: ['itens', 'items', 'data', 'content', 'centros_custo'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'contas_receber',
    path: '/v1/financeiro/eventos-financeiros/contas-a-receber/buscar',
    method: 'POST',
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildBody: payableReceivableBody,
  },
  {
    resource: 'contas_pagar',
    path: '/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar',
    method: 'POST',
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildBody: payableReceivableBody,
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
