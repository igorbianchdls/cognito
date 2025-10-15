import { ColumnDef } from '@tanstack/react-table';

export type InadimplenciaRow = {
  faixa?: string;
  tipo?: string;
  quantidade: number;
  valor_total: number;
  percentual_quantidade?: number;
  percentual_valor?: number;
  dias_atraso_medio?: number;
  [key: string]: unknown;
};

export const inadimplenciaColumns: ColumnDef<InadimplenciaRow>[] = [
  {
    accessorKey: 'faixa',
    header: 'Faixa de Atraso',
    cell: ({ row }) => {
      const faixa = row.original.faixa || row.original.tipo || '-';
      const faixaColors: Record<string, string> = {
        'A Vencer': 'text-green-600',
        '1-30': 'text-yellow-600',
        '31-60': 'text-orange-600',
        '61-90': 'text-red-600',
        '90+': 'text-red-800',
      };
      const colorClass = faixaColors[faixa] || 'text-gray-600';
      return <div className={`font-semibold ${colorClass}`}>{faixa}</div>;
    },
  },
  {
    accessorKey: 'quantidade',
    header: 'Quantidade',
    cell: ({ row }) => {
      const qtd = row.original.quantidade || 0;
      return <div className="text-center font-medium">{qtd}</div>;
    },
  },
  {
    accessorKey: 'valor_total',
    header: 'Valor Total',
    cell: ({ row }) => {
      const valor = row.original.valor_total || 0;
      return (
        <div className="font-bold text-red-600">
          {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      );
    },
  },
  {
    accessorKey: 'percentual_valor',
    header: '% do Total',
    cell: ({ row }) => {
      const percentual = row.original.percentual_valor || row.original.percentual_quantidade || 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${Math.min(Number(percentual), 100)}%` }}
            />
          </div>
          <span className="font-medium text-sm w-12 text-right">{Number(percentual).toFixed(1)}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'dias_atraso_medio',
    header: 'Dias Atraso Médio',
    cell: ({ row }) => {
      const dias = row.original.dias_atraso_medio;
      if (!dias) return '-';
      return <div className="text-center">{Math.round(Number(dias))} dias</div>;
    },
  },
];
