# Ecommerce Skill (Tabelas, Dimensoes e Metricas)

Objetivo: orientar modelagem e consulta do schema `ecommerce` com foco em tabelas, colunas, dimensoes, metricas e filtros suportados.

Use este skill quando o pedido envolver:
- modelagem de dados de ecommerce multicanal
- entendimento de tabelas de operacao e financeiro
- escolha correta de models/dimensoes/medidas
- options e filtros por plataforma/conta/loja/status

Nao use este skill para ensinar layout JSON de dashboard.
Para isso, use `dashboard.md`.

## Fonte de Verdade
- `tmp/ecommerce_mvp_schema.sql`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
- `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
- `src/products/bi/shared/queryCatalog.ts`

## Prioridade de Fonte (quando houver divergencia)
- Para aceitar/rejeitar `model`, `measure`, `dimension` e `filters` em `dataQuery`, a fonte principal e:
  - `src/products/erp/backend/features/modulos/controllers/ecommerce/query/controller.ts`
- Para `options` de slicer, a fonte principal e:
  - `src/products/erp/backend/features/modulos/controllers/ecommerce/options/controller.ts`
- `queryCatalog.ts` e referencia geral; hoje ele lista apenas `ecommerce.pedidos` no catalogo principal.
- Para dashboards ecommerce completos (pedidos, itens, pagamentos, envios, taxas, payouts, estoque), seguir a whitelist do controller.
- Se houver conflito entre catalogo e controller, seguir controller e explicitar o ajuste.

## Schema e Tabelas

### Integracao
- `ecommerce.canais_contas`
- `ecommerce.canais_credenciais`
- `ecommerce.sync_jobs`
- `ecommerce.sync_cursores`
- `ecommerce.webhook_eventos`
- `ecommerce.raw_api_payloads`

### Cadastros
- `ecommerce.lojas`
- `ecommerce.clientes`
- `ecommerce.enderecos`
- `ecommerce.produtos`
- `ecommerce.produto_variantes`
- `ecommerce.listings`
- `ecommerce.listing_variantes`

### Operacao e Financeiro
- `ecommerce.pedidos`
  - colunas-chave: `plataforma`, `canal_conta_id`, `loja_id`, `cliente_id`, `status`, `status_pagamento`, `status_fulfillment`, `valor_total`, `valor_pago`, `valor_reembolsado`, `valor_liquido_estimado`, `data_pedido`
- `ecommerce.pedido_itens`
  - colunas-chave: `pedido_id`, `produto_id`, `produto_variante_id`, `quantidade`, `preco_unitario`, `valor_total`
- `ecommerce.pagamentos`
  - colunas-chave: `pedido_id`, `status`, `metodo`, `provedor`, `valor_autorizado`, `valor_capturado`, `valor_taxa`, `valor_liquido`
- `ecommerce.transacoes_pagamento`
- `ecommerce.envios`
- `ecommerce.eventos_fulfillment`
- `ecommerce.devolucoes`
- `ecommerce.reembolsos`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`
- `ecommerce.payout_itens`

### Estoque
- `ecommerce.estoque_saldos`
- `ecommerce.estoque_movimentacoes`

## Models Suportados no Query BI
- `ecommerce.pedidos`
- `ecommerce.pedido_itens`
- `ecommerce.pagamentos`
- `ecommerce.envios`
- `ecommerce.taxas_pedido`
- `ecommerce.payouts`
- `ecommerce.estoque_saldos`

## Medidas Principais
- `SUM(valor_total)` (GMV)
- `COUNT()` (pedidos/transacoes/envios)
- `AVG(valor_total)` (ticket medio)
- `SUM(valor_liquido_estimado)`
- `SUM(valor_reembolsado)`
- `SUM(taxa_total)`
- `CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END` (fee rate)
- `SUM(valor_liquido)` (payout liquido)
- `SUM(quantidade_disponivel)` (estoque)

## Dimensoes Principais
- `plataforma`
- `canal_conta`
- `loja`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto`
- `categoria`
- `transportadora`
- `mes` / `periodo`

## Filtros Suportados
- `tenant_id`
- `de`, `ate`
- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`
- `categoria`
- `valor_min`, `valor_max`

## Options (slicers)
Campos de options suportados:
- `plataforma`
- `canal_conta_id`
- `loja_id`
- `status`
- `status_pagamento`
- `status_fulfillment`
- `produto_id`
- `categoria`

Suporta cascata com `dependsOn`/`contextFilters`.

## Regras Operacionais
- Nao misturar granularidade sem explicitar (pedido vs item vs pagamento vs payout).
- Nao inventar model/measure/dimension fora do controller.
- Quando houver divergencia do pedido com o schema real, aplicar ajuste compativel e explicitar.
