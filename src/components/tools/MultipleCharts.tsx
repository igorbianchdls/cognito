'use client';

import { useState, useEffect } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { CopyIcon, DownloadIcon, DatabaseIcon, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

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

// Render chart component based on type and current state
const renderChart = (chart: ChartData, index: number) => {
  const currentType = chartTypes[index] || chart.chartType;

  // Debug: Log completo do que chega no renderChart
  console.log('📊 RENDER CHART:', {
    title: chart.title,
    originalType: chart.chartType,
    currentType: currentType,
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

  console.log('✅ RENDERIZANDO CHART:', currentType, 'com', chart.chartData.length, 'pontos');

  switch (currentType) {
    case 'bar':
      return <BarChart data={chart.chartData} />;
    case 'line':
      return <LineChart data={chart.chartData} />;
    case 'pie':
      return <PieChart data={chart.chartData} />;
    default:
      console.log('❌ TIPO INVÁLIDO:', currentType);
      return <div style={{ padding: '20px', color: 'red' }}>ERRO: Tipo inválido {currentType}</div>;
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

  // State management para múltiplos charts
  const [chartTypes, setChartTypes] = useState<Record<number, 'bar' | 'line' | 'pie'>>(() => {
    const initialTypes: Record<number, 'bar' | 'line' | 'pie'> = {};
    charts.forEach((chart, index) => {
      initialTypes[index] = chart.chartType;
    });
    return initialTypes;
  });

  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  // Função para obter ícone baseado no tipo de gráfico
  const getChartIcon = (type: 'bar' | 'line' | 'pie') => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'line': return LineChartIcon;
      case 'pie': return PieChartIcon;
      default: return BarChart3;
    }
  };

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setOpenDropdowns({});
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler para copiar dados do gráfico
  const handleCopyData = async (chartData: Array<{x: string; y: number; label: string; value: number}>) => {
    try {
      const dataText = JSON.stringify(chartData, null, 2);
      await navigator.clipboard.writeText(dataText);
      console.log('Dados copiados para clipboard');
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
    }
  };

  // Handler para download como CSV
  const handleDownload = (chartData: Array<{x: string; y: number; label: string; value: number}>, title: string) => {
    const headers = ['x', 'y', 'label', 'value'];
    const csvContent = [
      headers.join(','),
      ...chartData.map(row => `"${row.x}",${row.y},"${row.label}",${row.value}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
    link.click();
  };

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
                <ArtifactDescription>
                  {chart.description || `📊 ${chart.totalRecords || 0} registros • 🔍 ${chart.sqlQuery && chart.sqlQuery.length > 60 ? chart.sqlQuery.substring(0, 60) + '...' : chart.sqlQuery || 'Query executada'}`}
                </ArtifactDescription>
              </div>
              <ArtifactActions>
                <div className="relative">
                  <ArtifactAction
                    icon={getChartIcon(chartTypes[index] || chart.chartType)}
                    tooltip="Alterar tipo de gráfico"
                    onClick={() => setOpenDropdowns(prev => ({
                      ...prev,
                      [index]: !prev[index]
                    }))}
                  />
                  {/* Dropdown para seleção de chart */}
                  {openDropdowns[index] && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
                      {[
                        { type: 'bar' as const, label: 'Bar Chart', icon: BarChart3 },
                        { type: 'line' as const, label: 'Line Chart', icon: LineChartIcon },
                        { type: 'pie' as const, label: 'Pie Chart', icon: PieChartIcon }
                      ].map(({ type, label, icon: Icon }) => (
                        <button
                          key={type}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            (chartTypes[index] || chart.chartType) === type ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setChartTypes(prev => ({ ...prev, [index]: type }));
                            setOpenDropdowns(prev => ({ ...prev, [index]: false }));
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ArtifactAction
                  icon={CopyIcon}
                  tooltip="Copiar dados do gráfico"
                  onClick={() => chart.chartData && handleCopyData(chart.chartData)}
                />
                <ArtifactAction
                  icon={DownloadIcon}
                  tooltip="Download como CSV"
                  onClick={() => chart.chartData && handleDownload(chart.chartData, chart.title)}
                />
                <ArtifactAction
                  icon={DatabaseIcon}
                  tooltip={`Tipo: ${chartTypes[index] || chart.chartType} • Colunas: ${chart.xColumn || 'x'} x ${chart.yColumn || 'y'}`}
                />
              </ArtifactActions>
            </ArtifactHeader>

            <ArtifactContent className="p-0">
              <div style={{ height: '400px', width: '100%' }}>
                {renderChart(chart, index)}
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