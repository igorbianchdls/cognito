'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, AlertCircle } from 'lucide-react';

interface RevenueComparison {
  periodo_anterior: { data_de: string; data_ate: string };
  receita_anterior: number;
  pedidos_anterior: number;
  aov_anterior: number;
  crescimento_receita_percentual: number;
  crescimento_pedidos_percentual: number;
  crescimento_aov_percentual: number;
}

interface RevenueMetrics {
  periodo: { data_de: string; data_ate: string };
  receita_total: number;
  numero_pedidos: number;
  aov: number;
  desconto_total: number;
  frete_total: number;
  receita_liquida: number;
  comparacao?: RevenueComparison;
}

interface RevenueMetricsResultProps {
  success: boolean;
  data: RevenueMetrics | null;
  error?: string;
  message?: string;
}

export default function RevenueMetricsResult({
  success,
  data,
  error,
  message
}: RevenueMetricsResultProps) {
  if (!success || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Calcular Métricas de Receita</CardTitle>
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

  const formatPercent = (value: number) =>
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getGrowthBadge = (percent: number, label: string) => {
    const isPositive = percent >= 0;
    return (
      <Badge className={`${isPositive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {label}: {formatPercent(percent)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Métricas de Receita</CardTitle>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              {new Date(data.periodo.data_de).toLocaleDateString('pt-BR')} - {new Date(data.periodo.data_ate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          <CardDescription className="text-blue-700">
            {message || 'Análise de performance financeira de vendas'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Receita Total - Destaque */}
          <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">Receita Total</p>
              <p className="text-5xl font-bold text-blue-600">
                {formatCurrency(data.receita_total)}
              </p>
              {data.comparacao && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {getGrowthBadge(data.comparacao.crescimento_receita_percentual, 'Crescimento')}
                </div>
              )}
            </div>
          </div>

          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 gap-4">
            {/* AOV (Ticket Médio) */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">AOV (Ticket Médio)</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.aov)}
              </p>
              {data.comparacao && (
                <div className="mt-2">
                  {getGrowthBadge(data.comparacao.crescimento_aov_percentual, 'vs anterior')}
                </div>
              )}
            </div>

            {/* Número de Pedidos */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-700">Pedidos</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {data.numero_pedidos.toLocaleString('pt-BR')}
              </p>
              {data.comparacao && (
                <div className="mt-2">
                  {getGrowthBadge(data.comparacao.crescimento_pedidos_percentual, 'vs anterior')}
                </div>
              )}
            </div>

            {/* Desconto Total */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-700">Desconto Total</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(data.desconto_total)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {data.receita_total > 0 ? `${((data.desconto_total / data.receita_total) * 100).toFixed(1)}%` : '0%'} da receita
              </p>
            </div>

            {/* Receita Líquida */}
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-semibold text-teal-700">Receita Líquida</p>
              </div>
              <p className="text-2xl font-bold text-teal-600">
                {formatCurrency(data.receita_liquida)}
              </p>
              <p className="text-xs text-teal-600 mt-1">
                Após descontos
              </p>
            </div>
          </div>

          {/* Frete Total */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frete Total Cobrado</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(data.frete_total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Média por pedido</p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatCurrency(data.numero_pedidos > 0 ? data.frete_total / data.numero_pedidos : 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Comparação com Período Anterior */}
          {data.comparacao && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-3">Comparação com Período Anterior</p>
              <div className="text-xs text-blue-600 mb-2">
                {new Date(data.comparacao.periodo_anterior.data_de).toLocaleDateString('pt-BR')} - {new Date(data.comparacao.periodo_anterior.data_ate).toLocaleDateString('pt-BR')}
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-blue-600">Receita Anterior:</p>
                  <p className="font-semibold text-blue-700">{formatCurrency(data.comparacao.receita_anterior)}</p>
                </div>
                <div>
                  <p className="text-blue-600">Pedidos Anterior:</p>
                  <p className="font-semibold text-blue-700">{data.comparacao.pedidos_anterior.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-blue-600">AOV Anterior:</p>
                  <p className="font-semibold text-blue-700">{formatCurrency(data.comparacao.aov_anterior)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
