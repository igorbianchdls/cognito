'use client';

import { GenerativeChart } from './GenerativeChart';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent
} from '@/components/ai-elements/artifact';

interface ChartData {
  success: boolean;
  chartData?: Array<{
    x: string;
    y: number;
    label: string;
    value: number;
  }>;
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  xColumn?: string;
  yColumn?: string;
  aggregation?: string;
  sqlQuery?: string;
  totalRecords?: number;
  metadata?: {
    generatedAt: string;
    dataSource: string;
  };
  error?: string;
}

interface MultipleChartsProps {
  dashboardTitle: string;
  charts: ChartData[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    table: string;
  };
  metadata: {
    generatedAt: string;
    dataSource: string;
  };
}

// Function to determine optimal grid layout based on chart count
const getGridLayout = (count: number): string => {
  switch (count) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-1 lg:grid-cols-2';
    case 3:
      return 'grid-cols-1 lg:grid-cols-3';
    case 4:
      return 'grid-cols-1 md:grid-cols-2';
    case 5:
    case 6:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    default:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  }
};

export function MultipleCharts({
  dashboardTitle,
  charts,
  summary,
  metadata
}: MultipleChartsProps) {
  const successfulCharts = charts.filter(chart => chart.success && chart.chartData);
  const failedCharts = charts.filter(chart => !chart.success);

  const gridLayout = getGridLayout(successfulCharts.length);

  return (
    <Artifact>
      <ArtifactHeader>
        <div className="flex-1 min-w-0">
          <ArtifactTitle>{dashboardTitle}</ArtifactTitle>
          <ArtifactDescription>
            📊 {summary.successful} de {summary.total} gráficos • 📅 {new Date(metadata.generatedAt).toLocaleString('pt-BR')}
          </ArtifactDescription>
        </div>
      </ArtifactHeader>

      <ArtifactContent className="p-0">
        <div style={{ minHeight: '600px', padding: '16px' }}>
          {/* Success Summary */}
          {summary.successful > 0 && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="font-medium text-green-800">
                    Dashboard gerado com sucesso
                  </span>
                </div>
                <div className="text-green-700 text-sm mt-1">
                  {summary.successful} gráfico{summary.successful !== 1 ? 's' : ''} de análise Shopify
                  {summary.failed > 0 && ` • ${summary.failed} erro${summary.failed !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          {successfulCharts.length > 0 && (
            <div className={`grid ${gridLayout} gap-6 mb-6`}>
              {successfulCharts.map((chart, index) => (
                <div key={index} className="min-h-[400px]">
                  <GenerativeChart
                    data={chart.chartData!}
                    chartType={chart.chartType}
                    title={chart.title}
                    description={chart.description}
                    xColumn={chart.xColumn || ''}
                    yColumn={chart.yColumn || ''}
                    sqlQuery={chart.sqlQuery || ''}
                    totalRecords={chart.totalRecords || 0}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Failed Charts */}
          {failedCharts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Gráficos com erro ({failedCharts.length}):
              </h4>
              {failedCharts.map((chart, index) => (
                <div key={`error-${index}`} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="font-medium text-red-800">{chart.title}</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{chart.error}</p>
                </div>
              ))}
            </div>
          )}

          {/* No Charts Available */}
          {successfulCharts.length === 0 && failedCharts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum gráfico disponível
              </h3>
              <p className="text-gray-600">
                Não foi possível gerar gráficos para este dashboard.
              </p>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Tabela: {summary.table}</span>
              <span>Fonte: {metadata.dataSource}</span>
            </div>
          </div>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}