'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { TrendingUp } from 'lucide-react';

type Row = Record<string, unknown> & {
  mes?: string;
  despesas_mes?: number | string;
  media_geral?: number | string;
  variacao_pct?: number | string;
  alerta?: string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function AlertaAumentoAnormalDespesasResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'mes',
        valueKeys: ['despesas_mes','media_geral','variacao_pct'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          despesas_mes: 'Despesas do mês',
          media_geral: 'Média geral',
          variacao_pct: 'Variação (%)',
        },
        title: 'Despesas mensais e variação',
        xLegend: 'Mês',
        yLegend: 'Valor',
        initialChartType: 'line',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Alerta de aumento anormal de despesas"
      icon={TrendingUp}
      iconColor="text-orange-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="alerta_aumento_despesas"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

