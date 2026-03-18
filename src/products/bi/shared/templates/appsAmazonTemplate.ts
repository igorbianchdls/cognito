const AMAZON_PEDIDOS_FILTERS = String.raw`
                    AND (
                      NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.canal_conta_id::text, '') = ANY(
                        string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.loja_id::text, '') = ANY(
                        string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.plataforma::text, '') = ANY(
                        string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status::text, '') = ANY(
                        string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status_fulfillment::text, '') = ANY(
                        string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status_pagamento::text, '') = ANY(
                        string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.tenant_id::text, '') = ANY(
                        string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )`

const AMAZON_PAYOUTS_FILTERS = String.raw`
                    AND (
                      NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.canal_conta_id::text, '') = ANY(
                        string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.loja_id::text, '') = ANY(
                        string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.plataforma::text, '') = ANY(
                        string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status::text, '') = ANY(
                        string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.tenant_id::text, '') = ANY(
                        string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )`

const AMAZON_ENVIOS_FILTERS = String.raw`
                    AND (
                      NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.canal_conta_id::text, '') = ANY(
                        string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.loja_id::text, '') = ANY(
                        string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.plataforma::text, '') = ANY(
                        string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status::text, '') = ANY(
                        string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.tenant_id::text, '') = ANY(
                        string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )`

const AMAZON_ESTOQUE_FILTERS = String.raw`
                    AND (
                      NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.canal_conta_id::text, '') = ANY(
                        string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.loja_id::text, '') = ANY(
                        string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.plataforma::text, '') = ANY(
                        string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.status::text, '') = ANY(
                        string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )
                    AND (
                      NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                      OR COALESCE(src.tenant_id::text, '') = ANY(
                        string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                      )
                    )`

function buildCurrentDateFilter(dateField: string) {
  return String.raw`({{de}}::date IS NULL OR src.${dateField}::date >= {{de}}::date)
                    AND ({{ate}}::date IS NULL OR src.${dateField}::date <= {{ate}}::date)`
}

function buildPreviousDateFilter(dateField: string) {
  return String.raw`{{compare_de}}::date IS NOT NULL
                    AND {{compare_ate}}::date IS NOT NULL
                    AND src.${dateField}::date >= {{compare_de}}::date
                    AND src.${dateField}::date <= {{compare_ate}}::date`
}

function buildComparisonKpiQuery(table: string, dateField: string, valueExpr: string, filtersSql: string) {
  return String.raw`WITH atual AS (
                  SELECT ${valueExpr} AS value
                  FROM ${table} src
                  WHERE ${buildCurrentDateFilter(dateField)}
${filtersSql}
                ),
                anterior AS (
                  SELECT ${valueExpr} AS value
                  FROM ${table} src
                  WHERE ${buildPreviousDateFilter(dateField)}
${filtersSql}
                )
                SELECT
                  COALESCE(atual.value, 0)::float AS value,
                  COALESCE(anterior.value, 0)::float AS previous_value,
                  CASE
                    WHEN COALESCE(anterior.value, 0) = 0 THEN 0
                    ELSE (((COALESCE(atual.value, 0) - COALESCE(anterior.value, 0)) / COALESCE(anterior.value, 0)) * 100)::float
                  END AS delta_percent,
                  'vs período anterior'::text AS comparison_label
                FROM atual, anterior`
}

function buildSparklineQuery(table: string, dateField: string, valueExpr: string, filtersSql: string) {
  return String.raw`SELECT
                  TO_CHAR(src.${dateField}::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(src.${dateField}::date, 'DD/MM') AS label,
                  COALESCE(${valueExpr}, 0)::float AS value
                FROM ${table} src
                WHERE ${buildCurrentDateFilter(dateField)}
${filtersSql}
                GROUP BY 1, 2
                ORDER BY 1 ASC`
}

function buildSingleValueQuery(table: string, dateField: string, valueExpr: string, filtersSql: string) {
  return String.raw`SELECT
                COALESCE(${valueExpr}, 0)::float AS value
              FROM ${table} src
              WHERE ${buildCurrentDateFilter(dateField)}
${filtersSql}`
}

export const APPS_AMAZON_TEMPLATE_DSL = String.raw`<DashboardTemplate name="apps_amazon_template_dsl">
  <Theme name="light">
    <Config>
      {
        "managers": {
          "border": {
            "style": "solid",
            "width": 1,
            "color": "#bfc9d9",
            "radius": 10,
            "frame": {
              "variant": "hud",
              "cornerSize": 8,
              "cornerWidth": 1
            }
          },
          "color": {
            "scheme": [
              "#FF9900",
              "#232F3E",
              "#146EB4",
              "#34D399",
              "#F59E0B"
            ]
          }
        }
      }
    </Config>
    <Header direction="row" justify="between" align="center">
      <Container direction="column" gap={4}>
        <Text text="Dashboard Amazon" />
        <Text text="E-commerce • Vendas, logística, financeiro e estoque" />
      </Container>
      <DatePicker visible mode="range" storePath="filters.dateRange" presets={["7d","14d","30d"]}>
        <ActionOnChange type="refresh_data" />
        <Style>
          {
            "padding": 6,
            "fontFamily": "Barlow",
            "fontSize": 12
          }
        </Style>
      </DatePicker>
    </Header>
    <Container direction="row" gap={12} padding={16} wrap justify="start" align="start">
      <SlicerCard fr={1} title="Filtro de Contas">
        <Config>
          {
            "fields": [
              {
                "label": "Conta",
                "type": "list",
                "storePath": "filters.canal_conta_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "canal_conta_id",
                  "pageSize": 80,
                  "dependsOn": [
                    "filters.plataforma"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Filtro de Lojas">
        <Config>
          {
            "fields": [
              {
                "label": "Loja",
                "type": "list",
                "storePath": "filters.loja_id",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "loja_id",
                  "pageSize": 80,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status do Pedido">
        <Config>
          {
            "fields": [
              {
                "label": "Status",
                "type": "list",
                "storePath": "filters.status",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status Pagamento">
        <Config>
          {
            "fields": [
              {
                "label": "Pagamento",
                "type": "list",
                "storePath": "filters.status_pagamento",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status_pagamento",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
      <SlicerCard fr={1} title="Status Fulfillment">
        <Config>
          {
            "fields": [
              {
                "label": "Fulfillment",
                "type": "list",
                "storePath": "filters.status_fulfillment",
                "search": true,
                "selectAll": true,
                "clearable": true,
                "source": {
                  "type": "options",
                  "model": "ecommerce.pedidos",
                  "field": "status_fulfillment",
                  "pageSize": 40,
                  "dependsOn": [
                    "filters.plataforma",
                    "filters.canal_conta_id",
                    "filters.loja_id"
                  ]
                }
              }
            ]
          }
        </Config>
      </SlicerCard>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="GMV" />
            <KPI format="currency" resultPath="kpis.gmv" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.gmv" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#FF9900" fillColor="rgba(255, 153, 0, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#fff7ed" color="#c2410c" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Pedidos" />
            <KPI format="number" resultPath="kpis.pedidos" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'COUNT(*)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.pedidos" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#146EB4" fillColor="rgba(20, 110, 180, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'COUNT(*)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="shopping-cart" size={18} padding={10} radius={10} backgroundColor="#eff6ff" color="#1d4ed8" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Ticket Médio" />
            <KPI format="currency" resultPath="kpis.ticketMedio" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'AVG(valor_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.ticketMedio" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#232F3E" fillColor="rgba(35, 47, 62, 0.14)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'AVG(valor_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#f3f4f6" color="#374151" />
        </Card>
      </Container>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Clientes Únicos" />
            <KPI format="number" resultPath="kpis.clientesUnicos" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'COUNT(DISTINCT cliente_id)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.clientesUnicos" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#34D399" fillColor="rgba(52, 211, 153, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'COUNT(DISTINCT cliente_id)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="users" size={18} padding={10} radius={10} backgroundColor="#ecfdf3" color="#047857" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Receita Líquida Est." />
            <KPI format="currency" resultPath="kpis.receitaLiquida" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_liquido_estimado)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.receitaLiquida" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#0EA5E9" fillColor="rgba(14, 165, 233, 0.14)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_liquido_estimado)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#e0f2fe" color="#0369a1" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Reembolsos" />
            <KPI format="currency" resultPath="kpis.reembolsos" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_reembolsado)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.reembolsos" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#EF4444" fillColor="rgba(239, 68, 68, 0.14)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'SUM(valor_reembolsado)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#fef2f2" color="#dc2626" />
        </Card>
      </Container>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Taxas de Pedido" />
            <KPI format="currency" resultPath="kpis.taxasPedido" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'SUM(taxa_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.taxasPedido" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#8B5CF6" fillColor="rgba(139, 92, 246, 0.14)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'SUM(taxa_total)', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#f3e8ff" color="#7c3aed" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Fee Rate" />
            <KPI format="percent" resultPath="kpis.feeRate" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.pedidos', 'data_pedido', 'CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.feeRate" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="percent" strokeColor="#F59E0B" fillColor="rgba(245, 158, 11, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.pedidos', 'data_pedido', 'CASE WHEN SUM(valor_total)=0 THEN 0 ELSE SUM(taxa_total)/SUM(valor_total) END', AMAZON_PEDIDOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="activity" size={18} padding={10} radius={10} backgroundColor="#fff7ed" color="#c2410c" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Payout Líquido" />
            <KPI format="currency" resultPath="kpis.payoutLiquido" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.payouts', 'data_pagamento', 'SUM(valor_liquido)', AMAZON_PAYOUTS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.payoutLiquido" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#232F3E" fillColor="rgba(35, 47, 62, 0.14)">
              <Query>
                ${buildSparklineQuery('ecommerce.payouts', 'data_pagamento', 'SUM(valor_liquido)', AMAZON_PAYOUTS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#f3f4f6" color="#111827" />
        </Card>
      </Container>
    </Container>

    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Envios" />
            <KPI format="number" resultPath="kpis.envios" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.envios', 'despachado_em', 'COUNT(*)', AMAZON_ENVIOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.envios" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#06B6D4" fillColor="rgba(6, 182, 212, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.envios', 'despachado_em', 'COUNT(*)', AMAZON_ENVIOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="shopping-cart" size={18} padding={10} radius={10} backgroundColor="#ecfeff" color="#0e7490" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Frete Custo" />
            <KPI format="currency" resultPath="kpis.freteCusto" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.envios', 'despachado_em', 'SUM(frete_custo)', AMAZON_ENVIOS_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.freteCusto" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="currency" strokeColor="#14B8A6" fillColor="rgba(20, 184, 166, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.envios', 'despachado_em', 'SUM(frete_custo)', AMAZON_ENVIOS_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="circle-dollar-sign" size={18} padding={10} radius={10} backgroundColor="#ccfbf1" color="#0f766e" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card direction="row" justify="between" align="center" gap={12}>
          <Container direction="column" gap={6}>
            <Text text="Estoque Disponível" />
            <KPI format="number" resultPath="kpis.estoqueDisponivel" comparisonMode="previous_period">
              <Query>
                ${buildComparisonKpiQuery('ecommerce.estoque_saldos', 'snapshot_date', 'SUM(quantidade_disponivel)', AMAZON_ESTOQUE_FILTERS)}
              </Query>
              <DataQuery yField="value" />
            </KPI>
            <KPICompare sourcePath="kpis.estoqueDisponivel" comparisonValueField="delta_percent" labelField="comparison_label" format="percent" />
            <Sparkline height={38} format="number" strokeColor="#84CC16" fillColor="rgba(132, 204, 22, 0.16)">
              <Query>
                ${buildSparklineQuery('ecommerce.estoque_saldos', 'snapshot_date', 'SUM(quantidade_disponivel)', AMAZON_ESTOQUE_FILTERS)}
              </Query>
              <DataQuery xField="key" yField="value" limit={31} />
            </Sparkline>
          </Container>
          <Icon name="badge-check" size={18} padding={10} radius={10} backgroundColor="#ecfccb" color="#4d7c0f" />
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Text text="Meta de Fee Rate" />
          <Gauge
            format="percent"
            target={15}
            min={0}
            max={25}
            width={220}
            height={128}
            thickness={16}
            valueField="value"
            segments={[
              { from: 0, to: 60, color: '#16a34a' },
              { from: 60, to: 85, color: '#f59e0b' },
              { from: 85, to: 100, color: '#dc2626' }
            ]}
          >
            <Query>
              ${buildSingleValueQuery('ecommerce.pedidos', 'data_pedido', 'CASE WHEN SUM(valor_total)=0 THEN 0 ELSE (SUM(taxa_total)/SUM(valor_total)) * 100 END', AMAZON_PEDIDOS_FILTERS)}
            </Query>
          </Gauge>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={2}>
        <Card>
          <Chart type="line" fr={2} title="GMV por Mês" format="currency" height={250}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS label,
                      SUM(valor_total) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 18
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Pedidos por Status" format="number" height={250}>
        <Query>
          SELECT
                      COALESCE(src.status::text, '-') AS key,
                      COALESCE(src.status::text, '-') AS label,
                      COUNT(*) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="status" storePath="filters.status" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 8
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="pie" fr={1} title="GMV por Conta" format="currency" height={250}>
        <Query>
          SELECT
                      COALESCE(src.canal_conta_id::text, '-') AS key,
                      COALESCE(src.canal_conta_id::text, '-') AS label,
                      SUM(valor_total) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="canal_conta_id" storePath="filters.canal_conta_id" clearOnSecondClick />
        <Nivo innerRadius={0.45} />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 8
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="GMV por Loja" format="currency" height={240}>
        <Query>
          SELECT
                      COALESCE(src.loja_id::text, '-') AS key,
                      COALESCE(src.loja_id::text, '-') AS label,
                      SUM(valor_total) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="loja_id" storePath="filters.loja_id" clearOnSecondClick />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 10
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="line" fr={1} title="Receita Líquida Est. por Mês" format="currency" height={240}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM'))::text AS label,
                      SUM(valor_liquido_estimado) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 18
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="pie" fr={1} title="Status de Pagamento" format="number" height={240}>
        <Query>
          SELECT
                      COALESCE(src.status_pagamento::text, '-') AS key,
                      COALESCE(src.status_pagamento::text, '-') AS label,
                      COUNT(*) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Interaction clickAsFilter filterField="status_pagamento" storePath="filters.status_pagamento" clearOnSecondClick />
        <Nivo innerRadius={0.45} />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 8
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Top Produtos por Receita" format="currency" height={260}>
        <Query>
          SELECT
                      COALESCE(src.produto_id::text, '-') AS key,
                      COALESCE(src.produto_id::text, '-') AS label,
                      SUM(valor_total) AS value
                    FROM ecommerce.pedido_itens src
                    WHERE
                          ({{de}}::date IS NULL OR src.created_at::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.created_at::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 12
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Top Produtos por Quantidade" format="number" height={260}>
        <Query>
          SELECT
                      COALESCE(src.produto_id::text, '-') AS key,
                      COALESCE(src.produto_id::text, '-') AS label,
                      SUM(quantidade) AS value
                    FROM ecommerce.pedido_itens src
                    WHERE
                          ({{de}}::date IS NULL OR src.created_at::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.created_at::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 12
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Taxas por Tipo" format="currency" height={260}>
        <Query>
          SELECT
                      COALESCE(src.tipo_taxa::text, '-') AS key,
                      COALESCE(src.tipo_taxa::text, '-') AS label,
                      SUM(valor) AS value
                    FROM ecommerce.taxas_pedido src
                    WHERE
                          ({{de}}::date IS NULL OR src.competencia_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.competencia_em::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 10
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Chart type="line" fr={1} title="Payout Líquido por Mês" format="currency" height={220}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', data_pagamento), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', data_pagamento), 'YYYY-MM'))::text AS label,
                      SUM(valor_liquido) AS value
                    FROM ecommerce.payouts src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pagamento::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pagamento::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 18
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Envios por Transportadora" format="number" height={220}>
        <Query>
          SELECT
                      COALESCE(src.transportadora::text, '-') AS key,
                      COALESCE(src.transportadora::text, '-') AS label,
                      COUNT(*) AS value
                    FROM ecommerce.envios src
                    WHERE
                          ({{de}}::date IS NULL OR src.despachado_em::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.despachado_em::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 8
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="line" fr={1} title="Estoque Disponível por Mês" format="number" height={220}>
        <Query>
          SELECT
                      (TO_CHAR(DATE_TRUNC('month', snapshot_date), 'YYYY-MM'))::text AS key,
                      (TO_CHAR(DATE_TRUNC('month', snapshot_date), 'YYYY-MM'))::text AS label,
                      SUM(quantidade_disponivel) AS value
                    FROM ecommerce.estoque_saldos src
                    WHERE
                          ({{de}}::date IS NULL OR src.snapshot_date::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.snapshot_date::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY label ASC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo curve="monotoneX" area />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 18
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
    </Container>
    <Container direction="row" gap={12} padding={16} justify="start" align="start">
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Ticket Médio por Conta" format="currency" height={220}>
        <Query>
          SELECT
                      COALESCE(src.canal_conta_id::text, '-') AS key,
                      COALESCE(src.canal_conta_id::text, '-') AS label,
                      AVG(valor_total) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 10
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <Chart type="bar" fr={1} title="Clientes Únicos por Loja" format="number" height={220}>
        <Query>
          SELECT
                      COALESCE(src.loja_id::text, '-') AS key,
                      COALESCE(src.loja_id::text, '-') AS label,
                      COUNT(DISTINCT cliente_id) AS value
                    FROM ecommerce.pedidos src
                    WHERE
                          ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
                          AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
                          AND (
                            NULLIF(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.canal_conta_id::text, '') = ANY(
                              string_to_array(regexp_replace({{canal_conta_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.loja_id::text, '') = ANY(
                              string_to_array(regexp_replace({{loja_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.plataforma::text, '') = ANY(
                              string_to_array(regexp_replace({{plataforma}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status::text, '') = ANY(
                              string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_fulfillment::text, '') = ANY(
                              string_to_array(regexp_replace({{status_fulfillment}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.status_pagamento::text, '') = ANY(
                              string_to_array(regexp_replace({{status_pagamento}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                          AND (
                            NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                            OR COALESCE(src.tenant_id::text, '') = ANY(
                              string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                            )
                          )
                    GROUP BY 1, 2
                    ORDER BY value DESC
        </Query>
        <Fields x="label" y="value" key="key" />
        <Nivo layout="horizontal" />
        <Config>
          {
            "dataQuery": {
              "filters": {
                "tenant_id": 1,
                "plataforma": "amazon"
              },
              "limit": 10
            }
          }
        </Config>
          </Chart>
        </Card>
      </Container>
      <Container grow={1}>
        <Card>
          <AISummary fr={1} title="Insights da IA">
        <Config>
          {
            "containerStyle": {
              "padding": "12px 12px 16px 12px"
            },
            "itemTextStyle": {
              "padding": "0 8px"
            },
            "items": [
              {
                "icon": "trendingUp",
                "text": "Amazon cresce em pedidos capturados; priorize reposição dos SKUs com maior giro."
              },
              {
                "icon": "sparkles",
                "text": "Fee rate elevado em contas específicas indica oportunidade de otimizar mix e preço."
              },
              {
                "icon": "triangleAlert",
                "text": "Picos de reembolso e atrasos logísticos podem pressionar o payout líquido do mês."
              }
            ]
          }
        </Config>
          </AISummary>
        </Card>
      </Container>
    </Container>
  </Theme>
</DashboardTemplate>`
