import type { ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { ContaAzulResourceConfig } from '@/products/integracoes/connectors/erp/contaAzul/contaAzulTypes'

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

function dateRangeQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = currentYearRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_inicio: process.env.CONTA_AZUL_SYNC_START_DATE?.trim() || range.start,
    data_fim: process.env.CONTA_AZUL_SYNC_END_DATE?.trim() || range.end,
  }
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function currentYearRange() {
  const now = new Date()
  const year = now.getUTCFullYear()
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}

function recentFifteenDayRange() {
  const end = new Date()
  return {
    start: isoDate(addDays(end, -14)),
    end: isoDate(end),
  }
}

function currentYearDateTimeRange() {
  const range = currentYearRange()
  return {
    start: `${range.start}T00:00:00`,
    end: `${range.end}T23:59:59`,
  }
}

function payableReceivableQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = currentYearRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_vencimento_de: process.env.CONTA_AZUL_FINANCEIRO_START_DATE?.trim() || range.start,
    data_vencimento_ate: process.env.CONTA_AZUL_FINANCEIRO_END_DATE?.trim() || range.end,
  }
}

function financialDateTimeQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = currentYearDateTimeRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_inicio: process.env.CONTA_AZUL_FINANCEIRO_START_DATETIME?.trim() || range.start,
    data_fim: process.env.CONTA_AZUL_FINANCEIRO_END_DATETIME?.trim() || range.end,
  }
}

function contratosQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = currentYearRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_inicio: process.env.CONTA_AZUL_CONTRATOS_START_DATE?.trim() || range.start,
    data_fim: process.env.CONTA_AZUL_CONTRATOS_END_DATE?.trim() || range.end,
  }
}

function vendasQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = currentYearRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_inicio: process.env.CONTA_AZUL_VENDAS_START_DATE?.trim() || range.start,
    data_fim: process.env.CONTA_AZUL_VENDAS_END_DATE?.trim() || range.end,
  }
}

function notasFiscaisQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = recentFifteenDayRange()
  return {
    pagina: page,
    tamanho_pagina: pageSize,
    data_inicial: process.env.CONTA_AZUL_NOTAS_FISCAIS_START_DATE?.trim() || range.start,
    data_final: process.env.CONTA_AZUL_NOTAS_FISCAIS_END_DATE?.trim() || range.end,
  }
}

function notasFiscaisServicoQuery({ page, pageSize }: { page: number; pageSize: number }) {
  const range = recentFifteenDayRange()
  return {
    pagina: page,
    tamanho_pagina: Math.min(pageSize, 100),
    data_competencia_de: process.env.CONTA_AZUL_NOTAS_FISCAIS_SERVICO_START_DATE?.trim() || range.start,
    data_competencia_ate: process.env.CONTA_AZUL_NOTAS_FISCAIS_SERVICO_END_DATE?.trim() || range.end,
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
    resource: 'empresa_conectada',
    path: envResourcePath('empresa_conectada', '/v1/pessoas/conta-conectada'),
    responseMode: 'single',
    itemKeys: [],
    defaultPageSize: 1,
    supportsIncremental: false,
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
    resource: 'produto_categorias',
    path: envResourcePath('produto_categorias', '/v1/produtos/categorias'),
    itemKeys: ['itens', 'items', 'data', 'content', 'categorias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produto_cest',
    path: envResourcePath('produto_cest', '/v1/produtos/cest'),
    itemKeys: ['itens', 'items', 'data', 'content', 'cests'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produto_ecommerce_marcas',
    path: envResourcePath('produto_ecommerce_marcas', '/v1/produtos/ecommerce-marcas'),
    itemKeys: ['itens', 'items', 'data', 'content', 'marcas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produto_ncm',
    path: envResourcePath('produto_ncm', '/v1/produtos/ncm'),
    itemKeys: ['itens', 'items', 'data', 'content', 'ncms'],
    defaultPageSize: 1000,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'produto_unidades_medida',
    path: envResourcePath('produto_unidades_medida', '/v1/produtos/unidades-medida'),
    itemKeys: ['itens', 'items', 'data', 'content', 'unidades'],
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
    resource: 'categorias_dre',
    path: envResourcePath('categorias_dre', '/v1/financeiro/categorias-dre'),
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
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: payableReceivableQuery,
  },
  {
    resource: 'contas_pagar',
    path: envResourcePath('contas_pagar', '/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar'),
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos', 'parcelas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: payableReceivableQuery,
  },
  {
    resource: 'contas_financeiras',
    path: envResourcePath('contas_financeiras', '/v1/conta-financeira'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
  },
  {
    resource: 'saldos_contas_financeiras',
    path: envResourcePath('contas_financeiras', '/v1/conta-financeira'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: pageQuery,
    derivedFrom: {
      resource: 'contas_financeiras',
      path: envResourcePath('saldos_contas_financeiras', '/v1/conta-financeira/{id_conta_financeira}/saldo-atual'),
      idKeys: ['id', 'uuid'],
      responseMode: 'single',
    },
  },
  {
    resource: 'transferencias',
    path: envResourcePath('transferencias', '/v1/financeiro/transferencias'),
    itemKeys: ['itens', 'items', 'data', 'content', 'transferencias'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: dateRangeQuery,
  },
  {
    resource: 'eventos_financeiros_alteracoes',
    path: envResourcePath('eventos_financeiros_alteracoes', '/v1/financeiro/eventos-financeiros/alteracoes'),
    itemKeys: ['itens', 'items', 'data', 'content', 'eventos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: financialDateTimeQuery,
  },
  {
    resource: 'saldos_iniciais',
    path: envResourcePath('saldos_iniciais', '/v1/financeiro/eventos-financeiros/saldo-inicial'),
    itemKeys: ['itens', 'items', 'data', 'content', 'saldos'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: financialDateTimeQuery,
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
    resource: 'vendedores',
    path: envResourcePath('vendedores', '/v1/venda/vendedores'),
    paginationMode: 'none',
    itemKeys: ['itens', 'items', 'data', 'content', 'vendedores'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
  },
  {
    resource: 'vendas',
    path: envResourcePath('vendas', '/v1/venda/busca'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: vendasQuery,
  },
  {
    resource: 'venda_detalhes',
    path: envResourcePath('vendas', '/v1/venda/busca'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: vendasQuery,
    derivedFrom: {
      resource: 'vendas',
      path: envResourcePath('venda_detalhes', '/v1/venda/{id}'),
      idKeys: ['id', 'uuid', 'id_legado'],
      responseMode: 'single',
    },
  },
  {
    resource: 'itens_venda',
    path: envResourcePath('vendas', '/v1/venda/busca'),
    itemKeys: ['itens', 'items', 'data', 'content', 'vendas'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: vendasQuery,
    derivedFrom: {
      resource: 'vendas',
      path: envResourcePath('itens_venda', '/v1/venda/{id_venda}/itens'),
      idKeys: ['id', 'uuid'],
      itemKeys: ['itens', 'items', 'data', 'content'],
    },
  },
  {
    resource: 'venda_proximo_numero',
    path: envResourcePath('venda_proximo_numero', '/v1/venda/proximo-numero'),
    responseMode: 'single',
    itemKeys: [],
    defaultPageSize: 1,
    supportsIncremental: false,
  },
  {
    resource: 'contratos',
    path: envResourcePath('contratos', '/v1/contratos'),
    itemKeys: ['itens', 'items', 'data', 'content', 'contratos', 'contracts'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: contratosQuery,
  },
  {
    resource: 'contrato_proximo_numero',
    path: envResourcePath('contrato_proximo_numero', '/v1/contratos/proximo-numero'),
    responseMode: 'single',
    itemKeys: [],
    defaultPageSize: 1,
    supportsIncremental: false,
  },
  {
    resource: 'notas_fiscais',
    path: envResourcePath('notas_fiscais', '/v1/notas-fiscais'),
    itemKeys: ['itens', 'items', 'data', 'content', 'notas_fiscais', 'invoices'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: notasFiscaisQuery,
  },
  {
    resource: 'notas_fiscais_servico',
    path: envResourcePath('notas_fiscais_servico', '/v1/notas-fiscais-servico'),
    itemKeys: ['itens', 'items', 'data', 'content', 'notas_fiscais'],
    defaultPageSize: DEFAULT_PAGE_SIZE,
    supportsIncremental: false,
    buildQuery: notasFiscaisServicoQuery,
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
