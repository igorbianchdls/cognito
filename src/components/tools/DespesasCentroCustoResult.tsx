import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { despesasCentroCustoColumns, type DespesaCentroCustoRow } from '@/components/columns/despesasCentroCustoColumns';
import { Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ObterDespesasPorCentroCustoOutput = {
  success: boolean;
  rows: DespesaCentroCustoRow[];
  count: number;
  totals?: {
    total_geral: number;
    total_despesas: number;
  };
  periodo?: {
    data_inicial: string;
    data_final: string;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

export default function DespesasCentroCustoResult({ result }: { result: ObterDespesasPorCentroCustoOutput }) {
  const chartRenderer = (rows: DespesaCentroCustoRow[]) => {
    const chartData = rows
      .map(row => ({
        centro: row.centro_custo_nome || row.centro_custo || 'Sem nome',
        total: Number(row.total_despesas || 0),
        percentual: Number(row.percentual || 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="centro" type="category" width={150} />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#ef4444" name="Total Despesas" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={despesasCentroCustoColumns}
      title="Despesas por Centro de Custo"
      icon={Layers}
      iconColor="text-orange-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="despesas_centro_custo"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
