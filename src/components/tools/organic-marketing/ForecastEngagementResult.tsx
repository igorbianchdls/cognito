'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Calendar, Lightbulb } from 'lucide-react';

interface ForecastEngagementResultProps {
  success: boolean;
  message: string;
  forecast_days?: number;
  lookback_days?: number;
  historico?: {
    media_engagement_semanal: number;
    media_alcance_semanal: number;
    tendencia: string;
    slope: string;
  };
  previsao?: {
    engagement_previsto_total: number;
    alcance_previsto_total: number;
    engagement_rate_previsto: string;
    periodo: string;
  };
  insights?: string[];
}

export default function ForecastEngagementResult({
  success,
  message,
  forecast_days,
  lookback_days,
  historico,
  previsao,
  insights
}: ForecastEngagementResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Previsão de Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getTendenciaColor = (tendencia: string) => {
    if (tendencia === 'crescente') return 'text-green-600 bg-green-100 border-green-300';
    if (tendencia === 'decrescente') return 'text-red-600 bg-red-100 border-red-300';
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
              <h3 className="font-semibold text-lg text-indigo-900">🔮 Previsão de Engajamento</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Engagement Médio Semanal</p>
                <p className="text-2xl font-bold mt-2">{historico.media_engagement_semanal.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">interações</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Alcance Médio Semanal</p>
                <p className="text-2xl font-bold mt-2">{historico.media_alcance_semanal.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">pessoas</p>
              </div>

              <div className={`text-center p-4 rounded-lg border-2 ${getTendenciaColor(historico.tendencia)}`}>
                <p className="text-sm font-medium">Tendência</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-2xl">{getTendenciaIcon(historico.tendencia)}</span>
                  <p className="text-xl font-bold capitalize">{historico.tendencia}</p>
                </div>
                <p className="text-xs mt-1">Slope: {historico.slope}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsão */}
      {previsao && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-base text-purple-900">
              📊 Previsão para {previsao.periodo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Engagement Previsto</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">
                      {previsao.engagement_previsto_total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">interações</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Alcance Previsto</p>
                    <p className="text-3xl font-bold text-indigo-700 mt-2">
                      {previsao.alcance_previsto_total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">pessoas</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Engagement Rate Previsto</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">
                      {previsao.engagement_rate_previsto}
                    </p>
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
            ℹ️ Esta previsão é baseada em análise de tendências históricas usando regressão linear.
            Campanhas, mudanças no algoritmo e fatores externos podem afetar os resultados reais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
