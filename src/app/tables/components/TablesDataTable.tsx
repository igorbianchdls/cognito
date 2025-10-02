'use client';

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
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
import {
  $rowHeight,
  $headerRowHeight,
  $fontSize,
  $headerFontSize,
  $cellTextColor,
  $headerTextColor,
  $cellFontFamily,
  $headerFontFamily,
  $cellLetterSpacing,
  $headerLetterSpacing,
} from '@/stores/table/tablePreferences';

interface TablesDataTableProps {
  tableName: string | null;
  filters?: FilterState[];
}

// Helper functions to get badge colors (soft palette)
const getBadgeBackgroundColor = (field: string, value: string): string => {
  const valueLower = String(value).toLowerCase();

  // Status colors
  if (field === 'status' || field === 'etapa') {
    if (valueLower.includes('pago') || valueLower.includes('conclu') || valueLower.includes('aprovado') || valueLower.includes('autorizada') || valueLower.includes('ganho')) {
      return '#f0fdf4'; // green-50
    }
    if (valueLower.includes('pendente') || valueLower.includes('draft') || valueLower.includes('fazer') || valueLower.includes('qualifica')) {
      return '#fefce8'; // yellow-50
    }
    if (valueLower.includes('vencido') || valueLower.includes('cancelad') || valueLower.includes('perdido')) {
      return '#fef2f2'; // red-50
    }
    if (valueLower.includes('andamento') || valueLower.includes('progresso') || valueLower.includes('revisão') || valueLower.includes('negociacao') || valueLower.includes('proposta')) {
      return '#eff6ff'; // blue-50
    }
    if (valueLower.includes('prospec')) {
      return '#faf5ff'; // purple-50
    }
  }

  // Category/Type colors
  if (field === 'categoria' || field === 'tipo') {
    const colors = ['#faf5ff', '#fdf2f8', '#eef2ff', '#f0fdfa', '#fff7ed'];
    const index = value.length % colors.length;
    return colors[index];
  }

  // Prioridade
  if (field === 'prioridade') {
    if (valueLower.includes('urgente')) return '#fef2f2';
    if (valueLower.includes('alta')) return '#fff7ed';
    if (valueLower.includes('média')) return '#eff6ff';
    if (valueLower.includes('baixa')) return '#f9fafb';
  }

  return '#f9fafb'; // gray-50
};

const getBadgeTextColor = (field: string, value: string): string => {
  const valueLower = String(value).toLowerCase();

  // Status colors
  if (field === 'status' || field === 'etapa') {
    if (valueLower.includes('pago') || valueLower.includes('conclu') || valueLower.includes('aprovado') || valueLower.includes('autorizada') || valueLower.includes('ganho')) {
      return '#166534'; // green-800
    }
    if (valueLower.includes('pendente') || valueLower.includes('draft') || valueLower.includes('fazer') || valueLower.includes('qualifica')) {
      return '#854d0e'; // yellow-800
    }
    if (valueLower.includes('vencido') || valueLower.includes('cancelad') || valueLower.includes('perdido')) {
      return '#991b1b'; // red-800
    }
    if (valueLower.includes('andamento') || valueLower.includes('progresso') || valueLower.includes('revisão') || valueLower.includes('negociacao') || valueLower.includes('proposta')) {
      return '#1e40af'; // blue-800
    }
    if (valueLower.includes('prospec')) {
      return '#6b21a8'; // purple-800
    }
  }

  // Category/Type colors
  if (field === 'categoria' || field === 'tipo') {
    const colors = ['#6b21a8', '#9f1239', '#3730a3', '#115e59', '#9a3412'];
    const index = value.length % colors.length;
    return colors[index];
  }

  // Prioridade
  if (field === 'prioridade') {
    if (valueLower.includes('urgente')) return '#991b1b';
    if (valueLower.includes('alta')) return '#9a3412';
    if (valueLower.includes('média')) return '#1e40af';
    if (valueLower.includes('baixa')) return '#374151';
  }

  return '#374151'; // gray-700
};

const getBadgeBorderColor = (field: string, value: string): string => {
  const valueLower = String(value).toLowerCase();

  // Status colors
  if (field === 'status' || field === 'etapa') {
    if (valueLower.includes('pago') || valueLower.includes('conclu') || valueLower.includes('aprovado') || valueLower.includes('autorizada') || valueLower.includes('ganho')) {
      return '#bbf7d0'; // green-200
    }
    if (valueLower.includes('pendente') || valueLower.includes('draft') || valueLower.includes('fazer') || valueLower.includes('qualifica')) {
      return '#fde047'; // yellow-300
    }
    if (valueLower.includes('vencido') || valueLower.includes('cancelad') || valueLower.includes('perdido')) {
      return '#fecaca'; // red-200
    }
    if (valueLower.includes('andamento') || valueLower.includes('progresso') || valueLower.includes('revisão') || valueLower.includes('negociacao') || valueLower.includes('proposta')) {
      return '#bfdbfe'; // blue-200
    }
    if (valueLower.includes('prospec')) {
      return '#e9d5ff'; // purple-200
    }
  }

  // Category/Type colors
  if (field === 'categoria' || field === 'tipo') {
    const colors = ['#e9d5ff', '#fbcfe8', '#c7d2fe', '#99f6e4', '#fed7aa'];
    const index = value.length % colors.length;
    return colors[index];
  }

  // Prioridade
  if (field === 'prioridade') {
    if (valueLower.includes('urgente')) return '#fecaca';
    if (valueLower.includes('alta')) return '#fed7aa';
    if (valueLower.includes('média')) return '#bfdbfe';
    if (valueLower.includes('baixa')) return '#e5e7eb';
  }

  return '#e5e7eb'; // gray-200
};

export default function TablesDataTable({ tableName, filters = [] }: TablesDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data, loading, error } = useSupabaseTables(tableName || '');

  // Table preferences from nanostores
  const rowHeight = useStore($rowHeight);
  const headerRowHeight = useStore($headerRowHeight);
  const fontSize = useStore($fontSize);
  const headerFontSize = useStore($headerFontSize);
  const cellTextColor = useStore($cellTextColor);
  const headerTextColor = useStore($headerTextColor);
  const cellFontFamily = useStore($cellFontFamily);
  const headerFontFamily = useStore($headerFontFamily);
  const cellLetterSpacing = useStore($cellLetterSpacing);
  const headerLetterSpacing = useStore($headerLetterSpacing);

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
            style={{
              fontSize: `${headerFontSize}px`,
              fontFamily: headerFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
              letterSpacing: headerLetterSpacing,
            }}
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
            <Badge
              className="px-2 py-0.5 text-xs font-normal border rounded-sm"
              style={{
                backgroundColor: getBadgeBackgroundColor(fieldName, strValue),
                color: getBadgeTextColor(fieldName, strValue),
                borderColor: getBadgeBorderColor(fieldName, strValue),
              }}
            >
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
  }, [datasetConfig, headerFontSize, headerFontFamily, headerLetterSpacing]);

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
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap font-semibold"
                    style={{
                      paddingTop: `${(headerRowHeight - headerFontSize) / 2}px`,
                      paddingBottom: `${(headerRowHeight - headerFontSize) / 2}px`,
                      fontSize: `${headerFontSize}px`,
                      color: headerTextColor,
                      fontFamily: headerFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
                      letterSpacing: headerLetterSpacing,
                    }}
                  >
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
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap border-b border-gray-200"
                      style={{
                        paddingTop: `${(rowHeight - fontSize) / 2}px`,
                        paddingBottom: `${(rowHeight - fontSize) / 2}px`,
                        fontSize: `${fontSize}px`,
                        color: cellTextColor,
                        fontFamily: cellFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
                        letterSpacing: cellLetterSpacing,
                      }}
                    >
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
