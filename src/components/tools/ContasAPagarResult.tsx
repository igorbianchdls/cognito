import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { contasAPagarColumns, type ContaPagarRow } from '@/components/columns/contasAPagarColumns';
import { Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type GetContasAPagarOutput = {
  success: boolean;
  count: number;
  total_valor?: number;
  rows: ContaPagarRow[];
  message: string;
  sql_query?: string;
  error?: string;
};

export default function ContasAPagarResult({ result }: { result: GetContasAPagarOutput }) {
  const chartRenderer = (rows: ContaPagarRow[]) => {
    // Group by fornecedor
    const fornecedorMap = new Map<string, { total: number; qtd: number }>();

    rows.forEach(row => {
      const fornecedor = row.fornecedor || row.fornecedor_id || 'Sem fornecedor';
      const valor = row.valor_pendente || row.valor_total || row.valor || 0;

      if (!fornecedorMap.has(fornecedor)) {
        fornecedorMap.set(fornecedor, { total: 0, qtd: 0 });
      }

      const entry = fornecedorMap.get(fornecedor)!;
      entry.total += Number(valor);
      entry.qtd += 1;
    });

    const chartData = Array.from(fornecedorMap.entries())
      .map(([fornecedor, data]) => ({
        fornecedor: fornecedor.length > 20 ? fornecedor.substring(0, 20) + '...' : fornecedor,
        total: data.total,
        qtd: data.qtd,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="fornecedor" type="category" width={150} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'total'
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#ef4444" name="Valor Total" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={contasAPagarColumns}
      title="Contas a Pagar"
      icon={Receipt}
      iconColor="text-red-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="contas_a_pagar"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
