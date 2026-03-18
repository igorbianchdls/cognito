export const REPORT_TEMPLATE_DSL = String.raw`<ReportTemplate name="last_quarter_revenue_analysis" title="Last Quarter Revenue Analysis">
  <Theme name="light" />

  <Report id="capa" title="Cover">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#ffffff">
      <Container direction="column" gap={10} marginBottom={26}>
        <Subtitle
          text="Q4 / 2025 / Revenue Review"
          titleStyle={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}
        />
        <Title
          text="Last Quarter Revenue Analysis"
          titleStyle={{ fontSize: 32, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em" }}
        />
        <Subtitle
          text="A document-style revenue summary built in the report DSL, mixing analytical charts with narrative takeaways."
          titleStyle={{ fontSize: 14, lineHeight: 1.65, color: "#5C6470", maxWidth: "72%" }}
        />
      </Container>

      <Container direction="column" gap={14} marginBottom={30}>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }}>• <Bold>Revenue grew</Bold> with a clear concentration in enterprise and mid-market accounts.</Text>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }}>• <Bold>Segment mix remained healthy</Bold>, but country distribution shows concentration risk.</Text>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }}>• The strongest regions offset weaker <Bold>small-business performance</Bold> during the quarter.</Text>
      </Container>

      <Container grow={1} borderRadius={32} backgroundColor="#EAF8FF" />
    </Container>
  </Report>

  <Report id="summary" title="Summary">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#ffffff">
      <Container direction="column" gap={6} marginBottom={18}>
        <Subtitle
          text="Last Quarter Revenue Analysis"
          titleStyle={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}
        />
        <Title
          text="Last Quarter Revenue Analysis"
          titleStyle={{ fontSize: 28, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em" }}
        />
      </Container>

      <Container direction="column" gap={8} marginBottom={22}>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665" }}>This report analyzes <Bold>revenue for the quarter</Bold>, filtered to:</Text>
        <Subtitle text="• Version: Actual" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
        <Subtitle text="• Scenario: Baseline" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665", marginTop: 4 }}>It provides <Bold>two complementary views</Bold>:</Text>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }}>• <Bold>Breakdown by Channel</Bold></Text>
        <Text titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }}>• <Bold>Breakdown by Customer</Bold></Text>
      </Container>

      <Container direction="column" gap={8} marginBottom={8}>
        <Title
          text="Breakdown by Channel"
          titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em" }}
        />
        <Subtitle text="Revenue by Channel" titleStyle={{ fontSize: 11, color: "#8B8E97", textTransform: "uppercase", letterSpacing: "0.04em" }} />
      </Container>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <Chart type="bar" format="currency" height={340} showGrid={true} categoryTickColor="#7B8190" valueTickColor="#7B8190">
          <Query>
            SELECT
              cv.id AS key,
              COALESCE(cv.nome, '-') AS label,
              COALESCE(SUM(p.valor_total), 0)::float AS value
            FROM vendas.pedidos p
            LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
            WHERE 1=1
              {{filters:p}}
            GROUP BY 1, 2
            ORDER BY 3 DESC
          </Query>
          <Fields x="label" y="value" key="key" />
        </Chart>
      </Card>

      <Container direction="column" gap={8} marginBottom={18}>
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• <Bold>Primary channels</Bold> concentrate most of the quarter revenue and should remain the focus of closer monitoring.</Text>
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• The long tail of channels still contributes diversification, but with a visibly <Bold>lower share of total volume</Bold>.</Text>
      </Container>

      <Container direction="column" gap={8}>
        <Title
          text="Breakdown by Customer"
          titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em" }}
        />
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• <Bold>Revenue concentration by customer</Bold> suggests a few accounts are disproportionately important to quarter performance.</Text>
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• This distribution is useful for identifying <Bold>account dependency</Bold> and prioritizing retention efforts.</Text>
      </Container>
    </Container>
  </Report>

  <Report id="details" title="Detailed View">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#ffffff">
      <Container direction="column" gap={6} marginBottom={20}>
        <Subtitle
          text="Detailed View"
          titleStyle={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}
        />
        <Title
          text="Customer and Order Details"
          titleStyle={{ fontSize: 26, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em" }}
        />
        <Subtitle
          text="The sections below combine a comparative country view with recent-order detail, keeping the report in a document-first reading flow."
          titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#5C6470", maxWidth: "78%" }}
        />
      </Container>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <Title text="Revenue by Customer" titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A" }} marginBottom={10} />
        <Chart type="bar" format="currency" height={300} showGrid={true} categoryTickColor="#7B8190" valueTickColor="#7B8190">
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

      <Container direction="column" gap={8} marginBottom={18}>
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• <Bold>Top customers</Bold> stand apart clearly from the rest of the portfolio in cumulative quarter revenue.</Text>
        <Text titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>• The current mix suggests monitoring <Bold>client concentration</Bold> and using this view as support for account planning.</Text>
      </Container>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <Title text="Latest Orders" titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A" }} marginBottom={10} />
        <Table pageSize={8} showPagination={false} enableSearch={false}>
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
