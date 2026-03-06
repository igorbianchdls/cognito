export const APPS_VENDAS_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_vendas_template_dsl">
  <theme>
    <props>
      {
        "name": "light",
        "managers": {
          "border": {
            "style": "solid",
            "width": 1,
            "color": "#bfc9d9",
            "radius": 8,
            "frame": {
              "variant": "hud",
              "cornerSize": 8,
              "cornerWidth": 1
            }
          }
        }
      }
    </props>
    <header>
      <props>
        {
          "title": "Dashboard de Vendas",
          "subtitle": "Principais indicadores e cortes",
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
      </props>
    </header>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Vendas",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "query": "SELECT\n  COALESCE(SUM(p.valor_total), 0)::float AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Pedidos",
            "format": "number",
            "borderless": true,
            "dataQuery": {
              "query": "SELECT\n  COUNT(DISTINCT p.id)::int AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Ticket Médio",
            "format": "currency",
            "borderless": true,
            "dataQuery": {
              "query": "SELECT\n  COALESCE(AVG(p.valor_total), 0)::float AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)",
              "yField": "value",
              "filters": {}
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "fr": 1,
            "title": "Margem Bruta",
            "valuePath": "vendas.kpis.margemBruta",
            "format": "currency",
            "borderless": true
          }
        </props>
      </kpi>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <pie-chart>
        <props>
          {
            "fr": 1,
            "title": "Canais",
            "dataQuery": {
              "query": "SELECT\n  cv.id AS key,\n  COALESCE(cv.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "canal_venda_id",
              "storePath": "filters.canal_venda_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 240,
            "nivo": {
              "innerRadius": 0.35
            }
          }
        </props>
      </pie-chart>
      <bar-chart>
        <props>
          {
            "fr": 2,
            "title": "Categorias",
            "dataQuery": {
              "query": "SELECT\n  cr.id AS key,\n  COALESCE(cr.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "categoria_receita_id",
              "storePath": "filters.categoria_receita_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 240,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Filtro de Canais",
            "fields": [
              {
                "label": "Canal",
                "type": "list",
                "storePath": "filters.canal_venda_id",
                "source": {
                  "type": "options",
                  "model": "vendas.pedidos",
                  "field": "canal_venda_id",
                  "pageSize": 50
                },
                "selectAll": true,
                "search": true,
                "clearable": true
              }
            ]
          }
        </props>
      </slicer-card>
      <bar-chart>
        <props>
          {
            "fr": 2,
            "title": "Clientes",
            "dataQuery": {
              "query": "SELECT\n  c.id AS key,\n  COALESCE(c.nome_fantasia, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 5
            },
            "interaction": {
              "clickAsFilter": false
            },
            "format": "currency",
            "height": 240,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Vendedores",
            "dataQuery": {
              "query": "SELECT\n  v.id AS key,\n  COALESCE(f.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id\nLEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "vendedor_id",
              "storePath": "filters.vendedor_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Filiais",
            "dataQuery": {
              "query": "SELECT\n  fil.id AS key,\n  COALESCE(fil.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN empresa.filiais fil ON fil.id = p.filial_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "filial_id",
              "storePath": "filters.filial_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Unidades de Negócio",
            "dataQuery": {
              "query": "SELECT\n  un.id AS key,\n  COALESCE(un.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "unidade_negocio_id",
              "storePath": "filters.unidade_negocio_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <line-chart>
        <props>
          {
            "fr": 3,
            "title": "Faturamento por Mês",
            "dataQuery": {
              "query": "SELECT\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 2 ASC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 12
            },
            "interaction": {
              "clickAsFilter": false
            },
            "format": "currency",
            "height": 240,
            "nivo": {
              "curve": "monotoneX",
              "area": true
            }
          }
        </props>
      </line-chart>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <table>
        <props>
          {
            "fr": 3,
            "title": "Ultimos Pedidos",
            "height": 320,
            "showColumnToggle": true,
            "showPagination": true,
            "enableSearch": true,
            "pageSize": 8,
            "dataQuery": {
              "query": "SELECT\n  p.id AS pedido,\n  p.data_pedido::date AS data_pedido,\n  COALESCE(c.nome_fantasia, '-') AS cliente,\n  COALESCE(cv.nome, '-') AS canal,\n  COALESCE(f.nome, '-') AS vendedor,\n  COALESCE(p.valor_total, 0)::float AS valor_total,\n  COALESCE(p.status, '-') AS status\nFROM vendas.pedidos p\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\nLEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id\nLEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id\nLEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nORDER BY p.data_pedido DESC, p.id DESC",
              "filters": {},
              "limit": 120
            },
            "columns": [
              {
                "key": "pedido",
                "header": "Pedido",
                "format": "number",
                "align": "right",
                "width": 90
              },
              {
                "key": "data_pedido",
                "header": "Data",
                "format": "text",
                "width": 120
              },
              {
                "key": "cliente",
                "header": "Cliente",
                "format": "text",
                "width": 220
              },
              {
                "key": "canal",
                "header": "Canal",
                "format": "text",
                "width": 150
              },
              {
                "key": "vendedor",
                "header": "Vendedor",
                "format": "text",
                "width": 180
              },
              {
                "key": "valor_total",
                "header": "Valor Total",
                "format": "currency",
                "align": "right",
                "width": 140
              },
              {
                "key": "status",
                "header": "Status",
                "format": "text",
                "width": 130
              }
            ]
          }
        </props>
      </table>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Pedidos por Mês",
            "dataQuery": {
              "query": "SELECT\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,\n  COUNT(DISTINCT p.id)::int AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 2 ASC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 12
            },
            "interaction": {
              "clickAsFilter": false
            },
            "format": "number",
            "height": 220,
            "nivo": {
              "layout": "vertical"
            }
          }
        </props>
      </bar-chart>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Ticket Médio por Mês",
            "dataQuery": {
              "query": "SELECT\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,\n  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,\n  COALESCE(AVG(p.valor_total), 0)::float AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 2 ASC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 12
            },
            "interaction": {
              "clickAsFilter": false
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "vertical"
            }
          }
        </props>
      </bar-chart>
      <aisummary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "items": [
              {
                "icon": "trendingUp",
                "text": "Receita concentrada em poucos clientes; monitore dependência dos top compradores."
              },
              {
                "icon": "sparkles",
                "text": "Canais com melhor desempenho tendem a manter ticket médio acima da média do período."
              },
              {
                "icon": "triangleAlert",
                "text": "Quedas em filiais específicas podem distorcer o resultado consolidado do mês."
              }
            ]
          }
        </props>
      </aisummary>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Territórios",
            "dataQuery": {
              "query": "SELECT\n  t.id AS key,\n  COALESCE(t.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN comercial.territorios t ON t.id = p.territorio_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "territorio_id",
              "storePath": "filters.territorio_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Serviços/Categorias",
            "dataQuery": {
              "query": "SELECT\n  cr.id AS key,\n  COALESCE(cr.nome, '-') AS label,\n  COALESCE(SUM(pi.subtotal), 0)::float AS value\nFROM vendas.pedidos p\nJOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id\nLEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "categoria_receita_id",
              "storePath": "filters.categoria_receita_id",
              "clearOnSecondClick": true
            },
            "format": "currency",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
      <bar-chart>
        <props>
          {
            "fr": 1,
            "title": "Pedidos",
            "dataQuery": {
              "query": "SELECT\n  cv.id AS key,\n  COALESCE(cv.nome, '-') AS label,\n  COUNT(DISTINCT p.id)::int AS value\nFROM vendas.pedidos p\nLEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\nGROUP BY 1, 2\nORDER BY 3 DESC",
              "xField": "label",
              "yField": "value",
              "keyField": "key",
              "filters": {},
              "limit": 6
            },
            "interaction": {
              "clickAsFilter": true,
              "filterField": "canal_venda_id",
              "storePath": "filters.canal_venda_id",
              "clearOnSecondClick": true
            },
            "format": "number",
            "height": 220,
            "nivo": {
              "layout": "horizontal"
            }
          }
        </props>
      </bar-chart>
    </div>
  </theme>
</dashboard-template>`
