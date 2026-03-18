export const SLIDE_TEMPLATE_DSL = String.raw`<SlideTemplate name="deck_vendas" title="Apresentação de Vendas">
  <Theme name="light" />

  <Slide id="capa" title="Capa">
    <Container direction="column" justify="between" minHeight="100%" padding={56} backgroundColor="#F4F8FF">
      <Container direction="row" justify="between" align="start">
        <Container direction="column" gap={18} width="58%">
          <Container width={112} height={10} backgroundColor="#2F6FED" borderRadius={999} />
          <Container direction="column" gap={12}>
            <Text text="Q4 2025 SALES PERFORMANCE REVIEW" style={{ fontSize: 12, color: "#56709A", letterSpacing: "0.08em", textTransform: "uppercase" }} />
            <Text text="Quarterly Sales" style={{ fontSize: 42, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
            <Text text="Executive Presentation" style={{ fontSize: 42, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em", marginTop: -8 }} />
          </Container>
          <Text
            text="An executive-ready presentation built with the slide DSL, combining KPI framing, trend analysis, channel mix and customer concentration."
            style={{ fontSize: 16, lineHeight: 1.65, color: "#4F607E", maxWidth: "88%" }}
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
          <Text text="Presentation Focus" style={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} />
          <Container direction="column" gap={10}>
            <Text text="• Revenue momentum and trend consistency" style={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
            <Text text="• Channel mix and share of revenue" style={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
            <Text text="• Concentration across top customer accounts" style={{ fontSize: 14, lineHeight: 1.55, color: "#31415E" }} />
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
              <Text text="Trend snapshot" style={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="Monthly revenue trajectory" style={{ fontSize: 22, fontWeight: 600, color: "#1B2538", letterSpacing: "-0.03em" }} />
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
              <Text text="Narrative" style={{ fontSize: 11, color: "#BFD6FF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Text
                text="The strongest commercial performance came from core channels and larger accounts, while the overall portfolio remained broad enough to support a diversified growth story."
                style={{ fontSize: 15, lineHeight: 1.7, color: "#FFFFFF" }}
              />
            </Card>

            <Card
              padding={22}
              backgroundColor="#E9F2FF"
              borderColor="#D9E6FB"
              borderWidth={1}
              borderRadius={24}
            >
              <Text text="Format" style={{ fontSize: 11, color: "#6C7FA0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Text text="Designed as a 16:9 executive presentation, ready to evolve into export-quality slides and narrative storytelling." style={{ fontSize: 14, lineHeight: 1.6, color: "#33425F" }} />
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
          <Text text="Executive summary" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Text text="Performance Overview" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Text text="Quarterly operational readout across value, volume and pricing." style={{ fontSize: 14, color: "#5C687C" }} />
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
            <Text text="Total sales booked in the selected period." style={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
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
            <Text text="Commercial volume captured by the order base." style={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
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
            <Text text="Indicative value per transaction in the period." style={{ fontSize: 12, lineHeight: 1.5, color: "#6C7688", marginTop: 8 }} />
          </Card>
        </Container>
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={3}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Text text="Trend analysis" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="Daily revenue evolution" style={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
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
              <Text text="Key takeaways" style={{ fontSize: 11, color: "#AFC0E3", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="• Revenue momentum stayed consistent across the selected period, with visible peaks on the strongest commercial days." style={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
              <Text text="• The relationship between order volume and average ticket suggests stability in pricing discipline." style={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
              <Text text="• This slide provides the headline performance story before moving into mix and concentration analysis." style={{ fontSize: 14, lineHeight: 1.65, color: "#FFFFFF" }} />
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
          <Text text="Commercial composition" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Text text="Channel Mix and Revenue Share" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Text text="Comparing proportional contribution with absolute value by channel." style={{ fontSize: 14, color: "#5C687C" }} />
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={2}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Text text="Share of total" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="Revenue by channel" style={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
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
              <Text text="Absolute contribution" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="Channel ranking" style={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
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
          <Text text="Customer concentration" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
          <Text text="Top Accounts and Recent Orders" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Text text="A closer look at dependency on major accounts and the latest commercial activity." style={{ fontSize: 14, color: "#5C687C", maxWidth: "34%" }} />
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={3}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22}>
            <Container direction="column" gap={6} marginBottom={10}>
              <Text text="Top accounts" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase" }} />
              <Text text="Revenue by customer" style={{ fontSize: 22, fontWeight: 600, color: "#172033", letterSpacing: "-0.03em" }} />
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
              <Text text="Implication" style={{ fontSize: 11, color: "#6A7EA1", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
              <Text text="The leading accounts clearly dominate cumulative revenue, which makes this view valuable for risk monitoring and retention planning." style={{ fontSize: 14, lineHeight: 1.65, color: "#33425F" }} />
            </Card>

            <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={22} padding={20}>
              <Text text="Latest orders" style={{ fontSize: 11, color: "#7A879B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
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

  <Slide id="highlights" title="Highlights">
    <Container direction="column" gap={20} minHeight="100%" padding={44} backgroundColor="#F8FAFD">
      <Container direction="row" justify="between" align="start">
        <Container direction="column" gap={8}>
          <Badge text="Executive highlights" icon="sparkles" iconColor="#2563eb" backgroundColor="#EAF2FF" borderColor="#D7E5FF" />
          <Text text="Management Summary" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        </Container>
        <Badge text="Q4 Review" backgroundColor="#FFFFFF" borderColor="#D8DEE9" />
      </Container>

      <Divider label="Priority themes" color="#D8DEE9" />

      <Container direction="row" gap={16} align="stretch">
        <Container grow={2}>
          <Card backgroundColor="#FFFFFF" borderColor="#E5ECF8" borderWidth={1} borderRadius={24} padding={22} height="100%">
            <List variant="icon" icon="sparkles" iconColor="#2563eb" gap={14} itemStyle={{ fontSize: 15, lineHeight: 1.7, color: "#33425F" }}>
              <ListItem>Revenue remained concentrated in the strongest channels, reinforcing the need for disciplined portfolio steering.</ListItem>
              <ListItem icon="users">Top customer contribution remains material enough to justify account-specific retention planning.</ListItem>
              <ListItem icon="shopping-cart">Order volume stability indicates that the quarter was driven more by mix quality than by abrupt demand swings.</ListItem>
            </List>
          </Card>
        </Container>
        <Container grow={1}>
          <Card backgroundColor="#172033" borderColor="#172033" borderWidth={1} borderRadius={24} padding={22} height="100%">
            <Text text="Board note" style={{ fontSize: 11, color: "#AFC0E3", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} />
            <Text text="This slide is intentionally narrative-led, acting as an executive bridge between pure KPI performance and the operational drilldowns in the following pages." style={{ fontSize: 15, lineHeight: 1.75, color: "#FFFFFF" }} />
          </Card>
        </Container>
      </Container>
    </Container>
  </Slide>

  <Slide id="risks" title="Risks">
    <Container direction="column" gap={20} minHeight="100%" padding={44} backgroundColor="#FFFFFF">
      <Container direction="column" gap={8}>
        <Badge text="Risk & concentration" icon="triangle-alert" iconColor="#B45309" backgroundColor="#FFF7ED" borderColor="#FCD9BD" />
        <Text text="Revenue Risks and Dependencies" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
      </Container>

      <Container direction="row" gap={16} align="stretch">
        <Container grow={2}>
          <Callout
            title="Concentration signal"
            icon="triangle-alert"
            iconColor="#D97706"
            backgroundColor="#FFF7ED"
            borderColor="#FCD9BD"
            borderRadius={24}
            padding={22}
            text="A relevant share of the quarter still depends on a limited number of channels and accounts. This is positive for execution focus, but it increases sensitivity to churn, pricing pressure and underperformance in key segments."
          />
        </Container>
        <Container grow={1}>
          <Callout
            title="Recommended response"
            icon="badge-check"
            iconColor="#2563eb"
            backgroundColor="#F4F8FF"
            borderColor="#DCE8FB"
            borderRadius={24}
            padding={22}
            text="Track key-account health weekly, expand secondary channel coverage and use the next cycle to reduce exposure to the single largest revenue clusters."
          />
        </Container>
      </Container>

      <Divider label="Operational follow-up" color="#E5ECF8" />

      <List variant="check" iconColor="#2563eb" gap={12} itemStyle={{ fontSize: 14, lineHeight: 1.7, color: "#33425F" }}>
        <ListItem>Review the top ten customer accounts with sales leadership and classify retention risk.</ListItem>
        <ListItem>Monitor channel-level conversion, average ticket and mix contribution as a single operating scorecard.</ListItem>
        <ListItem>Use the next planning cycle to establish a diversification target across channels and customer cohorts.</ListItem>
      </List>
    </Container>
  </Slide>

  <Slide id="appendix" title="Appendix">
    <Container direction="column" gap={18} minHeight="100%" padding={44} backgroundColor="#F8FAFD">
      <Container direction="row" justify="between" align="center">
        <Text text="Visual Appendix" style={{ fontSize: 30, fontWeight: 700, color: "#172033", letterSpacing: "-0.04em" }} />
        <Badge text="Appendix" icon="package" backgroundColor="#FFFFFF" borderColor="#D8DEE9" />
      </Container>

      <Container direction="row" gap={18} align="stretch">
        <Container grow={3}>
          <Image
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='720' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23EAF2FF'/%3E%3Cstop offset='1' stop-color='%23F8FBFF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' rx='28' fill='url(%23g)'/%3E%3Crect x='72' y='88' width='1056' height='544' rx='24' fill='%23FFFFFF' stroke='%23DCE8FB'/%3E%3Crect x='116' y='132' width='280' height='24' rx='12' fill='%232F6FED' fill-opacity='0.16'/%3E%3Crect x='116' y='188' width='460' height='18' rx='9' fill='%23172033' fill-opacity='0.12'/%3E%3Crect x='116' y='220' width='360' height='18' rx='9' fill='%23172033' fill-opacity='0.08'/%3E%3Crect x='116' y='276' width='968' height='260' rx='22' fill='%23F4F8FF'/%3E%3Cpath d='M160 470 C250 400 320 430 420 350 C520 270 620 320 720 260 C820 200 940 240 1040 170' stroke='%232F6FED' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='420' cy='350' r='10' fill='%232F6FED'/%3E%3Ccircle cx='720' cy='260' r='10' fill='%232F6FED'/%3E%3Ccircle cx='1040' cy='170' r='10' fill='%232F6FED'/%3E%3C/svg%3E"
            alt="Executive appendix visual"
            width="100%"
            height={420}
            objectFit="cover"
            borderRadius={28}
            borderWidth={1}
            borderColor="#DCE8FB"
          />
        </Container>
        <Container grow={2}>
          <Container direction="column" gap={16} height="100%">
            <Callout
              title="How to use this page"
              icon="lightbulb"
              iconColor="#2563eb"
              backgroundColor="#FFFFFF"
              borderColor="#E5ECF8"
              borderRadius={24}
              padding={22}
              text="Use this appendix-style slide for screenshots, mockups, market context or supporting visuals that should not compete with the analytical storyline of the main deck."
            />
            <List variant="icon" icon="sparkles" iconColor="#2563eb" gap={12} itemStyle={{ fontSize: 14, lineHeight: 1.7, color: "#33425F" }}>
              <ListItem>Add product screens, region maps or campaign creatives.</ListItem>
              <ListItem icon="badge-check">Pair the image with one precise interpretation, not a long narrative block.</ListItem>
              <ListItem icon="users">Use appendix pages to support stakeholder-specific questions in live presentation mode.</ListItem>
            </List>
          </Container>
        </Container>
      </Container>
    </Container>
  </Slide>
</SlideTemplate>`
