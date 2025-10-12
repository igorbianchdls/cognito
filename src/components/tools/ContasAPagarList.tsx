'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CreditCard } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

export interface ContaAPagarRow extends Record<string, unknown> {
  id: string;
  fornecedor: string;
  categoria?: string;
  valor_total: number;
  valor_pago?: number;
  valor_pendente?: number;
  status?: string;
  data_emissao?: string;
  data_vencimento?: string;
}

interface ContasAPagarListProps {
  success: boolean;
  count: number;
  rows: ContaAPagarRow[];
  message: string;
  sql_query?: string;
}

const formatCurrency = (value?: number) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

export default function ContasAPagarList({
  success,
  count,
  rows,
  message,
  sql_query,
}: ContasAPagarListProps) {
  const dataRows = useMemo(() => rows || [], [rows]);

  const columns: ColumnDef<ContaAPagarRow>[] = useMemo(
    () => [
      {
        accessorKey: 'fornecedor',
        header: 'Fornecedor',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.fornecedor}</span>
        ),
      },
      {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => row.original.categoria || '—',
      },
      {
        accessorKey: 'valor_total',
        header: 'Valor total',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-700">
            {formatCurrency(row.original.valor_total)}
          </span>
        ),
      },
      {
        accessorKey: 'valor_pendente',
        header: 'Pendente',
        cell: ({ row }) => {
          const value = row.original.valor_pendente ?? 0;
          const className = value > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold';
          return <span className={className}>{formatCurrency(value)}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className="uppercase text-xs tracking-wide text-slate-500">
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'data_vencimento',
        header: 'Vencimento',
        cell: ({ row }) =>
          row.original.data_vencimento
            ? new Date(row.original.data_vencimento).toLocaleDateString('pt-BR')
            : '—',
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={dataRows}
      columns={columns}
      title="Contas a Pagar"
      icon={CreditCard}
      iconColor="text-rose-600"
      message={message}
      success={success}
      count={count}
      exportFileName="contas_a_pagar"
      sqlQuery={sql_query}
    />
  );
}
