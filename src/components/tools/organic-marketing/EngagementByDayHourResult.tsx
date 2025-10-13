'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Clock } from 'lucide-react';

interface Row extends Record<string, unknown> {
  dia_semana?: string | number;
  hora?: string | number;
  engajamento?: number | string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function EngagementByDayHourResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: (data.some(r => r.hora !== undefined) ? 'hora' : (data.some(r => r.dia_semana !== undefined) ? 'dia_semana' : 'hora')),
        valueKeys: ['engajamento'],
        metricLabels: { engajamento: 'Engajamento' },
        title: 'Engajamento por dia/horário',
        xLegend: 'Tempo',
        yLegend: 'Valor',
        initialChartType: 'line',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Engajamento por dia/horário"
      icon={Clock}
      iconColor="text-amber-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="engajamento-por-dia-hora"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

