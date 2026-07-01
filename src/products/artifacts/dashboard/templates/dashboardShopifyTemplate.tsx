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
        <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 18 }}>
          <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>E-commerce Core</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p data-ui="eyebrow">Shopify para vendas, pagamento e fulfillment</p>
                <h1 data-ui="page-title-sm">Dashboard Shopify</h1>
              </div>
              <p data-ui="lead">Migracao do template legado para JSX com tags, preservando GMV, pedidos, ticket, operacao de pagamento e fulfillment no mesmo dashboard.</p>
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
          </section>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
            <article id="shopify-filters" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p data-ui="eyebrow">Filters</p>
                <h2 data-ui="section-title">Loja e status</h2>
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
            </article>

            <article id="shopify-reading" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p data-ui="eyebrow">Leitura esperada</p>
              <p data-ui="body-muted">Primeiro confira GMV e pedidos, depois veja se o mix de pagamento e fulfillment esta sustentando a operacao sem vazamento em reembolso.</p>
            </article>
          </section>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
            <article id="shopify-kpi-gmv" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="GMV" dataQuery={{ query: \`SELECT COALESCE(SUM(src.valor_total), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="shopify-kpi-pedidos" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Pedidos" dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="shopify-kpi-ticket" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Ticket medio" dataQuery={{ query: \`SELECT COALESCE(AVG(src.valor_total), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="shopify-kpi-reembolsos" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Reembolsos" dataQuery={{ query: \`SELECT COALESCE(SUM(src.valor_reembolsado), 0)::float AS value FROM ecommerce.pedidos src WHERE src.plataforma = 'shopify' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></article>
          </section>

          <Tabs defaultValue="sales">
            <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'stretch' }}>
                <article id="shopify-tabs" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 36 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Tab value="sales">Sales</Tab>
                    <Tab value="operations">Operations</Tab>
                    <Tab value="details">Detalhamento</Tab>
                  </div>
                </article>
              </section>

            <TabPanel value="sales">
              <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                <article id="shopify-sales-gmv" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Store mix</p>
                    <h2 data-ui="section-title">GMV por loja</h2>
                  </div>
                  <p data-ui="body-muted">Distribui o faturamento por loja para separar concentracao de receita, assimetria de sortimento e dependencia comercial.</p>
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
                </article>

                <article id="shopify-sales-payment" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Payment mix</p>
                    <h2 data-ui="section-title">Pedidos por status de pagamento</h2>
                  </div>
                  <p data-ui="body-muted">Ajuda a medir o quanto do volume ja virou caixa e quanto ainda esta pendente, em risco ou parcialmente capturado.</p>
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
                </article>
              </section>
              </div>
            </TabPanel>

            <TabPanel value="operations">
              <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                <article id="shopify-ops-trend" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Trend</p>
                    <h2 data-ui="section-title">GMV por mes</h2>
                  </div>
                  <p data-ui="body-muted">Serie mensal para confrontar aceleracao de vendas com carga operacional e pressao de reembolso.</p>
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
                </article>

                <article id="shopify-ops-side" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216 }}>
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
                  <article id="shopify-ops-fulfillment" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p data-ui="eyebrow">Fulfillment</p>
                      <h2 data-ui="section-title">Pedidos por fulfillment</h2>
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
                  </article>
                  <article id="shopify-ops-insights" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 data-ui="section-title-sm">Leituras operacionais</h2>
                      <p data-ui="small-muted">Perguntas para o time alinhar comercial, pagamento e fulfillment.</p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: theme.textSecondary }}>
                      <li>GMV crescendo com status de pagamento pendente alto pode mascarar receita ainda nao capturada.</li>
                      <li>Fulfillment atrasado ou parcial costuma antecipar cancelamento, suporte e reembolso no ciclo seguinte.</li>
                      <li>Lojas com ticket maior e reembolso alto pedem leitura de sortimento, frete, promessa comercial e operacao de entrega.</li>
                    </ul>
                  </article>
                </div>
                </article>
              </section>
              </div>
            </TabPanel>

            <TabPanel value="details">
              <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                <article id="shopify-details-table" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 288, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Table</p>
                    <h2 data-ui="section-title">Pedidos no detalhe</h2>
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
                </article>

                <article id="shopify-details-pivot" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 288, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Pivot</p>
                    <h2 data-ui="section-title">Loja por pagamento</h2>
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
                </article>
              </section>
              </div>
            </TabPanel>
            </div>
          </Tabs>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
            <article id="shopify-footer" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 54 }}>
          <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
            <p data-ui="small-muted">Template JSX para Shopify com leitura comercial e operacional, adaptado do app legado para o formato novo do dashboard.</p>
            <p data-ui="small-muted">Tema ativo: ${resolvedThemeName}</p>
          </footer>
            </article>
          </section>
        </div>
    </Dashboard>`
}

export function buildShopifyDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildShopifyDashboardSource(themeName || ''),
    name: SHOPIFY_VARIANT.fileName,
    path: SHOPIFY_VARIANT.path,
  }
}
