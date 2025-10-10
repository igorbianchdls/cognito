'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, AlertTriangle, Percent, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ProdutoMetrica {
  product_id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock_quantity: number;
  unidades_vendidas: number;
  receita_total: number;
  margem_percentual: number;
  sell_through_rate: number;
  devolucoes: number;
}

interface ProductPerformance {
  periodo: { data_de: string; data_ate: string };
  resumo: {
    total_produtos: number;
    produtos_com_vendas: number;
    unidades_vendidas_total: number;
    receita_total: number;
    margem_media_percentual: number;
  };
  top_produtos_por_receita: ProdutoMetrica[];
  produtos_baixo_sell_through: ProdutoMetrica[];
}

interface ProductPerformanceResultProps {
  success: boolean;
  data: ProductPerformance | null;
  error?: string;
  message?: string;
}

export default function ProductPerformanceResult({
  success,
  data,
  error,
  message
}: ProductPerformanceResultProps) {
  const [showTopProdutos, setShowTopProdutos] = useState(false);
  const [showBaixoSellThrough, setShowBaixoSellThrough] = useState(false);

  if (!success || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Analisar Performance de Produtos</CardTitle>
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

  const getMargemColor = (margem: number) => {
    if (margem >= 30) return 'bg-green-100 text-green-800 border-green-300';
    if (margem >= 15) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getSellThroughColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-orange-100 text-orange-800 border-orange-300';
  };

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-emerald-800">Performance de Produtos</CardTitle>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
              {new Date(data.periodo.data_de).toLocaleDateString('pt-BR')} - {new Date(data.periodo.data_ate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          <CardDescription className="text-emerald-700">
            {message || 'Análise de best-sellers, sell-through e margem'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-white rounded-lg p-6 border-2 border-emerald-300">
            <p className="text-sm font-semibold text-gray-600 mb-4">RESUMO GERAL</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Total Produtos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data.resumo.total_produtos}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Com Vendas</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {data.resumo.produtos_com_vendas}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Unidades Vendidas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.resumo.unidades_vendidas_total.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.resumo.receita_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Margem Média - Destaque */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Margem Média</p>
                  <p className="text-3xl font-bold text-green-600">
                    {data.resumo.margem_media_percentual.toFixed(1)}%
                  </p>
                </div>
              </div>
              <Badge className={getMargemColor(data.resumo.margem_media_percentual)}>
                {data.resumo.margem_media_percentual >= 30 ? 'Excelente' : data.resumo.margem_media_percentual >= 15 ? 'Boa' : 'Baixa'}
              </Badge>
            </div>
          </div>

          {/* Top Produtos por Receita */}
          {data.top_produtos_por_receita && data.top_produtos_por_receita.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowTopProdutos(!showTopProdutos)}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 w-full"
              >
                {showTopProdutos ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <TrendingUp className="h-4 w-4" />
                Top {data.top_produtos_por_receita.length} Best-Sellers por Receita
              </button>

              {showTopProdutos && (
                <div className="mt-4 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.top_produtos_por_receita.map((produto, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-emerald-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">#{idx + 1}</Badge>
                              <p className="font-semibold text-gray-900">{produto.name}</p>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>SKU: {produto.sku}</span>
                              <span>Categoria: {produto.category}</span>
                            </div>
                            <div className="flex gap-3 mt-2">
                              <Badge className={getMargemColor(produto.margem_percentual)} variant="outline">
                                Margem: {produto.margem_percentual.toFixed(1)}%
                              </Badge>
                              <Badge className={getSellThroughColor(produto.sell_through_rate)} variant="outline">
                                Sell-through: {produto.sell_through_rate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-emerald-600">
                              {formatCurrency(produto.receita_total)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {produto.unidades_vendidas} unidades
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(produto.price)} / unidade
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Produtos com Baixo Sell-Through - Alerta */}
          {data.produtos_baixo_sell_through && data.produtos_baixo_sell_through.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowBaixoSellThrough(!showBaixoSellThrough)}
                className="flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-900 w-full"
              >
                {showBaixoSellThrough ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <AlertTriangle className="h-4 w-4" />
                ⚠️ {data.produtos_baixo_sell_through.length} Produtos com Baixo Sell-Through (&lt;50%)
              </button>

              {showBaixoSellThrough && (
                <div className="mt-4 bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-700 mb-3">
                    Produtos com baixa taxa de venda em relação ao estoque disponível. Considere ações de marketing ou revisão de preço.
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.produtos_baixo_sell_through.map((produto, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-orange-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{produto.name}</p>
                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                              <span>SKU: {produto.sku}</span>
                              <span>Estoque: {produto.stock_quantity}</span>
                              <span>Vendidos: {produto.unidades_vendidas}</span>
                            </div>
                            <div className="mt-2">
                              <Badge className={getSellThroughColor(produto.sell_through_rate)} variant="outline">
                                Sell-through: {produto.sell_through_rate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(produto.price)}
                            </p>
                            <p className="text-xs text-orange-600">
                              Margem: {produto.margem_percentual.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
