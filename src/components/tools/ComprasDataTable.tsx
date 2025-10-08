'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

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
  const [sorting, setSorting] = useState<SortingState>([]);

  // Definir colunas dinamicamente com base na tabela
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

  const tableInstance = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (!success && error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            Erro ao buscar dados
          </CardTitle>
          <CardDescription className="text-red-600">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const tableLabels: Record<string, string> = {
    'fornecedores': 'Fornecedores',
    'pedidos_compra': 'Pedidos de Compra',
    'pedido_compra_itens': 'Itens de Pedido'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          {tableLabels[table] || table}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {tableInstance.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {tableInstance.getRowModel().rows?.length ? (
                  tableInstance.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Página {tableInstance.getState().pagination.pageIndex + 1} de{' '}
              {tableInstance.getPageCount()} ({count} registros)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => tableInstance.previousPage()}
                disabled={!tableInstance.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => tableInstance.nextPage()}
                disabled={!tableInstance.getCanNextPage()}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
