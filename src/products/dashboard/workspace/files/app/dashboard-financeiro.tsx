import { DASHBOARD_CHART_PALETTES } from './chart-colors'
import { resolveDashboardThemeTokens } from './theme-tokens'

export function DashboardFinanceiro() {
  const THEME_NAME = "sand"
  const CHART_PALETTE = 'teal'
  const CHART_COLORS = DASHBOARD_CHART_PALETTES[CHART_PALETTE] ?? ["#0F766E","#14B8A6","#2DD4BF","#5EEAD4","#99F6E4"]
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
    <DashboardTemplate name="dashboard_financeiro" title="Dashboard Financeiro">
      <Theme name={THEME_NAME} />
      <Dashboard id="overview" title="Dashboard Financeiro">
        <section style={ui.page}>
          <header style={ui.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
              <span style={ui.badge}>Cash Control</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>AP, AR e pressao de caixa no periodo</p>
                <h1 style={{ ...ui.title, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Financeiro</h1>
              </div>
              <p style={ui.subtitle}>Leitura em pagina unica com liquidez, recebimentos, passivo, detalhamento operacional e filtros dedicados no topo.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                label="Periodo de vencimento"
                table="financeiro.contas_pagar"
                field="data_vencimento"
                presets={['7d', '30d', '90d', 'month']}
                labelStyle={ui.headerDatePickerLabel}
                fieldStyle={ui.headerDatePickerField}
                iconStyle={ui.headerDatePickerIcon}
                presetButtonStyle={ui.headerDatePickerPreset}
                activePresetButtonStyle={ui.headerDatePickerPresetActive}
                separatorStyle={ui.headerDatePickerSeparator}
              />
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <p style={ui.eyebrow}>Filtro</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Status</h2>
              <Slicer
                label="Status"
                field="status"
                variant="dropdown"
                selectionMode="multiple"
                search
                clearable
                width="100%"
                query={`
                  SELECT DISTINCT
                    LOWER(src.status)::text AS value,
                    COALESCE(src.status, 'Sem status') AS label
                  FROM financeiro.contas_pagar src
                  WHERE COALESCE(src.status, '') <> ''
                  ORDER BY 2 ASC
                `}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <p style={ui.eyebrow}>Filtro</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Categoria despesa</h2>
              <Slicer
                label="Categoria despesa"
                field="categoria_despesa_id"
                variant="dropdown"
                selectionMode="multiple"
                search
                clearable
                width="100%"
                query={`
                  SELECT DISTINCT
                    cp.categoria_despesa_id::text AS value,
                    COALESCE(cd.nome, 'Sem categoria') AS label
                  FROM financeiro.contas_pagar cp
                  LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
                  WHERE cp.categoria_despesa_id IS NOT NULL
                  ORDER BY 2 ASC
                `}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <p style={ui.eyebrow}>Filtro</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Fornecedor</h2>
              <Slicer
                label="Fornecedor"
                field="fornecedor_id"
                variant="dropdown"
                selectionMode="multiple"
                search
                clearable
                width="100%"
                query={`
                  SELECT DISTINCT
                    cp.fornecedor_id::text AS value,
                    COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label
                  FROM financeiro.contas_pagar cp
                  LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                  WHERE cp.fornecedor_id IS NOT NULL
                  ORDER BY 2 ASC
                `}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: `SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value FROM financeiro.contas_receber cr WHERE 1=1 {{filters:cr}}`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Recebimentos</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Contas a receber</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: `SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Pagamentos</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Contas a pagar</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: `
                  SELECT (
                    COALESCE((SELECT SUM(cr.valor_liquido) FROM financeiro.contas_receber cr WHERE 1=1 {{filters:cr}}), 0)
                    - COALESCE((SELECT SUM(cp.valor_liquido) FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}), 0)
                  )::float AS value
                `,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Caixa</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Geracao liquida</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: `SELECT COUNT(*)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card frame={ui.cardFrame || undefined} style={ui.queryCard}>
                <p style={ui.kpiLabel}>Carga operacional</p>
                <h2 style={{ ...ui.title, fontSize: 20 }}>Titulos em AP</h2>
                <p style={ui.kpiValue}>{'{{query.valueFormatted}}'}</p>
                <p style={ui.kpiDelta}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>AP exposure</p>
                <h2 style={ui.title}>Contas a pagar por fornecedor</h2>
              </div>
              <p style={ui.paragraph}>Mostra onde o passivo esta concentrado para orientar negociacao, escalonamento e risco de vencimento.</p>
              <Chart
                type="bar"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cp.fornecedor_id::text, '0') AS key,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                      COALESCE(SUM(cp.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                    WHERE 1=1
                      {{filters:cp}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  `,
                  limit: 8,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Contas a pagar' },
                ]}
                yAxis={{ width: 86 }}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Status mix</p>
                <h2 style={ui.title}>Titulos por status</h2>
              </div>
              <Chart
                type="pie"
                height={320}
                format="number"
                colors={CHART_COLORS}
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cp.status, 'sem_status') AS key,
                      COALESCE(cp.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM financeiro.contas_pagar cp
                    WHERE 1=1
                      {{filters:cp}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  `,
                  limit: 6,
                }}
                categoryKey="label"
                legend={{ enabled: true, position: 'right' }}
                series={[
                  { dataKey: 'value', label: 'Titulos' },
                ]}
                recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>AR trend</p>
                <h2 style={ui.title}>Recebimentos por mes</h2>
              </div>
              <p style={ui.paragraph}>Serie mensal de contas a receber para confrontar o fluxo futuro com a pressao de pagamentos do mesmo periodo.</p>
              <Chart
                type="line"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: `
                    SELECT
                      TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'YYYY-MM') AS key,
                      TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'MM/YYYY') AS label,
                      COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_receber cr
                    WHERE 1=1
                      {{filters:cr}}
                    GROUP BY 1, 2
                    ORDER BY 1 ASC
                  `,
                  limit: 12,
                }}
                xAxis={{ dataKey: 'label' }}
                series={[
                  { dataKey: 'value', label: 'Recebimentos' },
                ]}
                yAxis={{ width: 86 }}
                recharts={{ showDots: false, singleSeriesGradient: true }}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>AR coverage</p>
                <h2 style={ui.title}>Recebimentos por cliente</h2>
              </div>
              <Chart
                type="bar"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: `
                    SELECT
                      COALESCE(cr.cliente_id::text, '0') AS key,
                      COALESCE(cli.nome_fantasia, 'Sem cliente') AS label,
                      COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_receber cr
                    LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
                    WHERE 1=1
                      {{filters:cr}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  `,
                  limit: 6,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Recebimentos' },
                ]}
                yAxis={{ width: 86 }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Table</p>
                <h2 style={ui.title}>Titulos de contas a pagar</h2>
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
                      COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text)) AS titulo,
                      TO_CHAR(cp.data_vencimento::date, 'DD/MM/YYYY') AS data_vencimento,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                      COALESCE(cd.nome, 'Sem categoria') AS categoria,
                      COALESCE(cp.status, 'Sem status') AS status,
                      COALESCE(cp.valor_liquido, 0)::float AS valor_liquido
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                    LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
                    WHERE 1=1
                      {{filters:cp}}
                    ORDER BY cp.data_vencimento ASC NULLS LAST, cp.id DESC
                  `,
                  limit: 12,
                }}
                columns={[
                  { accessorKey: 'titulo', header: 'Titulo' },
                  { accessorKey: 'data_vencimento', header: 'Vencimento' },
                  { accessorKey: 'fornecedor', header: 'Fornecedor' },
                  { accessorKey: 'categoria', header: 'Categoria' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge' },
                  { accessorKey: 'valor_liquido', header: 'Valor', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={ui.eyebrow}>Pivot</p>
                <h2 style={ui.title}>Fornecedor por status</h2>
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
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                      COALESCE(cp.status, 'Sem status') AS status,
                      COALESCE(cp.valor_liquido, 0)::float AS valor_liquido
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                    WHERE 1=1
                      {{filters:cp}}
                  `,
                  limit: 400,
                }}
                rows={[{ field: 'fornecedor', label: 'Fornecedor' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_liquido', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <p style={ui.eyebrow}>Insight</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Liquidez</h2>
              <Insights
                textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#0F766E' }}
                items={[
                  { text: 'A distancia entre AP e AR precisa ser lida junto com vencimento para separar risco de liquidez de simples concentracao pontual.' },
                ]}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <p style={ui.eyebrow}>Insight</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Concentracao</h2>
              <Insights
                textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { text: 'Fornecedores muito concentrados aumentam a sensibilidade do caixa a renegociacao, atraso e risco de vencimento relevante.' },
                ]}
              />
            </Card>

            <Card frame={ui.cardFrame || undefined} style={ui.panelCardAlt}>
              <p style={ui.eyebrow}>Insight</p>
              <h2 style={{ ...ui.title, fontSize: 20 }}>Status operacional</h2>
              <Insights
                textStyle={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#EA580C' }}
                items={[
                  { text: 'Titulos vencidos, parciais ou concentrados em poucas categorias tendem a esconder pressao operacional que nao aparece apenas no agregado monetario.' },
                ]}
              />
            </Card>
          </section>

          <footer style={ui.footer}>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Template JSX financeiro com AP, AR e geracao de caixa em uma unica pagina, com filtros dedicados e blocos operacionais sequenciais.</p>
            <p style={{ ...ui.paragraph, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: {THEME_NAME}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}