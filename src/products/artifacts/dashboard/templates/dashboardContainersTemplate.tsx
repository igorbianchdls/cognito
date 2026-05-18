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
        <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minHeight: '100%', backgroundColor: theme.pageBg }}>
          <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 18 }}>
              <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, borderTop: 'none', backgroundColor: theme.headerBg, color: theme.headerText }}>
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
                  <Text variant="eyebrow">
                    Layout semantico em containers
                  </Text>
                  <Text as="h1" variant="page-title-sm">
                    Dashboard com containers HTML e CSS
                  </Text>
                  <Text variant="lead">
                    Exemplo de autoria com tags semanticas e CSS inline, mantendo KPI, Chart e filtros como componentes funcionais.
                  </Text>
                </div>

                <div style={{ width: 340 }}>
                  <DatePicker
                    table="vendas.pedidos"
                    field="data_pedido"
                    presets={['7d', '30d', 'month']}
                    labelStyle={{ margin: 0, fontSize: 11, color: theme.headerDatePickerLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    fieldStyle={{ minHeight: 38, padding: '0 10px', border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 14, fontWeight: 500 }}
                    iconStyle={{ color: theme.headerDatePickerIcon, fontSize: 14 }}
                    presetButtonStyle={{ height: 36, border: '1px solid ' + theme.headerDatePickerBorder, borderRadius: 10, backgroundColor: theme.headerDatePickerBg, color: theme.headerDatePickerColor, fontSize: 13, fontWeight: 500 }}
                    activePresetButtonStyle={{ backgroundColor: theme.headerDatePickerActiveBg, borderColor: theme.headerDatePickerActiveBorder, color: theme.headerDatePickerActiveText, fontWeight: 600 }}
                  />
                </div>
              </header>
          </section>

          <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24, padding: '0 28px 28px' }}>
            <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
              <article id="kpi-receita" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 170, height: '100%' }}>
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
                  >
                    <KPICompare />
                  </KPI>
                </article>

              <article id="kpi-pedidos" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 170, height: '100%' }}>
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
                  >
                    <KPICompare />
                  </KPI>
                </article>

              <article id="kpi-ticket" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 170, height: '100%' }}>
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
                  >
                    <KPICompare />
                  </KPI>
                </article>
            </section>

            <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 18, alignItems: 'stretch' }}>
              <article id="chart-receita-canal" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 8', minHeight: 420, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Text as="h2" variant="section-title-sm">Receita por canal</Text>
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
                </article>

              <article id="filters-side" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 420 }}>
                <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
                  <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Text as="h2" variant="section-title-sm">Canal</Text>
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
                  </article>

                  <article style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Text variant="eyebrow">Leitura esperada</Text>
                    <Text variant="lead">
                      Este exemplo usa containers HTML para organizar cabecalho, KPIs e linha analitica sem depender dos componentes de layout antigos.
                    </Text>
                  </article>
                </div>
              </article>
            </section>
          </div>
        </div>
</Dashboard>`
}

export function buildContainersDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildContainersDashboardSource(themeName || ''),
    name: CONTAINERS_VARIANT.fileName,
    path: CONTAINERS_VARIANT.path,
  }
}
