'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const COMPRAS_VARIANT = {
  fileName: 'dashboard-compras.tsx',
  name: 'dashboard_compras',
  path: 'app/dashboard-compras.tsx',
  title: 'Dashboard de Compras',
}

function buildComprasDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('compras')
  return `<Dashboard id="overview" title="${COMPRAS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="blue">
        <Tabs defaultValue="overview">
          <Horizontal gap={24} style={{ width: '1600px', minHeight: '100%', padding: 32, backgroundColor: theme.pageBg, alignItems: 'flex-start' }}>
            <Card id="compras-sidebar" width={320} shrink={false}>
              <Vertical gap={18} style={{ position: 'sticky', top: 24 }}>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Vertical gap={10}>
                    <span style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', borderRadius: 999, border: '1px solid ' + theme.accentBorder, backgroundColor: theme.accentSurface, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: theme.accentText }}>Procurement Review</span>
                    <Text variant="eyebrow">Compras, fornecedores e alocacao de gasto</Text>
                    <Text as="h1" variant="page-title-sm">Dashboard de Compras</Text>
                    <Text variant="body-muted">Navegue pelas visoes do dashboard e ajuste os filtros sem depender do header antigo.</Text>
                  </Vertical>

                  <DatePicker
                    label="Periodo do pedido"
                    table="compras.compras"
                    field="data_pedido"
                    presets={['7d', '30d', '90d', 'month']}
                    labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                    iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                    presetButtonStyle={{ height: 36, padding: '0 12px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                    activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                    separatorStyle={{ color: theme.headerDatePickerLabel, fontSize: 13, fontWeight: 500 }}
                  />

                  <Vertical gap={10}>
                    <Text variant="eyebrow">Tabs</Text>
                    <Vertical gap={8}>
                      <Tab value="overview" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Visao geral</Tab>
                      <Tab value="details" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Detalhamento</Tab>
                      <Tab value="insights" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>Insights</Tab>
                    </Vertical>
                  </Vertical>
                </Card>

                <Card variant="filter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Text variant="eyebrow">Filtro</Text>
                  <Text as="h2" variant="section-title-sm">Fornecedor</Text>
                  <Filter
                    label="Fornecedor"
                    table="compras.compras"
                    field="fornecedor_id"
                    mode="multiple"
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
                  >
                    <OptionList />
                  </Filter>
                </Card>

                <Card variant="filter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Text variant="eyebrow">Filtro</Text>
                  <Text as="h2" variant="section-title-sm">Centro de custo</Text>
                  <Filter
                    label="Centro de custo"
                    table="compras.compras"
                    field="centro_custo_id"
                    mode="multiple"
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
                  >
                    <OptionList />
                  </Filter>
                </Card>

                <Card variant="filter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Text variant="eyebrow">Filtro</Text>
                  <Text as="h2" variant="section-title-sm">Status</Text>
                  <Filter
                    label="Status"
                    table="compras.compras"
                    field="status"
                    mode="multiple"
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
                  >
                    <OptionList />
                  </Filter>
                </Card>
              </Vertical>
            </Card>

            <Card id="compras-main" grow={1}>
              <Vertical gap={18} style={{ minWidth: 0 }}>
                <TabPanel value="overview">
                  <Vertical gap={18}>
                    <Horizontal columns={12} rowHeight={18} gap={16}>
                      <Card id="compras-kpi-valor" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                          <KPI
                            title="Valor comprado"
                            dataQuery={{ query: \`SELECT COALESCE(SUM(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="currency"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </Card>
                      <Card id="compras-kpi-fornecedores" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                          <KPI
                            title="Fornecedores"
                            dataQuery={{ query: \`SELECT COUNT(DISTINCT c.fornecedor_id)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="number"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </Card>
                      <Card id="compras-kpi-pedidos" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                          <KPI
                            title="Pedidos"
                            dataQuery={{ query: \`SELECT COUNT(DISTINCT c.id)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="number"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </Card>
                      <Card id="compras-kpi-ticket" span={3} rows={4} variant="kpi" style={{ height: '100%' }}>
                          <KPI
                            title="Ticket medio"
                            dataQuery={{ query: \`SELECT COALESCE(AVG(c.valor_total), 0)::float AS value FROM compras.compras c WHERE 1=1 {{filters}}\`, limit: 1 }}
                            format="currency"
                            comparisonMode="previous_period"
                          >
                            <KPICompare />
                          </KPI>
                        </Card>
                    </Horizontal>

                    <Horizontal columns={12} rowHeight={18} gap={18}>
                      <Card id="compras-chart-fornecedor" span={7} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Top spend</Text>
                          <Text as="h2" variant="section-title">Gasto por fornecedor</Text>
                        </div>
                        <Text variant="body-muted">Corte principal para identificar concentracao de compras e dependencia de poucos parceiros no periodo filtrado.</Text>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="bar"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(src.fornecedor_id::text, '0') AS key,
                                  COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label,
                                  COALESCE(SUM(src.valor_total), 0)::float AS value
                                FROM compras.compras src
                                LEFT JOIN entidades.fornecedores f ON f.id = src.fornecedor_id
                                WHERE 1=1
                                  {{filters}}
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
                        </div>
                      </Card>

                      <Card id="compras-chart-categoria" span={5} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Allocation</Text>
                          <Text as="h2" variant="section-title">Gasto por categoria</Text>
                        </div>
                        <Text variant="body-muted">Mostra em qual categoria de despesa o volume de compras esta se acumulando no periodo.</Text>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="pie"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(src.categoria_despesa_id::text, '0') AS key,
                                  COALESCE(cd.nome, 'Sem categoria') AS label,
                                  COALESCE(SUM(src.valor_total), 0)::float AS value
                                FROM compras.compras src
                                LEFT JOIN financeiro.categorias_despesa cd ON cd.id = src.categoria_despesa_id
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
                              { dataKey: 'value', label: 'Gasto' },
                            ]}
                            recharts={{ innerRadius: 54, outerRadius: 92, paddingAngle: 2, showLabels: false }}
                          />
                        </div>
                      </Card>
                    </Horizontal>

                    <Horizontal columns={12} rowHeight={18} gap={18}>
                      <Card id="compras-chart-trend" span={7} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Trend</Text>
                          <Text as="h2" variant="section-title">Gasto por mes</Text>
                        </div>
                        <Text variant="body-muted">Serie mensal para entender aceleracao ou desaceleracao de compras sem depender do motor DSL antigo.</Text>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="line"
                            height="100%"
                            format="currency"
                            dataQuery={{
                              query: \`
                                SELECT
                                  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'YYYY-MM') AS key,
                                  TO_CHAR(DATE_TRUNC('month', src.data_pedido), 'MM/YYYY') AS label,
                                  COALESCE(SUM(src.valor_total), 0)::float AS value
                                FROM compras.compras src
                                WHERE 1=1
                                  {{filters}}
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
                        </div>
                      </Card>

                      <Card id="compras-chart-status" span={5} rows={16} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Status mix</Text>
                          <Text as="h2" variant="section-title">Pedidos por status</Text>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Chart
                            type="bar"
                            height="100%"
                            format="number"
                            dataQuery={{
                              query: \`
                                SELECT
                                  COALESCE(src.status, 'sem_status') AS key,
                                  COALESCE(src.status, 'Sem status') AS label,
                                  COUNT(*)::float AS value
                                FROM compras.compras src
                                WHERE 1=1
                                  {{filters}}
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
                        </div>
                      </Card>
                    </Horizontal>
                  </Vertical>
                </TabPanel>

                <TabPanel value="details">
                  <Vertical gap={18}>
                    <Horizontal columns={12} rowHeight={18} gap={18}>
                      <Card id="compras-table" span={8} rows={18} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Table</Text>
                          <Text as="h2" variant="section-title">Pedidos de compra no detalhe</Text>
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
                                {{filters}}
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

                      <Card id="compras-pivot" span={4} rows={18} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Text variant="eyebrow">Pivot</Text>
                          <Text as="h2" variant="section-title">Categoria por status</Text>
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
                                COALESCE(cd.nome, 'Sem categoria') AS categoria,
                                COALESCE(c.status, 'Sem status') AS status,
                                COALESCE(c.valor_total, 0)::float AS valor_total
                              FROM compras.compras c
                              LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id
                              WHERE 1=1
                                {{filters}}
                            \`,
                            limit: 400,
                          }}
                          rows={[{ field: 'categoria', label: 'Categoria' }]}
                          columns={[{ field: 'status', label: 'Status' }]}
                          values={[{ field: 'valor_total', label: 'Valor', aggregate: 'sum', format: 'currency' }]}
                        />
                      </Card>
                    </Horizontal>
                  </Vertical>
                </TabPanel>

                <TabPanel value="insights">
                  <Vertical gap={18}>
                    <Horizontal columns={12} rowHeight={18} gap={18}>
                      <Card id="compras-insight-concentracao" span={4} rows={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text as="h2" variant="section-title-sm">Concentracao em fornecedores</Text>
                        </div>
                        <Insights
                          textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                          iconStyle={{ color: '#2563EB' }}
                          items={[
                            { text: 'Se poucos fornecedores concentram a maior parte do gasto, a negociacao fica mais sensivel a prazo, ruptura e dependencia comercial.' },
                          ]}
                        />
                      </Card>

                      <Card id="compras-insight-centro" span={4} rows={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text as="h2" variant="section-title-sm">Pressao por centro de custo</Text>
                        </div>
                        <Insights
                          textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                          iconStyle={{ color: '#0F766E' }}
                          items={[
                            { text: 'Centro de custo acima da media precisa ser lido junto com categoria para separar compra pontual de uma tendencia estrutural de gasto.' },
                          ]}
                        />
                      </Card>

                      <Card id="compras-insight-risco" span={4} rows={6} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text as="h2" variant="section-title-sm">Risco operacional</Text>
                        </div>
                        <Insights
                          textStyle={{ ...{ margin: 0, fontSize: 14, lineHeight: 1.75, color: theme.textSecondary }, fontSize: 13, lineHeight: 1.65 }}
                          iconStyle={{ color: '#EA580C' }}
                          items={[
                            { text: 'Status com muito volume em analise ou parcial costuma indicar gargalo entre pedido, recebimento e pagamento.' },
                          ]}
                        />
                      </Card>
                    </Horizontal>
                  </Vertical>
                </TabPanel>

                <Horizontal columns={12} rowHeight={18} gap={18}>
                  <Card id="compras-footer" span={12} rows={3}>
                  <footer style={{ height: '100%', display: 'flex', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 22, backgroundColor: theme.surfaceBg, border: '1px solid ' + theme.surfaceBorder }}>
                    <Text variant="small-muted">Template JSX de compras com sidebar, tabs laterais e queries SQL explicitas.</Text>
                    <Text variant="small-muted">Theme ativo: ${resolvedThemeName}</Text>
                  </footer>
                  </Card>
                </Horizontal>
              </Vertical>
            </Card>
          </Horizontal>
        </Tabs>
    </Dashboard>`
}

export function buildComprasDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildComprasDashboardSource(themeName || ''),
    name: COMPRAS_VARIANT.fileName,
    path: COMPRAS_VARIANT.path,
  }
}
