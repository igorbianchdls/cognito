'use client';

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
import { CopyIcon, DownloadIcon, DatabaseIcon } from 'lucide-react';

interface ChartDataPoint {
  x: string;
  y: number;
  label: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface GenerativeChartProps {
  data: ChartDataPoint[];
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
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
  xColumn,
  yColumn,
  sqlQuery,
  totalRecords
}: GenerativeChartProps) {

  // Renderização condicional baseada no tipo de gráfico
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChart data={data} />;
      case 'line':
        return <LineChart data={data} />;
      case 'pie':
        return <PieChart data={data} />;
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
    <Artifact>
      <ArtifactHeader>
        <div className="flex-1 min-w-0">
          <ArtifactTitle>{title}</ArtifactTitle>
          <ArtifactDescription>
            {description || `📊 ${totalRecords} registros • 🔍 ${sqlQuery.length > 60 ? sqlQuery.substring(0, 60) + '...' : sqlQuery}`}
          </ArtifactDescription>
        </div>
        <ArtifactActions>
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
            tooltip={`Tipo: ${chartType} • Colunas: ${xColumn} x ${yColumn}`}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent>
        <div className="h-64">
          {renderChart()}
        </div>
      </ArtifactContent>
    </Artifact>
  );
}