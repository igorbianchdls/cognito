'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DollarSign } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface ForecastRow extends Record<string, unknown> {
  categoria: string;
  periodo: string;
  custo_previsto: number;
  detalhe?: string;
}

interface ForecastDeliveryCostsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  forecast_dias?: number;
  rows?: ForecastRow[];
  summary?: {
    custo_medio_diario: number;
    ultimo_custo: number;
    slope: number;
  };
  sql_query?: string;
  sql_params?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ForecastDeliveryCostsResult({
  success,
  message,
  periodo_dias,
  forecast_dias,
  rows,
  summary,
  sql_query,
}: ForecastDeliveryCostsResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<ForecastRow>[] = useMemo(
    () => [
      {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => (
          <span className="uppercase text-xs font-semibold text-slate-500">
            {row.original.categoria}
          </span>
        ),
      },
      {
        accessorKey: 'periodo',
        header: 'Período',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.periodo}</span>
        ),
      },
      {
        accessorKey: 'custo_previsto',
        header: 'Custo previsto',
        cell: ({ row }) => formatCurrency(row.original.custo_previsto),
      },
      {
        accessorKey: 'detalhe',
        header: 'Detalhe',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.detalhe ?? '—'}
          </span>
        ),
      },
    ],
    [],
  );

  const meta = [
    periodo_dias ? `Histórico: ${periodo_dias} dias` : null,
    forecast_dias ? `Previsão: ${forecast_dias} dias` : null,
    summary ? `Slope: ${summary.slope.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const summaryBlock = summary
    ? `Custo médio diário: ${formatCurrency(summary.custo_medio_diario)} • Último custo: ${formatCurrency(summary.ultimo_custo)}`
    : null;

  const messageWithSummary = summaryBlock ? `${message} • ${summaryBlock}` : message;

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Previsão de Custos de Frete"
      icon={DollarSign}
      message={meta ? `${messageWithSummary} • ${meta}` : messageWithSummary}
      success={success}
      count={data.length}
      iconColor="text-indigo-600"
      exportFileName="delivery_cost_forecast"
      sqlQuery={sql_query}
    />
  );
}
