'use client'

import {
  buildDashboardModuleUi,
  buildFramePropSource,
  getDashboardTemplatePalette,
  getDashboardTemplateThemeName,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const METAADS_VARIANT = {
  fileName: 'dashboard-metaads.tsx',
  name: 'dashboard_metaads',
  path: 'app/dashboard-metaads.tsx',
  title: 'Dashboard Meta Ads',
}

function buildMetaAdsDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('metaads')
  const ui = buildDashboardModuleUi(resolvedThemeName)
  const cardFrameSource = buildFramePropSource(ui.cardFrame)
  const chartColors = getDashboardTemplatePalette('metaads')
  return `export function DashboardMetaAds() {
  const CHART_COLORS = ${JSON.stringify(chartColors)}

  return (
    <DashboardTemplate name="${METAADS_VARIANT.name}" title="${METAADS_VARIANT.title}">
      <Theme name="${resolvedThemeName}" />
      <Dashboard id="overview" title="${METAADS_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Paid Social</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Meta Ads performance por conta, campanha e criativo</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Meta Ads</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Adaptacao do template legado de apps para JSX com tags, queries SQL explicitas e leitura de paid social no runtime novo do workspace.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
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
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Filters</p>
                <h2 style={${JSON.stringify(ui.title)}}>Conta e campanha</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
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
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.conta_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                />
                <Slicer
                  label="Campanha"
                  field="campanha_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={240}
                  query={\`
                    SELECT DISTINCT
                      src.campanha_id::text AS value,
                      COALESCE(src.campanha_id::text, 'Sem campanha') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.campanha_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                />
              </div>
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Leitura esperada</p>
              <p style={${JSON.stringify(ui.paragraph)}}>Primeiro veja o pacing de gasto e retorno, depois abra concentracao por campanha e finalmente desca para o detalhe de anuncios e grupos quando houver desbalanceamento.</p>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Investimento</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Gasto</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Retorno</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Receita atribuida</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT
                    CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Eficiencia</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>ROAS</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT COALESCE(SUM(src.conversoes), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                \`,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Resultado</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Conversoes</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <Tabs defaultValue="performance">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="performance">Performance</Tab>
              <Tab value="efficiency">Eficiencia</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="performance">
              <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
                <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Budget concentration</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por campanha</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Identifica quais campanhas carregam a maior parte do investimento e merecem inspeccao imediata de criativo e audiencia.</p>
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
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
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

                <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Share</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Participacao por conta</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Mostra concentracao de budget entre contas, o que ajuda a separar escala sustentavel de dependencia excessiva de um unico portfolio.</p>
                  <Chart
                    type="pie"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.conta_id::text, 'sem_conta') AS key,
                          COALESCE(src.conta_id::text, 'Sem conta') AS label,
                          COALESCE(SUM(src.gasto), 0)::float AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
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
                </Card>
              </section>
            </TabPanel>

            <TabPanel value="efficiency">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Trend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>ROAS por dia</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Serie curta para acompanhar deterioracao ou recuperacao de eficiencia sem sair do dashboard principal.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="number"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(src.data_ref::date, 'YYYY-MM-DD') AS key,
                          TO_CHAR(src.data_ref::date, 'DD/MM') AS label,
                          CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      \`,
                      limit: 31,
                    }}
                    xAxis={{ dataKey: 'label' }}
                    series={[
                      { dataKey: 'value', label: 'ROAS' },
                    ]}
                    yAxis={{ width: 86 }}
                    recharts={{ showDots: false, singleSeriesGradient: true }}
                  />
                </Card>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={${JSON.stringify(ui.eyebrow)}}>Funnel</p>
                      <h2 style={${JSON.stringify(ui.title)}}>Leads por campanha</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
                      colors={CHART_COLORS}
                      dataQuery={{
                        query: \`
                          SELECT
                            COALESCE(src.campanha_id::text, 'sem_campanha') AS key,
                            COALESCE(src.campanha_id::text, 'Sem campanha') AS label,
                            COALESCE(SUM(src.leads), 0)::float AS value
                          FROM trafegopago.desempenho_diario src
                          WHERE src.plataforma = 'meta_ads'
                            AND src.nivel = 'campaign'
                            {{filters:src}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`,
                        limit: 6,
                      }}
                      xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                      series={[
                        { dataKey: 'value', label: 'Leads' },
                      ]}
                    />
                  </Card>
                  <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Hipoteses para revisar campanhas, criativos e distribuicao de budget.</p>
                    </div>
                    <Insights
                      textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#1877F2' }}
                      items={[
                        { text: 'ROAS caindo com gasto crescente costuma sinalizar saturacao de audiencia ou criativo perdendo tracao.' },
                        { text: 'Conta muito concentrada em poucas campanhas aumenta volatilidade do retorno e risco de escala artificial.' },
                        { text: 'Conversao ou lead estavel com gasto acelerando pede leitura conjunta de frequencia, criativo e pagina de destino.' },
                      ]}
                    />
                  </Card>
                </section>
              </section>
            </TabPanel>

            <TabPanel value="details">
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
                <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
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
                          COALESCE(SUM(src.gasto), 0)::float AS gasto,
                          COALESCE(SUM(src.receita_atribuida), 0)::float AS receita,
                          CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS roas,
                          COALESCE(SUM(src.conversoes), 0)::float AS conversoes
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                        GROUP BY 1, 2
                        ORDER BY gasto DESC, campanha ASC
                      \`,
                      limit: 12,
                    }}
                    columns={[
                      { accessorKey: 'conta', header: 'Conta' },
                      { accessorKey: 'campanha', header: 'Campanha' },
                      { accessorKey: 'gasto', header: 'Gasto', format: 'currency', align: 'right', headerAlign: 'right' },
                      { accessorKey: 'receita', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                      { accessorKey: 'roas', header: 'ROAS', format: 'number', align: 'right', headerAlign: 'right' },
                      { accessorKey: 'conversoes', header: 'Conversoes', format: 'number', align: 'right', headerAlign: 'right' },
                    ]}
                  />
                </Card>

                <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
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
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
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

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Meta Ads com filtros de paid social, KPIs comparativos e widgets de analise no formato novo do dashboard.</p>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${resolvedThemeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildMetaAdsDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildMetaAdsDashboardSource(themeName || ''),
    name: METAADS_VARIANT.fileName,
    path: METAADS_VARIANT.path,
  }
}
