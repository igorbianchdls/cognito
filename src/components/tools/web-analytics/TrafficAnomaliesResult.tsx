'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface TrafficAnomaliesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: number;
  estatisticas?: {
    media_sessoes_dia: number;
    desvio_padrao: number;
  };
  total_anomalias?: number;
  bot_rate?: string;
  anomalias?: Array<{
    data: string;
    sessoes: number;
    media: number;
    z_score: string;
    tipo: string;
    severidade: string;
  }>;
  red_flags?: string[];
}

export default function TrafficAnomaliesResult({
  success,
  message,
  periodo_dias,
  sensitivity,
  estatisticas,
  total_anomalias,
  bot_rate,
  anomalias,
  red_flags
}: TrafficAnomaliesResultProps) {
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

  const getSeverityColor = (severity: string) => {
    if (severity === 'CRÍTICA') return 'border-red-500 bg-red-100 text-red-800';
    return 'border-orange-400 bg-orange-100 text-orange-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">⚠️ Detecção de Anomalias</h3>
              <p className="text-sm text-orange-700 mt-1">
                {total_anomalias} anomalias detectadas • Período: {periodo_dias} dias • Sensibilidade: {sensitivity}σ
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Base */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Média Sessões/Dia</p>
                <p className="text-3xl font-bold mt-2">{estatisticas.media_sessoes_dia.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Desvio Padrão</p>
                <p className="text-3xl font-bold mt-2">{estatisticas.desvio_padrao.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Bot Rate</p>
                <p className="text-3xl font-bold mt-2">{bot_rate}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Red Flags */}
      {red_flags && red_flags.length > 0 && (
        <Card className="bg-red-50 border-red-300 border-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              🚨 Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 font-bold">⚠️</span>
                  <span className="flex-1 text-red-900 font-medium">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Anomalias Detectadas */}
      {anomalias && anomalias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Anomalias Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalias.map((anomalia, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${getSeverityColor(anomalia.severidade)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {anomalia.tipo === 'Pico' ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-semibold text-lg">{anomalia.data}</p>
                        <p className="text-sm">
                          {anomalia.sessoes.toLocaleString()} sessões (média: {anomalia.media.toLocaleString()})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(anomalia.severidade)}`}>
                        {anomalia.severidade}
                      </p>
                      <p className="text-sm mt-1">
                        Z-score: <span className="font-bold">{anomalia.z_score}</span>
                      </p>
                      <p className="text-xs text-gray-600">{anomalia.tipo}</p>
                    </div>
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
