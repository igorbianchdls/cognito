'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

export interface FinancialRecord {
  id: string | number;
  valor?: number;
  status?: string;
  data_vencimento?: string;
  data_emissao?: string;
  descricao?: string;
  [key: string]: unknown;
}

interface FinancialDataTableProps {
  success: boolean;
  count: number;
  data: FinancialRecord[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'pago': return 'bg-green-100 text-green-800 border-green-300';
    case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'vencido': return 'bg-red-100 text-red-800 border-red-300';
    case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function FinancialDataTable({ success, count, data, message, error }: FinancialDataTableProps) {
  const columns: ColumnDef<FinancialRecord>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium">#{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.getValue<string | undefined>('descricao');
        return desc ? <span className="max-w-xs truncate block">{desc}</span> : '-';
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const valor = row.getValue<number | undefined>('valor');
        return valor !== undefined
          ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '-';
      },
    },
    {
      accessorKey: 'data_vencimento',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Vencimento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const data = row.getValue<string | undefined>('data_vencimento');
        return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'data_emissao',
      header: 'Emissão',
      cell: ({ row }) => {
        const data = row.getValue<string | undefined>('data_emissao');
        return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<string | undefined>('status');
        return status ? <Badge className={getStatusColor(status)}>{status}</Badge> : '-';
      },
    },
  ], []);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados Financeiros"
      icon={DollarSign}
      iconColor="text-green-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName="financial"
      pageSize={20}
    />
  );
}
