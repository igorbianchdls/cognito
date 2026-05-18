'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const METAADS_VARIANT = {
  fileName: 'dashboard-metaads.tsx',
  name: 'dashboard_metaads',
  path: 'app/dashboard-metaads.tsx',
  title: 'Dashboard Meta Ads',
}

function buildMetaAdsDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('metaads')
  return `<Dashboard id="overview" title="${METAADS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="purple">
        <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, width: '100%', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 18 }}>
              <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
                  <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Paid Social</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">Meta Ads performance por conta, campanha e criativo</Text>
                    <Text as="h1" variant="page-title-sm">Dashboard Meta Ads</Text>
                  </div>
                  <Text variant="lead">Adaptacao do template legado de apps para JSX com tags, queries SQL explicitas e leitura de paid social no runtime novo do workspace.</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
                  <DatePicker
                    label="Periodo de performance"
                    table="trafegopago.desempenho_diario"
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
            <article id="metaads-filters" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 108, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">Filters</Text>
                  <Text as="h2" variant="section-title">Conta e campanha</Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                  <Filter label="Conta" table="trafegopago.desempenho_diario" field="conta_id" mode="multiple" search clearable width={220} query={\`
                    SELECT DISTINCT
                      src.conta_id::text AS value,
                      COALESCE(src.conta_id::text, 'Sem conta') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.conta_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}>
                    <Select />
                  </Filter>
                  <Filter label="Campanha" table="trafegopago.desempenho_diario" field="campanha_id" mode="multiple" search clearable width={240} query={\`
                    SELECT DISTINCT
                      src.campanha_id::text AS value,
                      COALESCE(src.campanha_id::text, 'Sem campanha') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.campanha_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}>
                    <Select />
                  </Filter>
                </div>
              </article>
            <article id="metaads-reading" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 108, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Text variant="eyebrow">Leitura esperada</Text>
                <Text variant="body-muted">Primeiro veja o pacing de gasto e retorno, depois abra concentracao por campanha e finalmente desca para o detalhe de anuncios e grupos quando houver desbalanceamento.</Text>
              </article>
          </section>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
            <article id="metaads-kpi-gasto" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Gasto" dataQuery={{ query: \`SELECT COALESCE(SUM(src.gasto), 0)::float AS value FROM trafegopago.desempenho_diario src WHERE src.plataforma = 'meta_ads' AND src.nivel = 'campaign' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="metaads-kpi-receita" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Receita atribuida" dataQuery={{ query: \`SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value FROM trafegopago.desempenho_diario src WHERE src.plataforma = 'meta_ads' AND src.nivel = 'campaign' {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="metaads-kpi-roas" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="ROAS" dataQuery={{ query: \`SELECT CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value FROM trafegopago.desempenho_diario src WHERE src.plataforma = 'meta_ads' AND src.nivel = 'campaign' {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period"><KPICompare /></KPI></article>
            <article id="metaads-kpi-conversoes" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 3', minHeight: 72, height: '100%' }}><KPI title="Conversoes" dataQuery={{ query: \`SELECT COALESCE(SUM(src.conversoes), 0)::float AS value FROM trafegopago.desempenho_diario src WHERE src.plataforma = 'meta_ads' AND src.nivel = 'campaign' {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period"><KPICompare /></KPI></article>
          </section>

          <Tabs defaultValue="performance">
            <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'stretch' }}>
                <article id="metaads-tabs" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 36 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Tab value="performance">Performance</Tab>
                    <Tab value="efficiency">Eficiencia</Tab>
                    <Tab value="details">Detalhamento</Tab>
                  </div>
                </article>
              </section>

              <TabPanel value="performance">
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                    <article id="metaads-performance-gasto" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Budget concentration</Text>
                          <Text as="h2" variant="section-title">Gasto por campanha</Text>
                        </div>
                        <Text variant="body-muted">Identifica quais campanhas carregam a maior parte do investimento e merecem inspeccao imediata de criativo e audiencia.</Text>
                        <Chart type="bar" height={320} format="currency" dataQuery={{ query: \`
                          SELECT
                            COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                            COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                            COALESCE(SUM(src.gasto), 0)::float AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`, limit: 8 }} xAxis={{ dataKey: 'label', labelMode: 'first-word' }} series={[{ dataKey: 'value', label: 'Gasto' }]} yAxis={{ width: 86 }} />
                      </article>

                    <article id="metaads-performance-share" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Share</Text>
                          <Text as="h2" variant="section-title">Participacao por conta</Text>
                        </div>
                        <Text variant="body-muted">Mostra concentracao de budget entre contas, o que ajuda a separar escala sustentavel de dependencia excessiva de um unico portfolio.</Text>
                        <Chart type="pie" height={320} format="currency" dataQuery={{ query: \`
                          SELECT
                            COALESCE(src.conta_id::text, 'sem_conta') AS key,
                            COALESCE(src.conta_id::text, 'Sem conta') AS label,
                            COALESCE(SUM(src.gasto), 0)::float AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`, limit: 6 }} categoryKey="label" legend={{ enabled: true, position: 'right' }} series={[{ dataKey: 'value', label: 'Gasto' }]} recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }} />
                      </article>
                  </section>
                </div>
              </TabPanel>

              <TabPanel value="efficiency">
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                    <article id="metaads-efficiency-roas" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 216, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Trend</Text>
                          <Text as="h2" variant="section-title">ROAS por dia</Text>
                        </div>
                        <Text variant="body-muted">Serie curta para acompanhar deterioracao ou recuperacao de eficiencia sem sair do dashboard principal.</Text>
                        <Chart type="line" height={320} format="number" dataQuery={{ query: \`
                          SELECT
                            TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                            TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                            CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters}}
                          GROUP BY 1, 2
                          ORDER BY 1 ASC
                        \`, limit: 31 }} xAxis={{ dataKey: 'label' }} series={[{ dataKey: 'value', label: 'ROAS' }]} yAxis={{ width: 86 }} recharts={{ showDots: false, singleSeriesGradient: true }} />
                      </article>

                    <article id="metaads-efficiency-side" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 216 }}>
                      <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
                        <article id="metaads-efficiency-funnel" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <Text variant="eyebrow">Funnel</Text>
                              <Text as="h2" variant="section-title">Leads por campanha</Text>
                            </div>
                            <Chart type="bar" height={220} format="number" dataQuery={{ query: \`
                              SELECT
                                COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                                COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                                COALESCE(SUM(src.leads), 0)::float AS value
                              FROM trafegopago.desempenho_diario src
                              WHERE src.plataforma = 'meta_ads'
                                AND src.nivel = 'campaign'
                                {{filters}}
                              GROUP BY 1, 2
                              ORDER BY 3 DESC
                            \`, limit: 6 }} xAxis={{ dataKey: 'label', labelMode: 'first-word' }} series={[{ dataKey: 'value', label: 'Leads' }]} />
                          </article>
                        <article id="metaads-efficiency-insights" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <Text as="h2" variant="section-title-sm">Leituras operacionais</Text>
                              <Text variant="small-muted">Hipoteses para revisar campanhas, criativos e distribuicao de budget.</Text>
                            </div>
                            <Insights textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }} iconStyle={{ color: '#1877F2' }} items={[
                              { text: 'ROAS caindo com gasto crescente costuma sinalizar saturacao de audiencia ou criativo perdendo tracao.' },
                              { text: 'Conta muito concentrada em poucas campanhas aumenta volatilidade do retorno e risco de escala artificial.' },
                              { text: 'Conversao ou lead estavel com gasto acelerando pede leitura conjunta de frequencia, criativo e pagina de destino.' },
                            ]} />
                          </article>
                      </div>
                    </article>
                  </section>
                </div>
              </TabPanel>

              <TabPanel value="details">
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
                    <article id="metaads-details-table" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Table</Text>
                          <Text as="h2" variant="section-title">Campanhas no detalhe</Text>
                        </div>
                        <Table bordered rounded stickyHeader borderColor={'#d7dbe3'} rowHoverColor={'#f8fafc'} headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '12px 14px' }} rowStyle={{ backgroundColor: '#ffffff' }} cellStyle={{ color: '#475569', fontSize: 14, fontWeight: 400, padding: '12px 14px' }} footerStyle={{ backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '12px 14px' }} enableExportCsv dataQuery={{ query: \`
                          SELECT
                            COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                            COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                            COALESCE(SUM(src.gasto), 0)::float AS gasto,
                            COALESCE(SUM(src.receita_atribuida), 0)::float AS receita,
                            CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS roas,
                            COALESCE(SUM(src.conversoes), 0)::float AS conversoes
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters}}
                          GROUP BY 1, 2
                          ORDER BY gasto DESC, campanha ASC
                        \`, limit: 12 }} columns={[
                          { accessorKey: 'conta', header: 'Conta' },
                          { accessorKey: 'campanha', header: 'Campanha' },
                          { accessorKey: 'gasto', header: 'Gasto', format: 'currency', align: 'right', headerAlign: 'right' },
                          { accessorKey: 'receita', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                          { accessorKey: 'roas', header: 'ROAS', format: 'number', align: 'right', headerAlign: 'right' },
                          { accessorKey: 'conversoes', header: 'Conversoes', format: 'number', align: 'right', headerAlign: 'right' },
                        ]} />
                      </article>
                    <article id="metaads-details-pivot" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 288, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Pivot</Text>
                          <Text as="h2" variant="section-title">Conta por campanha</Text>
                        </div>
                        <PivotTable bordered rounded stickyHeader borderColor={'#d7dbe3'} containerStyle={{ backgroundColor: '#ffffff' }} headerStyle={{ backgroundColor: '#f8fafc', color: '#334155', fontSize: 14, fontWeight: 600, padding: '9px 10px' }} headerTotalStyle={{ backgroundColor: '#f1f5f9', color: '#1e293b', fontSize: 14, fontWeight: 600, padding: '9px 10px' }} rowLabelStyle={{ backgroundColor: '#ffffff', color: '#1e293b', fontSize: 14, padding: '9px 10px' }} cellStyle={{ backgroundColor: '#ffffff', color: '#475569', fontSize: 14, padding: '9px 10px' }} rowTotalStyle={{ backgroundColor: '#f8fafc', color: '#1e293b', fontSize: 14, fontWeight: 500, padding: '9px 10px' }} footerStyle={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: 14, fontWeight: 600, padding: '9px 10px' }} emptyStateStyle={{ color: '#64748b', fontSize: 14, padding: '18px 12px' }} expandButtonStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#475569', hoverBackgroundColor: '#f8fafc' }} enableExportCsv defaultExpandedLevels={1} dataQuery={{ query: \`
                          SELECT
                            COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                            COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                            COALESCE(src.gasto, 0)::float AS gasto
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters}}
                        \`, limit: 300 }} rows={[{ field: 'conta', label: 'Conta' }]} columns={[{ field: 'campanha', label: 'Campanha' }]} values={[{ field: 'gasto', label: 'Gasto', aggregate: 'sum', format: 'currency' }]} />
                      </article>
                  </section>
                </div>
              </TabPanel>
            </div>
          </Tabs>

          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
            <article id="metaads-footer" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 12', minHeight: 54 }}>
              <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                <Text variant="small-muted">Template JSX para Meta Ads com filtros de paid social, KPIs comparativos e widgets de analise no formato novo do dashboard.</Text>
                <Text variant="small-muted">Theme ativo: ${resolvedThemeName}</Text>
              </footer>
            </article>
          </section>
        </div>
    </Dashboard>`
}

export function buildMetaAdsDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildMetaAdsDashboardSource(themeName || ''),
    name: METAADS_VARIANT.fileName,
    path: METAADS_VARIANT.path,
  }
}
