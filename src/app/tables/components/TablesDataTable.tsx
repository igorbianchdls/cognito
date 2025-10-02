'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { FilterState } from '@/components/sheets/core/TableHeader';

interface TablesDataTableProps {
  tableName: string | null;
  filters?: FilterState[];
}

// Helper function to get badge color
const getBadgeColor = (field: string, value: string): string => {
  const valueLower = String(value).toLowerCase();

  // Status colors
  if (field === 'status' || field === 'etapa') {
    if (valueLower.includes('pago') || valueLower.includes('conclu') || valueLower.includes('aprovado') || valueLower.includes('autorizada') || valueLower.includes('ganho')) {
      return 'bg-green-500 text-white hover:bg-green-600';
    }
    if (valueLower.includes('pendente') || valueLower.includes('draft') || valueLower.includes('fazer') || valueLower.includes('qualifica')) {
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    }
    if (valueLower.includes('vencido') || valueLower.includes('cancelad') || valueLower.includes('perdido')) {
      return 'bg-red-500 text-white hover:bg-red-600';
    }
    if (valueLower.includes('andamento') || valueLower.includes('progresso') || valueLower.includes('revisão') || valueLower.includes('negociacao') || valueLower.includes('proposta')) {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    if (valueLower.includes('prospec')) {
      return 'bg-purple-500 text-white hover:bg-purple-600';
    }
  }

  // Category/Type colors
  if (field === 'categoria' || field === 'tipo') {
    const colors = [
      'bg-purple-500 text-white hover:bg-purple-600',
      'bg-pink-500 text-white hover:bg-pink-600',
      'bg-indigo-500 text-white hover:bg-indigo-600',
      'bg-teal-500 text-white hover:bg-teal-600',
      'bg-orange-500 text-white hover:bg-orange-600',
    ];
    const index = value.length % colors.length;
    return colors[index];
  }

  // Prioridade
  if (field === 'prioridade') {
    if (valueLower.includes('urgente')) return 'bg-red-500 text-white hover:bg-red-600';
    if (valueLower.includes('alta')) return 'bg-orange-500 text-white hover:bg-orange-600';
    if (valueLower.includes('média')) return 'bg-blue-500 text-white hover:bg-blue-600';
    if (valueLower.includes('baixa')) return 'bg-gray-500 text-white hover:bg-gray-600';
  }

  return 'bg-gray-500 text-white hover:bg-gray-600';
};

export default function TablesDataTable({ tableName, filters = [] }: TablesDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data, loading, error } = useSupabaseTables(tableName || '');

  // Convert FilterState[] to ColumnFiltersState when filters prop changes
  useEffect(() => {
    const tanstackFilters: ColumnFiltersState = filters
      .filter(f => f.column && f.value) // Only apply filters that have column and value
      .map(f => ({
        id: f.column,
        value: f.value
      }));
    setColumnFilters(tanstackFilters);
  }, [filters]);

  // Get column definitions from SUPABASE_DATASETS
  const datasetConfig = SUPABASE_DATASETS.find(ds => ds.tableName === tableName);

  // Create columns dynamically from dataset config
  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    if (!datasetConfig?.columnDefs) return [];

    return datasetConfig.columnDefs.map((colDef) => ({
      accessorKey: colDef.field || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-gray-100"
          >
            {colDef.headerName || colDef.field}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue(colDef.field || '');
        const fieldName = colDef.field || '';

        // Format based on column type
        if (value === null || value === undefined) return <span className="text-gray-400">—</span>;

        // Badge for special fields (status, etapa, categoria, tipo, prioridade)
        if (fieldName === 'status' || fieldName === 'etapa' || fieldName === 'categoria' || fieldName === 'tipo' || fieldName === 'prioridade') {
          const strValue = String(value);
          return (
            <Badge className={`${getBadgeColor(fieldName, strValue)} font-medium`}>
              {strValue}
            </Badge>
          );
        }

        // Currency formatting
        if (fieldName.includes('valor') || fieldName.includes('preco')) {
          const num = Number(value);
          if (!isNaN(num)) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(num);
          }
        }

        // Date formatting
        if (fieldName.includes('data')) {
          const date = new Date(String(value));
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('pt-BR');
          }
        }

        // Boolean formatting
        if (typeof value === 'boolean') {
          return value ? '✓' : '✗';
        }

        return String(value);
      },
    }));
  }, [datasetConfig]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (!tableName) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Selecione uma tabela</p>
          <p className="text-sm">Escolha uma tabela do painel lateral para visualizar os dados</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af transparent;
        }
      `}} />
      {/* Table with horizontal scroll */}
      <div className="flex-1 overflow-x-auto border-b custom-scrollbar">
        <Table>
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap border-b border-gray-200">
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

      {/* Pagination */}
      <div className="border-t bg-white py-4 px-6 flex items-center justify-between shrink-0">
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
  );
}
