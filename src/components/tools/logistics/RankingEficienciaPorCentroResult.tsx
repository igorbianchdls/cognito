'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Building2 } from 'lucide-react';

type Row = Record<string, unknown> & {
  centro_distribuicao?: string;
  prazo_medio?: number | string;
  pct_atraso?: number | string;
  custo_medio_envio?: number | string;
  indice_eficiencia?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function RankingEficienciaPorCentroResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'centro_distribuicao',
        valueKeys: ['prazo_medio','pct_atraso','custo_medio_envio','indice_eficiencia'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          prazo_medio: 'Prazo médio (dias)',
          pct_atraso: '% atraso',
          custo_medio_envio: 'Custo médio/envio',
          indice_eficiencia: 'Índice de eficiência',
        },
        title: 'Ranking de eficiência por CD',
        xLegend: 'Centro de distribuição',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Ranking de eficiência logística por centro"
      icon={Building2}
      iconColor="text-indigo-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="ranking_eficiencia_centro"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
