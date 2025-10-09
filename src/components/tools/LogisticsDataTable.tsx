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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { XCircle, ArrowUpDown, ChevronLeft, ChevronRight, Truck, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
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

interface LogisticsRecord {
  id: string;

  // Campos de envios
  order_id?: string;
  transportadora_id?: string;
  codigo_rastreio?: string;
  status_atual?: string;
  data_postagem?: string;
  data_prevista_entrega?: string;
  data_entrega?: string;
  custo_frete?: number;
  peso_kg?: number;
  destinatario?: string;
  endereco_destino?: string;

  // Campos de eventos_rastreio
  data_evento?: string;
  localizacao?: string;
  descricao?: string;

  // Campos de logistica_reversa
  motivo?: string;
  data_solicitacao?: string;
  codigo_rastreio_reverso?: string;

  // Campos de pacotes
  altura_cm?: number;
  largura_cm?: number;
  comprimento_cm?: number;

  // Campos de transportadoras
  nome?: string;
  ativo?: boolean;
  prazo_entrega_dias?: number;
  custo_por_kg?: number;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

interface LogisticsDataTableProps {
  success: boolean;
  count: number;
  data: LogisticsRecord[];
  table: string;
  message: string;
  error?: string;
}

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('entregue') || s.includes('delivered')) return 'bg-green-100 text-green-800 border-green-300';
  if (s.includes('transito') || s.includes('transit')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (s.includes('postado') || s.includes('posted')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (s.includes('cancelado') || s.includes('cancelled')) return 'bg-red-100 text-red-800 border-red-300';
  if (s.includes('aprovado') || s.includes('approved')) return 'bg-green-100 text-green-800 border-green-300';
  if (s.includes('pendente') || s.includes('pending')) return 'bg-orange-100 text-orange-800 border-orange-300';
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

export default function LogisticsDataTable({ success, count, data, table, message, error }: LogisticsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copied, setCopied] = useState(false);

  const columns: ColumnDef<LogisticsRecord>[] = useMemo(() => {
    const baseColumns: ColumnDef<LogisticsRecord>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">#{String(row.getValue('id')).substring(0, 8)}</span>,
      },
    ];

    if (table === 'envios') {
      return [
        ...baseColumns,
        {
          accessorKey: 'codigo_rastreio',
          header: 'Rastreio',
          cell: ({ row }) => <span className="font-mono font-semibold">{row.getValue('codigo_rastreio') || '-'}</span>,
        },
        {
          accessorKey: 'status_atual',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status_atual') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'destinatario',
          header: 'Destinatário',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('destinatario') || '-'}</span>,
        },
        {
          accessorKey: 'custo_frete',
          header: 'Custo',
          cell: ({ row }) => <span className="font-semibold text-blue-600">{formatCurrency(row.getValue('custo_frete'))}</span>,
        },
        {
          accessorKey: 'data_postagem',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Postagem <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_postagem'))}</span>,
        },
        {
          accessorKey: 'data_prevista_entrega',
          header: 'Previsão',
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_prevista_entrega'))}</span>,
        },
      ];
    }

    if (table === 'eventos_rastreio') {
      return [
        ...baseColumns,
        {
          accessorKey: 'codigo_rastreio',
          header: 'Rastreio',
          cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('codigo_rastreio') || '-'}</span>,
        },
        {
          accessorKey: 'data_evento',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Evento <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_evento'))}</span>,
        },
        {
          accessorKey: 'localizacao',
          header: 'Localização',
          cell: ({ row }) => <span className="font-semibold">{row.getValue('localizacao') || '-'}</span>,
        },
        {
          accessorKey: 'descricao',
          header: 'Descrição',
          cell: ({ row }) => <span className="text-sm">{row.getValue('descricao') || '-'}</span>,
        },
      ];
    }

    if (table === 'logistica_reversa') {
      return [
        ...baseColumns,
        {
          accessorKey: 'order_id',
          header: 'Pedido ID',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('order_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'codigo_rastreio_reverso',
          header: 'Rastreio',
          cell: ({ row }) => <span className="font-mono font-semibold">{row.getValue('codigo_rastreio_reverso') || '-'}</span>,
        },
        {
          accessorKey: 'status_atual',
          header: 'Status',
          cell: ({ row }) => {
            const status = row.getValue('status_atual') as string;
            return (
              <Badge variant="outline" className={getStatusColor(status)}>
                {status || '-'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'motivo',
          header: 'Motivo',
          cell: ({ row }) => <span className="text-sm">{row.getValue('motivo') || '-'}</span>,
        },
        {
          accessorKey: 'data_solicitacao',
          header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Data Solicitação <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('data_solicitacao'))}</span>,
        },
      ];
    }

    if (table === 'pacotes') {
      return [
        ...baseColumns,
        {
          accessorKey: 'transportadora_id',
          header: 'Transportadora',
          cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue('transportadora_id')).substring(0, 8)}</span>,
        },
        {
          accessorKey: 'peso_kg',
          header: 'Peso (kg)',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('peso_kg'))}</span>,
        },
        {
          accessorKey: 'altura_cm',
          header: 'Altura (cm)',
          cell: ({ row }) => <span>{formatNumber(row.getValue('altura_cm'))}</span>,
        },
        {
          accessorKey: 'largura_cm',
          header: 'Largura (cm)',
          cell: ({ row }) => <span>{formatNumber(row.getValue('largura_cm'))}</span>,
        },
        {
          accessorKey: 'comprimento_cm',
          header: 'Comp. (cm)',
          cell: ({ row }) => <span>{formatNumber(row.getValue('comprimento_cm'))}</span>,
        },
      ];
    }

    if (table === 'transportadoras') {
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
          accessorKey: 'ativo',
          header: 'Ativo',
          cell: ({ row }) => {
            const ativo = row.getValue('ativo') as boolean;
            return (
              <Badge variant="outline" className={getActiveColor(ativo)}>
                {ativo ? 'Sim' : 'Não'}
              </Badge>
            );
          },
        },
        {
          accessorKey: 'prazo_entrega_dias',
          header: 'Prazo (dias)',
          cell: ({ row }) => <span className="font-semibold">{formatNumber(row.getValue('prazo_entrega_dias'))}</span>,
        },
        {
          accessorKey: 'custo_por_kg',
          header: 'Custo/kg',
          cell: ({ row }) => <span className="text-blue-600">{formatCurrency(row.getValue('custo_por_kg'))}</span>,
        },
      ];
    }

    return baseColumns;
  }, [table]);

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
        pageSize: 10,
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
    a.download = `logistics_${table}_${new Date().toISOString().split('T')[0]}.csv`;
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
            <ArtifactTitle className="text-red-800">Erro ao Buscar Dados de Logística</ArtifactTitle>
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
            <Truck className="h-5 w-5 text-blue-600" />
            <ArtifactTitle>Dados de Gestão Logística</ArtifactTitle>
          </div>
          <ArtifactDescription className="mt-1">
            {message} - Mostrando {reactTable.getRowModel().rows.length} de {count} registros
          </ArtifactDescription>
        </div>

        <ArtifactActions>
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

      <ArtifactContent className="p-0">
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
      </ArtifactContent>
    </Artifact>
  );
}
