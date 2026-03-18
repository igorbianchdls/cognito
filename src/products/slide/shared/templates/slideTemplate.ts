export const SLIDE_TEMPLATE_DSL = String.raw`<SlideTemplate name="deck_vendas" title="Apresentação de Vendas">
  <Theme name="light" />

  <Slide id="capa" title="Capa">
    <Container direction="column" justify="between" minHeight="100%" padding={56} backgroundColor="#F4F8FF">
      <Container direction="row" justify="between" align="start">
        <Container direction="column" gap={18} width="58%">
          <Container width={112} height={10} backgroundColor="#2F6FED" borderRadius={999} />
          <Container direction="column" gap={12}>
            <Subtitle text="Q4 2025 SALES PERFORMANCE REVIEW" titleStyle={{ fontSize: 12, color: "#56709A", letterSpacing: "0.08em", textTransform: "uppercase" }} />
            <Title text="Quarterly Sales" titleStyle={{ fontSize: 42, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
            <Title text="Executive Presentation" titleStyle={{ fontSize: 42, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em", marginTop: -8 }} />
          </Container>
          <Subtitle
            text="An executive-ready presentation built with the slide DSL, combining KPI framing, trend analysis, channel mix and customer concentration."
            titleStyle={{ fontSize: 16, lineHeight: 1.65, color: "#4F607E", maxWidth: "88%" }}
          />
        </Container>

        <Card
          width="30%"
          padding={22}
          backgroundColor="#FFFFFF"
          borderColor="#D9E6FB"
          borderWidth={1}
          borderRadius={24}
        >
          <Subtitle text="Presentation Focus" titleStyle={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} />
          <Container direction="column" gap={10}>
            <Subtitle text="• Revenue momentum and trend consistency" titleStyle={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
            <Subtitle text="• Channel mix and share of revenue" titleStyle={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
            <Subtitle text="• Concentration across top customer accounts" titleStyle={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
          </Container>
        </Card>
      </Container>

      <Container direction="row" gap={18} align="stretch">
        <Container grow={3}>
          <Card
            padding={24}
            backgroundColor="#FFFFFF"
            borderColor="#D9E6FB"
            borderWidth={1}
            borderRadius={28}
          >
            <Container direction="column" gap={8} marginBottom={10}>
              <Subtitle text="Trend snapshot" titleStyle={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Title text="Monthly revenue trajectory" titleStyle={{ fontSize: 22, fontWeight: 600, color: "#1B2538", letterSpacing: "-0.03em" }} />
            </Container>
            <Chart type="line" format="currency" height={250} curve="monotone" showGrid={true} showDots={false} strokeWidth={3} categoryTickColor="#66758F" valueTickColor="#66758F">
              <Query>
                SELECT
                  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'Mon') AS label,
                  MIN(DATE_TRUNC('month', p.data_pedido)) AS key,
                  COALESCE(SUM(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
                GROUP BY 1
                ORDER BY 2 ASC
                LIMIT 6
              </Query>
              <Fields x="label" y="value" key="key" />
            </Chart>
          </Card>
        </Container>

        <Container grow={2}>
          <Container direction="column" gap={18} height="100%">
            <Card
              padding={22}
              backgroundColor="#2F6FED"
              borderColor="#2F6FED"
              borderWidth={1}
              borderRadius={24}
            >
              <Subtitle text="Narrative" titleStyle={{ fontSize: 11, color: "#BFD6FF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Subtitle
                text="The strongest commercial performance came from core channels and larger accounts, while the overall portfolio remained broad enough to support a diversified growth story."
                titleStyle={{ fontSize: 15, lineHeight: 1.7, color: "#FFFFFF" }}
              />
            </Card>

            <Card
              padding={22}
              backgroundColor="#E9F2FF"
              borderColor="#D9E6FB"
              borderWidth={1}
              borderRadius={24}
            >
              <Subtitle text="Format" titleStyle={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Subtitle text="Designed as a 16:9 executive presentation, ready to evolve into export-quality slides and narrative storytelling." titleStyle={{ fontSize: 14, lineHeight: 1.6, color: "#33425F" }} />
            </Card>
          </Container>
        </Container>
      </Container>
    </Container>
  </Slide>

  <Slide id="resumo" title="Resumo Executivo">
    <Container direction="column" gap={18} minHeight="100%" padding={44} backgroundColor="#FFFFFF">
      <Container direction="row" justify="between" align="end">
        <Container direction="column" gap={6}>
          <Subtitle text="Executive summary" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Title text="Performance Overview" titleStyle={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Subtitle text="Quarterly operational readout across value, volume and pricing." titleStyle={{ fontSize: 14, color: "#5C687C" }} />
      </Container>

      <Container direction="row" gap={14} align="stretch">
        <Container grow={1}>
          <Card backgroundColor="#F9FBFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={22} padding={20}>
            <KPI title="Revenue" format="currency">
              <Query>
                SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <Subtitle text="Total sales booked in the selected period." titleStyle={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
          </Card>
        </Container>
        <Container grow={1}>
          <Card backgroundColor="#F9FBFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={22} padding={20}>
            <KPI title="Orders" format="number">
              <Query>
                SELECT COUNT(*)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <Subtitle text="Commercial volume captured by the order base." titleStyle={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
          </Card>
        </Container>
        <Container grow={1}>
          <Card backgroundColor="#F9FBFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={22} padding={20}>
            <KPI title="Avg. Ticket" format="currency">
              <Query>
                SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <Subtitle text="Indicative value per transaction in the period." titleStyle={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
          </Card>
        </Container>
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={3}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Subtitle text="Trend analysis" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Title text="Daily revenue evolution" titleStyle={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
            </Container>
            <Chart type="line" format="currency" height={320} curve="monotone" showGrid={true} showDots={false} strokeWidth={3} categoryTickColor="#6D7889" valueTickColor="#6D7889">
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

        <Container grow={2}>
          <Card backgroundColor="#172033" borderColor="#172033" borderWidth={1} borderRadius={24} padding={24} height="100%">
            <Container direction="column" gap={10}>
              <Subtitle text="Key takeaways" titleStyle={{ fontSize: 11, color: "#AFC0E3", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Subtitle text="• Revenue momentum stayed consistent across the selected period, with visible peaks on the strongest commercial days." titleStyle={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
              <Subtitle text="• The relationship between order volume and average ticket suggests stability in pricing discipline." titleStyle={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
              <Subtitle text="• This slide provides the headline performance story before moving into mix and concentration analysis." titleStyle={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
            </Container>
          </Card>
        </Container>
      </Container>
    </Container>
  </Slide>

  <Slide id="mix" title="Mix Comercial">
    <Container direction="column" gap={18} minHeight="100%" padding={44} backgroundColor="#F7F9FC">
      <Container direction="row" justify="between" align="end">
        <Container direction="column" gap={6}>
          <Subtitle text="Commercial composition" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Title text="Channel Mix and Revenue Share" titleStyle={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Subtitle text="Comparing proportional contribution with absolute value by channel." titleStyle={{ fontSize: 14, color: "#5C687C" }} />
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={2}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Subtitle text="Share of total" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Title text="Revenue by channel" titleStyle={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
            </Container>
            <Chart type="pie" format="currency" height={320} innerRadius={72} outerRadius={112} paddingAngle={2} showLabels={false} showLegend>
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

        <Container grow={3}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Subtitle text="Absolute contribution" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Title text="Channel ranking" titleStyle={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
            </Container>
            <Chart type="horizontal-bar" format="currency" height={320} layout="horizontal" radius={8} showGrid valueAxisLabel="Revenue" xTickCount={4} categoryLabelMode="first-word" categoryTickColor="#5F6D83" valueTickColor="#5F6D83">
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
                LIMIT 6
              </Query>
              <Fields x="label" y="value" key="key" />
            </Chart>
          </Card>
        </Container>
      </Container>
    </Container>
  </Slide>

  <Slide id="clientes" title="Clientes">
    <Container direction="column" gap={18} minHeight="100%" padding={44} backgroundColor="#FFFFFF">
      <Container direction="row" justify="between" align="end">
        <Container direction="column" gap={6}>
          <Subtitle text="Customer concentration" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Title text="Top Accounts and Recent Orders" titleStyle={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Subtitle text="A closer look at dependency on major accounts and the latest commercial activity." titleStyle={{ fontSize: 14, color: "#5C687C", maxWidth: "34%" }} />
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={3}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Subtitle text="Top accounts" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Title text="Revenue by customer" titleStyle={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
            </Container>
            <Chart type="bar" format="currency" height={320} layout="vertical" radius={8} showGrid valueAxisLabel="Revenue" xTickCount={5} categoryTickColor="#5F6D83" valueTickColor="#5F6D83">
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

        <Container grow={2}>
          <Container direction="column" gap={16} height="100%">
            <Card backgroundColor="#EFF5FF" borderColor="#DCE8FB" borderWidth={1} borderRadius={22} padding={20}>
              <Subtitle text="Implication" titleStyle={{ fontSize: 11, color: "#6A7EA1", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Subtitle text="The leading accounts clearly dominate cumulative revenue, which makes this view valuable for risk monitoring and retention planning." titleStyle={{ fontSize: 14, lineHeight: 1.65, color: "#33425F" }} />
            </Card>

            <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={22} padding={20}>
              <Subtitle text="Latest orders" titleStyle={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Table pageSize={5} showPagination={false} enableSearch={false}>
                <Config>
                  {
                    "dataQuery": {
                      "query": "SELECT\\n  p.id AS pedido,\\n  p.data_pedido::date AS data_pedido,\\n  COALESCE(c.nome_fantasia, '-') AS cliente,\\n  COALESCE(p.valor_total, 0)::float AS valor_total\\nFROM vendas.pedidos p\\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\\nWHERE 1=1\\n  {{filters:p}}\\nORDER BY p.data_pedido DESC, p.id DESC",
                      "filters": {},
                      "limit": 5
                    },
                    "columns": [
                      { "key": "pedido", "header": "Order" },
                      { "key": "data_pedido", "header": "Date", "format": "date" },
                      { "key": "cliente", "header": "Customer" },
                      { "key": "valor_total", "header": "Value", "format": "currency", "align": "right" }
                    ]
                  }
                </Config>
              </Table>
            </Card>
          </Container>
        </Container>
      </Container>
    </Container>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE_HTML_DSL = String.raw`<SlideTemplate name="deck_vendas_html" title="Apresentação de Vendas HTML">
  <Theme name="light" />

  <Slide id="cover" title="Cover">
    <section style={{ minHeight: "100%", padding: 56, backgroundColor: "#F5F8FE", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
        <div style={{ width: "58%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 120, height: 10, borderRadius: 999, backgroundColor: "#2F6FED" }} />
          <p style={{ margin: 0, fontSize: 12, color: "#5D7193", letterSpacing: "0.08em", textTransform: "uppercase" }}>Q4 2025 Sales Performance Review</p>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 700, letterSpacing: "-0.05em", color: "#162033", lineHeight: 1.02 }}>Quarterly Sales Presentation</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "#4F607E", maxWidth: "86%" }}>
            A narrative-driven executive deck using HTML-like slide DSL, with only <strong>Chart</strong>, <strong>Table</strong> and <strong>KPI</strong> as analytical components.
          </p>
        </div>

        <div style={{ width: "30%", padding: 24, backgroundColor: "#FFFFFF", border: "1px solid #D8E4F9", borderRadius: 24 }}>
          <p style={{ margin: "0 0 10px 0", fontSize: 11, color: "#6E7FA0", letterSpacing: "0.06em", textTransform: "uppercase" }}>Presentation focus</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#31415E" }}>• Revenue trajectory and consistency</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.6, color: "#31415E" }}>• Channel contribution and mix quality</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.6, color: "#31415E" }}>• Customer concentration and latest activity</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
        <div style={{ flexGrow: 3, padding: 24, backgroundColor: "#FFFFFF", border: "1px solid #D8E4F9", borderRadius: 28 }}>
          <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#6E7FA0", letterSpacing: "0.06em", textTransform: "uppercase" }}>Trend snapshot</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#172033" }}>Monthly revenue trajectory</h3>
          <Chart type="line" format="currency" height={250} curve="monotone" showGrid={true} showDots={false} strokeWidth={3} categoryTickColor="#66758F" valueTickColor="#66758F">
            <Query>
              SELECT
                TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'Mon') AS label,
                MIN(DATE_TRUNC('month', p.data_pedido)) AS key,
                COALESCE(SUM(p.valor_total), 0)::float AS value
              FROM vendas.pedidos p
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1
              ORDER BY 2 ASC
              LIMIT 6
            </Query>
            <Fields x="label" y="value" key="key" />
          </Chart>
        </div>

        <div style={{ flexGrow: 2, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ padding: 22, backgroundColor: "#2F6FED", borderRadius: 24 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#BFD6FF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Narrative</p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#FFFFFF" }}>
              The strongest commercial performance came from <strong>core channels</strong> and larger accounts, while the portfolio remained broad enough to sustain a diversified growth story.
            </p>
          </div>
          <div style={{ padding: 22, backgroundColor: "#E9F2FF", border: "1px solid #D8E4F9", borderRadius: 24 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#6E7FA0", letterSpacing: "0.06em", textTransform: "uppercase" }}>Format</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#33425F" }}>
              Designed as a <strong>16:9 executive deck</strong> with strong hierarchy, visual rhythm and room for chart-led storytelling.
            </p>
          </div>
        </div>
      </div>
    </section>
  </Slide>

  <Slide id="summary" title="Summary">
    <section style={{ minHeight: "100%", padding: 44, backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Executive summary</p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", color: "#172033" }}>Performance Overview</h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#5C687C" }}>Quarterly operational readout across value, volume and pricing.</p>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
        <div style={{ flexGrow: 1, padding: 20, backgroundColor: "#F9FBFF", border: "1px solid #E5ECF8", borderRadius: 22 }}>
          <KPI title="Revenue" format="currency">
            <Query>
              SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
              FROM vendas.pedidos p
              WHERE 1=1
                {{filters:p}}
            </Query>
            <DataQuery yField="value" />
          </KPI>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, lineHeight: 1.5, color: "#6C7688" }}>Total sales booked in the selected period.</p>
        </div>
        <div style={{ flexGrow: 1, padding: 20, backgroundColor: "#F9FBFF", border: "1px solid #E5ECF8", borderRadius: 22 }}>
          <KPI title="Orders" format="number">
            <Query>
              SELECT COUNT(*)::float AS value
              FROM vendas.pedidos p
              WHERE 1=1
                {{filters:p}}
            </Query>
            <DataQuery yField="value" />
          </KPI>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, lineHeight: 1.5, color: "#6C7688" }}>Commercial volume captured by the order base.</p>
        </div>
        <div style={{ flexGrow: 1, padding: 20, backgroundColor: "#F9FBFF", border: "1px solid #E5ECF8", borderRadius: 22 }}>
          <KPI title="Avg. Ticket" format="currency">
            <Query>
              SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
              FROM vendas.pedidos p
              WHERE 1=1
                {{filters:p}}
            </Query>
            <DataQuery yField="value" />
          </KPI>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, lineHeight: 1.5, color: "#6C7688" }}>Indicative value per transaction in the period.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flexGrow: 3, padding: 22, backgroundColor: "#FFFFFF", border: "1px solid #E5ECF8", borderRadius: 24 }}>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Trend analysis</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#172033" }}>Daily revenue evolution</h3>
          <Chart type="line" format="currency" height={320} curve="monotone" showGrid={true} showDots={false} strokeWidth={3} categoryTickColor="#6D7889" valueTickColor="#6D7889">
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
        </div>

        <div style={{ flexGrow: 2, padding: 24, backgroundColor: "#172033", borderRadius: 24 }}>
          <p style={{ margin: "0 0 10px 0", fontSize: 11, color: "#AFC0E3", letterSpacing: "0.06em", textTransform: "uppercase" }}>Key takeaways</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }}>• Revenue momentum stayed consistent across the selected period, with visible peaks on the strongest commercial days.</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }}>• The relationship between order volume and average ticket suggests stability in pricing discipline.</p>
          <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }}>• This slide establishes the performance story before moving into mix and concentration analysis.</p>
        </div>
      </div>
    </section>
  </Slide>

  <Slide id="mix" title="Mix">
    <section style={{ minHeight: "100%", padding: 44, backgroundColor: "#F7F9FC", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Commercial composition</p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", color: "#172033" }}>Channel Mix and Revenue Share</h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#5C687C" }}>Comparing proportional contribution with absolute value by channel.</p>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flexGrow: 2, padding: 22, backgroundColor: "#FFFFFF", border: "1px solid #E5ECF8", borderRadius: 24 }}>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Share of total</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#172033" }}>Revenue by channel</h3>
          <Chart type="pie" format="currency" height={320} innerRadius={72} outerRadius={112} paddingAngle={2} showLabels={false} showLegend>
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
        </div>

        <div style={{ flexGrow: 3, padding: 22, backgroundColor: "#FFFFFF", border: "1px solid #E5ECF8", borderRadius: 24 }}>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Absolute contribution</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#172033" }}>Channel ranking</h3>
          <Chart type="horizontal-bar" format="currency" height={320} layout="horizontal" radius={8} showGrid valueAxisLabel="Revenue" xTickCount={4} categoryLabelMode="first-word" categoryTickColor="#5F6D83" valueTickColor="#5F6D83">
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
              LIMIT 6
            </Query>
            <Fields x="label" y="value" key="key" />
          </Chart>
        </div>
      </div>
    </section>
  </Slide>

  <Slide id="customers" title="Customers">
    <section style={{ minHeight: "100%", padding: 44, backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Customer concentration</p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", color: "#172033" }}>Top Accounts and Recent Orders</h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#5C687C", maxWidth: "34%" }}>A closer look at dependency on major accounts and the latest commercial activity.</p>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flexGrow: 3, padding: 22, backgroundColor: "#FFFFFF", border: "1px solid #E5ECF8", borderRadius: 24 }}>
          <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Top accounts</p>
          <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#172033" }}>Revenue by customer</h3>
          <Chart type="bar" format="currency" height={320} layout="vertical" radius={8} showGrid valueAxisLabel="Revenue" xTickCount={5} categoryTickColor="#5F6D83" valueTickColor="#5F6D83">
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
        </div>

        <div style={{ flexGrow: 2, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 20, backgroundColor: "#EFF5FF", border: "1px solid #DCE8FB", borderRadius: 22 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#6A7EA1", letterSpacing: "0.06em", textTransform: "uppercase" }}>Implication</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#33425F" }}>
              The leading accounts clearly dominate cumulative revenue, making this view valuable for <strong>risk monitoring</strong> and retention planning.
            </p>
          </div>

          <div style={{ padding: 20, backgroundColor: "#FFFFFF", border: "1px solid #E5ECF8", borderRadius: 22 }}>
            <p style={{ margin: "0 0 8px 0", fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Latest orders</p>
            <Table pageSize={5} showPagination={false} enableSearch={false}>
              <Config>
                {
                  "dataQuery": {
                    "query": "SELECT\\n  p.id AS pedido,\\n  p.data_pedido::date AS data_pedido,\\n  COALESCE(c.nome_fantasia, '-') AS cliente,\\n  COALESCE(p.valor_total, 0)::float AS valor_total\\nFROM vendas.pedidos p\\nLEFT JOIN entidades.clientes c ON c.id = p.cliente_id\\nWHERE 1=1\\n  {{filters:p}}\\nORDER BY p.data_pedido DESC, p.id DESC",
                    "filters": {},
                    "limit": 5
                  },
                  "columns": [
                    { "key": "pedido", "header": "Order" },
                    { "key": "data_pedido", "header": "Date", "format": "date" },
                    { "key": "cliente", "header": "Customer" },
                    { "key": "valor_total", "header": "Value", "format": "currency", "align": "right" }
                  ]
                }
              </Config>
            </Table>
          </div>
        </div>
      </div>
    </section>
  </Slide>
</SlideTemplate>`
