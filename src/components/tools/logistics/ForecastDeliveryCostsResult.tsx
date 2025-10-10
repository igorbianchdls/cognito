'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, DollarSign, Calendar, Lightbulb } from 'lucide-react';

interface ForecastDeliveryCostsResultProps {
  success: boolean;
  message: string;
  forecast_days?: number;
  lookback_days?: number;
  historico?: {
    media_custo_semanal: string;
    media_volume_semanal: number;
    tendencia: string;
    slope: string;
  };
  previsao?: {
    custo_previsto_total: string;
    volume_previsto_envios: number;
    custo_medio_por_envio: string;
    periodo: string;
  };
  insights?: string[];
}

export default function ForecastDeliveryCostsResult({
  success,
  message,
  forecast_days,
  lookback_days,
  historico,
  previsao,
  insights
}: ForecastDeliveryCostsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Previsão de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getTendenciaColor = (tendencia: string) => {
    if (tendencia === 'crescente') return 'text-red-600 bg-red-100 border-red-300';
    if (tendencia === 'decrescente') return 'text-green-600 bg-green-100 border-green-300';
    return 'text-blue-600 bg-blue-100 border-blue-300';
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === 'crescente') return '📈';
    if (tendencia === 'decrescente') return '📉';
    return '➡️';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-indigo-900">📊 Previsão de Custos de Entrega</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Previsão: {forecast_days} dias • Baseado em: {lookback_days} dias de histórico
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      {historico && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Análise Histórica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Custo Médio Semanal</p>
                <p className="text-2xl font-bold mt-2 text-blue-700">R$ {historico.media_custo_semanal}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Volume Médio Semanal</p>
                <p className="text-2xl font-bold mt-2 text-gray-700">{historico.media_volume_semanal}</p>
                <p className="text-xs text-gray-500">envios</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Tendência</p>
                <div className={`inline-block mt-2 px-4 py-2 rounded-lg ${getTendenciaColor(historico.tendencia)}`}>
                  <p className="font-semibold flex items-center gap-1">
                    <span>{getTendenciaIcon(historico.tendencia)}</span>
                    {historico.tendencia}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Slope (Variação)</p>
                <p className="text-2xl font-bold mt-2 text-purple-700">{historico.slope}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsão */}
      {previsao && (
        <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              Previsão de Custos ({previsao.periodo})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Custo Total Previsto</p>
                    <p className="text-4xl font-bold mt-2 text-indigo-700">R$ {previsao.custo_previsto_total}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Volume Previsto</p>
                    <p className="text-4xl font-bold mt-2 text-blue-700">{previsao.volume_previsto_envios}</p>
                    <p className="text-xs text-gray-500 mt-1">envios</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Custo Médio/Envio</p>
                    <p className="text-4xl font-bold mt-2 text-purple-700">R$ {previsao.custo_medio_por_envio}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              💡 Insights e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <span className="text-yellow-600 font-bold text-lg">→</span>
                  <span className="text-sm text-gray-700 flex-1">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Aviso */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <p className="text-xs text-gray-600 text-center">
            ℹ️ Esta previsão é baseada em análise de tendências históricas usando regressão linear simples.
            Fatores externos (sazonalidade, mudanças de mercado, novos contratos) podem afetar os custos reais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
