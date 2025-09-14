'use client';

import { Calendar, Clock, Database, TrendingUp, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface DateColumn {
  column_name: string;
  data_type: string;
}

interface TimelineOverview {
  oldestRecord: string;
  newestRecord: string;
  totalDays: number;
  totalRecords: number;
  uniqueDays: number;
  dataQuality: number;
  coverageDays: string;
}

interface Period {
  label: string;
  start: string;
  end: string;
  recordCount: number;
  sqlCondition: string;
  recommended: boolean;
}

interface SuggestedPeriods {
  last7Days: Period;
  last30Days: Period;
  last90Days: Period;
}

interface Recommendations {
  bestPeriod: string;
  dataFreshness: string;
  analysisReadiness: string;
  suggestedAnalysis: string;
}

interface SqlExamples {
  recentData: string;
  dailyAggregation: string;
  fullTimelineOverview: string;
}

interface TimelineContextProps {
  success?: boolean;
  error?: string;
  tableName?: string;
  datasetId?: string;
  projectId?: string;
  primaryDateColumn?: string;
  executionTime?: number;
  detectedDateColumns?: DateColumn[];
  timelineOverview?: TimelineOverview;
  suggestedPeriods?: SuggestedPeriods;
  recommendations?: Recommendations;
  sqlExamples?: SqlExamples;
}

const freshnessConfig = {
  fresh: { icon: TrendingUp, color: 'text-green-600', label: 'Dados Recentes', bgColor: 'bg-green-50 border-green-200' },
  stale: { icon: AlertCircle, color: 'text-orange-600', label: 'Dados Desatualizados', bgColor: 'bg-orange-50 border-orange-200' }
};

const readinessConfig = {
  ready: { icon: CheckCircle, color: 'text-green-600', label: 'Pronto para Análise' },
  limited: { icon: AlertCircle, color: 'text-orange-600', label: 'Dados Limitados' }
};

export default function TimelineContext({
  success = false,
  error,
  tableName,
  datasetId,
  primaryDateColumn,
  executionTime,
  detectedDateColumns = [],
  timelineOverview,
  suggestedPeriods,
  recommendations,
  sqlExamples
}: TimelineContextProps) {

  if (error || !success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Erro no Contexto Temporal</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm">{error || 'Erro desconhecido na análise temporal'}</p>
        </CardContent>
      </Card>
    );
  }

  const freshnessInfo = recommendations?.dataFreshness ? freshnessConfig[recommendations.dataFreshness as keyof typeof freshnessConfig] : null;
  const readinessInfo = recommendations?.analysisReadiness ? readinessConfig[recommendations.analysisReadiness as keyof typeof readinessConfig] : null;

  return (
    <div className="space-y-4">
      {/* Header com informações da tabela */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contexto Temporal Analisado</h3>
                <p className="text-sm text-gray-600">
                  Tabela <span className="font-medium">{tableName}</span> - Coluna principal: <span className="font-mono text-blue-600">{primaryDateColumn}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {executionTime && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {executionTime}ms
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Overview */}
      {timelineOverview && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Visão Geral do Timeline
            </h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{timelineOverview.totalRecords.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total de Registros</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{timelineOverview.totalDays}</div>
                <div className="text-xs text-gray-600">Dias de Cobertura</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{timelineOverview.dataQuality}%</div>
                <div className="text-xs text-gray-600">Qualidade dos Dados</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{timelineOverview.uniqueDays}</div>
                <div className="text-xs text-gray-600">Dias com Dados</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-800">Período dos Dados</div>
                  <div className="text-xs text-blue-600">{timelineOverview.coverageDays}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-blue-800">
                    {timelineOverview.oldestRecord} → {timelineOverview.newestRecord}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Períodos Sugeridos */}
      {suggestedPeriods && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              Períodos Sugeridos para Análise
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(suggestedPeriods).map(([key, period]) => (
                <div key={key} className={`p-4 rounded-lg border ${period.recommended ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{period.label}</span>
                      {period.recommended && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-blue-600">
                      {period.recordCount.toLocaleString()} registros
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    {period.start} até {period.end}
                  </div>

                  <div className="bg-gray-900 rounded p-2">
                    <code className="text-xs text-green-400 font-mono">
                      {period.sqlCondition}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recommendations && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Recomendações de Análise
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Status da Qualidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {freshnessInfo && (
                  <div className={`p-3 rounded-lg border ${freshnessInfo.bgColor}`}>
                    <div className="flex items-center gap-2">
                      <freshnessInfo.icon className={`h-4 w-4 ${freshnessInfo.color}`} />
                      <span className="text-sm font-medium text-gray-900">{freshnessInfo.label}</span>
                    </div>
                  </div>
                )}

                {readinessInfo && (
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2">
                      <readinessInfo.icon className={`h-4 w-4 ${readinessInfo.color}`} />
                      <span className="text-sm font-medium text-gray-900">{readinessInfo.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recomendação Principal */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Recomendação Principal</span>
                </div>
                <p className="text-sm text-purple-700">{recommendations.suggestedAnalysis}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Melhor período: <span className="font-mono">{recommendations.bestPeriod}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colunas de Data Detectadas */}
      {detectedDateColumns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-600" />
              Colunas de Data Detectadas ({detectedDateColumns.length})
            </h4>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {detectedDateColumns.map((col, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="font-mono text-sm text-blue-600">{col.column_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {col.data_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SQL Examples */}
      {sqlExamples && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              Exemplos de SQL
            </h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Dados Recentes:</label>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                    {sqlExamples.recentData}
                  </code>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Agregação Diária:</label>
                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                  <code className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                    {sqlExamples.dailyAggregation}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}