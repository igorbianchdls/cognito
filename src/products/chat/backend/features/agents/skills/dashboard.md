# Dashboard Skill (JSONR + Query-First)

Objetivo: gerar dashboard JSONR valido e renderizavel, usando SQL puro em `dataQuery.query`.

## Escopo

Use este skill para:
- criar/editar/corrigir dashboard JSONR
- montar Theme/Header/Div/KPI/Charts/SlicerCard/AISummary
- produzir estrutura final em arquivo `.jsonr`

Nao use este skill para inventar schema de negocio.
Para semantica de dados por dominio, usar:
- `erpSkill.md`
- `ecommerceSkill.md`
- `marketingSkill.md`

## Contrato Nao Negociavel

1. Output final: arvore JSONR (`type`, `props`, `children`).
2. Primeiro node: `Theme`.
3. Caminho obrigatorio: `/vercel/sandbox/dashboard/<nome>.jsonr`.
4. Nunca usar `/vercel/sandbox/dashboards`.
5. Todo KPI/Chart com dados deve usar `dataQuery`.
6. Padrao principal de dados: `dataQuery.query` (SQL puro).
7. Para Chart, informar `xField` e `yField` (e `keyField` quando houver).
8. So usar props suportadas no catalogo do renderer.

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
    "yField": "value",
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
- `model/measure/dimension` existe apenas como fallback tecnico.
- Sempre preferir query pura.

## Regras de Qualidade SQL

- Tipar placeholders (`::date`, `::int`, `::text`) para evitar erro de tipo no Postgres.
- Nao usar `to_jsonb(src)->>'campo'` quando coluna real existe.
- Evitar joins sem uso.
- Garantir alias coerentes com `xField/yField/keyField`.

## Template Minimo Valido

```json
[
  {
    "type": "Theme",
    "props": { "name": "light", "managers": {} },
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
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "childGrow": true },
        "children": [
          {
            "type": "KPI",
            "props": {
              "title": "Receita",
              "format": "currency",
              "dataQuery": {
                "query": "SELECT COALESCE(SUM(src.valor_total),0)::float AS value FROM vendas.pedidos src WHERE src.tenant_id={{tenant_id}}::int",
                "yField": "value",
                "filters": {}
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
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
          }
        ]
      }
    ]
  }
]
```

## Checklist Antes de Entregar

- JSONR valido (sem chave desconhecida).
- SQL valido para o dominio escolhido.
- `xField/yField/keyField` batem com aliases do SELECT.
- Filtros em `SlicerCard` apontam para campos reais (`*_id` quando aplicavel).
- Sem caminho errado de arquivo.
