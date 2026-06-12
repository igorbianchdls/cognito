import type { ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { OmieResourceConfig } from '@/products/integracoes/connectors/erp/omie/omieTypes'

const DEFAULT_PAGE_SIZE = 50

function formatOmieDate(value: Date) {
  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const year = value.getFullYear()
  return `${day}/${month}/${year}`
}

function defaultStartDate() {
  return process.env.OMIE_DEFAULT_START_DATE?.trim() || '01/01/2000'
}

function today() {
  return formatOmieDate(new Date())
}

function defaultParams({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    pagina: page,
    registros_por_pagina: pageSize,
    apenas_importado_api: 'N',
  }
}

function omieNParams({ page, pageSize }: { page: number; pageSize: number }) {
  return {
    nPagina: page,
    nRegPorPagina: pageSize,
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
  {
    resource: 'pedidos_compra',
    endpoint: '/produtos/pedidocompra/',
    call: 'PesquisarPedCompra',
    itemKeys: ['pedidos_pesquisa', 'pedido_pesquisa', 'pedidos_compra', 'pedidos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: ({ page, pageSize }) => ({
      nPagina: page,
      nRegsPorPagina: pageSize,
      lApenasImportadoApi: 'F',
      lExibirPedidosPendentes: 'T',
      lExibirPedidosFaturados: 'T',
      lExibirPedidosRecebidos: 'T',
      lExibirPedidosCancelados: 'T',
      lExibirPedidosEncerrados: 'T',
      lExibirPedidosRecParciais: 'T',
      lExibirPedidosFatParciais: 'T',
      dDataInicial: defaultStartDate(),
      dDataFinal: today(),
      lApenasAlterados: 'F',
    }),
  },
  {
    resource: 'notas_fiscais',
    endpoint: '/produtos/nfconsultar/',
    call: 'ListarNF',
    itemKeys: ['nfCadastro', 'notas_fiscais', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: ({ page, pageSize }) => ({
      pagina: page,
      registros_por_pagina: pageSize,
      ordenar_por: 'CODIGO',
      cDetalhesPedido: 'S',
      cApenasResumo: 'N',
    }),
  },
  {
    resource: 'notas_servico',
    endpoint: '/servicos/nfse/',
    call: 'ListarNFSEs',
    itemKeys: ['nfseEncontradas', 'notas_servico', 'notas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: omieNParams,
  },
  {
    resource: 'estoque_saldos',
    endpoint: '/estoque/consulta/',
    call: 'ListarPosEstoque',
    itemKeys: ['produtos', 'saldos', 'estoques'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: ({ page, pageSize }) => ({
      nPagina: page,
      nRegPorPagina: pageSize,
      dDataPosicao: today(),
      cExibeTodos: 'N',
      codigo_local_estoque: 0,
    }),
  },
  {
    resource: 'estoque_movimentacoes',
    endpoint: '/estoque/consulta/',
    call: 'ListarMovimentoEstoque',
    itemKeys: ['movProdutoListar', 'movProduto', 'movimentos', 'cadastros'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildParams: ({ page, pageSize }) => ({
      nPagina: page,
      nRegPorPagina: pageSize,
      codigo_local_estoque: 0,
      idProd: 0,
      dDtInicial: defaultStartDate(),
      dDtFinal: today(),
      lista_local_estoque: '',
    }),
  },
  {
    resource: 'lancamentos_financeiros',
    endpoint: '/financas/mf/',
    call: 'ListarMovimentos',
    itemKeys: ['movimentos', 'lancamentos_financeiros', 'lancamentos'],
    defaultPageSize: 500,
    supportsIncremental: false,
    buildParams: omieNParams,
  },
  {
    resource: 'contas_correntes',
    endpoint: '/geral/contacorrente/',
    call: 'ListarContasCorrentes',
    itemKeys: ['ListarContasCorrentes', 'conta_corrente_cadastro', 'contas_correntes', 'contas'],
    defaultPageSize: 100,
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
