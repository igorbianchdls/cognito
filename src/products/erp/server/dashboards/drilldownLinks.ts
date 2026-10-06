import type {
  DashboardContent,
  DashboardFilters,
  DashboardId,
  DashboardRecordsFilters,
} from '../../shared/dashboardContracts'

const paths: Record<string, { panel: DashboardId; source: DashboardRecordsFilters['source'] }> = {
  '/erp/vendas/pedidos': { panel: 'vendas', source: 'vendas' },
  '/erp/vendas/orcamentos': { panel: 'vendas', source: 'orcamentos' },
  '/erp/compras/pedidos-compra': { panel: 'compras', source: 'compras' },
  '/erp/financeiro/contas-a-pagar': { panel: 'financeiro', source: 'pagar' },
  '/erp/financeiro/contas-a-receber': { panel: 'financeiro', source: 'receber' },
  '/erp/financeiro/contas-financeiras': { panel: 'financeiro', source: 'contas' },
  '/erp/estoque/posicao-estoque': { panel: 'estoque', source: 'estoque' },
  '/erp/estoque/movimentacoes': { panel: 'estoque', source: 'movimentos' },
  '/erp/relatorios/dre-caixa': { panel: 'resultados', source: 'pagamentos' },
  '/erp/vendas/ordens-servico': { panel: 'servicos', source: 'ordens' },
  '/erp/vendas/contratos': { panel: 'servicos', source: 'contratos' },
}
export function attachDrilldownLinks(content: DashboardContent, filters: DashboardFilters) {
  function convert(href: string | undefined, extra: Record<string, string> = {}) {
    if (!href) return undefined
    const url = new URL(href, 'https://erp.local'),
      config = paths[url.pathname]
    if (!config) return undefined
    const p = new URLSearchParams({ source: config.source })
    for (const key of ['from', 'to', 'status'])
      if (url.searchParams.has(key)) p.set(key, url.searchParams.get(key)!)
    if (config.source === 'vendas') p.delete('status')
    if (config.source === 'pagar' || config.source === 'receber')
      p.set('includeForecast', String(filters.includeForecast))
    if (url.searchParams.get('tipo_lancamento') === 'previsao') p.set('status', 'previsao')
    for (const [key, value] of Object.entries(extra)) p.set(key, value)
    return '/erp/dashboards/' + config.panel + '/registros?' + p
  }
  for (const m of content.metrics) {
    const key =
        [
          'repor',
          'reservas',
          'produtos',
          'entradas',
          'saidas',
          'atrasadas',
          'concluidas',
          'abertas',
          'mensal',
          'recebimentos',
          'pagamentos',
        ].find((k) => m.key === k || m.key.endsWith('-' + k)) || m.key,
      extra: Record<string, string> = {}
    if (m.href?.includes('posicao-estoque')) {
      if (key === 'repor') extra.status = 'reposicao'
      if (key === 'reservas') extra.status = 'reservas'
      if (key === 'produtos') extra.status = 'produtos'
    }
    if (m.href?.includes('movimentacoes')) extra.status = key === 'entradas' ? 'entrada' : 'saida'
    if (m.href?.includes('ordens-servico'))
      extra.status =
        key === 'atrasadas' ? 'vencido' : key === 'concluidas' ? 'concluida' : 'abertas'
    if (key === 'mensal' && m.href?.includes('/contratos')) extra.status = 'mensal'
    if (m.href?.includes('dre-caixa') && ['recebimentos', 'pagamentos'].includes(key))
      extra.status = key === 'recebimentos' ? 'receber' : 'pagar'
    m.href = convert(m.href, extra)
  }
  for (const list of content.lists) {
    const extra: Record<string, string> = {}
    if (list.key === 'reposicao') extra.status = 'reposicao'
    if (list.key === 'ordens') extra.status = 'abertas'
    list.href = convert(list.href, extra)
    for (const row of list.rows) {
      const original = row.href,
        scope = { ...extra },
        id = row.id === 'sem-categoria' || row.id === 'sem-centro' ? 'sem' : row.id
      const dimensions: Record<string, string> = {
        clientes: 'cliente',
        vendedores: 'vendedor',
        fornecedores: 'fornecedor',
        categorias: 'categoria',
        centros: 'centro',
        locais: 'local',
      }
      if (dimensions[list.key]) {
        scope.dimension = dimensions[list.key]
        scope.dimensionId = id
      }
      if (list.key === 'produtos') {
        scope.dimension = id.startsWith('s-') ? 'servico' : 'produto'
        scope.dimensionId = id.replace(/^s-/, '')
      }
      if (list.key === 'reposicao') {
        scope.dimension = 'produto'
        scope.dimensionId = id
      }
      if (
        [
          'valor',
          'pedidos',
          'pendencias',
          'proximos-vencimentos',
          'ordens',
          'contratos',
          'contas',
        ].includes(list.key) &&
        !original?.includes('dre-caixa')
      )
        scope.id = id
      if (original?.includes('dre-caixa') && list.key === 'categorias')
        scope.status = row.detail.startsWith('Recebimentos') ? 'receber' : 'pagar'
      row.href = convert(original, scope)
    }
  }
  return content
}
