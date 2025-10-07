'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, ArrowUpDown, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
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

interface FinancialRecord {
  id: string | number;
  valor?: number;
  status?: string;
  data_vencimento?: string;
  data_emissao?: string;
  descricao?: string;
  [key: string]: unknown;
}

interface FinancialDataTableProps {
  success: boolean;
  count: number;
  data: FinancialRecord[];
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'pago': return 'bg-green-100 text-green-800 border-green-300';
    case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'vencido': return 'bg-red-100 text-red-800 border-red-300';
    case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function FinancialDataTable({ success, count, data, message, error }: FinancialDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<FinancialRecord>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium">#{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.getValue<string | undefined>('descricao');
        return desc ? <span className="max-w-xs truncate block">{desc}</span> : '-';
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const valor = row.getValue<number | undefined>('valor');
        return valor !== undefined
          ? `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '-';
      },
    },
    {
      accessorKey: 'data_vencimento',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Vencimento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const data = row.getValue<string | undefined>('data_vencimento');
        return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'data_emissao',
      header: 'Emissão',
      cell: ({ row }) => {
        const data = row.getValue<string | undefined>('data_emissao');
        return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue<string | undefined>('status');
        return status ? <Badge className={getStatusColor(status)}>{status}</Badge> : '-';
      },
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (!success) {
    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Erro ao Buscar Dados Financeiros
          </CardTitle>
          <CardDescription className="text-red-600">
            {error || 'Erro desconhecido ao buscar dados'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="w-full border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Nenhum Registro Encontrado
          </CardTitle>
          <CardDescription>
            Não há registros financeiros que correspondam à consulta.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-blue-700">{message}</CardTitle>
          </div>
          <CardDescription className="text-blue-600">
            {count} registro{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {data && data.length > 0 && (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="border-t bg-white py-4 px-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} até{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{' '}
              de {data.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
