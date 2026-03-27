'use client'

import { buildDashboardModuleUi, buildFramePropSource } from '@/products/dashboard/shared/templates/dashboardTemplateSupport'
import { DASHBOARD_TEMPLATE_PALETTES } from '@/products/dashboard/shared/templates/dashboardTemplatePalettes'

const COMPRAS_VARIANT = {
  fileName: 'dashboard-compras.tsx',
  name: 'dashboard_compras',
  path: 'app/dashboard-compras.tsx',
  title: 'Dashboard de Compras',
}

function buildComprasDashboardSource(themeName: string) {
  const ui = buildDashboardModuleUi(themeName)
  const cardFrameSource = buildFramePropSource(ui.cardFrame)
  const chartColors = DASHBOARD_TEMPLATE_PALETTES.compras
  return `export function DashboardCompras() {
  const CHART_COLORS = ${JSON.stringify(chartColors)}

  return (
    <DashboardTemplate name="${COMPRAS_VARIANT.name}" title="${COMPRAS_VARIANT.title}">
      <Theme name="${themeName}" />
      <Dashboard id="overview" title="${COMPRAS_VARIANT.title}">
        <section style={${JSON.stringify(ui.page)}}>
          <header style={${JSON.stringify(ui.header)}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '58%' }}>
              <span style={${JSON.stringify(ui.badge)}}>Procurement Review</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Compras, fornecedores e alocacao de gasto</p>
                <h1 style={{ ...${JSON.stringify(ui.title)}, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em' }}>Dashboard de Compras</h1>
              </div>
              <p style={${JSON.stringify(ui.subtitle)}}>Leitura em pagina unica com KPIs no topo, filtros dedicados, distribuicao de gasto, serie temporal e detalhamento operacional sem DSL.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '34%', minWidth: 320 }}>
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
            </div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
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
                    src.fornecedor_id::text AS value,
                    COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label
                  FROM compras.compras src
                  LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                  WHERE src.fornecedor_id IS NOT NULL
                  ORDER BY 2 ASC
                \`}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Filtro</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Centro de custo</h2>
              <Slicer
                label="Centro de custo"
                field="centro_custo_id"
                variant="dropdown"
                selectionMode="multiple"
                search
                clearable
                width="100%"
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
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
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
                    src.status::text AS value,
                    COALESCE(src.status, 'Sem status') AS label
                  FROM compras.compras src
                  WHERE COALESCE(src.status, '') <> ''
                  ORDER BY 2 ASC
                \`}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <Query dataQuery={{ query: \`SELECT COALESCE(SUM(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Gasto total</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Valor comprado</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.fornecedor_id)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Base ativa</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Fornecedores</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COUNT(DISTINCT c.id)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="number" comparisonMode="previous_period">
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Volume</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Pedidos</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
            <Query dataQuery={{ query: \`SELECT COALESCE(AVG(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters:c}}\`, limit: 1 }} format="currency" comparisonMode="previous_period">
              <Card${cardFrameSource} style={${JSON.stringify(ui.queryCard)}}>
                <p style={${JSON.stringify(ui.kpiLabel)}}>Eficiencia</p>
                <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Ticket medio</h2>
                <p style={${JSON.stringify(ui.kpiValue)}}>{'{{query.valueFormatted}}'}</p>
                <p style={${JSON.stringify(ui.kpiDelta)}}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
              </Card>
            </Query>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Top spend</p>
                <h2 style={${JSON.stringify(ui.title)}}>Gasto por fornecedor</h2>
              </div>
              <p style={${JSON.stringify(ui.paragraph)}}>Corte principal para identificar concentracao de compras e dependencia de poucos parceiros no periodo filtrado.</p>
              <Chart
                type="bar"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(src.fornecedor_id::text, '0') AS key,
                      COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                      COALESCE(SUM(src.valor_total), 0)::float AS value
                    FROM compras.compras src
                    LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                    WHERE 1=1
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
                <p style={${JSON.stringify(ui.eyebrow)}}>Allocation</p>
                <h2 style={${JSON.stringify(ui.title)}}>Gasto por categoria</h2>
              </div>
              <p style={${JSON.stringify(ui.paragraph)}}>Mostra em qual categoria de despesa o volume de compras esta se acumulando no periodo.</p>
              <Chart
                type="pie"
                height={320}
                format="currency"
                colors={CHART_COLORS}
                dataQuery={{
                  query: \`
                    SELECT
                      COALESCE(src.categoria_despesa_id::text, '0') AS key,
                      COALESCE(cd.nome, 'Sem categoria') AS label,
                      COALESCE(SUM(src.valor_total), 0)::float AS value
                    FROM compras.compras src
                    LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
                    WHERE 1=1
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

          <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Trend</p>
                <h2 style={${JSON.stringify(ui.title)}}>Gasto por mes</h2>
              </div>
              <p style={${JSON.stringify(ui.paragraph)}}>Serie mensal para entender aceleracao ou desaceleracao de compras sem depender do motor DSL antigo.</p>
              <Chart
                type="line"
                height={320}
                format="currency"
                colors={CHART_COLORS}
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
                  limit: 12,
                }}
                xAxis={{ dataKey: 'label' }}
                series={[
                  { dataKey: 'value', label: 'Gasto' },
                ]}
                yAxis={{ width: 86 }}
                recharts={{ showDots: false, singleSeriesGradient: true }}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={${JSON.stringify(ui.eyebrow)}}>Status mix</p>
                <h2 style={${JSON.stringify(ui.title)}}>Pedidos por status</h2>
              </div>
              <Chart
                type="bar"
                height={320}
                format="number"
                colors={CHART_COLORS}
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
                  limit: 8,
                }}
                xAxis={{ dataKey: 'label', labelMode: 'first-word' }}
                series={[
                  { dataKey: 'value', label: 'Pedidos' },
                ]}
              />
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCard)}}>
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
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
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
            </Card>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Concentracao em fornecedores</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#2563EB' }}
                items={[
                  { text: 'Se poucos fornecedores concentram a maior parte do gasto, a negociacao fica mais sensivel a prazo, ruptura e dependencia comercial.' },
                ]}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Pressao por centro de custo</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#0F766E' }}
                items={[
                  { text: 'Centro de custo acima da media precisa ser lido junto com categoria para separar compra pontual de uma tendencia estrutural de gasto.' },
                ]}
              />
            </Card>

            <Card${cardFrameSource} style={${JSON.stringify(ui.panelCardAlt)}}>
              <p style={${JSON.stringify(ui.eyebrow)}}>Insight</p>
              <h2 style={{ ...${JSON.stringify(ui.title)}, fontSize: 20 }}>Risco operacional</h2>
              <Insights
                textStyle={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.65 }}
                iconStyle={{ color: '#EA580C' }}
                items={[
                  { text: 'Status com muito volume em analise ou parcial costuma indicar gargalo entre pedido, recebimento e pagamento.' },
                ]}
              />
            </Card>
          </section>

          <footer style={${JSON.stringify(ui.footer)}}>
            <p style={{ ...${JSON.stringify(ui.paragraph)}, fontSize: 13, lineHeight: 1.6 }}>Template JSX de compras com filtros dedicados, queries SQL explicitas e leitura completa em uma unica pagina.</p>
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
