export const SLIDE_TEMPLATE_DSL = String.raw`<SlideTemplate name="deck_vendas" title="Apresentação de Vendas">
  <Theme name="light" />

  <Slide id="capa" title="Capa">
    <Container direction="column" justify="between" minHeight="100%" padding={56} backgroundColor="#ffffff">
      <Container direction="column" gap={18} width="58%">
        <Container width={90} height={10} backgroundColor="#2f6fed" />
        <Container direction="column" gap={10}>
          <Title text="Apresentação" />
          <Title text="Analítica de" />
          <Title text="Vendas" />
        </Container>
        <Subtitle text="Deck em HTML com DSL unificado para slides, charts e tabelas." />
      </Container>

      <Container direction="row" justify="between" align="end">
        <Container direction="column" gap={8}>
          <Subtitle text="Formato 16:9 para apresentações" />
          <Subtitle text="Pronto para evoluir para export PPTX." />
        </Container>
        <Container width="40%" height={280} backgroundColor="#eaf1ff" borderRadius={20} />
      </Container>
    </Container>
  </Slide>

  <Slide id="resumo" title="Resumo">
    <Container direction="column" gap={16} minHeight="100%" padding={40} backgroundColor="#ffffff">
      <Container direction="column" gap={4}>
        <Title text="Resumo Executivo" />
        <Subtitle text="KPIs centrais e tendência diária." />
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
        <Chart type="line" format="currency" height={360}>
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
  </Slide>

  <Slide id="canais" title="Canais e Clientes">
    <Container direction="column" gap={16} minHeight="100%" padding={40} backgroundColor="#ffffff">
      <Container direction="column" gap={4}>
        <Title text="Canais e Clientes" />
        <Subtitle text="Quebra por canal e top clientes." />
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
    </Container>
  </Slide>
</SlideTemplate>`
