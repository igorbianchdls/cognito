'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [rowsState, setRowsState] = useState(rows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = useMemo(() => rowsState as Row[], [rowsState]);

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
          const res = await fetch(`/api/tools/web-analytics/ltv-medio?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows as Array<Record<string, unknown>>);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar LTV médio por período:', e);
        }
      }}
    />
  );
}
