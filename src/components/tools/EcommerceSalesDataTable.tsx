'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface EcommerceRecord {
  id: string;

  // Campos de channels
  name?: string;
  type?: string;
  is_active?: boolean;
  config?: unknown;

  // Campos de coupons
  code?: string;
  discount_value?: number;
  discount_type?: string;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  times_used?: number;

  // Campos de customers
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  total_spent?: number;
  total_orders?: number;

  // Campos de loyalty_points
  customer_id?: string;
  points?: number;
  earned_date?: string;
  expiry_date?: string;

  // Campos de loyalty_rewards
  reward_name?: string;
  points_required?: number;
  description?: string;

  // Campos de order_items
  order_id?: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;

  // Campos de orders
  channel_id?: string;
  status?: string;
  order_date?: string;
  total_value?: number;
  shipping_cost?: number;
  discount?: number;

  // Campos de payments
  amount?: number;
  payment_method?: string;
  payment_date?: string;
  transaction_id?: string;

  // Campos de products
  sku?: string;
  price?: number;
  stock_quantity?: number;
  category?: string;

  // Campos de returns
  return_date?: string;
  reason?: string;
  refund_amount?: number;
  return_status?: string;

  criado_em?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface EcommerceSalesDataTableProps {
  success: boolean;
  count: number;
  data: EcommerceRecord[];
  table: string;
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('completed') || s.includes('approved') || s.includes('paid')) return 'bg-green-100 text-green-800 border-green-300';
  if (s.includes('pending') || s.includes('processing')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (s.includes('cancelled') || s.includes('rejected') || s.includes('failed')) return 'bg-red-100 text-red-800 border-red-300';
  if (s.includes('refunded')) return 'bg-blue-100 text-blue-800 border-blue-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getActiveColor = (active?: boolean) => {
  if (active === true) return 'bg-green-100 text-green-800 border-green-300';
  if (active === false) return 'bg-red-100 text-red-800 border-red-300';
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

export default function EcommerceSalesDataTable({ success, count, data, table, message, error }: EcommerceSalesDataTableProps) {
  const columns: ColumnDef<EcommerceRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<EcommerceRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    if (table === 'channels') {
      return [
        ...baseColumns,
        {
          accessorKey: 'name',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Nome <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold">{row.getValue('name') || '-'}</span>,
        },
        {
          accessorKey: 'type',
          header: 'Tipo',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('type') || '-'}</Badge>,
        },
        {
          accessorKey: 'is_active',
          header: 'Ativo',
          cell: ({ row }) => {
            const active = row.getValue('is_active') as boolean;
            return (
              <Badge variant="outline" className={getActiveColor(active)}>
                {active ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
      ];
    }

    if (table === 'coupons') {
      return [
        ...baseColumns,
        {
          accessorKey: 'code',
          header: 'Código',
          cell: ({ row }) => <span className="font-mono font-semibold">{row.getValue('code') || '-'}</span>,
        },
        {
          accessorKey: 'discount_type',
          header: 'Tipo',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('discount_type') || '-'}</Badge>,
        },
        {
          accessorKey: 'discount_value',
          header: 'Valor',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('discount_value'))}</span>,
        },
        {
          accessorKey: 'times_used',
          header: 'Usos',
          cell: ({ row }) => <span>{formatNumber(row.getValue('times_used'))}</span>,
        },
        {
          accessorKey: 'valid_until',
          header: 'Válido até',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('valid_until'))}</span>,
        },
      ];
    }

    if (table === 'customers') {
      return [
        ...baseColumns,
        {
          accessorKey: 'email',
          header: 'Email',
          cell: ({ row }) => <span className="text-sm">{row.getValue('email') || '-'}</span>,
        },
        {
          accessorKey: 'first_name',
          header: 'Nome',
          cell: ({ row }) => {
            const firstName = row.getValue('first_name') as string;
            const lastName = (row.original.last_name || '') as string;
            return <span className="font-semibold">{`${firstName} ${lastName}`.trim() || '-'}</span>;
          },
        },
        {
          accessorKey: 'total_orders',
          header: 'Pedidos',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('total_orders'))}</span>,
        },
        {
          accessorKey: 'total_spent',
          header: 'Total Gasto',
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('total_spent'))}</span>,
        },
      ];
    }

    if (table === 'loyalty_points') {
      return [
        ...baseColumns,
        {
          accessorKey: 'customer_id',
          header: 'Cliente ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('customer_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'points',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Pontos <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold text-purple-600">{formatNumber(row.getValue('points'))}</span>,
        },
        {
          accessorKey: 'earned_date',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('earned_date'))}</span>,
        },
        {
          accessorKey: 'expiry_date',
          header: 'Expira em',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('expiry_date'))}</span>,
        },
      ];
    }

    if (table === 'loyalty_rewards') {
      return [
        ...baseColumns,
        {
          accessorKey: 'reward_name',
          header: 'Recompensa',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('reward_name') || '-'}</span>,
        },
        {
          accessorKey: 'points_required',
          header: 'Pontos',
          cell: ({ row }) => <span className="font-semibold text-purple-600">{formatNumber(row.getValue('points_required'))}</span>,
        },
        {
          accessorKey: 'description',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('description') || '-'}</span>,
        },
      ];
    }

    if (table === 'order_items') {
      return [
        ...baseColumns,
        {
          accessorKey: 'order_id',
          header: 'Pedido ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('order_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'product_id',
          header: 'Produto ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('product_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'quantity',
          header: 'Qtd',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('quantity'))}</span>,
        },
        {
          accessorKey: 'unit_price',
          header: 'Preço Unit.',
          cell: ({ row }) => <span>{formatCurrency(row.getValue('unit_price'))}</span>,
        },
        {
          accessorKey: 'subtotal',
          header: 'Subtotal',
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('subtotal'))}</span>,
        },
      ];
    }

    if (table === 'orders') {
      return [
        ...baseColumns,
        {
          accessorKey: 'customer_id',
          header: 'Cliente ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('customer_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'total_value',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Valor Total <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('total_value'))}</span>,
        },
        {
          accessorKey: 'order_date',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('order_date'))}</span>,
        },
      ];
    }

    if (table === 'payments') {
      return [
        ...baseColumns,
        {
          accessorKey: 'order_id',
          header: 'Pedido ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('order_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'payment_method',
          header: 'Método',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('payment_method') || '-'}</Badge>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'amount',
          header: 'Valor',
          cell: ({ row }) => <span className="font-semibold text-green-600">{formatCurrency(row.getValue('amount'))}</span>,
        },
        {
          accessorKey: 'payment_date',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('payment_date'))}</span>,
        },
      ];
    }

    if (table === 'products') {
      return [
        ...baseColumns,
        {
          accessorKey: 'name',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Nome <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="font-semibold">{row.getValue('name') || '-'}</span>,
        },
        {
          accessorKey: 'sku',
          header: 'SKU',
          cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('sku') || '-'}</span>,
        },
        {
          accessorKey: 'category',
          header: 'Categoria',
          cell: ({ row }) => <Badge variant="outline">{row.getValue('category') || '-'}</Badge>,
        },
        {
          accessorKey: 'price',
          header: 'Preço',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('price'))}</span>,
        },
        {
          accessorKey: 'stock_quantity',
          header: 'Estoque',
          cell: ({ row }) => {
            const qty = row.getValue('stock_quantity') as number;
            const color = qty === 0 ? 'text-red-600' : qty < 10 ? 'text-orange-600' : 'text-green-600';
            return <span className={`font-semibold ${color}`}>{formatNumber(qty)}</span>;
          },
        },
      ];
    }

    if (table === 'returns') {
      return [
        ...baseColumns,
        {
          accessorKey: 'order_id',
          header: 'Pedido ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('order_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'return_status',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('return_status') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'reason',
          header: 'Motivo',
          cell: ({ row }) => <span className="text-sm">{row.getValue('reason') || '-'}</span>,
        },
        {
          accessorKey: 'refund_amount',
          header: 'Reembolso',
          cell: ({ row }) => <span className="font-semibold text-red-600">{formatCurrency(row.getValue('refund_amount'))}</span>,
        },
        {
          accessorKey: 'return_date',
          header: 'Data',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('return_date'))}</span>,
        },
      ];
    }

    return baseColumns;
  }, [table]);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Vendas E-commerce"
      icon={ShoppingCart}
      iconColor="text-cyan-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`ecommerce_${table}`}
    />
  );
}
