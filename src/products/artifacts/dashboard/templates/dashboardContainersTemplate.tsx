'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const CONTAINERS_VARIANT = {
  fileName: 'dashboard-containers.tsx',
  name: 'dashboard_containers',
  path: 'app/dashboard-containers.tsx',
  title: 'Dashboard Containers',
}

function buildContainersDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('containers')
  return `<Dashboard id="overview" title="${CONTAINERS_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="teal">
        <Vertical gap={24} style={{ minHeight: '100%', backgroundColor: theme.pageBg }}>
          <Horizontal columns={12} rowHeight={18} gap={18}>
            <Panel id="containers-header" span={12} rows={8}>
              <header style={{ height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <Vertical gap={8} style={{ maxWidth: 720 }}>
                  <Text style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Layout semantico em containers
                  </Text>
                  <Text as="h1" style={{ margin: 0, fontSize: 40, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em', color: theme.titleColor }}>
                    Dashboard com Vertical, Horizontal e Panel
                  </Text>
                  <Text style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: theme.textSecondary }}>
                    Exemplo de autoria mais proxima de containers de BI, mantendo KPI, Chart e Cards normais.
                  </Text>
                </Vertical>

                <Panel id="global-period" width={340}>
                  <DatePicker
                    label="Periodo do pedido"
                    table="vendas.pedidos"
                    field="data_pedido"
                    presets={['7d', '30d', 'month']}
                    labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                    iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                    presetButtonStyle={{ height: 36, border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                    activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                  />
                </Panel>
              </header>
            </Panel>
          </Horizontal>

          <Vertical gap={24} padding="0 28px 28px">
            <Horizontal gap={16} columns={12} rowHeight={170}>
              <Panel id="kpi-receita" span={4} rows={1}>
                <KPI
                  title="Receita"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(SUM(src.valor_total), 0)::float AS value
                      FROM vendas.pedidos src
                      WHERE src.tenant_id = {{tenant_id}}::int
                        {{filters:src}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                />
              </Panel>

              <Panel id="kpi-pedidos" span={4} rows={1}>
                <KPI
                  title="Pedidos"
                  dataQuery={{
                    query: \`
                      SELECT COUNT(*)::float AS value
                      FROM vendas.pedidos src
                      WHERE src.tenant_id = {{tenant_id}}::int
                        {{filters:src}}
                    \`,
                    limit: 1,
                  }}
                  format="number"
                  comparisonMode="previous_period"
                />
              </Panel>

              <Panel id="kpi-ticket" span={4} rows={1}>
                <KPI
                  title="Ticket medio"
                  dataQuery={{
                    query: \`
                      SELECT COALESCE(AVG(src.valor_total), 0)::float AS value
                      FROM vendas.pedidos src
                      WHERE src.tenant_id = {{tenant_id}}::int
                        {{filters:src}}
                    \`,
                    limit: 1,
                  }}
                  format="currency"
                  comparisonMode="previous_period"
                />
              </Panel>
            </Horizontal>

            <Horizontal gap={18} align="stretch" columns={12} rowHeight={420}>
              <Panel id="chart-receita-canal" span={8} rows={1}>
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Text as="h2" style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.titleColor }}>Receita por canal</Text>
                  <Chart
                    type="bar"
                    height={320}
                    format="currency"
                    dataQuery={{
                      query: \`
                        SELECT
                          COALESCE(cv.nome, '-') AS canal,
                          COALESCE(SUM(src.valor_total), 0)::float AS valor
                        FROM vendas.pedidos src
                        LEFT JOIN vendas.canais_venda cv ON cv.id = src.canal_venda_id
                        WHERE src.tenant_id = {{tenant_id}}::int
                          {{filters:src}}
                        GROUP BY 1
                        ORDER BY 2 DESC
                      \`,
                      limit: 8,
                    }}
                    xAxis={{ dataKey: 'canal' }}
                    series={[{ dataKey: 'valor', label: 'Receita' }]}
                  />
                </Card>
              </Panel>

              <Panel id="filters-side" span={4} rows={1}>
                <Vertical gap={18} style={{ height: '100%' }}>
                  <Card style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Text as="h2" style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.titleColor }}>Canal</Text>
                    <Filter
                      label="Canal"
                      table="vendas.pedidos"
                      field="canal_venda_id"
                      mode="multiple"
                      search
                      clearable
                      width="100%"
                      query={\`
                        SELECT
                          cv.id::text AS value,
                          COALESCE(cv.nome, '-') AS label
                        FROM vendas.canais_venda cv
                        WHERE cv.tenant_id = {{tenant_id}}::int
                        ORDER BY 2 ASC
                      \`}
                    >
                      <Select />
                    </Filter>
                  </Card>

                  <Card style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Text style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leitura esperada</Text>
                    <Text style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: theme.textSecondary }}>
                      Este exemplo usa containers semanticos para organizar cabecalho, KPIs e linha analitica sem depender de HTML livre em toda parte.
                    </Text>
                  </Card>
                </Vertical>
              </Panel>
            </Horizontal>
          </Vertical>
        </Vertical>
</Dashboard>`
}

export function buildContainersDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildContainersDashboardSource(themeName || ''),
    name: CONTAINERS_VARIANT.fileName,
    path: CONTAINERS_VARIANT.path,
  }
}
