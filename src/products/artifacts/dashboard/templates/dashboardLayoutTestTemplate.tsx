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
  <Vertical gap={24} style={{ minHeight: '100%', backgroundColor: theme.pageBg, padding: 24 }}>
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
      <Horizontal gap={16} columns={12} rowHeight={120}>
        <Panel id="test-a" span={4} rows={1}>
          <div style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel A</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 1</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Use este bloco para testar largura e altura.</p>
          </div>
        </Panel>

        <Panel id="test-b" span={4} rows={2}>
          <div style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel B</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 2</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>A altura aqui precisa crescer claramente.</p>
          </div>
        </Panel>

        <Panel id="test-c" span={4} rows={3}>
          <div style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel C</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 4 / rows 3</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Este bloco deixa o resize vertical bem evidente.</p>
          </div>
        </Panel>
      </Horizontal>

      <Horizontal gap={16} columns={12} rowHeight={90}>
        <Panel id="test-d" span={7} rows={2}>
          <div style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel D</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 7 / rows 2</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Teste de resize diagonal e reorder.</p>
          </div>
        </Panel>

        <Panel id="test-e" span={5} rows={1}>
          <div style={{ height: '100%', padding: 18, borderRadius: 20, border: '1px solid ' + theme.surfaceBorder, backgroundColor: theme.surfaceBg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: theme.headerSubtitle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Panel E</p>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.titleColor }}>span 5 / rows 1</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Sem conteúdo complexo para mascarar o comportamento do grid.</p>
          </div>
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
