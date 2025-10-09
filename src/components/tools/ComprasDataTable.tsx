'use client';

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

interface ComprasRecord {
  id: string;

  // Campos de fornecedores
  entidade_id?: string;
  codigo_fornecedor?: string;
  prazo_entrega_medio_dias?: number;
  avaliacao_fornecedor?: number;

  // Campos de pedidos_compra
  fornecedor_id?: string;
  solicitante_id?: string;
  numero_pedido?: string;
  data_emissao?: string;
  data_previsao_entrega?: string;
  valor_total?: number;
  status_pedido?: string;
  condicao_pagamento?: string;
  observacoes?: string;

  // Campos de pedido_compra_itens
  pedido_compra_id?: string;
  descricao?: string;
  codigo_produto_fornecedor?: string;
  quantidade_solicitada?: number;
  valor_unitario?: number;
  valor_total_item?: number;

  criado_em?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface ComprasDataTableProps {
  success: boolean;
  count: number;
  data: ComprasRecord[];
  table: string;
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('recebido') || s.includes('received')) return 'bg-purple-100 text-purple-800 border-purple-300';
  if (s.includes('aprovado') || s.includes('approved')) return 'bg-green-100 text-green-800 border-green-300';
  if (s.includes('enviado') || s.includes('sent')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (s.includes('rascunho') || s.includes('draft')) return 'bg-gray-100 text-gray-800 border-gray-300';
  if (s.includes('cancelado') || s.includes('cancelled')) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value?: number, decimals = 2) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return value;
  }
};

const formatStars = (rating?: number) => {
  if (!rating) return '-';
  return '⭐'.repeat(rating);
};

export default function ComprasDataTable({ success, count, data, table, message, error }: ComprasDataTableProps) {
  const columns = useMemo<ColumnDef<ComprasRecord>[]>(() => {
    const baseColumns: ColumnDef<ComprasRecord>[] = [];

    if (table === 'fornecedores') {
      return [
        {
          accessorKey: 'id',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              ID <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('id')}</div>,
        },
        {
          accessorKey: 'codigo_fornecedor',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Código <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
        },
        {
          accessorKey: 'entidade_id',
          header: 'Entidade ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('entidade_id')}</div>,
        },
        {
          accessorKey: 'prazo_entrega_medio_dias',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Prazo Entrega (dias) <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatNumber(row.getValue('prazo_entrega_medio_dias'), 0),
        },
        {
          accessorKey: 'avaliacao_fornecedor',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Avaliação <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatStars(row.getValue('avaliacao_fornecedor')),
        },
        {
          accessorKey: 'criado_em',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Criado em <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('criado_em')),
        },
      ];
    }

    if (table === 'pedidos_compra') {
      return [
        {
          accessorKey: 'numero_pedido',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Nº Pedido <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <div className="font-semibold">{row.getValue('numero_pedido')}</div>,
        },
        {
          accessorKey: 'status_pedido',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Status <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const status = row.getValue('status_pedido') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'data_emissao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Emissão <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('data_emissao')),
        },
        {
          accessorKey: 'data_previsao_entrega',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Previsão Entrega <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('data_previsao_entrega')),
        },
        {
          accessorKey: 'valor_total',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Valor Total <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="font-semibold text-green-700">
              {formatCurrency(row.getValue('valor_total'))}
            </div>
          ),
        },
        {
          accessorKey: 'fornecedor_id',
          header: 'Fornecedor ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('fornecedor_id')}</div>,
        },
        {
          accessorKey: 'condicao_pagamento',
          header: 'Condição Pagamento',
        },
        {
          accessorKey: 'observacoes',
          header: 'Observações',
          cell: ({ row }) => {
            const obs = row.getValue('observacoes') as string;
            return obs ? <div className="max-w-xs truncate">{obs}</div> : '-';
          },
        },
      ];
    }

    if (table === 'pedido_compra_itens') {
      return [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('id')}</div>,
        },
        {
          accessorKey: 'pedido_compra_id',
          header: 'Pedido ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('pedido_compra_id')}</div>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <div className="max-w-sm">{row.getValue('descricao')}</div>,
        },
        {
          accessorKey: 'codigo_produto_fornecedor',
          header: 'Código Produto',
        },
        {
          accessorKey: 'quantidade_solicitada',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Quantidade <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatNumber(row.getValue('quantidade_solicitada')),
        },
        {
          accessorKey: 'valor_unitario',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Valor Unitário <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatCurrency(row.getValue('valor_unitario')),
        },
        {
          accessorKey: 'valor_total_item',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Valor Total <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="font-semibold text-green-700">
              {formatCurrency(row.getValue('valor_total_item'))}
            </div>
          ),
        },
        {
          accessorKey: 'criado_em',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Criado em <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('criado_em')),
        },
      ];
    }

    return baseColumns;
  }, [table]);

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Dados de Gestão de Compras"
      icon={ShoppingCart}
      iconColor="text-orange-600"
      message={message}
      success={success}
      count={count}
      error={error}
      exportFileName={`compras_${table}`}
    />
  );
}
