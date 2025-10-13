'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { AlertCircle } from 'lucide-react';

type Row = Record<string, unknown> & {
  tipo?: string;
  qtd_atrasadas?: number | string;
  valor_atrasado?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function AtrasosInadimplenciaResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'tipo',
        valueKeys: ['qtd_atrasadas','valor_atrasado'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          qtd_atrasadas: 'Qtd. atrasadas',
          valor_atrasado: 'Valor atrasado',
        },
        title: 'Atrasos e inadimplência',
        xLegend: 'Tipo',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Atrasos e inadimplência (risco)"
      icon={AlertCircle}
      iconColor="text-red-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="atrasos_inadimplencia"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

