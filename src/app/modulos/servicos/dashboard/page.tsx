'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'

export default function ServicosDashboardPage() {
  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: '#f8f9fa' }}>
        <div style={{ background: 'white', paddingBottom: 16 }}>
          <PageHeader
            title="Dashboard de Serviços"
            subtitle="Visão geral das ordens de serviço"
            titleFontFamily="var(--font-crimson-text)"
          />
        </div>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Ordens Abertas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Ordens Abertas</div>
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-xs text-gray-400 mt-1">+8 novas esta semana</div>
            </div>

            {/* Card: Técnicos Ativos */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Técnicos Ativos</div>
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-gray-400 mt-1">De 15 disponíveis</div>
            </div>

            {/* Card: Receita do Mês */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Receita do Mês</div>
              <div className="text-2xl font-bold text-purple-600">R$ 89.450,00</div>
              <div className="text-xs text-gray-400 mt-1">+18.2% vs mês anterior</div>
            </div>

            {/* Card: Tempo Médio de Conclusão */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Tempo Médio</div>
              <div className="text-2xl font-bold text-orange-600">4.2 dias</div>
              <div className="text-xs text-gray-400 mt-1">Conclusão de ordens</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Ordens por Status</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Receita de Serviços (Mensal)</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ordens Urgentes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Ordens Urgentes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">OS #1245 - Manutenção</div>
                    <div className="text-xs text-gray-500">Cliente Premium Ltda</div>
                  </div>
                  <div className="text-xs font-semibold text-red-600">Crítico</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">OS #1238 - Reparo</div>
                    <div className="text-xs text-gray-500">Indústria ABC</div>
                  </div>
                  <div className="text-xs font-semibold text-orange-600">Alto</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">OS #1232 - Instalação</div>
                    <div className="text-xs text-gray-500">Empresa XYZ</div>
                  </div>
                  <div className="text-xs font-semibold text-orange-600">Alto</div>
                </div>
              </div>
            </div>

            {/* Top Técnicos */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Técnicos (Mês)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">João Silva</span>
                  </div>
                  <span className="font-semibold text-sm">23 OS</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Maria Santos</span>
                  </div>
                  <span className="font-semibold text-sm">19 OS</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Pedro Costa</span>
                  </div>
                  <span className="font-semibold text-sm">17 OS</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Ana Oliveira</span>
                  </div>
                  <span className="font-semibold text-sm">15 OS</span>
                </div>
              </div>
            </div>

            {/* Últimas Ordens Concluídas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimas Ordens Concluídas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">OS #1240 - Instalação</div>
                    <div className="text-xs text-gray-500">Tech Solutions</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 3.500,00</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">OS #1235 - Manutenção</div>
                    <div className="text-xs text-gray-500">Comércio DEF</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 1.200,00</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">OS #1229 - Reparo</div>
                    <div className="text-xs text-gray-500">Indústria GHI</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 2.800,00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
