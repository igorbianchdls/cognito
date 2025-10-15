import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { transacoesExtratoColumns, type TransacaoExtratoRow } from '@/components/columns/transacoesExtratoColumns';
import { FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type GetTransacoesExtratoOutput = {
  success: boolean;
  rows: TransacaoExtratoRow[];
  count: number;
  total_valor?: number;
  total_transacoes?: number;
  message: string;
  sql_query?: string;
  error?: string;
};

export default function TransacoesExtratoResult({ result }: { result: GetTransacoesExtratoOutput }) {
  const chartRenderer = (rows: TransacaoExtratoRow[]) => {
    // Group by tipo
    const tipoMap = new Map<string, { total: number; qtd: number }>();

    rows.forEach(row => {
      const tipo = row.tipo || 'Sem tipo';
      const valor = Number(row.valor || 0);

      if (!tipoMap.has(tipo)) {
        tipoMap.set(tipo, { total: 0, qtd: 0 });
      }

      const entry = tipoMap.get(tipo)!;
      entry.total += valor;
      entry.qtd += 1;
    });

    const chartData = Array.from(tipoMap.entries())
      .map(([tipo, data]) => ({
        tipo,
        total: data.total,
        qtd: data.qtd,
      }))
      .sort((a, b) => b.total - a.total);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tipo" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'total'
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#8b5cf6" name="Valor Total" />
          <Bar dataKey="qtd" fill="#06b6d4" name="Quantidade" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={transacoesExtratoColumns}
      title="Transações e Extrato"
      icon={FileText}
      iconColor="text-purple-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="transacoes_extrato"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
