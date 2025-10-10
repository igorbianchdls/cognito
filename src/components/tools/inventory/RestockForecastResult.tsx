'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';

interface Previsao {
  product_id: string;
  channel_id: string;
  estoque_atual: number;
  consumo_diario_medio: string;
  dias_ate_ruptura: string;
  necessita_reposicao: boolean;
  quantidade_sugerida: number;
  urgencia: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
  data_ruptura_estimada: string;
}

interface RestockForecastResultProps {
  success: boolean;
  message: string;
  forecast_days?: number;
  confidence_level?: string;
  produtos_com_necessidade_reposicao?: number;
  criticos?: number;
  previsoes?: Previsao[];
}

export default function RestockForecastResult({
  success,
  message,
  forecast_days,
  confidence_level,
  produtos_com_necessidade_reposicao,
  criticos,
  previsoes
}: RestockForecastResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Previsão de Reposição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'CRÍTICO': return 'bg-red-100 text-red-700 border-red-300';
      case 'ALTO': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MÉDIO': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    if (urgencia === 'CRÍTICO') return '🚨';
    if (urgencia === 'ALTO') return '⚠️';
    if (urgencia === 'MÉDIO') return '⏰';
    return '✅';
  };

  const previsoesAgrupadas = previsoes?.reduce((acc, prev) => {
    if (!acc[prev.urgencia]) acc[prev.urgencia] = [];
    acc[prev.urgencia].push(prev);
    return acc;
  }, {} as Record<string, Previsao[]>);

  const ordemUrgencia = ['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">📦 Previsão de Necessidades de Reposição</h3>
              <p className="text-sm text-orange-700 mt-1">
                Previsão para {forecast_days} dias • Nível de confiança: {confidence_level}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total com Necessidade</p>
            <p className="text-3xl font-bold text-orange-700">{produtos_com_necessidade_reposicao || 0}</p>
            <p className="text-xs text-gray-500 mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Críticos</p>
            <p className="text-3xl font-bold text-red-700">{criticos || 0}</p>
            <p className="text-xs text-gray-500 mt-1">reposição urgente!</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Horizonte</p>
            <p className="text-3xl font-bold text-blue-700">{forecast_days}</p>
            <p className="text-xs text-gray-500 mt-1">dias de previsão</p>
          </CardContent>
        </Card>
      </div>

      {/* Previsões por Urgência */}
      {previsoes && previsoes.length > 0 ? (
        <div className="space-y-4">
          {ordemUrgencia.map((urgencia) => {
            const items = previsõesAgrupadas?.[urgencia] || [];
            if (items.length === 0) return null;

            return (
              <Card key={urgencia} className={`border-2 ${getUrgenciaColor(urgencia)}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{getUrgenciaIcon(urgencia)}</span>
                    {urgencia} ({items.length} {items.length === 1 ? 'produto' : 'produtos'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.slice(0, 10).map((prev, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Produto</p>
                            <p className="font-semibold text-sm truncate">{prev.product_id}</p>
                            <p className="text-xs text-gray-500">{prev.channel_id}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Estoque Atual</p>
                            <p className="font-semibold text-sm">{prev.estoque_atual.toLocaleString()} un</p>
                            <p className="text-xs text-gray-500">Consumo: {prev.consumo_diario_medio}/dia</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Ruptura em</p>
                            <p className="font-semibold text-sm text-red-600">{prev.dias_ate_ruptura} dias</p>
                            <p className="text-xs text-gray-500">{prev.data_ruptura_estimada}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Repor</p>
                            <p className="font-semibold text-sm text-green-600">{prev.quantidade_sugerida.toLocaleString()} un</p>
                            <p className="text-xs text-gray-500">quantidade sugerida</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {items.length > 10 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        + {items.length - 10} produtos adicionais com urgência {urgencia}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-800 font-semibold">✅ Nenhum produto necessita reposição no período</p>
            <p className="text-sm text-green-600 mt-2">Todos os níveis de estoque estão adequados para os próximos {forecast_days} dias</p>
          </CardContent>
        </Card>
      )}

      {/* Legenda */}
      {previsoes && previsoes.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">📋 Níveis de Urgência:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span><strong>CRÍTICO:</strong> &lt;7 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span><strong>ALTO:</strong> 7-15 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span><strong>MÉDIO:</strong> 15-30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span><strong>BAIXO:</strong> &gt;30 dias</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
