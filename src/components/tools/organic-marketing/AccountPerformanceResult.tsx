'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import EntityDisplay from '@/components/modulos/EntityDisplay';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Users } from 'lucide-react';

interface Row extends Record<string, unknown> {
  nome_conta?: string;
  plataforma?: string;
  total_impressoes?: number | string;
  total_visualizacoes?: number | string;
  taxa_engajamento_total?: number | string;
  taxa_view?: number | string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function AccountPerformanceResult({ success, message, rows = [], count, sql_query }: Props) {
  const [rowsState, setRowsState] = useState(rows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = useMemo(() => rowsState as Row[], [rowsState]);

  const columns: ColumnDef<Row>[] = useMemo(() => {
    if (!data.length) return [ { accessorKey: 'info', header: 'Info' } as ColumnDef<Row> ];

    const cols: ColumnDef<Row>[] = [];

    // Se existe nome_conta, criar coluna especial com EntityDisplay
    if (data.some(r => typeof r.nome_conta === 'string')) {
      cols.push({
        accessorKey: 'nome_conta',
        header: 'Conta',
        size: 250,
        minSize: 200,
        cell: ({ row }) => {
          const nomeConta = row.original.nome_conta || 'Sem nome';
          const plataforma = row.original.plataforma || 'Sem plataforma';
          return <EntityDisplay name={String(nomeConta)} subtitle={String(plataforma)} />;
        },
      } as ColumnDef<Row>);
    }

    // Adicionar as outras colunas dinamicamente (exceto nome_conta e plataforma se já adicionadas)
    const sample = data[0];
    Object.keys(sample).forEach((key) => {
      if (key === 'nome_conta' && cols.length > 0) return; // já adicionado
      if (key === 'plataforma' && data.some(r => typeof r.nome_conta === 'string')) return; // usado como subtitle

      cols.push({
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        cell: ({ row }) => String(row.getValue(key) ?? ''),
      } as ColumnDef<Row>);
    });

    return cols;
  }, [data]);

  const chartRenderer = () => (
    <ChartSwitcher
      rows={data}
      options={{
        xKey: (data.some(r => typeof r.nome_conta === 'string') ? 'nome_conta' : 'plataforma'),
        valueKeys: ['taxa_engajamento_total','taxa_view','total_impressoes'],
        metricLabels: {
          taxa_engajamento_total: 'Engajamento total (%)',
          taxa_view: 'Taxa de view (%)',
          total_impressoes: 'Impressões',
        },
        title: 'Indicadores por conta',
        xLegend: 'Conta',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Desempenho por conta"
      icon={Users}
      iconColor="text-blue-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="desempenho-por-conta"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          const res = await fetch(`/api/tools/organic-marketing/desempenho-conta?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar desempenho por conta (orgânico):', e);
        }
      }}
    />
  );
}
