import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Landmark } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type SaldoBancarioRow = {
  id?: string;
  conta?: string;
  nome?: string;
  banco?: string;
  agencia?: string;
  numero_conta?: string;
  saldo?: number;
  tipo_conta?: string;
  [key: string]: unknown;
};

export type ObterSaldoBancarioOutput = {
  success: boolean;
  rows: SaldoBancarioRow[];
  count: number;
  totals?: {
    saldo_total: number;
    saldo_positivo: number;
    saldo_negativo: number;
    total_contas: number;
  };
  message: string;
  sql_query?: string;
  error?: string;
};

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function SaldoBancarioResult({ result }: { result: ObterSaldoBancarioOutput }) {
  const columns: ColumnDef<SaldoBancarioRow>[] = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Conta',
      cell: ({ row }) => {
        const nome = row.original.nome || row.original.conta || 'Sem nome';
        const banco = row.original.banco;
        return (
          <div>
            <div className="font-medium">{nome}</div>
            {banco && <div className="text-xs text-muted-foreground">{banco}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo_conta',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo_conta || '-';
        return <div className="text-sm">{tipo}</div>;
      },
    },
    {
      accessorKey: 'agencia',
      header: 'Agência',
      cell: ({ row }) => {
        const ag = row.original.agencia || '-';
        return <div className="text-sm text-muted-foreground">{ag}</div>;
      },
    },
    {
      accessorKey: 'numero_conta',
      header: 'Número',
      cell: ({ row }) => {
        const num = row.original.numero_conta || '-';
        return <div className="text-sm text-muted-foreground">{num}</div>;
      },
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      cell: ({ row }) => {
        const saldo = row.original.saldo || 0;
        const colorClass = Number(saldo) >= 0 ? 'text-green-600' : 'text-red-600';
        return (
          <div className={`font-bold ${colorClass}`}>
            {Number(saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      },
    },
  ], []);

  const chartRenderer = (rows: SaldoBancarioRow[]) => {
    const chartData = rows
      .filter(row => Number(row.saldo || 0) > 0)
      .map(row => ({
        name: row.nome || row.conta || 'Sem nome',
        value: Number(row.saldo || 0),
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title="Saldos Bancários"
      icon={Landmark}
      iconColor="text-blue-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="saldos_bancarios"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  );
}
