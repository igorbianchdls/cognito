'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { AlertTriangle } from 'lucide-react';

interface Row extends Record<string, unknown> {
  data?: string;
  valor?: number | string;
  media_7d?: number | string;
  zscore?: number | string;
  alerta?: string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function OrganicAnomaliesResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: (data.some(r => typeof r.data === 'string') ? 'data' : 'data'),
        valueKeys: ['valor','media_7d','zscore'],
        metricLabels: { valor: 'Valor', media_7d: 'Média 7d', zscore: 'Z-score' },
        title: 'Detecção de anomalias',
        xLegend: 'Dia',
        yLegend: 'Valor',
        initialChartType: 'line',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Detecção de anomalias"
      icon={AlertTriangle}
      iconColor="text-rose-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="anomalias-organico"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

