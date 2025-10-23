'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [rowsState, setRowsState] = useState(rows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = useMemo(() => rowsState as Row[], [rowsState]);

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
        valueKeys: ['engajamento_pct'],
        metricLabels: { engajamento_pct: 'Engajamento (%)' },
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
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          const res = await fetch(`/api/tools/organic-marketing/engajamento-dia-hora?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar engajamento por dia/horário (orgânico):', e);
        }
      }}
    />
  );
}
