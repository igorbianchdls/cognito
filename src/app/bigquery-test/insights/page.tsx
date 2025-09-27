'use client';

import InsightsCard from '@/components/widgets/InsightsCard';
import AlertasCard from '@/components/widgets/AlertasCard';
import RecomendacoesCard from '@/components/widgets/RecomendacoesCard';

export default function InsightsTestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🔍 Teste de Widgets: Insights, Alertas e Recomendações
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights - Store Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              💡 Insights (Store)
            </h2>
            <InsightsCard useGlobalStore={true} />
          </div>

          {/* Alertas - Store Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              ⚠️ Alertas (Store)
            </h2>
            <AlertasCard useGlobalStore={true} />
          </div>

          {/* Recomendações - Store Mode */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              🎯 Recomendações (Store)
            </h2>
            <RecomendacoesCard useGlobalStore={true} />
          </div>
        </div>
      </div>
    </div>
  );
}