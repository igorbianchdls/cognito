'use client'

import DashboardLayout from '@/components/modulos/DashboardLayout'

export default function WebAnalyticsDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard Web Analytics"
      subtitle="Visão geral do comportamento dos visitantes"
    >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Visitantes Únicos */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Visitantes Únicos (30d)</div>
              <div className="text-2xl font-bold text-blue-600">15.284</div>
              <div className="text-xs text-gray-400 mt-1">+18.5% vs período anterior</div>
            </div>

            {/* Card: Sessões */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Total de Sessões</div>
              <div className="text-2xl font-bold text-green-600">23.847</div>
              <div className="text-xs text-gray-400 mt-1">Média de 795/dia</div>
            </div>

            {/* Card: Taxa de Conversão */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-purple-600">3.2%</div>
              <div className="text-xs text-gray-400 mt-1">+0.4% vs mês anterior</div>
            </div>

            {/* Card: Tempo Médio */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Tempo Médio no Site</div>
              <div className="text-2xl font-bold text-orange-600">3:42</div>
              <div className="text-xs text-gray-400 mt-1">minutos por sessão</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Tráfego ao Longo do Tempo</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Comportamento de Conversão</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Páginas Mais Visitadas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Páginas Mais Visitadas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">/produtos</div>
                    <div className="text-xs text-gray-500">4.2K visualizações</div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">18.5%</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">/home</div>
                    <div className="text-xs text-gray-500">3.8K visualizações</div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">16.2%</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">/sobre</div>
                    <div className="text-xs text-gray-500">2.1K visualizações</div>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">8.9%</div>
                </div>
              </div>
            </div>

            {/* Fontes de Tráfego */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Fontes de Tráfego</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Orgânico</span>
                  </div>
                  <span className="font-semibold text-sm">9.2K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Direto</span>
                  </div>
                  <span className="font-semibold text-sm">6.5K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Social</span>
                  </div>
                  <span className="font-semibold text-sm">4.8K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Referência</span>
                  </div>
                  <span className="font-semibold text-sm">3.3K</span>
                </div>
              </div>
            </div>

            {/* Últimas Conversões */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimas Conversões</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Formulário de Contato</div>
                    <div className="text-xs text-gray-500">2 minutos atrás</div>
                  </div>
                  <div className="text-xs text-green-600">Lead</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Download eBook</div>
                    <div className="text-xs text-gray-500">15 minutos atrás</div>
                  </div>
                  <div className="text-xs text-green-600">Lead</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Compra Finalizada</div>
                    <div className="text-xs text-gray-500">1 hora atrás</div>
                  </div>
                  <div className="text-xs text-green-600">Venda</div>
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  )
}
