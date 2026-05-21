import { runQuery } from '@/lib/postgres'
import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/mcp-apps/server/appResources'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import type { McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'

type JsonRecord = Record<string, unknown>

type DomainToolDefinition = {
  name: string
  title: string
  description: string
  inputSchema: McpToolInputSchema
  outputSchema: McpToolInputSchema
  securitySchemes: readonly Record<string, unknown>[]
  annotations: Record<string, unknown>
  _meta: Record<string, unknown>
}

type ChartConfig = {
  xField: string
  valueField: string
  xLabel: string | null
  yLabel: string | null
}

type TableColumnConfig = {
  key: string
  label: string
  format?: string
}

type BuiltQuery = {
  sql: string
  params: unknown[]
  title: string
  chart: ChartConfig | null
  columns?: TableColumnConfig[]
  variant?: string
}

type EcommerceAction =
  | 'kpis_resumo'
  | 'vendas_por_canal'
  | 'pedidos_por_status'
  | 'faturamento_por_mes'
  | 'top_produtos_receita'
  | 'frete_por_transportadora'

type MarketingAction =
  | 'kpis_resumo'
  | 'desempenho_diario'
  | 'gasto_por_campanha'
  | 'roas_por_campanha'
  | 'gasto_por_conta'
  | 'top_anuncios'

type DataCatalogAction =
  | 'fontes'
  | 'recursos'
  | 'campos'
  | 'relacionamentos'
  | 'qualidade'
  | 'cobertura'
  | 'pronto_para_dashboard'

type DataCatalogDomain = 'erp' | 'crm' | 'marketing' | 'ecommerce'

type CrudAction = 'listar' | 'ler'

type ErpAcoesAction = 'criar' | 'atualizar' | 'baixar' | 'cancelar' | 'estornar' | 'reabrir'

type SqlExecutionAction = 'execute'
type FinancialStatementKind = 'dre' | 'cash_flow'

const READ_SECURITY_SCHEMES = [
  {
    type: 'oauth2',
    scopes: ['dashboards:read'],
  },
] as const

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const

const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
  idempotentHint: false,
} as const

const TOOL_META = {
  securitySchemes: READ_SECURITY_SCHEMES,
  ui: {
    resourceUri: DASHBOARD_WIDGET_RESOURCE_URI,
    visibility: ['model', 'app'],
  },
} as const

const ACTION_PARAMS_SCHEMA = {
  type: 'object',
  properties: {
    de: {
      type: 'string',
      description: 'Data inicial no formato YYYY-MM-DD.',
    },
    ate: {
      type: 'string',
      description: 'Data final no formato YYYY-MM-DD.',
    },
    limit: {
      type: 'integer',
      description: 'Limite de linhas. Maximo 200.',
    },
  },
  additionalProperties: true,
} as const

const ECOMMERCE_PARAMS_SCHEMA = {
  type: 'object',
  properties: {
    ...ACTION_PARAMS_SCHEMA.properties,
    plataforma: {
      type: 'string',
      enum: ['shopify', 'shopee', 'amazon', 'mercadolivre'],
      description:
        'Filtro por plataforma/canal de ecommerce. Use shopify, shopee, amazon ou mercadolivre quando a pergunta mencionar uma plataforma especifica.',
    },
    canal_conta_id: {
      type: 'string',
      description: 'ID interno da conta/canal conectado. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    loja_id: {
      type: 'string',
      description: 'ID interno da loja. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    status: {
      type: 'string',
      description: 'Filtro pelo status do pedido.',
    },
    status_pagamento: {
      type: 'string',
      description: 'Filtro pelo status de pagamento do pedido.',
    },
    status_fulfillment: {
      type: 'string',
      description: 'Filtro pelo status logistico/fulfillment do pedido.',
    },
  },
  additionalProperties: true,
} as const

const MARKETING_PARAMS_SCHEMA = {
  type: 'object',
  properties: {
    ...ACTION_PARAMS_SCHEMA.properties,
    plataforma: {
      type: 'string',
      enum: ['meta_ads', 'google_ads'],
      description:
        'Filtro por plataforma de trafego pago. Use meta_ads para Meta Ads e google_ads para Google Ads quando a pergunta mencionar uma plataforma especifica.',
    },
    nivel: {
      type: 'string',
      enum: ['conta', 'campanha', 'grupo', 'anuncio'],
      description: 'Filtro pela granularidade do fato de marketing: conta, campanha, grupo ou anuncio.',
    },
    conta_id: {
      type: 'string',
      description: 'ID interno da conta de midia. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    campanha_id: {
      type: 'string',
      description: 'ID interno da campanha. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    grupo_id: {
      type: 'string',
      description: 'ID interno do grupo/conjunto de anuncios. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    anuncio_id: {
      type: 'string',
      description: 'ID interno do anuncio. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
  },
  additionalProperties: true,
} as const

const METRICS_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    action: { type: 'string' },
    title: { type: 'string' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'integer' },
    chart: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['success', 'tool', 'action', 'title', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ERP_RESOURCE_TABLES = {
  'financeiro/contas-financeiras': 'financeiro.contas_financeiras',
  'financeiro/categorias-despesa': 'financeiro.categorias_despesa',
  'financeiro/categorias-receita': 'financeiro.categorias_receita',
  'financeiro/clientes': 'entidades.clientes',
  'financeiro/fornecedores': 'entidades.fornecedores',
  'financeiro/centros-custo': 'empresa.centros_custo',
  'financeiro/centros-lucro': 'empresa.centros_lucro',
  'vendas/pedidos': 'vendas.pedidos',
  'compras/pedidos': 'compras.compras',
  'contas-a-pagar': 'financeiro.contas_pagar',
  'contas-a-receber': 'financeiro.contas_receber',
  'estoque/almoxarifados': 'estoque.almoxarifados',
  'estoque/movimentacoes': 'estoque.movimentacoes_estoque',
  'estoque/estoque-atual': 'estoque.estoques_atual',
  'estoque/produtos': 'produtos.produto',
  'estoque/tipos-movimentacao': 'estoque.tipos_movimentacao',
} as const

const CRM_RESOURCE_TABLES = {
  'crm/contas': 'crm.contas',
  'crm/contatos': 'crm.contatos',
  'crm/leads': 'crm.leads',
  'crm/oportunidades': 'crm.oportunidades',
  'crm/atividades': 'crm.atividades',
  'crm/interacoes': 'crm.interacoes',
} as const

const CRUD_RESOURCE_TABLES = {
  ...ERP_RESOURCE_TABLES,
  ...CRM_RESOURCE_TABLES,
} as const

type DataCatalogResourceConfig = {
  domain: DataCatalogDomain
  resource: string
  label: string
  table: string
  dateColumn: string | null
  valueColumn?: string
  requiredFields?: readonly string[]
  relationships?: readonly {
    label: string
    sourceColumn: string
    targetTable: string
    targetColumn: string
  }[]
}

const DATA_CATALOG_RESOURCES = [
  {
    domain: 'erp',
    resource: 'contas-a-pagar',
    label: 'Contas a Pagar',
    table: 'financeiro.contas_pagar',
    dateColumn: 'data_lancamento',
    valueColumn: 'valor_liquido',
    requiredFields: ['fornecedor_id', 'data_vencimento', 'valor_liquido', 'status', 'categoria_despesa_id', 'centro_custo_id'],
    relationships: [
      { label: 'Fornecedor', sourceColumn: 'fornecedor_id', targetTable: 'entidades.fornecedores', targetColumn: 'id' },
      { label: 'Compra', sourceColumn: 'compra_id', targetTable: 'compras.compras', targetColumn: 'id' },
      { label: 'Categoria', sourceColumn: 'categoria_despesa_id', targetTable: 'financeiro.categorias_despesa', targetColumn: 'id' },
      { label: 'Centro de custo', sourceColumn: 'centro_custo_id', targetTable: 'empresa.centros_custo', targetColumn: 'id' },
      { label: 'Conta financeira', sourceColumn: 'conta_financeira_id', targetTable: 'financeiro.contas_financeiras', targetColumn: 'id' },
      { label: 'Departamento', sourceColumn: 'departamento_id', targetTable: 'empresa.departamentos', targetColumn: 'id' },
      { label: 'Filial', sourceColumn: 'filial_id', targetTable: 'empresa.filiais', targetColumn: 'id' },
      { label: 'Unidade de negocio', sourceColumn: 'unidade_negocio_id', targetTable: 'empresa.unidades_negocio', targetColumn: 'id' },
    ],
  },
  {
    domain: 'erp',
    resource: 'contas-a-receber',
    label: 'Contas a Receber',
    table: 'financeiro.contas_receber',
    dateColumn: 'data_lancamento',
    valueColumn: 'valor_liquido',
    requiredFields: ['cliente_id', 'data_vencimento', 'valor_liquido', 'status', 'categoria_receita_id', 'centro_lucro_id'],
    relationships: [
      { label: 'Cliente', sourceColumn: 'cliente_id', targetTable: 'entidades.clientes', targetColumn: 'id' },
      { label: 'Pedido de venda', sourceColumn: 'pedido_id', targetTable: 'vendas.pedidos', targetColumn: 'id' },
      { label: 'Categoria', sourceColumn: 'categoria_receita_id', targetTable: 'financeiro.categorias_receita', targetColumn: 'id' },
      { label: 'Centro de lucro', sourceColumn: 'centro_lucro_id', targetTable: 'empresa.centros_lucro', targetColumn: 'id' },
      { label: 'Conta financeira', sourceColumn: 'conta_financeira_id', targetTable: 'financeiro.contas_financeiras', targetColumn: 'id' },
      { label: 'Departamento', sourceColumn: 'departamento_id', targetTable: 'empresa.departamentos', targetColumn: 'id' },
      { label: 'Filial', sourceColumn: 'filial_id', targetTable: 'empresa.filiais', targetColumn: 'id' },
      { label: 'Unidade de negocio', sourceColumn: 'unidade_negocio_id', targetTable: 'empresa.unidades_negocio', targetColumn: 'id' },
    ],
  },
  { domain: 'erp', resource: 'vendas/pedidos', label: 'Pedidos de Venda', table: 'vendas.pedidos', dateColumn: 'data_pedido', valueColumn: 'valor_total', requiredFields: ['cliente_id', 'data_pedido', 'valor_total', 'status'] },
  { domain: 'erp', resource: 'compras/pedidos', label: 'Pedidos de Compra', table: 'compras.compras', dateColumn: 'data_pedido', valueColumn: 'valor_total', requiredFields: ['fornecedor_id', 'data_pedido', 'valor_total', 'status'] },
  { domain: 'erp', resource: 'financeiro/clientes', label: 'Clientes', table: 'entidades.clientes', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/fornecedores', label: 'Fornecedores', table: 'entidades.fornecedores', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/contas-financeiras', label: 'Contas Financeiras', table: 'financeiro.contas_financeiras', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/categorias-despesa', label: 'Categorias de Despesa', table: 'financeiro.categorias_despesa', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/categorias-receita', label: 'Categorias de Receita', table: 'financeiro.categorias_receita', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/centros-custo', label: 'Centros de Custo', table: 'empresa.centros_custo', dateColumn: null, requiredFields: ['nome'] },
  { domain: 'erp', resource: 'financeiro/centros-lucro', label: 'Centros de Lucro', table: 'empresa.centros_lucro', dateColumn: null, requiredFields: ['nome'] },
  {
    domain: 'crm',
    resource: 'crm/contas',
    label: 'Contas CRM',
    table: 'crm.contas',
    dateColumn: 'criado_em',
    requiredFields: ['nome'],
    relationships: [
      { label: 'Responsavel', sourceColumn: 'responsavel_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
    ],
  },
  {
    domain: 'crm',
    resource: 'crm/contatos',
    label: 'Contatos CRM',
    table: 'crm.contatos',
    dateColumn: 'criado_em',
    requiredFields: ['nome', 'conta_id'],
    relationships: [
      { label: 'Conta', sourceColumn: 'conta_id', targetTable: 'crm.contas', targetColumn: 'id' },
      { label: 'Responsavel', sourceColumn: 'responsavel_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
    ],
  },
  {
    domain: 'crm',
    resource: 'crm/leads',
    label: 'Leads',
    table: 'crm.leads',
    dateColumn: 'criado_em',
    requiredFields: ['nome', 'status'],
    relationships: [
      { label: 'Origem', sourceColumn: 'origem_id', targetTable: 'crm.origens_lead', targetColumn: 'id' },
      { label: 'Responsavel', sourceColumn: 'responsavel_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
      { label: 'Conta convertida', sourceColumn: 'conta_id', targetTable: 'crm.contas', targetColumn: 'id' },
      { label: 'Oportunidade convertida', sourceColumn: 'oportunidade_id', targetTable: 'crm.oportunidades', targetColumn: 'id' },
    ],
  },
  {
    domain: 'crm',
    resource: 'crm/oportunidades',
    label: 'Oportunidades',
    table: 'crm.oportunidades',
    dateColumn: 'criado_em',
    valueColumn: 'valor_estimado',
    requiredFields: ['nome', 'status', 'valor_estimado', 'fase_pipeline_id', 'vendedor_id'],
    relationships: [
      { label: 'Conta', sourceColumn: 'conta_id', targetTable: 'crm.contas', targetColumn: 'id' },
      { label: 'Lead', sourceColumn: 'lead_id', targetTable: 'crm.leads', targetColumn: 'id' },
      { label: 'Fase', sourceColumn: 'fase_pipeline_id', targetTable: 'crm.fases_pipeline', targetColumn: 'id' },
      { label: 'Vendedor', sourceColumn: 'vendedor_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
      { label: 'Motivo de perda', sourceColumn: 'motivo_perda_id', targetTable: 'crm.motivos_perda', targetColumn: 'id' },
    ],
  },
  {
    domain: 'crm',
    resource: 'crm/atividades',
    label: 'Atividades CRM',
    table: 'crm.atividades',
    dateColumn: 'data_prevista',
    requiredFields: ['tipo', 'status', 'responsavel_id'],
    relationships: [
      { label: 'Conta', sourceColumn: 'conta_id', targetTable: 'crm.contas', targetColumn: 'id' },
      { label: 'Contato', sourceColumn: 'contato_id', targetTable: 'crm.contatos', targetColumn: 'id' },
      { label: 'Lead', sourceColumn: 'lead_id', targetTable: 'crm.leads', targetColumn: 'id' },
      { label: 'Oportunidade', sourceColumn: 'oportunidade_id', targetTable: 'crm.oportunidades', targetColumn: 'id' },
      { label: 'Responsavel', sourceColumn: 'responsavel_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
    ],
  },
  {
    domain: 'crm',
    resource: 'crm/interacoes',
    label: 'Interacoes CRM',
    table: 'crm.interacoes',
    dateColumn: 'data_interacao',
    requiredFields: ['canal', 'conteudo', 'responsavel_id'],
    relationships: [
      { label: 'Conta', sourceColumn: 'conta_id', targetTable: 'crm.contas', targetColumn: 'id' },
      { label: 'Contato', sourceColumn: 'contato_id', targetTable: 'crm.contatos', targetColumn: 'id' },
      { label: 'Lead', sourceColumn: 'lead_id', targetTable: 'crm.leads', targetColumn: 'id' },
      { label: 'Oportunidade', sourceColumn: 'oportunidade_id', targetTable: 'crm.oportunidades', targetColumn: 'id' },
      { label: 'Responsavel', sourceColumn: 'responsavel_id', targetTable: 'comercial.vendedores', targetColumn: 'id' },
    ],
  },
  { domain: 'ecommerce', resource: 'ecommerce/pedidos', label: 'Pedidos Ecommerce', table: 'ecommerce.pedidos', dateColumn: 'data_pedido', valueColumn: 'valor_total', requiredFields: ['data_pedido', 'valor_total', 'status', 'plataforma'] },
  { domain: 'ecommerce', resource: 'ecommerce/itens', label: 'Itens Ecommerce', table: 'ecommerce.pedido_itens', dateColumn: null, valueColumn: 'valor_total', requiredFields: ['pedido_id'] },
  { domain: 'ecommerce', resource: 'ecommerce/envios', label: 'Envios Ecommerce', table: 'ecommerce.envios', dateColumn: null, valueColumn: 'frete_custo', requiredFields: ['pedido_id'] },
  { domain: 'marketing', resource: 'marketing/desempenho-diario', label: 'Desempenho Diario', table: 'trafegopago.desempenho_diario', dateColumn: 'data_ref', valueColumn: 'gasto', requiredFields: ['data_ref', 'plataforma', 'nivel'] },
  { domain: 'marketing', resource: 'marketing/contas', label: 'Contas de Midia', table: 'trafegopago.contas_midia', dateColumn: null, requiredFields: ['nome_conta', 'plataforma'] },
  { domain: 'marketing', resource: 'marketing/campanhas', label: 'Campanhas', table: 'trafegopago.campanhas', dateColumn: null, requiredFields: ['nome', 'plataforma'] },
] as const satisfies readonly DataCatalogResourceConfig[]

const ERP_ALLOWED_RESOURCES = Object.keys(ERP_RESOURCE_TABLES)
const CRM_ALLOWED_RESOURCES = Object.keys(CRM_RESOURCE_TABLES)

const ERP_ACOES_ALLOWED_RESOURCES = ['contas-a-pagar', 'contas-a-receber'] as const

const ERP_ACOES_SCHEMA = {
  type: 'object',
  properties: {
    resource: {
      type: 'string',
      enum: ERP_ACOES_ALLOWED_RESOURCES,
      description: 'Recurso transacional do ERP. Nesta versao, use contas-a-pagar ou contas-a-receber.',
    },
    action: {
      type: 'string',
      enum: ['criar', 'atualizar', 'baixar', 'cancelar', 'estornar', 'reabrir'],
      description:
        'Operacao com efeito colateral. Use criar/atualizar para editar dados; baixar, cancelar, estornar e reabrir para transicoes de status.',
    },
    id: {
      type: 'integer',
      description: 'ID do registro. Obrigatorio para atualizar, baixar, cancelar, estornar e reabrir.',
    },
    payload: {
      type: 'object',
      description:
        'Campos da operacao. Para criar conta a pagar use fornecedor_id, valor e data_vencimento. Para criar conta a receber use cliente_id, valor e data_vencimento. Aceita descricao, observacao, numero_documento, tipo_documento, status, categoria_id, conta_financeira_id, centro_custo_id, centro_lucro_id e datas YYYY-MM-DD.',
      additionalProperties: true,
    },
    dry_run: {
      type: 'boolean',
      description: 'Default true. Quando true, valida e retorna preview sem alterar dados. Use false somente apos confirmacao explicita.',
    },
    idempotency_key: {
      type: 'string',
      description: 'Chave opcional para rastrear operacoes sensiveis e evitar duplicidade no orquestrador.',
    },
  },
  required: ['resource', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

function createCrudSchema(allowedResources: string[], description: string) {
  return {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['listar', 'ler'],
        description: 'Use listar para consultar registros e ler para buscar um registro especifico por params.id.',
      },
      resource: {
        type: 'string',
        enum: allowedResources,
        description,
      },
      params: {
        type: 'object',
        description:
          'Filtros de leitura. Suporta id, q, limit, offset, de, ate, data_campo, status, status_in, valor_min, valor_max, vencidas, a_vencer_dias, numero_documento, tipo_documento, ativo e filtros *_id quando forem necessarios internamente. A resposta prioriza nomes e descricoes de negocio, nao IDs: cliente, fornecedor, vendedor, canal, fase, produto, almoxarifado, categoria e centro.',
        additionalProperties: true,
      },
    },
    required: ['action', 'resource'],
    additionalProperties: true,
  } as const satisfies McpToolInputSchema
}

const ERP_CRUD_SCHEMA = createCrudSchema(
  ERP_ALLOWED_RESOURCES,
  'Resource canonico do ERP. Exemplos comuns: contas-a-pagar, contas-a-receber, vendas/pedidos, compras/pedidos, financeiro/clientes, financeiro/fornecedores, financeiro/contas-financeiras, estoque/produtos, estoque/estoque-atual.',
)

const CRM_SCHEMA = createCrudSchema(
  CRM_ALLOWED_RESOURCES,
  'Resource canonico do CRM. Use crm/contas, crm/contatos, crm/leads, crm/oportunidades ou crm/atividades.',
)

const CRUD_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    action: { type: 'string' },
    resource: { type: 'string' },
    title: { type: 'string' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'integer' },
  },
  required: ['success', 'tool', 'action', 'resource', 'title', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ERP_ACOES_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    action: { type: 'string' },
    resource: { type: 'string' },
    title: { type: 'string' },
    dry_run: { type: 'boolean' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'integer' },
    result: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['success', 'tool', 'action', 'resource', 'title', 'dry_run', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const SQL_EXECUTION_SCHEMA = {
  type: 'object',
  properties: {
    sql: {
      type: 'string',
      description:
        'SQL de leitura para analises ad-hoc. Aceita somente SELECT ou WITH, uma unica instrucao, sem comandos de escrita e sem placeholders $1/$2. Use {{tenant_id}} quando precisar filtrar por tenant.',
    },
    title: {
      type: 'string',
      description: 'Titulo opcional do resultado.',
    },
    chart: {
      type: 'object',
      description: 'Config opcional para renderizar grafico simples: xField, valueField, xLabel, yLabel.',
      properties: {
        xField: { type: 'string' },
        valueField: { type: 'string' },
        xLabel: { type: 'string' },
        yLabel: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
  required: ['sql'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const FINANCIAL_STATEMENT_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['dre', 'cash_flow'],
      description:
        'Tipo do demonstrativo. Use dre para demonstracao de resultados e cash_flow para fluxo de caixa previsto por vencimento.',
    },
    de: {
      type: 'string',
      description: 'Data inicial no formato YYYY-MM-DD.',
    },
    ate: {
      type: 'string',
      description: 'Data final no formato YYYY-MM-DD.',
    },
    categoria_id: {
      type: 'integer',
      description: 'Filtro opcional por categoria financeira vinculada ao lancamento contabil.',
    },
    categoria: {
      type: 'string',
      description: 'Filtro opcional por nome de categoria financeira vinculada ao lancamento contabil.',
    },
    centro_custo_id: {
      type: 'integer',
      description: 'Filtro opcional por centro de custo em contas a pagar vinculadas.',
    },
    centro_lucro_id: {
      type: 'integer',
      description: 'Filtro opcional por centro de lucro em contas a receber vinculadas.',
    },
    centro: {
      type: 'string',
      description: 'Filtro opcional por nome de centro de custo ou centro de lucro vinculado.',
    },
    fornecedor_id: {
      type: 'integer',
      description: 'Filtro opcional por fornecedor vinculado ao lancamento contabil.',
    },
    cliente_id: {
      type: 'integer',
      description: 'Filtro opcional por cliente vinculado ao lancamento contabil.',
    },
    conta_contabil_codigo: {
      type: 'string',
      description: 'Filtro opcional por codigo/prefixo da conta contabil.',
    },
    linha_dre: {
      type: 'string',
      description: 'Filtro opcional pela linha canonica da DRE, como receita_bruta, custos ou despesas_administrativas.',
    },
  },
  required: ['kind'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ECOMMERCE_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'kpis_resumo',
        'vendas_por_canal',
        'pedidos_por_status',
        'faturamento_por_mes',
        'top_produtos_receita',
        'frete_por_transportadora',
      ],
      description:
        'Metrica canonica de ecommerce. Use kpis_resumo para visao geral; vendas_por_canal, pedidos_por_status, faturamento_por_mes, top_produtos_receita ou frete_por_transportadora para cortes analiticos.',
    },
    params: ECOMMERCE_PARAMS_SCHEMA,
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const MARKETING_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'kpis_resumo',
        'desempenho_diario',
        'gasto_por_campanha',
        'roas_por_campanha',
        'gasto_por_conta',
        'top_anuncios',
      ],
      description:
        'Metrica canonica de marketing/trafego pago. Use kpis_resumo para visao geral; desempenho_diario, gasto_por_campanha, roas_por_campanha, gasto_por_conta ou top_anuncios para cortes analiticos.',
    },
    params: MARKETING_PARAMS_SCHEMA,
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DATA_CATALOG_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['fontes', 'recursos', 'campos', 'relacionamentos', 'qualidade', 'cobertura', 'pronto_para_dashboard'],
      description:
        'Tipo de consulta ao catalogo. Use fontes para ver dominios conectados; recursos para listar tabelas canonicas; campos para schema; relacionamentos, qualidade, cobertura ou pronto_para_dashboard para avaliar um recurso.',
    },
    domain: {
      type: 'string',
      enum: ['erp', 'crm', 'marketing', 'ecommerce'],
      description: 'Dominio opcional para filtrar o catalogo.',
    },
    resource: {
      type: 'string',
      description:
        'Recurso canonico opcional, como contas-a-pagar, contas-a-receber, crm/oportunidades, ecommerce/pedidos ou marketing/desempenho-diario.',
    },
    de: {
      type: 'string',
      description: 'Data inicial no formato YYYY-MM-DD, aplicada quando o recurso tem coluna de data.',
    },
    ate: {
      type: 'string',
      description: 'Data final no formato YYYY-MM-DD, aplicada quando o recurso tem coluna de data.',
    },
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DATA_CATALOG_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string' },
    action: { type: 'string' },
    domain: { type: 'string' },
    resource: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    sources: { type: 'array', items: { type: 'object', additionalProperties: true } },
    resources: { type: 'array', items: { type: 'object', additionalProperties: true } },
    fields: { type: 'array', items: { type: 'object', additionalProperties: true } },
    relationships: { type: 'array', items: { type: 'object', additionalProperties: true } },
    quality: { type: 'object', additionalProperties: true },
    coverage: { type: 'array', items: { type: 'object', additionalProperties: true } },
    issues: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    rows: { type: 'array', items: { type: 'object', additionalProperties: true } },
    columns: { type: 'array', items: { type: 'string' } },
    count: { type: 'integer' },
  },
  required: ['success', 'tool', 'view', 'action', 'title'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const FINANCIAL_STATEMENT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string', enum: ['table'] },
    kind: { type: 'string', enum: ['dre', 'cash_flow'] },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          { type: 'object', additionalProperties: true },
        ],
      },
    },
    count: { type: 'integer' },
    variant: { type: 'string' },
  },
  required: ['success', 'tool', 'view', 'kind', 'title', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const MCP_APP_DOMAIN_TOOL_NAMES = {
  erp: 'erp',
  erpAcoes: 'erp_acoes',
  crm: 'crm',
  sql: 'sql',
  sqlExecution: 'sql_execution',
  financialStatement: 'financial_statement',
  ecommerce: 'ecommerce',
  marketing: 'marketing',
  dataCatalog: 'data_catalog',
} as const

function isEnvEnabled(name: string) {
  const value = String(process.env[name] || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

const ERP_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.erp,
  title: 'ERP',
  description:
    'Consulta registros operacionais do ERP em modo leitura. Use para financeiro, vendas, compras e estoque. Acoes suportadas: listar e ler. Recursos principais retornam colunas de negocio com nomes resolvidos por join, sem expor IDs internos na tabela: contas-a-pagar, contas-a-receber, vendas/pedidos, compras/pedidos, estoque/estoque-atual e estoque/movimentacoes.',
  inputSchema: ERP_CRUD_SCHEMA,
  outputSchema: CRUD_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const ERP_ACOES_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.erpAcoes,
  title: 'ERP acoes',
  description:
    'Executa acoes transacionais no ERP que podem alterar dados. Use para criar, atualizar, baixar, cancelar, estornar ou reabrir contas a pagar e contas a receber. Por seguranca, dry_run e true por padrao e retorna apenas preview; envie dry_run=false somente depois de confirmacao explicita do usuario.',
  inputSchema: ERP_ACOES_SCHEMA,
  outputSchema: ERP_ACOES_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: WRITE_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const CRM_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.crm,
  title: 'CRM',
  description:
    'Consulta registros operacionais do CRM em modo leitura. Use para contas, contatos, leads, oportunidades, atividades e interacoes. Acoes suportadas: listar e ler. Recursos retornam colunas de negocio com nomes resolvidos por join quando disponivel: crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades e crm/interacoes.',
  inputSchema: CRM_SCHEMA,
  outputSchema: CRUD_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const ECOMMERCE_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.ecommerce,
  title: 'Ecommerce metrics',
  description:
    'Retorna metricas prontas de ecommerce sem SQL livre. Use para perguntas sobre pedidos, receita, ticket medio, canais, status, faturamento mensal, produtos e frete em Shopify, Shopee, Amazon e Mercado Livre.',
  inputSchema: ECOMMERCE_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const SQL_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.sql,
  title: 'SQL',
  description:
    'Executa SQL analitico ad-hoc em modo leitura. Use como fallback quando erp, crm, ecommerce ou marketing nao cobrirem a pergunta. Aceita apenas SELECT ou WITH, uma unica instrucao, sem escrita; use {{tenant_id}} para bind automatico de tenant.',
  inputSchema: SQL_EXECUTION_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const FINANCIAL_STATEMENT_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.financialStatement,
  title: 'Financial statement',
  description:
    'Mostra DRE ou fluxo de caixa em tabela, usando query read-only no tenant atual. Use kind=dre para demonstracao de resultados com filtros por periodo, categoria, centro, conta contabil e linha da DRE; use kind=cash_flow para fluxo de caixa previsto por vencimento.',
  inputSchema: FINANCIAL_STATEMENT_SCHEMA,
  outputSchema: FINANCIAL_STATEMENT_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const MARKETING_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.marketing,
  title: 'Marketing metrics',
  description:
    'Retorna metricas prontas de marketing/trafego pago sem SQL livre. Use para perguntas sobre gasto, receita atribuida, ROAS, cliques, impressoes, conversoes, campanhas, contas, anuncios e desempenho diario em Meta Ads e Google Ads.',
  inputSchema: MARKETING_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const DATA_CATALOG_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.dataCatalog,
  title: 'Data catalog',
  description:
    'Mostra o catalogo de dados conectados do tenant: fontes, recursos, campos, relacionamentos, qualidade, cobertura por periodo e prontidao para dashboard/relatorio. Use antes de analises quando precisar saber quais dados existem e se estao completos.',
  inputSchema: DATA_CATALOG_SCHEMA,
  outputSchema: DATA_CATALOG_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

export function listMcpAppDomainToolDefinitions() {
  return [
    ERP_DOMAIN_TOOL_DEFINITION,
    ERP_ACOES_DOMAIN_TOOL_DEFINITION,
    CRM_DOMAIN_TOOL_DEFINITION,
    ECOMMERCE_DOMAIN_TOOL_DEFINITION,
    SQL_DOMAIN_TOOL_DEFINITION,
    FINANCIAL_STATEMENT_TOOL_DEFINITION,
    MARKETING_DOMAIN_TOOL_DEFINITION,
    DATA_CATALOG_DOMAIN_TOOL_DEFINITION,
  ]
}

export const MCP_APP_DOMAIN_TOOL_DEFINITIONS = [
  ERP_DOMAIN_TOOL_DEFINITION,
  ERP_ACOES_DOMAIN_TOOL_DEFINITION,
  CRM_DOMAIN_TOOL_DEFINITION,
  ECOMMERCE_DOMAIN_TOOL_DEFINITION,
  SQL_DOMAIN_TOOL_DEFINITION,
  FINANCIAL_STATEMENT_TOOL_DEFINITION,
  MARKETING_DOMAIN_TOOL_DEFINITION,
  DATA_CATALOG_DOMAIN_TOOL_DEFINITION,
] as const satisfies readonly DomainToolDefinition[]

const MCP_APP_DOMAIN_TOOL_NAME_SET = new Set<string>(
  Object.values(MCP_APP_DOMAIN_TOOL_NAMES),
)

function toObj(input: unknown): JsonRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonRecord
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toOptionalText(value: unknown): string | null {
  const text = toText(value)
  return text || null
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(toText(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeDate(value: unknown): string | null {
  const out = toText(value)
  if (!out) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) {
    throw new Error(`Data invalida: ${out}. Use formato YYYY-MM-DD.`)
  }
  return out
}

function normalizeLimit(value: unknown, fallback: number) {
  return Math.min(toPositiveInt(value, fallback), 200)
}

function inferColumns(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function splitTableName(table: string) {
  const [schema, name] = table.split('.')
  if (!schema || !name) throw new Error(`Tabela invalida no catalogo: ${table}`)
  return { schema, name }
}

function getTenantId(context: CognitoMcpServerContext) {
  return context.tenantId && context.tenantId > 0 ? context.tenantId : 1
}

function normalizeEcommerceAction(value: unknown): EcommerceAction {
  const out = toText(value).toLowerCase()
  if (
    out === 'kpis_resumo' ||
    out === 'vendas_por_canal' ||
    out === 'pedidos_por_status' ||
    out === 'faturamento_por_mes' ||
    out === 'top_produtos_receita' ||
    out === 'frete_por_transportadora'
  ) {
    return out
  }
  throw new Error('action invalida para ecommerce')
}

function normalizeMarketingAction(value: unknown): MarketingAction {
  const out = toText(value).toLowerCase()
  if (
    out === 'kpis_resumo' ||
    out === 'desempenho_diario' ||
    out === 'gasto_por_campanha' ||
    out === 'roas_por_campanha' ||
    out === 'gasto_por_conta' ||
    out === 'top_anuncios'
  ) {
    return out
  }
  throw new Error('action invalida para marketing')
}

function normalizeDataCatalogAction(value: unknown): DataCatalogAction {
  const out = toText(value || 'fontes').toLowerCase()
  if (
    out === 'fontes' ||
    out === 'recursos' ||
    out === 'campos' ||
    out === 'relacionamentos' ||
    out === 'qualidade' ||
    out === 'cobertura' ||
    out === 'pronto_para_dashboard'
  ) {
    return out
  }
  throw new Error('action invalida para data_catalog')
}

function normalizeDataCatalogDomain(value: unknown): DataCatalogDomain | null {
  const out = toText(value).toLowerCase()
  if (!out) return null
  if (out === 'erp' || out === 'crm' || out === 'marketing' || out === 'ecommerce') return out
  throw new Error('domain invalido para data_catalog')
}

function normalizeCrudAction(value: unknown): CrudAction {
  const out = toText(value).toLowerCase()
  if (out === 'listar' || out === 'list') return 'listar'
  if (out === 'ler' || out === 'read' || out === 'get') return 'ler'
  throw new Error('action invalida para crud. Use listar ou ler.')
}

function normalizeErpAcoesAction(value: unknown): ErpAcoesAction {
  const out = toText(value).toLowerCase()
  if (
    out === 'criar' ||
    out === 'atualizar' ||
    out === 'baixar' ||
    out === 'cancelar' ||
    out === 'estornar' ||
    out === 'reabrir'
  ) {
    return out
  }
  throw new Error('action invalida para erp_acoes')
}

type ErpAcoesResource = (typeof ERP_ACOES_ALLOWED_RESOURCES)[number]
type ErpAcoesConfig = {
  resource: ErpAcoesResource
  table: 'financeiro.contas_pagar' | 'financeiro.contas_receber'
  label: 'Conta a pagar' | 'Conta a receber'
  entityIdColumn: 'fornecedor_id' | 'cliente_id'
  entityPayloadKey: 'fornecedor_id' | 'cliente_id'
  categoryColumn: 'categoria_despesa_id' | 'categoria_receita_id'
  centerColumn: 'centro_custo_id' | 'centro_lucro_id'
  paidStatus: 'pago' | 'recebido'
  statuses: readonly string[]
  statusAliases: Record<string, string>
}

const ERP_ACOES_CONFIG: Record<ErpAcoesResource, ErpAcoesConfig> = {
  'contas-a-pagar': {
    resource: 'contas-a-pagar',
    table: 'financeiro.contas_pagar',
    label: 'Conta a pagar',
    entityIdColumn: 'fornecedor_id',
    entityPayloadKey: 'fornecedor_id',
    categoryColumn: 'categoria_despesa_id',
    centerColumn: 'centro_custo_id',
    paidStatus: 'pago',
    statuses: ['pendente', 'vencido', 'parcial', 'pago', 'cancelado'],
    statusAliases: {
      aberto: 'pendente',
      em_aberto: 'pendente',
      'em aberto': 'pendente',
      baixado: 'pago',
      liquidado: 'pago',
    },
  },
  'contas-a-receber': {
    resource: 'contas-a-receber',
    table: 'financeiro.contas_receber',
    label: 'Conta a receber',
    entityIdColumn: 'cliente_id',
    entityPayloadKey: 'cliente_id',
    categoryColumn: 'categoria_receita_id',
    centerColumn: 'centro_lucro_id',
    paidStatus: 'recebido',
    statuses: ['pendente', 'vencido', 'parcial', 'recebido', 'cancelado'],
    statusAliases: {
      aberto: 'pendente',
      em_aberto: 'pendente',
      'em aberto': 'pendente',
      pago: 'recebido',
      baixado: 'recebido',
      liquidado: 'recebido',
    },
  },
}

const ERP_ACOES_TRANSITIONS: Record<ErpAcoesResource, Record<string, string[]>> = {
  'contas-a-pagar': {
    pendente: ['vencido', 'parcial', 'pago', 'cancelado'],
    vencido: ['parcial', 'pago', 'cancelado'],
    parcial: ['pendente', 'vencido', 'pago', 'cancelado'],
    pago: ['pendente'],
    cancelado: ['pendente'],
  },
  'contas-a-receber': {
    pendente: ['vencido', 'parcial', 'recebido', 'cancelado'],
    vencido: ['parcial', 'recebido', 'cancelado'],
    parcial: ['pendente', 'vencido', 'recebido', 'cancelado'],
    recebido: ['pendente'],
    cancelado: ['pendente'],
  },
}

const ERP_ACOES_STATUS_ACTIONS: Record<
  Exclude<ErpAcoesAction, 'criar' | 'atualizar'>,
  { target: (config: ErpAcoesConfig) => string; allowedFrom: (config: ErpAcoesConfig) => string[]; notePrefix: string; successVerb: string }
> = {
  baixar: {
    target: (config) => config.paidStatus,
    allowedFrom: () => ['pendente', 'vencido', 'parcial'],
    notePrefix: '[baixa]',
    successVerb: 'baixada',
  },
  cancelar: {
    target: () => 'cancelado',
    allowedFrom: () => ['pendente', 'vencido', 'parcial'],
    notePrefix: '[cancelamento]',
    successVerb: 'cancelada',
  },
  estornar: {
    target: () => 'pendente',
    allowedFrom: (config) => [config.paidStatus],
    notePrefix: '[estorno]',
    successVerb: 'estornada',
  },
  reabrir: {
    target: () => 'pendente',
    allowedFrom: (config) => ['cancelado', config.paidStatus],
    notePrefix: '[reabertura]',
    successVerb: 'reaberta',
  },
}

function normalizeErpAcoesResource(value: unknown): ErpAcoesResource {
  const resource = toText(value)
  if (resource === 'contas-a-pagar' || resource === 'contas-a-receber') return resource
  throw new Error('resource invalido para erp_acoes. Use contas-a-pagar ou contas-a-receber.')
}

function normalizeErpAcoesStatus(config: ErpAcoesConfig, value: unknown) {
  const status = toText(value || 'pendente').toLowerCase()
  return config.statusAliases[status] || status
}

function assertErpAcoesStatus(config: ErpAcoesConfig, status: string) {
  if (!config.statuses.includes(status)) {
    throw new Error(`status invalido para ${config.resource}: ${status || '(vazio)'}`)
  }
}

function makeErpAcoesDocumentNumber(resource: ErpAcoesResource) {
  const prefix = resource === 'contas-a-pagar' ? 'CP' : 'CR'
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${ymd}-${rand}`
}

function normalizeAndAssertSafeSelectQuery(sql: string) {
  const cleaned = sql.trim().replace(/;+\s*$/g, '')
  if (!cleaned) throw new Error('sql vazio')
  if (cleaned.includes(';')) throw new Error('apenas uma query e permitida')
  if (/\$\d+/.test(cleaned)) {
    throw new Error('placeholders posicionais ($1, $2, ...) nao sao permitidos; use SQL literal ou {{tenant_id}}')
  }
  if (!/^\s*(select|with)\b/i.test(cleaned)) throw new Error('somente SELECT/CTE (WITH) e permitido')

  const blocked =
    /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|vacuum|call|do|copy|merge|execute|prepare|deallocate)\b/i
  if (blocked.test(cleaned)) throw new Error('sql contem comando nao permitido')

  return cleaned
}

function bindTenantParam(sql: string, tenantId: number) {
  const params: unknown[] = []
  let tenantParamIndex = 0
  const compiled = sql.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, rawName: string) => {
    const name = String(rawName || '').trim().toLowerCase()
    if (name !== 'tenant_id') {
      throw new Error(`placeholder nao suportado: {{${rawName}}}. Use apenas {{tenant_id}} nesta tool`)
    }
    if (tenantParamIndex > 0) return `$${tenantParamIndex}`
    params.push(tenantId)
    tenantParamIndex = params.length
    return `$${tenantParamIndex}`
  })
  return { sql: compiled, params }
}

function parseChartConfig(rawChart: unknown): ChartConfig | null {
  if (rawChart == null) return null
  const raw = toObj(rawChart)
  const xField = toText(raw.xField)
  const valueField = toText(raw.valueField)
  if (!xField || !valueField) {
    throw new Error('chart invalido: informe chart.xField e chart.valueField')
  }
  return {
    xField,
    valueField,
    xLabel: toText(raw.xLabel) || null,
    yLabel: toText(raw.yLabel) || null,
  }
}

function assertChartColumns(chart: ChartConfig | null, columns: string[]) {
  if (!chart) return null
  if (!columns.length) return chart

  const missingFields: string[] = []
  if (!columns.includes(chart.xField)) missingFields.push(`xField=${chart.xField}`)
  if (!columns.includes(chart.valueField)) missingFields.push(`valueField=${chart.valueField}`)
  if (missingFields.length) {
    throw new Error(`chart invalido: colunas nao encontradas no resultado (${missingFields.join(', ')})`)
  }
  return chart
}

function normalizeFinancialStatementKind(value: unknown): FinancialStatementKind {
  const kind = toText(value).toLowerCase()
  if (kind === 'dre') return 'dre'
  if (kind === 'cash_flow' || kind === 'cashflow' || kind === 'fluxo_de_caixa' || kind === 'fluxo-caixa') return 'cash_flow'
  throw new Error('kind invalido para financial_statement. Use dre ou cash_flow.')
}

function toUtcDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function startOfMonthUtc(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1))
}

function endOfMonthUtc(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0))
}

function addMonthsUtc(value: Date, months: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, value.getUTCDate()))
}

function formatDateIso(value: Date) {
  return toUtcDateOnly(value).toISOString().slice(0, 10)
}

export function resolveFinancialPeriod(kind: FinancialStatementKind, paramsIn: JsonRecord) {
  const today = new Date()
  const defaultDe = kind === 'cash_flow'
    ? formatDateIso(startOfMonthUtc(addMonthsUtc(today, -2)))
    : formatDateIso(new Date(Date.UTC(today.getUTCFullYear(), 0, 1)))
  const defaultAte = kind === 'cash_flow'
    ? formatDateIso(endOfMonthUtc(addMonthsUtc(today, 3)))
    : formatDateIso(today)

  const de = normalizeDate(paramsIn.de) || defaultDe
  const ate = normalizeDate(paramsIn.ate) || defaultAte

  if (de > ate) {
    throw new Error('Data inicial nao pode ser maior que a data final')
  }

  return { de, ate }
}

function buildFinancialStatementMonthColumns(period: { de: string; ate: string }) {
  const start = startOfMonthUtc(new Date(`${period.de}T00:00:00Z`))
  const end = startOfMonthUtc(new Date(`${period.ate}T00:00:00Z`))
  const columns: Array<{ key: string; label: string; dateIso: string }> = []

  for (let current = start; current <= end; current = addMonthsUtc(current, 1)) {
    const year = current.getUTCFullYear()
    const month = padMonth(current.getUTCMonth() + 1)
    columns.push({
      key: `mes_${year}_${month}`,
      label: `${year}/${month}`,
      dateIso: `${year}-${month}-01`,
    })
  }

  return columns
}

function padMonth(value: number) {
  return String(value).padStart(2, '0')
}

function normalizeDreLineFilter(value: unknown) {
  const raw = toText(value)
  if (!raw) return null
  const line = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const canonical = new Set([
    'receita_bruta',
    'descontos',
    'custos',
    'despesas_administrativas',
    'despesas_bancarias',
    'despesas_comerciais',
    'despesas_funcionarios',
    'impostos',
  ])
  if (canonical.has(line)) return line
  if (line.includes('receita')) return 'receita_bruta'
  if (line.includes('desconto') || line.includes('abatimento') || line.includes('dedu')) return 'descontos'
  if (line.includes('custo') || line.includes('mercadoria')) return 'custos'
  if (line.includes('banc') || line.includes('tarifa') || line.includes('juros')) return 'despesas_bancarias'
  if (line.includes('comerc')) return 'despesas_comerciais'
  if (line.includes('funcion') || line.includes('salario') || line.includes('folha') || line.includes('encargo')) return 'despesas_funcionarios'
  if (line.includes('imposto') || line.includes('tribut') || line.includes('fiscal')) return 'impostos'
  if (line.includes('admin') || line.includes('despesa')) return 'despesas_administrativas'
  return line
}

function appendOptionalNumericFilter(
  paramsIn: JsonRecord,
  key: string,
  params: unknown[],
  where: string[],
  buildExpression: (placeholder: string) => string,
) {
  const raw = toText(paramsIn[key])
  if (!raw) return
  const value = toNumber(raw)
  if (value == null) throw new Error(`Filtro invalido: ${key}`)
  params.push(value)
  where.push(buildExpression(`$${params.length}`))
}

function buildFinancialStatementDreQuery(paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const period = resolveFinancialPeriod('dre', paramsIn)
  const monthColumns = buildFinancialStatementMonthColumns(period)
  const monthValueColumns = monthColumns
    .map((column) => `COALESCE(SUM(CASE WHEN mes = DATE '${column.dateIso}' THEN valor ELSE 0 END), 0)::float AS "${column.key}"`)
    .join(',\n  ')
  const params: unknown[] = [tenantId, period.de, period.ate]
  const baseWhere = [
    'lc.tenant_id = $1::int',
    'lc.data_lancamento::date BETWEEN $2::date AND $3::date',
    "(pc.codigo LIKE '4.%' OR pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')",
  ]
  const classifiedWhere: string[] = []

  appendOptionalNumericFilter(paramsIn, 'categoria_id', params, baseWhere, (placeholder) =>
    `(cp.categoria_despesa_id = ${placeholder}::int OR cr.categoria_receita_id = ${placeholder}::int)`
  )
  appendOptionalNumericFilter(paramsIn, 'centro_custo_id', params, baseWhere, (placeholder) =>
    `cp.centro_custo_id = ${placeholder}::int`
  )
  appendOptionalNumericFilter(paramsIn, 'centro_lucro_id', params, baseWhere, (placeholder) =>
    `cr.centro_lucro_id = ${placeholder}::int`
  )
  appendOptionalNumericFilter(paramsIn, 'fornecedor_id', params, baseWhere, (placeholder) =>
    `(cp.fornecedor_id = ${placeholder}::int OR lc.fornecedor_id = ${placeholder}::int)`
  )
  appendOptionalNumericFilter(paramsIn, 'cliente_id', params, baseWhere, (placeholder) =>
    `(cr.cliente_id = ${placeholder}::int OR lc.cliente_id = ${placeholder}::int)`
  )

  const categoria = toText(paramsIn.categoria)
  if (categoria) {
    params.push(`%${categoria}%`)
    baseWhere.push(`(COALESCE(cd.nome, '') ILIKE $${params.length}::text OR COALESCE(cre.nome, '') ILIKE $${params.length}::text)`)
  }

  const centro = toText(paramsIn.centro)
  if (centro) {
    params.push(`%${centro}%`)
    baseWhere.push(`(COALESCE(cc.nome, '') ILIKE $${params.length}::text OR COALESCE(cl.nome, '') ILIKE $${params.length}::text)`)
  }

  const contaContabilCodigo = toText(paramsIn.conta_contabil_codigo)
  if (contaContabilCodigo) {
    params.push(`${contaContabilCodigo}%`)
    baseWhere.push(`COALESCE(pc.codigo, '') ILIKE $${params.length}::text`)
  }

  const linhaDre = normalizeDreLineFilter(paramsIn.linha_dre)
  if (linhaDre) {
    params.push(linhaDre)
    classifiedWhere.push(`grupo = $${params.length}::text`)
  }

  const sql = `
WITH months AS (
  SELECT generate_series(date_trunc('month', $2::date), date_trunc('month', $3::date), interval '1 month')::date AS mes
),
base AS (
  SELECT
    date_trunc('month', lc.data_lancamento::date)::date AS mes,
    COALESCE(pc.codigo, '') AS codigo,
    LOWER(COALESCE(pc.nome, '')) AS nome,
    LOWER(COALESCE(cd.nome, cre.nome, '')) AS categoria_nome,
    COALESCE(ll.credito, 0)::float AS credito,
    COALESCE(ll.debito, 0)::float AS debito
  FROM contabilidade.lancamentos_contabeis lc
  JOIN contabilidade.lancamentos_contabeis_linhas ll ON ll.lancamento_id = lc.id
  LEFT JOIN contabilidade.plano_contas pc ON pc.id = ll.conta_id
  LEFT JOIN financeiro.contas_pagar cp
    ON cp.tenant_id = lc.tenant_id
   AND (
     (lc.origem_tabela = 'financeiro.contas_pagar' AND lc.origem_id = cp.id)
     OR cp.lancamento_contabil_id = lc.id
   )
  LEFT JOIN financeiro.contas_receber cr
    ON cr.tenant_id = lc.tenant_id
   AND (
     (lc.origem_tabela = 'financeiro.contas_receber' AND lc.origem_id = cr.id)
     OR cr.lancamento_contabil_id = lc.id
   )
  LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
  LEFT JOIN financeiro.categorias_receita cre ON cre.id = cr.categoria_receita_id
  LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
  LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
  WHERE ${baseWhere.join('\n    AND ')}
),
classified AS (
  SELECT
    mes,
    CASE
      WHEN codigo LIKE '4.%' AND (
        nome LIKE '%desconto%'
        OR nome LIKE '%abatimento%'
        OR nome LIKE '%dedu%'
      ) THEN 'descontos'
      WHEN codigo LIKE '4.%' THEN 'receita_bruta'
      WHEN codigo LIKE '5.%' THEN 'custos'
      WHEN categoria_nome LIKE '%imposto%'
        OR categoria_nome LIKE '%tribut%'
        OR categoria_nome LIKE '%fiscal%'
        OR nome LIKE '%imposto%'
        OR nome LIKE '%tribut%'
        OR nome LIKE '%fiscal%'
        OR nome LIKE '%icms%'
        OR nome LIKE '%iss%'
        OR nome LIKE '%pis%'
        OR nome LIKE '%cofins%' THEN 'impostos'
      WHEN codigo LIKE '6.1.5%'
        OR categoria_nome LIKE '%folha%'
        OR categoria_nome LIKE '%funcion%'
        OR categoria_nome LIKE '%salario%'
        OR categoria_nome LIKE '%salário%'
        OR categoria_nome LIKE '%encargo%'
        OR nome LIKE '%salario%'
        OR nome LIKE '%salário%'
        OR nome LIKE '%folha%'
        OR nome LIKE '%funcion%' THEN 'despesas_funcionarios'
      WHEN codigo LIKE '6.3.%'
        OR nome LIKE '%banc%'
        OR nome LIKE '%tarifa%'
        OR nome LIKE '%juros%' THEN 'despesas_bancarias'
      WHEN codigo LIKE '6.2.%' THEN 'despesas_comerciais'
      WHEN codigo LIKE '6.1.%' THEN 'despesas_administrativas'
      WHEN codigo LIKE '6.%' THEN 'despesas_administrativas'
      ELSE 'despesas_administrativas'
    END AS grupo,
    CASE
      WHEN codigo LIKE '4.%' AND (
        nome LIKE '%desconto%'
        OR nome LIKE '%abatimento%'
        OR nome LIKE '%dedu%'
      ) THEN debito - credito
      WHEN codigo LIKE '4.%' THEN credito - debito
      ELSE debito - credito
    END AS valor
  FROM base
),
classified_filtered AS (
  SELECT *
  FROM classified
  ${classifiedWhere.length ? `WHERE ${classifiedWhere.join(' AND ')}` : ''}
),
totals AS (
  SELECT
    months.mes,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'receita_bruta' THEN classified_filtered.valor ELSE 0 END), 0)::float AS receita_bruta,
    ABS(COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'descontos' THEN classified_filtered.valor ELSE 0 END), 0))::float AS descontos,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'custos' THEN classified_filtered.valor ELSE 0 END), 0)::float AS custos,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'despesas_administrativas' THEN classified_filtered.valor ELSE 0 END), 0)::float AS despesas_administrativas,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'despesas_bancarias' THEN classified_filtered.valor ELSE 0 END), 0)::float AS despesas_bancarias,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'despesas_comerciais' THEN classified_filtered.valor ELSE 0 END), 0)::float AS despesas_comerciais,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'despesas_funcionarios' THEN classified_filtered.valor ELSE 0 END), 0)::float AS despesas_funcionarios,
    COALESCE(SUM(CASE WHEN classified_filtered.grupo = 'impostos' THEN classified_filtered.valor ELSE 0 END), 0)::float AS impostos
  FROM months
  LEFT JOIN classified_filtered ON classified_filtered.mes = months.mes
  GROUP BY months.mes
),
statement_rows AS (
  SELECT 1 AS ordem, '(=) Receita Bruta de Vendas' AS descricao, mes, receita_bruta - ABS(descontos) AS valor, 'group' AS row_type, 'receita_vendas' AS group_id, NULL::text AS parent_group_id FROM totals
  UNION ALL
  SELECT 2, '(+) Receita Bruta de Vendas e Serviços', mes, receita_bruta, 'child', NULL::text, 'receita_vendas' FROM totals
  UNION ALL
  SELECT 3, '(-) Descontos e Abatimentos', mes, -ABS(descontos), 'child', NULL::text, 'receita_vendas' FROM totals
  UNION ALL
  SELECT 4, '(=) Lucro Bruto', mes, receita_bruta - ABS(descontos) - ABS(custos), 'group', 'lucro_bruto', NULL::text FROM totals
  UNION ALL
  SELECT 5, '(-) Custos Mercadorias Vendidas', mes, -ABS(custos), 'child', NULL::text, 'lucro_bruto' FROM totals
  UNION ALL
  SELECT 6, '(=) Resultado Operacional', mes, receita_bruta - ABS(descontos) - ABS(custos) - ABS(despesas_administrativas) - ABS(despesas_bancarias) - ABS(despesas_comerciais) - ABS(despesas_funcionarios) - ABS(impostos), 'group', 'resultado_operacional', NULL::text FROM totals
  UNION ALL
  SELECT 7, '(-) DESPESAS ADMINISTRATIVAS', mes, -ABS(despesas_administrativas), 'child', NULL::text, 'resultado_operacional' FROM totals
  UNION ALL
  SELECT 8, '(-) DESPESAS BANCÁRIAS', mes, -ABS(despesas_bancarias), 'child', NULL::text, 'resultado_operacional' FROM totals
  UNION ALL
  SELECT 9, '(-) DESPESAS COMERCIAIS', mes, -ABS(despesas_comerciais), 'child', NULL::text, 'resultado_operacional' FROM totals
  UNION ALL
  SELECT 10, '(-) DESPESAS FUNCIONÁRIOS', mes, -ABS(despesas_funcionarios), 'child', NULL::text, 'resultado_operacional' FROM totals
  UNION ALL
  SELECT 11, '(-) IMPOSTOS', mes, -ABS(impostos), 'child', NULL::text, 'resultado_operacional' FROM totals
)
SELECT
  descricao,
  ${monthValueColumns},
  row_type AS "_rowType",
  group_id AS "_groupId",
  parent_group_id AS "_parentGroupId"
FROM statement_rows
GROUP BY ordem, descricao, row_type, group_id, parent_group_id
ORDER BY ordem
  `.trim()

  return {
    sql,
    params,
    title: 'DRE',
    chart: null,
    columns: [
      { key: 'descricao', label: 'DRE' },
      ...monthColumns.map((column) => ({ key: column.key, label: column.label, format: 'currency_plain' })),
    ],
    variant: 'financial_statement',
  }
}

function buildFinancialStatementCashFlowQuery(paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const period = resolveFinancialPeriod('cash_flow', paramsIn)
  const sql = `
WITH months AS (
  SELECT generate_series(date_trunc('month', $2::date), date_trunc('month', $3::date), interval '1 month')::date AS mes
),
receitas AS (
  SELECT
    date_trunc('month', cr.data_vencimento::date)::date AS mes,
    COALESCE(SUM(cr.valor_liquido), 0)::float AS entradas
  FROM financeiro.contas_receber cr
  WHERE cr.tenant_id = $1::int
    AND cr.data_vencimento::date BETWEEN $2::date AND $3::date
    AND LOWER(COALESCE(cr.status, '')) <> 'cancelado'
  GROUP BY 1
),
saidas AS (
  SELECT
    date_trunc('month', cp.data_vencimento::date)::date AS mes,
    COALESCE(SUM(cp.valor_liquido), 0)::float AS saidas
  FROM financeiro.contas_pagar cp
  WHERE cp.tenant_id = $1::int
    AND cp.data_vencimento::date BETWEEN $2::date AND $3::date
    AND LOWER(COALESCE(cp.status, '')) <> 'cancelado'
  GROUP BY 1
)
SELECT
  TO_CHAR(m.mes, 'YYYY-MM') AS periodo,
  COALESCE(r.entradas, 0)::float AS entradas_previstas,
  COALESCE(s.saidas, 0)::float AS saidas_previstas,
  (COALESCE(r.entradas, 0) - COALESCE(s.saidas, 0))::float AS fluxo_liquido,
  SUM(COALESCE(r.entradas, 0) - COALESCE(s.saidas, 0)) OVER (ORDER BY m.mes)::float AS saldo_acumulado
FROM months m
LEFT JOIN receitas r ON r.mes = m.mes
LEFT JOIN saidas s ON s.mes = m.mes
ORDER BY m.mes ASC
  `.trim()

  return {
    sql,
    params: [tenantId, period.de, period.ate],
    title: 'Fluxo de Caixa',
    chart: null,
    columns: [
      { key: 'periodo', label: 'Período' },
      { key: 'entradas_previstas', label: 'Entradas Previstas', format: 'currency_plain' },
      { key: 'saidas_previstas', label: 'Saídas Previstas', format: 'currency_plain' },
      { key: 'fluxo_liquido', label: 'Fluxo Líquido', format: 'currency_plain' },
      { key: 'saldo_acumulado', label: 'Saldo Acumulado', format: 'currency_plain' },
    ],
    variant: 'financial_statement',
  }
}

export function buildFinancialStatementQuery(kind: FinancialStatementKind, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  return kind === 'dre'
    ? buildFinancialStatementDreQuery(paramsIn, tenantId)
    : buildFinancialStatementCashFlowQuery(paramsIn, tenantId)
}

function buildCommonPedidosFilters(paramsIn: JsonRecord, tenantId: number, alias: string) {
  const params: unknown[] = [tenantId]
  const where: string[] = [`${alias}.tenant_id = $1::int`]

  const de = normalizeDate(paramsIn.de)
  if (de) {
    params.push(de)
    where.push(`${alias}.data_pedido::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate) {
    params.push(ate)
    where.push(`${alias}.data_pedido::date <= $${params.length}::date`)
  }

  for (const field of ['plataforma', 'canal_conta_id', 'loja_id', 'status', 'status_pagamento', 'status_fulfillment']) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      const cast = field.endsWith('_id') ? '::text' : ''
      where.push(`${alias}.${field}${cast} = $${params.length}::text`)
    }
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildEcommerceQuery(action: EcommerceAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)

  if (action === 'kpis_resumo') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    return {
      sql: `
SELECT
  COUNT(DISTINCT p.id)::int AS pedidos,
  COALESCE(SUM(p.valor_total), 0)::float AS receita_bruta,
  CASE WHEN COUNT(DISTINCT p.id) = 0 THEN 0::float ELSE (COALESCE(SUM(p.valor_total), 0)::float / COUNT(DISTINCT p.id)::float) END AS ticket_medio,
  COUNT(DISTINCT p.cliente_id)::int AS clientes_unicos
FROM ecommerce.pedidos p
${base.whereClause}
      `.trim(),
      params: base.params,
      title: 'Ecommerce - KPIs Resumo',
      chart: null,
    }
  }

  if (action === 'vendas_por_canal') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(p.canal_conta_id::text, '-') AS key, COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text), '-') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Vendas por Canal',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Canal', yLabel: 'Vendas' },
    }
  }

  if (action === 'pedidos_por_status') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(p.status, '-') AS key, COALESCE(p.status, '-') AS label, COUNT(DISTINCT p.id)::int AS value
FROM ecommerce.pedidos p
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Pedidos por Status',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Status', yLabel: 'Pedidos' },
    }
  }

  if (action === 'faturamento_por_mes') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key, TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Faturamento por Mes',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Mes', yLabel: 'Faturamento' },
    }
  }

  if (action === 'top_produtos_receita') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(pi.produto_id::text, '-') AS key, COALESCE(NULLIF(pi.titulo_item, ''), NULLIF(pi.sku, ''), '-') AS label, COALESCE(SUM(pi.valor_total), 0)::float AS value
FROM ecommerce.pedido_itens pi
JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Top Produtos por Receita',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Produto', yLabel: 'Receita' },
    }
  }

  const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
  const params = [...base.params, limit]
  return {
    sql: `
SELECT COALESCE(e.transportadora, '-') AS key, COALESCE(e.transportadora, '-') AS label, COALESCE(SUM(e.frete_custo), 0)::float AS value
FROM ecommerce.envios e
JOIN ecommerce.pedidos p ON p.id = e.pedido_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
    `.trim(),
    params,
    title: 'Ecommerce - Frete por Transportadora',
    chart: { xField: 'label', valueField: 'value', xLabel: 'Transportadora', yLabel: 'Frete' },
  }
}

function normalizeMarketingLevel(value: unknown) {
  const level = toText(value).toLowerCase()
  if (level === 'conta' || level === 'account') return 'conta'
  if (level === 'campanha' || level === 'campaign') return 'campanha'
  if (level === 'grupo' || level === 'ad_group' || level === 'adset' || level === 'conjunto') return 'grupo'
  if (level === 'anuncio' || level === 'anúncio' || level === 'ad') return 'anuncio'
  return ''
}

function buildMarketingFilters(paramsIn: JsonRecord, tenantId: number, alias: string, defaultLevel?: string) {
  const params: unknown[] = [tenantId]
  const where: string[] = [`${alias}.tenant_id = $1::int`]

  const de = normalizeDate(paramsIn.de)
  if (de) {
    params.push(de)
    where.push(`${alias}.data_ref::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate) {
    params.push(ate)
    where.push(`${alias}.data_ref::date <= $${params.length}::date`)
  }

  const requestedLevel = normalizeMarketingLevel(paramsIn.nivel)
  const level = requestedLevel || defaultLevel || ''
  if (level) {
    params.push(level)
    where.push(`${alias}.nivel = $${params.length}::text`)
  }

  for (const field of ['plataforma', 'conta_id', 'campanha_id', 'grupo_id', 'anuncio_id']) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      const cast = field.endsWith('_id') ? '::text' : ''
      where.push(`${alias}.${field}${cast} = $${params.length}::text`)
    }
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildMarketingQuery(action: MarketingAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)
  const defaultLevel = action === 'top_anuncios' ? 'anuncio' : 'campanha'
  const base = buildMarketingFilters(paramsIn, tenantId, 'dd', defaultLevel)

  if (action === 'kpis_resumo') {
    return {
      sql: `
SELECT
  COALESCE(SUM(dd.gasto), 0)::float AS gasto,
  COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida,
  CASE WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float) END AS roas,
  COALESCE(SUM(dd.cliques), 0)::int AS cliques,
  COALESCE(SUM(dd.impressoes), 0)::int AS impressoes,
  COALESCE(SUM(dd.conversoes), 0)::int AS conversoes
FROM trafegopago.desempenho_diario dd
${base.whereClause}
      `.trim(),
      params: base.params,
      title: 'Marketing - KPIs Resumo',
      chart: null,
    }
  }

  if (action === 'desempenho_diario') {
    const params = [...base.params, limit]
    return {
      sql: `
SELECT TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS key, TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS label, COALESCE(SUM(dd.gasto), 0)::float AS value, COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - Desempenho Diario',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Dia', yLabel: 'Gasto' },
    }
  }

  const grouping = action === 'gasto_por_conta'
    ? {
      column: 'conta_id',
      label: "COALESCE(NULLIF(cm.nome_conta, ''), CONCAT('Conta #', dd.conta_id::text), '-')",
      join: 'LEFT JOIN trafegopago.contas_midia cm ON cm.id = dd.conta_id AND cm.tenant_id = dd.tenant_id',
      xLabel: 'Conta',
    }
    : action === 'top_anuncios'
      ? {
        column: 'anuncio_id',
        label: "COALESCE(NULLIF(a.nome, ''), CONCAT('Anuncio #', dd.anuncio_id::text), '-')",
        join: 'LEFT JOIN trafegopago.anuncios a ON a.id = dd.anuncio_id AND a.tenant_id = dd.tenant_id',
        xLabel: 'Anuncio',
      }
      : {
        column: 'campanha_id',
        label: "COALESCE(NULLIF(c.nome, ''), CONCAT('Campanha #', dd.campanha_id::text), '-')",
        join: 'LEFT JOIN trafegopago.campanhas c ON c.id = dd.campanha_id AND c.tenant_id = dd.tenant_id',
        xLabel: 'Campanha',
      }
  const metric = action === 'roas_por_campanha'
    ? "CASE WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float) END"
    : 'COALESCE(SUM(dd.gasto), 0)::float'
  const params = [...base.params, limit]
  return {
    sql: `
SELECT COALESCE(dd.${grouping.column}::text, '-') AS key, ${grouping.label} AS label, ${metric} AS value
FROM trafegopago.desempenho_diario dd
${grouping.join}
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
    `.trim(),
    params,
    title: action === 'roas_por_campanha'
      ? 'Marketing - ROAS por Campanha'
      : action === 'gasto_por_conta'
        ? 'Marketing - Gasto por Conta'
        : action === 'top_anuncios'
          ? 'Marketing - Top Anuncios por Gasto'
          : 'Marketing - Gasto por Campanha',
    chart: { xField: 'label', valueField: 'value', xLabel: grouping.xLabel, yLabel: action === 'roas_por_campanha' ? 'ROAS' : 'Gasto' },
  }
}

async function executeBuiltQuery(tool: 'ecommerce' | 'marketing', action: string, built: BuiltQuery) {
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = inferColumns(rows)
  const structuredContent = {
    success: true,
    tool,
    action,
    title: built.title,
    rows,
    columns,
    count: rows.length,
    chart: built.chart,
    sql_query: built.sql,
    sql_params: built.params,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

function getCatalogResources(domain: DataCatalogDomain | null) {
  return DATA_CATALOG_RESOURCES.filter((resource) => !domain || resource.domain === domain)
}

function getCatalogResource(resourceName: string, domain: DataCatalogDomain | null) {
  const normalized = toText(resourceName)
  const resource = DATA_CATALOG_RESOURCES.find((item) => {
    return item.resource === normalized && (!domain || item.domain === domain)
  })
  if (!resource) {
    throw new Error(
      `resource invalido para data_catalog: ${normalized || '(vazio)'}. Use action=recursos para listar recursos disponiveis.`,
    )
  }
  return resource
}

function buildCatalogWhere(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  const params: unknown[] = [tenantId]
  const where: string[] = ['r.tenant_id = $1::int']
  const de = normalizeDate(input.de)
  const ate = normalizeDate(input.ate)

  if (config.dateColumn && de) {
    params.push(de)
    where.push(`r.${config.dateColumn}::date >= $${params.length}::date`)
  }
  if (config.dateColumn && ate) {
    params.push(ate)
    where.push(`r.${config.dateColumn}::date <= $${params.length}::date`)
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

async function getCatalogResourceSummary(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  try {
    const base = buildCatalogWhere(config, tenantId, input)
    const minDate = config.dateColumn ? `MIN(r.${config.dateColumn}::date)::text` : 'NULL::text'
    const maxDate = config.dateColumn ? `MAX(r.${config.dateColumn}::date)::text` : 'NULL::text'
    const value = config.valueColumn ? `COALESCE(SUM(r.${config.valueColumn}), 0)::float` : 'NULL::float'
    const rows = await runQuery<{ total: number; min_date: string | null; max_date: string | null; valor_total: number | null }>(
      `
SELECT COUNT(*)::int AS total, ${minDate} AS min_date, ${maxDate} AS max_date, ${value} AS valor_total
FROM ${config.table} r
${base.whereClause}
      `.trim(),
      base.params,
    )
    const row = rows[0] || { total: 0, min_date: null, max_date: null, valor_total: null }
    return {
      domain: config.domain,
      resource: config.resource,
      label: config.label,
      table: config.table,
      status: row.total > 0 ? 'connected' : 'empty',
      total_records: row.total,
      min_date: row.min_date,
      max_date: row.max_date,
      value_total: row.valor_total,
    }
  } catch (error) {
    return {
      domain: config.domain,
      resource: config.resource,
      label: config.label,
      table: config.table,
      status: 'unavailable',
      total_records: 0,
      min_date: null,
      max_date: null,
      value_total: null,
      error: (error as Error)?.message || String(error),
    }
  }
}

async function listCatalogFields(config: DataCatalogResourceConfig) {
  const table = splitTableName(config.table)
  return runQuery<Record<string, unknown>>(
    `
SELECT
  column_name AS campo,
  data_type AS tipo,
  is_nullable AS permite_nulo,
  ordinal_position::int AS ordem
FROM information_schema.columns
WHERE table_schema = $1 AND table_name = $2
ORDER BY ordinal_position ASC
    `.trim(),
    [table.schema, table.name],
  )
}

async function listCatalogRelationships(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  const relationships = config.relationships || []
  const rows: Record<string, unknown>[] = []

  for (const relationship of relationships) {
    try {
      const base = buildCatalogWhere(config, tenantId, input)
      const result = await runQuery<{ total: number; preenchidos: number; validos: number }>(
        `
SELECT
  COUNT(*)::int AS total,
  COUNT(r.${relationship.sourceColumn})::int AS preenchidos,
  COUNT(t.${relationship.targetColumn})::int AS validos
FROM ${config.table} r
LEFT JOIN ${relationship.targetTable} t
  ON t.${relationship.targetColumn} = r.${relationship.sourceColumn}
 AND t.tenant_id = r.tenant_id
${base.whereClause}
        `.trim(),
        base.params,
      )
      const row = result[0] || { total: 0, preenchidos: 0, validos: 0 }
      rows.push({
        relacionamento: relationship.label,
        campo_origem: relationship.sourceColumn,
        tabela_destino: relationship.targetTable,
        registros: row.total,
        preenchidos: row.preenchidos,
        validos: row.validos,
        pendentes: Math.max(row.preenchidos - row.validos, 0),
      })
    } catch (error) {
      rows.push({
        relacionamento: relationship.label,
        campo_origem: relationship.sourceColumn,
        tabela_destino: relationship.targetTable,
        registros: 0,
        preenchidos: 0,
        validos: 0,
        pendentes: 0,
        erro: (error as Error)?.message || String(error),
      })
    }
  }

  return rows
}

async function getCatalogStatusDistribution(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  try {
    const base = buildCatalogWhere(config, tenantId, input)
    return runQuery<Record<string, unknown>>(
      `
SELECT COALESCE(r.status::text, '-') AS status, COUNT(*)::int AS registros
FROM ${config.table} r
${base.whereClause}
GROUP BY 1
ORDER BY 2 DESC
      `.trim(),
      base.params,
    )
  } catch {
    return []
  }
}

async function getCatalogQuality(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  const requiredFields = config.requiredFields || []
  const relationships = await listCatalogRelationships(config, tenantId, input)
  const statusDistribution = await getCatalogStatusDistribution(config, tenantId, input)
  const base = buildCatalogWhere(config, tenantId, input)
  const missingSelect = requiredFields.map((field) => {
    return `SUM(CASE WHEN r.${field} IS NULL OR r.${field}::text = '' THEN 1 ELSE 0 END)::int AS missing_${field}`
  })
  const rows = await runQuery<Record<string, unknown>>(
    `
SELECT COUNT(*)::int AS total${missingSelect.length ? `,\n  ${missingSelect.join(',\n  ')}` : ''}
FROM ${config.table} r
${base.whereClause}
    `.trim(),
    base.params,
  )
  const summary = rows[0] || { total: 0 }
  const total = Number(summary.total || 0)
  const missingFields = requiredFields.map((field) => {
    const missing = Number(summary[`missing_${field}`] || 0)
    return {
      campo: field,
      ausentes: missing,
      preenchimento: total > 0 ? Math.round(((total - missing) / total) * 100) : 100,
    }
  })
  const fieldCompleteness = missingFields.length && total > 0
    ? missingFields.reduce((acc, field) => acc + Number(field.preenchimento || 0), 0) / missingFields.length
    : 100
  const relationshipCompletenessValues = relationships
    .filter((relationship) => Number(relationship.preenchidos || 0) > 0)
    .map((relationship) => (Number(relationship.validos || 0) / Number(relationship.preenchidos || 1)) * 100)
  const relationshipCompleteness = relationshipCompletenessValues.length
    ? relationshipCompletenessValues.reduce((acc, value) => acc + value, 0) / relationshipCompletenessValues.length
    : 100
  const score = Math.round((fieldCompleteness * 0.7) + (relationshipCompleteness * 0.3))

  return {
    resource: config.resource,
    label: config.label,
    table: config.table,
    total_records: total,
    score,
    missing_fields: missingFields,
    relationships,
    status_distribution: statusDistribution,
  }
}

async function getCatalogCoverage(config: DataCatalogResourceConfig, tenantId: number, input: JsonRecord) {
  if (!config.dateColumn) return []
  const base = buildCatalogWhere(config, tenantId, input)
  const value = config.valueColumn ? `COALESCE(SUM(r.${config.valueColumn}), 0)::float` : 'NULL::float'
  return runQuery<Record<string, unknown>>(
    `
SELECT
  TO_CHAR(DATE_TRUNC('month', r.${config.dateColumn}::date), 'YYYY-MM') AS mes,
  COUNT(*)::int AS registros,
  ${value} AS valor_total
FROM ${config.table} r
${base.whereClause}
GROUP BY 1
ORDER BY 1 ASC
    `.trim(),
    base.params,
  )
}

function buildCatalogIssuesAndRecommendations(input: {
  quality?: Record<string, unknown> | null
  coverage?: Record<string, unknown>[]
  resources?: Record<string, unknown>[]
}) {
  const issues: string[] = []
  const recommendations: string[] = []
  const quality = input.quality || {}
  const score = Number(quality.score || 0)

  if (quality.score !== undefined && score < 90) {
    issues.push(`Qualidade abaixo do ideal (${score}/100).`)
    recommendations.push('Priorize campos obrigatorios ausentes e relacionamentos sem correspondencia antes de criar dashboards executivos.')
  }

  const missingFields = Array.isArray(quality.missing_fields) ? quality.missing_fields as Record<string, unknown>[] : []
  for (const field of missingFields.filter((item) => Number(item.ausentes || 0) > 0).slice(0, 4)) {
    issues.push(`${field.campo}: ${field.ausentes} registros sem preenchimento.`)
  }

  const relationships = Array.isArray(quality.relationships) ? quality.relationships as Record<string, unknown>[] : []
  for (const relationship of relationships.filter((item) => Number(item.pendentes || 0) > 0).slice(0, 4)) {
    issues.push(`${relationship.relacionamento}: ${relationship.pendentes} referencias sem join valido.`)
  }

  const coverage = input.coverage || []
  if (coverage.length === 0 && quality.resource) {
    issues.push('Sem cobertura temporal para o recurso no periodo informado.')
  } else if (coverage.length > 0 && coverage.length < 3) {
    recommendations.push('Aumente a janela de dados para pelo menos 3 meses quando o objetivo for detectar tendencia.')
  }

  const emptyResources = (input.resources || []).filter((resource) => resource.status === 'empty')
  if (emptyResources.length > 0) {
    recommendations.push(`Revise conectores sem dados: ${emptyResources.slice(0, 4).map((resource) => resource.label).join(', ')}.`)
  }

  if (!issues.length) issues.push('Nenhum problema critico detectado no recorte consultado.')
  if (!recommendations.length) recommendations.push('O recurso esta pronto para analises, dashboards e relatorios no recorte consultado.')

  return { issues, recommendations }
}

function makeDataCatalogResult(input: {
  action: DataCatalogAction
  domain: DataCatalogDomain | null
  resource: string | null
  title: string
  subtitle: string
  sources?: Record<string, unknown>[]
  resources?: Record<string, unknown>[]
  fields?: Record<string, unknown>[]
  relationships?: Record<string, unknown>[]
  quality?: Record<string, unknown> | null
  coverage?: Record<string, unknown>[]
  issues?: string[]
  recommendations?: string[]
  rows?: Record<string, unknown>[]
}) {
  const rows = input.rows || input.resources || input.sources || input.fields || input.relationships || input.coverage || []
  const structuredContent = {
    success: true,
    tool: MCP_APP_DOMAIN_TOOL_NAMES.dataCatalog,
    view: 'data_catalog',
    action: input.action,
    domain: input.domain || undefined,
    resource: input.resource || undefined,
    title: input.title,
    subtitle: input.subtitle,
    sources: input.sources || [],
    resources: input.resources || [],
    fields: input.fields || [],
    relationships: input.relationships || [],
    quality: input.quality || null,
    coverage: input.coverage || [],
    issues: input.issues || [],
    recommendations: input.recommendations || [],
    rows,
    columns: inferColumns(rows),
    count: rows.length,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

async function callDataCatalog(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const action = normalizeDataCatalogAction(input.action)
  const domain = normalizeDataCatalogDomain(input.domain)
  const tenantId = getTenantId(context)
  const configs = getCatalogResources(domain)

  if (action === 'fontes') {
    const summaries = await Promise.all(configs.map((config) => getCatalogResourceSummary(config, tenantId, input)))
    const domains = ['erp', 'crm', 'marketing', 'ecommerce'] as const
    const sources = domains
      .filter((sourceDomain) => !domain || sourceDomain === domain)
      .map((sourceDomain) => {
        const sourceResources = summaries.filter((summary) => summary.domain === sourceDomain)
        const totalRecords = sourceResources.reduce((acc, resource) => acc + Number(resource.total_records || 0), 0)
        const maxDate = sourceResources
          .map((resource) => toText(resource.max_date))
          .filter(Boolean)
          .sort()
          .pop() || null
        return {
          domain: sourceDomain,
          label: sourceDomain === 'erp' ? 'ERP' : sourceDomain === 'crm' ? 'CRM' : sourceDomain === 'marketing' ? 'Marketing' : 'Ecommerce',
          status: totalRecords > 0 ? 'connected' : 'empty',
          resources: sourceResources.length,
          total_records: totalRecords,
          last_record_at: maxDate,
        }
      })
    const helper = buildCatalogIssuesAndRecommendations({ resources: summaries })
    return makeDataCatalogResult({
      action,
      domain,
      resource: null,
      title: 'Catalogo de Dados',
      subtitle: `${sources.length} fontes avaliadas`,
      sources,
      resources: summaries,
      issues: helper.issues,
      recommendations: helper.recommendations,
      rows: sources,
    })
  }

  if (action === 'recursos') {
    const summaries = await Promise.all(configs.map((config) => getCatalogResourceSummary(config, tenantId, input)))
    const helper = buildCatalogIssuesAndRecommendations({ resources: summaries })
    return makeDataCatalogResult({
      action,
      domain,
      resource: null,
      title: domain ? `Recursos - ${domain.toUpperCase()}` : 'Recursos do Catalogo',
      subtitle: `${summaries.length} recursos mapeados`,
      resources: summaries,
      issues: helper.issues,
      recommendations: helper.recommendations,
      rows: summaries,
    })
  }

  const resource = getCatalogResource(toText(input.resource), domain)

  if (action === 'campos') {
    const fields = await listCatalogFields(resource)
    return makeDataCatalogResult({
      action,
      domain: resource.domain,
      resource: resource.resource,
      title: `Campos - ${resource.label}`,
      subtitle: `${fields.length} campos em ${resource.table}`,
      fields,
      rows: fields,
      issues: fields.length ? [] : ['Nenhum campo encontrado no information_schema.'],
      recommendations: ['Use estes nomes de campo para pedir filtros, joins e metricas sem depender de SQL livre.'],
    })
  }

  if (action === 'relacionamentos') {
    const relationships = await listCatalogRelationships(resource, tenantId, input)
    const helper = buildCatalogIssuesAndRecommendations({
      quality: { resource: resource.resource, relationships },
      coverage: [{}],
    })
    return makeDataCatalogResult({
      action,
      domain: resource.domain,
      resource: resource.resource,
      title: `Relacionamentos - ${resource.label}`,
      subtitle: `${relationships.length} joins avaliados`,
      relationships,
      rows: relationships,
      issues: helper.issues,
      recommendations: helper.recommendations,
    })
  }

  if (action === 'cobertura') {
    const coverage = await getCatalogCoverage(resource, tenantId, input)
    const helper = buildCatalogIssuesAndRecommendations({
      quality: { resource: resource.resource },
      coverage,
    })
    return makeDataCatalogResult({
      action,
      domain: resource.domain,
      resource: resource.resource,
      title: `Cobertura - ${resource.label}`,
      subtitle: coverage.length ? `${coverage.length} meses com dados` : 'Sem coluna temporal ou sem dados no periodo',
      coverage,
      rows: coverage,
      issues: helper.issues,
      recommendations: helper.recommendations,
    })
  }

  const quality = await getCatalogQuality(resource, tenantId, input)
  const coverage = await getCatalogCoverage(resource, tenantId, input)
  const helper = buildCatalogIssuesAndRecommendations({ quality, coverage })
  const ready = Number(quality.score || 0) >= 90 && coverage.length >= 3

  return makeDataCatalogResult({
    action,
    domain: resource.domain,
    resource: resource.resource,
    title: action === 'pronto_para_dashboard' ? `Prontidao - ${resource.label}` : `Qualidade - ${resource.label}`,
    subtitle: action === 'pronto_para_dashboard'
      ? ready
        ? `Pronto para dashboard e relatorio (${quality.score}/100)`
        : `Requer revisao antes de dashboard executivo (${quality.score}/100)`
      : `Score de qualidade: ${quality.score}/100`,
    quality: {
      ...quality,
      ready_for_dashboard: ready,
    },
    coverage,
    relationships: Array.isArray(quality.relationships) ? quality.relationships as Record<string, unknown>[] : [],
    issues: helper.issues,
    recommendations: helper.recommendations,
    rows: [
      {
        recurso: resource.resource,
        score: quality.score,
        pronto_para_dashboard: ready,
        registros: quality.total_records,
        meses_com_dados: coverage.length,
      },
    ],
  })
}

function getCrudTable(resource: string) {
  const table = CRUD_RESOURCE_TABLES[resource as keyof typeof CRUD_RESOURCE_TABLES]
  if (!table) throw new Error(`resource invalido para crud: ${resource}`)
  return table
}

function assertCrudResourceForTool(resource: string, toolName: string, allowedResources: string[]) {
  if (!allowedResources.includes(resource)) {
    throw new Error(`resource invalido para ${toolName}: ${resource}`)
  }
}

type FinancialDateFilter =
  | { kind: 'column'; column: 'data_vencimento' | 'data_documento' | 'data_lancamento' }
  | { kind: 'payment' }

function normalizeFinancialDateFilter(config: ErpAcoesConfig, value: unknown): FinancialDateFilter {
  const raw = toText(value).toLowerCase()
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  if (!normalized || normalized === 'vencimento' || normalized === 'data_vencimento') {
    return { kind: 'column', column: 'data_vencimento' }
  }
  if (
    normalized === 'documento' ||
    normalized === 'emissao' ||
    normalized === 'data_documento' ||
    normalized === 'data_emissao'
  ) {
    return { kind: 'column', column: 'data_documento' }
  }
  if (normalized === 'lancamento' || normalized === 'data_lancamento') {
    return { kind: 'column', column: 'data_lancamento' }
  }

  const paymentTerms =
    config.resource === 'contas-a-pagar'
      ? ['pagamento', 'data_pagamento', 'baixa', 'liquidacao']
      : ['recebimento', 'data_recebimento', 'pagamento', 'baixa', 'liquidacao']
  if (paymentTerms.includes(normalized)) return { kind: 'payment' }

  throw new Error(
    `params.data_campo invalido para ${config.resource}. Use vencimento, documento, lancamento${
      config.resource === 'contas-a-pagar' ? ' ou pagamento' : ' ou recebimento'
    }.`,
  )
}

function toTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean)
  }
  return toText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function pushTextEqualsFilter(where: string[], params: unknown[], alias: string, column: string, value: unknown) {
  const text = toText(value)
  if (!text) return
  params.push(text)
  where.push(`LOWER(COALESCE(${alias}.${column}, '')) = LOWER($${params.length}::text)`)
}

function pushIdFilter(where: string[], params: unknown[], alias: string, input: JsonRecord, inputKey: string, column: string) {
  const value = toText(input[inputKey])
  if (!value) return
  params.push(value)
  where.push(`${alias}.${column}::text = $${params.length}::text`)
}

function pushPaymentDateRangeFilter(
  where: string[],
  params: unknown[],
  alias: string,
  config: ErpAcoesConfig,
  de: string | null,
  ate: string | null,
) {
  const dateColumn = config.resource === 'contas-a-pagar' ? 'pe.data_pagamento' : 'pr.data_recebimento'
  const paymentTable = config.resource === 'contas-a-pagar' ? 'financeiro.pagamentos_efetuados' : 'financeiro.pagamentos_recebidos'
  const lineTable =
    config.resource === 'contas-a-pagar' ? 'financeiro.pagamentos_efetuados_linhas' : 'financeiro.pagamentos_recebidos_linhas'
  const lineAlias = config.resource === 'contas-a-pagar' ? 'pel' : 'prl'
  const paymentAlias = config.resource === 'contas-a-pagar' ? 'pe' : 'pr'
  const accountColumn = config.resource === 'contas-a-pagar' ? 'conta_pagar_id' : 'conta_receber_id'
  const dateFilters: string[] = []

  if (de) {
    params.push(de)
    dateFilters.push(`${dateColumn}::date >= $${params.length}::date`)
  }
  if (ate) {
    params.push(ate)
    dateFilters.push(`${dateColumn}::date <= $${params.length}::date`)
  }

  where.push(`EXISTS (
    SELECT 1
    FROM ${lineTable} ${lineAlias}
    JOIN ${paymentTable} ${paymentAlias} ON ${paymentAlias}.id = ${lineAlias}.pagamento_id
    WHERE ${lineAlias}.${accountColumn} = ${alias}.id
      AND ${paymentAlias}.tenant_id = ${alias}.tenant_id
      ${dateFilters.map((filter) => `AND ${filter}`).join('\n      ')}
  )`)
}

function buildFinancialAccountsWhere(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  alias: string,
  searchExpression: string,
  config: ErpAcoesConfig,
) {
  const limit = normalizeLimit(paramsIn.limit, 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = [tenantId]
  const where = [`${alias}.tenant_id = $1::int`]
  const dateFilter = normalizeFinancialDateFilter(config, paramsIn.data_campo)

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`${alias}.id::text = $${params.length}::text`)
  }

  const de = normalizeDate(paramsIn.de)
  const ate = normalizeDate(paramsIn.ate)
  if (dateFilter.kind === 'payment') {
    if (de || ate) pushPaymentDateRangeFilter(where, params, alias, config, de, ate)
  } else {
    if (de) {
      params.push(de)
      where.push(`${alias}.${dateFilter.column}::date >= $${params.length}::date`)
    }
    if (ate) {
      params.push(ate)
      where.push(`${alias}.${dateFilter.column}::date <= $${params.length}::date`)
    }
  }

  const status = toText(paramsIn.status)
  if (status) {
    params.push(normalizeErpAcoesStatus(config, status))
    where.push(`LOWER(COALESCE(${alias}.status, '')) = LOWER($${params.length}::text)`)
  }

  const statusIn = toTextList(paramsIn.status_in)
  if (statusIn.length) {
    const statuses = statusIn.map((item) => normalizeErpAcoesStatus(config, item))
    statuses.forEach((item) => params.push(item))
    const start = params.length - statuses.length + 1
    const placeholders = statuses.map((_, index) => `$${start + index}::text`).join(', ')
    where.push(`LOWER(COALESCE(${alias}.status, '')) IN (${placeholders})`)
  }

  const vencidas = toOptionalBoolean(paramsIn.vencidas)
  if (vencidas === true) {
    params.push(config.paidStatus, 'cancelado')
    where.push(
      `${alias}.data_vencimento::date < CURRENT_DATE AND LOWER(COALESCE(${alias}.status, '')) NOT IN (LOWER($${params.length - 1}::text), LOWER($${params.length}::text))`,
    )
  } else if (vencidas === false) {
    where.push(`${alias}.data_vencimento::date >= CURRENT_DATE`)
  }

  const aVencerDias = toText(paramsIn.a_vencer_dias)
  if (aVencerDias) {
    const parsed = Number.parseInt(aVencerDias, 10)
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error('params.a_vencer_dias invalido')
    params.push(parsed, config.paidStatus, 'cancelado')
    where.push(
      `${alias}.data_vencimento::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($${params.length - 2}::int * INTERVAL '1 day'))::date AND LOWER(COALESCE(${alias}.status, '')) NOT IN (LOWER($${params.length - 1}::text), LOWER($${params.length}::text))`,
    )
  }

  pushIdFilter(where, params, alias, paramsIn, config.entityPayloadKey, config.entityIdColumn)
  pushIdFilter(where, params, alias, paramsIn, 'categoria_id', config.categoryColumn)
  pushIdFilter(where, params, alias, paramsIn, config.categoryColumn, config.categoryColumn)
  pushIdFilter(where, params, alias, paramsIn, 'conta_financeira_id', 'conta_financeira_id')
  pushIdFilter(where, params, alias, paramsIn, config.centerColumn, config.centerColumn)
  if (config.resource === 'contas-a-pagar') {
    pushIdFilter(where, params, alias, paramsIn, 'departamento_id', 'departamento_id')
    pushIdFilter(where, params, alias, paramsIn, 'filial_id', 'filial_id')
    pushIdFilter(where, params, alias, paramsIn, 'unidade_negocio_id', 'unidade_negocio_id')
    pushIdFilter(where, params, alias, paramsIn, 'projeto_id', 'projeto_id')
  } else {
    pushIdFilter(where, params, alias, paramsIn, 'filial_id', 'filial_id')
    pushIdFilter(where, params, alias, paramsIn, 'unidade_negocio_id', 'unidade_negocio_id')
  }

  pushTextEqualsFilter(where, params, alias, 'tipo_documento', paramsIn.tipo_documento)
  pushTextEqualsFilter(where, params, alias, 'numero_documento', paramsIn.numero_documento)

  const valorMin = toText(paramsIn.valor_min)
  if (valorMin) {
    const parsed = Number(valorMin)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_min invalido')
    params.push(parsed)
    where.push(`${alias}.valor_liquido >= $${params.length}::numeric`)
  }

  const valorMax = toText(paramsIn.valor_max)
  if (valorMax) {
    const parsed = Number(valorMax)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_max invalido')
    params.push(parsed)
    where.push(`${alias}.valor_liquido <= $${params.length}::numeric`)
  }

  const q = toText(paramsIn.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`(${alias}.numero_documento ILIKE $${params.length}::text OR ${searchExpression} ILIKE $${params.length}::text OR ${alias}.status ILIKE $${params.length}::text)`)
  }

  params.push(limit, offset)
  return {
    params,
    whereClause: `WHERE ${where.join(' AND ')}`,
    limitParam: params.length - 1,
    offsetParam: params.length,
  }
}

function buildFinancialAccountsPayableQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const fornecedorExpr = "COALESCE(NULLIF(f.nome_fantasia, ''), NULLIF(cp.nome_fornecedor_snapshot, ''), CONCAT('Fornecedor #', cp.fornecedor_id::text), '-')"
  const base = buildFinancialAccountsWhere(action, paramsIn, tenantId, 'cp', fornecedorExpr, ERP_ACOES_CONFIG['contas-a-pagar'])

  return {
    sql: `
SELECT
  cp.id,
  cp.numero_documento,
  COALESCE(NULLIF(c.numero_oc, ''), cp.compra_id::text, '-') AS compra,
  ${fornecedorExpr} AS fornecedor,
  cp.data_documento::date AS data_documento,
  cp.data_vencimento::date AS data_vencimento,
  COALESCE(cp.valor_liquido, 0)::float AS valor_liquido,
  cp.status,
  COALESCE(cd.nome, '-') AS categoria,
  COALESCE(cc.nome, '-') AS centro_custo,
  COALESCE(d.nome, '-') AS departamento,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(un.nome, '-') AS unidade_negocio,
  COALESCE(pr.nome, '-') AS projeto,
  COALESCE(cf.nome_conta, '-') AS conta_financeira,
  COALESCE(NULLIF(cp.tipo_documento, ''), '-') AS tipo_documento,
  COALESCE(NULLIF(cp.observacao, ''), '-') AS observacao
FROM financeiro.contas_pagar cp
LEFT JOIN compras.compras c ON c.id = cp.compra_id AND c.tenant_id = cp.tenant_id
LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
LEFT JOIN empresa.departamentos d ON d.id = cp.departamento_id
LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
LEFT JOIN financeiro.projetos pr ON pr.id = cp.projeto_id
LEFT JOIN financeiro.contas_financeiras cf ON cf.id = cp.conta_financeira_id
${base.whereClause}
ORDER BY cp.data_vencimento ASC, cp.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas a pagar',
    chart: null,
  }
}

function buildFinancialAccountsReceivableQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const clienteExpr = "COALESCE(NULLIF(c.nome_fantasia, ''), NULLIF(cr.nome_cliente_snapshot, ''), CONCAT('Cliente #', cr.cliente_id::text), '-')"
  const base = buildFinancialAccountsWhere(action, paramsIn, tenantId, 'cr', clienteExpr, ERP_ACOES_CONFIG['contas-a-receber'])

  return {
    sql: `
SELECT
  cr.id,
  cr.numero_documento,
  COALESCE(cr.pedido_id::text, '-') AS pedido,
  ${clienteExpr} AS cliente,
  cr.data_documento::date AS data_documento,
  cr.data_vencimento::date AS data_vencimento,
  COALESCE(cr.valor_liquido, 0)::float AS valor_liquido,
  cr.status,
  COALESCE(p.status, '-') AS status_pedido,
  COALESCE(cre.nome, '-') AS categoria,
  COALESCE(cl.nome, '-') AS centro_lucro,
  COALESCE(d.nome, '-') AS departamento,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(un.nome, '-') AS unidade_negocio,
  COALESCE(pr.nome, '-') AS projeto,
  COALESCE(NULLIF(cr.tipo_documento, ''), '-') AS tipo_documento,
  COALESCE(NULLIF(cr.observacao, ''), '-') AS observacao
FROM financeiro.contas_receber cr
LEFT JOIN vendas.pedidos p ON p.id = cr.pedido_id AND p.tenant_id = cr.tenant_id
LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id AND c.tenant_id = cr.tenant_id
LEFT JOIN financeiro.categorias_receita cre ON cre.id = cr.categoria_receita_id
LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
LEFT JOIN empresa.departamentos d ON d.id = cr.departamento_id
LEFT JOIN empresa.filiais fil ON fil.id = cr.filial_id
LEFT JOIN empresa.unidades_negocio un ON un.id = cr.unidade_negocio_id
LEFT JOIN financeiro.projetos pr ON pr.id = cr.projeto_id
${base.whereClause}
ORDER BY cr.data_vencimento ASC, cr.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas a receber',
    chart: null,
  }
}

type SemanticWhereConfig = {
  alias: string
  tenantScoped?: boolean
  dateField?: string
  statusField?: string
  idFields?: string[]
  valueField?: string
  searchExpressions?: string[]
  activeField?: string
  defaultActive?: boolean
  defaultLimit?: number
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const out = toText(value).toLowerCase()
  if (!out) return null
  if (out === 'true' || out === '1' || out === 'sim' || out === 'ativo') return true
  if (out === 'false' || out === '0' || out === 'nao' || out === 'inativo') return false
  throw new Error(`boolean invalido: ${out}`)
}

function buildSemanticWhere(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  config: SemanticWhereConfig,
) {
  const limit = normalizeLimit(paramsIn.limit, config.defaultLimit ?? 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = []
  const where: string[] = []

  if (config.tenantScoped !== false) {
    params.push(tenantId)
    where.push(`${config.alias}.tenant_id = $${params.length}::int`)
  }

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`${config.alias}.id::text = $${params.length}::text`)
  }

  const de = normalizeDate(paramsIn.de)
  if (de && config.dateField) {
    params.push(de)
    where.push(`${config.alias}.${config.dateField}::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate && config.dateField) {
    params.push(ate)
    where.push(`${config.alias}.${config.dateField}::date <= $${params.length}::date`)
  }

  const status = toText(paramsIn.status)
  if (status && config.statusField) {
    params.push(status)
    where.push(`LOWER(COALESCE(${config.alias}.${config.statusField}, '')) = LOWER($${params.length}::text)`)
  }

  const ativo = toOptionalBoolean(paramsIn.ativo)
  const activeFilter = ativo ?? config.defaultActive
  if (typeof activeFilter === 'boolean' && config.activeField) {
    params.push(activeFilter)
    where.push(`COALESCE(${config.alias}.${config.activeField}, true) = $${params.length}::boolean`)
  }

  for (const field of config.idFields || []) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      where.push(`${config.alias}.${field}::text = $${params.length}::text`)
    }
  }

  const valorMin = toText(paramsIn.valor_min)
  if (valorMin && config.valueField) {
    const parsed = Number(valorMin)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_min invalido')
    params.push(parsed)
    where.push(`${config.alias}.${config.valueField} >= $${params.length}::numeric`)
  }

  const valorMax = toText(paramsIn.valor_max)
  if (valorMax && config.valueField) {
    const parsed = Number(valorMax)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_max invalido')
    params.push(parsed)
    where.push(`${config.alias}.${config.valueField} <= $${params.length}::numeric`)
  }

  const q = toText(paramsIn.q)
  if (q && config.searchExpressions?.length) {
    params.push(`%${q}%`)
    const qParam = `$${params.length}::text`
    where.push(`(${config.searchExpressions.map((expression) => `${expression} ILIKE ${qParam}`).join(' OR ')})`)
  }

  params.push(limit, offset)
  return {
    params,
    whereClause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    limitParam: params.length - 1,
    offsetParam: params.length,
  }
}

function buildSalesOrdersQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const clienteExpr = "COALESCE(NULLIF(c.nome_fantasia, ''), CONCAT('Cliente #', p.cliente_id::text), '-')"
  const vendedorExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const canalExpr = "COALESCE(NULLIF(cv.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'p',
    dateField: 'data_pedido',
    statusField: 'status',
    idFields: ['cliente_id', 'vendedor_id', 'canal_venda_id', 'filial_id', 'centro_lucro_id'],
    valueField: 'valor_total',
    searchExpressions: ['p.id::text', clienteExpr, vendedorExpr, canalExpr, 'p.status'],
  })

  return {
    sql: `
SELECT
  p.id,
  p.id::text AS pedido,
  ${clienteExpr} AS cliente,
  p.data_pedido::date AS data_pedido,
  ${canalExpr} AS canal,
  ${vendedorExpr} AS vendedor,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(cl.nome, '-') AS centro_lucro,
  COALESCE(p.valor_total, 0)::float AS valor_total,
  COALESCE(p.status, '-') AS status
FROM vendas.pedidos p
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id AND c.tenant_id = p.tenant_id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
${base.whereClause}
ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Pedidos de venda',
    chart: null,
  }
}

function buildPurchaseOrdersQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const fornecedorExpr = "COALESCE(NULLIF(f.nome_fantasia, ''), CONCAT('Fornecedor #', c.fornecedor_id::text), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    dateField: 'data_pedido',
    statusField: 'status',
    idFields: ['fornecedor_id', 'filial_id', 'centro_custo_id', 'categoria_despesa_id'],
    valueField: 'valor_total',
    searchExpressions: ['c.numero_oc', fornecedorExpr, 'c.status', 'c.observacoes'],
  })

  return {
    sql: `
SELECT
  c.id,
  COALESCE(NULLIF(c.numero_oc, ''), c.id::text) AS numero_pedido,
  ${fornecedorExpr} AS fornecedor,
  c.data_pedido::date AS data_pedido,
  c.data_entrega_prevista::date AS data_entrega_prevista,
  COALESCE(c.valor_total, 0)::float AS valor_total,
  COALESCE(c.status, '-') AS status,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(cc.nome, '-') AS centro_custo,
  COALESCE(cd.nome, '-') AS categoria_despesa
FROM compras.compras c
LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id
${base.whereClause}
ORDER BY c.data_pedido DESC NULLS LAST, c.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Pedidos de compra',
    chart: null,
  }
}

function buildCrmAccountsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    dateField: 'criado_em',
    idFields: ['responsavel_id'],
    searchExpressions: ['c.nome', 'c.setor', 'c.site', 'c.telefone', responsavelExpr],
  })

  return {
    sql: `
SELECT
  c.id,
  c.nome AS conta,
  COALESCE(NULLIF(c.setor, ''), '-') AS setor,
  COALESCE(NULLIF(c.site, ''), '-') AS site,
  COALESCE(NULLIF(c.telefone, ''), '-') AS telefone,
  ${responsavelExpr} AS responsavel,
  COALESCE(NULLIF(c.endereco_cobranca, ''), '-') AS endereco_cobranca,
  c.criado_em::date AS criado_em
FROM crm.contas c
LEFT JOIN comercial.vendedores v ON v.id = c.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY c.criado_em DESC NULLS LAST, c.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas CRM',
    chart: null,
  }
}

function buildCrmContactsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'ct',
    dateField: 'criado_em',
    idFields: ['conta_id', 'responsavel_id'],
    searchExpressions: ['ct.nome', contaExpr, 'ct.cargo', 'ct.email', 'ct.telefone', responsavelExpr],
  })

  return {
    sql: `
SELECT
  ct.id,
  ct.nome AS contato,
  ${contaExpr} AS conta,
  COALESCE(NULLIF(ct.cargo, ''), '-') AS cargo,
  COALESCE(NULLIF(ct.email, ''), '-') AS email,
  COALESCE(NULLIF(ct.telefone, ''), '-') AS telefone,
  ${responsavelExpr} AS responsavel,
  ct.criado_em::date AS criado_em
FROM crm.contatos ct
LEFT JOIN crm.contas c ON c.id = ct.conta_id AND c.tenant_id = ct.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = ct.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY ct.criado_em DESC NULLS LAST, ct.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contatos CRM',
    chart: null,
  }
}

function buildCrmLeadsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const origemExpr = "COALESCE(NULLIF(ol.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'l',
    dateField: 'criado_em',
    statusField: 'status',
    idFields: ['origem_id', 'responsavel_id'],
    searchExpressions: ['l.nome', 'l.empresa', 'l.email', 'l.telefone', origemExpr, responsavelExpr, 'l.status'],
  })

  return {
    sql: `
SELECT
  l.id,
  l.nome,
  COALESCE(NULLIF(l.empresa, ''), '-') AS empresa,
  COALESCE(NULLIF(l.email, ''), '-') AS email,
  COALESCE(NULLIF(l.telefone, ''), '-') AS telefone,
  ${origemExpr} AS origem,
  COALESCE(l.status, '-') AS status,
  ${responsavelExpr} AS responsavel,
  l.criado_em::date AS criado_em
FROM crm.leads l
LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id AND ol.tenant_id = l.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY l.criado_em DESC NULLS LAST, l.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Leads',
    chart: null,
  }
}

function buildCrmOpportunitiesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), NULLIF(l.empresa, ''), NULLIF(l.nome, ''), '-')"
  const faseExpr = "COALESCE(NULLIF(fp.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'o',
    dateField: 'data_prevista',
    statusField: 'status',
    idFields: ['conta_id', 'lead_id', 'vendedor_id', 'fase_pipeline_id'],
    valueField: 'valor_estimado',
    searchExpressions: ['o.nome', contaExpr, faseExpr, responsavelExpr, 'o.status'],
  })

  return {
    sql: `
SELECT
  o.id,
  o.nome AS oportunidade,
  ${contaExpr} AS conta,
  ${faseExpr} AS fase,
  ${responsavelExpr} AS responsavel,
  COALESCE(o.valor_estimado, 0)::float AS valor_estimado,
  COALESCE(o.probabilidade, 0)::float AS probabilidade,
  o.data_prevista::date AS previsao_fechamento,
  COALESCE(o.status, '-') AS status
FROM crm.oportunidades o
LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id AND fp.tenant_id = o.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY o.data_prevista ASC NULLS LAST, o.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Oportunidades',
    chart: null,
  }
}

function buildCrmActivitiesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), '-')"
  const contatoExpr = "COALESCE(NULLIF(ct.nome, ''), '-')"
  const leadExpr = "COALESCE(NULLIF(l.nome, ''), '-')"
  const oportunidadeExpr = "COALESCE(NULLIF(o.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const assuntoExpr = "COALESCE(NULLIF(a.assunto, ''), NULLIF(a.descricao, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'a',
    dateField: 'data_prevista',
    statusField: 'status',
    idFields: ['conta_id', 'contato_id', 'lead_id', 'oportunidade_id', 'responsavel_id'],
    searchExpressions: [
      assuntoExpr,
      'a.tipo',
      'a.descricao',
      'a.anotacoes',
      contaExpr,
      contatoExpr,
      leadExpr,
      oportunidadeExpr,
      responsavelExpr,
      'a.status',
    ],
  })

  return {
    sql: `
SELECT
  a.id,
  a.data_prevista::date AS data_prevista,
  COALESCE(NULLIF(a.tipo, ''), '-') AS tipo,
  ${assuntoExpr} AS assunto,
  ${contaExpr} AS conta,
  ${contatoExpr} AS contato,
  ${leadExpr} AS lead,
  ${oportunidadeExpr} AS oportunidade,
  COALESCE(a.status, '-') AS status,
  ${responsavelExpr} AS responsavel,
  a.data_conclusao::date AS data_conclusao,
  COALESCE(NULLIF(a.anotacoes, ''), '-') AS anotacoes
FROM crm.atividades a
LEFT JOIN crm.contas c ON c.id = a.conta_id AND c.tenant_id = a.tenant_id
LEFT JOIN crm.contatos ct ON ct.id = a.contato_id AND ct.tenant_id = a.tenant_id
LEFT JOIN crm.leads l ON l.id = a.lead_id AND l.tenant_id = a.tenant_id
LEFT JOIN crm.oportunidades o ON o.id = a.oportunidade_id AND o.tenant_id = a.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = a.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY a.data_prevista ASC NULLS LAST, a.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Atividades CRM',
    chart: null,
  }
}

function buildCrmInteractionsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), '-')"
  const contatoExpr = "COALESCE(NULLIF(ct.nome, ''), '-')"
  const leadExpr = "COALESCE(NULLIF(l.nome, ''), '-')"
  const oportunidadeExpr = "COALESCE(NULLIF(o.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'i',
    dateField: 'data_interacao',
    statusField: 'canal',
    idFields: ['conta_id', 'contato_id', 'lead_id', 'oportunidade_id', 'responsavel_id'],
    searchExpressions: [
      'i.canal',
      'i.conteudo',
      contaExpr,
      contatoExpr,
      leadExpr,
      oportunidadeExpr,
      responsavelExpr,
    ],
  })

  return {
    sql: `
SELECT
  i.id,
  i.data_interacao::date AS data_interacao,
  COALESCE(NULLIF(i.canal, ''), '-') AS canal,
  COALESCE(NULLIF(i.conteudo, ''), '-') AS conteudo,
  ${contaExpr} AS conta,
  ${contatoExpr} AS contato,
  ${leadExpr} AS lead,
  ${oportunidadeExpr} AS oportunidade,
  ${responsavelExpr} AS responsavel
FROM crm.interacoes i
LEFT JOIN crm.contas c ON c.id = i.conta_id AND c.tenant_id = i.tenant_id
LEFT JOIN crm.contatos ct ON ct.id = i.contato_id AND ct.tenant_id = i.tenant_id
LEFT JOIN crm.leads l ON l.id = i.lead_id AND l.tenant_id = i.tenant_id
LEFT JOIN crm.oportunidades o ON o.id = i.oportunidade_id AND o.tenant_id = i.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = i.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY i.data_interacao DESC NULLS LAST, i.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Interacoes CRM',
    chart: null,
  }
}

function buildStockCurrentQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const produtoExpr = "COALESCE(NULLIF(p.nome, ''), CONCAT('Produto #', ea.produto_id::text), '-')"
  const almoxarifadoExpr = "COALESCE(NULLIF(a.nome, ''), CONCAT('Almoxarifado #', ea.almoxarifado_id::text), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'ea',
    tenantScoped: false,
    idFields: ['produto_id', 'almoxarifado_id'],
    searchExpressions: [produtoExpr, almoxarifadoExpr],
  })

  return {
    sql: `
SELECT
  ea.id,
  ea.produto_id,
  ${produtoExpr} AS produto,
  ea.almoxarifado_id,
  ${almoxarifadoExpr} AS almoxarifado,
  COALESCE(ea.quantidade, 0)::float AS quantidade,
  COALESCE(ea.custo_medio, 0)::float AS custo_medio,
  ROUND(COALESCE(ea.quantidade, 0)::numeric * COALESCE(ea.custo_medio, 0)::numeric, 2)::float AS valor_total,
  ea.atualizado_em
FROM estoque.estoques_atual ea
LEFT JOIN produtos.produto p ON p.id = ea.produto_id
LEFT JOIN estoque.almoxarifados a ON a.id = ea.almoxarifado_id
${base.whereClause}
ORDER BY a.nome ASC NULLS LAST, p.nome ASC NULLS LAST
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Estoque atual',
    chart: null,
  }
}

function buildStockMovementsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const produtoExpr = "COALESCE(NULLIF(p.nome, ''), CONCAT('Produto #', m.produto_id::text), '-')"
  const almoxarifadoExpr = "COALESCE(NULLIF(a.nome, ''), CONCAT('Almoxarifado #', m.almoxarifado_id::text), '-')"
  const tipoExpr = "COALESCE(NULLIF(tm.descricao, ''), NULLIF(m.tipo_movimento, ''), NULLIF(m.tipo_codigo, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'm',
    tenantScoped: false,
    dateField: 'data_movimento',
    statusField: 'tipo_movimento',
    idFields: ['produto_id', 'almoxarifado_id'],
    valueField: 'valor_total',
    searchExpressions: [produtoExpr, almoxarifadoExpr, tipoExpr, 'm.origem', 'm.observacoes'],
  })

  return {
    sql: `
SELECT
  m.id,
  m.data_movimento::date AS data,
  m.produto_id,
  ${produtoExpr} AS produto,
  m.almoxarifado_id,
  ${almoxarifadoExpr} AS almoxarifado,
  ${tipoExpr} AS tipo,
  COALESCE(m.quantidade, 0)::float AS quantidade,
  COALESCE(m.valor_total, 0)::float AS valor_total,
  COALESCE(NULLIF(m.origem, ''), '-') AS origem,
  COALESCE(NULLIF(m.observacoes, ''), '-') AS observacoes
FROM estoque.movimentacoes_estoque m
LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo
LEFT JOIN estoque.almoxarifados a ON a.id = m.almoxarifado_id
LEFT JOIN produtos.produto p ON p.id = m.produto_id
${base.whereClause}
ORDER BY m.data_movimento DESC NULLS LAST, m.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Movimentacoes de estoque',
    chart: null,
  }
}

function buildStockProductsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 100)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = [tenantId]
  const where = ['p.tenantid = $1::int']

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`p.id::text = $${params.length}::text`)
  }

  const ativo = toOptionalBoolean(paramsIn.ativo)
  if (typeof ativo === 'boolean') {
    params.push(ativo)
    where.push(`COALESCE(p.ativo, true) = $${params.length}::boolean`)
  }

  const q = toText(paramsIn.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`(p.nome ILIKE $${params.length}::text OR COALESCE(p.descricao, '') ILIKE $${params.length}::text OR COALESCE(c.nome, '') ILIKE $${params.length}::text)`)
  }

  params.push(limit, offset)
  return {
    sql: `
SELECT
  p.id,
  p.nome,
  COALESCE(NULLIF(p.descricao, ''), '-') AS descricao,
  COALESCE(c.nome, '-') AS categoria,
  CASE WHEN COALESCE(p.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM produtos.produto p
LEFT JOIN produtos.categorias c ON c.id = p.categoria_id
WHERE ${where.join(' AND ')}
ORDER BY p.nome ASC NULLS LAST, p.id ASC
LIMIT $${params.length - 1}::int
OFFSET $${params.length}::int
    `.trim(),
    params,
    title: 'Produtos',
    chart: null,
  }
}

function buildFinanceClientsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    searchExpressions: ['c.nome_fantasia', 'c.cnpj_cpf'],
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  c.id,
  COALESCE(NULLIF(c.nome_fantasia, ''), '-') AS nome,
  COALESCE(NULLIF(c.cnpj_cpf, ''), '-') AS documento
FROM entidades.clientes c
${base.whereClause}
ORDER BY c.nome_fantasia ASC NULLS LAST, c.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Clientes',
    chart: null,
  }
}

function buildFinanceSuppliersQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'f',
    tenantScoped: false,
    searchExpressions: ['f.nome_fantasia', 'f.cnpj', 'f.email', 'f.telefone'],
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  f.id,
  COALESCE(NULLIF(f.nome_fantasia, ''), '-') AS nome,
  COALESCE(NULLIF(f.cnpj, ''), '-') AS documento,
  COALESCE(NULLIF(f.email, ''), '-') AS email,
  COALESCE(NULLIF(f.telefone, ''), '-') AS telefone
FROM entidades.fornecedores f
${base.whereClause}
ORDER BY f.nome_fantasia ASC NULLS LAST, f.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Fornecedores',
    chart: null,
  }
}

function buildFinancialBankAccountsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'cf',
    dateField: 'data_abertura',
    idFields: ['tipo_conta'],
    searchExpressions: ['cf.nome_conta', 'cf.tipo_conta', 'cf.numero_conta', 'cf.agencia', 'cf.pix_chave'],
    activeField: 'ativo',
    defaultActive: true,
  })

  return {
    sql: `
SELECT
  cf.id,
  cf.nome_conta AS nome,
  COALESCE(NULLIF(cf.tipo_conta, ''), '-') AS tipo_conta,
  COALESCE(NULLIF(cf.agencia, ''), '-') AS agencia,
  COALESCE(NULLIF(cf.numero_conta, ''), '-') AS numero_conta,
  COALESCE(cf.saldo_atual, 0)::float AS saldo_atual,
  CASE WHEN COALESCE(cf.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM financeiro.contas_financeiras cf
${base.whereClause}
ORDER BY cf.nome_conta ASC NULLS LAST, cf.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas financeiras',
    chart: null,
  }
}

function buildNamedBusinessResourceQuery(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  table: string,
  alias: string,
  title: string,
): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias,
    searchExpressions: [`${alias}.codigo`, `${alias}.nome`, `${alias}.descricao`],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  ${alias}.id,
  COALESCE(NULLIF(${alias}.codigo, ''), '-') AS codigo,
  ${alias}.nome,
  COALESCE(NULLIF(${alias}.descricao, ''), '-') AS descricao,
  CASE WHEN COALESCE(${alias}.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM ${table} ${alias}
${base.whereClause}
ORDER BY ${alias}.nome ASC NULLS LAST, ${alias}.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title,
    chart: null,
  }
}

function buildStockWarehousesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'a',
    searchExpressions: ['a.nome', 'a.tipo', 'a.endereco', 'a.responsavel'],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  a.id,
  a.nome AS almoxarifado,
  COALESCE(NULLIF(a.tipo, ''), '-') AS tipo,
  COALESCE(NULLIF(a.endereco, ''), '-') AS endereco,
  COALESCE(NULLIF(a.responsavel, ''), '-') AS responsavel,
  CASE WHEN COALESCE(a.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM estoque.almoxarifados a
${base.whereClause}
ORDER BY a.nome ASC NULLS LAST, a.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Almoxarifados',
    chart: null,
  }
}

function buildStockMovementTypesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'tm',
    tenantScoped: false,
    searchExpressions: ['tm.codigo', 'tm.descricao', 'tm.natureza'],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  tm.id,
  tm.codigo,
  tm.descricao,
  COALESCE(NULLIF(tm.natureza, ''), '-') AS natureza,
  CASE WHEN COALESCE(tm.gera_financeiro, false) THEN 'Sim' ELSE 'Nao' END AS gera_financeiro,
  CASE WHEN COALESCE(tm.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM estoque.tipos_movimentacao tm
${base.whereClause}
ORDER BY tm.natureza ASC NULLS LAST, tm.descricao ASC NULLS LAST
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Tipos de movimentacao',
    chart: null,
  }
}

function buildCrudQuery(action: CrudAction, resource: string, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  if (resource === 'contas-a-pagar') {
    return buildFinancialAccountsPayableQuery(action, paramsIn, tenantId)
  }

  if (resource === 'contas-a-receber') {
    return buildFinancialAccountsReceivableQuery(action, paramsIn, tenantId)
  }

  if (resource === 'vendas/pedidos') {
    return buildSalesOrdersQuery(action, paramsIn, tenantId)
  }

  if (resource === 'compras/pedidos') {
    return buildPurchaseOrdersQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/contas') {
    return buildCrmAccountsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/contatos') {
    return buildCrmContactsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/leads') {
    return buildCrmLeadsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/oportunidades') {
    return buildCrmOpportunitiesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/atividades') {
    return buildCrmActivitiesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/interacoes') {
    return buildCrmInteractionsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/estoque-atual') {
    return buildStockCurrentQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/movimentacoes') {
    return buildStockMovementsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/produtos') {
    return buildStockProductsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/clientes') {
    return buildFinanceClientsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/fornecedores') {
    return buildFinanceSuppliersQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/contas-financeiras') {
    return buildFinancialBankAccountsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/categorias-despesa') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'financeiro.categorias_despesa', 'cd', 'Categorias de despesa')
  }

  if (resource === 'financeiro/categorias-receita') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'financeiro.categorias_receita', 'cr', 'Categorias de receita')
  }

  if (resource === 'financeiro/centros-custo') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'empresa.centros_custo', 'cc', 'Centros de custo')
  }

  if (resource === 'financeiro/centros-lucro') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'empresa.centros_lucro', 'cl', 'Centros de lucro')
  }

  if (resource === 'estoque/almoxarifados') {
    return buildStockWarehousesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/tipos-movimentacao') {
    return buildStockMovementTypesQuery(action, paramsIn, tenantId)
  }

  const table = getCrudTable(resource)
  const limit = normalizeLimit(paramsIn.limit, 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = [tenantId]
  const where = ['tenant_id = $1::int']

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`id::text = $${params.length}::text`)
  }

  const q = toText(paramsIn.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`to_jsonb(t)::text ILIKE $${params.length}::text`)
  }

  params.push(limit, offset)
  return {
    sql: `
SELECT *
FROM ${table} AS t
WHERE ${where.join(' AND ')}
ORDER BY 1 DESC
LIMIT $${params.length - 1}::int
OFFSET $${params.length}::int
    `.trim(),
    params,
    title: `ERP - ${resource}`,
    chart: null,
  }
}

async function callCrud(
  args: unknown,
  context: CognitoMcpServerContext,
  toolName: string,
  allowedResources: string[],
) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeCrudAction(input.action || 'listar')
  const resource = toText(input.resource)
  if (!resource) throw new Error(`resource e obrigatorio para ${toolName}`)
  assertCrudResourceForTool(resource, toolName, allowedResources)

  const built = buildCrudQuery(action, resource, paramsIn, getTenantId(context))
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = inferColumns(rows)
  const structuredContent = {
    success: true,
    tool: toolName,
    action,
    resource,
    title: built.title,
    rows,
    columns,
    count: rows.length,
    sql_query: built.sql,
    sql_params: built.params,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

function buildErpAcoesResponse(input: {
  success: boolean
  action: ErpAcoesAction
  resource: ErpAcoesResource
  dryRun: boolean
  result: JsonRecord
}) {
  const { success, action, resource, dryRun, result } = input
  const row = {
    status_operacao: success ? (dryRun ? 'preview' : 'executado') : 'erro',
    recurso: resource,
    acao: action,
    dry_run: dryRun,
    mensagem: result.message || result.error || null,
    id: result.id ?? null,
    status: result.status ?? null,
    status_anterior: result.previous_status ?? null,
    status_novo: result.next_status ?? result.status ?? null,
  }
  const rows = [row]
  const structuredContent = {
    success,
    tool: MCP_APP_DOMAIN_TOOL_NAMES.erpAcoes,
    action,
    resource,
    title: dryRun ? `Preview - ERP acoes - ${resource}` : `ERP acoes - ${resource}`,
    dry_run: dryRun,
    rows,
    columns: inferColumns(rows),
    count: rows.length,
    result,
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: !success,
  }
}

async function getErpAcoesRow(config: ErpAcoesConfig, tenantId: number, id: number) {
  const rows = await runQuery<{ id: number; status: string | null; observacao: string | null }>(
    `SELECT id, status, observacao FROM ${config.table} WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [tenantId, id],
  )
  return rows[0] || null
}

async function updateErpAcoesRow(
  config: ErpAcoesConfig,
  tenantId: number,
  id: number,
  updates: Array<{ column: string; value: unknown }>,
) {
  if (!updates.length) throw new Error('Nenhum campo valido para atualizar')
  const sets: string[] = []
  const params: unknown[] = []
  let index = 1
  for (const update of updates) {
    sets.push(`${update.column} = $${index++}`)
    params.push(update.value)
  }
  sets.push('atualizado_em = now()')
  params.push(tenantId, id)
  const rows = await runQuery<{ id: number; status: string }>(
    `UPDATE ${config.table} SET ${sets.join(', ')} WHERE tenant_id = $${index++} AND id = $${index} RETURNING id, status`,
    params,
  )
  return rows[0] || null
}

function getRequiredErpAcoesId(input: JsonRecord) {
  const id = toNumber(input.id)
  if (!id || id <= 0) throw new Error('id e obrigatorio e deve ser numerico')
  return id
}

function buildErpAcoesUpdateList(config: ErpAcoesConfig, payload: JsonRecord) {
  const updates: Array<{ column: string; value: unknown }> = []
  const pushText = (key: string, column: string) => {
    if (payload[key] !== undefined) updates.push({ column, value: toOptionalText(payload[key]) })
  }
  const pushNumber = (key: string, column: string) => {
    if (payload[key] !== undefined) updates.push({ column, value: toNumber(payload[key]) })
  }
  const pushDate = (key: string, column: string) => {
    if (payload[key] !== undefined) updates.push({ column, value: normalizeDate(payload[key]) })
  }

  pushText('descricao', 'observacao')
  pushText('observacao', 'observacao')
  pushText('numero_documento', 'numero_documento')
  pushText('tipo_documento', 'tipo_documento')
  pushDate('data_lancamento', 'data_lancamento')
  pushDate('data_emissao', 'data_lancamento')
  pushDate('data_documento', 'data_documento')
  pushDate('data_vencimento', 'data_vencimento')
  pushNumber(config.entityPayloadKey, config.entityIdColumn)
  pushNumber('categoria_id', config.categoryColumn)
  pushNumber(config.categoryColumn, config.categoryColumn)
  pushNumber('conta_financeira_id', 'conta_financeira_id')
  pushNumber(config.centerColumn, config.centerColumn)
  pushNumber('centro_custo_id', config.centerColumn)
  pushNumber('centro_lucro_id', config.centerColumn)
  pushNumber('departamento_id', 'departamento_id')
  pushNumber('filial_id', 'filial_id')
  pushNumber('unidade_negocio_id', 'unidade_negocio_id')
  pushNumber('projeto_id', 'projeto_id')

  if (payload.valor !== undefined) {
    const value = toNumber(payload.valor)
    if (value == null || value <= 0) throw new Error('valor deve ser maior que zero')
    const amount = Math.abs(value)
    updates.push({ column: 'valor_bruto', value: amount })
    updates.push({ column: 'valor_liquido', value: amount })
  }

  if (payload.status !== undefined) {
    const status = normalizeErpAcoesStatus(config, payload.status)
    assertErpAcoesStatus(config, status)
    updates.push({ column: 'status', value: status })
  }

  return updates.filter((update) => update.value !== undefined)
}

async function callErpAcoesCreate(config: ErpAcoesConfig, payload: JsonRecord, dryRun: boolean, tenantId: number) {
  const entityId = toNumber(payload[config.entityPayloadKey])
  const value = toNumber(payload.valor)
  const amount = value == null ? null : Math.abs(value)
  const dueDate = normalizeDate(payload.data_vencimento)
  const issueDate = normalizeDate(payload.data_lancamento || payload.data_emissao) || new Date().toISOString().slice(0, 10)
  const documentDate = normalizeDate(payload.data_documento || payload.data_emissao || payload.data_lancamento) || issueDate
  const status = normalizeErpAcoesStatus(config, payload.status || 'pendente')
  const documentNumber = toText(payload.numero_documento) || makeErpAcoesDocumentNumber(config.resource)
  const documentType = toText(payload.tipo_documento).toLowerCase() || 'fatura'
  const description = toOptionalText(payload.descricao || payload.observacao)

  if (!entityId || entityId <= 0) throw new Error(`${config.entityPayloadKey} e obrigatorio`)
  if (amount == null || amount <= 0) throw new Error('valor e obrigatorio e deve ser maior que zero')
  if (!dueDate) throw new Error('data_vencimento e obrigatorio')
  assertErpAcoesStatus(config, status)

  const result: JsonRecord = {
    message: dryRun ? `${config.label} pronta para criar` : `${config.label} criada`,
    resource: config.resource,
    operation: 'criar',
    status,
    numero_documento: documentNumber,
    valor: amount,
    data_vencimento: dueDate,
  }

  if (dryRun) return result

  const columns = [
    'tenant_id',
    config.entityIdColumn,
    'numero_documento',
    'tipo_documento',
    'status',
    'data_documento',
    'data_lancamento',
    'data_vencimento',
    'valor_bruto',
    'valor_desconto',
    'valor_impostos',
    'valor_liquido',
    'observacao',
  ]
  const values: unknown[] = [
    tenantId,
    entityId,
    documentNumber,
    documentType,
    status,
    documentDate,
    issueDate,
    dueDate,
    amount,
    0,
    0,
    amount,
    description,
  ]

  const optionalNumbers: Array<[string, string]> = [
    ['categoria_id', config.categoryColumn],
    [config.categoryColumn, config.categoryColumn],
    ['conta_financeira_id', 'conta_financeira_id'],
    [config.centerColumn, config.centerColumn],
    ['centro_custo_id', config.centerColumn],
    ['centro_lucro_id', config.centerColumn],
    ['departamento_id', 'departamento_id'],
    ['filial_id', 'filial_id'],
    ['unidade_negocio_id', 'unidade_negocio_id'],
    ['projeto_id', 'projeto_id'],
  ]
  for (const [key, column] of optionalNumbers) {
    const number = toNumber(payload[key])
    if (number != null && !columns.includes(column)) {
      columns.push(column)
      values.push(number)
    }
  }

  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
  const rows = await runQuery<{ id: number }>(
    `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    values,
  )
  const created = rows[0]
  if (!created) throw new Error(`Falha ao criar ${config.label.toLowerCase()}`)
  return { ...result, id: created.id }
}

async function callErpAcoesUpdate(config: ErpAcoesConfig, input: JsonRecord, dryRun: boolean, tenantId: number) {
  const id = getRequiredErpAcoesId(input)
  const payload = toObj(input.payload)
  const current = await getErpAcoesRow(config, tenantId, id)
  if (!current) throw new Error('Registro nao encontrado')
  const updates = buildErpAcoesUpdateList(config, payload)
  if (!updates.length) throw new Error('Nenhum campo valido para atualizar')

  const statusUpdate = updates.find((update) => update.column === 'status')
  if (statusUpdate) {
    const currentStatus = normalizeErpAcoesStatus(config, current.status || 'pendente')
    const nextStatus = String(statusUpdate.value)
    const allowed = ERP_ACOES_TRANSITIONS[config.resource][currentStatus] || []
    if (currentStatus !== nextStatus && !allowed.includes(nextStatus)) {
      throw new Error(`Transicao de status invalida: ${currentStatus} -> ${nextStatus}`)
    }
  }

  if (!dryRun) {
    const updated = await updateErpAcoesRow(config, tenantId, id, updates)
    if (!updated) throw new Error('Registro nao encontrado')
  }

  return {
    id,
    message: dryRun ? `${config.label} pronta para atualizar` : `${config.label} atualizada`,
    updated_fields: updates.map((update) => update.column),
    previous_status: current.status,
    status: statusUpdate ? statusUpdate.value : current.status,
  }
}

async function callErpAcoesStatusAction(
  config: ErpAcoesConfig,
  input: JsonRecord,
  action: Exclude<ErpAcoesAction, 'criar' | 'atualizar'>,
  dryRun: boolean,
  tenantId: number,
) {
  const id = getRequiredErpAcoesId(input)
  const payload = toObj(input.payload)
  const current = await getErpAcoesRow(config, tenantId, id)
  if (!current) throw new Error('Registro nao encontrado')

  const rule = ERP_ACOES_STATUS_ACTIONS[action]
  const currentStatus = normalizeErpAcoesStatus(config, current.status || 'pendente')
  assertErpAcoesStatus(config, currentStatus)
  const targetStatus = rule.target(config)
  const allowedFrom = rule.allowedFrom(config)
  if (currentStatus !== targetStatus && !allowedFrom.includes(currentStatus)) {
    throw new Error(`${action} nao permitido para status ${currentStatus}`)
  }

  const noteRaw = toText(payload.motivo || payload.motivo_cancelamento || payload.motivo_estorno || payload.observacao || payload.descricao)
  const note = noteRaw ? `${rule.notePrefix} ${noteRaw}` : rule.notePrefix
  const observation = [toOptionalText(current.observacao), note].filter(Boolean).join('\n') || null

  if (!dryRun && currentStatus !== targetStatus) {
    const updated = await updateErpAcoesRow(config, tenantId, id, [
      { column: 'status', value: targetStatus },
      { column: 'observacao', value: observation },
    ])
    if (!updated) throw new Error('Registro nao encontrado')
  }

  return {
    id,
    message:
      currentStatus === targetStatus
        ? `${config.label} ja estava ${targetStatus}`
        : dryRun
          ? `${config.label} pronta para ${action}`
          : `${config.label} ${rule.successVerb}`,
    previous_status: currentStatus,
    next_status: targetStatus,
    status: targetStatus,
    unchanged: currentStatus === targetStatus,
  }
}

async function callErpAcoes(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const resource = normalizeErpAcoesResource(input.resource)
  const action = normalizeErpAcoesAction(input.action)
  const dryRun = input.dry_run !== false
  const config = ERP_ACOES_CONFIG[resource]
  const tenantId = getTenantId(context)

  try {
    const result =
      action === 'criar'
        ? await callErpAcoesCreate(config, toObj(input.payload), dryRun, tenantId)
        : action === 'atualizar'
          ? await callErpAcoesUpdate(config, input, dryRun, tenantId)
          : await callErpAcoesStatusAction(config, input, action, dryRun, tenantId)

    return buildErpAcoesResponse({
      success: true,
      action,
      resource,
      dryRun,
      result: {
        ...result,
        idempotency_key: toOptionalText(input.idempotency_key),
      },
    })
  } catch (error) {
    return buildErpAcoesResponse({
      success: false,
      action,
      resource,
      dryRun,
      result: {
        error: (error as Error)?.message || String(error),
        idempotency_key: toOptionalText(input.idempotency_key),
      },
    })
  }
}

async function callEcommerce(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeEcommerceAction(input.action)
  return executeBuiltQuery('ecommerce', action, buildEcommerceQuery(action, paramsIn, getTenantId(context)))
}

async function callMarketing(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeMarketingAction(input.action)
  return executeBuiltQuery('marketing', action, buildMarketingQuery(action, paramsIn, getTenantId(context)))
}

async function callFinancialStatement(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input)
  const kind = normalizeFinancialStatementKind(input.kind)
  const period = resolveFinancialPeriod(kind, paramsIn)
  const built = buildFinancialStatementQuery(kind, paramsIn, getTenantId(context))
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = built.columns ?? inferColumns(rows).filter((column) => !column.startsWith('_'))
  const structuredContent = {
    success: true,
    tool: MCP_APP_DOMAIN_TOOL_NAMES.financialStatement,
    view: 'table',
    kind,
    variant: built.variant,
    title: built.title,
    subtitle:
      kind === 'dre'
        ? `DRE consolidada no periodo ${period.de} a ${period.ate}`
        : `Fluxo de caixa previsto por vencimento no periodo ${period.de} a ${period.ate}`,
    rows,
    columns,
    count: rows.length,
    sql_query: built.sql,
    sql_params: built.params,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

async function callSqlExecution(
  args: unknown,
  context: CognitoMcpServerContext,
  toolName: string = MCP_APP_DOMAIN_TOOL_NAMES.sql,
) {
  const input = toObj(args)
  const sqlRaw = toText(input.sql)
  const title = toText(input.title) || 'Resultado da Consulta'
  const chartRaw = parseChartConfig(input.chart)

  if (!sqlRaw) throw new Error('sql e obrigatorio')

  const safeSql = normalizeAndAssertSafeSelectQuery(sqlRaw)
  const { sql: boundSql, params } = bindTenantParam(safeSql, getTenantId(context))
  const maxRows = 1000
  const finalSql = `SELECT * FROM (${boundSql}) AS q LIMIT $${params.length + 1}::int`
  const finalParams = [...params, maxRows]

  const rows = await runQuery<Record<string, unknown>>(finalSql, finalParams)
  const columns = inferColumns(rows)
  const chart = assertChartColumns(chartRaw, columns)
  const structuredContent = {
    success: true,
    tool: toolName,
    action: 'execute' satisfies SqlExecutionAction,
    title,
    rows,
    columns,
    count: rows.length,
    chart,
    sql_query: finalSql,
    sql_params: finalParams,
    max_rows: maxRows,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

export function isMcpAppDomainTool(name: string) {
  return MCP_APP_DOMAIN_TOOL_NAME_SET.has(name)
}

export async function callMcpAppDomainTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  switch (name) {
    case MCP_APP_DOMAIN_TOOL_NAMES.erp:
      return callCrud(args, context, MCP_APP_DOMAIN_TOOL_NAMES.erp, ERP_ALLOWED_RESOURCES)
    case MCP_APP_DOMAIN_TOOL_NAMES.erpAcoes:
      return callErpAcoes(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.crm:
      return callCrud(args, context, MCP_APP_DOMAIN_TOOL_NAMES.crm, CRM_ALLOWED_RESOURCES)
    case MCP_APP_DOMAIN_TOOL_NAMES.ecommerce:
      return callEcommerce(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.sql:
      return callSqlExecution(args, context, MCP_APP_DOMAIN_TOOL_NAMES.sql)
    case MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution:
      return callSqlExecution(args, context, MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution)
    case MCP_APP_DOMAIN_TOOL_NAMES.financialStatement:
      return callFinancialStatement(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.marketing:
      return callMarketing(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.dataCatalog:
      return callDataCatalog(args, context)
    default:
      throw new Error(`Tool de dominio desconhecida: ${name}`)
  }
}
