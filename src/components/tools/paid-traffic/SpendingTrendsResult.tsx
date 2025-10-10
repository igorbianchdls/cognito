'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SpendingTrendsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  estatisticas?: {
    gasto_medio_dia: string;
    gasto_maximo: string;
    gasto_minimo: string;
    tendencia: string;
  };
  gastos_diarios?: Array<{
    data: string;
    gasto: string;
    receita: string;
  }>;
}

export default function SpendingTrendsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  estatisticas,
  gastos_diarios
}: SpendingTrendsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Tendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (tendencia: string) => {
    if (tendencia === 'Crescente') return <TrendingUp className="h-6 w-6 text-green-600" />;
    if (tendencia === 'Decrescente') return <TrendingDown className="h-6 w-6 text-red-600" />;
    return <Minus className="h-6 w-6 text-gray-600" />;
  };

  const getTrendColor = (tendencia: string) => {
    if (tendencia === 'Crescente') return 'border-green-300 bg-green-50 text-green-700';
    if (tendencia === 'Decrescente') return 'border-red-300 bg-red-50 text-red-700';
    return 'border-gray-300 bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-indigo-900">📈 Tendências de Gasto</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Plataforma: {plataforma} • Período: {periodo_dias} dias
              </p>
            </div>
            {estatisticas && getTrendIcon(estatisticas.tendencia)}
          </div>
        </CardContent>
      </Card>

      {/* Tendência */}
      {estatisticas && (
        <>
          <Card className={`border-2 ${getTrendColor(estatisticas.tendencia)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Tendência Geral</p>
                <p className="text-5xl font-bold mt-2">{estatisticas.tendencia}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estatísticas de Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <p className="text-sm text-blue-600 font-medium">Gasto Médio/Dia</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">R$ {estatisticas.gasto_medio_dia}</p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                  <p className="text-sm text-red-600 font-medium">Gasto Máximo</p>
                  <p className="text-3xl font-bold text-red-700 mt-1">R$ {estatisticas.gasto_maximo}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-sm text-green-600 font-medium">Gasto Mínimo</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">R$ {estatisticas.gasto_minimo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Gastos Diários */}
      {gastos_diarios && gastos_diarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos Diários (últimos registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gastos_diarios.slice(-15).reverse().map((dia, idx) => {
                const gastoValue = parseFloat(dia.gasto);
                const receitaValue = parseFloat(dia.receita);
                const roas = gastoValue > 0 ? receitaValue / gastoValue : 0;

                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{new Date(dia.data).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-600">ROAS: {roas.toFixed(2)}x</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">R$ {dia.gasto}</p>
                      <p className="text-xs text-gray-600">Receita: R$ {dia.receita}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-indigo-900">💡 Insights:</p>
            {estatisticas?.tendencia === 'Crescente' && (
              <p className="text-gray-700">📈 Gasto crescente. Verifique se ROAS está acompanhando o aumento.</p>
            )}
            {estatisticas?.tendencia === 'Decrescente' && (
              <p className="text-gray-700">📉 Gasto decrescente. Analise se é estratégico ou há problemas nas campanhas.</p>
            )}
            {estatisticas?.tendencia === 'Estável' && (
              <p className="text-gray-700">✅ Gasto estável. Mantenha monitoramento para otimizações contínuas.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
