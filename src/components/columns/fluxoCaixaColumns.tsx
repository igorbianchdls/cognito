import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export type FluxoCaixaRow = {
  dia?: string;
  data?: string;
  entradas_previstas?: number;
  entradas_vencidas?: number;
  saidas_previstas?: number;
  saidas_vencidas?: number;
  saldo_projetado?: number;
  saldo?: number;
  [key: string]: unknown;
};

export const fluxoCaixaColumns: ColumnDef<FluxoCaixaRow>[] = [
  {
    accessorKey: 'dia',
    header: 'Data',
    cell: ({ row }) => {
      const data = row.original.dia || row.original.data;
      if (!data) return '-';
      try {
        return format(new Date(data), 'dd/MM/yyyy');
      } catch {
        return data;
      }
    },
  },
  {
    accessorKey: 'entradas_previstas',
    header: 'Entradas Previstas',
    cell: ({ row }) => {
      const valor = row.original.entradas_previstas || 0;
      return (
        <div className="font-medium text-green-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'entradas_vencidas',
    header: 'Entradas Vencidas',
    cell: ({ row }) => {
      const valor = row.original.entradas_vencidas || 0;
      return (
        <div className="text-amber-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'saidas_previstas',
    header: 'Saídas Previstas',
    cell: ({ row }) => {
      const valor = row.original.saidas_previstas || 0;
      return (
        <div className="font-medium text-red-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'saidas_vencidas',
    header: 'Saídas Vencidas',
    cell: ({ row }) => {
      const valor = row.original.saidas_vencidas || 0;
      return (
        <div className="text-orange-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'saldo_projetado',
    header: 'Saldo Projetado',
    cell: ({ row }) => {
      const valor = row.original.saldo_projetado || row.original.saldo || 0;
      const isPositive = Number(valor) >= 0;
      return (
        <div className={`font-bold ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
];
