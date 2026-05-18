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
  <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minHeight: '100%', backgroundColor: theme.pageBg, padding: 24 }}>
    <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 18 }}>
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
    </section>

    <div style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
        <article id="kpi-test-a" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 6', minHeight: 128, height: '100%' }}>
            <KPI
              title="KPI Teste A"
              dataQuery={{
                query: \`
                  SELECT 128::float AS value
                \`,
                limit: 1,
              }}
              format="number"
              description="KPI dentro de um container HTML, para validar resize."
            />
          </article>

        <article id="kpi-test-b" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 6', minHeight: 288, height: '100%' }}>
            <KPI
              title="KPI Teste B"
              dataQuery={{
                query: \`
                  SELECT 8420::float AS value
                \`,
                limit: 1,
              }}
              format="currency"
              description="Este bloco usa mais rows para evidenciar resize vertical com KPI."
            />
          </article>
      </section>

      <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
        <article id="test-a" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 128, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Bloco A</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 8</Text>
            <Text variant="body-sm">Use este bloco para testar largura e altura.</Text>
          </article>

        <article id="test-b" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 256, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Bloco B</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 16</Text>
            <Text variant="body-sm">A altura aqui precisa crescer claramente.</Text>
          </article>

        <article id="test-c" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 4', minHeight: 384, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Bloco C</Text>
            <Text as="h2" variant="section-title-strong">span 4 / rows 24</Text>
            <Text variant="body-sm">Este bloco deixa o resize vertical bem evidente.</Text>
          </article>
      </section>

      <section style={{ boxSizing: 'border-box', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
        <article id="test-d" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 7', minHeight: 192, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text variant="eyebrow">Bloco D</Text>
              <Text as="h2" variant="section-title-strong">Chart responsivo</Text>
              <Text variant="body-sm">Este bloco usa um chart simples para validar resize vertical dentro de um container HTML.</Text>
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
          </article>

        <article id="test-e" style={{ boxSizing: 'border-box', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 18, border: '1px solid ' + theme.surfaceBorder, borderRadius: theme.cardFrame ? 0 : 16, backgroundColor: theme.surfaceBg, boxShadow: theme.cardFrame ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)', gridColumn: 'span 5', minHeight: 96, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text variant="eyebrow">Bloco E</Text>
            <Text as="h2" variant="section-title-strong">span 5 / rows 6</Text>
            <Text variant="body-sm">Sem conteúdo complexo para mascarar o comportamento do grid.</Text>
          </article>
      </section>
    </div>
  </div>
</Dashboard>`
}

export function buildLayoutTestDashboardTemplateVariant(themeName?: string) {
  return {
    content: buildLayoutTestDashboardSource(themeName || ''),
    name: LAYOUT_TEST_VARIANT.fileName,
    path: LAYOUT_TEST_VARIANT.path,
  }
}
