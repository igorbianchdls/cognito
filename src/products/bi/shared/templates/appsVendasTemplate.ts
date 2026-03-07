export const APPS_VENDAS_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_vendas_template_dsl">
  <Theme name="light">
    <Config>
      {
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
    </Config>
    <Header title="Dashboard de Vendas" subtitle="Principais indicadores e cortes" align="center" controlsPosition="right">
      <DatePicker visible mode="range" position="right" storePath="filters.dateRange">
        <ActionOnChange type="refresh_data" />
        <Style>
          {
            "padding": 6,
            "fontFamily": "Barlow",
            "fontSize": 12
          }
        </Style>
      </DatePicker>
    </Header>
    <Div direction="row" gap={12} padding={16} align="start">
      <Sidebar width={300} minWidth={260} maxWidth={340} gap={10} padding={12} sticky top={12}>
        <CardTitle text="Filtros" marginBottom={2} />
        <SlicerCard borderless>
          <Config>
            {
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
          </Config>
        </SlicerCard>
      </Sidebar>
      <Div direction="column" gap={0} childGrow fr={1}>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <KPI fr={1} title="Vendas" format="currency" borderless>
        <Query>
          SELECT
            COALESCE(SUM(p.valor_total), 0)::float AS value
          FROM vendas.pedidos p
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI fr={1} title="Pedidos" format="number" borderless>
        <Query>
          SELECT
            COUNT(DISTINCT p.id)::int AS value
          FROM vendas.pedidos p
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI fr={1} title="Ticket Médio" format="currency" borderless>
        <Query>
          SELECT
            COALESCE(AVG(p.valor_total), 0)::float AS value
          FROM vendas.pedidos p
          WHERE p.tenant_id = {{tenant_id}}
            AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
            AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
            AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
            AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
        </Query>
        <DataQuery yField="value" />
      </KPI>
      <KPI fr={1} title="Margem Bruta" valuePath="vendas.kpis.margemBruta" format="currency" borderless>
      </KPI>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="pie" fr={1} title="Canais" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="canal_venda_id" storePath="filters.canal_venda_id" clearOnSecondClick />
        <Nivo innerRadius={0.35} />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={2} title="Categorias" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="categoria_receita_id" storePath="filters.categoria_receita_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={2} title="Clientes" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter={false} />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 5
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Vendedores" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="vendedor_id" storePath="filters.vendedor_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Filiais" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="filial_id" storePath="filters.filial_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Unidades de Negócio" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="unidade_negocio_id" storePath="filters.unidade_negocio_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="line" fr={3} title="Faturamento por Mês" format="currency" height={240}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter={false} />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Table fr={3} title="Ultimos Pedidos" height={320} showColumnToggle showPagination enableSearch pageSize={8}>
        <Config>
          {
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
        </Config>
      </Table>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Pedidos por Mês" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Ticket Médio por Mês" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter={false} />
        <Nivo layout="vertical" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </Config>
      </Chart>
      <AISummary fr={1} title="Insights da IA">
        <Config>
          {
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
        </Config>
      </AISummary>
    </Div>
    <Div direction="row" gap={12} padding={16} justify="start" align="start" childGrow>
      <Chart type="bar" fr={1} title="Territórios" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="territorio_id" storePath="filters.territorio_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Serviços/Categorias" format="currency" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="categoria_receita_id" storePath="filters.categoria_receita_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
      <Chart type="bar" fr={1} title="Pedidos" format="number" height={220}>
        <Query>
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
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="canal_venda_id" storePath="filters.canal_venda_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {},
              "limit": 6
            }
          }
        </Config>
      </Chart>
    </Div>
      </Div>
    </Div>
  </Theme>
</DashboardTemplate>`
