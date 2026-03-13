export const APPS_VENDAS3_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_vendas3_template_dsl">
  <Theme name="light" />
  <Container direction="column" gap={12} padding={16} minHeight="100%">
    <Header direction="row" justify="between" align="center">
      <Container direction="column" gap={4}>
        <Title text="Dashboard de Vendas 3" />
        <Subtitle text="Teste dos novos charts em Recharts: scatter, radar, treemap, composed, funnel e sankey" />
      </Container>
      <DatePicker visible mode="range" table="vendas.pedidos" field="data_pedido" presets={["7d","14d","30d"]} />
    </Header>

    <Container direction="row" gap={12} align="stretch">
      <Container grow={1}>
        <Card>
          <Title text="Scatter — Clientes" marginBottom={8} />
          <Chart type="scatter" format="number" height={320}>
            <Query>
              SELECT
                c.id AS key,
                COALESCE(c.nome_fantasia, '-') AS cliente,
                COUNT(DISTINCT p.id)::float AS pedidos,
                COALESCE(SUM(p.valor_total), 0)::float AS receita,
                COUNT(DISTINCT pi.produto_id)::float AS mix
              FROM vendas.pedidos p
              LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
              LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1, 2
              ORDER BY 4 DESC
            </Query>
            <Fields x="pedidos" y="receita" key="key" size="mix" />
            <Interaction clickAsFilter table="vendas.pedidos" field="cliente_id" clearOnSecondClick />
            <Config>
              {
                "dataQuery": {
                  "filters": {},
                  "limit": 30
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Title text="Radar — Canal x Unidade" marginBottom={8} />
          <Chart type="radar" format="currency" height={320}>
            <Query>
              SELECT
                cv.id AS key,
                COALESCE(cv.nome, '-') AS canal,
                COALESCE(un.nome, '-') AS unidade,
                COALESCE(SUM(pi.subtotal), 0)::float AS value
              FROM vendas.pedidos p
              JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
              LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
              LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1, 2, 3
              ORDER BY 4 DESC
            </Query>
            <Fields x="canal" y="value" key="key" series="unidade" />
            <Interaction clickAsFilter table="vendas.pedidos" field="canal_venda_id" clearOnSecondClick />
            <Config>
              {
                "dataQuery": {
                  "filters": {},
                  "limit": 18
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
    </Container>

    <Container>
      <Card>
        <Title text="Treemap — Unidades e Territórios" marginBottom={8} />
        <Chart type="treemap" format="currency" height={360}>
          <Query>
            SELECT
              t.id AS key,
              COALESCE(t.nome, '-') AS territorio,
              COALESCE(un.nome, '-') AS unidade,
              COALESCE(SUM(pi.subtotal), 0)::float AS value
            FROM vendas.pedidos p
            JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
            LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
            LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
            WHERE 1=1
              {{filters:p}}
            GROUP BY 1, 2, 3
            ORDER BY 4 DESC
          </Query>
          <Fields x="territorio" y="value" key="key" parent="unidade" />
          <Interaction clickAsFilter table="vendas.pedidos" field="territorio_id" clearOnSecondClick />
          <Config>
            {
              "dataQuery": {
                "filters": {},
                "limit": 40
              }
            }
          </Config>
        </Chart>
      </Card>
    </Container>

    <Container>
      <Card>
        <Title text="Composed — Receita e Pedidos por Canal" marginBottom={8} />
        <Chart type="composed" format="currency" height={320}>
          <Query>
            SELECT
              cv.id AS key,
              COALESCE(cv.nome, '-') AS canal,
              COALESCE(SUM(pi.subtotal), 0)::float AS receita,
              COUNT(DISTINCT p.id)::float AS pedidos
            FROM vendas.pedidos p
            JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
            LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
            WHERE 1=1
              {{filters:p}}
            GROUP BY 1, 2
            ORDER BY 3 DESC
          </Query>
          <Fields x="canal" key="key" />
          <Series field="receita" type="bar" label="Receita" />
          <Series field="pedidos" type="line" label="Pedidos" yAxis="right" />
          <Interaction clickAsFilter table="vendas.pedidos" field="canal_venda_id" clearOnSecondClick />
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

    <Container direction="row" gap={12} align="stretch">
      <Container grow={1}>
        <Card>
          <Title text="Funnel — Receita por Categoria" marginBottom={8} />
          <Chart type="funnel" format="currency" height={320}>
            <Query>
              SELECT
                cr.id AS key,
                COALESCE(cr.nome, '-') AS categoria,
                COALESCE(SUM(pi.subtotal), 0)::float AS value
              FROM vendas.pedidos p
              JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
              LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1, 2
              ORDER BY 3 DESC
            </Query>
            <Fields x="categoria" y="value" key="key" />
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

      <Container grow={1}>
        <Card>
          <Title text="Sankey — Canal para Unidade" marginBottom={8} />
          <Chart type="sankey" format="currency" height={360}>
            <Query>
              SELECT
                cv.id AS key,
                COALESCE(cv.nome, '-') AS canal,
                COALESCE(un.nome, '-') AS unidade,
                COALESCE(SUM(pi.subtotal), 0)::float AS value
              FROM vendas.pedidos p
              JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
              LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
              LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1, 2, 3
              ORDER BY 4 DESC
            </Query>
            <Fields x="canal" target="unidade" y="value" key="key" />
            <Config>
              {
                "dataQuery": {
                  "filters": {},
                  "limit": 30
                }
              }
            </Config>
          </Chart>
        </Card>
      </Container>
    </Container>
  </Container>
</DashboardTemplate>`
