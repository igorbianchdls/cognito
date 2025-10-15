import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type ContaPagarRow = {
  id?: string;
  fornecedor?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor?: number;
  valor_total?: number;
  valor_pago?: number;
  valor_pendente?: number;
  data_vencimento?: string;
  data_emissao?: string;
  status?: string;
  descricao?: string;
  [key: string]: unknown;
};

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
  const columns: ColumnDef<ContaPagarRow>[] = useMemo(() => [
    {
      accessorKey: 'fornecedor',
      header: 'Fornecedor',
      cell: ({ row }) => {
        const fornecedor = row.original.fornecedor_nome || row.original.fornecedor || row.original.fornecedor_id || 'Sem fornecedor';
        return <div className="font-medium">{fornecedor}</div>;
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
      header: 'Valor Total',
      cell: ({ row }) => {
        const valor = row.original.valor_total || row.original.valor || 0;
        return (
          <div className="font-bold text-red-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor_pago',
      header: 'Pago',
      cell: ({ row }) => {
        const pago = row.original.valor_pago || 0;
        return (
          <div className="text-sm">
            {Number(pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor_pendente',
      header: 'Pendente',
      cell: ({ row }) => {
        const pendente = row.original.valor_pendente || 0;
        return (
          <div className="font-semibold text-orange-600">
            {Number(pendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'data_vencimento',
      header: 'Vencimento',
      cell: ({ row }) => {
        const data = row.original.data_vencimento;
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pendente';
        const colors: Record<string, string> = {
          pago: 'bg-green-100 text-green-800',
          pendente: 'bg-yellow-100 text-yellow-800',
          vencido: 'bg-red-100 text-red-800',
          cancelado: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pendente}`}>
            {status}
          </span>
        );
      },
    },
  ], []);

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
      columns={columns}
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
