'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface MovimentacoesPorPeriodo {
  [periodo: string]: {
    entradas: number;
    saidas: number;
    ajustes: number;
  };
}

interface TrendsAnalysisResultProps {
  success: boolean;
  message: string;
  product_id?: string;
  periodo_analise?: string;
  dias_analisados?: number;
  tendencia?: string;
  slope_tendencia?: string;
  media_saidas_por_periodo?: string;
  total_periodos?: number;
  movimentacoes_por_periodo?: MovimentacoesPorPeriodo;
  previsao_proximo_periodo?: string;
  insights?: string;
}

export default function TrendsAnalysisResult({
  success,
  message,
  product_id,
  periodo_analise,
  dias_analisados,
  tendencia,
  slope_tendencia,
  media_saidas_por_periodo,
  total_periodos,
  movimentacoes_por_periodo,
  previsao_proximo_periodo,
  insights
}: TrendsAnalysisResultProps) {
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

  const getTrendIcon = () => {
    if (tendencia === 'crescente') return <TrendingUp className="h-6 w-6 text-green-600" />;
    if (tendencia === 'decrescente') return <TrendingDown className="h-6 w-6 text-red-600" />;
    return <Minus className="h-6 w-6 text-blue-600" />;
  };

  const getTrendColor = () => {
    if (tendencia === 'crescente') return 'bg-green-100 text-green-700 border-green-300';
    if (tendencia === 'decrescente') return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const getTrendText = () => {
    if (tendencia === 'crescente') return 'CRESCENTE';
    if (tendencia === 'decrescente') return 'DECRESCENTE';
    return 'ESTÁVEL';
  };

  // Preparar dados para visualização simples
  const periodos = movimentacoes_por_periodo ? Object.keys(movimentacoes_por_periodo).slice(-10) : [];
  const maxSaidas = periodos.length > 0
    ? Math.max(...periodos.map(p => movimentacoes_por_periodo![p].saidas))
    : 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">📈 Análise de Tendências de Movimentação</h3>
              <p className="text-sm text-purple-700 mt-1">
                {product_id !== 'TODOS' ? `Produto: ${product_id}` : 'Todos os produtos'} •
                Período: {periodo_analise} • {dias_analisados} dias analisados
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Tendência Principal */}
      <Card className={`border-2 ${getTrendColor()}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getTrendIcon()}
              <div>
                <p className="text-sm text-gray-600">Tendência Detectada</p>
                <p className="text-2xl font-bold">{getTrendText()}</p>
                <p className="text-xs text-gray-500 mt-1">Slope: {slope_tendencia}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Previsão Próximo Período</p>
              <p className="text-xl font-semibold">{previsao_proximo_periodo} unidades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Média de Saídas</p>
            <p className="text-2xl font-bold text-purple-700">{media_saidas_por_periodo}</p>
            <p className="text-xs text-gray-500 mt-1">por {periodo_analise === 'daily' ? 'dia' : periodo_analise === 'weekly' ? 'semana' : 'mês'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Períodos Analisados</p>
            <p className="text-2xl font-bold text-purple-700">{total_periodos}</p>
            <p className="text-xs text-gray-500 mt-1">{periodo_analise === 'daily' ? 'dias' : periodo_analise === 'weekly' ? 'semanas' : 'meses'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Dias Totais</p>
            <p className="text-2xl font-bold text-purple-700">{dias_analisados}</p>
            <p className="text-xs text-gray-500 mt-1">dias de histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualização Simplificada de Barras */}
      {periodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saídas por Período (últimos 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {periodos.map((periodo) => {
                const dados = movimentacoes_por_periodo![periodo];
                const porcentagem = (dados.saidas / maxSaidas) * 100;

                return (
                  <div key={periodo} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[200px]">{periodo}</span>
                      <span className="font-semibold text-purple-700">{dados.saidas.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Entradas: {dados.entradas}</span>
                      <span>Ajustes: {dados.ajustes}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {insights && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-1">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Recomendação Estratégica:</h4>
                <p className="text-sm text-blue-800">{insights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
