'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { TrendingDown } from 'lucide-react';

interface Row extends Record<string, unknown> {
  data?: string;
  alcance?: number | string;
  alcance_dia_anterior?: number | string;
  variacao_pct?: number | string;
  alerta?: string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function SuddenReachDropResult({ success, message, rows = [], count, sql_query }: Props) {
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

  const chartRenderer = () => {
    const sample = data[0] || {};
    const candidates = ['impressoes','z_score','alcance','alcance_dia_anterior','variacao_pct'];
    const valueKeys = candidates.filter((k) => k in sample);
    const metricLabels: Record<string, string> = {
      impressoes: 'Impressões',
      z_score: 'Z-score',
      alcance: 'Alcance',
      alcance_dia_anterior: 'Alcance (D-1)',
      variacao_pct: 'Variação (%)',
    };
    return (
      <ChartSwitcher
        rows={data}
        options={{
          xKey: (data.some(r => typeof r.data === 'string') ? 'data' : 'data'),
          valueKeys: valueKeys.length ? valueKeys : ['impressoes'],
          metricLabels,
          title: 'Queda súbita de alcance',
          xLegend: 'Dia',
          yLegend: 'Valor',
          initialChartType: 'line',
        }}
      />
    );
  };

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Queda súbita de alcance"
      icon={TrendingDown}
      iconColor="text-red-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="queda-subita-alcance"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
