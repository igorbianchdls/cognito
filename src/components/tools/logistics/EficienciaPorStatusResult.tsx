'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { ListChecks } from 'lucide-react';

type Row = Record<string, unknown> & {
  status_atual?: string;
  total?: number | string;
  dias_medio_no_status?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function EficienciaPorStatusResult({ success, message, rows = [], count, sql_query }: Props) {
  const data = useMemo(() => rows as Row[], [rows]);

  const columns: ColumnDef<Row>[] = useMemo(() => {
    if (!data.length) return [{ accessorKey: 'info', header: 'Info' } as ColumnDef<Row>];
    const keys = Object.keys(data[0]);
    return keys.map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cell: ({ row }) => String(row.getValue(key) ?? ''),
    })) as ColumnDef<Row>[];
  }, [data]);

  const chartRenderer = () => (
    <ChartSwitcher
      rows={data}
      options={{
        xKey: 'status_atual',
        valueKeys: ['total','dias_medio_no_status'].filter((k) => k in (data[0] || {})),
        metricLabels: { total: 'Total', dias_medio_no_status: 'Dias médios' },
        title: 'Eficiência por status',
        xLegend: 'Status',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Eficiência por status"
      icon={ListChecks}
      iconColor="text-blue-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="eficiencia_por_status"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

