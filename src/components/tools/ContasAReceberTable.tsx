'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { HandCoins } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface ContaReceberRow extends Record<string, unknown> {
  id: string;
  cliente: string;
  categoria?: string;
  valor_total: number;
  valor_pago?: number;
  valor_pendente?: number;
  status?: string;
  data_emissao?: string;
  data_vencimento?: string;
}

interface ContasAReceberTableProps {
  success: boolean;
  count: number;
  rows: ContaReceberRow[];
  message: string;
  error?: string;
  sql_query?: string;
}

const formatCurrency = (value?: number) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

export default function ContasAReceberTable({
  success,
  count,
  rows,
  message,
  error,
  sql_query,
}: ContasAReceberTableProps) {
  const data = useMemo(() => rows || [], [rows]);

  const columns: ColumnDef<ContaReceberRow>[] = useMemo(
    () => [
      {
        accessorKey: 'cliente',
        header: 'Cliente',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.cliente}</span>
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
        accessorKey: 'valor_pago',
        header: 'Valor recebido',
        cell: ({ row }) => formatCurrency(row.original.valor_pago),
      },
      {
        accessorKey: 'valor_pendente',
        header: 'Pendente',
        cell: ({ row }) => (
          <span className={row.original.valor_pendente && row.original.valor_pendente > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
            {formatCurrency(row.original.valor_pendente)}
          </span>
        ),
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
      data={data}
      columns={columns}
      title="Contas a Receber"
      icon={HandCoins}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName="contas_a_receber"
      sqlQuery={sql_query}
    />
  );
}
