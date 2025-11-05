'use client'

import DashboardLayout from '@/components/modulos/DashboardLayout'

export default function TrafegoPagoDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard de Tráfego Pago"
      subtitle="Visão geral das campanhas de anúncios"
    >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Investimento Total */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Investimento Total (Mês)</div>
              <div className="text-2xl font-bold text-blue-600">R$ 45.820,00</div>
              <div className="text-xs text-gray-400 mt-1">+12.3% vs mês anterior</div>
            </div>

            {/* Card: Conversões */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Conversões</div>
              <div className="text-2xl font-bold text-green-600">387</div>
              <div className="text-xs text-gray-400 mt-1">+28 esta semana</div>
            </div>

            {/* Card: CPC Médio */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">CPC Médio</div>
              <div className="text-2xl font-bold text-purple-600">R$ 3,45</div>
              <div className="text-xs text-gray-400 mt-1">-8.2% vs mês anterior</div>
            </div>

            {/* Card: ROAS */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">ROAS</div>
              <div className="text-2xl font-bold text-orange-600">4.2x</div>
              <div className="text-xs text-gray-400 mt-1">Retorno sobre investimento</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Desempenho de Campanhas</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Investimento vs Retorno</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campanhas com Melhor ROI */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Campanhas com Melhor ROI</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Black Friday 2025</div>
                    <div className="text-xs text-gray-500">Google Ads</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">6.8x</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Remarketing Geral</div>
                    <div className="text-xs text-gray-500">Meta Ads</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">5.2x</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Produto Novo</div>
                    <div className="text-xs text-gray-500">LinkedIn Ads</div>
                  </div>
                  <div className="text-xs font-semibold text-green-600">4.5x</div>
                </div>
              </div>
            </div>

            {/* Plataformas por Conversão */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Conversões por Plataforma</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Google Ads</span>
                  </div>
                  <span className="font-semibold text-sm">185</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Meta Ads</span>
                  </div>
                  <span className="font-semibold text-sm">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">LinkedIn Ads</span>
                  </div>
                  <span className="font-semibold text-sm">38</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">TikTok Ads</span>
                  </div>
                  <span className="font-semibold text-sm">22</span>
                </div>
              </div>
            </div>

            {/* Últimos Anúncios Criados */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimos Anúncios Criados</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Anúncio Produto X</div>
                    <div className="text-xs text-gray-500">Google - Hoje</div>
                  </div>
                  <div className="text-xs text-green-600">Ativo</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Carousel Serviços</div>
                    <div className="text-xs text-gray-500">Meta - Ontem</div>
                  </div>
                  <div className="text-xs text-green-600">Ativo</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Vídeo Promocional</div>
                    <div className="text-xs text-gray-500">TikTok - 2 dias</div>
                  </div>
                  <div className="text-xs text-yellow-600">Aprovação</div>
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  )
}
