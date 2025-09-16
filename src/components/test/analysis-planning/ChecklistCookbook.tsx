'use client';

import { mockAnalyses } from './mockData';

export default function ChecklistCookbook() {
  const getIngredientStatus = (status: string) => {
    switch (status) {
      case 'completed': return '✅ (bem passado)';
      case 'running': return '🔥 (no fogo médio)';
      case 'pending': return '⏳ (aguardando)';
      default: return '📦 (preparado)';
    }
  };

  const getCookingIcon = (title: string) => {
    if (title.includes('Receita')) return '📊';
    if (title.includes('Produto')) return '🛍️';
    if (title.includes('Cliente')) return '👥';
    if (title.includes('Retenção')) return '📈';
    if (title.includes('Dashboard')) return '🍽️';
    return '🥘';
  };

  const getEstimatedTime = () => {
    const totalTime = mockAnalyses.reduce((acc, analysis) => {
      if (analysis.duration) {
        const [min, sec] = analysis.duration.split(':').map(Number);
        return acc + min + (sec / 60);
      }
      if (analysis.estimation) {
        const [min, sec] = analysis.estimation.split(':').map(Number);
        return acc + min + (sec / 60);
      }
      return acc + 2; // default 2 minutes
    }, 0);
    return Math.round(totalTime);
  };

  const completedCount = mockAnalyses.filter(a => a.status === 'completed').length;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-orange-900 mb-2">
          👨‍🍳 RECEITA: Análise Completa de Vendas
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm text-orange-700">
          <span className="flex items-center gap-1">
            ⏱️ <span>Tempo total: ~{getEstimatedTime()} minutos</span>
          </span>
          <span className="flex items-center gap-1">
            🍽️ <span>Serve: 1 dashboard</span>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            📦 INGREDIENTES PREPARADOS:
          </h4>
          <div className="space-y-1 ml-4">
            {mockAnalyses.filter(a => a.status === 'completed').map((analysis) => (
              <div key={analysis.id} className="text-sm text-green-700">
                ✅ {getCookingIcon(analysis.title)} {analysis.title} {getIngredientStatus(analysis.status)}
              </div>
            ))}
          </div>
        </div>

        {mockAnalyses.some(a => a.status === 'running') && (
          <div>
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              🔥 PREPARANDO:
            </h4>
            <div className="space-y-2 ml-4">
              {mockAnalyses.filter(a => a.status === 'running').map((analysis) => (
                <div key={analysis.id} className="space-y-1">
                  <div className="text-sm text-orange-700">
                    {getCookingIcon(analysis.title)} {analysis.title} {getIngredientStatus(analysis.status)}
                  </div>
                  <div className="ml-4 space-y-1 text-xs text-orange-600">
                    <div>├─ Tempo restante: ~{analysis.estimation}</div>
                    <div>└─ Mexer ocasionalmente</div>
                  </div>
                  <div className="ml-4 w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${analysis.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mockAnalyses.some(a => a.status === 'pending') && (
          <div>
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              ⏳ AGUARDANDO:
            </h4>
            <div className="space-y-1 ml-4">
              {mockAnalyses.filter(a => a.status === 'pending').map((analysis) => (
                <div key={analysis.id} className="text-sm text-gray-600">
                  {getCookingIcon(analysis.title)} {analysis.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-yellow-800">
          <span>💡</span>
          <span className="font-medium">Dica do chef:</span>
          <span>Execute na ordem para melhor sabor</span>
        </div>
      </div>
    </div>
  );
}