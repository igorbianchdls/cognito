import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ArrowLeftRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export type MovimentoRow = {
  id?: string;
  data?: string;
  tipo?: string;
  valor?: number;
  origem_titulo?: string;
  categoria?: string;
  conta?: string;
  conta_id?: string;
  centro_custo?: string;
  [key: string]: unknown;
};

export type GetMovimentosOutput = {
  success: boolean;
  rows: MovimentoRow[];
  totals?: {
    total_entradas: number;
    total_saidas: number;
    saldo_liquido: number;
    total_movimentos: number;
  };
  message: string;
  sql_query?: string;
  error?: string;
  title?: string;
};

export default function MovimentosResult({ result }: { result: GetMovimentosOutput }) {
  const [tableRows, setTableRows] = useState<MovimentoRow[]>(result.rows || []);
  const [count, setCount] = useState<number>(result.rows?.length ?? 0);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(result.sql_query);

  useEffect(() => {
    setTableRows(result.rows || []);
    setCount(result.rows?.length ?? 0);
    setSqlQuery(result.sql_query);
  }, [result]);
  const columns: ColumnDef<MovimentoRow>[] = useMemo(() => [
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
        const colors: Record<string, string> = {
          entrada: 'bg-green-100 text-green-800',
          saida: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
            {tipo}
          </span>
        );
      },
    },
    {
      accessorKey: 'origem_titulo',
      header: 'Origem',
      cell: ({ row }) => {
        const origem = row.original.origem_titulo || '-';
        return <div className="text-sm">{origem}</div>;
      },
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => {
        const cat = row.original.categoria || '-';
        return <div className="text-sm text-muted-foreground">{cat}</div>;
      },
    },
    {
      accessorKey: 'centro_custo',
      header: 'Centro de Custo',
      cell: ({ row }) => {
        const cc = row.original.centro_custo || '-';
        return <div className="text-sm text-muted-foreground">{cc}</div>;
      },
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.original.valor || 0;
        const tipo = row.original.tipo || '';
        const colorClass = tipo.toLowerCase() === 'entrada' ? 'text-green-600' : 'text-red-600';
        return (
          <div className={`font-bold ${colorClass}`}>
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
    {
      accessorKey: 'conta',
      header: 'Conta',
      cell: ({ row }) => {
        const conta = row.original.conta || row.original.conta_id || '-';
        return <div className="text-sm">{conta}</div>;
      },
    },
  ], []);

  const chartRenderer = (rows: MovimentoRow[]) => {
    // Group by date and accumulate
    const dateMap = new Map<string, { entradas: number; saidas: number }>();

    rows.forEach(row => {
      const data = row.data;
      if (!data) return;

      const dataKey = format(new Date(data), 'yyyy-MM-dd');
      if (!dateMap.has(dataKey)) {
        dateMap.set(dataKey, { entradas: 0, saidas: 0 });
      }

      const entry = dateMap.get(dataKey)!;
      const valor = Number(row.valor || 0);

      if (row.tipo === 'entrada') {
        entry.entradas += valor;
      } else {
        entry.saidas += valor;
      }
    });

    const chartData = Array.from(dateMap.entries())
      .map(([data, values]) => ({
        data: format(new Date(data), 'dd/MM'),
        entradas: values.entradas,
        saidas: values.saidas,
        saldo: values.entradas - values.saidas,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
          <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
          <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas" />
          <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} name="Saldo Diário" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={tableRows}
      columns={columns}
      title={result.title ?? 'Movimentos Financeiros'}
      icon={ArrowLeftRight}
      iconColor="text-purple-600"
      message={result.message}
      success={result.success}
      count={count}
      error={result.error}
      exportFileName="movimentos"
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to }) => {
        try {
          const params = new URLSearchParams();
          if (from) params.set('data_inicial', from);
          if (to) params.set('data_final', to);
          const res = await fetch(`/api/tools/financeiro/movimentos?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as MovimentoRow[]);
            setCount(json.rows.length);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Movimentos por período:', e);
        }
      }}
    />
  );
}
