import { DASHBOARD_CHART_PALETTES } from './chart-colors'
import { resolveDashboardThemeTokens } from './theme-tokens'

export function DashboardMetaAds() {
  const THEME_NAME = "midnight"
  const CHART_PALETTE = 'purple'
  const CHART_COLORS = DASHBOARD_CHART_PALETTES[CHART_PALETTE] ?? ["#7C3AED","#8B5CF6","#A78BFA","#C4B5FD","#DDD6FE"]
  const theme = resolveDashboardThemeTokens(THEME_NAME)
  const isClassic = false
  const key = String(THEME_NAME || '').toLowerCase()
  const cardFrame = ['midnight', 'metro', 'aero'].includes(key)
    ? { variant: 'hud' as const, cornerSize: 10, cornerWidth: 2 }
    : ['light', 'white', 'claro', 'branco', 'sand'].includes(key)
      ? { variant: 'hud' as const, cornerSize: 6, cornerWidth: 1 }
      : { variant: 'hud' as const, cornerSize: 8, cornerWidth: 1 }
  const ui = {
    cardFrame,
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: isClassic ? 20 : 24,
      minHeight: '100%',
      padding: isClassic ? 28 : 32,
      backgroundColor: theme.pageBg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: isClassic ? 20 : 24,
      padding: isClassic ? '20px 24px' : 24,
      borderRadius: isClassic && cardFrame ? 0 : 24,
      border: `1px solid ${theme.surfaceBorder}`,
      backgroundColor: theme.headerBg,
      color: theme.headerText,
    },
    badge: {
      display: 'inline-flex',
      width: 'fit-content',
      alignItems: 'center',
      borderRadius: 999,
      border: `1px solid ${theme.accentBorder}`,
      backgroundColor: theme.accentSurface,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: theme.accentText,
    },
    queryCard: {
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : 22,
      border: `1px solid ${theme.surfaceBorder}`,
      backgroundColor: theme.surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: theme.surfaceBg,
      border: `1px solid ${theme.surfaceBorder}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: theme.accentSurface,
      border: `1px solid ${theme.accentBorder}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      padding: isClassic ? '16px 20px' : '18px 22px',
      borderRadius: isClassic && cardFrame ? 0 : 22,
      backgroundColor: theme.surfaceBg,
      border: `1px solid ${theme.surfaceBorder}`,
    },
    eyebrow: {
      margin: 0,
      fontSize: 11,
      color: theme.headerSubtitle,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    title: {
      margin: 0,
      fontSize: isClassic ? 22 : 24,
      fontWeight: 600,
      color: theme.titleColor,
      letterSpacing: '-0.03em',
    },
    subtitle: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      color: theme.textSecondary,
    },
    paragraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.75,
      color: theme.textSecondary,
    },
    metricLabel: {
      margin: 0,
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiLabel: {
      margin: 0,
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiValue: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: theme.kpiValueColor,
    },
    kpiDelta: {
      margin: 0,
      fontSize: 13,
      color: theme.textSecondary,
    },
    headerDatePickerLabel: {
      margin: 0,
      fontSize: 11,
      color: theme.headerDatePickerLabel,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    headerDatePickerField: {
      minHeight: 38,
      padding: '0 10px',
      border: `1px solid ${theme.headerDatePickerBorder}`,
      borderRadius: 10,
      backgroundColor: theme.headerDatePickerBg,
      color: theme.headerDatePickerColor,
      fontSize: 14,
      fontWeight: 500,
    },
    headerDatePickerIcon: {
      color: theme.headerDatePickerIcon,
      fontSize: 14,
    },
    headerDatePickerPreset: {
      height: 36,
      padding: '0 12px',
      border: `1px solid ${theme.headerDatePickerBorder}`,
      borderRadius: 10,
      backgroundColor: theme.headerDatePickerBg,
      color: theme.headerDatePickerColor,
      fontSize: 13,
      fontWeight: 500,
    },
    headerDatePickerPresetActive: {
      backgroundColor: theme.headerDatePickerActiveBg,
      borderColor: theme.headerDatePickerActiveBorder,
      color: theme.headerDatePickerActiveText,
      fontWeight: 600,
    },
    headerDatePickerSeparator: {
      color: theme.headerDatePickerLabel,
      fontSize: 13,
      fontWeight: 500,
    },
    tableHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableRowStyle: {
      backgroundColor: '#ffffff',
    },
    tableCellStyle: {
      color: '#475569',
      fontSize: 14,
      fontWeight: 400,
      padding: '12px 14px',
    },
    tableFooterStyle: {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableBorderColor: '#d7dbe3',
    tableRowHoverColor: '#f8fafc',
    pivotContainerStyle: {
      backgroundColor: '#ffffff',
    },
    pivotHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotHeaderTotalStyle: {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotRowLabelStyle: {
      backgroundColor: '#ffffff',
      color: '#1e293b',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotCellStyle: {
      backgroundColor: '#ffffff',
      color: '#475569',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotRowTotalStyle: {
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 500,
      padding: '9px 10px',
    },
    pivotFooterStyle: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotEmptyStateStyle: {
      color: '#64748b',
      fontSize: 14,
      padding: '18px 12px',
    },
    pivotExpandButtonStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      color: '#475569',
      hoverBackgroundColor: '#f8fafc',
    },
  }

  return (
    <DashboardTemplate name="dashboard_metaads" title="Dashboard Meta Ads">
      <Theme name={THEME_NAME} />
      <Dashboard id="overview" title="Dashboard Meta Ads">
        <section style={ui.page}>
          <header style={ui.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={ui.badge}>Paid Social</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Meta Ads performance por conta, campanha e criativo</p>
                <h1 style={{ ...ui.title, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Meta Ads</h1>
              </div>
              <p style={ui.subtitle}>Adaptacao do template legado de apps para JSX com tags, queries SQL explicitas e leitura de paid social no runtime novo do workspace.</p>
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
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Filters</p>
                <h2 style={ui.title}>Conta e campanha</h2>
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
                  query={`
                    SELECT DISTINCT
                      src.conta_id::text AS value,
                      COALESCE(src.conta_id::text, 'Sem conta') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.conta_id IS NOT NULL
                    ORDER BY 2 ASC
                  `}
                />
                <Slicer
                  label="Campanha"
                  field="campanha_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={240}
                  query={`
                    SELECT DISTINCT
                      src.campanha_id::text AS value,
                      COALESCE(src.campanha_id::text, 'Sem campanha') AS label
                    FROM trafegopago.desempenho_diario src
                    WHERE src.plataforma = 'meta_ads'
                      AND src.nivel = 'campaign'
                      AND src.campanha_id IS NOT NULL
                    ORDER BY 2 ASC
                  `}
                />
              </div>
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <p style={ui.eyebrow}>Leitura esperada</p>
              <p style={ui.paragraph}>Primeiro veja o pacing de gasto e retorno, depois abra concentracao por campanha e finalmente desca para o detalhe de anuncios e grupos quando houver desbalanceamento.</p>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(SUM(src.gasto), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Investimento</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Gasto</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(SUM(src.receita_atribuida), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Retorno</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Receita atribuida</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: `
                  SELECT
                    CASE WHEN COALESCE(SUM(src.gasto), 0) = 0 THEN 0 ELSE (SUM(src.receita_atribuida) / SUM(src.gasto))::float END AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                `,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Eficiencia</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>ROAS</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(SUM(src.conversoes), 0)::float AS value
                  FROM trafegopago.desempenho_diario src
                  WHERE src.plataforma = 'meta_ads'
                    AND src.nivel = 'campaign'
                    {{filters:src}}
                `,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Resultado</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Conversoes</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
                <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Budget concentration</p>
                    <h2 style={ui.title}>Gasto por campanha</h2>
                  </div>
                  <p style={ui.paragraph}>Identifica quais campanhas carregam a maior parte do investimento e merecem inspeccao imediata de criativo e audiencia.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: `
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
                      `,
                      limit: 8,
                    }}
                    xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                    series={[
                      { dataKey: 'value', label: 'Gasto' },
                    ]}
                    yAxis={{ width: 86 }}
                  />
                </Card>

                <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Share</p>
                    <h2 style={ui.title}>Participacao por conta</h2>
                  </div>
                  <p style={ui.paragraph}>Mostra concentracao de budget entre contas, o que ajuda a separar escala sustentavel de dependencia excessiva de um unico portfolio.</p>
                  <Chart
                    type="pie"
                    height={320}
                    format="currency"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: `
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
                      `,
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
                <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={ui.eyebrow}>Trend</p>
                    <h2 style={ui.title}>ROAS por dia</h2>
                  </div>
                  <p style={ui.paragraph}>Serie curta para acompanhar deterioracao ou recuperacao de eficiencia sem sair do dashboard principal.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="number"
                    colors={CHART_COLORS}
                    dataQuery={{
                      query: `
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
                      `,
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
                  <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={ui.eyebrow}>Funnel</p>
                      <h2 style={ui.title}>Leads por campanha</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
                      colors={CHART_COLORS}
                      dataQuery={{
                        query: `
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
                        `,
                        limit: 6,
                      }}
                      xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                      series={[
                        { dataKey: 'value', label: 'Leads' },
                      ]}
                    />
                  </Card>
                  <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...ui.title, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Hipoteses para revisar campanhas, criativos e distribuicao de budget.</p>
                    </div>
                    <Insights
                      textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
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
                <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
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
                      query: `
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
                      `,
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

                <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
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
                      query: `
                        SELECT
                          COALESCE(src.conta_id::text, 'Sem conta') AS conta,
                          COALESCE(src.campanha_id::text, 'Sem campanha') AS campanha,
                          COALESCE(src.gasto, 0)::float AS gasto
                        FROM trafegopago.desempenho_diario src
                        WHERE src.plataforma = 'meta_ads'
                          AND src.nivel = 'campaign'
                          {{filters:src}}
                      `,
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

          <footer style={ui.footer}>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Template JSX para Meta Ads com filtros de paid social, KPIs comparativos e widgets de analise no formato novo do dashboard.</p>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: {THEME_NAME}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}