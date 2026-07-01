'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const COMPRAS_VARIANT = {
  fileName: 'dashboard-compras.tsx',
  name: 'dashboard_compras',
  path: 'app/dashboard-compras.tsx',
  title: 'Dashboard de Compras',
}

function buildComprasDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('compras')
  return `<Dashboard id="overview" title="${COMPRAS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="blue">
        <Tabs defaultValue="overview">
          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 24, width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg, alignItems: 'flex-start' }}>
            <article id="compras-sidebar" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flexShrink: 0, width: 320 }}>
              <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 24 }}>
                <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Procurement Review</span>
                    <p data-ui="eyebrow">Compras, fornecedores e alocacao de gasto</p>
                    <h1 data-ui="page-title-sm">Dashboard de Compras</h1>
                    <p data-ui="body-muted">Navegue pelas visoes do dashboard e ajuste os filtros sem depender do header antigo.</p>
                  </div>

                  <DatePicker
                    table="compras"
                    field="data_compra"
                    presets={['7d', '30d', '90d', 'month']}
                    labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                    iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                    presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                    activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                    separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
                  />

                  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p data-ui="eyebrow">Tabs</p>
                    <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Tab value="overview" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Visao geral</Tab>
                      <Tab value="details" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Detalhamento</Tab>
                      <Tab value="insights" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Insights</Tab>
                    </div>
                  </div>
                </article>

                <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p data-ui="eyebrow">Filtro</p>
                  <h2 data-ui="section-title-sm">Fornecedor</h2>
                  <Filter
                    label="Fornecedor"
                    table="compras"
                    field="fornecedor_id"
                    mode="multiple"
                    search
                    clearable
                    width="100%"
                    query={\`
                      SELECT DISTINCT
                        CAST(src.fornecedor_id AS STRING) AS value,
                        COALESCE(c.fornecedor_nome, 'Sem fornecedor') AS label
                      FROM compras src
                      WHERE src.fornecedor_id IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <OptionList />
                  </Filter>
                </article>

                <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p data-ui="eyebrow">Filtro</p>
                  <h2 data-ui="section-title-sm">Documento</h2>
                  <Filter
                    label="Documento"
                    table="compras"
                    field="numero"
                    mode="multiple"
                    search
                    clearable
                    width="100%"
                    query={\`
                      SELECT DISTINCT
                        CAST(c.numero AS STRING) AS value,
                        COALESCE(c.numero, 'Sem documento') AS label
                      FROM compras src
                      WHERE c.numero IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <OptionList />
                  </Filter>
                </article>

                <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p data-ui="eyebrow">Filtro</p>
                  <h2 data-ui="section-title-sm">Status</h2>
                  <Filter
                    label="Status"
                    table="compras"
                    field="status"
                    mode="multiple"
                    search
                    clearable
                    width="100%"
                    query={\`
                      SELECT DISTINCT
                        CAST(src.status AS STRING) AS value,
                        COALESCE(src.status, 'Sem status') AS label
                      FROM compras src
                      WHERE COALESCE(src.status, '') <> ''
                      ORDER BY 2 ASC
                    \`}
                  >
                    <OptionList />
                  </Filter>
                </article>
              </div>
            </article>

            <article id="compras-main" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1 }}>
              <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
                <TabPanel value="overview">
                  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
                      <article id="compras-kpi-valor" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                          <KPI
                            title="Valor comprado"
                            dataQuery={{ query: \`SELECT COALESCE(SUM(c.valor_total), 0) AS value FROM compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="currency"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </article>
                      <article id="compras-kpi-fornecedores" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                          <KPI
                            title="Fornecedores"
                            dataQuery={{ query: \`SELECT COUNT(DISTINCT c.fornecedor_id) AS value FROM compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="number"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </article>
                      <article id="compras-kpi-pedidos" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                          <KPI
                            title="Pedidos"
                            dataQuery={{ query: \`SELECT COUNT(DISTINCT c.id) AS value FROM compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="number"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </article>
                      <article id="compras-kpi-ticket" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                          <KPI
                            title="Ticket medio"
                            dataQuery={{ query: \`SELECT COALESCE(AVG(c.valor_total), 0) AS value FROM compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="currency"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </article>
                    </section>

                    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                      <article id="compras-chart-fornecedor" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Top spend</p>
                          <h2 data-ui="section-title">Gasto por fornecedor</h2>
                        </div>
                        <p data-ui="body-muted">Corte principal para identificar concentracao de compras e dependencia de poucos parceiros no periodo filtrado.</p>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="bar"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(CAST(src.fornecedor_id AS STRING), '0') AS key,
                                  COALESCE(c.fornecedor_nome, 'Sem fornecedor') AS label,
                                  COALESCE(SUM(src.valor_total), 0) AS value
                                FROM compras src
                                WHERE 1=1
                                  {{filters}}
                                GROUP BY 1, 2
                                ORDER BY 3 DESC
                              \`,
                              limit: 8,
                            }}
                            xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                            series={[
                              { dataKey: 'value', label: 'Gasto' },
                            ]}
                            yAxis={{ width: 86 }}
                          />
                        </div>
                      </article>

                      <article id="compras-chart-status" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Allocation</p>
                          <h2 data-ui="section-title">Gasto por status</h2>
                        </div>
                        <p data-ui="body-muted">Mostra em qual status de despesa o volume de compras esta se acumulando no periodo.</p>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="pie"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(CAST(src.status AS STRING), '0') AS key,
                                  COALESCE(src.status, 'Sem status') AS label,
                                  COALESCE(SUM(src.valor_total), 0) AS value
                                FROM compras src
                                WHERE 1=1
                                  {{filters}}
                                GROUP BY 1, 2
                                ORDER BY 3 DESC
                              \`,
                              limit: 6,
                            }}
                            categoryKey="label"
                            legend={{ enabled: true, position: 'right' }}
                            series={[
                              { dataKey: 'value', label: 'Gasto' },
                            ]}
                            recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
                          />
                        </div>
                      </article>
                    </section>

                    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                      <article id="compras-chart-trend" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Trend</p>
                          <h2 data-ui="section-title">Gasto por mes</h2>
                        </div>
                        <p data-ui="body-muted">Serie mensal para entender aceleracao ou desaceleracao de compras sem depender do motor DSL antigo.</p>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="line"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  FORMAT_DATE('%Y-%m', DATE_TRUNC(DATE(src.data_compra), MONTH)) AS key,
                                  FORMAT_DATE('%m/%Y', DATE_TRUNC(DATE(src.data_compra), MONTH)) AS label,
                                  COALESCE(SUM(src.valor_total), 0) AS value
                                FROM compras src
                                WHERE 1=1
                                  {{filters}}
                                GROUP BY 1, 2
                                ORDER BY 1 ASC
                              \`,
                              limit: 12,
                            }}
                            xAxis={{ dataKey: 'label' }}
                            series={[
                              { dataKey: 'value', label: 'Gasto' },
                            ]}
                            yAxis={{ width: 86 }}
                            recharts={{ showDots: false, singleSeriesGradient: true }}
                          />
                        </div>
                      </article>

                      <article id="compras-chart-status" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Status mix</p>
                          <h2 data-ui="section-title">Pedidos por status</h2>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="bar"
                            height="100%"
                            format="number"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(src.status, 'sem_status') AS key,
                                  COALESCE(src.status, 'Sem status') AS label,
                                  COUNT(*) AS value
                                FROM compras src
                                WHERE 1=1
                                  {{filters}}
                                GROUP BY 1, 2
                                ORDER BY 3 DESC
                              \`,
                              limit: 8,
                            }}
                            xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                            series={[
                              { dataKey: 'value', label: 'Pedidos' },
                            ]}
                          />
                        </div>
                      </article>
                    </section>
                  </div>
                </TabPanel>

                <TabPanel value="details">
                  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                      <article id="compras-table" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 324, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Table</p>
                          <h2 data-ui="section-title">Pedidos de compra no detalhe</h2>
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
                                CAST(c.id AS STRING) AS compra_id,
                                COALESCE(c.numero, CONCAT('OC-', CAST(c.id AS STRING))) AS numero,
                                FORMAT_DATE('%d/%m/%Y', DATE(c.data_compra)) AS data_compra,
                                COALESCE(c.fornecedor_nome, 'Sem fornecedor') AS fornecedor,
                                COALESCE(c.numero, 'Sem documento') AS documento,
                                COALESCE(c.status, 'Sem status') AS status,
                                COALESCE(c.valor_total, 0) AS valor_total
                              FROM compras c
                              WHERE 1=1
                                {{filters}}
                              ORDER BY c.data_compra DESC NULLS LAST, c.id DESC
                            \`,
                            limit: 12,
                          }}
                          columns={[
                            { accessorKey: 'numero', header: 'OC' },
                            { accessorKey: 'data_compra', header: 'Data' },
                            { accessorKey: 'fornecedor', header: 'Fornecedor' },
                            { accessorKey: 'documento', header: 'Documento' },
                            { accessorKey: 'status', header: 'Status', cell: 'badge' },
                            { accessorKey: 'valor_total', header: 'Valor', format: 'currency', align: 'right', headerAlign: 'right' },
                          ]}
                        />
                      </article>

                      <article id="compras-pivot" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 324, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Pivot</p>
                          <h2 data-ui="section-title">Fornecedor por status</h2>
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
                                COALESCE(c.fornecedor_nome, 'Sem fornecedor') AS fornecedor,
                                COALESCE(c.status, 'Sem status') AS status,
                                COALESCE(c.valor_total, 0) AS valor_total
                              FROM compras c
                              WHERE 1=1
                                {{filters}}
                            \`,
                            limit: 400,
                          }}
                          rows={[{ field: 'fornecedor', label: 'Fornecedor' }]}
                          columns={[{ field: 'status', label: 'Status' }]}
                          values={[{ field: 'valor_total', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
                        />
                      </article>
                    </section>
                  </div>
                </TabPanel>

                <TabPanel value="insights">
                  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                      <article id="compras-insight-concentracao" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <h2 data-ui="section-title-sm">Concentracao em fornecedores</h2>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: theme.textSecondary }}>
                          <li>Se poucos fornecedores concentram a maior parte do gasto, a negociacao fica mais sensivel a prazo, ruptura e dependencia comercial.</li>
                        </ul>
                      </article>

                      <article id="compras-insight-centro" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <h2 data-ui="section-title-sm">Pressao por centro de custo</h2>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: theme.textSecondary }}>
                          <li>Documento acima da media precisa ser lido junto com status para separar compra pontual de uma tendencia estrutural de gasto.</li>
                        </ul>
                      </article>

                      <article id="compras-insight-risco" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <h2 data-ui="section-title-sm">Risco operacional</h2>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: theme.textSecondary }}>
                          <li>Status com muito volume em analise ou parcial costuma indicar gargalo entre pedido, recebimento e pagamento.</li>
                        </ul>
                      </article>
                    </section>
                  </div>
                </TabPanel>

                <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                  <article id="compras-footer" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 54 }}>
                  <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                    <p data-ui="small-muted">Template JSX de compras com sidebar, tabs laterais e queries SQL explicitas.</p>
                    <p data-ui="small-muted">Tema ativo: ${resolvedThemeName}</p>
                  </footer>
                  </article>
                </section>
              </div>
            </article>
          </section>
        </Tabs>
    </Dashboard>`
}

export function buildComprasDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildComprasDashboardSource(themeName || ''),
    name: COMPRAS_VARIANT.fileName,
    path: COMPRAS_VARIANT.path,
  }
}
