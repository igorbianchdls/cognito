export const REPORT_TEMPLATE_DSL = String.raw`<ReportTemplate name="relatorio_vendas_a4" title="Relatório Analítico de Vendas">
  <Theme name="light" />

  <Report id="capa" title="Capa">
    <Container direction="column" justify="between" minHeight="100%" padding={56} backgroundColor="#ffffff">
      <Container direction="column" gap={20}>
        <Container width={88} height={88} borderWidth={4} borderColor="#fde7c0" borderRadius={999} />
        <Container direction="column" gap={8}>
          <Title text="Relatório" />
          <Title text="Analítico de" />
          <Title text="Vendas" />
        </Container>
        <Container width={120} height={6} backgroundColor="#22c55e" borderRadius={999} />
        <Subtitle text="Resumo visual em formato A4 construído com o DSL de reports." />
      </Container>

      <Container direction="row" justify="between" align="end">
        <Container direction="column" gap={6}>
          <Subtitle text="Formato A4 em DSL" />
          <Subtitle text="Com charts, KPIs e tabelas reutilizando o runtime visual." />
        </Container>
        <Container width="42%" height={320} backgroundColor="#eef8e8" borderRadius={28} />
      </Container>
    </Container>
  </Report>

  <Report id="resumo" title="Resumo Executivo">
    <Container direction="column" gap={16} minHeight="100%" padding={36} backgroundColor="#ffffff">
      <Container direction="column" gap={4}>
        <Title text="Resumo Executivo" />
        <Subtitle text="Indicadores e tendência de faturamento." />
      </Container>

      <Container direction="row" gap={12} align="stretch">
        <Container grow={1}>
          <Card>
            <KPI title="Vendas" format="currency">
              <Query>
                SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
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
            <KPI title="Pedidos" format="number">
              <Query>
                SELECT COUNT(*)::float AS value
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
            <KPI title="Ticket Médio" format="currency">
              <Query>
                SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              </Query>
              <DataQuery yField="value" />
            </KPI>
          </Card>
        </Container>
      </Container>

      <Card>
        <Title text="Faturamento Diário" marginBottom={8} />
        <Chart type="line" format="currency" height={340}>
          <Query>
            SELECT
              TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
              p.data_pedido::date AS key,
              COALESCE(SUM(p.valor_total), 0)::float AS value
            FROM vendas.pedidos p
            WHERE 1=1
              {{filters:p}}
            GROUP BY 1, 2
            ORDER BY 2 ASC
          </Query>
          <Fields x="label" y="value" key="key" />
        </Chart>
      </Card>
    </Container>
  </Report>

  <Report id="detalhes" title="Canais e Pedidos">
    <Container direction="column" gap={16} minHeight="100%" padding={36} backgroundColor="#ffffff">
      <Container direction="column" gap={4}>
        <Title text="Canais e Pedidos Recentes" />
        <Subtitle text="Quebra por canal e listagem operacional." />
      </Container>

      <Container direction="row" gap={12} align="stretch">
        <Container grow={1}>
          <Card>
            <Title text="Canais" marginBottom={8} />
            <Chart type="pie" format="currency" height={280}>
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
            </Chart>
          </Card>
        </Container>

        <Container grow={1}>
          <Card>
            <Title text="Top Clientes" marginBottom={8} />
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
                LIMIT 8
              </Query>
              <Fields x="label" y="value" key="key" />
            </Chart>
          </Card>
        </Container>
      </Container>

      <Card>
        <Title text="Últimos Pedidos" marginBottom={8} />
        <Table height={320} pageSize={8} showPagination={false} enableSearch={false}>
          <Config>
            {
              "dataQuery": {
                "query": "SELECT\n  p.id AS pedido,\n  p.data_pedido::date AS data_pedido,\n  COALESCE(c.nome_fantasia, '-') AS cliente,\n  COALESCE(cv.nome, '-') AS canal,\n  COALESCE(p.valor_total, 0)::float AS valor_total\nFROM vendas.pedidos p\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\nLEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id\nWHERE 1=1\n  {{filters:p}}\nORDER BY p.data_pedido DESC, p.id DESC",
                "filters": {},
                "limit": 8
              },
              "columns": [
                { "key": "pedido", "header": "Pedido" },
                { "key": "data_pedido", "header": "Data", "format": "date" },
                { "key": "cliente", "header": "Cliente" },
                { "key": "canal", "header": "Canal" },
                { "key": "valor_total", "header": "Valor", "format": "currency", "align": "right" }
              ]
            }
          </Config>
        </Table>
      </Card>
    </Container>
  </Report>
</ReportTemplate>`
