import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export type MovimentoRow = {
  id: string;
  conta_id?: string;
  categoria_id?: string | null;
  tipo: 'entrada' | 'saída';
  valor: number;
  data: string;
  descricao?: string | null;
  conta_a_pagar_id?: string | null;
  conta_a_receber_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export const movimentosColumns: ColumnDef<MovimentoRow>[] = [
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
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      const isEntrada = tipo === 'entrada';
      return (
        <div className="flex items-center gap-2">
          {isEntrada ? (
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-medium ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
            {isEntrada ? 'Entrada' : 'Saída'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => {
      const valor = row.original.valor || 0;
      const isEntrada = row.original.tipo === 'entrada';
      return (
        <div className={`font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
          {isEntrada ? '+' : '-'} {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
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
    accessorKey: 'conta_id',
    header: 'Conta',
    cell: ({ row }) => {
      const conta = row.original.conta_id || '-';
      return <div className="text-sm text-muted-foreground truncate max-w-[120px]">{conta}</div>;
    },
  },
  {
    accessorKey: 'categoria_id',
    header: 'Categoria',
    cell: ({ row }) => {
      const categoria = row.original.categoria_id || '-';
      return <div className="text-sm text-muted-foreground truncate max-w-[120px]">{categoria}</div>;
    },
  },
];
