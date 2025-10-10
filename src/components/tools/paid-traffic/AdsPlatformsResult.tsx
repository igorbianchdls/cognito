'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface AdsPlatformsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  plataformas?: Array<{
    plataforma: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    ctr: string;
    conversion_rate: string;
    classificacao: string;
  }>;
}

export default function AdsPlatformsResult({
  success,
  message,
  periodo_dias,
  total_plataformas,
  melhor_plataforma,
  pior_plataforma,
  plataformas
}: AdsPlatformsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Comparação de Plataformas
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
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">🏆 Benchmark de Plataformas</h3>
              <p className="text-sm text-purple-700 mt-1">
                {total_plataformas} plataformas • Período: {periodo_dias} dias
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Melhor e Pior */}
      {(melhor_plataforma || pior_plataforma) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {melhor_plataforma && (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">🏆 Melhor Plataforma</p>
                  <p className="text-2xl font-bold mt-2">{melhor_plataforma}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {pior_plataforma && (
            <Card className="border-2 border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 font-medium">⚠️ Pior Plataforma</p>
                  <p className="text-2xl font-bold mt-2">{pior_plataforma}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Plataformas */}
      {plataformas && plataformas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Comparação Detalhada (por ROAS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plataformas.map((plat, idx) => {
                const roasValue = parseFloat(plat.roas);
                const isTop = idx === 0;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${isTop ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-lg">{plat.plataforma}</p>
                          <p className="text-sm text-gray-600">{plat.conversoes} conversões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${roasValue >= 2 ? 'text-green-700' : 'text-red-700'}`}>
                          {plat.roas}x
                        </p>
                        <p className="text-xs text-gray-500">ROAS</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Gasto</p>
                        <p className="font-semibold">R$ {plat.gasto}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Receita</p>
                        <p className="font-semibold">R$ {plat.receita}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CTR</p>
                        <p className="font-semibold">{plat.ctr}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conv. Rate</p>
                        <p className="font-semibold">{plat.conversion_rate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getClassificationColor(plat.classificacao)}`}>
                        Performance {plat.classificacao}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
