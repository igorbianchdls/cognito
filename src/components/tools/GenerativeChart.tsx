'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { EmptyState } from '@/components/charts/EmptyState';
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

interface ChartDataPoint {
  x: string;
  y: number;
  label: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface GenerativeChartProps {
  data?: ChartDataPoint[];
  chartType: 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area';
  title: string;
  description?: string;
  explicacao?: string;
  xColumn: string;
  yColumn: string;
  sqlQuery?: string;
  totalRecords?: number;
  error?: string;
  fallbackMode?: boolean;
}

export function GenerativeChart({
  data,
  chartType,
  title,
  description,
  explicacao,
  xColumn,
  yColumn,
  sqlQuery,
  totalRecords,
  error,
  fallbackMode
}: GenerativeChartProps) {
  const [currentChartType, setCurrentChartType] = useState<'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area'>(chartType);
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Verificar se há erro ou dados vazios
  const hasError = fallbackMode || error || !data || data.length === 0;
  const errorMessage = error || 'Não foi possível carregar os dados do BigQuery';

  // Função para obter ícone baseado no tipo de gráfico
  const getChartIcon = (type: 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area') => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'line': return LineChartIcon;
      case 'pie': return PieChartIcon;
      case 'horizontal-bar': return BarChart2;
      case 'area': return TrendingUp;
      default: return BarChart3;
    }
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChartSelector(false);
      }
    };

    if (showChartSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChartSelector]);

  // Renderização de tabela com dados do gráfico
  const renderTable = () => {
    if (!data || data.length === 0) {
      return <EmptyState message="Sem dados" subtitle="Nenhum dado disponível para exibir" />;
    }

    return (
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>X ({xColumn})</TableHead>
              <TableHead>Y ({yColumn})</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
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

  // Renderização condicional baseada no tipo de gráfico atual
  const renderChart = () => {
    // Verificação de segurança - não deve acontecer pois já verificamos hasError
    if (!data || data.length === 0) {
      return <EmptyState />;
    }

    switch (currentChartType) {
      case 'bar':
        return <BarChart data={data} seriesLabel={yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'line':
        return <LineChart data={data} seriesLabel={yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'pie':
        return <PieChart data={data} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'horizontal-bar':
        return <BarChart data={data} layout="horizontal" seriesLabel={yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      case 'area':
        return <AreaChart data={data} containerBorderColor="transparent" containerBorderAccentColor="transparent" />;
      default:
        return <BarChart data={data} seriesLabel={yColumn} containerBorderColor="transparent" containerBorderAccentColor="transparent" />; // fallback para bar
    }
  };

  // Handler para copiar dados do gráfico
  const handleCopyData = async () => {
    if (!data) return;

    try {
      const dataText = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(dataText);
      console.log('Dados copiados para clipboard');
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
    }
  };

  // Handler para download como CSV
  const handleDownload = () => {
    if (!data || data.length === 0) return;

    const headers = ['x', 'y', 'label', 'value'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => `"${row.x}",${row.y},"${row.label}",${row.value}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chart-data-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div>
      {/* Explicação acima do Artifact */}
      {explicacao && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-blue-800 text-sm">
            📊 {explicacao}
          </p>
        </div>
      )}

      {/* Artifact com gráfico */}
      <Artifact>
        <ArtifactHeader>
          <div className="flex-1 min-w-0">
            <ArtifactTitle>{title}</ArtifactTitle>
            <ArtifactDescription>
              {description || (totalRecords !== undefined && sqlQuery
                ? `📊 ${totalRecords} registros • 🔍 ${sqlQuery.length > 60 ? sqlQuery.substring(0, 60) + '...' : sqlQuery}`
                : `Gráfico ${chartType} • ${xColumn} x ${yColumn}`
              )}
            </ArtifactDescription>
          </div>
          <ArtifactActions>
            <div className="relative">
              <ArtifactAction
                icon={getChartIcon(currentChartType)}
                tooltip="Alterar tipo de gráfico"
                onClick={() => setShowChartSelector(!showChartSelector)}
              />
              {/* Dropdown para seleção de chart */}
              {showChartSelector && (
                <div ref={dropdownRef} className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
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
                        currentChartType === type ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setCurrentChartType(type);
                        setShowChartSelector(false);
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
              tooltip={showTable ? "Visualizar como gráfico" : "Visualizar como tabela"}
              onClick={() => setShowTable(!showTable)}
            />
            <ArtifactAction
              icon={CopyIcon}
              tooltip="Copiar dados do gráfico"
              onClick={handleCopyData}
            />
            <ArtifactAction
              icon={DownloadIcon}
              tooltip="Download como CSV"
              onClick={handleDownload}
            />
            <ArtifactAction
              icon={DatabaseIcon}
              tooltip={`Tipo: ${currentChartType} • Colunas: ${xColumn} x ${yColumn}`}
            />
          </ArtifactActions>
        </ArtifactHeader>

        <ArtifactContent className="p-0">
          <div style={{ height: '400px', width: '100%' }}>
            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50">
                <div className="text-center max-w-md">
                  <div className="text-red-600 text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Erro ao carregar dados
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    {errorMessage}
                  </p>
                  {sqlQuery && (
                    <div className="text-left bg-white p-3 rounded border border-red-200">
                      <p className="text-xs font-mono text-gray-600 mb-1">Query SQL:</p>
                      <p className="text-xs font-mono text-gray-800 break-all">{sqlQuery}</p>
                    </div>
                  )}
                  <p className="text-xs text-red-600 mt-3">
                    Verifique se a tabela existe, as colunas estão corretas e você tem permissões adequadas.
                  </p>
                </div>
              </div>
            ) : (
              showTable ? renderTable() : renderChart()
            )}
          </div>
        </ArtifactContent>
      </Artifact>
    </div>
  );
}