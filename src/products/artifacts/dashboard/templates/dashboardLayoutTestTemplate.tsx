'use client'

import {
  getDashboardTemplateThemeName,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateSupport'

const LAYOUT_TEST_VARIANT = {
  fileName: 'dashboard-layout-test.tsx',
  name: 'dashboard_layout_test',
  path: 'app/dashboard-layout-test.tsx',
  title: 'Dashboard Layout Test',
}

function buildLayoutTestDashboardSource(themeName: string) {
  const resolvedThemeName = themeName || getDashboardTemplateThemeName('layouttest')
  return `<Dashboard id="layout-test" title="${LAYOUT_TEST_VARIANT.title}" theme="${resolvedThemeName}" chartPalette="teal">
  <Vertical gap={24} style={{ width: '1200px', minHeight: '100%', backgroundColor: theme.pageBg, padding: 24 }}>
    <header style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.headerBg }}>
      <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Teste puro de layout
      </p>
      <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em', color: theme.titleColor }}>
        Resize horizontal e vertical
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: theme.textSecondary }}>
        Sem Query, Chart, KPI ou Card. Apenas Vertical, Horizontal e Panel para provar o comportamento do grid.
      </p>
    </header>

    <Vertical gap={20}>
      <Horizontal gap={16} columns={12} rowHeight={140}>
        <Panel id="kpi-test-a" span={6} rows={1}>
          <Query
            dataQuery={{
              query: \`
                SELECT 128::float AS value
              \`,
              limit: 1,
            }}
            format="number"
          >
            <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI Teste A</p>
              <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Query + Card dentro de Panel, para validar resize.</p>
            </Card>
          </Query>
        </Panel>

        <Panel id="kpi-test-b" span={6} rows={2}>
          <Query
            dataQuery={{
              query: \`
                SELECT 8420::float AS value
              \`,
              limit: 1,
            }}
            format="currency"
          >
            <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI Teste B</p>
              <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: theme.kpiValueColor }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Este bloco tem duas rows para evidenciar resize vertical com KPI.</p>
            </Card>
          </Query>
        </Panel>
      </Horizontal>

      <Horizontal gap={16} columns={12} rowHeight={120}>
        <Panel id="test-a" span={4} rows={1}>
          <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel A</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 1</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Use este bloco para testar largura e altura.</p>
          </Card>
        </Panel>

        <Panel id="test-b" span={4} rows={2}>
          <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel B</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 2</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>A altura aqui precisa crescer claramente.</p>
          </Card>
        </Panel>

        <Panel id="test-c" span={4} rows={3}>
          <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel C</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 3</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Este bloco deixa o resize vertical bem evidente.</p>
          </Card>
        </Panel>
      </Horizontal>

      <Horizontal gap={16} columns={12} rowHeight={90}>
        <Panel id="test-d" span={7} rows={2}>
          <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel D</p>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>Chart responsivo</h2>
              <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Este painel usa um chart simples para validar resize vertical dentro de Card.</p>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Chart
                type="line"
                height="100%"
                format="number"
                margin={{ top: 10, right: 12, bottom: 12, left: 4 }}
                dataQuery={{
                  query: \`
                    SELECT *
                    FROM (
                      VALUES
                        ('Seg', 12::float),
                        ('Ter', 18::float),
                        ('Qua', 9::float),
                        ('Qui', 22::float),
                        ('Sex', 16::float)
                    ) AS sample(label, value)
                  \`,
                  limit: 5,
                }}
                xAxis={{ dataKey: 'label' }}
                series={[{ dataKey: 'value', label: 'Teste' }]}
              />
            </div>
          </Card>
        </Panel>

        <Panel id="test-e" span={5} rows={1}>
          <Card style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel E</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 5 / rows 1</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Sem conteúdo complexo para mascarar o comportamento do grid.</p>
          </Card>
        </Panel>
      </Horizontal>
    </Vertical>
  </Vertical>
</Dashboard>`
}

export function buildLayoutTestDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildLayoutTestDashboardSource(themeName || ''),
    name: LAYOUT_TEST_VARIANT.fileName,
    path: LAYOUT_TEST_VARIANT.path,
  }
}
