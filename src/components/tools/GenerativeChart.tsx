'use client';

import { useState, useEffect } from 'react';
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

interface ChartDataPoint {
  x: string;
  y: number;
  label: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface GenerativeChartProps {
  data: ChartDataPoint[];
  chartType: 'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area';
  title: string;
  description?: string;
  explicacao?: string;
  xColumn: string;
  yColumn: string;
  sqlQuery: string;
  totalRecords: number;
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
  totalRecords
}: GenerativeChartProps) {
  const [currentChartType, setCurrentChartType] = useState<'bar' | 'line' | 'pie' | 'horizontal-bar' | 'area'>(chartType);
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [showTable, setShowTable] = useState(false);

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
      if (showChartSelector) {
        setShowChartSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChartSelector]);

  // Renderização de tabela com dados do gráfico
  const renderTable = () => {
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
    switch (currentChartType) {
      case 'bar':
        return <BarChart data={data} />;
      case 'line':
        return <LineChart data={data} />;
      case 'pie':
        return <PieChart data={data} />;
      case 'horizontal-bar':
        return <BarChart data={data} layout="horizontal" />;
      case 'area':
        return <AreaChart data={data} />;
      default:
        return <BarChart data={data} />; // fallback para bar
    }
  };

  // Handler para copiar dados do gráfico
  const handleCopyData = async () => {
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
              {description || `📊 ${totalRecords} registros • 🔍 ${sqlQuery.length > 60 ? sqlQuery.substring(0, 60) + '...' : sqlQuery}`}
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
                <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
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
            {showTable ? renderTable() : renderChart()}
          </div>
        </ArtifactContent>
      </Artifact>
    </div>
  );
}