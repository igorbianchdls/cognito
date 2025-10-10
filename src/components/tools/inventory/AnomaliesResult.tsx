'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface Anomalia {
  product_id: string;
  tipo_anomalia: string;
  quantidade_anomala?: number;
  media_esperada?: string;
  desvio_padrao?: string;
  z_score?: string;
  severidade: string;
  recomendacao: string;
  max_estoque?: number;
  min_estoque?: number;
  diferenca?: number;
}

interface AnomaliesResultProps {
  success: boolean;
  message: string;
  sensitivity?: string;
  total_anomalias?: number;
  anomalias_alta_severidade?: number;
  anomalias?: Anomalia[];
}

export default function AnomaliesResult({ success, message, sensitivity, total_anomalias, anomalias_alta_severidade, anomalias }: AnomaliesResultProps) {
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

  const getSeveridadeColor = (severidade: string) => {
    if (severidade === 'ALTA') return 'border-red-300 bg-red-50';
    if (severidade === 'MÉDIA') return 'border-orange-300 bg-orange-50';
    return 'border-yellow-300 bg-yellow-50';
  };

  const getSeveridadeIcon = (severidade: string) => {
    if (severidade === 'ALTA') return '🚨';
    if (severidade === 'MÉDIA') return '⚠️';
    return '⏰';
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'PICO_MOVIMENTACAO') return '📈';
    if (tipo === 'QUEDA_ABRUPTA') return '📉';
    return '🔄';
  };

  const anomaliasAgrupadas = anomalias?.reduce((acc, anom) => {
    if (!acc[anom.severidade]) acc[anom.severidade] = [];
    acc[anom.severidade].push(anom);
    return acc;
  }, {} as Record<string, Anomalia[]>);

  const ordemSeveridade = ['ALTA', 'MÉDIA', 'BAIXA'];

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">🔍 Detecção de Anomalias no Estoque</h3>
              <p className="text-sm text-purple-700 mt-1">
                Sensibilidade: {sensitivity} • {total_anomalias || 0} anomalias detectadas
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total de Anomalias</p>
            <p className="text-3xl font-bold text-purple-700">{total_anomalias || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Alta Severidade</p>
            <p className="text-3xl font-bold text-red-700">{anomalias_alta_severidade || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Sensibilidade</p>
            <p className="text-2xl font-bold text-blue-700 uppercase">{sensitivity}</p>
          </CardContent>
        </Card>
      </div>

      {anomalias && anomalias.length > 0 ? (
        <div className="space-y-4">
          {ordemSeveridade.map((severidade) => {
            const items = anomaliasAgrupadas?.[severidade] || [];
            if (items.length === 0) return null;

            return (
              <Card key={severidade} className={`border-2 ${getSeveridadeColor(severidade)}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{getSeveridadeIcon(severidade)}</span>
                    Severidade {severidade} ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((anom, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getTipoIcon(anom.tipo_anomalia)}</span>
                            <div>
                              <p className="font-semibold">{anom.product_id}</p>
                              <p className="text-xs text-gray-500">{anom.tipo_anomalia.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {anom.z_score && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Z-Score</p>
                              <p className="font-bold text-purple-700">{anom.z_score}</p>
                            </div>
                          )}
                        </div>

                        {anom.tipo_anomalia !== 'DISCREPANCIA_ENTRE_CANAIS' ? (
                          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-500 text-xs">Quantidade Detectada</p>
                              <p className="font-semibold">{anom.quantidade_anomala?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Média Esperada</p>
                              <p className="font-semibold">{anom.media_esperada}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Desvio Padrão</p>
                              <p className="font-semibold">{anom.desvio_padrao}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-500 text-xs">Estoque Máximo</p>
                              <p className="font-semibold">{anom.max_estoque?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Estoque Mínimo</p>
                              <p className="font-semibold">{anom.min_estoque?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Diferença</p>
                              <p className="font-semibold text-red-600">{anom.diferenca?.toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700">
                            💡 Recomendação: <span className="font-normal">{anom.recomendacao}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-800 font-semibold text-lg">✅ Nenhuma anomalia detectada!</p>
            <p className="text-sm text-green-600 mt-2">
              Todas as movimentações de estoque estão dentro dos padrões esperados
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">📋 Sobre a Detecção:</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li><strong>Z-Score:</strong> Medida estatística de quantos desvios padrão o valor está da média</li>
            <li><strong>Low sensitivity:</strong> Z-Score &gt; 3.0 (apenas anomalias óbvias)</li>
            <li><strong>Medium sensitivity:</strong> Z-Score &gt; 2.0 (balanceado)</li>
            <li><strong>High sensitivity:</strong> Z-Score &gt; 1.5 (mais sensível, pode gerar falsos positivos)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
