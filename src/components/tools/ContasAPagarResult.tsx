import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import EntityDisplay from '@/components/modulos/EntityDisplay';
import StatusBadge from '@/components/modulos/StatusBadge';
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
  const [tableRows, setTableRows] = useState<ContaPagarRow[]>(result.rows || []);
  const [count, setCount] = useState<number>(result.count || (result.rows?.length ?? 0));
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(result.sql_query);

  useEffect(() => {
    setTableRows(result.rows || []);
    setCount(result.count || (result.rows?.length ?? 0));
    setSqlQuery(result.sql_query);
  }, [result]);
  const columns: ColumnDef<ContaPagarRow>[] = useMemo(() => [
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
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />,
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
      data={tableRows}
      columns={columns}
      title="Contas a Pagar"
      icon={Receipt}
      iconColor="text-red-600"
      message={result.message}
      success={result.success}
      count={count}
      error={result.error}
      exportFileName="contas_a_pagar"
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to }) => {
        try {
          const params = new URLSearchParams();
          if (from) params.set('data_vencimento_de', from);
          if (to) params.set('data_vencimento_ate', to);
          const res = await fetch(`/api/tools/financeiro/contas-a-pagar?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as ContaPagarRow[]);
            setCount(json.rows.length);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Contas a Pagar por período:', e);
        }
      }}
    />
  );
}
