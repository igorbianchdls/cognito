# Ecommerce Skill (Schema + BI Dashboards)

Objetivo: orientar modelagem, query e dashboards para ecommerce multicanal (Amazon, Mercado Livre, Shopee, Shopify) com base no schema `ecommerce`.

Use este skill quando o pedido envolver:
- schema/tabelas/colunas de ecommerce
- integracao de dados de pedidos, pagamentos, logistica e estoque
- criacao de dashboards por plataforma e consolidado
- endpoints query/options para BI

## Fonte de Verdade
- `tmp/ecommerce_mvp_schema.sql`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`

## Schema e Tabelas (Ecommerce)

### Integracao
- `ecommerce.canais_contas`
  - colunas: `tenant_id`, `plataforma`, `external_id`, `nome_conta`, `status`
- `ecommerce.canais_credenciais`
  - colunas: `tenant_id`, `plataforma`, `canal_conta_id`, `tipo`, `status`
- `ecommerce.sync_jobs`, `ecommerce.sync_cursores`, `ecommerce.webhook_eventos`, `ecommerce.raw_api_payloads`

### Cadastros
- `ecommerce.lojas` (`tenant_id`, `plataforma`, `canal_conta_id`, `external_id`, `nome`, `status`)
- `ecommerce.clientes` (`tenant_id`, `plataforma`, `canal_conta_id`, `loja_id`, `external_id`, `nome`, `email`)
- `ecommerce.enderecos` (`tenant_id`, `plataforma`, `cliente_id`, `tipo`, `cidade`, `estado`, `cep`)
- `ecommerce.produtos` (`tenant_id`, `plataforma`, `external_id`, `sku_principal`, `nome`, `marca`, `categoria`, `status`)
- `ecommerce.produto_variantes` (`tenant_id`, `produto_id`, `external_id`, `sku`, `preco_sugerido`, `custo_unitario`)
- `ecommerce.listings` (`tenant_id`, `plataforma`, `canal_conta_id`, `produto_id`, `external_id`, `status`, `preco_anunciado`, `estoque_disponivel`)

### Operacao e Financeiro
- `ecommerce.pedidos`
  - colunas-chave: `tenant_id`, `plataforma`, `canal_conta_id`, `loja_id`, `cliente_id`, `status`, `status_pagamento`, `status_fulfillment`, `valor_total`, `valor_pago`, `valor_reembolsado`, `valor_liquido_estimado`, `data_pedido`
- `ecommerce.pedido_itens`
  - colunas-chave: `tenant_id`, `plataforma`, `pedido_id`, `produto_id`, `produto_variante_id`, `quantidade`, `preco_unitario`, `valor_total`
- `ecommerce.pagamentos`
  - colunas-chave: `tenant_id`, `plataforma`, `pedido_id`, `status`, `metodo`, `provedor`, `valor_autorizado`, `valor_capturado`, `valor_taxa`, `valor_liquido`
- `ecommerce.transacoes_pagamento`
- `ecommerce.envios`, `ecommerce.eventos_fulfillment`
- `ecommerce.devolucoes`, `ecommerce.reembolsos`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`, `ecommerce.payout_itens`
- `ecommerce.estoque_saldos`, `ecommerce.estoque_movimentacoes`

## Medidas e Dimensoes (BI)

### Models habilitados para query
- `ecommerce.pedidos`
- `ecommerce.pedido_itens`
- `ecommerce.pagamentos`
- `ecommerce.envios`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`
- `ecommerce.estoque_saldos`

### Medidas de negocio principais
- GMV: `SUM(valor_total)`
- Pedidos: `COUNT()`
- Ticket medio: `AVG(valor_total)`
- Receita liquida estimada: `SUM(valor_liquido_estimado)`
- Fee rate: `CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END`
- Reembolsos: `SUM(valor_reembolsado)`
- Payout liquido: `SUM(valor_liquido)`
- Estoque disponivel: `SUM(quantidade_disponivel)`

### Dimensoes principais
- `plataforma`, `canal_conta`, `loja`, `status`, `status_pagamento`, `status_fulfillment`, `produto`, `categoria`, `transportadora`, `mes`/`periodo`

## Filtros de Dashboard
- `de`, `ate`
- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`, `categoria`
- `valor_min`, `valor_max`

## Como Criar Dashboards (Apps)

### Dashboards por plataforma
- Rotas alvo: `/apps/amazon`, `/apps/mercadolivre`, `/apps/shopee`, `/apps/shopify`
- Em `DataProvider`, iniciar `filters.plataforma` com a plataforma do app.
- Usar filtros `list` (checkbox) em cards separados: conta, loja, status pedido, status pagamento, status fulfillment.

### Dashboard consolidado
- Rota alvo: `/apps/ecommerce`
- Nao fixar plataforma no filtro base.
- Incluir comparativo por plataforma (`BarChart` e `PieChart`).

### Estrutura recomendada
1. Header + datePicker
2. Filtros (SlicerCard)
3. KPIs executivos
4. Tendencia temporal
5. Rankings operacionais e financeiros
6. Insights (AISummary)

## Backend (quando necessario)
- Query endpoint: `/api/modulos/ecommerce/query`
- Options endpoint: `/api/modulos/ecommerce/options`
- Resolver: `/api/modulos/options/resolve`

## Troubleshooting Rapido
- Filtro sem opcoes: validar `source.type = options`, `field`, `dependsOn` e `contextFilters`.
- KPI incoerente: revisar granularidade (pedido vs item vs pagamento vs payout).
- Valores zerados: conferir `filters.plataforma`/datas e whitelist de measures no controller.
- Divergencia liquido x payout: conferir taxas/reembolsos por periodo e status de pagamento.
