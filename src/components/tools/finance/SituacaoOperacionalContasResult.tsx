'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { DollarSign } from 'lucide-react';

type Row = Record<string, unknown> & {
  tipo_conta?: string;
  total?: number | string;
  valor_total?: number | string;
  valor_pendente?: number | string;
  valor_pago?: number | string;
};

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function SituacaoOperacionalContasResult({ success, message, rows = [], count, sql_query }: Props) {
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
        xKey: 'tipo_conta',
        valueKeys: ['total','valor_total','valor_pendente','valor_pago'].filter((k) => k in (data[0] || {})),
        metricLabels: {
          total: 'Quantidade',
          valor_total: 'Valor total',
          valor_pendente: 'Valor pendente',
          valor_pago: 'Valor pago',
        },
        title: 'Situação Operacional — Pagar x Receber',
        xLegend: 'Tipo de conta',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Contas a Pagar e Receber — Situação Operacional"
      icon={DollarSign}
      iconColor="text-teal-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="situacao_operacional_contas"
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
