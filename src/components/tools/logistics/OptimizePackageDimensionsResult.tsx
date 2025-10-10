'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, TrendingUp, AlertCircle } from 'lucide-react';

interface OptimizePackageDimensionsResultProps {
  success: boolean;
  message: string;
  transportadora_id?: string;
  total_pacotes?: number;
  package_efficiency?: {
    score_medio: string;
    classificacao: string;
    otimizados: number;
    desperdicando_espaco: number;
  };
  analise_detalhada?: Array<{
    peso_real: string;
    peso_volumetrico: string;
    volume_cm3: number;
    efficiency_score: string;
    status: string;
    sugestao: string;
    cobrado: string;
    diferenca_custo: string;
  }>;
  recomendacoes?: string[];
}

export default function OptimizePackageDimensionsResult({
  success,
  message,
  transportadora_id,
  total_pacotes,
  package_efficiency,
  analise_detalhada,
  recomendacoes
}: OptimizePackageDimensionsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Dimensões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getEfficiencyColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'text-green-600 bg-green-100 border-green-300';
    if (numScore >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Otimizado') return 'bg-green-100 text-green-700';
    if (status === 'Aceitável') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">📦 Otimização de Dimensões de Pacotes</h3>
              <p className="text-sm text-purple-700 mt-1">
                {transportadora_id !== 'TODAS' ? `Transportadora: ${transportadora_id}` : 'Todas as transportadoras'} •
                {total_pacotes} pacotes analisados
              </p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Package Efficiency Score */}
      {package_efficiency && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`border-2 ${getEfficiencyColor(package_efficiency.score_medio)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Efficiency Score Médio</p>
                <p className="text-4xl font-bold mt-2">{package_efficiency.score_medio}</p>
                <p className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getEfficiencyColor(package_efficiency.score_medio)}`}>
                  {package_efficiency.classificacao}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pacotes Otimizados</p>
                <p className="text-4xl font-bold mt-2 text-green-700">{package_efficiency.otimizados}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {total_pacotes ? ((package_efficiency.otimizados / total_pacotes) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Desperdiçando Espaço</p>
                <p className="text-4xl font-bold mt-2 text-red-700">{package_efficiency.desperdicando_espaco}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {total_pacotes ? ((package_efficiency.desperdicando_espaco / total_pacotes) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Análise Detalhada */}
      {analise_detalhada && analise_detalhada.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Análise Detalhada dos Pacotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analise_detalhada.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${getEfficiencyColor(item.efficiency_score)}`}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Peso Real</p>
                      <p className="font-semibold">{item.peso_real} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Peso Volumétrico</p>
                      <p className="font-semibold">{item.peso_volumetrico} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Volume</p>
                      <p className="font-semibold">{item.volume_cm3.toLocaleString()} cm³</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Efficiency</p>
                      <p className="font-semibold">{item.efficiency_score}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-600">
                      Cobrado: <span className="font-semibold">{item.cobrado}</span>
                      {parseFloat(item.diferenca_custo) > 0 && (
                        <span className="ml-2 text-red-600">
                          +R$ {item.diferenca_custo}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 {item.sugestao}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Recomendações
            </CardTitle>
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
    </div>
  );
}
