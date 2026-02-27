# Dashboard Skill (JSON Render Canonico)

Objetivo: gerar dashboard JSONR valido, completo e renderizavel sem campos inventados.

Use este skill quando o pedido envolver:
- criar, editar ou corrigir dashboard
- layout e componentes JSON Render
- output final em arquivo `.jsonr`

Nao use este skill para decidir schema de negocio.
Para contrato de dados, usar primeiro:
- `erpSkill.md`
- `marketingSkill.md`
- `ecommerceSkill.md`

## Contrato Nao Negociavel

1. Output final obrigatorio: arvore JSON Render (lista de nodes com `type/props/children`).
2. Primeiro node obrigatorio: `Theme`.
3. Caminho obrigatorio: `/vercel/sandbox/dashboard/<nome>.jsonr`.
4. Pasta proibida: `/vercel/sandbox/dashboards`.
5. Extensao obrigatoria: `.jsonr`.
6. Nao usar payload BI generico (`kpiRow`, `charts`, `tables`, `slicers`, `dataSources`, `metadata`) como formato final.
7. Cada bloco com query deve usar `dataQuery`.
8. `dataQuery.model` e `dataQuery.measure` sao obrigatorios.
9. So usar props suportadas no renderer/catalogo.
10. Em erro `unrecognized_keys`, remover a chave invalida e usar alternativa suportada.

## Componentes Base (Allowlist)

- `Theme`
- `Header`
- `Div`
- `KPI`
- `SlicerCard`
- `BarChart`
- `LineChart`
- `PieChart`
- `AISummary`

Se precisar outro componente, validar antes em:
- `src/products/bi/json-render/catalog.ts`

## Contrato de DataQuery

`dataQuery` valido:
- `model`: string obrigatoria
- `measure`: string obrigatoria
- `dimension`: string opcional
- `dimensionExpr`: string opcional
- `filters`: objeto opcional
- `orderBy`: opcional
- `limit`: opcional

Regras:
- KPI agregado: normalmente sem `dimension`.
- Ranking: `orderBy.field = "measure"` e `dir = "desc"`.
- Serie temporal: `orderBy.field = "dimension"` e `dir = "asc"`.
- Nao inventar `model/measure/dimension/filter` fora do controller/catalogo.

## Exemplo 1 (Dashboard Marketing Completo)

Arquivo esperado: `/vercel/sandbox/dashboard/metaads-completo.jsonr`

```json
[
  {
    "type": "Theme",
    "props": {
      "name": "light",
      "managers": {
        "border": {
          "style": "solid",
          "width": 1,
          "color": "#bfc9d9",
          "radius": 10
        },
        "color": {
          "scheme": ["#1877F2", "#00B2FF", "#34D399", "#F59E0B", "#EF4444"]
        }
      }
    },
    "children": [
      {
        "type": "Header",
        "props": {
          "title": "Dashboard Meta Ads",
          "subtitle": "Performance por conta, campanha, grupo e anuncio",
          "align": "center",
          "controlsPosition": "right",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "position": "right",
            "storePath": "filters.dateRange",
            "actionOnChange": { "type": "refresh_data" }
          }
        }
      },
      {
        "type": "Div",
        "props": {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "wrap": true,
          "childGrow": true
        },
        "children": [
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro de Contas",
              "fields": [
                {
                  "label": "Conta",
                  "type": "list",
                  "storePath": "filters.conta_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "trafegopago.desempenho_diario",
                    "field": "conta_id",
                    "pageSize": 50
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro de Campanhas",
              "fields": [
                {
                  "label": "Campanha",
                  "type": "list",
                  "storePath": "filters.campanha_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "trafegopago.desempenho_diario",
                    "field": "campanha_id",
                    "pageSize": 100,
                    "dependsOn": ["filters.conta_id"]
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro de Grupos",
              "fields": [
                {
                  "label": "Grupo",
                  "type": "list",
                  "storePath": "filters.grupo_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "trafegopago.desempenho_diario",
                    "field": "grupo_id",
                    "pageSize": 100,
                    "dependsOn": ["filters.conta_id", "filters.campanha_id"]
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro de Anuncios",
              "fields": [
                {
                  "label": "Anuncio",
                  "type": "list",
                  "storePath": "filters.anuncio_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "trafegopago.desempenho_diario",
                    "field": "anuncio_id",
                    "pageSize": 100,
                    "dependsOn": ["filters.conta_id", "filters.campanha_id", "filters.grupo_id"]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Gasto",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Receita Atribuida",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(receita_atribuida)",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "ROAS",
              "format": "number",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "CTR",
              "format": "percent",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" }
              }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "LineChart",
            "props": {
              "fr": 2,
              "title": "Gasto por Mes",
              "height": 240,
              "format": "currency",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "dimension": "mes",
                "measure": "SUM(gasto)",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" },
                "orderBy": { "field": "dimension", "dir": "asc" },
                "limit": 12
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Campanhas",
              "height": 240,
              "format": "currency",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "dimension": "campanha",
                "measure": "SUM(gasto)",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 10
              }
            }
          },
          {
            "type": "PieChart",
            "props": {
              "fr": 1,
              "title": "Gasto por Conta",
              "height": 240,
              "format": "currency",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "dimension": "conta",
                "measure": "SUM(gasto)",
                "filters": { "plataforma": "meta_ads", "nivel": "campaign" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 8
              }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "AISummary",
            "props": {
              "fr": 1,
              "title": "Insights da IA",
              "containerStyle": { "padding": "12px 12px 16px 12px" },
              "itemTextStyle": { "padding": "0 8px" },
              "items": [
                { "icon": "trendingUp", "text": "ROAS melhorou nas contas com CTR crescente." },
                { "icon": "sparkles", "text": "Campanhas top concentram a maior parte do gasto." },
                { "icon": "triangleAlert", "text": "Grupos com alto CPC e baixa conversao pedem ajuste." }
              ]
            }
          }
        ]
      }
    ]
  }
]
```

## Exemplo 2 (Dashboard Ecommerce Completo)

Arquivo esperado: `/vercel/sandbox/dashboard/shopify-completo.jsonr`

```json
[
  {
    "type": "Theme",
    "props": {
      "name": "light",
      "managers": {
        "border": {
          "style": "solid",
          "width": 1,
          "color": "#bfc9d9",
          "radius": 10
        },
        "color": {
          "scheme": ["#95BF47", "#5E8E3E", "#008060", "#38BDF8", "#F59E0B"]
        }
      }
    },
    "children": [
      {
        "type": "Header",
        "props": {
          "title": "Dashboard Shopify",
          "subtitle": "Vendas, financeiro, logistica e estoque",
          "align": "center",
          "controlsPosition": "right",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "position": "right",
            "storePath": "filters.dateRange",
            "actionOnChange": { "type": "refresh_data" }
          }
        }
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro Plataforma",
              "fields": [
                {
                  "label": "Plataforma",
                  "type": "list",
                  "storePath": "filters.plataforma",
                  "clearable": true,
                  "source": {
                    "type": "static",
                    "options": [
                      { "value": "shopify", "label": "Shopify" },
                      { "value": "amazon", "label": "Amazon" },
                      { "value": "mercadolivre", "label": "Mercado Livre" },
                      { "value": "shopee", "label": "Shopee" }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro Conta",
              "fields": [
                {
                  "label": "Conta",
                  "type": "list",
                  "storePath": "filters.canal_conta_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "ecommerce.pedidos",
                    "field": "canal_conta_id",
                    "pageSize": 80,
                    "dependsOn": ["filters.plataforma"]
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Filtro Loja",
              "fields": [
                {
                  "label": "Loja",
                  "type": "list",
                  "storePath": "filters.loja_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "ecommerce.pedidos",
                    "field": "loja_id",
                    "pageSize": 80,
                    "dependsOn": ["filters.plataforma", "filters.canal_conta_id"]
                  }
                }
              ]
            }
          },
          {
            "type": "SlicerCard",
            "props": {
              "fr": 1,
              "title": "Status do Pedido",
              "fields": [
                {
                  "label": "Status",
                  "type": "list",
                  "storePath": "filters.status",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "ecommerce.pedidos",
                    "field": "status",
                    "pageSize": 40,
                    "dependsOn": ["filters.plataforma", "filters.canal_conta_id", "filters.loja_id"]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "GMV",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "SUM(valor_total)", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Pedidos",
              "format": "number",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "COUNT()", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Ticket Medio",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "AVG(valor_total)", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Clientes Unicos",
              "format": "number",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "COUNT_DISTINCT(cliente_id)", "filters": { "plataforma": "shopify" } }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Receita Liquida Est.",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "SUM(valor_liquido_estimado)", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Reembolsos",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "SUM(valor_reembolsado)", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Taxas",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.pedidos", "measure": "SUM(taxa_total)", "filters": { "plataforma": "shopify" } }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Payout Liquido",
              "format": "currency",
              "borderless": true,
              "dataQuery": { "model": "ecommerce.payouts", "measure": "SUM(valor_liquido)", "filters": { "plataforma": "shopify" } }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "LineChart",
            "props": {
              "fr": 2,
              "title": "GMV por Mes",
              "height": 240,
              "format": "currency",
              "dataQuery": {
                "model": "ecommerce.pedidos",
                "dimension": "mes",
                "measure": "SUM(valor_total)",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "dimension", "dir": "asc" },
                "limit": 18
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "GMV por Loja",
              "height": 240,
              "format": "currency",
              "dataQuery": {
                "model": "ecommerce.pedidos",
                "dimension": "loja",
                "measure": "SUM(valor_total)",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 10
              }
            }
          },
          {
            "type": "PieChart",
            "props": {
              "fr": 1,
              "title": "Status Pagamento",
              "height": 240,
              "format": "number",
              "dataQuery": {
                "model": "ecommerce.pedidos",
                "dimension": "status_pagamento",
                "measure": "COUNT()",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 8
              }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Produtos por Receita",
              "height": 220,
              "format": "currency",
              "dataQuery": {
                "model": "ecommerce.pedido_itens",
                "dimension": "produto",
                "measure": "SUM(valor_total)",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 12
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Envios por Transportadora",
              "height": 220,
              "format": "number",
              "dataQuery": {
                "model": "ecommerce.envios",
                "dimension": "transportadora",
                "measure": "COUNT()",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "measure", "dir": "desc" },
                "limit": 8
              }
            }
          },
          {
            "type": "LineChart",
            "props": {
              "fr": 1,
              "title": "Estoque Disponivel por Mes",
              "height": 220,
              "format": "number",
              "dataQuery": {
                "model": "ecommerce.estoque_saldos",
                "dimension": "mes",
                "measure": "SUM(quantidade_disponivel)",
                "filters": { "plataforma": "shopify" },
                "orderBy": { "field": "dimension", "dir": "asc" },
                "limit": 18
              }
            }
          }
        ]
      },
      {
        "type": "Div",
        "props": { "direction": "row", "gap": 12, "padding": 16, "wrap": true, "childGrow": true },
        "children": [
          {
            "type": "AISummary",
            "props": {
              "fr": 1,
              "title": "Insights da IA",
              "containerStyle": { "padding": "12px 12px 16px 12px" },
              "itemTextStyle": { "padding": "0 8px" },
              "items": [
                { "icon": "trendingUp", "text": "GMV cresce com melhor ticket medio em contas premium." },
                { "icon": "sparkles", "text": "Receita liquida segue forte quando reembolso fica controlado." },
                { "icon": "triangleAlert", "text": "Frete e taxas podem comprimir margem em picos sazonais." }
              ]
            }
          }
        ]
      }
    ]
  }
]
```

## Exemplo 3 (Invalido e Correcao)

Invalido (nao pode):
```json
{
  "id": "dash-vendas",
  "kpiRow": [],
  "charts": []
}
```

Por que invalido:
- nao e arvore JSON Render
- nao comeca com `Theme`
- formato BI generico proibido

Correto (formato aceito):
```json
[
  {
    "type": "Theme",
    "props": { "name": "light", "managers": {} },
    "children": []
  }
]
```

## Fluxo Obrigatorio de Execucao

1. Ler pedido e identificar dominio (ERP/Marketing/Ecommerce).
2. Validar `model/measure/dimension/filters` com skill de dominio.
3. Montar JSONR no formato canonico deste arquivo.
4. Validar componente por componente contra catalogo.
5. Salvar em `/vercel/sandbox/dashboard/<nome>.jsonr`.
6. Revisar checklist final antes de responder.

## Checklist Final (Obrigatorio)

- JSON valido.
- Primeiro node e `Theme`.
- Arquivo em `/vercel/sandbox/dashboard/*.jsonr`.
- Nao existe `/vercel/sandbox/dashboards`.
- Nao existe payload generico (`kpiRow/charts/tables/slicers`).
- `dataQuery.model` e `dataQuery.measure` presentes em todos os blocos com query.
- Filtros em cards separados quando houver multiplos filtros.
- `AISummary` com espaco lateral e inferior suficiente (padding).
