'use client'

import { buildDashboardModuleUi } from '@/products/dashboard/shared/templates/dashboardTemplateSupport'

const COMPRAS_VARIANT = {
  fileName: 'dashboard-compras.tsx',
  name: 'dashboard_compras',
  path: 'app/dashboard-compras.tsx',
  title: 'Dashboard de Compras',
}

function buildComprasDashboardSource(themeName: string) {
  const ui = buildDashboardModuleUi(themeName)
  return `export function DashboardCompras() {
  return (
    <DashboardTemplate name="${COMPRAS_VARIANT.name}" title="${COMPRAS_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${COMPRAS_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '64%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Procurement Review</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Compras, fornecedores e alocacao de gasto</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard de Compras</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Faixa de KPIs no topo, filtros sem DSL e cortes para fornecedor, centro de custo, categoria e status com queries SQL explicitas.</p>
            </div>
            <article style={${JSON.stringify(ui.noteCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Workspace note</p>
              <p style={${JSON.stringify(ui.paragraph)}}>O layout preserva o dashboard legado de compras, mas troca medidas e dimensoes do DSL por componentes JSX com tags e SQL query-driven.</p>
            </article>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            <article style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Global controls</p>
                <h2 style={${JSON.stringify(ui.title)}}>Periodo e filtros de corte</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
                <DatePicker
                  label="Periodo do pedido"
                  table="compras.compras"
                  field="data_pedido"
                  presets={['7d', '30d', '90d', 'month']}
                  labelStyle={${JSON.stringify(ui.headerDatePickerLabel)}}
                  fieldStyle={${JSON.stringify(ui.headerDatePickerField)}}
                  iconStyle={${JSON.stringify(ui.headerDatePickerIcon)}}
                  presetButtonStyle={${JSON.stringify(ui.headerDatePickerPreset)}}
                  activePresetButtonStyle={${JSON.stringify(ui.headerDatePickerPresetActive)}}
                  separatorStyle={${JSON.stringify(ui.headerDatePickerSeparator)}}
                />
                <Slicer
                  label="Fornecedor"
                  field="fornecedor_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={240}
                  query={\`
                    SELECT DISTINCT
                      src.fornecedor_id::text AS value,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label
                    FROM compras.compras src
                    LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                    WHERE src.fornecedor_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                />
                <Slicer
                  label="Centro de custo"
                  field="centro_custo_id"
                  variant="dropdown"
                  selectionMode="multiple"
                  search
                  clearable
                  width={220}
                  query={\`
                    SELECT DISTINCT
                      src.centro_custo_id::text AS value,
                      COALESCE(cc.nome, 'Sem centro de custo') AS label
                    FROM compras.compras src
                    LEFT JOIN empresa.centros_custo cc ON cc.id = src.centro_custo_id
                    WHERE src.centro_custo_id IS NOT NULL
                    ORDER BY 2 ASC
                  \`}
                />
              </div>
            </article>

            <article style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Leitura esperada</p>
              <p style={${JSON.stringify(ui.paragraph)}}>O objetivo aqui e separar concentracao por fornecedor, alocacao por centro de custo e ritmo mensal de gasto antes de entrar na tabela operacional.</p>
            </article>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Gasto total</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Valor comprado</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.fornecedor_id)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Base ativa</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Fornecedores</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.id)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Volume</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Pedidos</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(AVG(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <article style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Eficiência</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Ticket medio</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </article>
            </Query>
          </section>

          <Tabs defaultValue="spend">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Tab value="spend">Distribuicao</Tab>
              <Tab value="trend">Tendencia</Tab>
              <Tab value="details">Detalhamento</Tab>
            </div>

            <TabPanel value="spend">
              <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Top spend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por fornecedor</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Corte principal para identificar concentracao de compras e dependencia de poucos parceiros no periodo filtrado.</p>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.fornecedor_id, 0)::text AS key,
                          COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM compras.compras src
                        LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                        WHERE 1=1
                          {{filters:src}}
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
                    <p style={${JSON.stringify(ui.eyebrow)}}>Allocation</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por categoria</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Mostra em qual categoria de despesa o volume de compras esta se acumulando no periodo.</p>
                  <Chart
                    type="pie"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(src.categoria_despesa_id, 0)::text AS key,
                          COALESCE(cd.nome, 'Sem categoria') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM compras.compras src
                        LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
                        WHERE 1=1
                          {{filters:src}}
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

            <TabPanel value="trend">
              <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
                <article style={${JSON.stringify(ui.panelCard)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Trend</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Gasto por mes</h2>
                  </div>
                  <p style={${JSON.stringify(ui.paragraph)}}>Serie mensal para entender aceleracao ou desaceleracao de compras sem depender do motor DSL antigo.</p>
                  <Chart
                    type="line"
                    height={320}
                    format="currency"
                    colors={${JSON.stringify(ui.chartScheme)}}
                    dataQuery={{
                      query: \`
                        SELECT
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
                          TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'MM/YYYY') AS label,
                          COALESCE(SUM(src.valor_total), 0)::float AS value
                        FROM compras.compras src
                        WHERE 1=1
                          {{filters:src}}
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
                      <p style={${JSON.stringify(ui.eyebrow)}}>Status mix</p>
                      <h2 style={${JSON.stringify(ui.title)}}>Pedidos por status</h2>
                    </div>
                    <Chart
                      type="bar"
                      height={220}
                      format="number"
                      colors={${JSON.stringify(ui.chartScheme)}}
                      dataQuery={{
                        query: \`
                          SELECT
                            COALESCE(src.status, 'sem_status') AS key,
                            COALESCE(src.status, 'Sem status') AS label,
                            COUNT(*)::float AS value
                          FROM compras.compras src
                          WHERE 1=1
                            {{filters:src}}
                          GROUP BY 1, 2
                          ORDER BY 3 DESC
                        \`,
                        xField: 'label',
                        yField: 'value',
                        keyField: 'key',
                        limit: 8,
                      }}
                      xAxis={{ labelMode: 'first-word' }}
                    />
                  </article>
                  <article style={${JSON.stringify(ui.panelCardAlt)}}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Leituras operacionais</h2>
                      <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Hipoteses prontas para o time validar no detalhe da tabela.</p>
                    </div>
                    <Insights
                      textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                      iconStyle={{ color: '#2563EB' }}
                      items={[
                        { text: 'Se poucos fornecedores concentram a maior parte do gasto, a negociacao fica mais sensivel a prazo e ruptura.' },
                        { text: 'Centro de custo acima da media precisa ser lido junto com categoria para separar compra pontual de tendencia estrutural.' },
                        { text: 'Status com muito volume em analise ou parcial costuma indicar gargalo entre pedido, recebimento e pagamento.' },
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
                    <h2 style={${JSON.stringify(ui.title)}}>Pedidos de compra no detalhe</h2>
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
                          c.id::text AS compra_id,
                          COALESCE(c.numero_oc, CONCAT('OC-', c.id::text)) AS numero_oc,
                          TO_CHAR(c.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                          COALESCE(f.nome_fantasia, 'Sem fornecedor') AS fornecedor,
                          COALESCE(cc.nome, 'Sem centro de custo') AS centro_custo,
                          COALESCE(c.status, 'Sem status') AS status,
                          COALESCE(c.valor_total, 0)::float AS valor_total
                        FROM compras.compras c
                        LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
                        LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
                        WHERE 1=1
                          {{filters:c}}
                        ORDER BY c.data_pedido DESC NULLS LAST, c.id DESC
                      \`,
                      limit: 12,
                    }}
                    columns={[
                      { accessorKey: 'numero_oc', header: 'OC' },
                      { accessorKey: 'data_pedido', header: 'Data' },
                      { accessorKey: 'fornecedor', header: 'Fornecedor' },
                      { accessorKey: 'centro_custo', header: 'Centro custo' },
                      { accessorKey: 'status', header: 'Status', cell: 'badge' },
                      { accessorKey: 'valor_total', header: 'Valor', format: 'currency', align: 'right', headerAlign: 'right' },
                    ]}
                  />
                </article>

                <article style={${JSON.stringify(ui.panelCardAlt)}}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={${JSON.stringify(ui.eyebrow)}}>Pivot</p>
                    <h2 style={${JSON.stringify(ui.title)}}>Categoria por status</h2>
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
                          COALESCE(cd.nome, 'Sem categoria') AS categoria,
                          COALESCE(c.status, 'Sem status') AS status,
                          COALESCE(c.valor_total, 0)::float AS valor_total
                        FROM compras.compras c
                        LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id
                        WHERE 1=1
                          {{filters:c}}
                      \`,
                      limit: 400,
                    }}
                    rows={[{ field: 'categoria', label: 'Categoria' }]}
                    columns={[{ field: 'status', label: 'Status' }]}
                    values={[{ field: 'valor_total', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
                  />
                </article>
              </section>
            </TabPanel>
          </Tabs>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX de compras com filtros globais, queries SQL explicitas e surface alinhada ao workspace novo.</p>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Theme ativo: ${themeName}</p>
          </footer>
        </section>
      </Dashboard>
    </DashboardTemplate>
  )
}`
}

export function buildComprasDashboardTemplateVariant(themeName: string) {
  return {
    content: buildComprasDashboardSource(themeName),
    name: COMPRAS_VARIANT.fileName,
    path: COMPRAS_VARIANT.path,
  }
}
