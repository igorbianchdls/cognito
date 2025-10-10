'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Award } from 'lucide-react';

interface TrafficSourcesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_fontes?: number;
  melhor_fonte?: string;
  pior_fonte?: string;
  fontes?: Array<{
    fonte: string;
    sessoes: number;
    percentual_trafego: string;
    pages_per_session: string;
    avg_duration_seconds: number;
    conversoes: number;
    conversion_rate: string;
    quality_score: string;
    classificacao: string;
  }>;
}

export default function TrafficSourcesResult({
  success,
  message,
  periodo_dias,
  total_fontes,
  melhor_fonte,
  pior_fonte,
  fontes
}: TrafficSourcesResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Comparação de Fontes
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

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      'organic': '🔍',
      'direct': '🔗',
      'social': '📱',
      'paid': '💰',
      'referral': '🔄',
      'email': '📧'
    };
    return icons[source.toLowerCase()] || '🌐';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-indigo-900">🌐 Fontes de Tráfego</h3>
              <p className="text-sm text-indigo-700 mt-1">
                {total_fontes} fontes • Período: {periodo_dias} dias
              </p>
            </div>
            <Award className="h-8 w-8 text-indigo-600" />
          </div>
        </CardContent>
      </Card>

      {/* Melhor e Pior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">🥇 Melhor Fonte</p>
              <p className="text-3xl font-bold mt-2">{getSourceIcon(melhor_fonte || '')} {melhor_fonte}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">⚠️ Requer Atenção</p>
              <p className="text-3xl font-bold mt-2">{getSourceIcon(pior_fonte || '')} {pior_fonte}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      {fontes && fontes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Ranking de Fontes (por Quality Score)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fontes.map((fonte, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${idx === 0 ? 'border-green-300 bg-green-50' : idx === fontes.length - 1 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          <span>{getSourceIcon(fonte.fonte)}</span>
                          {fonte.fonte}
                        </p>
                        <p className="text-sm text-gray-600">{fonte.sessoes.toLocaleString()} sessões ({fonte.percentual_trafego})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-700">{fonte.quality_score}</p>
                      <p className="text-xs text-gray-500">quality score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Páginas/Sessão</p>
                      <p className="font-semibold">{fonte.pages_per_session}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duração Média</p>
                      <p className="font-semibold">{Math.round(fonte.avg_duration_seconds / 60)} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Conversões</p>
                      <p className="font-semibold">{fonte.conversoes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Taxa Conversão</p>
                      <p className="font-semibold">{fonte.conversion_rate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getClassificationColor(fonte.classificacao)}`}>
                      {fonte.classificacao}
                    </span>
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
