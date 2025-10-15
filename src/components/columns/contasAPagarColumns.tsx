import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export type ContaPagarRow = {
  id: string;
  fornecedor_id?: string;
  fornecedor?: string;
  valor: number;
  valor_total?: number;
  valor_pago?: number;
  valor_pendente?: number;
  data_vencimento?: string;
  data_emissao?: string;
  status?: string;
  descricao?: string;
  categoria_id?: string;
  data_pagamento?: string;
  [key: string]: unknown;
};

export const contasAPagarColumns: ColumnDef<ContaPagarRow>[] = [
  {
    accessorKey: 'fornecedor',
    header: 'Fornecedor',
    cell: ({ row }) => {
      const fornecedor = row.original.fornecedor || row.original.fornecedor_id || 'Sem fornecedor';
      return <div className="font-medium">{fornecedor}</div>;
    },
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => {
      const descricao = row.original.descricao || '-';
      return <div className="max-w-xs truncate">{descricao}</div>;
    },
  },
  {
    accessorKey: 'valor_total',
    header: 'Valor Total',
    cell: ({ row }) => {
      const valor = row.original.valor_total || row.original.valor || 0;
      return (
        <div className="font-semibold text-red-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'valor_pago',
    header: 'Valor Pago',
    cell: ({ row }) => {
      const valor = row.original.valor_pago || 0;
      return (
        <div className="text-blue-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'valor_pendente',
    header: 'Valor Pendente',
    cell: ({ row }) => {
      const valor = row.original.valor_pendente || 0;
      return (
        <div className="text-amber-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'data_vencimento',
    header: 'Vencimento',
    cell: ({ row }) => {
      const data = row.original.data_vencimento;
      if (!data) return '-';
      try {
        return format(new Date(data), 'dd/MM/yyyy');
      } catch {
        return data;
      }
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status || 'pendente';
      const statusColors: Record<string, string> = {
        pago: 'bg-green-100 text-green-800',
        pendente: 'bg-yellow-100 text-yellow-800',
        vencido: 'bg-red-100 text-red-800',
        cancelado: 'bg-gray-100 text-gray-800',
      };
      const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {status}
        </span>
      );
    },
  },
];
