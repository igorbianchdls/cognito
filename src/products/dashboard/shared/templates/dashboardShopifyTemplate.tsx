'use client'

import { buildDashboardModuleUi } from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const SHOPIFY_VARIANT = {
  fileName: 'dashboard-shopify.tsx',
  name: 'dashboard_shopify',
  path: 'app/dashboard-shopify.tsx',
  title: 'Dashboard Shopify',
}

function buildShopifyDashboardSource(themeName: string) {
  const ui = buildDashboardModuleUi(themeName)
  return `export function DashboardShopify() {
  return (
    <DashboardTemplate name="${SHOPIFY_VARIANT.name}" title="${SHOPIFY_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${SHOPIFY_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={${JSON.stringify(ui.badge)}}>E-commerce Core</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Shopify para vendas, pagamento e fulfillment</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Shopify</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Migracao do template legado para JSX com tags, preservando GMV, pedidos, ticket, operacao de pagamento e fulfillment no mesmo dashboard.</p>
            </div>
            <article style={${JSON.stringify(ui.noteCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Workspace note</p>
              <p style={${JSON.stringify(ui.paragraph)}}>O filtro de plataforma fica fixo em Shopify e o dashboard prioriza leitura comercial e operacional em um unico arquivo TSX no runtime novo.</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <article style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Global controls</p>
                <h2 style={${JSON.stringify(ui.title)}}>Periodo, loja e status</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePicker
                  label="Periodo do pedido"
                  table="ecommerce.pedidos"
                  field="data_pedido"
                  presets={['7d', '30d', '90d', 'month']}
                  labelStyle={${JSON.stringify(ui.headerDatePickerLabel)}}
                  fieldStyle={${JSON.stringify(ui.headerDatePickerField)}}
                  iconStyle={${JSON.stringify(ui.headerDatePickerIcon)}}
                  presetButtonStyle={${JSON.stringify(ui.headerDatePickerPreset)}}
                  activePresetButtonStyle={${JSON.stringify(ui.headerDatePickerPresetActive)}}
                  separatorStyle={${JSON.stringify(ui.headerDatePickerSeparator)}}
                />
                <Slicer
                  label="Loja"
                  field="loja_id"
                  variant="dropdown"
                  selectionMode="multiple"
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
                />
                <Slicer
                  label="Pagamento"
                  field="status_pagamento"
                  variant="dropdown"
                  selectionMode="multiple"
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
                />
              </div>
            </article>

            <article style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Leitura esperada</p>
              <p style={${JSON.stringify(ui.paragraph)}}>Primeiro confira GMV e pedidos, depois veja se o mix de pagamento e fulfillment esta sustentando a operacao sem vazamento em reembolso.</p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Receita bruta</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>GMV</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COUNT(*)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Volume</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Pedidos</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(AVG(src.valor_total), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Monetizacao</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Ticket medio</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.valor_reembolsado), 0)::float AS value
                  FROM ecommerce.pedidos src
                  WHERE src.plataforma = 'shopify'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Leakage</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Reembolsos</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
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
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Store mix</p>
                    <h2 style={${JSON.stringify(ui.title)}}>GMV por loja</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Distribui o faturamento por loja para separar concentracao de receita, assimetria de sortimento e dependencia comercial.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.loja_id::text, 'sem_loja') AS key,
                          COALESCE(src.loja_id::text, 'Sem loja') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 8,
                    }}
                    yAxis={{ width: 86 }}
                    xAxis={{ labelMode: 'first-word' }}
                  />
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Payment mix</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Pedidos por status de pagamento</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Ajuda a medir o quanto do volume ja virou caixa e quanto ainda esta pendente, em risco ou parcialmente capturado.</p>
                  <Chart
                    type="pie"
                    height={320}
                    format="number"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.status_pagamento, 'sem_status') AS key,
                          COALESCE(src.status_pagamento, 'Sem status') AS label,
                          COUNT(*)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 6,
                    }}
                    legend={{ enabled: true, position: 'right' }}
                    series={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
                  />
                </article>
              </section>
            </TabPanel>

            <TabPanel value="operations">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Trend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>GMV por mes</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Serie mensal para confrontar aceleracao de vendas com carga operacional e pressao de reembolso.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'MM/YYYY') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM ecommerce.pedidos src
                        WHERE src.plataforma = 'shopify'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 12,
                    }}
                    yAxis={{ width: 86 }}
                    series={{ showDots: false, singleSeriesGradient: true }}
                  />
                </article>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={${JSON.stringify(ui.eyebrow)}}>Fulfillment</p>
                      <h2 style={${JSON.stringify(ui.title)}}>Pedidos por fulfillment</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
                      colors={${JSON.stringify(ui.chartScheme)}}
                      dataQuery={{
                        query: \`
                          SELECT
                            COALESCE(src.status_fulfillment, 'sem_status') AS key,
                            COALESCE(src.status_fulfillment, 'Sem status') AS label,
                            COUNT(*)::float AS value
                          FROM ecommerce.pedidos src
                          WHERE src.plataforma = 'shopify'
                            {{filters:src}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`,
                        xField: 'label',
                        yField: 'value',
                        keyField: 'key',
                        limit: 6,
                      }}
                      xAxis={{ labelMode: 'first-word' }}
                    />
                  </article>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Perguntas para o time alinhar comercial, pagamento e fulfillment.</p>
                    </div>
                    <Insights
                      textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#008060' }}
                      items={[
                        { text: 'GMV crescendo com status de pagamento pendente alto pode mascarar receita ainda nao capturada.' },
                        { text: 'Fulfillment atrasado ou parcial costuma antecipar cancelamento, suporte e reembolso no ciclo seguinte.' },
                        { text: 'Lojas com ticket maior e reembolso alto pedem leitura de sortimento, frete, promessa comercial e operacao de entrega.' },
                      ]}
                    />
                  </article>
                </section>
              </section>
            </TabPanel>

            <TabPanel value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Table</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Pedidos no detalhe</h2>
                  </div>
                  <Table
                    bordered
                    rounded
                    stickyHeader
                    borderColor={${JSON.stringify(ui.tableBorderColor)}}
                    rowHoverColor={${JSON.stringify(ui.tableRowHoverColor)}}
                    headerStyle={${JSON.stringify(ui.tableHeaderStyle)}}
                    rowStyle={${JSON.stringify(ui.tableRowStyle)}}
                    cellStyle={${JSON.stringify(ui.tableCellStyle)}}
                    footerStyle={${JSON.stringify(ui.tableFooterStyle)}}
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
                          {{filters:src}}
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
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Pivot</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Loja por pagamento</h2>
                  </div>
                  <PivotTable
                    bordered
                    rounded
                    stickyHeader
                    borderColor={${JSON.stringify(ui.tableBorderColor)}}
                    containerStyle={${JSON.stringify(ui.pivotContainerStyle)}}
                    headerStyle={${JSON.stringify(ui.pivotHeaderStyle)}}
                    headerTotalStyle={${JSON.stringify(ui.pivotHeaderTotalStyle)}}
                    rowLabelStyle={${JSON.stringify(ui.pivotRowLabelStyle)}}
                    cellStyle={${JSON.stringify(ui.pivotCellStyle)}}
                    rowTotalStyle={${JSON.stringify(ui.pivotRowTotalStyle)}}
                    footerStyle={${JSON.stringify(ui.pivotFooterStyle)}}
                    emptyStateStyle={${JSON.stringify(ui.pivotEmptyStateStyle)}}
                    expandButtonStyle={${JSON.stringify(ui.pivotExpandButtonStyle)}}
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
                          {{filters:src}}
                      \`,
                      limit: 400,
                    }}
                    rows={[{ field: 'loja', label: 'Loja' }]}
                    columns={[{ field: 'status_pagamento', label: 'Pagamento' }]}
                    values={[{ field: 'valor_total', label: 'GMV', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Shopify com leitura comercial e operacional, adaptado do app legado para o formato novo do dashboard.</p>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${themeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildShopifyDashboardTemplateVariant(themeName: string) {
  return {
    content: buildShopifyDashboardSource(themeName),
    name: SHOPIFY_VARIANT.fileName,
    path: SHOPIFY_VARIANT.path,
  }
}
