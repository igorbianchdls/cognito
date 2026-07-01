'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const GOOGLEADS_VARIANT = {
  fileName: 'dashboard-googleads.tsx',
  name: 'dashboard_googleads',
  path: 'app/dashboard-googleads.tsx',
  title: 'Dashboard Google Ads',
}

function buildGoogleAdsDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('googleads')
  return `<Dashboard id="overview" title="${GOOGLEADS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="orange">
        <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 18 }}>
              <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
                  <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Paid Search</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p data-ui="eyebrow">Google Ads para Search, Shopping e PMax</p>
                    <h1 data-ui="page-title-sm">Dashboard Google Ads</h1>
                  </div>
                  <p data-ui="lead">Versao JSX do template legado com foco em volume, eficiencia e aquisicao, agora no formato novo do workspace sem DSL.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
                  <DatePicker
                    label="Periodo de performance"
                    table="paid_media_insights_daily"
                    field="data_ref"
                    presets={['7d', '14d', '30d', '90d']}
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
            <article id="googleads-filters" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 108, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p data-ui="eyebrow">Filters</p>
                  <h2 data-ui="section-title">Conta e grupo</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                  <Filter
                    label="Conta"
                    table="paid_media_insights_daily"
                    field="account_id"
                    mode="multiple"
                    search
                    clearable
                    width={220}
                    query={\`
                      SELECT DISTINCT
                        CAST(src.account_id AS STRING) AS value,
                        COALESCE(CAST(src.account_id AS STRING), 'Sem conta') AS label
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        AND src.account_id IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <Select />
                  </Filter>
                  <Filter
                    label="Grupo"
                    table="paid_media_insights_daily"
                    field="ad_group_id"
                    mode="multiple"
                    search
                    clearable
                    width={220}
                    query={\`
                      SELECT DISTINCT
                        CAST(src.ad_group_id AS STRING) AS value,
                        COALESCE(CAST(src.ad_group_id AS STRING), 'Sem grupo') AS label
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        AND src.ad_group_id IS NOT NULL
                      ORDER BY 2 ASC
                    \`}
                  >
                    <Select />
                  </Filter>
                </div>
              </article>

            <article id="googleads-reading" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p data-ui="eyebrow">Leitura esperada</p>
                <p data-ui="body-muted">Comece por volume e retorno, depois confronte CTR, CVR e CPA para separar problema de demanda, criativo ou pagina.</p>
              </article>
          </section>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
            <article id="googleads-kpi-gasto" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                <KPI
                  title="Gasto"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(src.spend), 0) AS value
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </article>
            <article id="googleads-kpi-receita" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                <KPI
                  title="Receita atribuida"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(src.conversion_value), 0) AS value
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </article>
            <article id="googleads-kpi-roas" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                <KPI
                  title="ROAS"
                  dataQuery={{
                    query: \`
                      SELECT
                        CASE WHEN COALESCE(SUM(src.spend), 0) = 0 THEN 0 ELSE (SUM(src.conversion_value) / SUM(src.spend)) END AS value
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="number"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </article>
            <article id="googleads-kpi-cpa" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}>
                <KPI
                  title="CPA"
                  dataQuery={{
                    query: \`
                      SELECT
                        CASE WHEN COALESCE(SUM(src.conversions), 0) = 0 THEN 0 ELSE (SUM(src.spend) / SUM(src.conversions)) END AS value
                      FROM paid_media_insights_daily src
                      WHERE src.nivel = 'campaign'
                        {{filters}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </article>
          </section>

          <Tabs defaultValue="performance">
            <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'stretch' }}>
                <article id="googleads-tabs" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 36 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Tab value="performance">Performance</Tab>
                    <Tab value="acquisition">Aquisicao</Tab>
                    <Tab value="details">Detalhamento</Tab>
                  </div>
                </article>
              </section>

              <TabPanel value="performance">
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                    <article id="googleads-performance-spend" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Top spend</p>
                          <h2 data-ui="section-title">Gasto por campanha</h2>
                        </div>
                        <p data-ui="body-muted">Ajuda a isolar onde Search, Shopping ou PMax estao carregando o budget antes de abrir o funil de qualidade.</p>
                        <Chart
                          type="bar"
                          height={320}
                          format="currency"
                          dataQuery={{
                            query: \`
                              SELECT
                                COALESCE(CAST(src.campaign_id AS STRING), 'sem_campanha') AS key,
                                COALESCE(CAST(src.campaign_id AS STRING), 'Sem campanha') AS label,
                                COALESCE(SUM(src.spend), 0) AS value
                              FROM paid_media_insights_daily src
                              WHERE src.nivel = 'campaign'
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
                      </article>

                    <article id="googleads-performance-ctr" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Rate quality</p>
                          <h2 data-ui="section-title">CTR por conta</h2>
                        </div>
                        <p data-ui="body-muted">Mistura de volume e relevancia para mostrar quais contas sustentam cliques qualificados e quais dependem de impressao sem resposta.</p>
                        <Chart
                          type="bar"
                          height={320}
                          format="percent"
                          dataQuery={{
                            query: \`
                              SELECT
                                COALESCE(CAST(src.account_id AS STRING), 'sem_conta') AS key,
                                COALESCE(CAST(src.account_id AS STRING), 'Sem conta') AS label,
                                CASE WHEN COALESCE(SUM(src.impressions), 0) = 0 THEN 0 ELSE (SUM(src.clicks) / SUM(src.impressions)) END AS value
                              FROM paid_media_insights_daily src
                              WHERE src.nivel = 'campaign'
                                {{filters}}
                              GROUP BY 1, 2
                              ORDER BY 3 DESC
                            \`,
                            limit: 6,
                          }}
                          xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                          series={[
                            { dataKey: 'value', label: 'CTR' },
                          ]}
                          yAxis={{ width: 86 }}
                        />
                      </article>
                  </section>
                </div>
              </TabPanel>

              <TabPanel value="acquisition">
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                    <article id="googleads-acquisition-trend" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Trend</p>
                          <h2 data-ui="section-title">Gasto por mes</h2>
                        </div>
                        <p data-ui="body-muted">Serie para confrontar aceleracao de investimento com as mudancas de qualidade de trafego ao longo do periodo.</p>
                        <Chart
                          type="line"
                          height={320}
                          format="currency"
                          dataQuery={{
                            query: \`
                              SELECT
                                FORMAT_DATE('%Y-%m', DATE_TRUNC(DATE(src.data_ref), MONTH)) AS key,
                                FORMAT_DATE('%m/%Y', DATE_TRUNC(DATE(src.data_ref), MONTH)) AS label,
                                COALESCE(SUM(src.spend), 0) AS value
                              FROM paid_media_insights_daily src
                              WHERE src.nivel = 'campaign'
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
                      </article>

                    <article id="googleads-acquisition-side" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216 }}>
                      <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
                        <article id="googleads-acquisition-cvr" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <p data-ui="eyebrow">Conversion quality</p>
                              <h2 data-ui="section-title">CVR por mes</h2>
                            </div>
                            <Chart
                              type="bar"
                              height={220}
                              format="percent"
                              dataQuery={{
                                query: \`
                                  SELECT
                                    FORMAT_DATE('%Y-%m', DATE_TRUNC(DATE(src.data_ref), MONTH)) AS key,
                                    FORMAT_DATE('%m/%Y', DATE_TRUNC(DATE(src.data_ref), MONTH)) AS label,
                                    CASE WHEN COALESCE(SUM(src.clicks), 0) = 0 THEN 0 ELSE (SUM(src.conversions) / SUM(src.clicks)) END AS value
                                  FROM paid_media_insights_daily src
                                  WHERE src.nivel = 'campaign'
                                    {{filters}}
                                  GROUP BY 1, 2
                                  ORDER BY 1 ASC
                                \`,
                                limit: 12,
                              }}
                              xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                              series={[
                                { dataKey: 'value', label: 'CVR' },
                              ]}
                            />
                          </article>

                        <article id="googleads-acquisition-insights" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <h2 data-ui="section-title-sm">Leituras operacionais</h2>
                              <p data-ui="small-muted">Perguntas para separar problema de volume, relevancia ou eficiencia de pagina.</p>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: theme.textSecondary }}>
                              <li>Gasto subindo com CTR e CVR em queda costuma indicar keyword ou audiencia sem aderencia real.</li>
                              <li>CPA estourando sem perda de CTR geralmente aponta para problema de pagina, oferta ou tracking de conversao.</li>
                              <li>Contas com muito clique e pouca receita atribuida precisam ser lidas junto com conversao e valor medio do pedido.</li>
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
                    <article id="googleads-details-table" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Table</p>
                          <h2 data-ui="section-title">Campanhas no detalhe</h2>
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
                                COALESCE(CAST(src.account_id AS STRING), 'Sem conta') AS conta,
                                COALESCE(CAST(src.campaign_id AS STRING), 'Sem campanha') AS campanha,
                                COALESCE(SUM(src.clicks), 0) AS cliques,
                                COALESCE(SUM(src.conversions), 0) AS conversoes,
                                CASE WHEN COALESCE(SUM(src.conversions), 0) = 0 THEN 0 ELSE (SUM(src.spend) / SUM(src.conversions)) END AS cpa,
                                CASE WHEN COALESCE(SUM(src.spend), 0) = 0 THEN 0 ELSE (SUM(src.conversion_value) / SUM(src.spend)) END AS roas
                              FROM paid_media_insights_daily src
                              WHERE src.nivel = 'campaign'
                                {{filters}}
                              GROUP BY 1, 2
                              ORDER BY cliques DESC, campanha ASC
                            \`,
                            limit: 12,
                          }}
                          columns={[
                            { accessorKey: 'conta', header: 'Conta' },
                            { accessorKey: 'campanha', header: 'Campanha' },
                            { accessorKey: 'cliques', header: 'Cliques', format: 'number', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'conversoes', header: 'Conversoes', format: 'number', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'cpa', header: 'CPA', format: 'currency', align: 'right', headerAlign: 'right' },
                            { accessorKey: 'roas', header: 'ROAS', format: 'number', align: 'right', headerAlign: 'right' },
                          ]}
                        />
                      </article>

                    <article id="googleads-details-pivot" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p data-ui="eyebrow">Pivot</p>
                          <h2 data-ui="section-title">Conta por campanha</h2>
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
                                COALESCE(CAST(src.account_id AS STRING), 'Sem conta') AS conta,
                                COALESCE(CAST(src.campaign_id AS STRING), 'Sem campanha') AS campanha,
                                COALESCE(src.spend, 0) AS gasto
                              FROM paid_media_insights_daily src
                              WHERE src.nivel = 'campaign'
                                {{filters}}
                            \`,
                            limit: 300,
                          }}
                          rows={[{ field: 'conta', label: 'Conta' }]}
                          columns={[{ field: 'campanha', label: 'Campanha' }]}
                          values={[{ field: 'gasto', label: 'Gasto', aggregate: 'sum', format: 'currency' }]}
                        />
                      </article>
                  </section>
                </div>
              </TabPanel>
            </div>
          </Tabs>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
            <article id="googleads-footer" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 54 }}>
              <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                <p data-ui="small-muted">Template JSX para Google Ads com volume, retorno e eficiencia em um unico arquivo TSX no formato novo do dashboard.</p>
                <p data-ui="small-muted">Tema ativo: ${resolvedThemeName}</p>
              </footer>
            </article>
          </section>
        </div>
    </Dashboard>`
}

export function buildGoogleAdsDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildGoogleAdsDashboardSource(themeName || ''),
    name: GOOGLEADS_VARIANT.fileName,
    path: GOOGLEADS_VARIANT.path,
  }
}
