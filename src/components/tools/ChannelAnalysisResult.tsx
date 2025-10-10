'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Radio, AlertCircle } from 'lucide-react';

interface CanalMetrica {
  channel_id: string;
  channel_name: string;
  channel_type: string;
  numero_pedidos: number;
  receita_total: number;
  aov: number;
  desconto_total: number;
  frete_total: number;
  percentual_receita?: number;
  percentual_pedidos?: number;
}

interface ChannelAnalysis {
  periodo: { data_de: string; data_ate: string };
  resumo: {
    total_canais: number;
    receita_total: number;
    pedidos_totais: number;
    aov_geral: number;
  };
  canais_performance: CanalMetrica[];
  melhor_canal: {
    name: string;
    receita: number;
    pedidos: number;
    aov: number;
  } | null;
  pior_canal: {
    name: string;
    receita: number;
    pedidos: number;
    aov: number;
  } | null;
}

interface ChannelAnalysisResultProps {
  success: boolean;
  data: ChannelAnalysis | null;
  error?: string;
  message?: string;
}

export default function ChannelAnalysisResult({
  success,
  data,
  error,
  message
}: ChannelAnalysisResultProps) {
  if (!success || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Analisar Canais de Venda</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {error || message || 'Erro desconhecido'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getChannelColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-cyan-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-indigo-800">Análise de Canais de Venda</CardTitle>
            </div>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
              {new Date(data.periodo.data_de).toLocaleDateString('pt-BR')} - {new Date(data.periodo.data_ate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          <CardDescription className="text-indigo-700">
            {message || 'Performance por canal, distribuição de vendas e otimização de mix'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-white rounded-lg p-6 border-2 border-indigo-300">
            <p className="text-sm font-semibold text-gray-600 mb-4">RESUMO GERAL</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Total Canais</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {data.resumo.total_canais}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.resumo.receita_total)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Pedidos Totais</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.resumo.pedidos_totais.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">AOV Geral</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.resumo.aov_geral)}
                </p>
              </div>
            </div>
          </div>

          {/* Melhor vs Pior Canal */}
          {(data.melhor_canal || data.pior_canal) && (
            <div className="grid grid-cols-2 gap-4">
              {/* Melhor Canal */}
              {data.melhor_canal && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">Melhor Canal</p>
                  </div>
                  <p className="text-lg font-bold text-green-800 mb-2">
                    {data.melhor_canal.name}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Receita:</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(data.melhor_canal.receita)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Pedidos:</span>
                      <span className="font-semibold text-green-700">
                        {data.melhor_canal.pedidos.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">AOV:</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(data.melhor_canal.aov)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pior Canal */}
              {data.pior_canal && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4 text-gray-600" />
                    <p className="text-sm font-semibold text-gray-700">Pior Canal</p>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-2">
                    {data.pior_canal.name}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receita:</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(data.pior_canal.receita)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedidos:</span>
                      <span className="font-semibold text-gray-700">
                        {data.pior_canal.pedidos.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AOV:</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(data.pior_canal.aov)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance por Canal */}
          <div className="bg-white rounded-lg p-6 border border-indigo-200">
            <p className="text-sm font-semibold text-indigo-800 mb-4">DISTRIBUIÇÃO DE RECEITA POR CANAL</p>

            <div className="space-y-4">
              {data.canais_performance.map((canal, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getChannelColor(idx)}`} />
                      <div>
                        <p className="font-semibold text-gray-900">{canal.channel_name}</p>
                        <p className="text-xs text-gray-500">{canal.channel_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(canal.receita_total)}</p>
                      <p className="text-xs text-gray-500">
                        {canal.percentual_receita?.toFixed(1)}% da receita
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getChannelColor(idx)}`}
                      style={{ width: `${canal.percentual_receita || 0}%` }}
                    />
                  </div>

                  {/* Métricas do Canal */}
                  <div className="grid grid-cols-3 gap-2 text-xs pl-6">
                    <div>
                      <p className="text-gray-500">Pedidos</p>
                      <p className="font-semibold text-gray-700">
                        {canal.numero_pedidos} ({canal.percentual_pedidos?.toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">AOV</p>
                      <p className="font-semibold text-gray-700">
                        {formatCurrency(canal.aov)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Desconto</p>
                      <p className="font-semibold text-gray-700">
                        {formatCurrency(canal.desconto_total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">💡 INSIGHTS</p>
            <ul className="text-sm text-blue-600 space-y-1">
              {data.melhor_canal && (
                <li>
                  • O canal <strong>{data.melhor_canal.name}</strong> lidera com{' '}
                  <strong>{formatCurrency(data.melhor_canal.receita)}</strong> em receita
                </li>
              )}
              {data.canais_performance.length > 1 && (
                <li>
                  • Há <strong>{data.canais_performance.length}</strong> canais ativos com diferentes performances
                </li>
              )}
              {data.resumo.aov_geral > 0 && (
                <li>
                  • O ticket médio geral é de <strong>{formatCurrency(data.resumo.aov_geral)}</strong>
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
