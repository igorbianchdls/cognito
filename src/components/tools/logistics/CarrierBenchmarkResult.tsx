'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Award, TrendingDown, TrendingUp } from 'lucide-react';

interface Transportadora {
  nome: string;
  total_envios: number;
  on_time_rate: string;
  custo_medio: string;
  cost_per_kg: string;
  performance_score: string;
  classificacao: string;
  recomendacao: string;
}

interface CarrierBenchmarkResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  metric?: string;
  total_transportadoras?: number;
  melhor_transportadora?: string;
  pior_transportadora?: string;
  transportadoras?: Transportadora[];
}

export default function CarrierBenchmarkResult({
  success,
  message,
  periodo_dias,
  metric,
  total_transportadoras,
  melhor_transportadora,
  pior_transportadora,
  transportadoras
}: CarrierBenchmarkResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro no Benchmark de Transportadoras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const metricLabels: Record<string, string> = {
    performance: 'Performance',
    cost: 'Custo',
    balanced: 'Balanceado'
  };

  const getClassificationColor = (classificacao: string) => {
    if (classificacao === 'Excelente') return 'bg-green-100 text-green-800 border-green-300';
    if (classificacao === 'Boa') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (classificacao === 'Regular') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">🏆 Benchmark de Transportadoras</h3>
              <p className="text-sm text-purple-700 mt-1">
                Critério: {metricLabels[metric || 'balanced']} • Período: {periodo_dias} dias • {total_transportadoras} transportadoras
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Melhores e Piores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Melhor Transportadora</p>
                <p className="text-2xl font-bold text-green-700">{melhor_transportadora}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Pior Transportadora</p>
                <p className="text-2xl font-bold text-red-700">{pior_transportadora}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Transportadoras */}
      {transportadoras && transportadoras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transportadoras.map((trans, idx) => {
                const isTop = trans.nome === melhor_transportadora;
                const isBottom = trans.nome === pior_transportadora;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      isTop ? 'border-green-300 bg-green-50' :
                      isBottom ? 'border-red-300 bg-red-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-yellow-500' :
                          idx === 1 ? 'bg-gray-400' :
                          idx === 2 ? 'bg-orange-600' :
                          'bg-gray-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{trans.nome}</p>
                          <p className="text-xs text-gray-500">{trans.total_envios} envios</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getClassificationColor(trans.classificacao)}`}>
                        {trans.classificacao}
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Performance Score</p>
                        <p className="text-lg font-bold text-purple-700">{trans.performance_score}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">On-Time Rate</p>
                        <p className="text-lg font-bold">{trans.on_time_rate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Custo Médio</p>
                        <p className="text-lg font-bold">R$ {trans.custo_medio}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost/kg</p>
                        <p className="text-lg font-bold">R$ {trans.cost_per_kg}</p>
                      </div>
                    </div>

                    {/* Barra de progresso do performance score */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(trans.performance_score) >= 90 ? 'bg-green-600' :
                          parseFloat(trans.performance_score) >= 80 ? 'bg-blue-600' :
                          parseFloat(trans.performance_score) >= 70 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(parseFloat(trans.performance_score), 100)}%` }}
                      />
                    </div>

                    {/* Recomendação */}
                    <div className={`pt-3 border-t ${
                      isTop ? 'border-green-200' :
                      isBottom ? 'border-red-200' :
                      'border-gray-200'
                    }`}>
                      <p className="text-xs font-medium text-gray-700">
                        💡 <span className="font-normal">{trans.recomendacao}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3">📋 Sobre o Performance Score:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li><strong>Fórmula:</strong> (On-Time Rate × 50%) + (First Attempt × 30%) + (Quality × 20%)</li>
            <li><strong>Excelente:</strong> Score ≥ 90 - Transportadora de alto nível</li>
            <li><strong>Boa:</strong> Score 80-89 - Performance adequada</li>
            <li><strong>Regular:</strong> Score 70-79 - Requer melhorias</li>
            <li><strong>Ruim:</strong> Score &lt; 70 - Considerar substituição</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
