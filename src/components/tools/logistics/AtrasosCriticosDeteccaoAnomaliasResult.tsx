'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { AlertTriangle } from 'lucide-react';

type Row = Record<string, unknown> & {
  transportadora?: string;
  centro_distribuicao?: string;
  codigo_rastreio?: string;
  status_atual?: string;
  data_postagem?: string;
  data_estimada_entrega?: string;
  data_entrega_real?: string;
  dias_atraso?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function AtrasosCriticosDeteccaoAnomaliasResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'codigo_rastreio',
        valueKeys: ['dias_atraso'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          dias_atraso: 'Dias de atraso',
        },
        title: 'Atrasos críticos por envio',
        xLegend: 'Código de rastreio',
        yLegend: 'Dias',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Atrasos críticos — detecção de anomalias"
      icon={AlertTriangle}
      iconColor="text-red-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="atrasos_criticos"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

