import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { contasAReceberColumns, type ContaReceberRow } from '@/components/columns/contasAReceberColumns';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type GetContasAReceberOutput = {
  success: boolean;
  count: number;
  total_valor?: number;
  rows: ContaReceberRow[];
  message: string;
  sql_query?: string;
  error?: string;
};

export default function ContasAReceberResult({ result }: { result: GetContasAReceberOutput }) {
  const chartRenderer = (rows: ContaReceberRow[]) => {
    // Prepare aging data
    const today = new Date();
    const agingData = [
      { faixa: 'A Vencer', total: 0, qtd: 0 },
      { faixa: '1-30 dias', total: 0, qtd: 0 },
      { faixa: '31-60 dias', total: 0, qtd: 0 },
      { faixa: '61-90 dias', total: 0, qtd: 0 },
      { faixa: '90+ dias', total: 0, qtd: 0 },
    ];

    rows.forEach(row => {
      const valor = row.valor_pendente || row.valor_total || row.valor || 0;
      if (!row.data_vencimento) return;

      const vencimento = new Date(row.data_vencimento);
      const diffDays = Math.floor((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));

      let index = 0;
      if (diffDays < 0) index = 0; // A Vencer
      else if (diffDays <= 30) index = 1;
      else if (diffDays <= 60) index = 2;
      else if (diffDays <= 90) index = 3;
      else index = 4;

      agingData[index].total += Number(valor);
      agingData[index].qtd += 1;
    });

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={agingData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="faixa" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#10b981" name="Valor Total" />
          <Bar dataKey="qtd" fill="#3b82f6" name="Quantidade" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={contasAReceberColumns}
      title="Contas a Receber"
      icon={DollarSign}
      iconColor="text-green-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="contas_a_receber"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
