import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type TransacaoExtratoRow = {
  id?: string;
  tipo?: string;
  descricao?: string;
  valor?: number;
  data?: string;
  status?: string;
  documento?: string;
  [key: string]: unknown;
};

export type GetTransacoesExtratoOutput = {
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
  const columns: ColumnDef<TransacaoExtratoRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => {
        const data = row.original.data;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo || '-';
        return <div className="font-medium text-sm">{tipo}</div>;
      },
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm">{desc}</div>;
      },
    },
    {
      accessorKey: 'documento',
      header: 'Documento',
      cell: ({ row }) => {
        const doc = row.original.documento || '-';
        return <div className="text-xs text-muted-foreground">{doc}</div>;
      },
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.valor || 0;
        return (
          <div className="font-bold text-purple-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pendente';
        const colors: Record<string, string> = {
          concluido: 'bg-green-100 text-green-800',
          pendente: 'bg-yellow-100 text-yellow-800',
          processando: 'bg-blue-100 text-blue-800',
          cancelado: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        );
      },
    },
  ], []);

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
      columns={columns}
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
