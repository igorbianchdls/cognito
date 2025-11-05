'use client'

import DashboardLayout from '@/components/modulos/DashboardLayout'

export default function CRMDashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard CRM"
      subtitle="Visão geral do relacionamento com clientes"
    >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card: Oportunidades Abertas */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Oportunidades Abertas</div>
              <div className="text-2xl font-bold text-blue-600">34</div>
              <div className="text-xs text-gray-400 mt-1">+5 novas esta semana</div>
            </div>

            {/* Card: Taxa de Conversão */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-green-600">28.5%</div>
              <div className="text-xs text-gray-400 mt-1">+3.2% vs mês anterior</div>
            </div>

            {/* Card: Valor do Pipeline */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Valor do Pipeline</div>
              <div className="text-2xl font-bold text-purple-600">R$ 542.300,00</div>
              <div className="text-xs text-gray-400 mt-1">Oportunidades em aberto</div>
            </div>

            {/* Card: Leads Novos */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-2">Leads Novos (30 dias)</div>
              <div className="text-2xl font-bold text-orange-600">127</div>
              <div className="text-xs text-gray-400 mt-1">+22% vs período anterior</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico Placeholder 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Funil de Vendas</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>

            {/* Gráfico Placeholder 2 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Conversões por Mês</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-400">Gráfico será implementado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oportunidades Quentes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Oportunidades Quentes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Tech Corp Ltda</div>
                    <div className="text-xs text-gray-500">Proposta enviada</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 85.000</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Comércio Global</div>
                    <div className="text-xs text-gray-500">Negociação</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 62.500</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Indústria XYZ</div>
                    <div className="text-xs text-gray-500">Apresentação agendada</div>
                  </div>
                  <div className="font-semibold text-green-600 text-sm">R$ 120.000</div>
                </div>
              </div>
            </div>

            {/* Top Fontes de Leads */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top Fontes de Leads</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Website</span>
                  </div>
                  <span className="font-semibold text-sm">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Indicação</span>
                  </div>
                  <span className="font-semibold text-sm">32</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">LinkedIn</span>
                  </div>
                  <span className="font-semibold text-sm">28</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">Email Marketing</span>
                  </div>
                  <span className="font-semibold text-sm">22</span>
                </div>
              </div>
            </div>

            {/* Últimas Atividades */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Últimas Atividades</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Reunião realizada</div>
                    <div className="text-xs text-gray-500">Tech Solutions Inc</div>
                  </div>
                  <div className="text-xs text-gray-400">2h atrás</div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div>
                    <div className="font-medium text-sm">Email enviado</div>
                    <div className="text-xs text-gray-500">Empresa ABC</div>
                  </div>
                  <div className="text-xs text-gray-400">4h atrás</div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <div className="font-medium text-sm">Ligação realizada</div>
                    <div className="text-xs text-gray-500">Comércio DEF</div>
                  </div>
                  <div className="text-xs text-gray-400">6h atrás</div>
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  )
}
