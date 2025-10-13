'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Undo2 } from 'lucide-react';

type Row = Record<string, unknown> & {
  transportadora?: string;
  centro_distribuicao_retorno?: string;
  total_reversas?: number | string;
  prazo_medio_retorno_dias?: number | string;
  pct_pendentes?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function LogisticaReversaDevolucoesResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'transportadora',
        valueKeys: ['total_reversas','prazo_medio_retorno_dias','pct_pendentes'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          total_reversas: 'Total de reversas',
          prazo_medio_retorno_dias: 'Prazo médio retorno (dias)',
          pct_pendentes: '% pendentes',
        },
        title: 'Logística reversa por transportadora',
        xLegend: 'Transportadora',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Logística reversa (devoluções)"
      icon={Undo2}
      iconColor="text-blue-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="logistica_reversa_devolucoes"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

