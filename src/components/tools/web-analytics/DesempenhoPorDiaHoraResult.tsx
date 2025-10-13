'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Clock } from 'lucide-react';

type Row = Record<string, unknown> & { dia_semana?: string | number; hora?: string | number; sessoes?: number | string; engajamento_pct?: number | string };

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function DesempenhoPorDiaHoraResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: data.some(r => r.hora !== undefined) ? 'hora' : (data.some(r => r.dia_semana !== undefined) ? 'dia_semana' : 'hora'),
        valueKeys: data.some(r => r.engajamento_pct !== undefined) ? ['engajamento_pct'] : (data.some(r => r.sessoes !== undefined) ? ['sessoes'] : []),
        metricLabels: { engajamento_pct: 'Engajamento (%)', sessoes: 'Sessões' },
        title: 'Desempenho por dia e hora',
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
      title="Desempenho por dia e hora"
      icon={Clock}
      iconColor="text-amber-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="desempenho_por_dia_hora"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

