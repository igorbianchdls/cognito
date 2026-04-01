'use client'

import {
  buildDashboardThemeImportSource,
  getDashboardTemplateThemeName,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const FINANCEIRO_VARIANT = {
  fileName: 'dashboard-financeiro.tsx',
  name: 'dashboard_financeiro',
  path: 'app/dashboard-financeiro.tsx',
  title: 'Dashboard Financeiro',
}

function buildFinanceiroDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('financeiro')
  return `${buildDashboardThemeImportSource()}

export function DashboardFinanceiro() {
  const theme = resolveDashboardThemeTokens(${JSON.stringify(resolvedThemeName)})

  return (
    <DashboardTemplate name="${FINANCEIRO_VARIANT.name}" title="${FINANCEIRO_VARIANT.title}">
      <Theme name="${resolvedThemeName}" chartPalette="teal" />
      <Dashboard id="overview" title="${FINANCEIRO_VARIANT.title}">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.headerBg, color: theme.headerText }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
              <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Cash Control</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AP, AR e pressao de caixa no periodo</p>
                <h1 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Financeiro</h1>
              </div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: theme.textSecondary }}>Leitura em pagina unica com liquidez, recebimentos, passivo, detalhamento operacional e filtros dedicados no topo.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
              <DatePicker
                label="Periodo de vencimento"
                table="financeiro.contas_pagar"
                field="data_vencimento"
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

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Status</h2>
              <Filter
                label="Status"
                table="financeiro.contas_pagar"
                field="status"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    LOWER(src.status)::text AS value,
                    COALESCE(src.status, 'Sem status') AS label
                  FROM financeiro.contas_pagar src
                  WHERE COALESCE(src.status, '') <> ''
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Categoria despesa</h2>
              <Filter
                label="Categoria despesa"
                table="financeiro.contas_pagar"
                field="categoria_despesa_id"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    cp.categoria_despesa_id::text AS value,
                    COALESCE(cd.nome, 'Sem categoria') AS label
                  FROM financeiro.contas_pagar cp
                  LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
                  WHERE cp.categoria_despesa_id IS NOT NULL
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Fornecedor</h2>
              <Filter
                label="Fornecedor"
                table="financeiro.contas_pagar"
                field="fornecedor_id"
                mode="multiple"
                search
                clearable
                width="100%"
                query={\`
                  SELECT DISTINCT
                    cp.fornecedor_id::text AS value,
                    COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label
                  FROM financeiro.contas_pagar cp
                  LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                  WHERE cp.fornecedor_id IS NOT NULL
                  ORDER BY 2 ASC
                \`}
              >
                <Select />
              </Filter>
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value FROM financeiro.contas_receber cr WHERE 1=1 {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card style={{ padding: 22, borderRadius: 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recebimentos</p>
                <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Contas a receber</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card style={{ padding: 22, borderRadius: 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagamentos</p>
                <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Contas a pagar</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT (
                    COALESCE((SELECT SUM(cr.valor_liquido) FROM financeiro.contas_receber cr WHERE 1=1 {{filters}}), 0)
                    - COALESCE((SELECT SUM(cp.valor_liquido) FROM financeiro.contas_pagar cp WHERE 1=1 {{filters}}), 0)
                  )::float AS value
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <Card style={{ padding: 22, borderRadius: 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Caixa</p>
                <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Geracao liquida</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card style={{ padding: 22, borderRadius: 22, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carga operacional</p>
                <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Titulos em AP</h2>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</p>
                <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AP exposure</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Contas a pagar por fornecedor</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }}>Mostra onde o passivo esta concentrado para orientar negociacao, escalonamento e risco de vencimento.</p>
              <Chart
                type="bar"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(cp.fornecedor_id::text, '0') AS key,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                      COALESCE(SUM(cp.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  \`,
                  limit: 8,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Contas a pagar' },
                ]}
                yAxis={{ width: 86 }}
              />
            </Card>

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status mix</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Titulos por status</h2>
              </div>
              <Chart
                type="pie"
                height={320}
                format="number"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(cp.status, 'sem_status') AS key,
                      COALESCE(cp.status, 'Sem status') AS label,
                      COUNT(*)::float AS value
                    FROM financeiro.contas_pagar cp
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
                  { dataKey: 'value', label: 'Titulos' },
                ]}
                recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AR trend</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Recebimentos por mes</h2>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }}>Serie mensal de contas a receber para confrontar o fluxo futuro com a pressao de pagamentos do mesmo periodo.</p>
              <Chart
                type="line"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'YYYY-MM') AS key,
                      TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'MM/YYYY') AS label,
                      COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_receber cr
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 1 ASC
                  \`,
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

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AR coverage</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Recebimentos por cliente</h2>
              </div>
              <Chart
                type="bar"
                height={320}
                format="currency"
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(cr.cliente_id::text, '0') AS key,
                      COALESCE(cli.nome_fantasia, 'Sem cliente') AS label,
                      COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                    FROM financeiro.contas_receber cr
                    LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
                    WHERE 1=1
                      {{filters}}
                    GROUP BY 1, 2
                    ORDER BY 3 DESC
                  \`,
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
            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Titulos de contas a pagar</h2>
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
                      {{filters}}
                    ORDER BY cp.data_vencimento ASC NULLS LAST, cp.id DESC
                  \`,
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

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }}>Fornecedor por status</h2>
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
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                      COALESCE(cp.status, 'Sem status') AS status,
                      COALESCE(cp.valor_liquido, 0)::float AS valor_liquido
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                    WHERE 1=1
                      {{filters}}
                  \`,
                  limit: 400,
                }}
                rows={[{ field: 'fornecedor', label: 'Fornecedor' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_liquido', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Liquidez</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#0F766E' }}
                items={[
                  { text: 'A distancia entre AP e AR precisa ser lida junto com vencimento para separar risco de liquidez de simples concentracao pontual.' },
                ]}
              />
            </Card>

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Concentracao</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { text: 'Fornecedores muito concentrados aumentam a sensibilidade do caixa a renegociacao, atraso e risco de vencimento relevante.' },
                ]}
              />
            </Card>

            <Card style={{ padding: 22, borderRadius: theme.cardFrame ? 0 : 24, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insight</p>
              <h2 style={{ ...{ margin: 0, fontSize: 24, fontWeight: 600, color: theme.titleColor, letterSpacing: '-0.03em' }, fontSize: 20 }}>Status operacional</h2>
              <Insights
                textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#EA580C' }}
                items={[
                  { text: 'Titulos vencidos, parciais ou concentrados em poucas categorias tendem a esconder pressao operacional que nao aparece apenas no agregado monetario.' },
                ]}
              />
            </Card>
          </section>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
            <p style={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.6 }}>Template JSX financeiro com AP, AR e geracao de caixa em uma unica pagina, com filtros dedicados e blocos operacionais sequenciais.</p>
            <p style={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${resolvedThemeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildFinanceiroDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildFinanceiroDashboardSource(themeName || ''),
    name: FINANCEIRO_VARIANT.fileName,
    path: FINANCEIRO_VARIANT.path,
  }
}
