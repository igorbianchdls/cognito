import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { movimentosColumns, type MovimentoRow } from '@/components/columns/movimentosColumns';
import { ArrowLeftRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

type GetMovimentosOutput = {
  success: boolean;
  rows: MovimentoRow[];
  totals?: {
    total_entradas: number;
    total_saidas: number;
    saldo_liquido: number;
    total_movimentos: number;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

export default function MovimentosResult({ result }: { result: GetMovimentosOutput }) {
  const chartRenderer = (rows: MovimentoRow[]) => {
    // Group by date and accumulate
    const dateMap = new Map<string, { entradas: number; saidas: number }>();

    rows.forEach(row => {
      const data = row.data;
      if (!data) return;

      const dataKey = format(new Date(data), 'yyyy-MM-dd');
      if (!dateMap.has(dataKey)) {
        dateMap.set(dataKey, { entradas: 0, saidas: 0 });
      }

      const entry = dateMap.get(dataKey)!;
      const valor = Number(row.valor || 0);

      if (row.tipo === 'entrada') {
        entry.entradas += valor;
      } else {
        entry.saidas += valor;
      }
    });

    const chartData = Array.from(dateMap.entries())
      .map(([data, values]) => ({
        data: format(new Date(data), 'dd/MM'),
        entradas: values.entradas,
        saidas: values.saidas,
        saldo: values.entradas - values.saidas,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
          <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas" />
          <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} name="Saldo Diário" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={movimentosColumns}
      title="Movimentos Financeiros"
      icon={ArrowLeftRight}
      iconColor="text-purple-600"
      message={result.message}
      success={result.success}
      count={result.rows.length}
      error={result.error}
      exportFileName="movimentos"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
