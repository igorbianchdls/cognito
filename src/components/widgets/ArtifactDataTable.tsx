'use client';

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  Table,
  Code,
  type LucideIcon
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface ArtifactDataTableProps<TData> {
  // Dados da tabela
  data: TData[];
  columns: ColumnDef<TData>[];

  // Informações do Artifact
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  message: string;

  // Estados
  success: boolean;
  count: number;
  error?: string;

  // Export
  exportFileName?: string;

  // Configurações opcionais
  pageSize?: number;

  // SQL utilizada para os dados, quando disponível
  sqlQuery?: string;
}

export default function ArtifactDataTable<TData extends Record<string, unknown>>({
  data,
  columns,
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  message,
  success,
  count,
  error,
  exportFileName = 'data',
  pageSize = 10,
  sqlQuery,
}: ArtifactDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'sql'>('table');

  useEffect(() => {
    if (!sqlQuery) {
      setViewMode('table');
    }
  }, [sqlQuery]);

  const isSqlView = useMemo(() => viewMode === 'sql' && Boolean(sqlQuery), [viewMode, sqlQuery]);

  const reactTable = useReactTable({
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
        pageSize,
      },
    },
  });

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!success) {
    return (
      <Artifact className="w-full border-red-200 bg-red-50">
        <ArtifactHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <ArtifactTitle className="text-red-800">Erro ao Buscar Dados</ArtifactTitle>
          </div>
        </ArtifactHeader>
        <ArtifactContent>
          <p className="text-red-700">{message}</p>
          {error && (
            <p className="text-sm text-red-600 font-mono bg-red-100 p-3 rounded-md mt-2">{error}</p>
          )}
        </ArtifactContent>
      </Artifact>
    );
  }

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <ArtifactTitle>{title}</ArtifactTitle>
          </div>
          <ArtifactDescription className="mt-1">
            {message} - Mostrando {reactTable.getRowModel().rows.length} de {count} registros
          </ArtifactDescription>
        </div>

        <ArtifactActions>
          {sqlQuery && (
            <>
              <ArtifactAction
                icon={Table}
                tooltip="Ver tabela"
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
              />
              <ArtifactAction
                icon={Code}
                tooltip="Ver SQL"
                variant={viewMode === 'sql' ? 'default' : 'outline'}
                onClick={() => setViewMode('sql')}
              />
            </>
          )}
          <ArtifactAction
            icon={copied ? CheckCircle : Copy}
            tooltip={copied ? "Copiado!" : "Copiar JSON"}
            onClick={handleCopyJSON}
            className={copied ? "text-green-600" : ""}
          />
          <ArtifactAction
            icon={Download}
            tooltip="Exportar CSV"
            onClick={handleDownloadCSV}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className={isSqlView ? "p-4" : "p-0"}>
        {isSqlView ? (
          <div className="space-y-3">
            <textarea
              className="h-64 w-full resize-none rounded-md border border-slate-200 bg-slate-950/90 p-4 font-mono text-sm text-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              value={sqlQuery}
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              SQL executada para gerar os dados acima.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b">
              <Table>
                <TableHeader>
                  {reactTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {reactTable.getRowModel().rows?.length ? (
                    reactTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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

            <div className="flex items-center justify-between space-x-2 py-4 px-4">
              <div className="text-sm text-muted-foreground">
                Página {reactTable.getState().pagination.pageIndex + 1} de {reactTable.getPageCount()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reactTable.previousPage()}
                  disabled={!reactTable.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reactTable.nextPage()}
                  disabled={!reactTable.getCanNextPage()}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </ArtifactContent>
    </Artifact>
  );
}
