'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LineChart, Calendar, TrendingUp } from 'lucide-react';

interface AdPerformanceForecastResultProps {
  success: boolean;
  message: string;
  lookback_days?: number;
  forecast_days?: number;
  plataforma?: string;
  historico?: {
    gasto_medio_dia: string;
    conversoes_medio_dia: string;
    roas_medio: string;
  };
  previsao?: {
    gasto_previsto: string;
    conversoes_previstas: number;
    receita_prevista: string;
    roas_esperado: string;
  };
}

export default function AdPerformanceForecastResult({
  success,
  message,
  lookback_days,
  forecast_days,
  plataforma,
  historico,
  previsao
}: AdPerformanceForecastResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Previsão de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-violet-200 bg-violet-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-violet-900">🔮 Previsão de Performance</h3>
              <p className="text-sm text-violet-700 mt-1">
                Plataforma: {plataforma} • Análise: {lookback_days} dias • Previsão: {forecast_days} dias
              </p>
            </div>
            <LineChart className="h-8 w-8 text-violet-600" />
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      {historico && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Dados Históricos ({lookback_days} dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-blue-600">Gasto Médio/Dia</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">R$ {historico.gasto_medio_dia}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-600">Conversões Média/Dia</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{historico.conversoes_medio_dia}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-600">ROAS Médio</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{historico.roas_medio}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsão */}
      {previsao && (
        <>
          <Card className="border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                Projeção para Próximos {forecast_days} Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                  <p className="text-sm text-red-600 font-medium">Gasto Previsto</p>
                  <p className="text-2xl font-bold text-red-700 mt-2">R$ {previsao.gasto_previsto}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-sm text-green-600 font-medium">Receita Prevista</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">R$ {previsao.receita_prevista}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <p className="text-sm text-blue-600 font-medium">Conversões</p>
                  <p className="text-2xl font-bold text-blue-700 mt-2">{previsao.conversoes_previstas}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                  <p className="text-sm text-purple-600 font-medium">ROAS Esperado</p>
                  <p className="text-2xl font-bold text-purple-700 mt-2">{previsao.roas_esperado}x</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROI Calculation */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Retorno Líquido Estimado</p>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  R$ {(parseFloat(previsao.receita_prevista) - parseFloat(previsao.gasto_previsto)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">(receita prevista - gasto previsto)</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-violet-900">💡 Recomendações:</p>
            {previsao && parseFloat(previsao.roas_esperado) >= 3 && (
              <p className="text-gray-700">🚀 ROAS esperado excelente! Considere aumentar o budget para escalar resultados.</p>
            )}
            {previsao && parseFloat(previsao.roas_esperado) < 2 && (
              <p className="text-gray-700">⚠️ ROAS esperado baixo. Revise campanhas antes de investir mais.</p>
            )}
            {previsao && previsao.conversoes_previstas < 10 && (
              <p className="text-gray-700">⚠️ Poucas conversões previstas. Considere otimizar funil ou aumentar orçamento.</p>
            )}
            <p className="text-gray-700">📊 Esta previsão é baseada na média histórica. Monitore diariamente para ajustes.</p>
            <p className="text-gray-700">🎯 Use esta projeção para planejamento de budget e definição de metas realistas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
