'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Activity } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

export interface FluxoCaixaRow extends Record<string, unknown> {
  categoria: string;
  origem: string;
  valor: number;
  valor_vencido?: number | null;
  quantidade?: number | null;
}

interface FluxoCaixaResultProps {
  success: boolean;
  periodo_dias?: number;
  saldo_inicial?: number;
  rows?: FluxoCaixaRow[];
  timeseries?: {
    data: string;
    entradas: number | null;
    saidas: number | null;
    saldo_dia: number | null;
    saldo_acumulado: number | null;
  }[];
  summary?: {
    entradas_previstas: number;
    saidas_previstas: number;
    saldo_projetado: number;
    entradas_vencidas: number;
    saidas_vencidas: number;
  };
  message?: string;
  sql_query?: string;
  title?: string;
}

const formatCurrency = (value?: number | null) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

export default function FluxoCaixaResult({
  success,
  periodo_dias,
  saldo_inicial,
  rows,
  timeseries,
  summary,
  message,
  sql_query,
  title,
}: FluxoCaixaResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<FluxoCaixaRow>[] = useMemo(
    () => [
      {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.categoria}</span>
        ),
      },
      {
        accessorKey: 'origem',
        header: 'Origem',
        cell: ({ row }) => (
          <span className="uppercase text-xs text-slate-500 tracking-wide">
            {row.original.origem}
          </span>
        ),
      },
      {
        accessorKey: 'valor',
        header: 'Valor previsto',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatCurrency(row.original.valor)}
          </span>
        ),
      },
      {
        accessorKey: 'valor_vencido',
        header: 'Valor vencido',
        cell: ({ row }) => formatCurrency(row.original.valor_vencido ?? null),
      },
      {
        accessorKey: 'quantidade',
        header: 'Quantidade',
        cell: ({ row }) =>
          row.original.quantidade != null
            ? row.original.quantidade.toLocaleString('pt-BR')
            : '—',
      },
    ],
    [],
  );

  const subtitleParts: string[] = [];
  if (message) subtitleParts.push(message);
  if (periodo_dias) subtitleParts.push(`Período: ${periodo_dias} dias`);
  if (typeof saldo_inicial === 'number') {
    subtitleParts.push(`Saldo inicial: ${formatCurrency(saldo_inicial)}`);
  }
  if (summary) {
    subtitleParts.push(
      `Entradas: ${formatCurrency(summary.entradas_previstas)}`,
      `Saídas: ${formatCurrency(summary.saidas_previstas)}`,
      `Saldo projetado: ${formatCurrency(summary.saldo_projetado)}`
    );
  }

  const subtitle = subtitleParts.join(' • ');

  // Tabela secundária de série temporal (se presente)
  const timeseriesData = timeseries ?? [];
  const timeseriesColumns: ColumnDef<(typeof timeseriesData)[number]>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => new Date(row.original.data).toLocaleDateString('pt-BR'),
      },
      {
        accessorKey: 'entradas',
        header: 'Entradas',
        cell: ({ row }) => formatCurrency(row.original.entradas ?? 0),
      },
      {
        accessorKey: 'saidas',
        header: 'Saídas',
        cell: ({ row }) => formatCurrency(row.original.saidas ?? 0),
      },
      {
        accessorKey: 'saldo_dia',
        header: 'Saldo do dia',
        cell: ({ row }) => formatCurrency(row.original.saldo_dia ?? 0),
      },
      {
        accessorKey: 'saldo_acumulado',
        header: 'Saldo acumulado',
        cell: ({ row }) => formatCurrency(row.original.saldo_acumulado ?? 0),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <ArtifactDataTable
        data={data}
        columns={columns}
        title={title ?? 'Projeção de Fluxo de Caixa'}
        icon={Activity}
        iconColor="text-blue-600"
        message={subtitle}
        success={success}
        count={data.length}
        exportFileName="fluxo_caixa"
        sqlQuery={sql_query}
      />

      {timeseriesData.length > 0 && (
        <ArtifactDataTable
          data={timeseriesData}
          columns={timeseriesColumns}
          title="Movimentação Diária (Acumulado)"
          icon={Activity}
          iconColor="text-blue-600"
          message={`Período com ${timeseriesData.length - 1} dias (exclui linha de saldo inicial)`}
          success={true}
          count={timeseriesData.length}
          exportFileName="fluxo_caixa_timeseries"
          sqlQuery={sql_query}
        />
      )}
    </div>
  );
}
