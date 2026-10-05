'use client'
import type { DashboardId } from '@/products/erp/shared/dashboardContracts'
import { VisaoGeralDashboard } from './visao-geral/VisaoGeralDashboard'
import { FinanceiroDashboard } from './financeiro/FinanceiroDashboard'
import { VendasDashboard } from './vendas/VendasDashboard'
import { ComprasDashboard } from './compras/ComprasDashboard'
import { EstoqueDashboard } from './estoque/EstoqueDashboard'
import { ResultadosDashboard } from './resultados/ResultadosDashboard'
import { ServicosDashboard } from './servicos/ServicosDashboard'
const pages = {
  'visao-geral': VisaoGeralDashboard,
  financeiro: FinanceiroDashboard,
  vendas: VendasDashboard,
  compras: ComprasDashboard,
  estoque: EstoqueDashboard,
  resultados: ResultadosDashboard,
  servicos: ServicosDashboard,
}
export function DashboardRouter({ id }: { id: DashboardId }) {
  const Page = pages[id]
  return <Page />
}
