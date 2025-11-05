'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function FinanceiroDashboardPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: '#f8f9fa' }}>
        <div style={{ background: 'white', paddingBottom: 16 }}>
          <PageHeader
            title="Dashboard Financeiro"
            subtitle="Visão geral das finanças"
            titleFontFamily="var(--font-crimson-text)"
          />
        </div>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Receitas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Receitas do Mês</div>
              <div className="text-2xl font-bold text-green-600">R$ 125.430,00</div>
              <div className="text-xs text-gray-400 mt-1">+12.5% vs mês anterior</div>
            </div>

            {/* Card: Despesas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Despesas do Mês</div>
              <div className="text-2xl font-bold text-red-600">R$ 87.250,00</div>
              <div className="text-xs text-gray-400 mt-1">+5.3% vs mês anterior</div>
            </div>

            {/* Card: Saldo */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Saldo Atual</div>
              <div className="text-2xl font-bold text-blue-600">R$ 38.180,00</div>
              <div className="text-xs text-gray-400 mt-1">Em todas as contas</div>
            </div>

            {/* Card: A Receber */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">A Receber (30 dias)</div>
              <div className="text-2xl font-bold text-orange-600">R$ 45.920,00</div>
              <div className="text-xs text-gray-400 mt-1">15 contas em aberto</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contas a Vencer */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Contas a Vencer (7 dias)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Fornecedor A</div>
                    <div className="text-xs text-gray-500">Vence em 3 dias</div>
                  </div>
                  <div className="font-semibold text-red-600">R$ 2.500,00</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Fornecedor B</div>
                    <div className="text-xs text-gray-500">Vence em 5 dias</div>
                  </div>
                  <div className="font-semibold text-red-600">R$ 1.800,00</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Fornecedor C</div>
                    <div className="text-xs text-gray-500">Vence em 6 dias</div>
                  </div>
                  <div className="font-semibold text-red-600">R$ 3.200,00</div>
                </div>
              </div>
            </div>

            {/* Top Categorias */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Categorias (Despesas)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Folha de Pagamento</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 45.000,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Fornecedores</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 22.500,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Impostos</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 12.800,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Operacional</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 6.950,00</span>
                </div>
              </div>
            </div>

            {/* Últimas Transações */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimas Transações</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Pagamento recebido</div>
                    <div className="text-xs text-gray-500">Cliente XYZ</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">+R$ 5.000,00</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Pagamento efetuado</div>
                    <div className="text-xs text-gray-500">Fornecedor ABC</div>
                  </div>
                  <div className="font-semibold text-red-600 text-sm">-R$ 2.300,00</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Pagamento recebido</div>
                    <div className="text-xs text-gray-500">Cliente DEF</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">+R$ 8.500,00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
