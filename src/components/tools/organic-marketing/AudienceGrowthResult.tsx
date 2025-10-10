'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react';

interface AudienceGrowthResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  crescimento?: {
    seguidores_inicial: number;
    seguidores_final: number;
    crescimento_total: number;
    taxa_crescimento: string;
    crescimento_medio_semanal: number;
    classificacao: string;
  };
  previsao?: {
    seguidores_previstos_4_semanas: number;
    crescimento_esperado: number;
  };
  historico_semanal?: Array<{
    periodo: string;
    seguidores: number;
    data: string;
  }>;
}

export default function AudienceGrowthResult({
  success,
  message,
  periodo_dias,
  crescimento,
  previsao,
  historico_semanal
}: AudienceGrowthResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Crescimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getGrowthColor = (classification: string) => {
    if (classification.includes('Acelerado')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Saudável')) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification.includes('Lento')) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">📈 Análise de Crescimento de Audiência</h3>
              <p className="text-sm text-blue-700 mt-1">
                Período: {periodo_dias} dias
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Crescimento Geral */}
      {crescimento && (
        <>
          <Card className={`border-2 ${getGrowthColor(crescimento.classificacao)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Taxa de Crescimento</p>
                <p className="text-4xl font-bold mt-2">{crescimento.taxa_crescimento}</p>
                <p className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getGrowthColor(crescimento.classificacao)}`}>
                  {crescimento.classificacao}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Seguidores Iniciais</p>
                  <p className="text-3xl font-bold mt-2 text-gray-700">{crescimento.seguidores_inicial.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">Seguidores Atuais</p>
                  <p className="text-3xl font-bold mt-2 text-blue-700">{crescimento.seguidores_final.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-green-300">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Crescimento Total</p>
                  <p className="text-3xl font-bold mt-2 text-green-700">+{crescimento.crescimento_total.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Crescimento Médio Semanal</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">+{crescimento.crescimento_medio_semanal.toLocaleString()} seguidores</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Previsão */}
      {previsao && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Previsão para Próximas 4 Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Seguidores Previstos</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">{previsao.seguidores_previstos_4_semanas.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Crescimento Esperado</p>
                <p className="text-3xl font-bold text-green-700 mt-2">+{previsao.crescimento_esperado.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Semanal */}
      {historico_semanal && historico_semanal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Histórico Semanal (últimas 8 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historico_semanal.map((semana, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{semana.periodo}</p>
                    <p className="text-xs text-gray-500">{semana.data}</p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">{semana.seguidores.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
