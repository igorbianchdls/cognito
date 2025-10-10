'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Award } from 'lucide-react';

interface PlatformBenchmarkResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  plataformas?: Array<{
    plataforma: string;
    contas_ativas: number;
    total_seguidores: number;
    total_publicacoes: number;
    total_alcance: number;
    engagement_total: number;
    engagement_rate: string;
    alcance_medio_por_post: string;
    classificacao: string;
    recomendacao: string;
  }>;
}

export default function PlatformBenchmarkResult({
  success,
  message,
  periodo_dias,
  total_plataformas,
  melhor_plataforma,
  pior_plataforma,
  plataformas
}: PlatformBenchmarkResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro no Benchmark de Plataformas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification === 'Excelente') return 'bg-green-100 text-green-700 border-green-300';
    if (classification === 'Boa') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (classification === 'Regular') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getPlatformIcon = (plat: string) => {
    const icons: Record<string, string> = {
      'Instagram': '📷',
      'Facebook': '👥',
      'LinkedIn': '💼',
      'Twitter': '🐦',
      'YouTube': '🎬',
      'TikTok': '🎵'
    };
    return icons[plat] || '📱';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-indigo-900">🏆 Benchmark de Plataformas</h3>
              <p className="text-sm text-indigo-700 mt-1">
                {total_plataformas} plataformas • Período: {periodo_dias} dias
              </p>
            </div>
            <Award className="h-8 w-8 text-indigo-600" />
          </div>
        </CardContent>
      </Card>

      {/* Melhores e Piores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">🥇 Melhor Plataforma</p>
              <p className="text-3xl font-bold mt-2">{getPlatformIcon(melhor_plataforma || '')} {melhor_plataforma}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">📉 Requer Atenção</p>
              <p className="text-3xl font-bold mt-2">{getPlatformIcon(pior_plataforma || '')} {pior_plataforma}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Plataformas */}
      {plataformas && plataformas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Ranking de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plataformas.map((plat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${idx === 0 ? 'border-green-300 bg-green-50' : idx === plataformas.length - 1 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          <span>{getPlatformIcon(plat.plataforma)}</span>
                          {plat.plataforma}
                        </p>
                        <p className="text-sm text-gray-600">{plat.contas_ativas} conta(s) ativa(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-700">{plat.engagement_rate}</p>
                      <p className="text-xs text-gray-500">engagement rate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Seguidores</p>
                      <p className="font-semibold">{plat.total_seguidores.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Publicações</p>
                      <p className="font-semibold">{plat.total_publicacoes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Alcance Total</p>
                      <p className="font-semibold">{plat.total_alcance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Alcance Médio</p>
                      <p className="font-semibold">{parseInt(plat.alcance_medio_por_post).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getClassificationColor(plat.classificacao)}`}>
                      {plat.classificacao}
                    </span>
                    <span className="text-xs text-gray-600 italic">{plat.recomendacao}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
