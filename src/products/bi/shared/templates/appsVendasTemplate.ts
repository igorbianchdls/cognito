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
    <Container direction="row" gap={12} padding={16} align="stretch" minHeight="100%">
      <Sidebar width={300} minWidth={260} maxWidth={340} minHeight="100%" gap={10} padding={12} overflowY="auto" sticky top={12}>
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
      <Container direction="column" gap={0} grow={1} minHeight="100%">
        <Header direction="row" justify="between" align="center">
          <Container direction="column" gap={4}>
            <Title text="Dashboard de Vendas" />
            <Subtitle text="Principais indicadores e cortes" />
          </Container>
          <DatePicker visible mode="range" storePath="filters.dateRange" presets={["7d","14d","30d"]}>
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
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Vendas" />
            <KPI format="currency" resultPath="kpis.vendas" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                ),
                anterior AS (
                  SELECT
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND p.data_pedido::date >= {{compare_de}}::date
                    AND p.data_pedido::date <= {{compare_ate}}::date
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE
                    WHEN anterior.value = 0 THEN 0
                    ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.vendas" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} strokeColor="#2563eb" fillColor="rgba(37, 99, 235, 0.16)">
              <Query>
                SELECT
                  TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                  COALESCE(SUM(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE p.tenant_id = {{tenant_id}}
                  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#e8f0fe" color="#1d4ed8" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Pedidos" />
            <KPI format="number" resultPath="kpis.pedidos" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COUNT(DISTINCT p.id)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                ),
                anterior AS (
                  SELECT
                    COUNT(DISTINCT p.id)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND p.data_pedido::date >= {{compare_de}}::date
                    AND p.data_pedido::date <= {{compare_ate}}::date
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE
                    WHEN anterior.value = 0 THEN 0
                    ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.pedidos" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} strokeColor="#059669" fillColor="rgba(5, 150, 105, 0.16)">
              <Query>
                SELECT
                  TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                  COUNT(DISTINCT p.id)::float AS value
                FROM vendas.pedidos p
                WHERE p.tenant_id = {{tenant_id}}
                  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="shopping-cart" size={18} padding={10} radius={10} backgroundColor="#ecfdf3" color="#047857" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Ticket Médio" />
            <KPI format="currency" resultPath="kpis.ticketMedio" comparisonMode="previous_period">
              <Query>
                WITH atual AS (
                  SELECT
                    COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                    AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                ),
                anterior AS (
                  SELECT
                    COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE p.tenant_id = {{tenant_id}}
                    AND {{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND p.data_pedido::date >= {{compare_de}}::date
                    AND p.data_pedido::date <= {{compare_ate}}::date
                    AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                    AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                )
                SELECT
                  atual.value AS value,
                  anterior.value AS previous_value,
                  CASE
                    WHEN anterior.value = 0 THEN 0
                    ELSE (((atual.value - anterior.value) / anterior.value) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.ticketMedio" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} strokeColor="#ea580c" fillColor="rgba(234, 88, 12, 0.16)">
              <Query>
                SELECT
                  TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                  COALESCE(AVG(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE p.tenant_id = {{tenant_id}}
                  AND ({{de}} IS NULL OR p.data_pedido::date >= {{de}}::date)
                  AND ({{ate}} IS NULL OR p.data_pedido::date <= {{ate}}::date)
                  AND ({{canal_venda_id}}::int[] IS NULL OR p.canal_venda_id = ANY({{canal_venda_id}}::int[]))
                  AND ({{cliente_id}}::int[] IS NULL OR p.cliente_id = ANY({{cliente_id}}::int[]))
                GROUP BY 1, 2
                ORDER BY 1 ASC
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#fff7ed" color="#c2410c" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Title text="Margem Bruta" />
            <KPI valuePath="vendas.kpis.margemBruta" format="currency" />
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#f3e8ff" color="#7c3aed" />
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Canais" marginBottom={8} />
          <Chart type="pie" format="currency" height={240}>
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
        </Card>
      </Container>
      <Container grow={2}>
        <Card>
          <Title text="Categorias" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
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
        </Card>
      </Container>
      <Container grow={2}>
        <Card>
          <Title text="Clientes" marginBottom={8} />
          <Chart type="bar" format="currency" height={240}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Vendedores" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Filiais" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Unidades de Negócio" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={3}>
        <Card>
          <Title text="Faturamento por Mês" marginBottom={8} />
          <Chart type="line" format="currency" height={240}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={3}>
        <Card>
          <Title text="Ultimos Pedidos" marginBottom={8} />
          <Table height={320} showColumnToggle showPagination enableSearch pageSize={8}>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Pedidos por Mês" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Ticket Médio por Mês" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Insights da IA" marginBottom={8} />
          <AISummary>
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
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Title text="Territórios" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Serviços/Categorias" marginBottom={8} />
          <Chart type="bar" format="currency" height={220}>
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
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Pedidos" marginBottom={8} />
          <Chart type="bar" format="number" height={220}>
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
        </Card>
      </Container>
    </Container>
      </Container>
    </Container>
  </Theme>
</DashboardTemplate>`
