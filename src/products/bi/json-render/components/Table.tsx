"use client";

import React from "react";

import BITable, { type BITableColumn, type BITableRow, type BITableAggregateMode } from "@/products/bi/json-render/components/BITable";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";

type AnyRecord = Record<string, any>;
type TableRow = BITableRow;
type ColumnFormat = "text" | "currency" | "percent" | "number" | "date" | "datetime";
type ColumnCellType = "text" | "badge" | "delta" | "progress" | "link";
type AggregateMode = BITableAggregateMode;

type ResolvedTableColumn = BITableColumn;

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
  if (value === undefined) delete curr[last];
  else curr[last] = value;
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
        .map((column): ResolvedTableColumn | null => {
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
            sortable: merged.sortable !== false,
            hideable: merged.hideable,
            visible: merged.visible,
            truncate: Boolean(merged.truncate),
            wrap: Boolean(merged.wrap),
            textColor: typeof merged.textColor === "string" ? merged.textColor : undefined,
            headerTooltip: typeof merged.headerTooltip === "string" ? merged.headerTooltip : undefined,
            footer: merged.footer,
            aggregate: merged.aggregate as AggregateMode | undefined,
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
      sortable: true,
      meta: { nullDisplay },
    }));
  }, [JSON.stringify(props?.columns || []), JSON.stringify(defaultColumn || {}), JSON.stringify(rows), nullDisplay]);

  const cssVars = (theme.cssVars || {}) as AnyRecord;
  const headerBackground = typeof props?.headerBackground === "string" ? props.headerBackground : "#f8fafc";
  const headerTextColor = typeof props?.headerTextColor === "string" ? props.headerTextColor : "#334155";
  const borderColor = typeof props?.borderColor === "string" ? props.borderColor : "#d7dbe3";
  const cellTextColor = typeof props?.cellTextColor === "string" ? props.cellTextColor : "#475569";
  const footerBackground = typeof props?.footerBackground === "string" ? props.footerBackground : "#f8fafc";
  const footerTextColor = typeof props?.footerTextColor === "string" ? props.footerTextColor : "#0f172a";
  const fallbackFont = typeof cssVars.fontFamily === "string" ? "var(--fontFamily)" : undefined;

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
      <BITable
        rows={rows}
        columns={resolvedColumns}
        height={styleVal(props?.height)}
        maxHeight={props?.height ? undefined : styleVal(props?.maxHeight)}
        pageSize={toNumberOrUndefined(props?.pageSize) ?? 10}
        showPagination={props?.showPagination ?? true}
        stickyHeader={props?.stickyHeader !== false}
        striped={props?.striped !== undefined || props?.enableZebraStripes !== undefined ? Boolean(props?.striped ?? props?.enableZebraStripes) : false}
        rowHover={props?.rowHover !== false}
        borderColor={borderColor}
        headerBackground={headerBackground}
        headerTextColor={headerTextColor}
        footerBackground={footerBackground}
        footerTextColor={footerTextColor}
        rowHoverColor={typeof props?.rowHoverColor === "string" ? props.rowHoverColor : "#f8fafc"}
        rowAlternateBgColor={typeof props?.rowAlternateBgColor === "string" ? props.rowAlternateBgColor : "#ffffff"}
        headerStyle={props?.headerStyle && typeof props.headerStyle === "object" ? props.headerStyle as React.CSSProperties : undefined}
        rowStyle={props?.rowStyle && typeof props.rowStyle === "object" ? props.rowStyle as React.CSSProperties : undefined}
        cellStyle={props?.cellStyle && typeof props.cellStyle === "object" ? props.cellStyle as React.CSSProperties : undefined}
        footerStyle={props?.footerStyle && typeof props.footerStyle === "object" ? props.footerStyle as React.CSSProperties : undefined}
        emptyMessage={typeof props?.emptyMessage === "string" ? props.emptyMessage : (isLoading ? String(props?.loadingMessage || "Carregando dados da tabela...") : "Nenhum resultado encontrado.")}
        enableExportCsv={Boolean(props?.enableExportCsv ?? props?.toolbar?.exportCsv ?? false)}
        onRowClick={handleRowClick}
        defaultSortColumn={defaultSortColumn}
        defaultSortDirection={defaultSortDirection}
        totalsEnabled={totalsEnabled}
        totalsLabel={typeof totals?.label === "string" ? totals.label : "Total"}
        fontSize={toNumberOrUndefined(props?.fontSize)}
        padding={toNumberOrUndefined(props?.padding)}
        headerPadding={toNumberOrUndefined(props?.headerPadding)}
        headerFontSize={toNumberOrUndefined(props?.headerFontSize)}
        headerFontFamily={typeof props?.headerFontFamily === "string" ? props.headerFontFamily : fallbackFont}
        headerFontWeight={typeof props?.headerFontWeight === "string" ? props.headerFontWeight : "600"}
        headerLetterSpacing={toNumberOrUndefined(props?.headerLetterSpacing)}
        headerTextAlign={defaultColumn?.headerAlign || defaultColumn?.align || "center"}
        cellFontSize={toNumberOrUndefined(props?.cellFontSize)}
        cellFontFamily={typeof props?.cellFontFamily === "string" ? props.cellFontFamily : fallbackFont}
        cellFontWeight={typeof props?.cellFontWeight === "string" ? props.cellFontWeight : undefined}
        cellTextColor={cellTextColor}
        cellLetterSpacing={toNumberOrUndefined(props?.cellLetterSpacing)}
        cellTextAlign={defaultColumn?.align || "center"}
      />
    </div>
  );
}
