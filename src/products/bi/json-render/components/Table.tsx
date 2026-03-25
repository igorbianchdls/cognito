"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableData } from "@/components/widgets/Table";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";

type AnyRecord = Record<string, any>;
type TableRow = TableData;
type ColumnFormat = "text" | "currency" | "percent" | "number" | "date" | "datetime";
type ColumnCellType = "text" | "badge" | "delta" | "progress" | "link";
type AggregateMode = "sum" | "avg" | "count" | "min" | "max";

type ResolvedTableColumn = {
  id: string;
  accessorKey: string;
  header: string;
  size?: number;
  minSize?: number;
  maxSize?: number;
  format: ColumnFormat;
  cell: ColumnCellType;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  sortable?: boolean;
  hideable?: boolean;
  visible?: boolean;
  truncate?: boolean;
  wrap?: boolean;
  textColor?: string;
  headerTooltip?: string;
  footer?: string | AggregateMode;
  aggregate?: AggregateMode;
  meta: AnyRecord;
};

function styleVal(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
}

function toNumberOrUndefined(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function getByPath(obj: AnyRecord, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  let curr: unknown = obj;
  for (const key of parts) {
    if (curr == null || typeof curr !== "object") return undefined;
    curr = (curr as AnyRecord)[key];
  }
  return curr;
}

function setByPath(obj: AnyRecord, path: string, value: unknown): AnyRecord {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return obj;
  const root: AnyRecord = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = curr[key];
    curr[key] = next && typeof next === "object" ? { ...next } : {};
    curr = curr[key];
  }
  const last = parts[parts.length - 1];
  if (value === undefined) {
    delete curr[last];
  } else {
    curr[last] = value;
  }
  return root;
}

function normalizeCellValue(value: unknown): string | number | boolean | null | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeRows(input: unknown): TableRow[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .map((row) => {
      const out: TableRow = {};
      for (const [key, value] of Object.entries(row as AnyRecord)) {
        out[key] = normalizeCellValue(value);
      }
      return out;
    });
}

function toPercentNumber(value: number): number {
  return Math.abs(value) <= 1 ? value * 100 : value;
}

function formatValue(val: unknown, fmt: ColumnFormat, decimals?: number): string {
  if (val == null) return "";
  if (fmt === "text") return String(val);
  if (fmt === "date" || fmt === "datetime") {
    const date = val instanceof Date ? val : new Date(String(val));
    if (Number.isNaN(date.getTime())) return String(val);
    return new Intl.DateTimeFormat(
      "pt-BR",
      fmt === "date"
        ? { dateStyle: "short" }
        : { dateStyle: "short", timeStyle: "short" }
    ).format(date);
  }
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  const fractionDigits = typeof decimals === "number" ? decimals : 2;
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: fractionDigits,
      }).format(n);
    case "percent":
      return `${toPercentNumber(n).toFixed(fractionDigits)}%`;
    case "number":
    default:
      return new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: fractionDigits,
      }).format(n);
  }
}

function badgeToneClass(tone?: string): string {
  const normalized = String(tone || "").toLowerCase();
  if (normalized === "success") return "border-green-200 bg-green-50 text-green-700";
  if (normalized === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "danger" || normalized === "destructive") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "info") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function aggregateValues(values: unknown[], mode: AggregateMode): number {
  if (mode === "count") return values.filter((value) => value !== null && value !== undefined && value !== "").length;
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  if (mode === "sum") return numbers.reduce((acc, value) => acc + value, 0);
  if (mode === "avg") return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
  if (mode === "min") return Math.min(...numbers);
  return Math.max(...numbers);
}

function renderCellContent(column: ResolvedTableColumn, raw: unknown, row: TableRow, nullDisplay: string) {
  const meta = column.meta || {};
  const decimals = typeof meta.decimals === "number" ? meta.decimals : undefined;
  const display = raw == null || raw === "" ? nullDisplay : formatValue(raw, column.format, decimals);
  const baseStyle: React.CSSProperties = {
    color: column.textColor,
    whiteSpace: column.wrap ? "normal" : "nowrap",
    overflow: column.truncate ? "hidden" : undefined,
    textOverflow: column.truncate ? "ellipsis" : undefined,
  };

  if (column.cell === "badge") {
    const rawKey = String(raw ?? "");
    const tone = meta.variantMap?.[rawKey.toLowerCase()] || meta.variantMap?.[rawKey] || meta.variant;
    return (
      <Badge variant="outline" className={badgeToneClass(tone)}>
        {display}
      </Badge>
    );
  }

  if (column.cell === "delta") {
    const numericValue = Number(raw ?? 0);
    const isPositive = numericValue >= 0;
    const positiveIsGood = meta.positiveIsGood !== false;
    const tone = numericValue === 0
      ? "text-slate-600"
      : isPositive === positiveIsGood
        ? "text-green-600"
        : "text-red-600";
    const prefix = numericValue > 0 ? "+" : "";
    return (
      <span className={`font-medium ${tone}`} style={baseStyle}>
        {prefix}{formatValue(raw, column.format === "text" ? "number" : column.format, decimals)}
      </span>
    );
  }

  if (column.cell === "progress") {
    const numericValue = Number(raw ?? 0);
    const progressMax = Number(meta.progressMax ?? 100);
    const normalized = progressMax === 0
      ? 0
      : Math.max(0, Math.min(100, (Math.abs(numericValue) <= 1 && progressMax === 100 ? numericValue * 100 : (numericValue / progressMax) * 100)));
    return (
      <div className="flex items-center gap-2" style={baseStyle}>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-700" style={{ width: `${normalized}%` }} />
        </div>
        <span className="min-w-[56px] text-right">
          {display}
        </span>
      </div>
    );
  }

  if (column.cell === "link") {
    const hrefField = typeof meta.hrefField === "string" ? meta.hrefField : "";
    const hrefCandidate = hrefField ? getByPath(row as AnyRecord, hrefField) : raw;
    const href = hrefCandidate == null ? "" : String(hrefCandidate);
    const label = typeof meta.label === "string" ? meta.label : display;
    if (!href) {
      return <span style={baseStyle}>{label}</span>;
    }
    return (
      <a
        href={href}
        target={typeof meta.target === "string" ? meta.target : "_blank"}
        rel="noreferrer"
        className="text-sky-700 underline underline-offset-2"
        style={baseStyle}
      >
        {label}
      </a>
    );
  }

  return <span style={baseStyle}>{display}</span>;
}

export default function JsonRenderTable({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const props = (element?.props || {}) as AnyRecord;
  const dq = (props?.dataQuery || {}) as AnyRecord;
  const dataPath = typeof props?.dataPath === "string" ? props.dataPath.trim() : "";

  const [rows, setRows] = React.useState<TableRow[]>([]);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const filtersSignature = JSON.stringify((data as AnyRecord)?.filters || {});
  const dataPathRaw = React.useMemo(() => {
    if (!dataPath) return [];
    const value = getByPath((data || {}) as AnyRecord, dataPath);
    return Array.isArray(value) ? value : [];
  }, [data, dataPath]);
  const dataPathSignature = React.useMemo(() => JSON.stringify(dataPathRaw), [dataPathRaw]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      const isSqlQueryMode = Boolean(typeof dq?.query === "string" && dq.query.trim());
      if (!isSqlQueryMode) {
        if (!cancelled) {
          setRows(normalizeRows(dataPathRaw));
          setQueryError(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        if (!cancelled) {
          setQueryError(null);
          setIsLoading(true);
        }
        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
        const globalFilters = (data as AnyRecord)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [key, value] of Object.entries(globalFilters)) {
            if (key === "dateRange") continue;
            if (filters[key] === undefined) filters[key] = value;
          }
        }
        const limit = toNumberOrUndefined(dq.limit);
        const body = {
          dataQuery: {
            query: String(dq.query),
            filters,
            ...(limit ? { limit } : {}),
          },
        };
        const response = await fetch("/api/modulos/query/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await response.json();
        if (!response.ok || json?.success === false) {
          throw new Error(String(json?.message || `Query failed (${response.status})`));
        }
        if (!cancelled) {
          setRows(normalizeRows(Array.isArray(json?.rows) ? json.rows : []));
          setQueryError(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[BI/Table] query failed", error);
        if (!cancelled) {
          setRows([]);
          setQueryError(error instanceof Error ? error.message : "Erro ao executar query");
          setIsLoading(false);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), filtersSignature, dataPathSignature, data]);

  const defaultColumn = (props?.defaultColumn || {}) as AnyRecord;
  const totals = (props?.totals || {}) as AnyRecord;
  const totalsEnabled = Boolean(totals?.enabled);
  const nullDisplay = typeof defaultColumn?.nullDisplay === "string" ? defaultColumn.nullDisplay : "-";

  const resolvedColumns = React.useMemo<ResolvedTableColumn[]>(() => {
    const explicit = Array.isArray(props?.columns) ? (props.columns as AnyRecord[]) : [];
    if (explicit.length > 0) {
      return explicit
        .map((column, index): ResolvedTableColumn | null => {
          const accessorKey = String(column?.accessorKey || column?.key || "").trim();
          if (!accessorKey) return null;
          const merged = { ...defaultColumn, ...column } as AnyRecord;
          return {
            id: String(merged.id || accessorKey),
            accessorKey,
            header: String(merged.header || merged.label || accessorKey),
            size: toNumberOrUndefined(merged.size ?? merged.width),
            minSize: toNumberOrUndefined(merged.minSize),
            maxSize: toNumberOrUndefined(merged.maxSize),
            format: (merged.format as ColumnFormat | undefined) || "text",
            cell: (merged.cell as ColumnCellType | undefined) || "text",
            align: merged.align,
            headerAlign: merged.headerAlign || merged.align,
            sortable: merged.sortable,
            hideable: merged.hideable,
            visible: merged.visible,
            truncate: Boolean(merged.truncate),
            wrap: Boolean(merged.wrap),
            textColor: typeof merged.textColor === "string" ? merged.textColor : undefined,
            headerTooltip: typeof merged.headerTooltip === "string" ? merged.headerTooltip : undefined,
            footer: merged.footer,
            aggregate: merged.aggregate,
            meta: {
              ...(defaultColumn?.meta || {}),
              ...(merged.meta || {}),
              nullDisplay: merged.nullDisplay || nullDisplay,
            },
          };
        })
        .filter(Boolean) as ResolvedTableColumn[];
    }

    const firstRow = rows[0] as AnyRecord | undefined;
    if (!firstRow || typeof firstRow !== "object") return [];
    return Object.keys(firstRow).map((key) => ({
      id: key,
      accessorKey: key,
      header: key,
      format: typeof firstRow[key] === "number" ? "number" : "text",
      cell: "text",
      meta: { nullDisplay },
    }));
  }, [JSON.stringify(props?.columns || []), JSON.stringify(defaultColumn || {}), JSON.stringify(rows), nullDisplay]);

  const columns = React.useMemo<ColumnDef<TableRow>[]>(() => (
    resolvedColumns.map((column, index) => {
      const footerMode = (column.footer || column.aggregate) as string | AggregateMode | undefined;
      const baseMeta = {
        align: column.align,
        headerAlign: column.headerAlign,
        visible: column.visible,
        headerTooltip: column.headerTooltip,
      };
      const footer = totalsEnabled || footerMode
        ? (ctx: any) => {
            if (!footerMode) {
              return index === 0 ? String(totals?.label || "Total") : "";
            }
            if (footerMode === "sum" || footerMode === "avg" || footerMode === "count" || footerMode === "min" || footerMode === "max") {
              const values = ctx.table.getFilteredRowModel().rows.map((row: any) => row.getValue(column.id));
              const aggregateValue = aggregateValues(values, footerMode);
              return formatValue(aggregateValue, column.format === "text" ? "number" : column.format);
            }
            return footerMode;
          }
        : undefined;

      return {
        id: column.id,
        accessorFn: (row) => getByPath(row as AnyRecord, column.accessorKey),
        header: column.header,
        size: column.size,
        minSize: column.minSize,
        maxSize: column.maxSize,
        enableSorting: column.sortable,
        enableHiding: column.hideable,
        footer,
        meta: baseMeta,
        cell: ({ row }) => renderCellContent(
          column,
          row.getValue(column.id),
          row.original as TableRow,
          String(column.meta?.nullDisplay || nullDisplay)
        ),
      } as ColumnDef<TableRow>;
    })
  ), [resolvedColumns, totalsEnabled, totals?.label, nullDisplay]);

  const columnOptions = React.useMemo(() => (
    resolvedColumns.reduce((acc, column) => {
      acc[column.id] = {
        headerNoWrap: !column.wrap,
        cellNoWrap: !column.wrap,
        widthMode: typeof column.size === "number" ? "fixed" : "auto",
        fixedWidth: column.size,
        minWidth: column.minSize,
        maxWidth: column.maxSize,
      };
      return acc;
    }, {} as Record<string, {
      headerNoWrap?: boolean;
      cellNoWrap?: boolean;
      widthMode?: "auto" | "fixed";
      fixedWidth?: number;
      minWidth?: number;
      maxWidth?: number;
    }>)
  ), [resolvedColumns]);

  const cssVars = (theme.cssVars || {}) as AnyRecord;
  const headerBackground = typeof props?.headerBackground === "string" ? props.headerBackground : "#f8fafc";
  const headerTextColor = typeof props?.headerTextColor === "string" ? props.headerTextColor : "#334155";
  const borderColor = typeof props?.borderColor === "string" ? props.borderColor : "#d7dbe3";
  const cellTextColor = typeof props?.cellTextColor === "string" ? props.cellTextColor : "#475569";
  const fallbackFont = typeof cssVars.fontFamily === "string" ? "var(--fontFamily)" : undefined;
  const editableCells =
    props?.editableCells === "all" || props?.editableCells === "none" || Array.isArray(props?.editableCells)
      ? props.editableCells
      : "none";
  const toolbar = (props?.toolbar || {}) as AnyRecord;
  const defaultSort = (props?.defaultSort || {}) as AnyRecord;
  const defaultSortColumn = typeof defaultSort?.accessorKey === "string"
    ? defaultSort.accessorKey
    : typeof props?.defaultSortColumn === "string"
      ? props.defaultSortColumn
      : undefined;
  const defaultSortDirection = typeof defaultSort?.desc === "boolean"
    ? (defaultSort.desc ? "desc" : "asc")
    : props?.defaultSortDirection === "desc"
      ? "desc"
      : "asc";
  const enableColumnVisibility = props?.enableColumnVisibility ?? props?.showColumnToggle ?? toolbar?.columnVisibility ?? true;
  const enableExportCsv = props?.enableExportCsv ?? toolbar?.exportCsv ?? false;
  const enableSearch = props?.enableSearch ?? toolbar?.search ?? true;
  const rowClickAction = (props?.rowClickAction || {}) as AnyRecord;
  const handleRowClick = React.useMemo(() => {
    if (rowClickAction?.type !== "filter") return undefined;
    const filterField = typeof rowClickAction?.field === "string" ? rowClickAction.field.trim() : "";
    const valueField = typeof rowClickAction?.valueField === "string" ? rowClickAction.valueField.trim() : filterField;
    const storePath = typeof rowClickAction?.storePath === "string" && rowClickAction.storePath.trim()
      ? rowClickAction.storePath.trim()
      : filterField
        ? `filters.${filterField}`
        : "";
    if (!storePath || !valueField) return undefined;
    const clearOnSecondClick = rowClickAction?.clearOnSecondClick !== false;
    return (row: TableRow) => {
      const nextValue = getByPath(row as AnyRecord, valueField);
      if (nextValue === undefined || nextValue === null || nextValue === "") return;
      setData((prev) => {
        const current = getByPath((prev || {}) as AnyRecord, storePath);
        const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
        return setByPath((prev || {}) as AnyRecord, storePath, shouldClear ? undefined : nextValue);
      });
    };
  }, [rowClickAction, setData]);

  return (
    <div>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ minHeight: 120, height: styleVal(props?.height), maxHeight: styleVal(props?.maxHeight), overflow: "auto" }}>
        <DataTable<TableRow>
          columns={columns}
          data={rows}
          maxHeight={props?.height ? undefined : props?.maxHeight}
          searchPlaceholder={typeof props?.searchPlaceholder === "string" ? props.searchPlaceholder : "Buscar..."}
          showColumnToggle={Boolean(enableColumnVisibility)}
          showPagination={props?.showPagination ?? true}
          pageSize={toNumberOrUndefined(props?.pageSize) ?? 10}
          headerBackground={headerBackground}
          headerTextColor={headerTextColor}
          rowHoverColor={typeof props?.rowHoverColor === "string" ? props.rowHoverColor : "#f8fafc"}
          borderColor={borderColor}
          borderWidth={toNumberOrUndefined(props?.borderWidth)}
          stickyHeader={props?.stickyHeader !== false}
          rowHover={props?.rowHover !== false}
          bordered={props?.bordered !== false}
          rounded={props?.rounded !== false}
          density={props?.density === "compact" || props?.density === "spacious" ? props.density : "comfortable"}
          emptyMessage={typeof props?.emptyMessage === "string" ? props.emptyMessage : (isLoading ? String(props?.loadingMessage || "Carregando dados da tabela...") : "Nenhum resultado encontrado.")}
          fontSize={toNumberOrUndefined(props?.fontSize)}
          padding={toNumberOrUndefined(props?.padding)}
          headerPadding={toNumberOrUndefined(props?.headerPadding)}
          headerFontSize={toNumberOrUndefined(props?.headerFontSize)}
          headerFontFamily={typeof props?.headerFontFamily === "string" ? props.headerFontFamily : fallbackFont}
          headerFontWeight={typeof props?.headerFontWeight === "string" ? props.headerFontWeight : "600"}
          headerLetterSpacing={toNumberOrUndefined(props?.headerLetterSpacing)}
          headerTextAlign={defaultColumn?.headerAlign || defaultColumn?.align || "center"}
          columnOptions={columnOptions}
          cellFontSize={toNumberOrUndefined(props?.cellFontSize)}
          cellFontFamily={typeof props?.cellFontFamily === "string" ? props.cellFontFamily : fallbackFont}
          cellFontWeight={typeof props?.cellFontWeight === "string" ? props.cellFontWeight : undefined}
          cellTextColor={cellTextColor}
          cellLetterSpacing={toNumberOrUndefined(props?.cellLetterSpacing)}
          cellTextAlign={defaultColumn?.align || "center"}
          enableZebraStripes={props?.striped !== undefined || props?.enableZebraStripes !== undefined ? Boolean(props?.striped ?? props?.enableZebraStripes) : true}
          rowAlternateBgColor={typeof props?.rowAlternateBgColor === "string" ? props.rowAlternateBgColor : "#f8fafc"}
          selectionColumnWidth={toNumberOrUndefined(props?.selectionColumnWidth)}
          enableSearch={Boolean(enableSearch)}
          enableFiltering={Boolean(props?.enableFiltering)}
          enableSorting={props?.enableSorting !== false}
          enableColumnResize={props?.enableColumnResize !== false}
          enableExportCsv={Boolean(enableExportCsv)}
          enableRowSelection={Boolean(props?.enableRowSelection)}
          selectionMode={props?.selectionMode === "multiple" ? "multiple" : "single"}
          defaultSortColumn={defaultSortColumn}
          defaultSortDirection={defaultSortDirection}
          editableMode={Boolean(props?.editableMode)}
          editableCells={editableCells}
          editableRowActions={{
            allowAdd: Boolean(props?.editableRowActions?.allowAdd),
            allowDelete: Boolean(props?.editableRowActions?.allowDelete),
            allowDuplicate: Boolean(props?.editableRowActions?.allowDuplicate),
          }}
          validationRules={props?.validationRules && typeof props.validationRules === "object" ? props.validationRules : {}}
          enableValidation={Boolean(props?.enableValidation)}
          showValidationErrors={Boolean(props?.showValidationErrors)}
          saveBehavior={
            props?.saveBehavior === "auto" || props?.saveBehavior === "manual" || props?.saveBehavior === "onBlur"
              ? props.saveBehavior
              : "onBlur"
          }
          editTrigger={
            props?.editTrigger === "click" || props?.editTrigger === "doubleClick" || props?.editTrigger === "focus"
              ? props.editTrigger
              : "doubleClick"
          }
          editingCellColor={typeof props?.editingCellColor === "string" ? props.editingCellColor : undefined}
          validationErrorColor={typeof props?.validationErrorColor === "string" ? props.validationErrorColor : undefined}
          modifiedCellColor={typeof props?.modifiedCellColor === "string" ? props.modifiedCellColor : undefined}
          newRowColor={typeof props?.newRowColor === "string" ? props.newRowColor : undefined}
          showTopBorder
          onDataChange={setRows}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
