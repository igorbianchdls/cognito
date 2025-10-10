'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, AlertCircle, TrendingUp } from 'lucide-react';

interface DetectDeliveryAnomaliesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: string;
  estatisticas_base?: {
    media_dias_entrega: string;
    desvio_padrao: string;
    total_envios_analisados: number;
  };
  total_anomalias?: number;
  anomalias_criticas?: number;
  anomalias_altas?: number;
  anomalias?: Array<{
    codigo_rastreio: string;
    dias_entrega: number;
    z_score: number;
    severidade: string;
    tipo_anomalia: string;
    recomendacao: string;
  }>;
  red_flags?: string[];
}

export default function DetectDeliveryAnomaliesResult({
  success,
  message,
  periodo_dias,
  sensitivity,
  estatisticas_base,
  total_anomalias,
  anomalias_criticas,
  anomalias_altas,
  anomalias,
  red_flags
}: DetectDeliveryAnomaliesResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Detecção de Anomalias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severidade: string) => {
    if (severidade === 'CRÍTICA') return 'bg-red-100 text-red-700 border-red-300';
    if (severidade === 'ALTA') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  const getTypeIcon = (tipo: string) => {
    if (tipo === 'ATRASO_SIGNIFICATIVO') return '🐌';
    return '⚡';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">🔍 Detecção de Anomalias em Entregas</h3>
              <p className="text-sm text-orange-700 mt-1">
                Período: {periodo_dias} dias • Sensibilidade: {sensitivity?.toUpperCase()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Base */}
      {estatisticas_base && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Média de Entrega</p>
                <p className="text-3xl font-bold mt-2 text-blue-700">{estatisticas_base.media_dias_entrega}</p>
                <p className="text-xs text-gray-500 mt-1">dias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Desvio Padrão</p>
                <p className="text-3xl font-bold mt-2 text-purple-700">{estatisticas_base.desvio_padrao}</p>
                <p className="text-xs text-gray-500 mt-1">dias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Envios Analisados</p>
                <p className="text-3xl font-bold mt-2 text-gray-700">{estatisticas_base.total_envios_analisados}</p>
                <p className="text-xs text-gray-500 mt-1">envios</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo de Anomalias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total de Anomalias</p>
              <p className="text-4xl font-bold mt-2">{total_anomalias}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600">Anomalias Críticas</p>
              <p className="text-4xl font-bold mt-2 text-red-700">{anomalias_criticas}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-orange-600">Anomalias Altas</p>
              <p className="text-4xl font-bold mt-2 text-orange-700">{anomalias_altas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Anomalias */}
      {anomalias && anomalias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Anomalias Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {anomalias.map((anomalia, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${getSeverityColor(anomalia.severidade)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(anomalia.tipo_anomalia)}</span>
                      <div>
                        <p className="font-semibold text-sm">{anomalia.codigo_rastreio}</p>
                        <p className="text-xs text-gray-600">{anomalia.tipo_anomalia.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(anomalia.severidade)}`}>
                      {anomalia.severidade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Dias de Entrega</p>
                      <p className="font-semibold">{anomalia.dias_entrega} dias</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Z-Score</p>
                      <p className="font-semibold">{anomalia.z_score}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded text-xs">
                    <p className="font-medium text-gray-700">💡 Recomendação:</p>
                    <p className="text-gray-600 mt-1">{anomalia.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {red_flags && red_flags.length > 0 && (
        <Card className="bg-red-50 border-red-200 border-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              🚨 Alertas Críticos (Red Flags)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                  <span className="text-red-600 font-bold text-lg">⚠️</span>
                  <span className="font-medium">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      {total_anomalias === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-green-700 font-semibold">✅ Nenhuma anomalia detectada</p>
              <p className="text-sm text-gray-600 mt-2">
                Todas as entregas estão dentro do padrão esperado para a sensibilidade configurada
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
