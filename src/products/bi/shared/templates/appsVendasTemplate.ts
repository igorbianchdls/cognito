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
              "query": "SELECT\n  COALESCE(SUM(p.valor_total), 0)::float AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\n  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))\n  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))",
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
              "query": "SELECT\n  COUNT(DISTINCT p.id)::int AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\n  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))\n  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))",
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
              "query": "SELECT\n  COALESCE(AVG(p.valor_total), 0)::float AS value\nFROM vendas.pedidos p\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\n  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))\n  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))",
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
      <chart type="pie" fr="1" title="Canais" format="currency" height="240">
        <query>
          SELECT
            cv.id AS key,
            COALESCE(cv.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="canal_venda_id" store-path="filters.canal_venda_id" clear-on-second-click="true" />
        <nivo inner-radius="0.35" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="2" title="Categorias" format="currency" height="240">
        <query>
          SELECT
            cr.id AS key,
            COALESCE(cr.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="categoria_receita_id" store-path="filters.categoria_receita_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <slicer-card>
        <props>
          {
            "fr": 1,
            "title": "Filtros",
            "fields": [
              {
                "label": "Canal",
                "type": "list",
                "storePath": "filters.canal_venda_id",
                "query": "SELECT\n  cv.id AS value,\n  COALESCE(cv.nome, '-') AS label\nFROM vendas.canais_venda cv\nORDER BY 2 ASC",
                "limit": 200,
                "selectAll": true,
                "search": true,
                "clearable": true
              },
              {
                "label": "Cliente",
                "type": "multi",
                "storePath": "filters.cliente_id",
                "query": "SELECT\n  c.id AS value,\n  COALESCE(c.nome_fantasia, '-') AS label\nFROM entidades.clientes c\nWHERE c.tenant_id = {{tenant_id}}\nORDER BY 2 ASC",
                "limit": 200,
                "selectAll": true,
                "search": true,
                "clearable": true
              }
            ]
          }
        </props>
      </slicer-card>
      <chart type="bar" fr="2" title="Clientes" format="currency" height="240">
        <query>
          SELECT
            c.id AS key,
            COALESCE(c.nome_fantasia, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="false" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 5
            }
          }
        </props>
      </chart>
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
      <chart type="bar" fr="1" title="Vendedores" format="currency" height="220">
        <query>
          SELECT
            v.id AS key,
            COALESCE(f.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
          LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="vendedor_id" store-path="filters.vendedor_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Filiais" format="currency" height="220">
        <query>
          SELECT
            fil.id AS key,
            COALESCE(fil.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="filial_id" store-path="filters.filial_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Unidades de Negócio" format="currency" height="220">
        <query>
          SELECT
            un.id AS key,
            COALESCE(un.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="unidade_negocio_id" store-path="filters.unidade_negocio_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
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
      <chart type="line" fr="3" title="Faturamento por Mês" format="currency" height="240">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="false" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
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
              "query": "SELECT\n  p.id AS pedido,\n  p.data_pedido::date AS data_pedido,\n  COALESCE(c.nome_fantasia, '-') AS cliente,\n  COALESCE(cv.nome, '-') AS canal,\n  COALESCE(f.nome, '-') AS vendedor,\n  COALESCE(p.valor_total, 0)::float AS valor_total,\n  COALESCE(p.status, '-') AS status\nFROM vendas.pedidos p\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\nLEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id\nLEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id\nLEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id\nWHERE p.tenant_id = {{tenant_id}}\n  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)\n  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)\n  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))\n  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))\nORDER BY p.data_pedido DESC, p.id DESC",
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
      <chart type="bar" fr="1" title="Pedidos por Mês" format="number" height="220">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
            COUNT(DISTINCT p.id)::int AS value
          FROM vendas.pedidos p
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="false" />
        <nivo layout="vertical" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Ticket Médio por Mês" format="currency" height="220">
        <query>
          SELECT
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
            TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
            COALESCE(AVG(p.valor_total), 0)::float AS value
          FROM vendas.pedidos p
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 2 ASC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="false" />
        <nivo layout="vertical" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <ai-summary>
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
      </ai-summary>
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
      <chart type="bar" fr="1" title="Territórios" format="currency" height="220">
        <query>
          SELECT
            t.id AS key,
            COALESCE(t.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="territorio_id" store-path="filters.territorio_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Serviços/Categorias" format="currency" height="220">
        <query>
          SELECT
            cr.id AS key,
            COALESCE(cr.nome, '-') AS label,
            COALESCE(SUM(pi.subtotal), 0)::float AS value
          FROM vendas.pedidos p
          JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
          LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="categoria_receita_id" store-path="filters.categoria_receita_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Pedidos" format="number" height="220">
        <query>
          SELECT
            cv.id AS key,
            COALESCE(cv.nome, '-') AS label,
            COUNT(DISTINCT p.id)::int AS value
          FROM vendas.pedidos p
          LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
          GROUP BY 1, 2
          ORDER BY 3 DESC
        </query>
        <fields x="label" y="value" key="key" />
        <interaction click-as-filter="true" filter-field="canal_venda_id" store-path="filters.canal_venda_id" clear-on-second-click="true" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </props>
      </chart>
    </div>
  </theme>
</dashboard-template>`
