'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const SHOPIFY_VARIANT = {
  fileName: 'dashboard-shopify.tsx',
  name: 'dashboard_shopify',
  path: 'app/dashboard-shopify.tsx',
  title: 'Dashboard Shopify',
}

function buildShopifyDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('shopify')
  return `<Dashboard id="overview" title="${SHOPIFY_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="red">
        <Vertical gap={18} style={{ width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <Horizontal gap={18}>
          <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>E-commerce Core</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text variant="eyebrow">Shopify para vendas, pagamento e fulfillment</Text>
                <Text as="h1" variant="page-title">Dashboard Shopify</Text>
              </div>
              <Text variant="lead">Migracao do template legado para JSX com tags, preservando GMV, pedidos, ticket, operacao de pagamento e fulfillment no mesmo dashboard.</Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                table="ecommerce.pedidos"
                field="data_pedido"
                presets={['7d', '30d', '90d', 'month']}
                labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
              />
            </div>
          </header>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="shopify-filters" span={8} rows={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text variant="eyebrow">Filters</Text>
                <Text as="h2" variant="section-title">Loja e status</Text>
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

            <Card id="shopify-reading" span={4} rows={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Text variant="eyebrow">Leitura esperada</Text>
              <Text variant="body-muted">Primeiro confira GMV e pedidos, depois veja se o mix de pagamento e fulfillment esta sustentando a operacao sem vazamento em reembolso.</Text>
            </Card>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={16}>
            <Card id="shopify-kpi-gmv" span={3} rows={4} variant="kpi" style={{ height: '100%' }}><KPI title="GMV" dataQuery={{ query: \`SELECT COALESCE(SUM(src.valor_total), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></Card>
            <Card id="shopify-kpi-pedidos" span={3} rows={4} variant="kpi" style={{ height: '100%' }}><KPI title="Pedidos" dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period"><KPICompare /></KPI></Card>
            <Card id="shopify-kpi-ticket" span={3} rows={4} variant="kpi" style={{ height: '100%' }}><KPI title="Ticket medio" dataQuery={{ query: \`SELECT COALESCE(AVG(src.valor_total), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></Card>
            <Card id="shopify-kpi-reembolsos" span={3} rows={4} variant="kpi" style={{ height: '100%' }}><KPI title="Reembolsos" dataQuery={{ query: \`SELECT COALESCE(SUM(src.valor_reembolsado), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></Card>
          </Horizontal>

          <Tabs defaultValue="sales">
            <Vertical gap={18}>
              <Horizontal columns={12} rowHeight={18} gap={10}>
                <Card id="shopify-tabs" span={12} rows={2}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Tab value="sales">Sales</Tab>
                    <Tab value="operations">Operations</Tab>
                    <Tab value="details">Detalhamento</Tab>
                  </div>
                </Card>
              </Horizontal>

            <TabPanel value="sales">
              <Vertical gap={18}>
              <Horizontal columns={12} rowHeight={18} gap={18}>
                <Card id="shopify-sales-gmv" span={7} rows={12} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Store mix</Text>
                    <Text as="h2" variant="section-title">GMV por loja</Text>
                  </div>
                  <Text variant="body-muted">Distribui o faturamento por loja para separar concentracao de receita, assimetria de sortimento e dependencia comercial.</Text>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
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

                <Card id="shopify-sales-payment" span={5} rows={12} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Payment mix</Text>
                    <Text as="h2" variant="section-title">Pedidos por status de pagamento</Text>
                  </div>
                  <Text variant="body-muted">Ajuda a medir o quanto do volume ja virou caixa e quanto ainda esta pendente, em risco ou parcialmente capturado.</Text>
                  <Chart
                    type="pie"
                    height={320}
                    format="number"
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
              </Horizontal>
              </Vertical>
            </TabPanel>

            <TabPanel value="operations">
              <Vertical gap={18}>
              <Horizontal columns={12} rowHeight={18} gap={18}>
                <Card id="shopify-ops-trend" span={7} rows={12} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Trend</Text>
                    <Text as="h2" variant="section-title">GMV por mes</Text>
                  </div>
                  <Text variant="body-muted">Serie mensal para confrontar aceleracao de vendas com carga operacional e pressao de reembolso.</Text>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
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

                <Card id="shopify-ops-side" span={5} rows={12}>
                <Vertical gap={18} style={{ height: '100%' }}>
                  <Card id="shopify-ops-fulfillment" grow={1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Text variant="eyebrow">Fulfillment</Text>
                      <Text as="h2" variant="section-title">Pedidos por fulfillment</Text>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
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
                  <Card id="shopify-ops-insights" grow={1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Text as="h2" variant="section-title-sm">Leituras operacionais</Text>
                      <Text variant="small-muted">Perguntas para o time alinhar comercial, pagamento e fulfillment.</Text>
                    </div>
                    <Insights
                      textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#008060' }}
                      items={[
                        { text: 'GMV crescendo com status de pagamento pendente alto pode mascarar receita ainda nao capturada.' },
                        { text: 'Fulfillment atrasado ou parcial costuma antecipar cancelamento, suporte e reembolso no ciclo seguinte.' },
                        { text: 'Lojas com ticket maior e reembolso alto pedem leitura de sortimento, frete, promessa comercial e operacao de entrega.' },
                      ]}
                    />
                  </Card>
                </Vertical>
                </Card>
              </Horizontal>
              </Vertical>
            </TabPanel>

            <TabPanel value="details">
              <Vertical gap={18}>
              <Horizontal columns={12} rowHeight={18} gap={18}>
                <Card id="shopify-details-table" span={8} rows={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Table</Text>
                    <Text as="h2" variant="section-title">Pedidos no detalhe</Text>
                  </div>
                  <Table
                    bordered
                    rounded
                    stickyHeader
                    borderColor={'#d7dbe3'}
                    rowHoverColor={'#f8fafc'}
                    headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
                    rowStyle={{ backgroundColor: '#ffffff' }}
                    cellStyle={{ color: '#475569', fontSize: 14, fontWeight: 400, padding: '12px 14px' }}
                    footerStyle={{ backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '12px 14px' }}
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

                <Card id="shopify-details-pivot" span={4} rows={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Pivot</Text>
                    <Text as="h2" variant="section-title">Loja por pagamento</Text>
                  </div>
                  <PivotTable
                    bordered
                    rounded
                    stickyHeader
                    borderColor={'#d7dbe3'}
                    containerStyle={{ backgroundColor: '#ffffff' }}
                    headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                    headerTotalStyle={{ backgroundColor: '#f1f5f9', color: '#1e293b', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                    rowLabelStyle={{ backgroundColor: '#ffffff', color: '#1e293b', fontSize: 14, padding: '9px 10px' }}
                    cellStyle={{ backgroundColor: '#ffffff', color: '#475569', fontSize: 14, padding: '9px 10px' }}
                    rowTotalStyle={{ backgroundColor: '#f8fafc', color: '#1e293b', fontSize: 14, fontWeight: 500, padding: '9px 10px' }}
                    footerStyle={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '9px 10px' }}
                    emptyStateStyle={{ color: '#64748b', fontSize: 14, padding: '18px 12px' }}
                    expandButtonStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#475569', hoverBackgroundColor: '#f8fafc' }}
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
              </Horizontal>
              </Vertical>
            </TabPanel>
            </Vertical>
          </Tabs>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="shopify-footer" span={12} rows={3}>
          <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
            <Text variant="small-muted">Template JSX para Shopify com leitura comercial e operacional, adaptado do app legado para o formato novo do dashboard.</Text>
            <Text variant="small-muted">Theme ativo: ${resolvedThemeName}</Text>
          </footer>
            </Card>
          </Horizontal>
        </Vertical>
    </Dashboard>`
}

export function buildShopifyDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildShopifyDashboardSource(themeName || ''),
    name: SHOPIFY_VARIANT.fileName,
    path: SHOPIFY_VARIANT.path,
  }
}
