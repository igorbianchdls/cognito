# Dashboard Skill (JSON Render + ERP BI)

Objetivo: criar e editar dashboards .jsonr de Vendas, Compras, Financeiro, CRM e Estoque com alta precisao funcional, boa UX e queries compativeis com o backend.

Este skill e obrigatorio para pedidos envolvendo: dashboard, KPI, grafico, filtro, tema, layout, dataQuery, drill, interacao de chart, apps /apps e artefatos JSON Render.

## Principios Nao Negociaveis
- Catalog-first: nunca inventar tabela, medida, dimensao, filtro ou data field.
- Contrato atual e dataQuery (nao SQL puro dentro do JSON).
- Responder com estrutura JSON valida e operacional.
- Priorizar corretude dos dados antes de refinamento visual.
- Evitar mudancas fora do escopo pedido.

## Fonte de Verdade (sempre consultar)
- GET /api/modulos/query/catalog
- GET /api/modulos/query/catalog?module=vendas|compras|financeiro|crm|estoque
- GET /api/modulos/query/catalog?table=<tabela> ou ?model=<model>

Use o catalogo para:
- confirmar model canonico
- escolher metricas permitidas (legacyMeasures)
- escolher dimensoes permitidas
- escolher filtros permitidos
- escolher defaultTimeField

Se houver divergencia entre pedido e catalogo: seguir catalogo e explicar ajuste.

## Escopo ERP Suportado (atual)
- vendas.pedidos
- compras.compras
- compras.recebimentos
- financeiro.contas_pagar
- financeiro.contas_receber
- crm.oportunidades
- crm.leads
- estoque.estoques_atual
- estoque.movimentacoes

## Funcionamento por Modelo (campos e uso)

### CRM
- crm.oportunidades
  - metricas comuns: SUM(valor_estimado), COUNT(), AVG(valor_estimado)
  - dimensoes comuns: vendedor, fase, origem, conta, status, periodo
  - filtros comuns: de, ate, status, vendedor_id, fase_pipeline_id, origem_id, conta_id, valor_min, valor_max
- crm.leads
  - metricas comuns: COUNT()
  - dimensoes comuns: origem, responsavel, empresa, status, periodo
  - filtros comuns: de, ate, status, origem_id, responsavel_id

### Estoque
- estoque.estoques_atual (snapshot de saldo atual)
  - metricas comuns: SUM(quantidade), SUM(valor_total), COUNT_DISTINCT(produto_id)
  - dimensoes comuns: produto, almoxarifado, periodo
  - filtros comuns: produto_id, almoxarifado_id
  - regra critica: nao tratar de/ate como historico de saldo; e snapshot do estado atual
- estoque.movimentacoes
  - metricas comuns: SUM(quantidade), SUM(valor_total), COUNT()
  - dimensoes comuns: produto, almoxarifado, tipo_movimento, natureza, periodo
  - filtros comuns: de, ate, produto_id, almoxarifado_id, tipo_movimento

## Contrato de Query (obrigatorio)
- Sempre usar dataQuery com:
  - model (obrigatorio)
  - measure (obrigatorio)
  - dimension (opcional; nao usar em KPI agregado)
  - filters (obrigatorio em cenarios reais)
  - orderBy, limit (quando fizer sentido)
  - dimensionExpr (somente quando necessario)
- Nunca usar SQL puro no JSON.
- Em KPI agregado: sem dimension.
- Em chart segmentado: dimension + measure.
- Para serie temporal: preferir dimension = "periodo" quando suportado.
- dimensionExpr e ultima opcao.

## Regras de Filtros
- Incluir filters.tenant_id quando o model suportar tenant_id no catalogo.
- Quando houver analise temporal:
  - usar filters.de e filters.ate
  - manter coerencia com datePicker (filters.dateRange no estado)
- Para recortes de negocio, usar *_id conforme catalogo (ex.: filial_id, categoria_receita_id etc.).
- Nao inventar filtro fora do catalogo.
- Excecao importante de estoque:
  - em estoque.estoques_atual, nao forcar de/ate para saldo atual (snapshot)
  - em estoque.movimentacoes, usar de/ate normalmente

## Estrutura JSON Render (padrao recomendado)
1. Theme na raiz (sempre)
2. Header no topo
3. Linha de KPIs principais
4. Linha de filtros (SlicerCard)
5. Linhas de distribuicao (Bar/Pie)
6. Linhas de tendencia temporal (Line/Bar)

Padroes:
- Theme.props.name e Theme.props.headerTheme sempre definidos.
- Header com datePicker quando houver serie temporal.
- Div com childGrow=true para grids fluidos.
- Evitar containers redundantes.

## Componentes e Boas Praticas

### KPI
- Uso: total, contagem, ticket, saldo, valor medio.
- dataQuery sem dimension.
- format coerente (currency/number/percent).

### BarChart / PieChart / LineChart
- Bar/Pie: comparacao por dimensao de negocio.
- Line: evolucao temporal.
- limit padrao de 5-12 conforme caso.
- orderBy normalmente por measure desc (ranking) ou dimension asc (serie temporal).

### SlicerCard
- Preferir source.type = "options" com model + field.
- Evitar URLs hardcoded.
- Para filtros de alto impacto: usar tile-multi ou list com selectAll e search.

### Header
- Usar datePicker visivel quando dashboard for temporal.
- storePath padrao: filters.dateRange.

## Interacoes de Charts (padrao atual)
- Charts podem agir como filtro global via interaction.clickAsFilter.
- Para dimensoes de negocio, definir explicitamente:
  - interaction.filterField
  - interaction.storePath (ex.: filters.cliente_id)
- clearOnSecondClick geralmente true.
- Em chart com drill, definir claramente se clique tambem filtra:
  - interaction.alsoWithDrill (quando aplicavel).

## Drill (quando usar)
- Usar apenas quando ha narrativa hierarquica clara (ex.: filial -> cliente -> vendedor).
- Cada nivel deve ter:
  - label
  - dimension (ou dimensionExpr)
  - filterField (recomendado explicito)
- Nao aplicar drill por padrao em todos os graficos.

## Mapeamento de Negocio -> Query (heuristicas praticas)

### Vendas
- Faturamento por dimensao: preferir SUM(itens.subtotal) quando permitido.
- Faturamento de pedido (KPI): SUM(p.valor_total) quando permitido.
- Pedidos: COUNT()
- Ticket medio: AVG(p.valor_total) quando permitido.

### Compras
- Gasto total: SUM(c.valor_total) quando permitido.
- Ticket medio compras: AVG(c.valor_total) quando permitido.
- Pedidos: COUNT() ou COUNT_DISTINCT(id) conforme catalogo.

### Financeiro
- AP/AR valor total: SUM(valor_liquido) (ou alias permitido no catalogo).
- Titulos: COUNT()
- Dimensoes comuns: categoria, centro, filial, unidade, projeto, status.

### CRM
- Pipeline: SUM(valor_estimado) em crm.oportunidades.
- Oportunidades: COUNT() em crm.oportunidades.
- Leads: COUNT() em crm.leads.
- Conversao: combinar KPI de vendas/oportunidades com total de leads.
- Dimensoes comuns: vendedor, fase, origem, conta, status, periodo.

### Estoque
- Saldo atual: usar estoque.estoques_atual (quantidade e valor em estoque).
- Giro/movimento no periodo: usar estoque.movimentacoes com de/ate.
- Entradas/saidas: agrupar por tipo_movimento ou natureza em estoque.movimentacoes.
- Dimensoes comuns: produto, almoxarifado, tipo_movimento, natureza, periodo.

Sempre validar no catalogo antes de fixar medida final.

## Processo Obrigatorio (execucao)
1. Entender objetivo do usuario (pergunta de negocio).
2. Identificar modulo(s) e periodo.
3. Consultar catalogo do modulo/tabela.
4. Mapear KPIs e charts necessarios.
5. Definir layout (KPI -> filtros -> distribuicao -> tendencia).
6. Montar dataQuery de cada bloco com tenant_id e periodo.
7. Configurar interacoes/filtros (Slicer + clickAsFilter/drill se aplicavel).
8. Revisar consistencia de formatos, titulos e limites.
9. Validar JSON final.
10. Entregar resposta objetiva com o .jsonr final.

## When User Asks "crie um dashboard completo"
Sem clarificacao extensa, assumir baseline:
- 3 a 5 KPIs
- 1 linha de filtros principais
- 2 a 4 charts de distribuicao
- 1 ou 2 charts de tendencia temporal
- tema padrao consistente

Fazer no maximo 1 pergunta de clarificacao se faltar algo critico:
- modulo principal
- periodo alvo
- objetivo principal (receita, margem, inadimplencia, compras etc.)

## Anti-Erros (proibido)
- Misturar measure de uma tabela com dimension de outra.
- Omitir tenant_id.
- Usar dimension em KPI agregado.
- Usar campo/measure nao existente no catalogo.
- Entregar JSON invalido.
- Responder com pseudo-SQL em vez de dataQuery.
- Ignorar filtros de periodo quando pedido e temporal.
- Tratar estoque.estoques_atual como serie historica de saldo por de/ate.

## Checklist Final (obrigatorio)
- JSON valido.
- Theme na raiz.
- Header coerente com periodo.
- Todos dataQuery com model valido.
- Measure valida para cada model.
- Dimension valida (ou ausente em KPI).
- filters.tenant_id presente quando suportado pelo model.
- filtros de periodo coerentes (de/ate) quando aplicavel.
- interaction/drill coerentes e sem conflito.
- Sem SQL puro no JSON.

## Snippet Base (referencia rapida)
```json
[
  {
    "type": "Theme",
    "props": { "name": "light", "headerTheme": "light", "managers": {} },
    "children": [
      {
        "type": "Header",
        "props": {
          "title": "Dashboard",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "storePath": "filters.dateRange",
            "actionOnChange": { "type": "refresh_data" }
          }
        }
      }
    ]
  }
]
```

Se houver erro de execucao de query, corrigir com base no catalogo (nunca tentativa cega com campos inventados).

