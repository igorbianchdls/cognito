'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, TrendingUp, Calculator } from 'lucide-react';

interface ContentROIResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_posts?: number;
  custos?: {
    custo_por_post: string;
    custo_total: string;
  };
  resultados?: {
    total_alcance: number;
    total_engagement: number;
    valor_alcance: string;
    valor_engagement: string;
    valor_total_gerado: string;
  };
  roi?: {
    percentual: string;
    valor_retorno: string;
    custo_por_alcance: string;
    custo_por_engagement: string;
    classificacao: string;
  };
}

export default function ContentROIResult({
  success,
  message,
  periodo_dias,
  total_posts,
  custos,
  resultados,
  roi
}: ContentROIResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro no Cálculo de ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getROIColor = (classification: string) => {
    if (classification.includes('Excelente')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Muito Bom') || classification.includes('Bom')) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification.includes('Positivo')) return 'text-purple-600 bg-purple-100 border-purple-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  const roiNum = roi ? parseFloat(roi.percentual) : 0;
  const isPositive = roiNum >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-emerald-900">💰 ROI do Marketing Orgânico</h3>
              <p className="text-sm text-emerald-700 mt-1">
                {total_posts} posts • Período: {periodo_dias} dias
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      {/* ROI Principal */}
      {roi && (
        <Card className={`border-2 ${getROIColor(roi.classificacao)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">ROI (Return on Investment)</p>
              <p className={`text-5xl font-bold mt-3 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{roi.percentual}
              </p>
              <p className={`text-sm font-medium mt-3 inline-block px-4 py-2 rounded-full ${getROIColor(roi.classificacao)}`}>
                {roi.classificacao}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custos vs Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custos */}
        {custos && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-700">💸 Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-600">Custo por Post</span>
                  <span className="text-lg font-bold">R$ {custos.custo_por_post}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border-2 border-red-300">
                  <span className="text-sm font-medium text-red-700">Custo Total</span>
                  <span className="text-2xl font-bold text-red-700">R$ {custos.custo_total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {resultados && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-700">💚 Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600">Alcance</p>
                    <p className="text-sm font-bold">{resultados.total_alcance.toLocaleString()}</p>
                    <p className="text-xs text-green-600">R$ {resultados.valor_alcance}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600">Engagement</p>
                    <p className="text-sm font-bold">{resultados.total_engagement.toLocaleString()}</p>
                    <p className="text-xs text-green-600">R$ {resultados.valor_engagement}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border-2 border-green-300">
                  <span className="text-sm font-medium text-green-700">Valor Total Gerado</span>
                  <span className="text-2xl font-bold text-green-700">R$ {resultados.valor_total_gerado}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Métricas de Eficiência */}
      {roi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Métricas de Eficiência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Retorno Financeiro</p>
                <p className={`text-2xl font-bold mt-2 ${parseFloat(roi.valor_retorno) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {parseFloat(roi.valor_retorno) >= 0 ? '+' : ''}R$ {roi.valor_retorno}
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Custo por Alcance</p>
                <p className="text-2xl font-bold mt-2 text-blue-700">R$ {roi.custo_por_alcance}</p>
              </div>

              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600">Custo por Engagement</p>
                <p className="text-2xl font-bold mt-2 text-indigo-700">R$ {roi.custo_por_engagement}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interpretação */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Interpretação do ROI</h4>
              <p className="text-sm text-gray-700 mb-2">
                {roiNum >= 200 && "🎉 Excelente! Seu investimento está gerando mais que o triplo de retorno."}
                {roiNum >= 100 && roiNum < 200 && "👍 Muito bom! Cada real investido está dobrando ou mais."}
                {roiNum >= 50 && roiNum < 100 && "✅ Bom resultado! O investimento está gerando retorno positivo."}
                {roiNum >= 0 && roiNum < 50 && "⚠️ ROI positivo mas baixo. Considere otimizar estratégia."}
                {roiNum < 0 && "🚨 ROI negativo. Revise urgentemente a estratégia de conteúdo."}
              </p>
              <p className="text-xs text-gray-600 italic">
                Valores estimados: R$ 0,10 por alcance, R$ 0,50 por engajamento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
