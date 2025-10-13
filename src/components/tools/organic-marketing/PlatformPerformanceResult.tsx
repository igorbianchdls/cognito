'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { BarChart3 } from 'lucide-react';

interface Row extends Record<string, unknown> {
  plataforma?: string;
  total_impressoes?: number | string;
  total_visualizacoes?: number | string;
  taxa_engajamento_total?: number | string;
  taxa_view?: number | string;
  taxa_like?: number | string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function PlatformPerformanceResult({ success, message, rows = [], count, sql_query }: Props) {
  const data = useMemo(() => rows as Row[], [rows]);

  const columns: ColumnDef<Row>[] = useMemo(() => {
    if (!data.length) return [ { accessorKey: 'info', header: 'Info' } as ColumnDef<Row> ];
    const sample = data[0];
    return Object.keys(sample).map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cell: ({ row }) => String(row.getValue(key) ?? ''),
    })) as ColumnDef<Row>[];
  }, [data]);

  const chartRenderer = () => (
    <ChartSwitcher
      rows={data}
      options={{
        xKey: 'plataforma',
        valueKeys: ['taxa_engajamento_total','taxa_view','total_impressoes'],
        metricLabels: {
          taxa_engajamento_total: 'Engajamento total (%)',
          taxa_view: 'Taxa de view (%)',
          total_impressoes: 'Impressões',
        },
        title: 'Indicadores por plataforma',
        xLegend: 'Plataforma',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Desempenho por plataforma"
      icon={BarChart3}
      iconColor="text-indigo-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="desempenho-por-plataforma"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

