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
  <Vertical gap={24} style={{ width: '1600px', minHeight: '100%', backgroundColor: theme.pageBg, padding: 24 }}>
    <Horizontal gap={18}>
        <header style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 24, borderRadius: 24, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.headerBg }}>
          <Text variant="eyebrow">
            Teste puro de layout
          </Text>
          <Text as="h1" variant="page-title-sm">
            Resize horizontal e vertical
          </Text>
          <Text variant="lead">
            Exemplo minimo com KPI e Chart, sem Query, para provar o comportamento do grid.
          </Text>
        </header>
    </Horizontal>

    <Vertical gap={20}>
      <Horizontal gap={16} columns={12} rowHeight={32}>
        <Card id="kpi-test-a" span={6} rows={4} variant="kpi" style={{ height: '100%' }}>
            <KPI
              title="KPI Teste A"
              dataQuery={{
                query: \`
                  SELECT 128::float AS value
                \`,
                limit: 1,
              }}
              format="number"
              description="KPI dentro de Card, para validar resize."
            />
          </Card>

        <Card id="kpi-test-b" span={6} rows={9} variant="kpi" style={{ height: '100%' }}>
            <KPI
              title="KPI Teste B"
              dataQuery={{
                query: \`
                  SELECT 8420::float AS value
                \`,
                limit: 1,
              }}
              format="currency"
              description="Este bloco tem duas rows para evidenciar resize vertical com KPI."
            />
          </Card>
      </Horizontal>

      <Horizontal gap={16} columns={12} rowHeight={32}>
        <Card id="test-a" span={4} rows={4} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Card A</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 4</Text>
            <Text variant="body-sm">Use este bloco para testar largura e altura.</Text>
          </Card>

        <Card id="test-b" span={4} rows={8} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Card B</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 8</Text>
            <Text variant="body-sm">A altura aqui precisa crescer claramente.</Text>
          </Card>

        <Card id="test-c" span={4} rows={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Card C</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 12</Text>
            <Text variant="body-sm">Este bloco deixa o resize vertical bem evidente.</Text>
          </Card>
      </Horizontal>

      <Horizontal gap={16} columns={12} rowHeight={32}>
        <Card id="test-d" span={7} rows={6} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text variant="eyebrow">Card D</Text>
              <Text as="h2" variant="section-title-strong">Chart responsivo</Text>
              <Text variant="body-sm">Este bloco usa um chart simples para validar resize vertical dentro de Card.</Text>
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

        <Card id="test-e" span={5} rows={3} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Card E</Text>
            <Text as="h2" variant="section-title-strong">span 5 / rows 3</Text>
            <Text variant="body-sm">Sem conteúdo complexo para mascarar o comportamento do grid.</Text>
          </Card>
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
