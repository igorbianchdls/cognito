# ERP Skill (Tabelas, Dimensoes e Metricas)

Objetivo: orientar escolha correta de `model`, medidas, dimensoes e filtros do ERP para analytics/BI.

Use este skill quando o pedido envolver:
- quais tabelas usar por modulo
- quais dimensoes e metricas existem
- quais filtros sao suportados
- mapeamento de negocio para `dataQuery`

Nao use este skill para layout/JSON de dashboard.
Para isso, use `dashboard.md`.

## Fonte de Verdade
- `src/products/bi/shared/queryCatalog.ts`
- `GET /api/modulos/query/catalog`
- `GET /api/modulos/query/catalog?module=<modulo>`
- `GET /api/modulos/query/catalog?table=<tabela>`

## Modulos e Models Principais

### Vendas
- `vendas.pedidos`
- Metricas comuns: `SUM(itens.subtotal)`, `SUM(valor_total)`, `COUNT()`, `AVG(valor_total)`
- Dimensoes comuns: `cliente`, `canal_venda`, `vendedor`, `filial`, `unidade_negocio`, `categoria_receita`, `territorio`, `periodo`
- Filtros comuns: `de`, `ate`, `status`, `cliente_id`, `vendedor_id`, `canal_venda_id`, `filial_id`

### Compras
- `compras.compras`
- Metricas comuns: `SUM(valor_total)`, `AVG(valor_total)`, `COUNT()`, `COUNT_DISTINCT(fornecedor_id)`
- Dimensoes comuns: `fornecedor`, `centro_custo`, `filial`, `projeto`, `categoria_despesa`, `status`, `periodo`
- Filtros comuns: `de`, `ate`, `status`, `fornecedor_id`, `filial_id`, `valor_min`, `valor_max`

- `compras.recebimentos`
- Metricas comuns: `COUNT()`
- Dimensoes comuns: `status`, `periodo`
- Filtros comuns: `de`, `ate`, `status`

### Financeiro
- `financeiro.contas_pagar`
- Metricas comuns: `SUM(valor_liquido)`, `COUNT()`
- Dimensoes comuns: `fornecedor`, `centro_custo`, `departamento`, `filial`, `projeto`, `categoria_despesa`, `status`, `periodo`

- `financeiro.contas_receber`
- Metricas comuns: `SUM(valor_liquido)`, `COUNT()`
- Dimensoes comuns: `cliente`, `centro_lucro`, `departamento`, `filial`, `projeto`, `categoria_receita`, `status`, `periodo`

### Contabilidade
- `contabilidade.lancamentos_contabeis`
- Metricas comuns: `SUM(valor_debito)`, `SUM(valor_credito)`, `COUNT()`
- Dimensoes comuns: `filial`, `centro_custo`, `projeto`, `periodo`

- `contabilidade.lancamentos_contabeis_linhas`
- Metricas comuns: `SUM(valor)`, `COUNT()`
- Dimensoes comuns: `conta_contabil`, `natureza`, `filial`, `periodo`

### CRM
- `crm.oportunidades`
- Metricas comuns: `SUM(valor_estimado)`, `COUNT()`, `AVG(valor_estimado)`
- Dimensoes comuns: `vendedor`, `fase`, `origem`, `conta`, `status`, `periodo`
- Filtros comuns: `de`, `ate`, `status`, `vendedor_id`, `fase_pipeline_id`, `origem_id`, `conta_id`

- `crm.leads`
- Metricas comuns: `COUNT()`
- Dimensoes comuns: `origem`, `responsavel`, `empresa`, `status`, `periodo`
- Filtros comuns: `de`, `ate`, `status`, `origem_id`, `responsavel_id`

### Estoque
- `estoque.estoques_atual`
- Metricas comuns: `SUM(quantidade)`, `SUM(valor_total)`, `COUNT_DISTINCT(produto_id)`
- Dimensoes comuns: `produto`, `almoxarifado`, `periodo`
- Filtros comuns: `produto_id`, `almoxarifado_id`
- Regra: tratar como snapshot de saldo atual.

- `estoque.movimentacoes`
- Metricas comuns: `SUM(quantidade)`, `SUM(valor_total)`, `COUNT()`
- Dimensoes comuns: `produto`, `almoxarifado`, `tipo_movimento`, `natureza`, `periodo`
- Filtros comuns: `de`, `ate`, `produto_id`, `almoxarifado_id`, `tipo_movimento`

### Trafego Pago
- `trafegopago.desempenho_diario`
- Metricas comuns: `SUM(gasto)`, `SUM(receita_atribuida)`, `SUM(cliques)`, `SUM(impressoes)`, `SUM(conversoes)`, `SUM(leads)`, `ROAS`
- Dimensoes comuns: `plataforma`, `nivel`, `conta`, `campanha`, `grupo`, `anuncio`, `periodo`
- Filtros comuns: `de`, `ate`, `plataforma`, `nivel`, `conta_id`, `campanha_id`, `grupo_id`, `anuncio_id`

### Ecommerce
- `ecommerce.pedidos`, `ecommerce.pedido_itens`, `ecommerce.pagamentos`, `ecommerce.envios`, `ecommerce.taxas_pedido`, `ecommerce.payouts`, `ecommerce.estoque_saldos`
- Dimensoes comuns: `plataforma`, `canal_conta`, `loja`, `status`, `status_pagamento`, `status_fulfillment`, `produto`, `categoria`, `transportadora`, `periodo`
- Filtros comuns: `de`, `ate`, `plataforma`, `canal_conta_id`, `loja_id`, `status*`, `produto_id`, `categoria`, `valor_min`, `valor_max`

## Regras Operacionais
- Nunca inventar model, measure, dimension ou filtro fora do catalogo.
- Quando houver divergencia com pedido do usuario, usar alternativa mais proxima suportada e explicitar ajuste.
- Sempre validar no catalogo antes de montar `dataQuery` final.
