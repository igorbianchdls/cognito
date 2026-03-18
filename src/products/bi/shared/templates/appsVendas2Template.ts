export const APPS_VENDAS2_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_vendas2_template_dsl">
  <Theme name="light" />
  <Container direction="row" gap={12} padding={16} align="stretch" minHeight="100%">
    <Sidebar width={260} minWidth={220} maxWidth={280} minHeight="100%" gap={10} padding={12}>
      <Card>
        <Text text="Tabs" marginBottom={8} />
        <Container direction="column" gap={8}>
          <Tab id="resumo" label="Resumo" />
          <Tab id="clientes" label="Clientes" />
          <Tab id="produtos" label="Produtos" />
        </Container>
      </Card>
    </Sidebar>

    <Container direction="column" gap={12} grow={1} minHeight="100%">
      <Header direction="row" justify="between" align="center">
        <Container direction="column" gap={4}>
          <Text text="Dashboard de Vendas 2" />
          <Text text="Teste de tabs com KPIs e charts" />
        </Container>
        <DatePicker visible mode="range" table="vendas.pedidos" field="data_pedido" presets={["7d","14d","30d"]} />
      </Header>

      <Container tab="resumo">
        <Header title="Resumo" subtitle="Visão geral das vendas" />
        <Container direction="row" gap={12} padding={16}>
          <Container grow={1}>
            <Card>
              <Text text="Vendas" marginBottom={6} />
              <KPI format="currency" resultPath="vendas2.resumo.vendas">
                <Query>
                  SELECT
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                </Query>
                <DataQuery yField="value" />
              </KPI>
            </Card>
          </Container>
          <Container grow={1}>
            <Card>
              <Text text="Pedidos" marginBottom={6} />
              <KPI format="number" resultPath="vendas2.resumo.pedidos">
                <Query>
                  SELECT
                    COUNT(DISTINCT p.id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                </Query>
                <DataQuery yField="value" />
              </KPI>
            </Card>
          </Container>
          <Container grow={1}>
            <Card>
              <Text text="Ticket Médio" marginBottom={6} />
              <KPI format="currency" resultPath="vendas2.resumo.ticket">
                <Query>
                  SELECT
                    COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                </Query>
                <DataQuery yField="value" />
              </KPI>
            </Card>
          </Container>
        </Container>
        <Container direction="row" gap={12} padding={16}>
          <Container grow={2}>
            <Card>
              <Text text="Faturamento Diário" marginBottom={8} />
              <Chart type="line" format="currency" height={260}>
                <Query>
                  SELECT
                    TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                    TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 1 ASC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter={false} />
              </Chart>
            </Card>
          </Container>
          <Container grow={1}>
            <Card>
              <Text text="Canais" marginBottom={8} />
              <Chart type="pie" format="currency" height={260}>
                <Query>
                  SELECT
                    cv.id AS key,
                    COALESCE(cv.nome, '-') AS label,
                    COALESCE(SUM(pi.subtotal), 0)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 3 DESC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter table="vendas.pedidos" field="canal_venda_id" clearOnSecondClick />
              </Chart>
            </Card>
          </Container>
        </Container>
      </Container>

      <Container tab="clientes">
        <Header title="Clientes" subtitle="Base e concentração por cliente" />
        <Container direction="row" gap={12} padding={16}>
          <Container grow={1}>
            <Card>
              <Text text="Clientes Ativos" marginBottom={6} />
              <KPI format="number" resultPath="vendas2.clientes.ativos">
                <Query>
                  SELECT
                    COUNT(DISTINCT p.cliente_id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                </Query>
                <DataQuery yField="value" />
              </KPI>
            </Card>
          </Container>
          <Container grow={2}>
            <Card>
              <Text text="Top Clientes" marginBottom={8} />
              <Chart type="bar" format="currency" height={280}>
                <Query>
                  SELECT
                    c.id AS key,
                    COALESCE(c.nome_fantasia, '-') AS label,
                    COALESCE(SUM(pi.subtotal), 0)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 3 DESC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter table="vendas.pedidos" field="cliente_id" clearOnSecondClick />
                <Config>
                  {
                    "dataQuery": {
                      "filters": {},
                      "limit": 8
                    }
                  }
                </Config>
              </Chart>
            </Card>
          </Container>
        </Container>
        <Container direction="row" gap={12} padding={16}>
          <Container grow={1}>
            <Card>
              <Text text="Vendedores" marginBottom={8} />
              <Chart type="bar" format="currency" height={260}>
                <Query>
                  SELECT
                    v.id AS key,
                    COALESCE(f.nome, '-') AS label,
                    COALESCE(SUM(pi.subtotal), 0)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
                  LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 3 DESC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter table="vendas.pedidos" field="vendedor_id" clearOnSecondClick />
                <Config>
                  {
                    "dataQuery": {
                      "filters": {},
                      "limit": 8
                    }
                  }
                </Config>
              </Chart>
            </Card>
          </Container>
        </Container>
      </Container>

      <Container tab="produtos">
        <Header title="Produtos" subtitle="Mix de itens e categorias" />
        <Container direction="row" gap={12} padding={16}>
          <Container grow={1}>
            <Card>
              <Text text="SKUs Vendidos" marginBottom={6} />
              <KPI format="number" resultPath="vendas2.produtos.skus">
                <Query>
                  SELECT
                    COUNT(DISTINCT pi.produto_id)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  WHERE 1=1
                    {{filters:p}}
                </Query>
                <DataQuery yField="value" />
              </KPI>
            </Card>
          </Container>
          <Container grow={2}>
            <Card>
              <Text text="Top Produtos" marginBottom={8} />
              <Chart type="bar" format="currency" height={280}>
                <Query>
                  SELECT
                    pi.produto_id AS key,
                    COALESCE(pr.nome, CONCAT('Produto #', pi.produto_id::text)) AS label,
                    COALESCE(SUM(pi.subtotal), 0)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 3 DESC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter={false} />
                <Config>
                  {
                    "dataQuery": {
                      "filters": {},
                      "limit": 8
                    }
                  }
                </Config>
              </Chart>
            </Card>
          </Container>
        </Container>
        <Container direction="row" gap={12} padding={16}>
          <Container grow={1}>
            <Card>
              <Text text="Categorias de Receita" marginBottom={8} />
              <Chart type="bar" format="currency" height={260}>
                <Query>
                  SELECT
                    cr.id AS key,
                    COALESCE(cr.nome, '-') AS label,
                    COALESCE(SUM(pi.subtotal), 0)::float AS value
                  FROM vendas.pedidos p
                  JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                  LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1, 2
                  ORDER BY 3 DESC
                </Query>
                <Fields x="label" y="value" key="key" />
                <Interaction clickAsFilter table="vendas.pedidos" field="categoria_receita_id" clearOnSecondClick />
                <Config>
                  {
                    "dataQuery": {
                      "filters": {},
                      "limit": 8
                    }
                  }
                </Config>
              </Chart>
            </Card>
          </Container>
        </Container>
      </Container>
    </Container>
  </Container>
</DashboardTemplate>`
