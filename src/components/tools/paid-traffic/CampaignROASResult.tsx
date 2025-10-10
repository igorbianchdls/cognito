'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface CampaignROASResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_campanhas?: number;
  melhor_campanha?: string;
  campanhas?: Array<{
    campanha_id: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    custo_por_conversao: string;
    ctr: string;
    classificacao: string;
  }>;
}

export default function CampaignROASResult({
  success,
  message,
  periodo_dias,
  plataforma,
  total_campanhas,
  melhor_campanha,
  campanhas
}: CampaignROASResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de ROAS
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
    if (classification === 'Bom') return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification === 'Regular') return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-emerald-900">💰 Análise de ROAS por Campanha</h3>
              <p className="text-sm text-emerald-700 mt-1">
                {total_campanhas} campanhas • Plataforma: {plataforma} • Período: {periodo_dias} dias
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      {/* Melhor Campanha */}
      {melhor_campanha && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">🏆 Melhor Campanha</p>
              <p className="text-2xl font-bold mt-2">{melhor_campanha}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campanhas */}
      {campanhas && campanhas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Ranking de Campanhas (por ROAS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campanhas.map((campanha, idx) => {
                const roasValue = parseFloat(campanha.roas);
                const isTop = idx < 3;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${isTop ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-lg">{campanha.campanha_id}</p>
                          <p className="text-sm text-gray-600">{campanha.conversoes} conversões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${roasValue >= 2 ? 'text-green-700' : 'text-red-700'}`}>
                          {campanha.roas}x
                        </p>
                        <p className="text-xs text-gray-500">ROAS</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Gasto</p>
                        <p className="font-semibold">R$ {campanha.gasto}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Receita</p>
                        <p className="font-semibold">R$ {campanha.receita}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Custo/Conversão</p>
                        <p className="font-semibold">R$ {campanha.custo_por_conversao}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CTR</p>
                        <p className="font-semibold">{campanha.ctr}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getClassificationColor(campanha.classificacao)}`}>
                        {campanha.classificacao}
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
