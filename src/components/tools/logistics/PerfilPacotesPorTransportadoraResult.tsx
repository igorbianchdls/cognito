'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { PackageCheck } from 'lucide-react';

type Row = Record<string, unknown> & {
  transportadora?: string;
  peso_medio_kg?: number | string;
  volume_medio_m3?: number | string;
  valor_total_declarado?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function PerfilPacotesPorTransportadoraResult({ success, message, rows = [], count, sql_query }: Props) {
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
        valueKeys: ['peso_medio_kg','volume_medio_m3','valor_total_declarado'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          peso_medio_kg: 'Peso médio (kg)',
          volume_medio_m3: 'Volume médio (m³)',
          valor_total_declarado: 'Valor declarado (total)',
        },
        title: 'Perfil de pacotes por transportadora',
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
      title="Perfil de pacotes por transportadora"
      icon={PackageCheck}
      iconColor="text-teal-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="perfil_pacotes_transportadora"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

