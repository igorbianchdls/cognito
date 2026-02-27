# ERP Skill (Tabelas, Dimensoes e Metricas)

Objetivo: orientar escolha correta de `model`, medidas, dimensoes e filtros do ERP para analytics/BI.

Use este skill quando o pedido envolver:
- quais tabelas usar por modulo ERP
- quais dimensoes e metricas existem no catalogo
- quais filtros sao suportados em `dataQuery`
- mapeamento de pergunta de negocio para `model/dimension/measure/filters`

Nao use este skill para layout/JSON de dashboard.
Para isso, use `dashboard.md`.

## Fronteira de Responsabilidade (Obrigatoria)
- Este skill define apenas:
  - `model`
  - `measure`
  - `dimension`
  - `filters`
- Este skill nao define:
  - estrutura JSON Render
  - componentes visuais (`Theme`, `Header`, `KPI`, charts, `SlicerCard`, `AISummary`)
  - caminho de arquivo de artifact

Quando o pedido for "criar dashboard":
1. Primeiro, usar este skill para mapear o contrato de dados.
2. Depois, obrigatoriamente passar para `dashboard.md` para gerar JSONR final.

Nao gerar payload BI generico final (ex.: `kpiRow/charts/tables`) como artefato de dashboard.

## Fonte de Verdade
- `src/products/bi/shared/queryCatalog.ts`
- `GET /api/modulos/query/catalog`
- `GET /api/modulos/query/catalog?module=<modulo>`
- `GET /api/modulos/query/catalog?table=<tabela>`

## Escopo deste Skill
- `vendas`, `compras`, `financeiro`, `contabilidade`, `crm`, `estoque`

Fora do escopo deste skill:
- Marketing pago (`trafegopago`) -> usar `marketingSkill.md`
- Ecommerce (`ecommerce.*`) -> usar `ecommerceSkill.md`

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
- Metricas comuns: `SUM(valor_liquido)`/`SUM(valor)`, `COUNT()`
- Dimensoes comuns: `fornecedor`, `centro_custo`, `departamento`, `filial`, `projeto`, `categoria_despesa`, `status`, `periodo`

- `financeiro.contas_receber`
- Metricas comuns: `SUM(valor_liquido)`/`SUM(valor)`, `COUNT()`
- Dimensoes comuns: `cliente`, `centro_lucro`, `departamento`, `filial`, `projeto`, `categoria_receita`, `status`, `periodo`

### Contabilidade
- `contabilidade.lancamentos_contabeis`
- Metricas comuns: `SUM(total_debitos)`, `SUM(total_creditos)`, `SUM(total_debitos - total_creditos)`, `COUNT()`
- Dimensoes comuns: `origem`, `numero_documento`, `historico`, `periodo`
- Filtros comuns: `de`, `ate`, `origem`

- `contabilidade.lancamentos_contabeis_linhas`
- Metricas comuns: `SUM(debito)`, `SUM(credito)`, `SUM(debito - credito)`, `COUNT()`, `COUNT_DISTINCT(lancamento_id)`, `COUNT_DISTINCT(conta_id)`
- Dimensoes comuns: `conta`, `codigo_conta`, `tipo_conta`, `origem`, `periodo`
- Filtros comuns: `de`, `ate`, `origem`, `conta_id`, `tipo_conta`

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
- Regra: tratar como snapshot de saldo atual (nao historico transacional).

- `estoque.movimentacoes`
- Metricas comuns: `SUM(quantidade)`, `SUM(valor_total)`, `COUNT()`
- Dimensoes comuns: `produto`, `almoxarifado`, `tipo_movimento`, `natureza`, `periodo`
- Filtros comuns: `de`, `ate`, `produto_id`, `almoxarifado_id`, `tipo_movimento`

## Regras Operacionais
- Nunca inventar `model`, `measure`, `dimension` ou `filter` fora do catalogo.
- Quando houver divergencia com o pedido do usuario, usar alternativa suportada mais proxima e explicitar ajuste.
- Sempre validar no catalogo antes de montar `dataQuery` final.

## Handoff Obrigatorio para Dashboard Skill
Quando concluir o mapeamento de dados para dashboard, entregar para `dashboard.md`:
- `targetPath`: `/vercel/sandbox/dashboard/<nome>.jsonr`
- `format`: JSONR (arvore `type/props/children`, raiz `Theme`)
- lista validada de:
  - `model`
  - `measure`
  - `dimension`
  - `filters`

Nunca sugerir `/vercel/sandbox/dashboards` (plural).
