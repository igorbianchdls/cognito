'use client';

import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
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
  explicacao?: string;
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

// Render chart component based on type
const renderChart = (chart: ChartData) => {
  // Debug: Log completo do que chega no renderChart
  console.log('📊 RENDER CHART:', {
    title: chart.title,
    type: chart.chartType,
    hasChartData: !!chart.chartData,
    dataLength: chart.chartData?.length || 0,
    firstDataPoint: chart.chartData?.[0],
    totalRecords: chart.totalRecords,
    success: chart.success
  });

  if (!chart.chartData) {
    console.log('❌ SEM CHARTDATA para:', chart.title);
    return <div style={{ padding: '20px', color: 'red' }}>ERRO: Sem chartData para {chart.title}</div>;
  }

  if (chart.chartData.length === 0) {
    console.log('❌ CHARTDATA VAZIO para:', chart.title);
    return <div style={{ padding: '20px', color: 'orange' }}>ERRO: chartData vazio para {chart.title}</div>;
  }

  console.log('✅ RENDERIZANDO CHART:', chart.chartType, 'com', chart.chartData.length, 'pontos');

  switch (chart.chartType) {
    case 'bar':
      return (
        <div style={{ height: '400px', width: '100%' }}>
          <BarChart data={chart.chartData} />
        </div>
      );
    case 'line':
      return (
        <div style={{ height: '400px', width: '100%' }}>
          <LineChart data={chart.chartData} />
        </div>
      );
    case 'pie':
      return (
        <div style={{ height: '400px', width: '100%' }}>
          <PieChart data={chart.chartData} />
        </div>
      );
    default:
      console.log('❌ TIPO INVÁLIDO:', chart.chartType);
      return <div style={{ padding: '20px', color: 'red' }}>ERRO: Tipo inválido {chart.chartType}</div>;
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

  return (
    <div className="space-y-6">
      {/* Success Summary */}
      {summary.successful > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📊</span>
            <span className="font-medium text-blue-800">
              {dashboardTitle}
            </span>
          </div>
          <div className="text-blue-700 text-sm mt-1">
            {summary.successful} de {summary.total} gráficos gerados • 📅 {new Date(metadata.generatedAt).toLocaleString('pt-BR')}
            {summary.failed > 0 && ` • ${summary.failed} erro${summary.failed !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}

      {/* Successful Charts - Multiple Independent Artifacts */}
      {successfulCharts.map((chart, index) => (
        <div key={index}>
          {/* Explicação acima do Artifact */}
          {chart.explicacao && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-blue-800 text-sm">
                📊 {chart.explicacao}
              </p>
            </div>
          )}

          {/* Artifact com gráfico */}
          <Artifact>
            <ArtifactHeader>
              <div className="flex-1 min-w-0">
                <ArtifactTitle>{chart.title}</ArtifactTitle>
                {chart.description && (
                  <ArtifactDescription>{chart.description}</ArtifactDescription>
                )}
              </div>
            </ArtifactHeader>

            <ArtifactContent className="p-0">
              <div style={{ padding: '16px' }}>
                {renderChart(chart)}

                {/* Chart Metadata Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Registros: {chart.totalRecords || 0}</span>
                    <span>Tipo: {chart.chartType}</span>
                    <span>Agregação: {chart.aggregation}</span>
                  </div>
                </div>
              </div>
            </ArtifactContent>
          </Artifact>
        </div>
      ))}

      {/* Failed Charts */}
      {failedCharts.map((chart, index) => (
        <Artifact key={`error-${index}`}>
          <ArtifactHeader>
            <div className="flex-1 min-w-0">
              <ArtifactTitle>{chart.title}</ArtifactTitle>
              <ArtifactDescription>Erro na geração do gráfico</ArtifactDescription>
            </div>
          </ArtifactHeader>

          <ArtifactContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <span className="font-medium text-red-800">Falha na execução</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{chart.error}</p>
            </div>
          </ArtifactContent>
        </Artifact>
      ))}

      {/* No Charts Available */}
      {successfulCharts.length === 0 && failedCharts.length === 0 && (
        <Artifact>
          <ArtifactHeader>
            <ArtifactTitle>Dashboard Shopify</ArtifactTitle>
            <ArtifactDescription>Nenhum gráfico disponível</ArtifactDescription>
          </ArtifactHeader>

          <ArtifactContent>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum gráfico disponível
              </h3>
              <p className="text-gray-600">
                Não foi possível gerar gráficos para este dashboard.
              </p>
            </div>
          </ArtifactContent>
        </Artifact>
      )}

      {/* Global Metadata Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span>Tabela: {summary.table}</span>
          <span>Fonte: {metadata.dataSource}</span>
        </div>
      </div>
    </div>
  );
}