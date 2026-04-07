'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const FINANCEIRO_VARIANT = {
  fileName: 'dashboard-financeiro.tsx',
  name: 'dashboard_financeiro',
  path: 'app/dashboard-financeiro.tsx',
  title: 'Dashboard Financeiro',
}

function buildFinanceiroDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('financeiro')
  return `<Dashboard id="overview" title="${FINANCEIRO_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="teal">
        <Vertical gap={18} style={{ width: '1600px', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg }}>
          <Horizontal gap={18}>
              <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
                  <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Cash Control</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Text variant="eyebrow">AP, AR e pressao de caixa no periodo</Text>
                    <Text as="h1" variant="page-title">Dashboard Financeiro</Text>
                  </div>
                  <Text variant="lead">Leitura em pagina unica com liquidez, recebimentos, passivo, detalhamento operacional e filtros dedicados no topo.</Text>
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
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={16}>
            <Card id="financeiro-filter-status" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Text variant="eyebrow">Filtro</Text>
                <Text as="h2" variant="section-title-sm">Status</Text>
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

            <Card id="financeiro-filter-categoria" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Text variant="eyebrow">Filtro</Text>
                <Text as="h2" variant="section-title-sm">Categoria despesa</Text>
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

            <Card id="financeiro-filter-fornecedor" span={4} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Text variant="eyebrow">Filtro</Text>
                <Text as="h2" variant="section-title-sm">Fornecedor</Text>
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
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={16}>
            <Card id="financeiro-kpi-ar" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Contas a receber"
                  dataQuery={{ query: \`SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value FROM financeiro.contas_receber cr WHERE 1=1 {{filters}}\`, limit: 1 }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="financeiro-kpi-ap" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Contas a pagar"
                  dataQuery={{ query: \`SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters}}\`, limit: 1 }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="financeiro-kpi-geracao" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Geracao liquida"
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
                  <KPICompare />
                </KPI>
              </Card>
            <Card id="financeiro-kpi-titulos" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                <KPI
                  title="Titulos em AP"
                  dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters}}\`, limit: 1 }}
                  format="number"
                  comparisonMode="previous_period"
                >
                  <KPICompare />
                </KPI>
              </Card>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="financeiro-chart-ap" span={7} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">AP exposure</Text>
                  <Text as="h2" variant="section-title">Contas a pagar por fornecedor</Text>
                </div>
                <Text variant="body-muted">Mostra onde o passivo esta concentrado para orientar negociacao, escalonamento e risco de vencimento.</Text>
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

            <Card id="financeiro-chart-status" span={5} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">Status mix</Text>
                  <Text as="h2" variant="section-title">Titulos por status</Text>
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
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="financeiro-chart-ar" span={7} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">AR trend</Text>
                  <Text as="h2" variant="section-title">Recebimentos por mes</Text>
                </div>
                <Text variant="body-muted">Serie mensal de contas a receber para confrontar o fluxo futuro com a pressao de pagamentos do mesmo periodo.</Text>
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

            <Card id="financeiro-chart-clientes" span={5} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">AR coverage</Text>
                  <Text as="h2" variant="section-title">Recebimentos por cliente</Text>
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
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="financeiro-table-ap" span={8} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">Table</Text>
                  <Text as="h2" variant="section-title">Titulos de contas a pagar</Text>
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

            <Card id="financeiro-pivot-status" span={4} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Text variant="eyebrow">Pivot</Text>
                  <Text as="h2" variant="section-title">Fornecedor por status</Text>
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
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="financeiro-insight-liquidez" span={4} rows={7} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text as="h2" variant="section-title-sm">Liquidez</Text>
                </div>
                <Insights
                  textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                  iconStyle={{ color: '#0F766E' }}
                  items={[
                    { text: 'A distancia entre AP e AR precisa ser lida junto com vencimento para separar risco de liquidez de simples concentracao pontual.' },
                  ]}
                />
              </Card>

            <Card id="financeiro-insight-concentracao" span={4} rows={7} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text as="h2" variant="section-title-sm">Concentracao</Text>
                </div>
                <Insights
                  textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                  iconStyle={{ color: '#2563EB' }}
                  items={[
                    { text: 'Fornecedores muito concentrados aumentam a sensibilidade do caixa a renegociacao, atraso e risco de vencimento relevante.' },
                  ]}
                />
              </Card>

            <Card id="financeiro-insight-status" span={4} rows={7} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text as="h2" variant="section-title-sm">Status operacional</Text>
                </div>
                <Insights
                  textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                  iconStyle={{ color: '#EA580C' }}
                  items={[
                    { text: 'Titulos vencidos, parciais ou concentrados em poucas categorias tendem a esconder pressao operacional que nao aparece apenas no agregado monetario.' },
                  ]}
                />
              </Card>
          </Horizontal>

          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Card id="financeiro-footer" span={12} rows={3}>
              <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                <Text variant="small-muted">Template JSX financeiro com AP, AR e geracao de caixa em uma unica pagina, com filtros dedicados e blocos operacionais sequenciais.</Text>
                <Text variant="small-muted">Theme ativo: ${resolvedThemeName}</Text>
              </footer>
            </Card>
          </Horizontal>
        </Vertical>
    </Dashboard>`
}

export function buildFinanceiroDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildFinanceiroDashboardSource(themeName || ''),
    name: FINANCEIRO_VARIANT.fileName,
    path: FINANCEIRO_VARIANT.path,
  }
}
