import { ColumnDef } from '@tanstack/react-table';

export type SaldoBancarioRow = {
  id: string;
  conta?: string;
  nome?: string;
  banco?: string;
  agencia?: string;
  numero_conta?: string;
  saldo: number;
  tipo?: string;
  ativa?: boolean;
  [key: string]: unknown;
};

export const saldoBancarioColumns: ColumnDef<SaldoBancarioRow>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome da Conta',
    cell: ({ row }) => {
      const nome = row.original.nome || row.original.conta || '-';
      const ativa = row.original.ativa !== false;
      return (
        <div className="flex items-center gap-2">
          <div className="font-medium">{nome}</div>
          {!ativa && (
            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Inativa</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'banco',
    header: 'Banco',
    cell: ({ row }) => {
      const banco = row.original.banco || '-';
      return <div>{banco}</div>;
    },
  },
  {
    accessorKey: 'agencia',
    header: 'Agência',
    cell: ({ row }) => {
      const agencia = row.original.agencia || '-';
      return <div className="text-sm text-muted-foreground">{agencia}</div>;
    },
  },
  {
    accessorKey: 'numero_conta',
    header: 'Número da Conta',
    cell: ({ row }) => {
      const numero = row.original.numero_conta || '-';
      return <div className="text-sm text-muted-foreground">{numero}</div>;
    },
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo || '-';
      return <div className="capitalize">{tipo}</div>;
    },
  },
  {
    accessorKey: 'saldo',
    header: 'Saldo Atual',
    cell: ({ row }) => {
      const saldo = row.original.saldo || 0;
      const isPositive = Number(saldo) >= 0;
      return (
        <div className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {Number(saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
];
