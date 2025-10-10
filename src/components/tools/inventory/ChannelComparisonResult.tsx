'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';

interface Canal {
  channel_id: string;
  total_estoque: number;
  valor_estoque: string;
  produtos: number;
  saidas_30d: number;
  turnover_anual: string;
  preco_medio: string;
}

interface ChannelComparisonResultProps {
  success: boolean;
  message: string;
  metric?: string;
  product_id?: string;
  melhor_canal?: string;
  pior_canal?: string;
  canais?: Canal[];
}

export default function ChannelComparisonResult({ success, message, metric, product_id, melhor_canal, pior_canal, canais }: ChannelComparisonResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Comparação de Canais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const metricLabels: Record<string, string> = {
    stock_level: 'Nível de Estoque',
    turnover: 'Turnover Anual',
    price_variance: 'Preço Médio'
  };

  const maxValue = canais && canais.length > 0
    ? Math.max(...canais.map(c => metric === 'stock_level' ? c.total_estoque : parseFloat(metric === 'turnover' ? c.turnover_anual : c.preco_medio)))
    : 1;

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">📊 Comparação de Performance entre Canais</h3>
              <p className="text-sm text-blue-700 mt-1">
                Métrica: {metricLabels[metric || 'stock_level']} • {product_id !== 'TODOS' ? `Produto: ${product_id}` : 'Todos os produtos'}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Melhor Canal</p>
            <p className="text-2xl font-bold text-green-700">{melhor_canal}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Pior Canal</p>
            <p className="text-2xl font-bold text-red-700">{pior_canal}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {canais?.map((canal, idx) => {
              const valor = metric === 'stock_level' ? canal.total_estoque : parseFloat(metric === 'turnover' ? canal.turnover_anual : canal.preco_medio);
              const porcentagem = (valor / maxValue) * 100;
              const isTop = canal.channel_id === melhor_canal;

              return (
                <div key={idx} className={`p-4 rounded-lg border-2 ${isTop ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isTop && <span className="text-green-600">👑</span>}
                      <span className="font-semibold">{canal.channel_id}</span>
                    </div>
                    <span className="text-sm text-gray-600">{canal.produtos} produtos</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div className={`h-3 rounded-full ${isTop ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${porcentagem}%` }} />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Estoque</p>
                      <p className="font-semibold">{canal.total_estoque.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Valor</p>
                      <p className="font-semibold">R$ {parseFloat(canal.valor_estoque).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Turnover</p>
                      <p className="font-semibold">{canal.turnover_anual}x</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Preço Médio</p>
                      <p className="font-semibold">R$ {parseFloat(canal.preco_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
