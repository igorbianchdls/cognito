export const REPORT_TEMPLATE_DSL = String.raw`<ReportTemplate name="last_quarter_revenue_analysis" title="Last Quarter Revenue Analysis">
  <Theme name="light" />

  <Report id="capa" title="Cover">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#FFFFFF" gap={28}>
      <Container direction="column" gap={10}>
        <Text style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Q4 / 2025 / Revenue Review
        </Text>
        <Text style={{ fontSize: 32, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Last Quarter Revenue Analysis
        </Text>
        <Text style={{ color: "#5C6470", maxWidth: "72%" }}>
          A document-style revenue summary built in the report DSL, mixing analytical charts with narrative takeaways.
        </Text>
      </Container>

      <List variant="check" gap={12} iconColor="#2F6FED" itemStyle={{ fontSize: 13, lineHeight: 1.7, color: "#384152" }}>
        <ListItem><Bold>Revenue grew</Bold> with a clear concentration in enterprise and mid-market accounts.</ListItem>
        <ListItem><Bold>Segment mix remained healthy</Bold>, but country distribution shows concentration risk.</ListItem>
        <ListItem>The strongest regions offset weaker <Bold>small-business performance</Bold> during the quarter.</ListItem>
      </List>

      <Container direction="column" gap={18} grow={1} padding={24} backgroundColor="#EAF8FF" borderRadius={32}>
        <Container direction="row" gap={18} align="stretch">
          <Container grow={1}>
            <Card padding={20} borderWidth={1} borderColor="#D7ECF8" borderRadius={20} backgroundColor="#F7FCFF" height="100%">
              <Text style={{ fontSize: 11, color: "#6E7F91", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                Quarter at a glance
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 600, color: "#1D2733", letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.2 }}>
                Executive summary
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 1.75, color: "#425063" }}>
                The quarter closed with <Bold>stronger revenue concentration</Bold> in the main channels, while the customer base remained healthy enough to preserve diversification.
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 1.75, color: "#425063", marginTop: 10 }}>
                This report combines <Bold>trend analysis</Bold>, channel composition and recent order detail to support revenue review conversations.
              </Text>
            </Card>
          </Container>

          <Container grow={1}>
            <Card padding={20} borderWidth={1} borderColor="#D7ECF8" borderRadius={20} backgroundColor="#FFFFFF" height="100%">
              <Text style={{ fontSize: 11, color: "#6E7F91", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
                Trend
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 600, color: "#1D2733", letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.25 }}>
                Monthly revenue trend
              </Text>
              <Chart type="line" format="currency" height={240} curve="monotone" showGrid={true} showDots={false} strokeWidth={3} categoryTickColor="#6E7F91" valueTickColor="#6E7F91">
                <Query>
                  SELECT
                    TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'Mon') AS label,
                    COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                  GROUP BY 1
                  ORDER BY MIN(DATE_TRUNC('month', p.data_pedido))
                  LIMIT 6
                </Query>
                <Fields x="label" y="value" />
              </Chart>
            </Card>
          </Container>
        </Container>
      </Container>
    </Container>
  </Report>

  <Report id="summary" title="Summary">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#FFFFFF" gap={22}>
      <Container direction="column" gap={6}>
        <Text style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Last Quarter Revenue Analysis
        </Text>
        <Text style={{ fontSize: 28, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Last Quarter Revenue Analysis
        </Text>
      </Container>

      <Text style={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665" }}>
        This report analyzes <Bold>revenue for the quarter</Bold>, filtered to the current business context.
      </Text>

      <List variant="bullet" gap={8} markerColor="#2A3140" itemStyle={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140" }}>
        <ListItem>Version: Actual</ListItem>
        <ListItem>Scenario: Baseline</ListItem>
        <ListItem><Bold>Breakdown by Channel</Bold></ListItem>
        <ListItem><Bold>Breakdown by Customer</Bold></ListItem>
      </List>

      <Card padding={18} borderWidth={1} borderColor="#E8EBF1" borderRadius={18} backgroundColor="#FFFFFF">
        <Text style={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em", marginBottom: 4, lineHeight: 1.25 }}>
          Breakdown by Channel
        </Text>
        <Text style={{ fontSize: 11, color: "#8B8E97", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          Revenue by Channel
        </Text>
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

      <List variant="check" gap={8} iconColor="#2563eb" itemStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>
        <ListItem><Bold>Primary channels</Bold> concentrate most of the quarter revenue and should remain the focus of closer monitoring.</ListItem>
        <ListItem>The long tail of channels still contributes diversification, but with a visibly <Bold>lower share of total volume</Bold>.</ListItem>
      </List>

      <Container direction="column" gap={8}>
        <Text style={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
          Breakdown by Customer
        </Text>
        <List variant="bullet" gap={8} markerColor="#4E5665" itemStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>
          <ListItem><Bold>Revenue concentration by customer</Bold> suggests a few accounts are disproportionately important to quarter performance.</ListItem>
          <ListItem>This distribution is useful for identifying <Bold>account dependency</Bold> and prioritizing retention efforts.</ListItem>
        </List>
      </Container>
    </Container>
  </Report>

  <Report id="details" title="Detailed View">
    <Container direction="column" minHeight="100%" padding={52} backgroundColor="#FFFFFF" gap={20}>
      <Container direction="column" gap={6}>
        <Text style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Detailed View
        </Text>
        <Text style={{ fontSize: 26, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Customer and Order Details
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 1.65, color: "#5C6470", maxWidth: "78%" }}>
          The sections below combine a comparative country view with recent-order detail, keeping the report in a document-first reading flow.
        </Text>
      </Container>

      <Card padding={18} borderWidth={1} borderColor="#E8EBF1" borderRadius={18} backgroundColor="#FFFFFF">
        <Text style={{ fontSize: 18, fontWeight: 600, color: "#20232A", marginBottom: 10, lineHeight: 1.25 }}>
          Revenue by Customer
        </Text>
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

      <List variant="check" gap={8} iconColor="#2563eb" itemStyle={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665" }}>
        <ListItem><Bold>Top customers</Bold> stand apart clearly from the rest of the portfolio in cumulative quarter revenue.</ListItem>
        <ListItem>The current mix suggests monitoring <Bold>client concentration</Bold> and using this view as support for account planning.</ListItem>
      </List>

      <Card padding={18} borderWidth={1} borderColor="#E8EBF1" borderRadius={18} backgroundColor="#FFFFFF">
        <Text style={{ fontSize: 18, fontWeight: 600, color: "#20232A", marginBottom: 10, lineHeight: 1.25 }}>
          Latest Orders
        </Text>
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
