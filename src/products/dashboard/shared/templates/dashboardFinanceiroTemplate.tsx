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
  const CHART_COLORS = ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4']

  return (
    <DashboardTemplate name="${FINANCEIRO_VARIANT.name}" title="${FINANCEIRO_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${FINANCEIRO_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Cash Control</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>AP, AR e pressao de caixa no periodo</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard Financeiro</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Leitura em pagina unica com liquidez, recebimentos, passivo, detalhamento operacional e filtros dedicados no topo.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
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
              <article style={{ ...${JSON.stringify(ui.noteCard)}, width: '100%', minWidth: 0 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Workspace note</p>
                <p style={${JSON.stringify(ui.paragraph)}}>O template financeiro agora fica em pagina unica, com blocos de AP, AR e caixa no mesmo fluxo de leitura e sem depender do pipeline antigo em DSL.</p>
              </article>
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <Card style={${JSON.stringify(ui.panelCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Filtro</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Status</h2>
              <Slicer
                label="Status"
                field="status"
                variant="dropdown"
                selectionMode="multiple"
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
              />
            </Card>

            <Card style={${JSON.stringify(ui.panelCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Filtro</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Categoria despesa</h2>
              <Slicer
                label="Categoria despesa"
                field="categoria_despesa_id"
                variant="dropdown"
                selectionMode="multiple"
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
              />
            </Card>

            <Card style={${JSON.stringify(ui.panelCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Filtro</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Fornecedor</h2>
              <Slicer
                label="Fornecedor"
                field="fornecedor_id"
                variant="dropdown"
                selectionMode="multiple"
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
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cr.valor_liquido), 0)::float AS value FROM financeiro.contas_receber cr WHERE 1=1 {{filters:cr}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Recebimentos</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Contas a receber</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(cp.valor_liquido), 0)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Pagamentos</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Contas a pagar</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
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
              <Card style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Caixa</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Geracao liquida</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(*)::float AS value FROM financeiro.contas_pagar cp WHERE 1=1 {{filters:cp}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Carga operacional</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Titulos em AP</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
            <Card style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>AP exposure</p>
                <h2 style={${JSON.stringify(ui.title)}}>Contas a pagar por fornecedor</h2>
              </div>
              <p style={${JSON.stringify(ui.paragraph)}}>Mostra onde o passivo esta concentrado para orientar negociacao, escalonamento e risco de vencimento.</p>
              <Chart
                type="bar"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: \`
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

            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Status mix</p>
                <h2 style={${JSON.stringify(ui.title)}}>Titulos por status</h2>
              </div>
              <Chart
                type="pie"
                height={320}
                format="number"
                colors={CHART_COLORS}
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
            <Card style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>AR trend</p>
                <h2 style={${JSON.stringify(ui.title)}}>Recebimentos por mes</h2>
              </div>
              <p style={${JSON.stringify(ui.paragraph)}}>Serie mensal de contas a receber para confrontar o fluxo futuro com a pressao de pagamentos do mesmo periodo.</p>
              <Chart
                type="line"
                height={320}
                format="currency"
                colors={CHART_COLORS}
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

            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>AR coverage</p>
                <h2 style={${JSON.stringify(ui.title)}}>Recebimentos por cliente</h2>
              </div>
              <Chart
                type="bar"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: \`
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
            <Card style={${JSON.stringify(ui.panelCard)}}>
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
            </Card>

            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
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
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Liquidez</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#0F766E' }}
                items={[
                  { text: 'A distancia entre AP e AR precisa ser lida junto com vencimento para separar risco de liquidez de simples concentracao pontual.' },
                ]}
              />
            </Card>

            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Concentracao</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { text: 'Fornecedores muito concentrados aumentam a sensibilidade do caixa a renegociacao, atraso e risco de vencimento relevante.' },
                ]}
              />
            </Card>

            <Card style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Status operacional</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#EA580C' }}
                items={[
                  { text: 'Titulos vencidos, parciais ou concentrados em poucas categorias tendem a esconder pressao operacional que nao aparece apenas no agregado monetario.' },
                ]}
              />
            </Card>
          </section>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX financeiro com AP, AR e geracao de caixa em uma unica pagina, com filtros dedicados e blocos operacionais sequenciais.</p>
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
