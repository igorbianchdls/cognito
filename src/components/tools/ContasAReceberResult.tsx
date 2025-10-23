import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type ContaReceberRow = {
  id?: string;
  cliente?: string;
  cliente_id?: string;
  cliente_nome?: string;
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
  const [tableRows, setTableRows] = useState<ContaReceberRow[]>(result.rows || []);
  const [count, setCount] = useState<number>(result.count || (result.rows?.length ?? 0));
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(result.sql_query);

  useEffect(() => {
    setTableRows(result.rows || []);
    setCount(result.count || (result.rows?.length ?? 0));
    setSqlQuery(result.sql_query);
  }, [result]);
  const columns: ColumnDef<ContaReceberRow>[] = useMemo(() => [
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const cliente = row.original.cliente_nome || row.original.cliente || row.original.cliente_id || 'Sem cliente';
        return <div className="font-medium">{cliente}</div>;
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
          <div className="font-bold text-green-600">
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
      data={tableRows}
      columns={columns}
      title="Contas a Receber"
      icon={DollarSign}
      iconColor="text-green-600"
      message={result.message}
      success={result.success}
      count={count}
      error={result.error}
      exportFileName="contas_a_receber"
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to }) => {
        try {
          const params = new URLSearchParams();
          if (from) params.set('data_vencimento_de', from);
          if (to) params.set('data_vencimento_ate', to);
          const res = await fetch(`/api/tools/financeiro/contas-a-receber?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as ContaReceberRow[]);
            setCount(json.rows.length);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Contas a Receber por período:', e);
        }
      }}
    />
  );
}
