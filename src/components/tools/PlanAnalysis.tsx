'use client';

import { CheckCircle, Database, Calendar, Package, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface Query {
  purpose: string;
  description: string;
  suggestedSQL: string;
}

interface KeyColumns {
  dateColumn?: string;
  revenueColumn?: string;
  productColumn?: string;
}

interface DetectedCapabilities {
  hasDateData?: boolean;
  hasNumericData?: boolean;
  hasTextData?: boolean;
  canAnalyzeProducts?: boolean;
  canAnalyzeTemporal?: boolean;
}

interface PlanAnalysisProps {
  success?: boolean;
  error?: string;
  analysisType?: string;
  tableName?: string;
  totalColumns?: number;
  recommendedQueries?: Query[];
  keyColumns?: KeyColumns;
  detectedCapabilities?: DetectedCapabilities;
  nextStep?: string;
}

const analysisTypeConfig = {
  overview: { icon: Database, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Visão Geral' },
  products: { icon: Package, color: 'bg-green-50 text-green-700 border-green-200', label: 'Análise de Produtos' },
  customers: { icon: Users, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Análise de Clientes' },
  temporal: { icon: Calendar, color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Análise Temporal' },
  performance: { icon: TrendingUp, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Análise de Performance' },
  error: { icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Erro' }
};

export default function PlanAnalysis({
  success = false,
  error,
  analysisType = 'overview',
  tableName,
  totalColumns,
  recommendedQueries = [],
  keyColumns = {},
  detectedCapabilities = {},
  nextStep
}: PlanAnalysisProps) {

  if (error || !success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Erro no Planejamento</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm">{error || 'Erro desconhecido no planejamento da análise'}</p>
        </CardContent>
      </Card>
    );
  }

  const config = analysisTypeConfig[analysisType as keyof typeof analysisTypeConfig] || analysisTypeConfig.overview;
  const IconComponent = config.icon;

  return (
    <div className="space-y-4">
      {/* Header com tipo de análise */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${config.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plano de Análise Criado</h3>
                <p className="text-sm text-gray-600">
                  {config.label} para tabela <span className="font-medium">{tableName}</span>
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalColumns} colunas detectadas
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Capacidades detectadas */}
      {detectedCapabilities && Object.keys(detectedCapabilities).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Capacidades Detectadas
            </h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {detectedCapabilities.hasDateData && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Dados temporais</span>
                </div>
              )}
              {detectedCapabilities.hasNumericData && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Dados numéricos</span>
                </div>
              )}
              {detectedCapabilities.canAnalyzeProducts && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span>Análise de produtos</span>
                </div>
              )}
              {detectedCapabilities.canAnalyzeTemporal && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Análise temporal</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colunas chave identificadas */}
      {keyColumns && Object.values(keyColumns).some(col => col) && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900">Colunas Chave Identificadas</h4>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              {keyColumns.dateColumn && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-mono text-blue-600">{keyColumns.dateColumn}</span>
                </div>
              )}
              {keyColumns.revenueColumn && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-mono text-green-600">{keyColumns.revenueColumn}</span>
                </div>
              )}
              {keyColumns.productColumn && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">Produto:</span>
                  <span className="font-mono text-purple-600">{keyColumns.productColumn}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queries recomendadas */}
      {recommendedQueries.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Queries Recomendadas ({recommendedQueries.length})
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedQueries.map((query, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{query.purpose}</h5>
                      <p className="text-sm text-gray-600 mt-1">{query.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      Query {index + 1}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">SQL Sugerido:</label>
                    <div className="bg-gray-900 rounded-md p-3 overflow-x-auto">
                      <code className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                        {query.suggestedSQL}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos passos */}
      {nextStep && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Próximo Passo:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">{nextStep}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}