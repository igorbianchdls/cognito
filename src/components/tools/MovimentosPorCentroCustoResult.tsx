import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type MovimentoCentroCustoRow = {
  centro_custo?: string;
  categoria?: string;
  tipo_categoria?: string;
  total?: number;
  [key: string]: unknown;
};

export type GetMovimentosPorCentroCustoOutput = {
  success: boolean;
  rows: MovimentoCentroCustoRow[];
  count: number;
  totals?: {
    total_entradas: number;
    total_saidas: number;
    saldo_liquido: number;
    total_linhas: number;
  };
  periodo?: {
    data_inicial: string;
    data_final: string;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

export default function MovimentosPorCentroCustoResult({ result }: { result: GetMovimentosPorCentroCustoOutput }) {
  const columns: ColumnDef<MovimentoCentroCustoRow>[] = useMemo(() => [
    {
      accessorKey: 'centro_custo',
      header: 'Centro de Custo',
      cell: ({ row }) => {
        const cc = row.original.centro_custo || '—';
        return <div className="font-medium">{cc}</div>;
      },
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => {
        const cat = row.original.categoria || '-';
        return <div className="text-sm">{cat}</div>;
      },
    },
    {
      accessorKey: 'tipo_categoria',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo_categoria || '-';
        const colors: Record<string, string> = {
          'Receita': 'bg-green-100 text-green-800',
          'Despesa': 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo] || 'bg-gray-100 text-gray-800'}`}>
            {tipo}
          </span>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.original.total || 0;
        const tipo = row.original.tipo_categoria || '';
        const colorClass = tipo === 'Receita' ? 'text-green-600' : 'text-red-600';
        return (
          <div className={`font-bold ${colorClass}`}>
            {Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
  ], []);

  const chartRenderer = (rows: MovimentoCentroCustoRow[]) => {
    // Group by centro_custo and tipo_categoria
    const groupedData = new Map<string, { receitas: number; despesas: number }>();

    rows.forEach(row => {
      const cc = row.centro_custo || '— sem CC —';
      if (!groupedData.has(cc)) {
        groupedData.set(cc, { receitas: 0, despesas: 0 });
      }

      const entry = groupedData.get(cc)!;
      const total = Math.abs(Number(row.total || 0));

      if (row.tipo_categoria === 'Receita') {
        entry.receitas += total;
      } else if (row.tipo_categoria === 'Despesa') {
        entry.despesas += total;
      }
    });

    const chartData = Array.from(groupedData.entries())
      .map(([cc, values]) => ({
        centro_custo: cc,
        receitas: values.receitas,
        despesas: values.despesas,
        saldo: values.receitas - values.despesas,
      }))
      .sort((a, b) => Math.abs(b.despesas) - Math.abs(a.despesas));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="centro_custo" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
          <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title="Movimentos por Centro de Custo"
      icon={BarChart3}
      iconColor="text-purple-600"
      message={result.message}
      success={result.success}
      count={result.rows.length}
      error={result.error}
      exportFileName="movimentos_por_centro_custo"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
