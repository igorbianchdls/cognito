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
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  Table as TableIcon,
  Code,
  BarChart3,
  Palette,
  Calendar as CalendarIcon,
  type LucideIcon
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChartSwitcher, type ChartSwitcherOptions } from '@/components/charts/ChartSwitcher';
import { buildThemeVars } from '@/components/json-render/theme/themeAdapter';
import { APPS_HEADER_THEME_OPTIONS, APPS_THEME_OPTIONS } from '@/features/apps/shared/themeOptions';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface ArtifactDataTableProps<TData extends Record<string, unknown>> {
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

  // Renderizador opcional de gráfico
  chartRenderer?: (rows: TData[]) => ReactNode;

  // Gráfico automático (fallback) quando não houver chartRenderer
  enableAutoChart?: boolean;
  chartOptions?: ChartSwitcherOptions<TData> & {
    // Permite ocultar o switcher para casos específicos
    disableSwitcherUI?: boolean;
  };

  // Filtro de período no header (refetch externo)
  headerDateFilter?: boolean;
  onHeaderDateRangeChange?: (range: { from?: string; to?: string; preset?: string }) => void | Promise<void>;
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
  chartRenderer,
  enableAutoChart = true,
  chartOptions,
  headerDateFilter,
  onHeaderDateRangeChange,
}: ArtifactDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'sql' | 'chart'>('table');

  // Header date range state (independente do ChartSwitcher)
  const [hdrPreset, setHdrPreset] = useState<string>('');
  const [hdrFrom, setHdrFrom] = useState<string>('');
  const [hdrTo, setHdrTo] = useState<string>('');
  const [themeName, setThemeName] = useState<string>('light');
  const [headerThemeName, setHeaderThemeName] = useState<string>('');

  useEffect(() => {
    if (!sqlQuery && viewMode === 'sql') {
      setViewMode('table');
    }
  }, [sqlQuery, viewMode]);

  const canAutoChart = enableAutoChart && !chartRenderer && Array.isArray(data) && data.length > 0;

  useEffect(() => {
    if (!chartRenderer && !canAutoChart && viewMode === 'chart') {
      setViewMode('table');
    }
  }, [chartRenderer, canAutoChart, viewMode]);
  const isSqlView = useMemo(() => viewMode === 'sql' && Boolean(sqlQuery), [viewMode, sqlQuery]);
  const isChartView = useMemo(() => viewMode === 'chart' && Boolean(chartRenderer || canAutoChart), [viewMode, chartRenderer, canAutoChart]);
  const chartContent = useMemo(() => {
    if (chartRenderer) return chartRenderer(data);
    if (canAutoChart) {
      return (
        <ChartSwitcher
          rows={data}
          options={{
            ...chartOptions,
          }}
        />
      );
    }
    return null;
  }, [chartRenderer, data, canAutoChart, chartOptions]);
  const hasAlternativeView = Boolean(sqlQuery || chartRenderer || canAutoChart);
  const themeCssVars = useMemo(
    () => buildThemeVars(themeName, undefined, { headerTheme: headerThemeName || undefined }).cssVars || {},
    [themeName, headerThemeName]
  );
  const surfaceBorderColor = String(themeCssVars.surfaceBorder || '#e5e7eb');
  const artifactBg = String(themeCssVars.bg || '#ffffff');
  const artifactSurface = String(themeCssVars.surfaceBg || '#ffffff');
  const textColor = String(themeCssVars.fg || '#414141');
  const headerBg = String(themeCssVars.headerBg || artifactSurface);
  const headerBorderColor = String(themeCssVars.headerBorder || surfaceBorderColor);
  const headerTextColor = String(themeCssVars.headerText || textColor);
  const headerActionBg = String(themeCssVars.headerDpBg || artifactSurface);
  const headerActionBorder = String(themeCssVars.headerDpBorder || surfaceBorderColor);
  const headerActionColor = String(themeCssVars.headerDpColor || headerTextColor);
  const headerActionStyle = useMemo<CSSProperties>(
    () => ({ color: headerActionColor, borderColor: headerActionBorder, backgroundColor: headerActionBg }),
    [headerActionBg, headerActionBorder, headerActionColor]
  );

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
      <Artifact
        className="w-full border-red-200 bg-red-50 shadow-none"
        style={{ boxShadow: "none" }}
      >
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
    <Artifact
      className="w-full shadow-none"
      style={{ boxShadow: "none", backgroundColor: artifactBg, borderColor: surfaceBorderColor, color: textColor }}
    >
      <ArtifactHeader style={{ backgroundColor: headerBg, borderColor: headerBorderColor }}>
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: headerTextColor }} />
            <ArtifactTitle style={{ color: headerTextColor }}>{title}</ArtifactTitle>
          </div>
        </div>

      <ArtifactActions>
        <Popover>
          <PopoverTrigger asChild>
            <ArtifactAction
              icon={Palette}
              tooltip="Tema"
              variant="outline"
              size="icon"
              style={headerActionStyle}
            />
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500">Tema do Dashboard</div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">Tema</label>
                <select
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                >
                  {APPS_THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-600">Tema do Header</label>
                <select
                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm"
                  value={headerThemeName}
                  onChange={(e) => setHeaderThemeName(e.target.value)}
                >
                  {APPS_HEADER_THEME_OPTIONS.map((opt) => (
                    <option key={opt.value || 'auto'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setThemeName('light');
                    setHeaderThemeName('');
                  }}
                >
                  Resetar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {headerDateFilter && onHeaderDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <ArtifactAction
                icon={CalendarIcon}
                tooltip="Período"
                variant="outline"
                size="icon"
                style={headerActionStyle}
              />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-500">Períodos rápidos</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    setHdrPreset('7d');
                    const today = new Date();
                    const toISO = (d: Date) => d.toISOString().slice(0, 10);
                    const from = new Date(today);
                    from.setDate(today.getDate() - 6);
                    await onHeaderDateRangeChange({ from: toISO(from), to: toISO(today), preset: '7d' });
                  }}>Últimos 7 dias</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    setHdrPreset('30d');
                    const today = new Date();
                    const toISO = (d: Date) => d.toISOString().slice(0, 10);
                    const from = new Date(today);
                    from.setDate(today.getDate() - 29);
                    await onHeaderDateRangeChange({ from: toISO(from), to: toISO(today), preset: '30d' });
                  }}>Últimos 30 dias</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    setHdrPreset('this-month');
                    const today = new Date();
                    const toISO = (d: Date) => d.toISOString().slice(0, 10);
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    await onHeaderDateRangeChange({ from: toISO(startOfMonth), to: toISO(today), preset: 'this-month' });
                  }}>Este mês</Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    setHdrPreset('all');
                    await onHeaderDateRangeChange({ preset: 'all' });
                  }}>Todos</Button>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="text-xs font-medium text-slate-500">Personalizado</div>
                <div className="flex items-center gap-2">
                  <input type="date" value={hdrFrom} onChange={(e) => setHdrFrom(e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm flex-1" />
                  <span className="text-sm text-slate-500">até</span>
                  <input type="date" value={hdrTo} onChange={(e) => setHdrTo(e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm flex-1" />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={async () => {
                    setHdrPreset('custom');
                    await onHeaderDateRangeChange({ from: hdrFrom || undefined, to: hdrTo || undefined, preset: 'custom' });
                  }}>Aplicar</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {hasAlternativeView && (
          <ArtifactAction
            icon={TableIcon}
            tooltip="Ver tabela"
            variant="outline"
            size="icon"
            className={cn(
              viewMode === 'table' ? 'bg-gray-100' : ''
            )}
            style={headerActionStyle}
            onClick={() => setViewMode('table')}
          />
        )}
          {sqlQuery && (
            <ArtifactAction
              icon={Code}
              tooltip="Ver SQL"
              variant="outline"
              size="icon"
              className={cn(
                viewMode === 'sql' ? 'bg-gray-100' : ''
              )}
              style={headerActionStyle}
              onClick={() => setViewMode('sql')}
            />
          )}
          {(chartRenderer || canAutoChart) && (
            <ArtifactAction
              icon={BarChart3}
              tooltip="Ver gráfico"
              variant="outline"
              size="icon"
              className={cn(
                viewMode === 'chart' ? 'bg-gray-100' : ''
              )}
              style={headerActionStyle}
              onClick={() => setViewMode('chart')}
            />
          )}
          <ArtifactAction
            icon={copied ? CheckCircle : Copy}
            tooltip={copied ? "Copiado!" : "Copiar JSON"}
            onClick={handleCopyJSON}
            className={copied ? "text-green-600" : ""}
            style={headerActionStyle}
          />
          <ArtifactAction
            icon={Download}
            tooltip="Exportar CSV"
            onClick={handleDownloadCSV}
            style={headerActionStyle}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className={cn(isSqlView || isChartView ? "p-4" : "p-0")}>
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
        ) : isChartView ? (
          <div className="space-y-3">
            {chartContent ?? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
                Não foi possível renderizar o gráfico para estes dados.
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Visualização gerada automaticamente a partir da mesma consulta.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b" style={{ borderColor: surfaceBorderColor }}>
              <Table>
                <TableHeader style={{ backgroundColor: artifactSurface }}>
                  {reactTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="whitespace-nowrap"
                          style={{ color: textColor, fontSize: "14px", fontWeight: 500, letterSpacing: "0em", padding: "12px", whiteSpace: "nowrap", borderColor: surfaceBorderColor }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {reactTable.getRowModel().rows?.length ? (
                    reactTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} style={{ backgroundColor: artifactSurface, borderColor: surfaceBorderColor }}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap"
                            style={{ color: textColor, fontSize: "13px", fontWeight: 400, letterSpacing: "0em", padding: "12px", whiteSpace: "nowrap", borderColor: surfaceBorderColor }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow style={{ backgroundColor: artifactSurface, borderColor: surfaceBorderColor }}>
                      <TableCell colSpan={columns.length} className="h-24 text-center whitespace-nowrap" style={{ color: textColor, fontSize: "13px", fontWeight: 400, letterSpacing: "0em", padding: "12px", whiteSpace: "nowrap", borderColor: surfaceBorderColor }}>
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
