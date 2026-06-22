export type NormalizedTableName =
  | 'clientes'
  | 'fornecedores'
  | 'produtos'
  | 'servicos'
  | 'contas_receber'
  | 'contas_pagar'
  | 'vendas'
  | 'contratos'
  | 'itens_venda'
  | 'venda_detalhes'
  | 'notas_fiscais'
  | 'notas_fiscais_servico'
  | 'categorias'
  | 'centros_custo'
  | 'contas_financeiras'
  | 'transferencias'
  | 'estoque_atual'
  | 'compras'
  | 'parcelas_venda'
  | 'vendedores'
  | 'variacoes'
  | 'marcas'
  | 'notas_consumidor'
  | 'expedicoes'
  | 'separacoes'
  | 'estoque_movimentacoes'
  | 'listas_preco'
  | 'formas_envio'
  | 'formas_pagamento'
  | 'intermediadores'
  | 'transportadoras'
  | 'canais_venda'
  | 'lojas'
  | 'depositos'
  | 'produto_categorias'
  | 'produto_cest'
  | 'produto_ecommerce_marcas'
  | 'produto_ncm'
  | 'produto_unidades_medida'
  | 'categorias_dre'
  | 'saldos_contas_financeiras'
  | 'eventos_financeiros_alteracoes'
  | 'saldos_iniciais'
  | 'venda_proximo_numero'
  | 'contrato_proximo_numero'
  | 'lancamentos_financeiros'
  | 'contas_correntes'
  | 'empresa_conectada'
  | 'uso_api'
  | 'gatilhos'
  | 'contas'
  | 'contatos'
  | 'leads'
  | 'oportunidades'
  | 'atividades'
  | 'usuarios'
  | 'pipelines'
  | 'fases_pipeline'
  | 'social_profiles'
  | 'social_posts'
  | 'social_videos'
  | 'social_comments'
  | 'social_audience_daily'
  | 'social_performance_daily'
  | 'social_engagement_daily'
  | 'paid_media_accounts'
  | 'paid_media_campaigns'
  | 'paid_media_ad_groups'
  | 'paid_media_ads'
  | 'paid_media_creatives'
  | 'paid_media_keywords'
  | 'paid_media_conversions'
  | 'paid_media_insights_daily'
  | 'analytics_accounts'
  | 'analytics_locations'
  | 'analytics_traffic_daily'
  | 'analytics_pages_daily'
  | 'analytics_queries_daily'
  | 'analytics_events_daily'
  | 'analytics_reviews'
  | 'analytics_local_posts'
  | 'ecommerce_stores'
  | 'ecommerce_customers'
  | 'ecommerce_products'
  | 'ecommerce_variants'
  | 'ecommerce_orders'
  | 'ecommerce_order_items'
  | 'ecommerce_payments'
  | 'ecommerce_refunds'
  | 'ecommerce_shipping'
  | 'ecommerce_inventory'
  | 'ecommerce_categories'
  | 'ecommerce_coupons'
  | 'ecommerce_abandoned_checkouts'

export type NormalizationInput = {
  tenantId: number
  connectionId: string
  provider: string
  resource: string
  runId?: string | null
  sourceTable: string
  rows: Record<string, unknown>[]
}

export type NormalizedRow = {
  table: NormalizedTableName
  insertId: string
  data: Record<string, unknown>
}

export type NormalizationResult = {
  provider: string
  resource: string
  status: 'normalized' | 'skipped'
  tables?: NormalizedTableName[]
  rows: NormalizedRow[]
  skippedRows: number
  message?: string
}

export type Normalizer = {
  provider: string
  normalize: (input: NormalizationInput) => NormalizationResult
}
