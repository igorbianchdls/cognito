'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Package } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface InventoryRecord {
  id: string;

  // Campos de centros_distribuicao
  nome?: string;
  endereco?: string;
  ativo?: boolean;

  // Campos de estoque_canal
  product_id?: string;
  channel_id?: string;
  sku_channel?: string;
  quantity_available?: number;
  quantity_reserved?: number;
  last_updated?: string;

  // Campos de integracoes_canais
  api_key?: string;
  config?: unknown;
  last_sync?: string;

  // Campos de movimentacoes_estoque
  order_id?: string;
  type?: string;
  quantity?: number;
  reason?: string;

  // Campos de precos_canais
  price?: number;
  start_date?: string;
  end_date?: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface InventoryDataTableProps {
  success: boolean;
  count: number;
  data: InventoryRecord[];
  table: string;
  message: string;
  error?: string;
}

const getAtivoColor = (ativo?: boolean) => {
  if (ativo === true) return 'bg-green-100 text-green-800 border-green-300';
  if (ativo === false) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getQuantityColor = (qty?: number) => {
  if (qty === undefined || qty === null) return '';
  if (qty === 0) return 'text-red-600 font-bold';
  if (qty < 10) return 'text-orange-600 font-bold';
  return 'text-green-600 font-bold';
};

const getTipoColor = (tipo?: string) => {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('entrada') || t.includes('in')) return 'bg-green-100 text-green-800 border-green-300';
  if (t.includes('saida') || t.includes('out')) return 'bg-red-100 text-red-800 border-red-300';
  if (t.includes('ajuste') || t.includes('adjust')) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR');
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

export default function InventoryDataTable({ success, count, data, table, message, error }: InventoryDataTableProps) {
  const columns: ColumnDef<InventoryRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<InventoryRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    // Colunas específicas por tabela
    if (table === 'centros_distribuicao') {
      return [
        ...baseColumns,
        {
          accessorKey: 'nome',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Nome <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold">{row.getValue('nome') || '-'}</span>,
        },
        {
          accessorKey: 'endereco',
          header: 'Endereço',
          cell: ({ row }) => <span className="text-sm">{row.getValue('endereco') || '-'}</span>,
        },
        {
          accessorKey: 'ativo',
          header: 'Ativo',
          cell: ({ row }) => {
            const ativo = row.getValue('ativo') as boolean;
            return (
              <Badge variant="outline" className={getAtivoColor(ativo)}>
                {ativo ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('created_at'))}</span>,
        },
      ];
    }

    if (table === 'estoque_canal') {
      return [
        ...baseColumns,
        {
          accessorKey: 'sku_channel',
          header: 'SKU Canal',
          cell: ({ row }) => <span className="font-mono font-semibold">{row.getValue('sku_channel') || '-'}</span>,
        },
        {
          accessorKey: 'quantity_available',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Qtd Disponível <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const qty = row.getValue('quantity_available') as number;
            return <span className={`font-semibold text-right block ${getQuantityColor(qty)}`}>{formatNumber(qty)}</span>;
          },
        },
        {
          accessorKey: 'quantity_reserved',
          header: 'Qtd Reservada',
          cell: ({ row }) => <span className="text-right block">{formatNumber(row.getValue('quantity_reserved'))}</span>,
        },
        {
          accessorKey: 'last_updated',
          header: 'Última Atualização',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('last_updated'))}</span>,
        },
      ];
    }

    if (table === 'integracoes_canais') {
      return [
        ...baseColumns,
        {
          accessorKey: 'channel_id',
          header: 'Canal ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('channel_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'api_key',
          header: 'API Key',
          cell: ({ row }) => {
            const key = row.getValue('api_key') as string;
            if (!key) return '-';
            const masked = key.substring(0, 4) + '*****' + key.substring(key.length - 4);
            return <span className="font-mono text-xs text-gray-500">{masked}</span>;
          },
        },
        {
          accessorKey: 'last_sync',
          header: 'Última Sincronização',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('last_sync'))}</span>,
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('created_at'))}</span>,
        },
      ];
    }

    if (table === 'movimentacoes_estoque') {
      return [
        ...baseColumns,
        {
          accessorKey: 'type',
          header: 'Tipo',
          cell: ({ row }) => {
            const tipo = row.getValue('type') as string;
            return (
              <Badge variant="outline" className={getTipoColor(tipo)}>
                {tipo || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'quantity',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Quantidade <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold text-right block">{formatNumber(row.getValue('quantity'))}</span>,
        },
        {
          accessorKey: 'reason',
          header: 'Motivo',
          cell: ({ row }) => <span className="text-sm">{row.getValue('reason') || '-'}</span>,
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('created_at'))}</span>,
        },
      ];
    }

    if (table === 'precos_canais') {
      return [
        ...baseColumns,
        {
          accessorKey: 'price',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Preço <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('price'))}</span>,
        },
        {
          accessorKey: 'start_date',
          header: 'Data Início',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('start_date'))}</span>,
        },
        {
          accessorKey: 'end_date',
          header: 'Data Fim',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('end_date'))}</span>,
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('created_at'))}</span>,
        },
      ];
    }

    // Fallback: retornar colunas básicas
    return baseColumns;
  }, [table]);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Gestão de Estoque"
      icon={Package}
      iconColor="text-amber-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`inventory_${table}`}
    />
  );
}
