'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Package, TrendingDown } from 'lucide-react';

interface SlowMovingItem {
  product_id: string;
  channel_id: string;
  quantidade_estoque: number;
  valor_unitario: string;
  valor_total_imobilizado: string;
  dias_sem_movimentacao: string;
  recomendacao: string;
}

interface SlowMovingItemsResultProps {
  success: boolean;
  message: string;
  criterio_dias?: number;
  valor_minimo_filtro?: number;
  total_slow_moving_items?: number;
  valor_total_imobilizado?: string;
  slow_moving_items?: SlowMovingItem[];
}

export default function SlowMovingItemsResult({
  success,
  message,
  criterio_dias,
  valor_minimo_filtro,
  total_slow_moving_items,
  valor_total_imobilizado,
  slow_moving_items
}: SlowMovingItemsResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Identificação de Itens de Baixo Giro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getRecomendacaoColor = (recomendacao: string) => {
    if (recomendacao.includes('Liquidar urgentemente')) return 'border-l-red-500 bg-red-50';
    if (recomendacao.includes('Promover')) return 'border-l-orange-500 bg-orange-50';
    return 'border-l-yellow-500 bg-yellow-50';
  };

  const getRecomendacaoIcon = (recomendacao: string) => {
    if (recomendacao.includes('Liquidar urgentemente')) return '🚨';
    if (recomendacao.includes('Promover')) return '⚠️';
    return '📦';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-red-900">📊 Itens de Baixo Giro (Dead Stock)</h3>
              <p className="text-sm text-red-700 mt-1">
                Critério: &gt;{criterio_dias} dias sem movimentação
                {valor_minimo_filtro && valor_minimo_filtro > 0 && ` • Valor mínimo: R$ ${valor_minimo_filtro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Itens Parados</p>
                <p className="text-3xl font-bold text-red-700">{total_slow_moving_items || 0}</p>
                <p className="text-xs text-gray-500 mt-1">produtos sem movimentação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Capital Imobilizado</p>
                <p className="text-3xl font-bold text-orange-700">
                  R$ {parseFloat(valor_total_imobilizado || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">valor total parado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Itens */}
      {slow_moving_items && slow_moving_items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos de Baixo Giro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slow_moving_items.map((item, idx) => (
                <div key={idx} className={`border-l-4 rounded-lg p-4 ${getRecomendacaoColor(item.recomendacao)}`}>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getRecomendacaoIcon(item.recomendacao)}</span>
                        <p className="font-semibold text-sm">{item.product_id}</p>
                      </div>
                      <p className="text-xs text-gray-600">{item.channel_id}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.dias_sem_movimentacao} dias sem movimentação</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Quantidade</p>
                      <p className="font-semibold text-sm">{item.quantidade_estoque.toLocaleString()} un</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Valor Unitário</p>
                      <p className="font-semibold text-sm">R$ {parseFloat(item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Valor Total</p>
                      <p className="font-semibold text-sm text-red-600">
                        R$ {parseFloat(item.valor_total_imobilizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700">
                      💡 Recomendação: <span className="font-normal">{item.recomendacao}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 text-5xl mb-3">✅</div>
            <p className="text-green-800 font-semibold text-lg">Nenhum item de baixo giro detectado!</p>
            <p className="text-sm text-green-600 mt-2">
              Todos os produtos têm movimentação adequada nos últimos {criterio_dias} dias
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights e Ações */}
      {slow_moving_items && slow_moving_items.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Ações Recomendadas:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">🚨</span>
                <span><strong>Alto valor imobilizado:</strong> Priorize liquidação de itens com valor &gt; R$ 5.000</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">⚠️</span>
                <span><strong>Valor médio:</strong> Considere promoções ou devoluções ao fornecedor (R$ 1.000 - R$ 5.000)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">📦</span>
                <span><strong>Baixo valor:</strong> Avaliar descontinuação ou baixa de estoque (R$ 0 - R$ 1.000)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💰</span>
                <span><strong>Liberação de capital:</strong> Transformar R$ {parseFloat(valor_total_imobilizado || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })} parado em capital de giro</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
