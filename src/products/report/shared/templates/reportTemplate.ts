export const REPORT_TEMPLATE_DSL = String.raw`<ReportTemplate name="last_quarter_revenue_analysis" title="Last Quarter Revenue Analysis">
  <Theme name="light" />

  <Report id="capa" title="Cover">
    <div style={{ minHeight: "100%", padding: 52, backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        <p style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>
          Q4 / 2025 / Revenue Review
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", margin: 0 }}>
          Last Quarter Revenue Analysis
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5C6470", maxWidth: "72%", margin: 0 }}>
          A document-style revenue summary built in the report DSL, mixing analytical charts with narrative takeaways.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#384152", margin: 0 }}>• <strong>Revenue grew</strong> with a clear concentration in enterprise and mid-market accounts.</p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#384152", margin: 0 }}>• <strong>Segment mix remained healthy</strong>, but country distribution shows concentration risk.</p>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#384152", margin: 0 }}>• The strongest regions offset weaker <strong>small-business performance</strong> during the quarter.</p>
      </div>

      <div style={{ flexGrow: 1, borderRadius: 32, backgroundColor: "#EAF8FF", padding: 24, gap: 18, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: 18, alignItems: "stretch" }}>
          <div style={{ flexGrow: 1 }}>
            <Card
              padding={20}
              borderWidth={1}
              borderColor="#D7ECF8"
              borderRadius={20}
              backgroundColor="#F7FCFF"
            >
              <p style={{ fontSize: 11, color: "#6E7F91", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 8px 0" }}>Quarter at a glance</p>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1D2733", letterSpacing: "-0.03em", margin: "0 0 10px 0" }}>Executive summary</h2>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#425063", margin: 0 }}>
                The quarter closed with <strong>stronger revenue concentration</strong> in the main channels, while the customer base remained healthy enough to preserve diversification.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#425063", margin: "10px 0 0 0" }}>
                This report combines <strong>trend analysis</strong>, channel composition and recent order detail to support revenue review conversations.
              </p>
            </Card>
          </div>

          <div style={{ flexGrow: 1 }}>
            <Card
              padding={20}
              borderWidth={1}
              borderColor="#D7ECF8"
              borderRadius={20}
              backgroundColor="#FFFFFF"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: "#6E7F91", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>Trend</p>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1D2733", letterSpacing: "-0.03em", margin: 0 }}>Monthly revenue trend</h3>
              </div>
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
          </div>
        </div>
      </div>
    </div>
  </Report>

  <Report id="summary" title="Summary">
    <div style={{ minHeight: "100%", padding: 52, backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
        <p style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>Last Quarter Revenue Analysis</p>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", margin: 0 }}>Last Quarter Revenue Analysis</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>This report analyzes <strong>revenue for the quarter</strong>, filtered to:</p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140", margin: 0 }}>• Version: Actual</p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140", margin: 0 }}>• Scenario: Baseline</p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#4E5665", margin: "4px 0 0 0" }}>It provides <strong>two complementary views</strong>:</p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140", margin: 0 }}>• <strong>Breakdown by Channel</strong></p>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#2A3140", margin: 0 }}>• <strong>Breakdown by Customer</strong></p>
      </div>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em", margin: 0 }}>Breakdown by Channel</h3>
          <p style={{ fontSize: 11, color: "#8B8E97", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>Revenue by Channel</p>
        </div>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• <strong>Primary channels</strong> concentrate most of the quarter revenue and should remain the focus of closer monitoring.</p>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• The long tail of channels still contributes diversification, but with a visibly <strong>lower share of total volume</strong>.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#20232A", letterSpacing: "-0.02em", margin: 0 }}>Breakdown by Customer</h3>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• <strong>Revenue concentration by customer</strong> suggests a few accounts are disproportionately important to quarter performance.</p>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• This distribution is useful for identifying <strong>account dependency</strong> and prioritizing retention efforts.</p>
      </div>
    </div>
  </Report>

  <Report id="details" title="Detailed View">
    <div style={{ minHeight: "100%", padding: 52, backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: "#8B8E97", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>Detailed View</p>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "#20232A", letterSpacing: "-0.03em", margin: 0 }}>Customer and Order Details</h1>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#5C6470", maxWidth: "78%", margin: 0 }}>
          The sections below combine a comparative country view with recent-order detail, keeping the report in a document-first reading flow.
        </p>
      </div>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#20232A", margin: "0 0 10px 0" }}>Revenue by Customer</h3>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• <strong>Top customers</strong> stand apart clearly from the rest of the portfolio in cumulative quarter revenue.</p>
        <p style={{ fontSize: 12, lineHeight: 1.65, color: "#4E5665", margin: 0 }}>• The current mix suggests monitoring <strong>client concentration</strong> and using this view as support for account planning.</p>
      </div>

      <Card
        padding={18}
        borderWidth={1}
        borderColor="#E8EBF1"
        borderRadius={18}
        backgroundColor="#FFFFFF"
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#20232A", margin: "0 0 10px 0" }}>Latest Orders</h3>
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
    </div>
  </Report>
</ReportTemplate>`
