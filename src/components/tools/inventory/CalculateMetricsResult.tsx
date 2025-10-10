'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Package } from 'lucide-react';

interface MetricData {
  ratio?: string;
  classificacao?: string;
  saidas_periodo?: number;
  estoque_medio?: number;
  dias?: string;
  estoque_atual?: number;
  demanda_diaria?: string;
  percentual?: string;
  itens_esgotados?: number;
  total_itens?: number;
  total?: string;
  moeda?: string;
  itens_computados?: number;
  observacao?: string;
}

interface CalculateMetricsResultProps {
  success: boolean;
  message: string;
  product_id?: string;
  periodo_dias?: number;
  data_inicial?: string;
  metricas?: {
    turnover?: MetricData;
    coverage?: MetricData;
    stockout_rate?: MetricData;
    valor_imobilizado?: MetricData;
  };
}

export default function CalculateMetricsResult({ success, message, product_id, periodo_dias, metricas }: CalculateMetricsResultProps) {
  if (!success || !metricas) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro ao Calcular Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Excelente') || classification.includes('Ideal') || classification.includes('Alto (Excelente)')) {
      return 'text-green-600 bg-green-100';
    }
    if (classification.includes('Bom') || classification.includes('Médio (Bom)')) {
      return 'text-blue-600 bg-blue-100';
    }
    if (classification.includes('Atenção') || classification.includes('Baixo')) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">📊 Métricas de Inventário Calculadas</h3>
              <p className="text-sm text-blue-700 mt-1">
                {product_id !== 'TODOS' ? `Produto: ${product_id}` : 'Todos os produtos'} •
                Período: {periodo_dias} dias
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TURNOVER */}
        {metricas.turnover && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Giro de Estoque (Turnover)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-700">{metricas.turnover.ratio}</span>
                  <span className="text-sm text-gray-500">vezes/ano</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(metricas.turnover.classificacao || '')}`}>
                  {metricas.turnover.classificacao}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Saídas (período)</p>
                    <p className="font-semibold">{metricas.turnover.saidas_periodo?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Estoque médio</p>
                    <p className="font-semibold">{metricas.turnover.estoque_medio?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COVERAGE */}
        {metricas.coverage && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Cobertura de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">{metricas.coverage.dias}</span>
                  <span className="text-sm text-gray-500">dias</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(metricas.coverage.classificacao || '')}`}>
                  {metricas.coverage.classificacao}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Estoque atual</p>
                    <p className="font-semibold">{metricas.coverage.estoque_atual?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Demanda diária</p>
                    <p className="font-semibold">{metricas.coverage.demanda_diaria}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STOCKOUT RATE */}
        {metricas.stockout_rate && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Taxa de Ruptura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-700">{metricas.stockout_rate.percentual}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getClassificationColor(metricas.stockout_rate.classificacao || '')}`}>
                  {metricas.stockout_rate.classificacao}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Itens esgotados</p>
                    <p className="font-semibold text-red-600">{metricas.stockout_rate.itens_esgotados?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total de itens</p>
                    <p className="font-semibold">{metricas.stockout_rate.total_itens?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VALOR IMOBILIZADO */}
        {metricas.valor_imobilizado && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valor Imobilizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-700">
                    R$ {parseFloat(metricas.valor_imobilizado.total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded">
                  {metricas.valor_imobilizado.observacao}
                </div>
                <div className="pt-2 border-t text-sm">
                  <p className="text-gray-500">Itens computados</p>
                  <p className="font-semibold">{metricas.valor_imobilizado.itens_computados?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">💡 Insights Rápidos:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {metricas.turnover && parseFloat(metricas.turnover.ratio || '0') < 2 && (
                <li>Giro de estoque BAIXO - considere reduzir níveis de reposição ou promover produtos</li>
              )}
              {metricas.coverage && parseFloat(metricas.coverage.dias || '0') > 120 && (
                <li>Cobertura ALTA - capital imobilizado excessivo, avaliar oportunidades de liquidação</li>
              )}
              {metricas.stockout_rate && parseFloat(metricas.stockout_rate.percentual || '0') > 10 && (
                <li className="text-red-600 font-medium">Taxa de ruptura CRÍTICA - reposições urgentes necessárias!</li>
              )}
              {metricas.valor_imobilizado && parseFloat(metricas.valor_imobilizado.total || '0') > 100000 && (
                <li>Alto valor imobilizado - priorize otimização de estoque para liberar capital</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
