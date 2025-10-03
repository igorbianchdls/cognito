'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { CopyIcon, DownloadIcon, DatabaseIcon, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart2, TrendingUp, Table as TableIcon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import SQLDataResults from '@/components/tools/SQLDataResults';

interface ChartData {
  success: boolean;
  type?: 'chart' | 'table';
  chartData?: Array<{
    x: string;
    y: number;
    label: string;
    value: number;
  }>;
  tableData?: Record<string, unknown>[];
  chartType: 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area' | 'table';
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

export function MultipleCharts({
  dashboardTitle,
  charts,
  summary,
  metadata
}: MultipleChartsProps) {
  const successfulCharts = charts.filter(chart => chart.success && (chart.chartData || chart.tableData));
  const failedCharts = charts.filter(chart => !chart.success);

  // State management para múltiplos charts
  const [chartTypes, setChartTypes] = useState<Record<number, 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area' | 'table'>>(() => {
    const initialTypes: Record<number, 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area' | 'table'> = {};
    charts.forEach((chart, index) => {
      initialTypes[index] = chart.chartType;
    });
    return initialTypes;
  });

  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});
  const [showTableStates, setShowTableStates] = useState<Record<number, boolean>>({});
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Renderização de tabela com dados do gráfico
  const renderTable = (chart: ChartData) => {
    if (!chart.chartData) return null;

    return (
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>X ({chart.xColumn || 'x'})</TableHead>
              <TableHead>Y ({chart.yColumn || 'y'})</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chart.chartData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.x}</TableCell>
                <TableCell>{row.y}</TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render chart component based on type and current state
  const renderChart = (chart: ChartData, index: number) => {
    // Se é uma tabela, renderiza SQLDataResults
    if (chart.type === 'table' || chart.chartType === 'table') {
      console.log('📊 RENDER TABLE:', {
        title: chart.title,
        hasTableData: !!chart.tableData,
        dataLength: chart.tableData?.length || 0,
        success: chart.success
      });

      return (
        <SQLDataResults
          data={chart.tableData || []}
          sqlQuery={chart.sqlQuery}
          explicacao={chart.explicacao}
          rowsReturned={chart.totalRecords}
          success={chart.success}
          error={chart.error}
        />
      );
    }

    // Para gráficos, renderiza chart components
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
        return <BarChart data={chart.chartData} seriesLabel={chart.yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'line':
        return <LineChart data={chart.chartData} seriesLabel={chart.yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'pie':
        return <PieChart data={chart.chartData} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'horizontal-bar':
        return <BarChart data={chart.chartData} layout="horizontal" seriesLabel={chart.yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'area':
        return <AreaChart data={chart.chartData} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      default:
        console.log('❌ TIPO INVÁLIDO:', currentType);
        return <div style={{ padding: '20px', color: 'red' }}>ERRO: Tipo inválido {currentType}</div>;
    }
  };

  // Função para obter ícone baseado no tipo de gráfico
  const getChartIcon = (type: 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area' | 'table') => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'line': return LineChartIcon;
      case 'pie': return PieChartIcon;
      case 'horizontal-bar': return BarChart2;
      case 'area': return TrendingUp;
      case 'table': return TableIcon;
      default: return BarChart3;
    }
  };

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Verificar se o clique foi fora de qualquer dropdown aberto
      const updatedDropdowns = { ...openDropdowns };
      let hasChanges = false;

      Object.keys(openDropdowns).forEach(indexStr => {
        const index = parseInt(indexStr);
        if (openDropdowns[index]) {
          const dropdownRef = dropdownRefs.current[index];
          if (dropdownRef && !dropdownRef.contains(target)) {
            updatedDropdowns[index] = false;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setOpenDropdowns(updatedDropdowns);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdowns]);

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
          {/* Header para TABELAS - fora do artifact */}
          {(chart.type === 'table' || chart.chartType === 'table') ? (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="font-semibold text-blue-800">Resultados da Query SQL</h3>
                </div>
                <div className="text-sm text-blue-600">
                  {chart.totalRecords || 0} registros
                </div>
              </div>

              {chart.explicacao && (
                <p className="text-blue-700 text-sm mb-2">{chart.explicacao}</p>
              )}

              {chart.sqlQuery && (
                <div className="p-2 bg-blue-100 rounded text-xs text-blue-800 font-mono">
                  {chart.sqlQuery}
                </div>
              )}
            </div>
          ) : (
            /* Explicação para GRÁFICOS - mantém como estava */
            chart.explicacao && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-blue-800 text-sm">
                  📊 {chart.explicacao}
                </p>
              </div>
            )
          )}

          {/* Artifact com gráfico ou tabela */}
          <Artifact>
            <ArtifactHeader>
              <div className="flex-1 min-w-0">
                <ArtifactTitle>{chart.title}</ArtifactTitle>
                <ArtifactDescription>
                  {chart.description || `📊 ${chart.totalRecords || 0} registros • 🔍 ${chart.sqlQuery && chart.sqlQuery.length > 60 ? chart.sqlQuery.substring(0, 60) + '...' : chart.sqlQuery || 'Query executada'}`}
                </ArtifactDescription>
              </div>
              <ArtifactActions>
                <div
                  className="relative"
                  ref={(el) => {
                    dropdownRefs.current[index] = el;
                  }}
                >
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
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
                      {[
                        { type: 'bar' as const, label: 'Bar Chart', icon: BarChart3 },
                        { type: 'line' as const, label: 'Line Chart', icon: LineChartIcon },
                        { type: 'pie' as const, label: 'Pie Chart', icon: PieChartIcon },
                        { type: 'horizontal-bar' as const, label: 'Horizontal Bar', icon: BarChart2 },
                        { type: 'area' as const, label: 'Area Chart', icon: TrendingUp }
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
                  icon={TableIcon}
                  tooltip={showTableStates[index] ? "Visualizar como gráfico" : "Visualizar como tabela"}
                  onClick={() => setShowTableStates(prev => ({
                    ...prev,
                    [index]: !prev[index]
                  }))}
                />
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
              <div style={{
                height: (chart.type === 'table' || chart.chartType === 'table') ? 'auto' : '400px',
                width: '100%'
              }}>
                {showTableStates[index] ? renderTable(chart) : renderChart(chart, index)}
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