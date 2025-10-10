'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';

interface Motivo {
  motivo: string;
  quantidade: number;
  percentual: string;
}

interface ReverseLogisticsTrendsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  return_rate?: {
    taxa: string;
    total_devolucoes: number;
    total_envios: number;
    classificacao: string;
  };
  impacto_financeiro?: {
    custo_total: string;
    custo_medio_por_devolucao: string;
    percentual_receita_frete: string;
  };
  motivos_principais?: Motivo[];
  analise_pareto?: {
    top_3_motivos_percentual: string;
    insight: string;
  };
  recomendacoes?: string[];
}

export default function ReverseLogisticsTrendsResult({
  success,
  message,
  periodo_dias,
  return_rate,
  impacto_financeiro,
  motivos_principais,
  analise_pareto,
  recomendacoes
}: ReverseLogisticsTrendsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Logística Reversa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Ótimo')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Aceitável')) return 'text-blue-600 bg-blue-100 border-blue-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">🔄 Análise de Logística Reversa</h3>
              <p className="text-sm text-orange-700 mt-1">
                Período: {periodo_dias} dias • Análise de devoluções e motivos
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Return Rate */}
      {return_rate && (
        <Card className={`border-2 ${getClassificationColor(return_rate.classificacao)}`}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Taxa de Devolução</p>
                <p className="text-4xl font-bold mt-2">{return_rate.taxa}</p>
                <p className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getClassificationColor(return_rate.classificacao)}`}>
                  {return_rate.classificacao}
                </p>
              </div>
              <div className="text-center border-l border-r border-gray-200">
                <p className="text-sm text-gray-600">Total de Devoluções</p>
                <p className="text-3xl font-bold text-red-700 mt-2">{return_rate.total_devolucoes}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total de Envios</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{return_rate.total_envios}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impacto Financeiro */}
      {impacto_financeiro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impacto Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Custo Total de Devoluções</p>
                <p className="text-2xl font-bold text-red-700 mt-1">R$ {impacto_financeiro.custo_total}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Custo Médio por Devolução</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">R$ {impacto_financeiro.custo_medio_por_devolucao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivos Principais (Pareto) */}
      {motivos_principais && motivos_principais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Motivos de Devolução (Análise de Pareto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {motivos_principais.map((motivo, idx) => {
                const percentage = parseFloat(motivo.percentual);
                return (
                  <div key={idx} className="p-3 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-red-500' :
                          idx === 1 ? 'bg-orange-500' :
                          idx === 2 ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <p className="font-semibold">{motivo.motivo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-700">{motivo.percentual}</p>
                        <p className="text-xs text-gray-500">{motivo.quantidade} devoluções</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          idx === 0 ? 'bg-red-500' :
                          idx === 1 ? 'bg-orange-500' :
                          idx === 2 ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise de Pareto */}
      {analise_pareto && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-purple-900 mb-2">📊 Princípio de Pareto (80/20):</h4>
            <p className="text-sm text-purple-800">
              <strong>Top 3 motivos representam:</strong> {analise_pareto.top_3_motivos_percentual} das devoluções
            </p>
            <p className="text-sm text-purple-800 mt-2">
              <strong>Insight:</strong> {analise_pareto.insight}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">💡 Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recomendacoes.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-700 mb-3">📋 Benchmarks do Mercado:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li><strong>Excelente:</strong> Taxa de devolução &lt; 5%</li>
            <li><strong>Aceitável:</strong> Taxa de devolução 5-10%</li>
            <li><strong>Alto (Requer Atenção):</strong> Taxa de devolução &gt; 10%</li>
            <li><strong>Custo médio:</strong> R$ 20-30 por devolução (inclui logística reversa + processamento)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
