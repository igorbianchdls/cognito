'use client'

import DashboardLayout from '@/components/modulos/DashboardLayout'

export default function MarketingDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard de Marketing Orgânico"
      subtitle="Visão geral do desempenho nas redes sociais"
    >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Seguidores Totais */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Seguidores Totais</div>
              <div className="text-2xl font-bold text-blue-600">28.547</div>
              <div className="text-xs text-gray-400 mt-1">+1.234 este mês</div>
            </div>

            {/* Card: Engajamento */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Engajamento</div>
              <div className="text-2xl font-bold text-green-600">4.8%</div>
              <div className="text-xs text-gray-400 mt-1">+0.5% vs mês anterior</div>
            </div>

            {/* Card: Publicações do Mês */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Publicações do Mês</div>
              <div className="text-2xl font-bold text-purple-600">42</div>
              <div className="text-xs text-gray-400 mt-1">Média de 1.4 por dia</div>
            </div>

            {/* Card: Taxa de Crescimento */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Crescimento</div>
              <div className="text-2xl font-bold text-orange-600">+5.2%</div>
              <div className="text-xs text-gray-400 mt-1">Últimos 30 dias</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Engajamento por Plataforma</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Crescimento de Seguidores</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Posts */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Posts (Engajamento)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Lançamento de Produto</div>
                    <div className="text-xs text-gray-500">Instagram - 12/11</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">2.5K</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Dica Semanal</div>
                    <div className="text-xs text-gray-500">LinkedIn - 10/11</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">1.8K</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Bastidores da Equipe</div>
                    <div className="text-xs text-gray-500">Facebook - 08/11</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">1.2K</div>
                </div>
              </div>
            </div>

            {/* Plataformas por Desempenho */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Desempenho por Plataforma</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Instagram</span>
                  </div>
                  <span className="font-semibold text-sm">12.5K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">LinkedIn</span>
                  </div>
                  <span className="font-semibold text-sm">8.2K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Facebook</span>
                  </div>
                  <span className="font-semibold text-sm">5.8K</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Twitter/X</span>
                  </div>
                  <span className="font-semibold text-sm">2.0K</span>
                </div>
              </div>
            </div>

            {/* Últimas Publicações */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimas Publicações</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Novidade da Semana</div>
                    <div className="text-xs text-gray-500">Instagram - Hoje</div>
                  </div>
                  <div className="font-semibold text-blue-600 text-sm">450</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Artigo de Blog</div>
                    <div className="text-xs text-gray-500">LinkedIn - Ontem</div>
                  </div>
                  <div className="font-semibold text-blue-600 text-sm">320</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Enquete Mensal</div>
                    <div className="text-xs text-gray-500">Facebook - 2 dias</div>
                  </div>
                  <div className="font-semibold text-blue-600 text-sm">280</div>
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  )
}
