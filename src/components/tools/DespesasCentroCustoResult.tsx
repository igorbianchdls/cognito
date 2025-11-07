import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type DespesaCentroCustoRow = {
  centro_custo_id?: string;
  centro_custo_nome?: string;
  centro_custo?: string;
  codigo?: string;
  total_despesas: number;
  quantidade_despesas?: number;
  percentual?: number;
  [key: string]: unknown;
};

export type ObterDespesasPorCentroCustoOutput = {
  success: boolean;
  rows: DespesaCentroCustoRow[];
  count: number;
  totals?: {
    total_geral: number;
    total_despesas: number;
  };
  periodo?: {
    data_inicial: string;
    data_final: string;
  };
  message: string;
  sql_query?: string;
  error?: string;
  title?: string;
};

export default function DespesasCentroCustoResult({ result }: { result: ObterDespesasPorCentroCustoOutput }) {
  const [tableRows, setTableRows] = useState<DespesaCentroCustoRow[]>(result.rows || []);
  const [count, setCount] = useState<number>(result.count || (result.rows?.length ?? 0));
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(result.sql_query);

  useEffect(() => {
    setTableRows(result.rows || []);
    setCount(result.count || (result.rows?.length ?? 0));
    setSqlQuery(result.sql_query);
  }, [result]);
  const columns: ColumnDef<DespesaCentroCustoRow>[] = useMemo(() => [
    {
      accessorKey: 'centro_custo',
      header: 'Centro de Custo',
      cell: ({ row }) => {
        const nome = row.original.centro_custo_nome || row.original.centro_custo || 'Sem centro de custo';
        const codigo = row.original.codigo;
        return (
          <div>
            <div className="font-medium">{nome}</div>
            {codigo && <div className="text-xs text-muted-foreground">Código: {codigo}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'quantidade_despesas',
      header: 'Qtd. Despesas',
      cell: ({ row }) => {
        const qtd = row.original.quantidade_despesas || 0;
        return <div className="text-center font-medium">{qtd}</div>;
      },
    },
    {
      accessorKey: 'total_despesas',
      header: 'Total Despesas',
      cell: ({ row }) => {
        const total = row.original.total_despesas || 0;
        return (
          <div className="font-bold text-red-600">
            {Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'percentual',
      header: '% do Total',
      cell: ({ row }) => {
        const percentual = row.original.percentual || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(Number(percentual), 100)}%` }}
              />
            </div>
            <span className="font-medium text-sm w-12 text-right">{Number(percentual).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ], []);

  const chartRenderer = (rows: DespesaCentroCustoRow[]) => {
    const chartData = rows
      .map(row => ({
        centro: row.centro_custo_nome || row.centro_custo || 'Sem nome',
        total: Number(row.total_despesas || 0),
        percentual: Number(row.percentual || 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="centro" type="category" width={150} />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#ef4444" name="Total Despesas" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Despesas por Centro de Custo'}
      icon={Layers}
      iconColor="text-orange-600"
      message={result.message}
      success={result.success}
      count={count}
      error={result.error}
      exportFileName="despesas_centro_custo"
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          // Para este endpoint, ambos são obrigatórios
          if (from) params.set('data_inicial', from);
          if (to) params.set('data_final', to);

          // Quando preset = 'all', não aplicamos filtro (evita 400); aqui podemos usar um range amplo
          if (preset === 'all' && !from && !to) {
            const today = new Date();
            const toISO = (d: Date) => d.toISOString().slice(0, 10);
            const fromAuto = new Date(today);
            fromAuto.setFullYear(today.getFullYear() - 10);
            params.set('data_inicial', toISO(fromAuto));
            params.set('data_final', toISO(today));
          }

          const res = await fetch(`/api/tools/financeiro/despesas-centro-custo?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as DespesaCentroCustoRow[]);
            setCount(json.rows.length);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Despesas por Centro de Custo por período:', e);
        }
      }}
    />
  );
}
