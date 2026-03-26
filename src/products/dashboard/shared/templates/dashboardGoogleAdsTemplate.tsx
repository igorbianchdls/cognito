'use client'

import { buildDashboardModuleUi } from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const GOOGLEADS_VARIANT = {
  fileName: 'dashboard-googleads.tsx',
  name: 'dashboard_googleads',
  path: 'app/dashboard-googleads.tsx',
  title: 'Dashboard Google Ads',
}

function buildGoogleAdsDashboardSource(themeName: string) {
  const ui = buildDashboardModuleUi(themeName)
  return `export function DashboardGoogleAds() {
  return (
    <DashboardTemplate name="${GOOGLEADS_VARIANT.name}" title="${GOOGLEADS_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${GOOGLEADS_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Paid Search</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Google Ads para Search, Shopping e PMax</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Google Ads</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Versao JSX do template legado com foco em volume, eficiencia e aquisicao, agora no formato novo do workspace sem DSL.</p>
            </div>
            <article style={${JSON.stringify(ui.noteCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Workspace note</p>
              <p style={${JSON.stringify(ui.paragraph)}}>A leitura fixa a plataforma em Google Ads e reorganiza os blocos para gasto, receita, ROAS, CTR, CPA e funil de conversao com queries explicitas.</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <article style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Global controls</p>
                <h2 style={${JSON.stringify(ui.title)}}>Periodo, conta e grupo</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePicker
                  label="Periodo de performance"
                  table="trafegopago.desempenho_diario"
                  field="data_ref"
                  presets={['7d', '14d', '30d', '90d']}
                  labelStyle={${JSON.stringify(ui.headerDatePickerLabel)}}
                  fieldStyle={${JSON.stringify(ui.headerDatePickerField)}}
                  iconStyle={${JSON.stringify(ui.headerDatePickerIcon)}}
                  presetButtonStyle={${JSON.stringify(ui.headerDatePickerPreset)}}
                  activePresetButtonStyle={${JSON.stringify(ui.headerDatePickerPresetActive)}}
                  separatorStyle={${JSON.stringify(ui.headerDatePickerSeparator)}}
                />
                <Slicer
                  label="Conta"
                  field="conta_id"
                  variant="dropdown"
                  selectionMode="multiple"
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
                />
                <Slicer
                  label="Grupo"
                  field="grupo_id"
                  variant="dropdown"
                  selectionMode="multiple"
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
                />
              </div>
            </article>

            <article style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Leitura esperada</p>
              <p style={${JSON.stringify(ui.paragraph)}}>Comece por volume e retorno, depois confronte CTR, CVR e CPA para separar problema de demanda, criativo ou pagina.</p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Investimento</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Gasto</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Retorno</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Receita atribuida</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Eficiencia</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>ROAS</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'google_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Custo</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>CPA</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
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
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Top spend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por campanha</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Ajuda a isolar onde Search, Shopping ou PMax estao carregando o budget antes de abrir o funil de qualidade.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                          COALESCE(SUM(src.gasto), 0)::float AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      limit: 8,
                    }}
                    xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                    series={[
                      { dataKey: 'value', label: 'Gasto', color: '${ui.chartScheme[0]}' },
                    ]}
                    yAxis={{ width: 86 }}
                  />
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Rate quality</p>
                    <h2 style={${JSON.stringify(ui.title)}}>CTR por conta</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Mistura de volume e relevancia para mostrar quais contas sustentam cliques qualificados e quais dependem de impressao sem resposta.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="percent"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.conta_id::text, 'sem_conta') AS key,
                          COALESCE(src.conta_id::text, 'Sem conta') AS label,
                          CASE WHEN COALESCE(SUM(src.impressoes), 0) = 0 THEN 0 ELSE (SUM(src.cliques) / SUM(src.impressoes))::float END AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      limit: 6,
                    }}
                    xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                    series={[
                      { dataKey: 'value', label: 'CTR', color: '${ui.chartScheme[0]}' },
                    ]}
                    yAxis={{ width: 86 }}
                  />
                </article>
              </section>
            </TabPanel>

            <TabPanel value="acquisition">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Trend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por mes</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Serie para confrontar aceleracao de investimento com as mudancas de qualidade de trafego ao longo do periodo.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                          COALESCE(SUM(src.gasto), 0)::float AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      \`,
                      limit: 12,
                    }}
                    xAxis={{ dataKey: 'label' }}
                    series={[
                      { dataKey: 'value', label: 'Gasto', color: '${ui.chartScheme[0]}' },
                    ]}
                    yAxis={{ width: 86 }}
                    recharts={{ showDots: false, singleSeriesGradient: true }}
                  />
                </article>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={${JSON.stringify(ui.eyebrow)}}>Conversion quality</p>
                      <h2 style={${JSON.stringify(ui.title)}}>CVR por mes</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="percent"
                      colors={${JSON.stringify(ui.chartScheme)}}
                      dataQuery={{
                        query: \`
                          SELECT
                            TO_CHAR(DATE_TRUNC('month', src.data_ref), 'YYYY-MM') AS key,
                            TO_CHAR(DATE_TRUNC('month', src.data_ref), 'MM/YYYY') AS label,
                            CASE WHEN COALESCE(SUM(src.cliques), 0) = 0 THEN 0 ELSE (SUM(src.conversoes) / SUM(src.cliques))::float END AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'google_ads'
                            AND src.nivel = 'campaign'
                            {{filters:src}}
                          GROUP BY 1, 2
                          ORDER BY 1 ASC
                        \`,
                        limit: 12,
                      }}
                      xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                      series={[
                        { dataKey: 'value', label: 'CVR', color: '${ui.chartScheme[0]}' },
                      ]}
                    />
                  </article>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Perguntas para separar problema de volume, relevancia ou eficiencia de pagina.</p>
                    </div>
                    <Insights
                      textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#4285F4' }}
                      items={[
                        { text: 'Gasto subindo com CTR e CVR em queda costuma indicar keyword ou audiencia sem aderencia real.' },
                        { text: 'CPA estourando sem perda de CTR geralmente aponta para problema de pagina, oferta ou tracking de conversao.' },
                        { text: 'Contas com muito clique e pouca receita atribuida precisam ser lidas junto com conversao e valor medio do pedido.' },
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
                    <h2 style={${JSON.stringify(ui.title)}}>Campanhas no detalhe</h2>
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
                          COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                          COALESCE(SUM(src.cliques), 0)::float AS cliques,
                          COALESCE(SUM(src.conversoes), 0)::float AS conversoes,
                          CASE WHEN COALESCE(SUM(src.conversoes), 0) = 0 THEN 0 ELSE (SUM(src.gasto) / SUM(src.conversoes))::float END AS cpa,
                          CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS roas
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
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

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Pivot</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Conta por campanha</h2>
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
                          COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                          COALESCE(src.gasto, 0)::float AS gasto
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'google_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                      \`,
                      limit: 300,
                    }}
                    rows={[{ field: 'conta', label: 'Conta' }]}
                    columns={[{ field: 'campanha', label: 'Campanha' }]}
                    values={[{ field: 'gasto', label: 'Gasto', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Google Ads com volume, retorno e eficiencia em um unico arquivo TSX no formato novo do dashboard.</p>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${themeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildGoogleAdsDashboardTemplateVariant(themeName: string) {
  return {
    content: buildGoogleAdsDashboardSource(themeName),
    name: GOOGLEADS_VARIANT.fileName,
    path: GOOGLEADS_VARIANT.path,
  }
}
