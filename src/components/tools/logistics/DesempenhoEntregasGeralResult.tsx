'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Truck } from 'lucide-react';

type Row = Record<string, unknown> & {
  transportadora?: string;
  total_envios?: number | string;
  prazo_medio_dias?: number | string;
  atraso_medio_dias?: number | string;
  entregas_atrasadas?: number | string;
  pct_atraso?: number | string;
  custo_total_frete?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function DesempenhoEntregasGeralResult({ success, message, rows = [], count, sql_query }: Props) {
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
        valueKeys: ['total_envios','prazo_medio_dias','atraso_medio_dias','pct_atraso','custo_total_frete','entregas_atrasadas'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          total_envios: 'Total de envios',
          prazo_medio_dias: 'Prazo médio (dias)',
          atraso_medio_dias: 'Atraso médio (dias)',
          pct_atraso: '% atraso',
          custo_total_frete: 'Custo total de frete',
          entregas_atrasadas: 'Entregas atrasadas',
        },
        title: 'Desempenho por transportadora',
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
      title="Desempenho geral de entregas"
      icon={Truck}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="desempenho_entregas_geral"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

