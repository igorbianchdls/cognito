import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import EntityDisplay from '@/components/modulos/EntityDisplay';
import StatusBadge from '@/components/modulos/StatusBadge';
import { CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type PagamentoRecebidoRow = {
  id?: string;
  cliente?: string;
  cliente_id?: string;
  cliente_nome?: string;
  valor?: number;
  valor_total?: number;
  data_vencimento?: string;
  data_recebimento?: string;
  data_emissao?: string;
  status?: string;
  descricao?: string;
  [key: string]: unknown;
};

type GetPagamentosRecebidosOutput = {
  success: boolean;
  count: number;
  total_valor?: number;
  rows: PagamentoRecebidoRow[];
  message: string;
  sql_query?: string;
  error?: string;
  title?: string;
};

export default function PagamentosRecebidosResult({ result }: { result: GetPagamentosRecebidosOutput }) {
  const columns: ColumnDef<PagamentoRecebidoRow>[] = useMemo(() => [
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const cliente = row.original.cliente_nome || row.original.cliente || row.original.cliente_id || 'Sem cliente';
        const segmento = row.original.cliente_segmento || row.original.segmento || 'Sem segmento';
        return <EntityDisplay name={String(cliente)} subtitle={String(segmento)} />;
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
          <div className="font-bold text-green-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'data_recebimento',
      header: 'Data Recebimento',
      cell: ({ row }) => {
        const data = row.original.data_recebimento;
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

  const chartRenderer = (rows: PagamentoRecebidoRow[]) => {
    // Group by cliente
    const clienteMap = new Map<string, { total: number; qtd: number }>();

    rows.forEach(row => {
      const cliente = row.cliente || row.cliente_id || 'Sem cliente';
      const valor = row.valor_total || row.valor || 0;

      if (!clienteMap.has(cliente)) {
        clienteMap.set(cliente, { total: 0, qtd: 0 });
      }

      const entry = clienteMap.get(cliente)!;
      entry.total += Number(valor);
      entry.qtd += 1;
    });

    const chartData = Array.from(clienteMap.entries())
      .map(([cliente, data]) => ({
        cliente: cliente.length > 20 ? cliente.substring(0, 20) + '...' : cliente,
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
          <YAxis dataKey="cliente" type="category" width={150} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'total'
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#10b981" name="Valor Total" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title={result.title ?? 'Pagamentos Recebidos'}
      icon={CheckCircle}
      iconColor="text-green-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="pagamentos_recebidos"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
