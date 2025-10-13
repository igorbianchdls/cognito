"use client";

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { AlertTriangle } from 'lucide-react';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

type Row = Record<string, unknown> & { semana?: string; total_conversoes?: number | string; semana_anterior?: number | string; variacao_pct?: number | string; alerta?: string };

export default function DeteccaoAnomaliasTaxaConversaoResult({ success, message, rows = [], count, sql_query }: Props) {
  const data: Row[] = useMemo(() => rows as Row[], [rows]);

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
        xKey: 'semana',
        valueKeys: ['total_conversoes','semana_anterior','variacao_pct'],
        metricLabels: { total_conversoes: 'Conversões', semana_anterior: 'Conversões (semana anterior)', variacao_pct: 'Variação (%)' },
        title: 'Anomalias na Taxa de Conversão (Semana a Semana)',
        xLegend: 'Semana',
        yLegend: 'Valor',
        initialChartType: 'line',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Detecção de Anomalias na Taxa de Conversão"
      icon={AlertTriangle}
      iconColor="text-rose-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="anomalias-taxa-conversao"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
