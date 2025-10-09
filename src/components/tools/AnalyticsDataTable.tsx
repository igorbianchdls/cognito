'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface AnalyticsRecord {
  id: string;

  // Campos de agregado_diario_por_fonte
  data?: string;
  fonte?: string;
  pageviews?: number;
  sessoes?: number;
  usuarios?: number;

  // Campos de agregado_diario_por_pagina
  pagina?: string;

  // Campos de consentimentos_visitante
  visitor_id?: string;
  consent_status?: string;
  consent_timestamp?: string;
  analytics_allowed?: boolean;
  marketing_allowed?: boolean;

  // Campos de eventos
  session_id?: string;
  event_name?: string;
  event_timestamp?: string;
  page_url?: string;
  event_properties?: unknown;

  // Campos de itens_transacao
  transaction_id?: string;
  product_name?: string;
  quantity?: number;
  price?: number;

  // Campos de metas
  goal_name?: string;
  goal_condition?: string;
  conversion_value?: number;

  // Campos de propriedades_analytics
  property_name?: string;
  property_value?: string;

  // Campos de propriedades_visitante
  browser?: string;
  os?: string;
  device_type?: string;

  // Campos de sessoes
  session_start?: string;
  session_end?: string;
  duration_seconds?: number;
  pages_viewed?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  eh_bot?: boolean;

  // Campos de transacoes_analytics
  transaction_timestamp?: string;
  revenue?: number;
  tax?: number;
  shipping?: number;

  // Campos de visitantes
  first_seen?: string;
  last_seen?: string;
  total_sessions?: number;
  total_pageviews?: number;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface AnalyticsDataTableProps {
  success: boolean;
  count: number;
  data: AnalyticsRecord[];
  table: string;
  message: string;
  error?: string;
}

const getBooleanColor = (value?: boolean) => {
  if (value === true) return 'bg-green-100 text-green-800 border-green-300';
  if (value === false) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};

export default function AnalyticsDataTable({ success, count, data, table, message, error }: AnalyticsDataTableProps) {
  const columns: ColumnDef<AnalyticsRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<AnalyticsRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    if (table === 'agregado_diario_por_fonte') {
      return [
        ...baseColumns,
        {
          accessorKey: 'data',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data'))}</span>,
        },
        {
          accessorKey: 'fonte',
          header: 'Fonte',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('fonte') || '-'}</Badge>,
        },
        {
          accessorKey: 'pageviews',
          header: 'Pageviews',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('pageviews'))}</span>,
        },
        {
          accessorKey: 'sessoes',
          header: 'Sessões',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('sessoes'))}</span>,
        },
        {
          accessorKey: 'usuarios',
          header: 'Usuários',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatNumber(row.getValue('usuarios'))}</span>,
        },
      ];
    }

    if (table === 'agregado_diario_por_pagina') {
      return [
        ...baseColumns,
        {
          accessorKey: 'data',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data'))}</span>,
        },
        {
          accessorKey: 'pagina',
          header: 'Página',
          cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('pagina') || '-'}</span>,
        },
        {
          accessorKey: 'pageviews',
          header: 'Pageviews',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatNumber(row.getValue('pageviews'))}</span>,
        },
      ];
    }

    if (table === 'consentimentos_visitante') {
      return [
        ...baseColumns,
        {
          accessorKey: 'visitor_id',
          header: 'Visitante',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('visitor_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'consent_status',
          header: 'Status',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('consent_status') || '-'}</Badge>,
        },
        {
          accessorKey: 'analytics_allowed',
          header: 'Analytics',
          cell: ({ row }) => {
            const allowed = row.getValue('analytics_allowed') as boolean;
            return (
              <Badge variant="outline" className={getBooleanColor(allowed)}>
                {allowed ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'marketing_allowed',
          header: 'Marketing',
          cell: ({ row }) => {
            const allowed = row.getValue('marketing_allowed') as boolean;
            return (
              <Badge variant="outline" className={getBooleanColor(allowed)}>
                {allowed ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'consent_timestamp',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('consent_timestamp'))}</span>,
        },
      ];
    }

    if (table === 'eventos') {
      return [
        ...baseColumns,
        {
          accessorKey: 'session_id',
          header: 'Sessão',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('session_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'event_name',
          header: 'Evento',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('event_name') || '-'}</Badge>,
        },
        {
          accessorKey: 'page_url',
          header: 'Página',
          cell: ({ row }) => <span className="font-mono text-xs truncate max-w-xs">{row.getValue('page_url') || '-'}</span>,
        },
        {
          accessorKey: 'event_timestamp',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Timestamp <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('event_timestamp'))}</span>,
        },
      ];
    }

    if (table === 'itens_transacao') {
      return [
        ...baseColumns,
        {
          accessorKey: 'transaction_id',
          header: 'Transação',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('transaction_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'product_name',
          header: 'Produto',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('product_name') || '-'}</span>,
        },
        {
          accessorKey: 'quantity',
          header: 'Qtd',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('quantity'))}</span>,
        },
        {
          accessorKey: 'price',
          header: 'Preço',
          cell: ({ row }) => <span className="text-green-600">{formatCurrency(row.getValue('price'))}</span>,
        },
      ];
    }

    if (table === 'metas') {
      return [
        ...baseColumns,
        {
          accessorKey: 'goal_name',
          header: 'Meta',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('goal_name') || '-'}</span>,
        },
        {
          accessorKey: 'goal_condition',
          header: 'Condição',
          cell: ({ row }) => <span className="text-sm font-mono">{row.getValue('goal_condition') || '-'}</span>,
        },
        {
          accessorKey: 'conversion_value',
          header: 'Valor',
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('conversion_value'))}</span>,
        },
      ];
    }

    if (table === 'propriedades_analytics') {
      return [
        ...baseColumns,
        {
          accessorKey: 'property_name',
          header: 'Propriedade',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('property_name') || '-'}</span>,
        },
        {
          accessorKey: 'property_value',
          header: 'Valor',
          cell: ({ row }) => <span className="text-sm">{row.getValue('property_value') || '-'}</span>,
        },
      ];
    }

    if (table === 'propriedades_visitante') {
      return [
        ...baseColumns,
        {
          accessorKey: 'visitor_id',
          header: 'Visitante',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('visitor_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'browser',
          header: 'Navegador',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('browser') || '-'}</Badge>,
        },
        {
          accessorKey: 'os',
          header: 'SO',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('os') || '-'}</Badge>,
        },
        {
          accessorKey: 'device_type',
          header: 'Dispositivo',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('device_type') || '-'}</Badge>,
        },
      ];
    }

    if (table === 'sessoes') {
      return [
        ...baseColumns,
        {
          accessorKey: 'visitor_id',
          header: 'Visitante',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('visitor_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'session_start',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Início <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('session_start'))}</span>,
        },
        {
          accessorKey: 'duration_seconds',
          header: 'Duração',
          cell: ({ row }) => <span className="font-semibold">{formatDuration(row.getValue('duration_seconds'))}</span>,
        },
        {
          accessorKey: 'pages_viewed',
          header: 'Páginas',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('pages_viewed'))}</span>,
        },
        {
          accessorKey: 'utm_source',
          header: 'Fonte',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('utm_source') || '-'}</Badge>,
        },
        {
          accessorKey: 'eh_bot',
          header: 'Bot',
          cell: ({ row }) => {
            const bot = row.getValue('eh_bot') as boolean;
            return (
              <Badge variant="outline" className={bot ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}>
                {bot ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
      ];
    }

    if (table === 'transacoes_analytics') {
      return [
        ...baseColumns,
        {
          accessorKey: 'session_id',
          header: 'Sessão',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('session_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'revenue',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Receita <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('revenue'))}</span>,
        },
        {
          accessorKey: 'tax',
          header: 'Impostos',
          cell: ({ row }) => <span>{formatCurrency(row.getValue('tax'))}</span>,
        },
        {
          accessorKey: 'shipping',
          header: 'Frete',
          cell: ({ row }) => <span>{formatCurrency(row.getValue('shipping'))}</span>,
        },
        {
          accessorKey: 'transaction_timestamp',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('transaction_timestamp'))}</span>,
        },
      ];
    }

    if (table === 'visitantes') {
      return [
        ...baseColumns,
        {
          accessorKey: 'visitor_id',
          header: 'Visitante',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('visitor_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'first_seen',
          header: 'Primeira Visita',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('first_seen'))}</span>,
        },
        {
          accessorKey: 'last_seen',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Última Visita <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('last_seen'))}</span>,
        },
        {
          accessorKey: 'total_sessions',
          header: 'Sessões',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('total_sessions'))}</span>,
        },
        {
          accessorKey: 'total_pageviews',
          header: 'Pageviews',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatNumber(row.getValue('total_pageviews'))}</span>,
        },
      ];
    }

    return baseColumns;
  }, [table]);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Analytics Web"
      icon={BarChart3}
      iconColor="text-violet-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`analytics_${table}`}
    />
  );
}
