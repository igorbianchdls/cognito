'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { DollarSign } from 'lucide-react';

type Row = Record<string, unknown> & { visitante?: string; ltv?: number | string; receita?: number | string; sessoes?: number | string };

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function LtvMedioResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: data.some(r => r.visitante !== undefined) ? 'visitante' : (data.some(r => r.data !== undefined) ? 'data' : 'visitante'),
        valueKeys: data.some(r => r.ltv !== undefined) ? ['ltv'] : (data.some(r => r.receita !== undefined) ? ['receita'] : []),
        metricLabels: { ltv: 'LTV', receita: 'Receita' },
        title: 'LTV médio',
        xLegend: 'Dimensão',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="LTV médio"
      icon={DollarSign}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="ltv_medio"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

