import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import EntityDisplay from '@/components/modulos/EntityDisplay';
import StatusBadge from '@/components/modulos/StatusBadge';
import { CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type PagamentoEfetuadoRow = {
  id?: string;
  fornecedor?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor?: number;
  valor_total?: number;
  data_vencimento?: string;
  data_pagamento?: string;
  data_emissao?: string;
  status?: string;
  descricao?: string;
  tipo_titulo?: string;
  [key: string]: unknown;
};

type GetPagamentosEfetuadosOutput = {
  success: boolean;
  count: number;
  total_valor?: number;
  rows: PagamentoEfetuadoRow[];
  message: string;
  sql_query?: string;
  error?: string;
  title?: string;
};

export default function PagamentosEfetuadosResult({ result }: { result: GetPagamentosEfetuadosOutput }) {
  const columns: ColumnDef<PagamentoEfetuadoRow>[] = useMemo(() => [
    {
      accessorKey: 'fornecedor',
      header: 'Fornecedor',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const fornecedor = row.original.fornecedor_nome || row.original.fornecedor || row.original.fornecedor_id || 'Sem fornecedor';
        const categoria = row.original.fornecedor_categoria || row.original.categoria || 'Sem categoria';
        return <EntityDisplay name={String(fornecedor)} subtitle={String(categoria)} />;
      },
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm text-muted-foreground">{desc}</div>;
      },
    },
    {
      accessorKey: 'valor_total',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.valor_total || row.original.valor || 0;
        return (
          <div className="font-bold text-blue-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'data_pagamento',
      header: 'Data Pagamento',
      cell: ({ row }) => {
        const data = row.original.data_pagamento;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
      },
    },
    {
      accessorKey: 'data_vencimento',
      header: 'Data Vencimento',
      cell: ({ row }) => {
        const data = row.original.data_vencimento;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />,
    },
  ], []);

  const chartRenderer = (rows: PagamentoEfetuadoRow[]) => {
    // Group by fornecedor
    const fornecedorMap = new Map<string, { total: number; qtd: number }>();

    rows.forEach(row => {
      const fornecedor = row.fornecedor || row.fornecedor_id || 'Sem fornecedor';
      const valor = row.valor_total || row.valor || 0;

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
          <Bar dataKey="total" fill="#3b82f6" name="Valor Total" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title={result.title ?? 'Pagamentos Efetuados'}
      icon={CheckCircle}
      iconColor="text-blue-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="pagamentos_efetuados"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
