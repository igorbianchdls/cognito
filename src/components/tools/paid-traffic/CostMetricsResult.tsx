'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';

interface CostMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  metricas?: {
    total_gasto: string;
    total_impressoes: number;
    total_cliques: number;
    total_conversoes: number;
    cpm: string;
    cpc: string;
    cpa: string;
    ctr: string;
    classificacao_eficiencia: string;
  };
}

export default function CostMetricsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  metricas
}: CostMetricsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro no Cálculo de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification === 'Excelente') return 'text-green-600 bg-green-100 border-green-300';
    if (classification === 'Boa') return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification === 'Regular') return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-cyan-200 bg-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-cyan-900">💵 Métricas de Custo</h3>
              <p className="text-sm text-cyan-700 mt-1">
                Plataforma: {plataforma} • Período: {periodo_dias} dias
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-cyan-600" />
          </div>
        </CardContent>
      </Card>

      {metricas && (
        <>
          {/* Classificação de Eficiência */}
          <Card className={`border-2 ${getClassificationColor(metricas.classificacao_eficiencia)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Classificação de Eficiência</p>
                <p className="text-5xl font-bold mt-2">{metricas.classificacao_eficiencia}</p>
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">R$ {metricas.total_gasto}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Impressões</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metricas.total_impressoes.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Cliques</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metricas.total_cliques.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Conversões</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metricas.total_conversoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Custo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custos Unitários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                  <p className="text-sm text-purple-600 font-medium">CPM</p>
                  <p className="text-xs text-purple-500 mb-2">Custo por Mil Impressões</p>
                  <p className="text-2xl font-bold text-purple-700">R$ {metricas.cpm}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <p className="text-sm text-blue-600 font-medium">CPC</p>
                  <p className="text-xs text-blue-500 mb-2">Custo por Clique</p>
                  <p className="text-2xl font-bold text-blue-700">R$ {metricas.cpc}</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                  <p className="text-sm text-orange-600 font-medium">CPA</p>
                  <p className="text-xs text-orange-500 mb-2">Custo por Aquisição</p>
                  <p className="text-2xl font-bold text-orange-700">R$ {metricas.cpa}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-sm text-green-600 font-medium">CTR</p>
                  <p className="text-xs text-green-500 mb-2">Taxa de Cliques</p>
                  <p className="text-2xl font-bold text-green-700">{metricas.ctr}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benchmarks */}
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-cyan-900">📊 Benchmarks de Mercado:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-700"><strong>CPM:</strong> Meta R$10-30 | Google Display R$5-15</p>
                    <p className="text-gray-700"><strong>CPC:</strong> Meta R$0.50-2 | Google R$1-5</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><strong>CPA:</strong> E-commerce R$20-50 | SaaS R$100-300</p>
                    <p className="text-gray-700"><strong>CTR:</strong> Meta 1-2% = Bom | Google 3-5% = Bom</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-purple-900">💡 Insights:</p>
                {metricas.classificacao_eficiencia === 'Excelente' && (
                  <p className="text-gray-700">✅ Eficiência excelente! Suas métricas estão otimizadas.</p>
                )}
                {metricas.classificacao_eficiencia === 'Baixa' && (
                  <p className="text-gray-700">⚠️ Eficiência baixa. Revise segmentação e criativos para reduzir custos.</p>
                )}
                {parseFloat(metricas.ctr) < 1 && (
                  <p className="text-gray-700">⚠️ CTR baixo. Teste novos criativos e copy mais atrativos.</p>
                )}
                {parseFloat(metricas.cpa) > 200 && (
                  <p className="text-gray-700">⚠️ CPA alto. Otimize landing page e funil de conversão.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
