'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function VendasDashboardPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: '#f8f9fa' }}>
        <div style={{ background: 'white', paddingBottom: 16 }}>
          <PageHeader
            title="Dashboard de Vendas"
            subtitle="Visão geral de performance e vendas"
            titleFontFamily="var(--font-crimson-text)"
          />
        </div>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Total Vendas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Vendas</div>
              <div className="text-2xl font-bold text-blue-600">R$ 285.430,00</div>
              <div className="text-xs text-gray-400 mt-1">+18.2% vs mês anterior</div>
            </div>

            {/* Card: Ticket Médio */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Ticket Médio</div>
              <div className="text-2xl font-bold text-green-600">R$ 1.847,00</div>
              <div className="text-xs text-gray-400 mt-1">+3.5% vs mês anterior</div>
            </div>

            {/* Card: Pedidos */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Pedidos</div>
              <div className="text-2xl font-bold text-purple-600">154</div>
              <div className="text-xs text-gray-400 mt-1">128 concluídos, 26 pendentes</div>
            </div>

            {/* Card: Taxa de Conversão */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-orange-600">32.5%</div>
              <div className="text-xs text-gray-400 mt-1">+2.1% vs mês anterior</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico: Vendas por Canal */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Vendas por Canal</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico: Performance da Equipe */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Performance da Equipe</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Clientes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Clientes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Cliente ABC Ltda</div>
                    <div className="text-xs text-gray-500">32 pedidos</div>
                  </div>
                  <div className="font-semibold text-blue-600">R$ 58.400,00</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Empresa XYZ S.A.</div>
                    <div className="text-xs text-gray-500">28 pedidos</div>
                  </div>
                  <div className="font-semibold text-blue-600">R$ 47.200,00</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Distribuidora DEF</div>
                    <div className="text-xs text-gray-500">24 pedidos</div>
                  </div>
                  <div className="font-semibold text-blue-600">R$ 39.800,00</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Comércio GHI</div>
                    <div className="text-xs text-gray-500">19 pedidos</div>
                  </div>
                  <div className="font-semibold text-blue-600">R$ 31.500,00</div>
                </div>
              </div>
            </div>

            {/* Vendas por Território */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Vendas por Território</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">São Paulo</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 125.000,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Rio de Janeiro</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 78.500,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Minas Gerais</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 45.300,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Sul</span>
                  </div>
                  <span className="font-semibold text-sm">R$ 36.630,00</span>
                </div>
              </div>
            </div>

            {/* Pedidos Recentes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Pedidos Recentes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">#PED-1284</div>
                    <div className="text-xs text-gray-500">Cliente ABC - Hoje</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600 text-sm">R$ 5.800,00</div>
                    <div className="text-xs text-green-600 text-right">Concluído</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">#PED-1283</div>
                    <div className="text-xs text-gray-500">Empresa XYZ - Hoje</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600 text-sm">R$ 3.200,00</div>
                    <div className="text-xs text-orange-600 text-right">Pendente</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">#PED-1282</div>
                    <div className="text-xs text-gray-500">Distribuidora DEF - Ontem</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600 text-sm">R$ 7.450,00</div>
                    <div className="text-xs text-green-600 text-right">Concluído</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
