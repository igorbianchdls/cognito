import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { inadimplenciaColumns, type InadimplenciaRow } from '@/components/columns/inadimplenciaColumns';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      columns={inadimplenciaColumns}
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
