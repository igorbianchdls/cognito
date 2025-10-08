'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, ArrowUpDown, ChevronLeft, ChevronRight, FolderKanban } from 'lucide-react';
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

interface ProjetosRecord {
  id: string | number;

  // Campos de projects
  name?: string;
  description?: string;
  owner_id?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;

  // Campos de tasks
  title?: string;
  status_id?: number;
  project_id?: string;
  assignee_id?: string;
  due_date?: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface ProjetosDataTableProps {
  success: boolean;
  count: number;
  data: ProjetosRecord[];
  table: string;
  message: string;
  error?: string;
}

const getStatusColor = (statusId?: number, statusName?: string) => {
  if (statusName) {
    const s = statusName.toLowerCase();
    if (s.includes('done') || s.includes('concluí')) return 'bg-green-100 text-green-800 border-green-300';
    if (s.includes('progress') || s.includes('andamento')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (s.includes('blocked') || s.includes('bloqueado')) return 'bg-red-100 text-red-800 border-red-300';
    if (s.includes('review') || s.includes('revisão')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (s.includes('testing') || s.includes('teste')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }

  // Color by status ID
  const statusMap: Record<number, string> = {
    1: 'bg-gray-100 text-gray-800 border-gray-300', // To Do
    2: 'bg-blue-100 text-blue-800 border-blue-300', // In Progress
    3: 'bg-green-100 text-green-800 border-green-300', // Done
    4: 'bg-red-100 text-red-800 border-red-300' // Blocked
  };
  return statusMap[statusId || 0] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusLabel = (statusId?: number) => {
  const statusMap: Record<number, string> = {
    1: 'To Do',
    2: 'In Progress',
    3: 'Done',
    4: 'Blocked'
  };
  return statusMap[statusId || 0] || `Status ${statusId}`;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('pt-BR');
  } catch {
    return value;
  }
};

const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export default function ProjetosDataTable({ success, count, data, table, message, error }: ProjetosDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Definir colunas dinamicamente com base na tabela
  const columns = useMemo<ColumnDef<ProjetosRecord>[]>(() => {
    const baseColumns: ColumnDef<ProjetosRecord>[] = [];

    if (table === 'projects') {
      return [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('id')}</div>,
        },
        {
          accessorKey: 'name',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Nome do Projeto <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <div className="font-semibold max-w-xs">{row.getValue('name')}</div>,
        },
        {
          accessorKey: 'description',
          header: 'Descrição',
          cell: ({ row }) => {
            const desc = row.getValue('description') as string;
            return desc ? <div className="max-w-md truncate">{desc}</div> : '-';
          },
        },
        {
          accessorKey: 'owner_id',
          header: 'Responsável',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('owner_id')}</div>,
        },
        {
          accessorKey: 'team_id',
          header: 'Equipe',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('team_id') || '-'}</div>,
        },
        {
          accessorKey: 'start_date',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Início <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('start_date')),
        },
        {
          accessorKey: 'end_date',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Fim <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => formatDate(row.getValue('end_date')),
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => formatDate(row.getValue('created_at')),
        },
      ];
    }

    if (table === 'status_types') {
      return [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => <div className="font-semibold">{row.getValue('id')}</div>,
        },
        {
          accessorKey: 'name',
          header: 'Nome do Status',
          cell: ({ row }) => {
            const name = row.getValue('name') as string;
            return (
              <Badge variant="outline" className={getStatusColor(undefined, name)}>
                {name}
              </Badge>
            );
          },
        },
      ];
    }

    if (table === 'tasks') {
      return [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('id')}</div>,
        },
        {
          accessorKey: 'title',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Título <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <div className="font-semibold max-w-xs">{row.getValue('title')}</div>,
        },
        {
          accessorKey: 'description',
          header: 'Descrição',
          cell: ({ row }) => {
            const desc = row.getValue('description') as string;
            return desc ? <div className="max-w-md truncate">{desc}</div> : '-';
          },
        },
        {
          accessorKey: 'status_id',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Status <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const statusId = row.getValue('status_id') as number;
            return (
              <Badge variant="outline" className={getStatusColor(statusId)}>
                {getStatusLabel(statusId)}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'project_id',
          header: 'Projeto',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('project_id')}</div>,
        },
        {
          accessorKey: 'assignee_id',
          header: 'Responsável',
          cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('assignee_id') || '-'}</div>,
        },
        {
          accessorKey: 'due_date',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Prazo <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => {
            const dueDate = row.getValue('due_date') as string;
            if (!dueDate) return '-';

            const dateStr = formatDate(dueDate);
            const overdue = isOverdue(dueDate);

            if (overdue) {
              return (
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold">⚠️ {dateStr}</span>
                </div>
              );
            }
            return dateStr;
          },
        },
        {
          accessorKey: 'created_at',
          header: 'Criado em',
          cell: ({ row }) => formatDate(row.getValue('created_at')),
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
    'projects': 'Projetos',
    'status_types': 'Status Types',
    'tasks': 'Tarefas'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-blue-600" />
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
