import { DASHBOARD_CHART_PALETTES } from './chart-colors'
import { resolveDashboardThemeTokens } from './theme-tokens'

export function DashboardClassico() {
  const THEME_NAME = "aero"
  const CHART_PALETTE = 'teal'
  const CHART_COLORS = DASHBOARD_CHART_PALETTES[CHART_PALETTE] ?? ["#0F766E","#14B8A6","#2DD4BF","#5EEAD4","#99F6E4"]
  const theme = resolveDashboardThemeTokens(THEME_NAME)
  const isClassic = true
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
    <DashboardTemplate name="dashboard_classico" title="Dashboard Classico">
      <Theme name={THEME_NAME} />
      <Dashboard id="overview" title="Dashboard Classico">
        <section style={ui.page}>
          <header style={ui.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...ui.metricLabel, margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Executive dashboard</p>
              <h1 style={{ ...ui.title, margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em' }}>Performance overview with the classic BI layout</h1>
              <p style={{ ...ui.paragraph, margin: 0, maxWidth: 720, fontSize: 14, lineHeight: 1.65 }}>
                Header with global period control, KPI strip on top and analysis rows below. The runtime stays JSX-first, but the surface looks closer to the previous dashboard model.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 240 }}>
              <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Global period</p>
              <DatePicker
                label="Periodo do pedido"
                table="vendas.pedidos"
                field="data_pedido"
                presets={['7d', '30d', 'month', 'quarter']}
                labelStyle={ui.headerDatePickerLabel}
                fieldStyle={ui.headerDatePickerField}
                iconStyle={ui.headerDatePickerIcon}
                presetButtonStyle={ui.headerDatePickerPreset}
                activePresetButtonStyle={ui.headerDatePickerPresetActive}
                separatorStyle={ui.headerDatePickerSeparator}
              />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(SUM(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: `
                  SELECT COUNT(*)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Pedidos</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(AVG(p.valor_total), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eficiência</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Ticket medio</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: `
                  SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="number"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cobertura</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Canais ativos</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>

            <Query
              dataQuery={{
                query: `
                  SELECT COALESCE(AVG(CASE WHEN COALESCE(p.status, '') = 'aprovado' THEN 1 ELSE 0 END), 0)::float AS value
                  FROM vendas.pedidos p
                  WHERE 1=1
                    {{filters:p}}
                `,
                limit: 1,
              }}
              format="percent"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualidade</p>
                  <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Aprovacao</h2>
                </div>
                <p style={{ ...ui.kpiValue, margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</p>
                <p data-ui="kpi-delta" style={{ ...ui.kpiDelta, margin: 0, fontSize: 13 }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Aceleracao recente</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Leituras sobre os vetores que estao puxando o crescimento do periodo.</p>
              </div>
              <Insights
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { title: 'Receita acima da media recente', text: 'Receita ganhou tracao nos canais proprios e manteve crescimento acima da media recente.' },
                  { title: 'Volume mais regular no periodo', text: 'O volume diario segue acima da media das ultimas semanas, com melhor distribuicao ao longo do periodo.' },
                  { title: 'Melhor retorno sem mais desconto', text: 'Os canais com melhor retorno continuam puxando o resultado total sem depender de descontos mais agressivos.' },
                ]}
              />
            </Card>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Concentracao de receita</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Pontos de atencao sobre dependencia de canais e distribuicao do faturamento.</p>
              </div>
              <Insights
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#F59E0B' }}
                items={[
                  { text: 'O mix segue concentrado em poucos canais, o que aumenta dependencia operacional.' },
                  { text: 'Uma variacao pequena nos principais canais ainda tem impacto relevante na receita consolidada.' },
                  { text: 'A pulverizacao do faturamento continua baixa, o que reduz margem de seguranca para os proximos ciclos.' },
                ]}
              />
            </Card>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em' }}>Conversao e qualidade</h2>
                <p style={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.6 }}>Sinais de eficiencia comercial sem pressao adicional sobre o ticket medio.</p>
              </div>
              <Insights
                textStyle={{ ...ui.paragraph, margin: 0, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#10B981' }}
                items={[
                  { text: 'A aprovacao continua estavel, com espaco para melhorar conversao sem pressionar o ticket medio.' },
                  { text: 'Existe espaco para elevar a taxa final com ajustes pontuais no topo do funil comercial.' },
                  { text: 'O ticket medio nao mostra deterioracao, o que permite buscar ganho de eficiencia sem comprometer valor.' },
                ]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita por canal</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Mix comercial</h2>
              </div>
              <Chart
                type="bar"
                height={300}
                format="currency"
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
                      COALESCE(cv.nome, '-') AS label,
                      COALESCE(SUM(pi.subtotal), 0)::float AS value
                    FROM vendas.pedidos p
                    JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters:p}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  `,
                  limit: 6,
                }}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                colors={CHART_COLORS}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Receita' },
                ]}
                yAxis={{ width: 72 }}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participacao</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Share por canal</h2>
              </div>
              <Chart
                type="pie"
                height={300}
                format="currency"
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
                      COALESCE(cv.nome, '-') AS label,
                      COALESCE(SUM(pi.subtotal), 0)::float AS value
                    FROM vendas.pedidos p
                    JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters:p}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  `,
                  limit: 6,
                }}
                interaction={{ table: 'vendas.pedidos', field: 'canal_venda_id', clearOnSecondClick: true }}
                colors={CHART_COLORS}
                categoryKey="label"
                legend={{ enabled: true, position: 'right' }}
                series={[
                  { dataKey: 'value', label: 'Receita' },
                ]}
                recharts={{ innerRadius: 56, outerRadius: 96, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={{ ...ui.panelCard, minHeight: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tendencia diaria</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita ao longo do periodo</h2>
              </div>
              <div style={{ flex: 1, minHeight: 300 }}>
                <Chart
                  type="line"
                  height="100%"
                  format="currency"
                  dataQuery={{
                    query: `
                      SELECT
                        TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                        TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                        COALESCE(SUM(p.valor_total), 0)::float AS value
                      FROM vendas.pedidos p
                      WHERE 1=1
                        {{filters:p}}
                      GROUP BY 1, 2
                      ORDER BY 1 ASC
                    `,
                    limit: 31,
                  }}
                  colors={CHART_COLORS}
                  xAxis={{ dataKey: 'label' }}
                  series={[
                    { dataKey: 'value', label: 'Receita' },
                  ]}
                  yAxis={{ width: 72 }}
                  recharts={{ showDots: false, singleSeriesGradient: true }}
                />
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalhamento</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Pedidos filtrados</h2>
              </div>
              <Table
                bordered
                rounded
                radius={12}
                stickyHeader
                striped={false}
                borderColor={ui.tableBorderColor}
                rowHoverColor={ui.tableRowHoverColor}
                headerStyle={ui.tableHeaderStyle}
                rowStyle={ui.tableRowStyle}
                cellStyle={ui.tableCellStyle}
                footerStyle={ui.tableFooterStyle}
                dataQuery={{
                  query: `
                    SELECT
                      p.id::text AS pedido_id,
                      TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                      COALESCE(cv.nome, '-') AS canal,
                      COALESCE(p.status, 'Sem status') AS status,
                      COALESCE(p.valor_total, 0)::float AS valor_total
                    FROM vendas.pedidos p
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters:p}}
                    ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
                  `,
                  limit: 12,
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Pedido' },
                  { accessorKey: 'data_pedido', header: 'Data' },
                  { accessorKey: 'canal', header: 'Canal' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
                enableExportCsv
              />
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status mix</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Volume por status</h2>
              </div>
              <Chart
                type="horizontal-bar"
                height={300}
                format="number"
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(p.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM vendas.pedidos p
                    WHERE 1=1
                      {{filters:p}}
                    GROUP BY 1
                    ORDER BY 2 DESC
                  `,
                  limit: 8,
                }}
                colors={CHART_COLORS}
                xAxis={{ dataKey: 'label' }}
                series={[
                  { dataKey: 'value', label: 'Pedidos' },
                ]}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} data-ui="pivot-card" style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ ...ui.eyebrow, margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cruzamento</p>
                <h2 style={{ ...ui.title, margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Receita por canal e status</h2>
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
                      COALESCE(cv.nome, '-') AS canal,
                      COALESCE(p.status, 'Sem status') AS status,
                      COALESCE(p.valor_total, 0)::float AS valor_total
                    FROM vendas.pedidos p
                    LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                    WHERE 1=1
                      {{filters:p}}
                  `,
                  limit: 400,
                }}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}