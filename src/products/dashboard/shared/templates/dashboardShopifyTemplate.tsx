'use client'

import {
  buildDashboardInlineUiSource,
  buildDashboardThemeImportSource,
  getDashboardTemplatePalette,
  getDashboardTemplateThemeName,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const SHOPIFY_VARIANT = {
  fileName: 'dashboard-shopify.tsx',
  name: 'dashboard_shopify',
  path: 'app/dashboard-shopify.tsx',
  title: 'Dashboard Shopify',
}

function buildShopifyDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('shopify')
  const chartColors = getDashboardTemplatePalette('shopify')
  return `import { DASHBOARD_CHART_PALETTES } from './chart-colors'
${buildDashboardThemeImportSource()}

export function DashboardShopify() {
  const THEME_NAME = ${JSON.stringify(resolvedThemeName)}
  const CHART_PALETTE = 'red'
  const CHART_COLORS = DASHBOARD_CHART_PALETTES[CHART_PALETTE] ?? ${JSON.stringify(chartColors)}
${buildDashboardInlineUiSource()}

  return (
    <DashboardTemplate name="${SHOPIFY_VARIANT.name}" title="${SHOPIFY_VARIANT.title}">
      <Theme name={THEME_NAME} />
      <Dashboard id="overview" title="${SHOPIFY_VARIANT.title}">
        <section style={{ display: 'flex', flexDirection: 'column', gap: isClassic ? 20 : 24, minHeight: '100%', padding: isClassic ? 28 : 32, backgroundColor: theme.pageBg }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: isClassic ? 20 : 24, padding: isClassic ? '20px 24px' : 24, borderRadius: isClassic && cardFrame ? 0 : 24, border: `1px solid \${theme.surfaceBorder}`, backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: `1px solid \${theme.accentBorder}`, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>E-commerce Core</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Shopify para vendas, pagamento e fulfillment</p>
                <h1 style={{ ...ui.title, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Shopify</h1>
              </div>
              <p style={ui.subtitle}>Migracao do template legado para JSX com tags, preservando GMV, pedidos, ticket, operacao de pagamento e fulfillment no mesmo dashboard.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                label="Periodo do pedido"
                table="ecommerce.pedidos"
                field="data_pedido"
                presets={['7d', '30d', '90d', 'month']}
                labelStyle={ui.headerDatePickerLabel}
                fieldStyle={ui.headerDatePickerField}
                iconStyle={ui.headerDatePickerIcon}
                presetButtonStyle={ui.headerDatePickerPreset}
                activePresetButtonStyle={ui.headerDatePickerPresetActive}
                separatorStyle={ui.headerDatePickerSeparator}
              />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Filters</p>
                <h2 style={ui.title}>Loja e status</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <Filter
                  label="Loja"
                  table="ecommerce.pedidos"
                  field="loja_id"
                  mode="multiple"
                  search
                  clearable
                  width={220}
                  query={\`
                    SELECT DISTINCT
                      src.loja_id::text AS value,
                      COALESCE(src.loja_id::text, 'Sem loja') AS label
                    FROM ecommerce.pedidos src
                    WHERE src.plataforma = 'shopify'
                      AND src.loja_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                >
                  <Select />
                </Filter>
                <Filter
                  label="Pagamento"
                  table="ecommerce.pedidos"
                  field="status_pagamento"
                  mode="multiple"
                  search
                  clearable
                  width={220}
                  query={\`
                    SELECT DISTINCT
                      src.status_pagamento::text AS value,
                      COALESCE(src.status_pagamento, 'Sem status') AS label
                    FROM ecommerce.pedidos src
                    WHERE src.plataforma = 'shopify'
                      AND COALESCE(src.status_pagamento, '') <> ''
                    ORDER BY 2 ASC
                  \`}
                >
                  <Select />
                </Filter>
              </div>
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={ui.eyebrow}>Leitura esperada</p>
              <p style={ui.paragraph}>Primeiro confira GMV e pedidos, depois veja se o mix de pagamento e fulfillment esta sustentando a operacao sem vazamento em reembolso.</p>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: `1px solid \${theme.surfaceBorder}`, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Receita bruta</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>GMV</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COUNT(*)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: `1px solid \${theme.surfaceBorder}`, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Volume</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Pedidos</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(AVG(src.valor_total), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: `1px solid \${theme.surfaceBorder}`, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Monetizacao</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Ticket medio</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.valor_reembolsado), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: `1px solid \${theme.surfaceBorder}`, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Leakage</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Reembolsos</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <Tabs defaultValue="sales">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="sales">Sales</Tab>
              <Tab value="operations">Operations</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="sales">
              <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Store mix</p>
                    <h2 style={ui.title}>GMV por loja</h2>
                  </div>
                  <p style={ui.paragraph}>Distribui o faturamento por loja para separar concentracao de receita, assimetria de sortimento e dependencia comercial.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.loja_id::text, 'sem_loja') AS key,
                          COALESCE(src.loja_id::text, 'Sem loja') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      limit: 8,
                    }}
                    xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                    series={[
                      { dataKey: 'value', label: 'GMV' },
                    ]}
                    yAxis={{ width: 86 }}
                  />
                </Card>

                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Payment mix</p>
                    <h2 style={ui.title}>Pedidos por status de pagamento</h2>
                  </div>
                  <p style={ui.paragraph}>Ajuda a medir o quanto do volume ja virou caixa e quanto ainda esta pendente, em risco ou parcialmente capturado.</p>
                  <Chart
                    type="pie"
                    height={320}
                    format="number"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.status_pagamento, 'sem_status') AS key,
                          COALESCE(src.status_pagamento, 'Sem status') AS label,
                          COUNT(*)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      limit: 6,
                    }}
                    categoryKey="label"
                    legend={{ enabled: true, position: 'right' }}
                    series={[
                      { dataKey: 'value', label: 'Pedidos' },
                    ]}
                    recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
                  />
                </Card>
              </section>
            </TabPanel>

            <TabPanel value="operations">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Trend</p>
                    <h2 style={ui.title}>GMV por mes</h2>
                  </div>
                  <p style={ui.paragraph}>Serie mensal para confrontar aceleracao de vendas com carga operacional e pressao de reembolso.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'MM/YYYY') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      \`,
                      limit: 12,
                    }}
                    xAxis={{ dataKey: 'label' }}
                    series={[
                      { dataKey: 'value', label: 'GMV' },
                    ]}
                    yAxis={{ width: 86 }}
                    recharts={{ showDots: false, singleSeriesGradient: true }}
                  />
                </Card>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={ui.eyebrow}>Fulfillment</p>
                      <h2 style={ui.title}>Pedidos por fulfillment</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
                      colors={CHART_COLORS}
                      dataQuery={{
                        query: \`
                          SELECT
                            COALESCE(src.status_fulfillment, 'sem_status') AS key,
                            COALESCE(src.status_fulfillment, 'Sem status') AS label,
                            COUNT(*)::float AS value
                          FROM ecommerce.pedidos src
                          WHERE src.plataforma = 'shopify'
                            {{filters}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`,
                        limit: 6,
                      }}
                      xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                      series={[
                        { dataKey: 'value', label: 'Pedidos' },
                      ]}
                    />
                  </Card>
                  <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...ui.title, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Perguntas para o time alinhar comercial, pagamento e fulfillment.</p>
                    </div>
                    <Insights
                      textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#008060' }}
                      items={[
                        { text: 'GMV crescendo com status de pagamento pendente alto pode mascarar receita ainda nao capturada.' },
                        { text: 'Fulfillment atrasado ou parcial costuma antecipar cancelamento, suporte e reembolso no ciclo seguinte.' },
                        { text: 'Lojas com ticket maior e reembolso alto pedem leitura de sortimento, frete, promessa comercial e operacao de entrega.' },
                      ]}
                    />
                  </Card>
                </section>
              </section>
            </TabPanel>

            <TabPanel value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Table</p>
                    <h2 style={ui.title}>Pedidos no detalhe</h2>
                  </div>
                  <Table
                    bordered
                    rounded
                    stickyHeader
                    borderColor={ui.tableBorderColor}
                    rowHoverColor={ui.tableRowHoverColor}
                    headerStyle={ui.tableHeaderStyle}
                    rowStyle={ui.tableRowStyle}
                    cellStyle={ui.tableCellStyle}
                    footerStyle={ui.tableFooterStyle}
                    enableExportCsv
                    dataQuery={{
                      query: \`
                        SELECT
                          CONCAT('#', src.id::text) AS pedido,
                          TO_CHAR(src.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                          COALESCE(src.loja_id::text, 'Sem loja') AS loja,
                          COALESCE(src.status_pagamento, 'Sem status') AS status_pagamento,
                          COALESCE(src.status_fulfillment, 'Sem status') AS status_fulfillment,
                          COALESCE(src.valor_total, 0)::float AS valor_total
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters}}
                        ORDER BY src.data_pedido DESC NULLS LAST, src.id DESC
                      \`,
                      limit: 12,
                    }}
                    columns={[
                      { accessorKey: 'pedido', header: 'Pedido' },
                      { accessorKey: 'data_pedido', header: 'Data' },
                      { accessorKey: 'loja', header: 'Loja' },
                      { accessorKey: 'status_pagamento', header: 'Pagamento', cell: 'badge' },
                      { accessorKey: 'status_fulfillment', header: 'Fulfillment', cell: 'badge' },
                      { accessorKey: 'valor_total', header: 'Valor', format: 'currency', align: 'right', headerAlign: 'right' },
                    ]}
                  />
                </Card>

                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Pivot</p>
                    <h2 style={ui.title}>Loja por pagamento</h2>
                  </div>
                  <PivotTable
                    bordered
                    rounded
                    stickyHeader
                    borderColor={ui.tableBorderColor}
                    containerStyle={ui.pivotContainerStyle}
                    headerStyle={ui.pivotHeaderStyle}
                    headerTotalStyle={ui.pivotHeaderTotalStyle}
                    rowLabelStyle={ui.pivotRowLabelStyle}
                    cellStyle={ui.pivotCellStyle}
                    rowTotalStyle={ui.pivotRowTotalStyle}
                    footerStyle={ui.pivotFooterStyle}
                    emptyStateStyle={ui.pivotEmptyStateStyle}
                    expandButtonStyle={ui.pivotExpandButtonStyle}
                    enableExportCsv
                    defaultExpandedLevels={1}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.loja_id::text, 'Sem loja') AS loja,
                          COALESCE(src.status_pagamento, 'Sem status') AS status_pagamento,
                          COALESCE(src.valor_total, 0)::float AS valor_total
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters}}
                      \`,
                      limit: 400,
                    }}
                    rows={[{ field: 'loja', label: 'Loja' }]}
                    columns={[{ field: 'status_pagamento', label: 'Pagamento' }]}
                    values={[{ field: 'valor_total', label: 'GMV', aggregate: 'sum', format: 'currency' }]}
                  />
                </Card>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: isClassic ? '16px 20px' : '18px 22px', borderRadius: isClassic && cardFrame ? 0 : 22, backgroundColor: theme.surfaceBg, border: `1px solid \${theme.surfaceBorder}` }}>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Shopify com leitura comercial e operacional, adaptado do app legado para o formato novo do dashboard.</p>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: {THEME_NAME}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildShopifyDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildShopifyDashboardSource(themeName || ''),
    name: SHOPIFY_VARIANT.fileName,
    path: SHOPIFY_VARIANT.path,
  }
}
