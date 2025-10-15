import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export type TransacaoExtratoRow = {
  id: string;
  data?: string;
  descricao?: string;
  valor?: number;
  tipo?: string;
  status?: string;
  [key: string]: unknown;
};

export const transacoesExtratoColumns: ColumnDef<TransacaoExtratoRow>[] = [
  {
    accessorKey: 'data',
    header: 'Data',
    cell: ({ row }) => {
      const data = row.original.data;
      if (!data) return '-';
      try {
        return format(new Date(data), 'dd/MM/yyyy');
      } catch {
        return data;
      }
    },
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => {
      const descricao = row.original.descricao || '-';
      return <div className="max-w-md truncate">{descricao}</div>;
    },
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo || '-';
      return <div className="font-medium">{tipo}</div>;
    },
  },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => {
      const valor = row.original.valor || 0;
      return (
        <div className="font-semibold text-blue-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status || '-';
      const statusColors: Record<string, string> = {
        concluido: 'bg-green-100 text-green-800',
        pendente: 'bg-yellow-100 text-yellow-800',
        cancelado: 'bg-red-100 text-red-800',
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
