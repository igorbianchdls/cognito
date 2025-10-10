'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trophy, Zap } from 'lucide-react';

interface TopAdsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_analisados?: number;
  top_anuncios?: Array<{
    anuncio_id: string;
    plataforma: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    ctr: string;
    custo_por_conversao: string;
  }>;
}

export default function TopAdsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  total_analisados,
  top_anuncios
}: TopAdsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Identificação de Top Anúncios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getMedalEmoji = (position: number) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return '🏅';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-amber-900">🥇 Top Anúncios</h3>
              <p className="text-sm text-amber-700 mt-1">
                Top {top_anuncios?.length} de {total_analisados} anúncios • Plataforma: {plataforma} • Período: {periodo_dias} dias
              </p>
            </div>
            <Trophy className="h-8 w-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>

      {/* Top Anúncios */}
      {top_anuncios && top_anuncios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Melhores Anúncios (por ROAS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_anuncios.map((ad, idx) => {
                const roasValue = parseFloat(ad.roas);
                const isTopThree = idx < 3;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${isTopThree ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getMedalEmoji(idx)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{ad.anuncio_id}</p>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                              {ad.plataforma}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{ad.conversoes} conversões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${roasValue >= 3 ? 'text-green-700' : roasValue >= 2 ? 'text-blue-700' : 'text-yellow-700'}`}>
                          {ad.roas}x
                        </p>
                        <p className="text-xs text-gray-500">ROAS</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Gasto</p>
                        <p className="font-semibold">R$ {ad.gasto}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Receita</p>
                        <p className="font-semibold">R$ {ad.receita}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Custo/Conv.</p>
                        <p className="font-semibold">R$ {ad.custo_por_conversao}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CTR</p>
                        <p className="font-semibold">{ad.ctr}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-amber-900">💡 Dicas:</p>
            <p className="text-gray-700">🚀 Escale o budget dos anúncios com ROAS acima de 3x</p>
            <p className="text-gray-700">🎯 Analise criativos e copy dos top performers para replicar sucesso</p>
            <p className="text-gray-700">📊 Compare públicos dos melhores anúncios para identificar padrões</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
