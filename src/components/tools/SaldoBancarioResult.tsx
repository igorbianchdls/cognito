import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { saldoBancarioColumns, type SaldoBancarioRow } from '@/components/columns/saldoBancarioColumns';
import { Landmark } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ObterSaldoBancarioOutput = {
  success: boolean;
  rows: SaldoBancarioRow[];
  count: number;
  totals?: {
    saldo_total: number;
    saldo_positivo: number;
    saldo_negativo: number;
    total_contas: number;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function SaldoBancarioResult({ result }: { result: ObterSaldoBancarioOutput }) {
  const chartRenderer = (rows: SaldoBancarioRow[]) => {
    const chartData = rows
      .filter(row => Number(row.saldo || 0) > 0)
      .map(row => ({
        name: row.nome || row.conta || 'Sem nome',
        value: Number(row.saldo || 0),
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={saldoBancarioColumns}
      title="Saldos Bancários"
      icon={Landmark}
      iconColor="text-blue-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="saldos_bancarios"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
