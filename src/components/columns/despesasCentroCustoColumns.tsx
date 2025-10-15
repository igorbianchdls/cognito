import { ColumnDef } from '@tanstack/react-table';

export type DespesaCentroCustoRow = {
  centro_custo_id?: string;
  centro_custo_nome?: string;
  centro_custo?: string;
  codigo?: string;
  total_despesas: number;
  quantidade_despesas?: number;
  percentual?: number;
  [key: string]: unknown;
};

export const despesasCentroCustoColumns: ColumnDef<DespesaCentroCustoRow>[] = [
  {
    accessorKey: 'centro_custo',
    header: 'Centro de Custo',
    cell: ({ row }) => {
      const nome = row.original.centro_custo_nome || row.original.centro_custo || 'Sem centro de custo';
      const codigo = row.original.codigo;
      return (
        <div>
          <div className="font-medium">{nome}</div>
          {codigo && <div className="text-xs text-muted-foreground">Código: {codigo}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: 'quantidade_despesas',
    header: 'Qtd. Despesas',
    cell: ({ row }) => {
      const qtd = row.original.quantidade_despesas || 0;
      return <div className="text-center font-medium">{qtd}</div>;
    },
  },
  {
    accessorKey: 'total_despesas',
    header: 'Total Despesas',
    cell: ({ row }) => {
      const total = row.original.total_despesas || 0;
      return (
        <div className="font-bold text-red-600">
          {Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'percentual',
    header: '% do Total',
    cell: ({ row }) => {
      const percentual = row.original.percentual || 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min(Number(percentual), 100)}%` }}
            />
          </div>
          <span className="font-medium text-sm w-12 text-right">{Number(percentual).toFixed(1)}%</span>
        </div>
      );
    },
  },
];
