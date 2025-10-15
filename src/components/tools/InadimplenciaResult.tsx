import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type InadimplenciaRow = {
  faixa?: string;
  tipo?: string;
  quantidade?: number;
  valor_total?: number;
  percentual?: number;
  [key: string]: unknown;
};

type AnalisarInadimplenciaOutput = {
  success: boolean;
  rows: InadimplenciaRow[];
  count: number;
  totals?: {
    total_inadimplencia: number;
    total_vencidas: number;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

export default function InadimplenciaResult({ result }: { result: AnalisarInadimplenciaOutput }) {
  const columns: ColumnDef<InadimplenciaRow>[] = useMemo(() => [
    {
      accessorKey: 'faixa',
      header: 'Faixa/Tipo',
      cell: ({ row }) => {
        const faixa = row.original.faixa || row.original.tipo || '-';
        return <div className="font-medium">{faixa}</div>;
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
      accessorKey: 'percentual',
      header: '% do Total',
      cell: ({ row }) => {
        const percentual = row.original.percentual || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${Math.min(Number(percentual), 100)}%` }}
              />
            </div>
            <span className="font-medium text-sm w-12 text-right">{Number(percentual).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ], []);

  const chartRenderer = (rows: InadimplenciaRow[]) => {
    const chartData = rows.map(row => ({
      faixa: row.faixa || row.tipo || '-',
      quantidade: Number(row.quantidade || 0),
      valor: Number(row.valor_total || 0),
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="faixa" />
          <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
          <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'valor'
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value
            }
          />
          <Legend />
          <Bar yAxisId="left" dataKey="valor" fill="#ef4444" name="Valor Total" />
          <Bar yAxisId="right" dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title="Análise de Inadimplência"
      icon={AlertTriangle}
      iconColor="text-red-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="analise_inadimplencia"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
