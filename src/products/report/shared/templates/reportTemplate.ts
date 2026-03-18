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
        <Subtitle text="• Revenue grew with a clear concentration in enterprise and mid-market accounts." titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }} />
        <Subtitle text="• Segment mix remained healthy, but country distribution shows concentration risk." titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }} />
        <Subtitle text="• The strongest regions offset weaker small-business performance during the quarter." titleStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }} />
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
        <Subtitle text="This report analyzes revenue for the quarter, filtered to:" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665" }} />
        <Subtitle text="• Version: Actual" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
        <Subtitle text="• Scenario: Baseline" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
        <Subtitle text="It provides two complementary views:" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665", marginTop: 4 }} />
        <Subtitle text="• Breakdown by Channel" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
        <Subtitle text="• Breakdown by Customer" titleStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }} />
      </Container>

      <Container direction="column" gap={8} marginBottom={8}>
        <Title
          text="Breakdown by Channel"
          titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em" }}
        />
        <Subtitle text="Revenue by Channel" titleStyle={{ fontSize: 11, color: "#8B8E97", textTransform: "uppercase", letterSpacing: "0.04em" }} />
      </Container>

      <Container
        marginBottom={18}
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
      </Container>

      <Container direction="column" gap={8} marginBottom={18}>
        <Subtitle text="• Primary channels concentrate most of the quarter revenue and should remain the focus of closer monitoring." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
        <Subtitle text="• The long tail of channels still contributes diversification, but with a visibly lower share of total volume." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
      </Container>

      <Container direction="column" gap={8}>
        <Title
          text="Breakdown by Customer"
          titleStyle={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em" }}
        />
        <Subtitle text="• Revenue concentration by customer suggests a few accounts are disproportionately important to quarter performance." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
        <Subtitle text="• This distribution is useful for identifying account dependency and prioritizing retention efforts." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
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

      <Container
        marginBottom={20}
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
      </Container>

      <Container direction="column" gap={8} marginBottom={18}>
        <Subtitle text="• Top customers stand apart clearly from the rest of the portfolio in cumulative quarter revenue." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
        <Subtitle text="• The current mix suggests monitoring client concentration and using this view as support for account planning." titleStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }} />
      </Container>

      <Container
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
      </Container>
    </Container>
  </Report>
</ReportTemplate>`
