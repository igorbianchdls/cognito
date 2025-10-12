'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Truck } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface DeliveryPerformanceRow extends Record<string, unknown> {
  metric: string;
  value: string;
  benchmark: string;
  classification: string;
  detail?: string;
}

interface DeliveryPerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  transportadora_id?: string;
  totals?: {
    total_envios: number;
    entregues: number;
    on_time: number;
  };
  rows?: DeliveryPerformanceRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString('pt-BR');
};

export default function DeliveryPerformanceResult({
  success,
  message,
  periodo_dias,
  transportadora_id,
  totals,
  rows,
  sql_query,
}: DeliveryPerformanceResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<DeliveryPerformanceRow>[] = useMemo(
    () => [
      {
        accessorKey: 'metric',
        header: 'Métrica',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.metric}</span>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Resultado',
        cell: ({ row }) => (
          <span className="font-semibold text-blue-600">{row.original.value}</span>
        ),
      },
      {
        accessorKey: 'benchmark',
        header: 'Benchmark',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.benchmark}</span>
        ),
      },
      {
        accessorKey: 'classification',
        header: 'Classificação',
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
            {row.original.classification}
          </span>
        ),
      },
      {
        accessorKey: 'detail',
        header: 'Detalhe',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.detail}</span>
        ),
      },
    ],
    [],
  );

  const headerDetails = [
    transportadora_id && transportadora_id !== 'TODAS'
      ? `Transportadora: ${transportadora_id}`
      : 'Todas as transportadoras',
    periodo_dias ? `Período: ${periodo_dias} dias` : null,
    totals
      ? `Envios: ${formatNumber(totals.total_envios)} • Entregues: ${formatNumber(totals.entregues)}`
      : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Performance de Entregas"
      icon={Truck}
      message={headerDetails ? `${message} • ${headerDetails}` : message}
      success={success}
      count={data.length}
      iconColor="text-blue-600"
      exportFileName="delivery_performance"
      sqlQuery={sql_query}
    />
  );
}
