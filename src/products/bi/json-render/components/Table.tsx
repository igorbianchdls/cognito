"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, type TableData } from "@/components/widgets/Table";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import FrameSurface from "@/products/bi/json-render/components/FrameSurface";
import {
  normalizeTitleStyle,
  normalizeContainerStyle,
  applyBorderFromCssVars,
  ensureSurfaceBackground,
  applyH1FromCssVars,
} from "@/products/bi/json-render/helpers";

type AnyRecord = Record<string, any>;
type TableRow = TableData;

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

function formatValue(val: unknown, fmt: "text" | "currency" | "percent" | "number"): string {
  if (fmt === "text") return val == null ? "" : String(val);
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return val == null ? "" : String(val);
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(n);
    case "percent":
      return `${(n * 100).toFixed(2)}%`;
    case "number":
    default:
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n);
  }
}

export default function JsonRenderTable({ element }: { element: any }) {
  const { data } = useData();
  const theme = useThemeOverrides();
  const props = (element?.props || {}) as AnyRecord;
  const dq = (props?.dataQuery || {}) as AnyRecord;
  const dataPath = typeof props?.dataPath === "string" ? props.dataPath.trim() : "";
  const title = typeof props?.title === "string" ? props.title : undefined;
  const borderless = Boolean(props?.borderless);
  const frame = (props?.containerStyle?.frame || undefined) as AnyRecord | undefined;

  const titleStyle = applyH1FromCssVars(normalizeTitleStyle(props?.titleStyle), theme.cssVars);
  const containerStyle = ensureSurfaceBackground(
    applyBorderFromCssVars(normalizeContainerStyle(props?.containerStyle, borderless), theme.cssVars),
    theme.cssVars,
  );
  if (containerStyle) (containerStyle as AnyRecord).boxShadow = undefined;

  const [rows, setRows] = React.useState<TableRow[]>([]);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  const filtersSignature = JSON.stringify((data as AnyRecord)?.filters || {});
  const dataPathRaw = React.useMemo(() => {
    if (!dataPath) return [];
    const v = getByPath((data || {}) as AnyRecord, dataPath);
    return Array.isArray(v) ? v : [];
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
        }
        return;
      }
      try {
        if (!cancelled) setQueryError(null);
        const filters = { ...(dq.filters || {}) } as AnyRecord;
        const dr = (data as AnyRecord)?.filters?.dateRange;
        if (dr && !filters.de && !filters.ate) {
          if (dr.from) filters.de = dr.from;
          if (dr.to) filters.ate = dr.to;
        }
        const globalFilters = (data as AnyRecord)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === "dateRange") continue;
            if (filters[k] === undefined) filters[k] = v;
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
        const res = await fetch("/api/modulos/query/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok || j?.success === false) {
          throw new Error(String(j?.message || `Query failed (${res.status})`));
        }
        const queryRows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) {
          setRows(normalizeRows(queryRows));
          setQueryError(null);
        }
      } catch (e) {
        console.error("[BI/Table] query failed", e);
        if (!cancelled) {
          setRows([]);
          setQueryError(e instanceof Error ? e.message : "Erro ao executar query");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), filtersSignature, dataPathSignature]);

  const columns = React.useMemo<ColumnDef<TableRow>[]>(() => {
    const explicit = Array.isArray(props?.columns) ? (props.columns as AnyRecord[]) : [];
    if (explicit.length > 0) {
      return explicit
        .map((col): ColumnDef<TableRow> | null => {
          const key = String(col?.key || "").trim();
          if (!key) return null;
          const label = String(col?.header || col?.label || key);
          const width = toNumberOrUndefined(col?.width);
          const fmt = (col?.format as "text" | "currency" | "percent" | "number" | undefined) || "text";
          const textColor = typeof col?.textColor === "string" ? col.textColor : undefined;
          return {
            accessorKey: key,
            header: label,
            ...(width ? { size: width } : {}),
            cell: ({ row }) => {
              const raw = row.getValue(key);
              return (
                <div style={{ color: textColor }}>
                  {formatValue(raw, fmt)}
                </div>
              );
            },
          };
        })
        .filter(Boolean) as ColumnDef<TableRow>[];
    }

    const firstRow = rows[0] as AnyRecord | undefined;
    if (!firstRow || typeof firstRow !== "object") return [];
    return Object.keys(firstRow).map((key) => {
      const value = firstRow[key];
      return {
        accessorKey: key,
        header: key,
        cell: ({ row }: AnyRecord) => {
          const raw = row.getValue(key);
          return (
            <div>
              {formatValue(raw, typeof raw === "number" ? "number" : "text")}
            </div>
          );
        },
      } as ColumnDef<TableRow>;
    });
  }, [JSON.stringify(props?.columns || []), JSON.stringify(rows)]);

  const cssVars = (theme.cssVars || {}) as AnyRecord;
  const headerBackground = typeof props?.headerBackground === "string" ? props.headerBackground : "var(--surfaceBg)";
  const headerTextColor = typeof props?.headerTextColor === "string" ? props.headerTextColor : "var(--fg)";
  const borderColor = typeof props?.borderColor === "string" ? props.borderColor : "var(--surfaceBorder)";
  const cellTextColor = typeof props?.cellTextColor === "string" ? props.cellTextColor : "var(--fg)";
  const fallbackFont = typeof cssVars.fontFamily === "string" ? "var(--fontFamily)" : undefined;
  const editableCells =
    props?.editableCells === "all" || props?.editableCells === "none" || Array.isArray(props?.editableCells)
      ? props.editableCells
      : "none";

  return (
    <FrameSurface style={containerStyle as React.CSSProperties | undefined} frame={frame} cssVars={theme.cssVars}>
      {title && <div className="mb-0" style={titleStyle}>{title}</div>}
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ minHeight: 120, height: styleVal(props?.height), overflow: "auto" }}>
        <DataTable<TableRow>
          columns={columns}
          data={rows}
          searchPlaceholder={typeof props?.searchPlaceholder === "string" ? props.searchPlaceholder : "Buscar..."}
          showColumnToggle={props?.showColumnToggle ?? true}
          showPagination={props?.showPagination ?? true}
          pageSize={toNumberOrUndefined(props?.pageSize) ?? 10}
          headerBackground={headerBackground}
          headerTextColor={headerTextColor}
          rowHoverColor={typeof props?.rowHoverColor === "string" ? props.rowHoverColor : undefined}
          borderColor={borderColor}
          borderWidth={toNumberOrUndefined(props?.borderWidth)}
          fontSize={toNumberOrUndefined(props?.fontSize)}
          padding={toNumberOrUndefined(props?.padding)}
          headerPadding={toNumberOrUndefined(props?.headerPadding)}
          headerFontSize={toNumberOrUndefined(props?.headerFontSize)}
          headerFontFamily={typeof props?.headerFontFamily === "string" ? props.headerFontFamily : fallbackFont}
          headerFontWeight={typeof props?.headerFontWeight === "string" ? props.headerFontWeight : undefined}
          headerLetterSpacing={toNumberOrUndefined(props?.headerLetterSpacing)}
          headerTextAlign="center"
          cellFontSize={toNumberOrUndefined(props?.cellFontSize)}
          cellFontFamily={typeof props?.cellFontFamily === "string" ? props.cellFontFamily : fallbackFont}
          cellFontWeight={typeof props?.cellFontWeight === "string" ? props.cellFontWeight : undefined}
          cellTextColor={cellTextColor}
          cellLetterSpacing={toNumberOrUndefined(props?.cellLetterSpacing)}
          cellTextAlign="center"
          enableZebraStripes={Boolean(props?.enableZebraStripes)}
          rowAlternateBgColor={typeof props?.rowAlternateBgColor === "string" ? props.rowAlternateBgColor : undefined}
          selectionColumnWidth={toNumberOrUndefined(props?.selectionColumnWidth)}
          enableSearch={props?.enableSearch ?? true}
          enableFiltering={Boolean(props?.enableFiltering)}
          enableRowSelection={Boolean(props?.enableRowSelection)}
          selectionMode={props?.selectionMode === "multiple" ? "multiple" : "single"}
          defaultSortColumn={typeof props?.defaultSortColumn === "string" ? props.defaultSortColumn : undefined}
          defaultSortDirection={props?.defaultSortDirection === "desc" ? "desc" : "asc"}
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
        />
      </div>
    </FrameSurface>
  );
}
