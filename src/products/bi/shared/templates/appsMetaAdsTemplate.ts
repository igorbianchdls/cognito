import { migrateTemplateTextDataQueries } from '@/products/bi/shared/templates/dataQuerySqlMigration'
export const APPS_METAADS_TEMPLATE_TEXT = migrateTemplateTextDataQueries(`[
  {
    "type": "Theme",
    "props": {
      "name": "light",
      "managers": {
        "border": {
          "style": "solid",
          "width": 1,
          "color": "#bfc9d9",
          "radius": 10,
          "frame": {
            "variant": "hud",
            "cornerSize": 8,
            "cornerWidth": 1
          }
        },
        "color": {
          "scheme": [
            "#1877F2",
            "#00B2FF",
            "#34D399",
            "#F59E0B",
            "#EF4444"
          ]
        }
      }
    },
    "children": [
      {
        "type": "Header",
        "props": {
          "title": "Dashboard Meta Ads",
          "subtitle": "Lumi Skin • Performance DTC (campanhas, grupos e anúncios)",
          "align": "center",
          "controlsPosition": "right",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "position": "right",
            "storePath": "filters.dateRange",
            "actionOnChange": {
              "type": "refresh_data"
            },
            "style": {
              "padding": 6,
              "fontFamily": "Barlow",
              "fontSize": 12
            }
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
          "childGrow": true,
          "justify": "start",
          "align": "start"
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
                    "limit": 50
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
                    "limit": 100,
                    "dependsOn": [
                      "filters.conta_id"
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
                    "limit": 100,
                    "dependsOn": [
                      "filters.conta_id",
                      "filters.campanha_id"
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
              "title": "Filtro de Anúncios",
              "fields": [
                {
                  "label": "Anúncio",
                  "type": "list",
                  "storePath": "filters.anuncio_id",
                  "search": true,
                  "selectAll": true,
                  "clearable": true,
                  "source": {
                    "type": "options",
                    "model": "trafegopago.desempenho_diario",
                    "field": "anuncio_id",
                    "limit": 100,
                    "dependsOn": [
                      "filters.conta_id",
                      "filters.campanha_id",
                      "filters.grupo_id"
                    ]
                  }
                }
              ]
            }
          }
        ]
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
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Gasto (Campanhas)",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Receita Atribuída",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(receita_atribuida)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
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
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Cliques",
              "format": "number",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(cliques)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Impressões",
              "format": "number",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(impressoes)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Conversões",
              "format": "number",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(conversoes)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          }
        ]
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
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "Leads",
              "format": "number",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(leads)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
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
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "CPC",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(gasto)/SUM(cliques) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "CPM",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE (SUM(gasto)*1000.0)/SUM(impressoes) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "CPA",
              "format": "currency",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          },
          {
            "type": "KPI",
            "props": {
              "fr": 1,
              "title": "CVR",
              "format": "percent",
              "borderless": true,
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                }
              }
            }
          }
        ]
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
            "type": "LineChart",
            "props": {
              "fr": 1,
              "title": "Gasto por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "currency",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "curve": "monotoneX",
                "area": true
              }
            }
          },
          {
            "type": "LineChart",
            "props": {
              "fr": 1,
              "title": "Receita por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(receita_atribuida)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "currency",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "curve": "monotoneX",
                "area": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "ROAS por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "number",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "layout": "vertical"
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "CPA por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(conversoes)=0 THEN 0 ELSE SUM(gasto)/SUM(conversoes) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "currency",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "layout": "vertical"
              }
            }
          }
        ]
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
            "type": "LineChart",
            "props": {
              "fr": 1,
              "title": "Impressões por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(impressoes)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "number",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "curve": "monotoneX",
                "area": false
              }
            }
          },
          {
            "type": "LineChart",
            "props": {
              "fr": 1,
              "title": "Cliques por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(cliques)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "number",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "curve": "monotoneX",
                "area": false
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "CTR por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(impressoes)=0 THEN 0 ELSE SUM(cliques)/SUM(impressoes) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "percent",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "layout": "vertical"
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "CVR por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(conversoes)/SUM(cliques) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "percent",
              "height": 250,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "layout": "vertical"
              }
            }
          }
        ]
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
            "type": "AISummary",
            "props": {
              "fr": 1,
              "title": "Leituras e alertas",
              "colorScheme": [
                "#1877F2",
                "#00B2FF",
                "#34D399",
                "#F59E0B",
                "#EF4444"
              ],
              "itemTextStyle": {
                "padding": "0 8px"
              },
              "containerStyle": {
                "padding": "12px 12px 16px 12px"
              },
              "items": [
                {
                  "icon": "trendingUp",
                  "text": "Monitore ROAS e CPA juntos: crescimento de gasto com ROAS estável pode esconder piora de eficiência no funil."
                },
                {
                  "icon": "brain",
                  "text": "Use filtros por campanha/grupo/anúncio para validar se a melhora vem de poucos criativos ou de ganho estrutural."
                },
                {
                  "icon": "triangleAlert",
                  "text": "Aplique faixa de gasto para remover itens residuais e evitar rankings poluídos por campanhas com investimento mínimo."
                }
              ]
            }
          },
          {
            "type": "PieChart",
            "props": {
              "fr": 1,
              "title": "Participação de Gasto por Conta (Top 8)",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "conta_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "currency",
              "height": 260,
              "interaction": {
                "clickAsFilter": true,
                "filterField": "conta_id",
                "storePath": "filters.conta_id"
              },
              "nivo": {
                "innerRadius": 0.45
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Campanhas por Leads",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(leads)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "campanha_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "campanha_id",
                "storePath": "filters.campanha_id"
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Lead Rate por Mês",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(cliques)=0 THEN 0 ELSE SUM(leads)/SUM(cliques) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "mes",
                "dimensionExpr": "TO_CHAR(DATE_TRUNC('month', data_ref), 'YYYY-MM')",
                "orderBy": {
                  "field": "dimension",
                  "dir": "asc"
                },
                "limit": 12
              },
              "format": "percent",
              "height": 260,
              "interaction": {
                "clickAsFilter": false
              },
              "nivo": {
                "layout": "vertical"
              }
            }
          }
        ]
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
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Campanhas por Gasto",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "campanha_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "currency",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "campanha_id",
                "storePath": "filters.campanha_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Campanhas por Conversões",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(conversoes)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "campanha_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "campanha_id",
                "storePath": "filters.campanha_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Campanhas por ROAS",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "campanha_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "campanha_id",
                "storePath": "filters.campanha_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Piores Campanhas por ROAS",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "campaign"
                },
                "dimension": "campanha_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "asc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "campanha_id",
                "storePath": "filters.campanha_id",
                "clearOnSecondClick": true
              }
            }
          }
        ]
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
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Grupos por Gasto",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(gasto)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "ad_group"
                },
                "dimension": "grupo_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "currency",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "grupo_id",
                "storePath": "filters.grupo_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Grupos por ROAS",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "CASE WHEN SUM(gasto)=0 THEN 0 ELSE SUM(receita_atribuida)/SUM(gasto) END",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "ad_group"
                },
                "dimension": "grupo_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "grupo_id",
                "storePath": "filters.grupo_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Anúncios por Receita",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(receita_atribuida)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "ad"
                },
                "dimension": "anuncio_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "currency",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "anuncio_id",
                "storePath": "filters.anuncio_id",
                "clearOnSecondClick": true
              }
            }
          },
          {
            "type": "BarChart",
            "props": {
              "fr": 1,
              "title": "Top Anúncios por Conversões",
              "dataQuery": {
                "model": "trafegopago.desempenho_diario",
                "measure": "SUM(conversoes)",
                "filters": {
                  "tenant_id": 1,
                  "plataforma": "meta_ads",
                  "nivel": "ad"
                },
                "dimension": "anuncio_id",
                "orderBy": {
                  "field": "measure",
                  "dir": "desc"
                },
                "limit": 8
              },
              "format": "number",
              "height": 260,
              "nivo": {
                "layout": "horizontal"
              },
              "interaction": {
                "clickAsFilter": true,
                "filterField": "anuncio_id",
                "storePath": "filters.anuncio_id",
                "clearOnSecondClick": true
              }
            }
          }
        ]
      }
    ]
  }
]`)
