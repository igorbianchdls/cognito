'use client'

import { buildDashboardModuleUi } from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const FINANCEIRO_VARIANT = {
  fileName: 'dashboard-financeiro.tsx',
  name: 'dashboard_financeiro',
  path: 'app/dashboard-financeiro.tsx',
  title: 'Dashboard Financeiro',
}

function buildFinanceiroDashboardSource(themeName: string) {
  const ui = buildDashboardModuleUi(themeName)
  return `export function DashboardFinanceiro() {
  return (
    <DashboardTemplate name="${FINANCEIRO_VARIANT.name}" title="${FINANCEIRO_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${FINANCEIRO_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Cash Control</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>AP, AR e pressao de caixa no periodo</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Financeiro</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Leitura executiva com KPIs de recebimento e pagamento, cortes por fornecedor e cliente, serie mensal e detalhamento operacional.</p>
            </div>
            <article style={${JSON.stringify(ui.noteCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Workspace note</p>
              <p style={${JSON.stringify(ui.paragraph)}}>O template novo preserva a logica do dashboard financeiro legado, mas agora usa queries SQL com tags JSX, filtros globais e componentes reutilizaveis do renderer atual.</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <article style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Global controls</p>
                <h2 style={${JSON.stringify(ui.title)}}>Periodo, status e categoria</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePicker
                  label="Periodo de vencimento"
                  table="financeiro.contas_pagar"
                  field="data_vencimento"
                  presets={['7d', '30d', '90d', 'month']}
                  labelStyle={${JSON.stringify(ui.headerDatePickerLabel)}}
                  fieldStyle={${JSON.stringify(ui.headerDatePickerField)}}
                  iconStyle={${JSON.stringify(ui.headerDatePickerIcon)}}
                  presetButtonStyle={${JSON.stringify(ui.headerDatePickerPreset)}}
                  activePresetButtonStyle={${JSON.stringify(ui.headerDatePickerPresetActive)}}
                  separatorStyle={${JSON.stringify(ui.headerDatePickerSeparator)}}
                />
                <Slicer
                  label="Status"
                  field="status"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={180}
                  query={\`
                    SELECT DISTINCT
                      LOWER(src.status)::text AS value,
                      COALESCE(src.status, 'Sem status') AS label
                    FROM financeiro.contas_pagar src
                    WHERE COALESCE(src.status, '') <> ''
                    ORDER BY 2 ASC
                  \`}
                />
                <Slicer
                  label="Categoria despesa"
                  field="categoria_despesa_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={240}
                  query={\`
                    SELECT DISTINCT
                      cp.categoria_despesa_id::text AS value,
                      COALESCE(cd.nome, 'Sem categoria') AS label
                    FROM financeiro.contas_pagar cp
                    LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
                    WHERE cp.categoria_despesa_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                />
              </div>
            </article>

            <article style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Leitura esperada</p>
              <p style={${JSON.stringify(ui.paragraph)}}>A leitura comeca no caixa liquido do periodo, depois separa onde o passivo esta concentrado e quais recebimentos sustentam a cobertura.</p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value FROM financeiro.contas_receber cr WHERE 1=1 {{filters:cr}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Recebimentos</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Contas a receber</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Pagamentos</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Contas a pagar</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query
              dataQuery={{
                query: \`
                  SELECT (
                    COALESCE((SELECT SUM(cr.valor_liquido) FROM financeiro.contas_receber cr WHERE 1=1 {{filters:cr}}), 0)
                    - COALESCE((SELECT SUM(cp.valor_liquido) FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}), 0)
                  )::float AS value
                \`,
                limit: 1,
              }}
              format="currency"
              comparisonMode="previous_period"
            >
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Caixa</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Geração liquida</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Carga operacional</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Titulos em AP</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
          </section>

          <Tabs defaultValue="liquidity">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="liquidity">Liquidez</Tab>
              <Tab value="collections">Recebimentos</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="liquidity">
              <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>AP exposure</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Contas a pagar por fornecedor</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Mostra onde o passivo esta concentrado para orientar negociacao, escalonamento e risco de vencimento.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(cp.fornecedor_id, 0)::text AS key,
                          COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                          COALESCE(SUM(cp.valor_liquido), 0)::float AS value
                        FROM financeiro.contas_pagar cp
                        LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                        WHERE 1=1
                          {{filters:cp}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 8,
                    }}
                    yAxis={{ width: 86 }}
                    xAxis={{ labelMode: 'first-word' }}
                  />
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Status mix</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Titulos por status</h2>
                  </div>
                  <Chart
                    type="pie"
                    height={320}
                    format="number"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(cp.status, 'sem_status') AS key,
                          COALESCE(cp.status, 'Sem status') AS label,
                          COUNT(*)::float AS value
                        FROM financeiro.contas_pagar cp
                        WHERE 1=1
                          {{filters:cp}}
                        GROUP BY 1, 2
                        ORDER BY 3 DESC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 6,
                    }}
                    legend={{ enabled: true, position: 'right' }}
                    series={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
                  />
                </article>
              </section>
            </TabPanel>

            <TabPanel value="collections">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>AR trend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Recebimentos por mes</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Serie mensal de contas a receber para confrontar o fluxo futuro com a pressao de pagamentos do mesmo periodo.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', cr.data_vencimento), 'MM/YYYY') AS label,
                          COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                        FROM financeiro.contas_receber cr
                        WHERE 1=1
                          {{filters:cr}}
                        GROUP BY 1, 2
                        ORDER BY 1 ASC
                      \`,
                      xField: 'label',
                      yField: 'value',
                      keyField: 'key',
                      limit: 12,
                    }}
                    yAxis={{ width: 86 }}
                    series={{ showDots: false, singleSeriesGradient: true }}
                  />
                </article>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={${JSON.stringify(ui.eyebrow)}}>AR coverage</p>
                      <h2 style={${JSON.stringify(ui.title)}}>Recebimentos por cliente</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="currency"
                      colors={${JSON.stringify(ui.chartScheme)}}
                      dataQuery={{
                        query: \`
                          SELECT
                            COALESCE(cr.cliente_id, 0)::text AS key,
                            COALESCE(cli.nome_fantasia, 'Sem cliente') AS label,
                            COALESCE(SUM(cr.valor_liquido), 0)::float AS value
                          FROM financeiro.contas_receber cr
                          LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
                          WHERE 1=1
                            {{filters:cr}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`,
                        xField: 'label',
                        yField: 'value',
                        keyField: 'key',
                        limit: 6,
                      }}
                      yAxis={{ width: 86 }}
                      xAxis={{ labelMode: 'first-word' }}
                    />
                  </article>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Hipoteses para validar em contas a pagar e contas a receber.</p>
                    </div>
                    <Insights
                      textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#0F766E' }}
                      items={[
                        { text: 'A distancia entre AP e AR precisa ser lida junto com vencimento para separar risco de liquidez de simples concentracao pontual.' },
                        { text: 'Fornecedores ou clientes muito concentrados aumentam sensibilidade do caixa a renegociacao e atraso.' },
                        { text: 'Status vencido ou parcial tende a esconder pressao operacional que nao aparece apenas no agregado monetario.' },
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
                    <h2 style={${JSON.stringify(ui.title)}}>Titulos de contas a pagar</h2>
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
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Pivot</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Fornecedor por status</h2>
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
                          COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                          COALESCE(cp.status, 'Sem status') AS status,
                          COALESCE(cp.valor_liquido, 0)::float AS valor_liquido
                        FROM financeiro.contas_pagar cp
                        LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                        WHERE 1=1
                          {{filters:cp}}
                      \`,
                      limit: 400,
                    }}
                    rows={[{ field: 'fornecedor', label: 'Fornecedor' }]}
                    columns={[{ field: 'status', label: 'Status' }]}
                    values={[{ field: 'valor_liquido', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX financeiro com AP, AR e geracao de caixa no mesmo workspace, sem depender do pipeline antigo em DSL.</p>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${themeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildFinanceiroDashboardTemplateVariant(themeName: string) {
  return {
    content: buildFinanceiroDashboardSource(themeName),
    name: FINANCEIRO_VARIANT.fileName,
    path: FINANCEIRO_VARIANT.path,
  }
}
