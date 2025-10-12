'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Award } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface CarrierBenchmarkRow extends Record<string, unknown> {
  transportadora: string;
  total_envios: number;
  entregues: number;
  on_time_rate: number;
  first_attempt_rate: number;
  avg_delivery_days: number;
  custo_total: number;
  custo_medio_envio: number;
  custo_por_kg: number;
  performance_score: number;
  classificacao: string;
}

interface CarrierBenchmarkResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: CarrierBenchmarkRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CarrierBenchmarkResult({
  success,
  message,
  periodo_dias,
  rows,
  sql_query,
}: CarrierBenchmarkResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<CarrierBenchmarkRow>[] = useMemo(
    () => [
      {
        accessorKey: 'transportadora',
        header: 'Transportadora',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.transportadora}</span>
        ),
      },
      {
        accessorKey: 'performance_score',
        header: 'Score',
        cell: ({ row }) => (
          <span className="font-semibold text-purple-600">
            {row.original.performance_score.toFixed(1)}
          </span>
        ),
      },
      {
        accessorKey: 'on_time_rate',
        header: 'On-time',
        cell: ({ row }) => `${row.original.on_time_rate.toFixed(2)}%`,
      },
      {
        accessorKey: 'first_attempt_rate',
        header: '1ª tentativa',
        cell: ({ row }) => `${row.original.first_attempt_rate.toFixed(2)}%`,
      },
      {
        accessorKey: 'avg_delivery_days',
        header: 'Tempo médio (dias)',
        cell: ({ row }) => row.original.avg_delivery_days.toFixed(1),
      },
      {
        accessorKey: 'custo_medio_envio',
        header: 'Ticket médio',
        cell: ({ row }) => formatCurrency(row.original.custo_medio_envio),
      },
      {
        accessorKey: 'custo_por_kg',
        header: 'Custo por kg',
        cell: ({ row }) => formatCurrency(row.original.custo_por_kg),
      },
      {
        accessorKey: 'classificacao',
        header: 'Classificação',
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
            {row.original.classificacao}
          </span>
        ),
      },
    ],
    [],
  );

  const top = data[0]?.transportadora;
  const bottom = data[data.length - 1]?.transportadora;
  const meta = [
    periodo_dias ? `Período: ${periodo_dias} dias` : null,
    data.length ? `Top: ${top}` : null,
    data.length ? `Atenção: ${bottom}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Benchmark de Transportadoras"
      icon={Award}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-purple-600"
      exportFileName="carrier_benchmark"
      sqlQuery={sql_query}
    />
  );
}
