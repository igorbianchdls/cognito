'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Warehouse } from 'lucide-react';

type Row = Record<string, unknown> & {
  centro_distribuicao?: string;
  total_envios?: number | string;
  prazo_medio_dias?: number | string;
  custo_total?: number | string;
  custo_medio_por_envio?: number | string;
  pct_atraso?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function EficienciaOperacionalPorCDResult({ success, message, rows = [], count, sql_query }: Props) {
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
        valueKeys: ['total_envios','prazo_medio_dias','custo_total','custo_medio_por_envio','pct_atraso'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          total_envios: 'Total de envios',
          prazo_medio_dias: 'Prazo médio (dias)',
          custo_total: 'Custo total',
          custo_medio_por_envio: 'Custo médio/envio',
          pct_atraso: '% atraso',
        },
        title: 'Eficiência por Centro de Distribuição',
        xLegend: 'CD',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Eficiência operacional por CD"
      icon={Warehouse}
      iconColor="text-violet-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="eficiencia_por_cd"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

