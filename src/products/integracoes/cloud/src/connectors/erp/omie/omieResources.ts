import type { ConnectorResourceManifest } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import type { OmieResourceConfig } from '@/products/integracoes/cloud/src/connectors/erp/omie/omieTypes'

const DEFAULT_PAGE_SIZE = 50

function defaultParams({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    registros_por_pagina: pageSize,
    apenas_importado_api: 'N',
  }
}

export const OMIE_RESOURCE_CONFIGS: OmieResourceConfig[] = [
  {
    resource: 'clientes',
    endpoint: '/geral/clientes/',
    call: 'ListarClientes',
    itemKeys: ['clientes_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'fornecedores',
    endpoint: '/geral/clientes/',
    call: 'ListarClientes',
    itemKeys: ['clientes_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'produtos',
    endpoint: '/geral/produtos/',
    call: 'ListarProdutos',
    itemKeys: ['produto_servico_cadastro', 'produtos_servico_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'pedidos_venda',
    endpoint: '/produtos/pedido/',
    call: 'ListarPedidos',
    itemKeys: ['pedido_venda_produto', 'pedidos_venda_produto'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'contas_receber',
    endpoint: '/financas/contareceber/',
    call: 'ListarContasReceber',
    itemKeys: ['conta_receber_cadastro', 'contas_receber_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'contas_pagar',
    endpoint: '/financas/contapagar/',
    call: 'ListarContasPagar',
    itemKeys: ['conta_pagar_cadastro', 'contas_pagar_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
  {
    resource: 'categorias',
    endpoint: '/geral/categorias/',
    call: 'ListarCategorias',
    itemKeys: ['categoria_cadastro', 'categorias_cadastro'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: defaultParams,
  },
]

const OMIE_RESOURCE_MAP = new Map(OMIE_RESOURCE_CONFIGS.map((config) => [config.resource, config]))

export const OMIE_RESOURCE_MANIFEST: ConnectorResourceManifest[] = OMIE_RESOURCE_CONFIGS.map((config) => ({
  resource: config.resource,
  supportsIncremental: config.supportsIncremental,
  defaultPageSize: config.defaultPageSize,
  requiredFields: ['app_key', 'app_secret'],
}))

export function getOmieResourceConfig(resource: string): OmieResourceConfig | undefined {
  return OMIE_RESOURCE_MAP.get(resource)
}

export function listOmieSupportedResources(): string[] {
  return OMIE_RESOURCE_CONFIGS.map((config) => config.resource)
}
