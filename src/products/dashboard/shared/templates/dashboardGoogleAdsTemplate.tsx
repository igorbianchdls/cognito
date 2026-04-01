'use client'

import {
  buildDashboardInlineUiSource,
  buildDashboardThemeImportSource,
  getDashboardTemplatePalette,
  getDashboardTemplateThemeName,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const GOOGLEADS_VARIANT = {
  fileName: 'dashboard-googleads.tsx',
  name: 'dashboard_googleads',
  path: 'app/dashboard-googleads.tsx',
  title: 'Dashboard Google Ads',
}

function buildGoogleAdsDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('googleads')
  const chartColors = getDashboardTemplatePalette('googleads')
  return `import { DASHBOARD_CHART_PALETTES } from './chart-colors'
${buildDashboardThemeImportSource()}

export function DashboardGoogleAds() {
  const THEME_NAME = ${JSON.stringify(resolvedThemeName)}
  const CHART_PALETTE = 'orange'
  const CHART_COLORS = DASHBOARD_CHART_PALETTES[CHART_PALETTE] ?? ${JSON.stringify(chartColors)}
${buildDashboardInlineUiSource()}

  return (
    <DashboardTemplate name="${GOOGLEADS_VARIANT.name}" title="${GOOGLEADS_VARIANT.title}">
      <Theme name={THEME_NAME} />
      <Dashboard id="overview" title="${GOOGLEADS_VARIANT.title}">
        <section style={{ display: 'flex', flexDirection: 'column', gap: isClassic ? 20 : 24, minHeight: '100%', padding: isClassic ? 28 : 32, backgroundColor: theme.pageBg }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: isClassic ? 20 : 24, padding: isClassic ? '20px 24px' : 24, borderRadius: isClassic && cardFrame ? 0 : 24, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Paid Search</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Google Ads para Search, Shopping e PMax</p>
                <h1 style={{ ...ui.title, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Google Ads</h1>
              </div>
              <p style={ui.subtitle}>Versao JSX do template legado com foco em volume, eficiencia e aquisicao, agora no formato novo do workspace sem DSL.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                label="Periodo de performance"
                table="trafegopago.desempenho_diario"
                field="data_ref"
                presets={['7d', '14d', '30d', '90d']}
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
            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Filters</p>
                <h2 style={ui.title}>Conta e grupo</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <Filter
                  label="Conta"
                  table="trafegopago.desempenho_diario"
                  field="conta_id"
                  mode="multiple"
                  search
                  clearable
                  width={220}
                  query={\`
                    SELECT DISTINCT
                      src.conta_id::text AS value,
                      COALESCE(src.conta_id::text, 'Sem conta') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'google_ads'
                      AND src.nivel = 'campaign'
                      AND src.conta_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                >
                  <Select />
                </Filter>
                <Filter
                  label="Grupo"
                  table="trafegopago.desempenho_diario"
                  field="grupo_id"
                  mode="multiple"
                  search
                  clearable
                  width={220}
                  query={\`
                    SELECT DISTINCT
                      src.grupo_id::text AS value,
                      COALESCE(src.grupo_id::text, 'Sem grupo') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'google_ads'
                      AND src.nivel = 'campaign'
                      AND src.grupo_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                >
                  <Select />
                </Filter>
              </div>
            </Card>

            <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={ui.eyebrow}>Leitura esperada</p>
              <p style={ui.paragraph}>Comece por volume e retorno, depois confronte CTR, CVR e CPA para separar problema de demanda, criativo ou pagina.</p>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Investimento</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Gasto</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Retorno</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Receita atribuida</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Eficiencia</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>ROAS</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: isClassic && cardFrame ? 0 : 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={ui.kpiLabel}>Custo</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>CPA</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <Tabs defaultValue="performance">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="performance">Performance</Tab>
              <Tab value="acquisition">Aquisicao</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="performance">
              <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Top spend</p>
                    <h2 style={ui.title}>Gasto por campanha</h2>
                  </div>
                  <p style={ui.paragraph}>Ajuda a isolar onde Search, Shopping ou PMax estao carregando o budget antes de abrir o funil de qualidade.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                          COALESCE(SUM(src.gasto), 0)::float AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
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
                </Card>

                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Rate quality</p>
                    <h2 style={ui.title}>CTR por conta</h2>
                  </div>
                  <p style={ui.paragraph}>Mistura de volume e relevancia para mostrar quais contas sustentam cliques qualificados e quais dependem de impressao sem resposta.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="percent"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.conta_id::text, 'sem_conta') AS key,
                          COALESCE(src.conta_id::text, 'Sem conta') AS label,
                          CASE WHEN COALESCE(SUM(src.impressoes), 0) = 0 THEN 0 ELSE (SUM(src.cliques) / SUM(src.impressoes))::float END AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
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
                </Card>
              </section>
            </TabPanel>

            <TabPanel value="acquisition">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Trend</p>
                    <h2 style={ui.title}>Gasto por mes</h2>
                  </div>
                  <p style={ui.paragraph}>Serie para confrontar aceleracao de investimento com as mudancas de qualidade de trafego ao longo do periodo.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                          COALESCE(SUM(src.gasto), 0)::float AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
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
                </Card>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={ui.eyebrow}>Conversion quality</p>
                      <h2 style={ui.title}>CVR por mes</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="percent"
                      colors={CHART_COLORS}
                      dataQuery={{
                        query: \`
                          SELECT
                            TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                            TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                            CASE WHEN COALESCE(SUM(src.cliques), 0) = 0 THEN 0 ELSE (SUM(src.conversoes) / SUM(src.cliques))::float END AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'google_ads'
                            AND src.nivel = 'campaign'
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
                  </Card>
                  <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...ui.title, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Perguntas para separar problema de volume, relevancia ou eficiencia de pagina.</p>
                    </div>
                    <Insights
                      textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#4285F4' }}
                      items={[
                        { text: 'Gasto subindo com CTR e CVR em queda costuma indicar keyword ou audiencia sem aderencia real.' },
                        { text: 'CPA estourando sem perda de CTR geralmente aponta para problema de pagina, oferta ou tracking de conversao.' },
                        { text: 'Contas com muito clique e pouca receita atribuida precisam ser lidas junto com conversao e valor medio do pedido.' },
                      ]}
                    />
                  </Card>
                </section>
              </section>
            </TabPanel>

            <TabPanel value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Table</p>
                    <h2 style={ui.title}>Campanhas no detalhe</h2>
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
                          COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                          COALESCE(SUM(src.cliques), 0)::float AS cliques,
                          COALESCE(SUM(src.conversoes), 0)::float AS conversoes,
                          CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS cpa,
                          CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS roas
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
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
                </Card>

                <Card frame={cardFrame || undefined} style={{ padding: 22, borderRadius: cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Pivot</p>
                    <h2 style={ui.title}>Conta por campanha</h2>
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
                          COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                          COALESCE(src.gasto, 0)::float AS gasto
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters}}
                      \`,
                      limit: 300,
                    }}
                    rows={[{ field: 'conta', label: 'Conta' }]}
                    columns={[{ field: 'campanha', label: 'Campanha' }]}
                    values={[{ field: 'gasto', label: 'Gasto', aggregate: 'sum', format: 'currency' }]}
                  />
                </Card>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: isClassic ? '16px 20px' : '18px 22px', borderRadius: isClassic && cardFrame ? 0 : 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Google Ads com volume, retorno e eficiencia em um unico arquivo TSX no formato novo do dashboard.</p>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: {THEME_NAME}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildGoogleAdsDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildGoogleAdsDashboardSource(themeName || ''),
    name: GOOGLEADS_VARIANT.fileName,
    path: GOOGLEADS_VARIANT.path,
  }
}
