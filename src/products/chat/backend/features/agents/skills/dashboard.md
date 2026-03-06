# Dashboard Skill (DSL + Query-First)

Objetivo: gerar dashboard DSL valido e renderizavel, usando SQL puro em `dataQuery.query`.

## Escopo

Use este skill para:
- criar/editar/corrigir dashboard DSL
- montar Theme/Header/Div/KPI/Charts/SlicerCard/AISummary
- produzir estrutura final em arquivo `.dsl`

Nao use este skill para inventar schema de negocio.
Para semantica de dados por dominio, usar:
- `vendasSkill.md`
- `comprasSkill.md`
- `financeiroSkill.md`
- `ecommerceSkill.md`
- `marketingSkill.md`

## Contrato Nao Negociavel

1. Output final: arquivo DSL com raiz `<dashboard-template>` e componentes em tags.
2. Primeiro node: `Theme`.
3. Caminho obrigatorio: `/vercel/sandbox/dashboard/<nome>.dsl`.
4. Nunca usar `/vercel/sandbox/dashboards`.
5. Todo KPI/Chart com dados deve usar `dataQuery`.
6. Padrao principal de dados: `dataQuery.query` (SQL puro).
7. Para Chart, informar `xField` e `yField` (e `keyField` quando houver).
8. Para KPI query-first, a query deve retornar coluna numerica com alias `value` (sem `xField/yField/keyField`).
9. So usar props suportadas no catalogo do renderer.

## Componentes Permitidos

- `Theme`
- `Header`
- `Div`
- `KPI`
- `BarChart`
- `LineChart`
- `PieChart`
- `SlicerCard`
- `AISummary`

## Contrato DataQuery (Padrao)

KPI:

```json
{
  "dataQuery": {
    "query": "SELECT ... AS value",
    "filters": {}
  }
}
```

Chart:

```json
{
  "dataQuery": {
    "query": "SELECT ... AS key, ... AS label, ... AS value",
    "xField": "label",
    "yField": "value",
    "keyField": "key",
    "filters": {},
    "limit": 10
  }
}
```

Compatibilidade:
- Sem fallback legado para KPI/Chart.
- Sempre usar query pura em `dataQuery.query`.

## Regras de Qualidade SQL

- Tipar placeholders (`::date`, `::int`, `::text`) para evitar erro de tipo no Postgres.
- Nao usar `to_jsonb(src)->>'campo'` quando coluna real existe.
- Evitar joins sem uso.
- Garantir alias coerentes: KPI = `value`; Chart = `key/label/value` + `xField/yField/keyField`.
- Usar somente nomes fisicos (schema/tabela/campo) que existam na skill de dominio e no template oficial.
- Nunca inferir nome fisico a partir de rotulo semantico (cliente/vendedor/canal/etc.).
- `payload.query` é armazenado no DSL e executado no runtime do dashboard; para teste ad-hoc de SQL, usar `sql_execution`.

## Template Minimo Valido

```xml
<dashboard-template name="dashboard_exemplo">
  <theme>
    <props>
      { "name": "light", "managers": {} }
    </props>
    <header>
      <props>
        {
          "title": "Dashboard",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "storePath": "filters.dateRange",
            "actionOnChange": { "type": "refresh_data" }
          }
        }
      </props>
    </header>
    <div>
      <props>
        { "direction": "row", "gap": 12, "padding": 16, "childGrow": true }
      </props>
      <kpi>
        <props>
          {
            "title": "Receita",
            "format": "currency",
            "dataQuery": {
              "query": "SELECT COALESCE(SUM(src.valor_total),0)::float AS value FROM vendas.pedidos src WHERE src.tenant_id={{tenant_id}}::int",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <bar-chart>
        <props>
          {
            "title": "Top Canais",
            "format": "currency",
            "height": 220,
            "dataQuery": {
              "query": "SELECT cv.id AS key, COALESCE(cv.nome,'-') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value FROM vendas.pedidos src JOIN vendas.pedidos_itens pi ON pi.pedido_id=src.id LEFT JOIN vendas.canais_venda cv ON cv.id=src.canal_venda_id WHERE src.tenant_id={{tenant_id}}::int GROUP BY 1,2 ORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 10
            }
          }
        </props>
      </bar-chart>
    </div>
  </theme>
</dashboard-template>
```

## Checklist Antes de Entregar

- DSL valido (sem chave desconhecida).
- SQL valido para o dominio escolhido.
- KPI: query retorna alias `value`; Chart: `xField/yField/keyField` batem com aliases do SELECT.
- Filtros em `SlicerCard` apontam para campos reais (`*_id` quando aplicavel).
- Sem caminho errado de arquivo.
