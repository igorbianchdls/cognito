'use client'
export type DashboardTemplateVariant = { content: string; name: string; path: string }
export function buildDashboardTemplateVariants(themeName: string): DashboardTemplateVariant[] {
  const theme = /^[a-z0-9_-]+$/i.test(themeName || '') ? themeName : 'light'
  return [{ name: 'dashboard.tsx', path: 'app/dashboard.tsx', content: `<Dashboard id="dashboard" title="Dashboard" theme="${theme}">
  <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
    <header><h1>Dashboard</h1><p>Adicione os dados que deseja apresentar. Este modelo não consulta fontes externas.</p></header>
    <section><KPI id="indicador" title="Indicador" value={null} format="number" /></section>
    <section><Chart id="grafico" type="bar" data={[]} height={280} xAxis={{ dataKey: 'label' }} series={[{ dataKey: 'value', label: 'Valor' }]} /></section>
    <section><Table id="tabela" data={[]} columns={[{ accessorKey: 'label', header: 'Descrição' }, { accessorKey: 'value', header: 'Valor' }]} /></section>
  </main>
</Dashboard>` }]
}
