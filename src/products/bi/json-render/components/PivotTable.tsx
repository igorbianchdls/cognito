"use client";

import React from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useData } from "@/products/bi/json-render/context";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";

type AnyRecord = Record<string, any>;
type AggregateMode = "sum" | "avg" | "count" | "min" | "max";
type ValueFormat = "text" | "currency" | "percent" | "number" | "date" | "datetime";

type PivotField = {
  field: string;
  label: string;
  nullLabel?: string;
};

type PivotValue = {
  field: string;
  label: string;
  aggregate: AggregateMode;
  format: ValueFormat;
  decimals?: number;
};

type PivotColumnEntry = {
  key: string;
  label: string;
};

type PivotRowNode = {
  id: string;
  depth: number;
  label: string;
  rows: AnyRecord[];
  children: PivotRowNode[];
};

const ALL_COLUMN_KEY = "__pivot_all__";

function styleVal(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
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

function normalizeRows(input: unknown): AnyRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .map((row) => {
      const out: AnyRecord = {};
      for (const [key, value] of Object.entries(row as AnyRecord)) {
        out[key] = normalizeCellValue(value);
      }
      return out;
    });
}

function titleize(input: string): string {
  return String(input || "")
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number, format: ValueFormat, decimals?: number): string {
  const fractionDigits = typeof decimals === "number" ? decimals : 2;
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }
  if (format === "percent") {
    const percentValue = Math.abs(value) <= 1 ? value * 100 : value;
    return `${percentValue.toFixed(fractionDigits)}%`;
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatValue(value: unknown, format: ValueFormat, decimals?: number): string {
  if (value === null || value === undefined || value === "") return "";
  if (format === "date" || format === "datetime") {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(
      "pt-BR",
      format === "date"
        ? { dateStyle: "short" }
        : { dateStyle: "short", timeStyle: "short" },
    ).format(date);
  }
  if (format === "text") return String(value);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return formatNumber(numeric, format, decimals);
}

function aggregateRows(rows: AnyRecord[], valueDef: PivotValue): number {
  if (valueDef.aggregate === "count") {
    return rows.filter((row) => row[valueDef.field] !== undefined && row[valueDef.field] !== null && row[valueDef.field] !== "").length;
  }

  const numbers = rows
    .map((row) => Number(row[valueDef.field]))
    .filter((value) => Number.isFinite(value));

  if (numbers.length === 0) return 0;
  if (valueDef.aggregate === "sum") return numbers.reduce((acc, current) => acc + current, 0);
  if (valueDef.aggregate === "avg") return numbers.reduce((acc, current) => acc + current, 0) / numbers.length;
  if (valueDef.aggregate === "min") return Math.min(...numbers);
  return Math.max(...numbers);
}

function normalizePivotFields(input: unknown): PivotField[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  return list.flatMap((entry) => {
    if (typeof entry === "string") {
      const field = entry.trim();
      return field ? [{ field, label: titleize(field) }] : [];
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const field = typeof (entry as AnyRecord).field === "string" ? (entry as AnyRecord).field.trim() : "";
    if (!field) return [];
    return [{
      field,
      label: typeof (entry as AnyRecord).label === "string" && (entry as AnyRecord).label.trim()
        ? (entry as AnyRecord).label.trim()
        : titleize(field),
      nullLabel: typeof (entry as AnyRecord).nullLabel === "string" ? (entry as AnyRecord).nullLabel : undefined,
    }];
  });
}

function normalizePivotValues(input: unknown): PivotValue[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  return list.flatMap((entry) => {
    if (typeof entry === "string") {
      const field = entry.trim();
      return field
        ? [{ field, label: titleize(field), aggregate: "sum" as AggregateMode, format: "number" as ValueFormat }]
        : [];
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const field = typeof (entry as AnyRecord).field === "string" ? (entry as AnyRecord).field.trim() : "";
    if (!field) return [];
    const aggregate = (entry as AnyRecord).aggregate;
    const format = (entry as AnyRecord).format;
    const decimals = Number((entry as AnyRecord).decimals);
    return [{
      field,
      label: typeof (entry as AnyRecord).label === "string" && (entry as AnyRecord).label.trim()
        ? (entry as AnyRecord).label.trim()
        : titleize(field),
      aggregate:
        aggregate === "avg" || aggregate === "count" || aggregate === "min" || aggregate === "max"
          ? aggregate
          : "sum",
      format:
        format === "text" || format === "currency" || format === "percent" || format === "date" || format === "datetime"
          ? format
          : "number",
      decimals: Number.isFinite(decimals) ? decimals : undefined,
    }];
  });
}

function toPivotDisplayValue(row: AnyRecord, fieldDef: PivotField): string {
  const raw = row[fieldDef.field];
  if (raw === undefined || raw === null || raw === "") return fieldDef.nullLabel || "-";
  return String(raw);
}

function createColumnEntries(rows: AnyRecord[], columnFields: PivotField[]): PivotColumnEntry[] {
  if (columnFields.length === 0) {
    return [{ key: ALL_COLUMN_KEY, label: "" }];
  }

  const entries = new Map<string, PivotColumnEntry>();
  for (const row of rows) {
    const parts = columnFields.map((field) => toPivotDisplayValue(row, field));
    const key = parts.join("||");
    if (!entries.has(key)) {
      entries.set(key, {
        key,
        label: parts.join(" / "),
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

function attachColumnKeys(rows: AnyRecord[], columnFields: PivotField[]): AnyRecord[] {
  return rows.map((row) => {
    if (columnFields.length === 0) return { ...row, __pivotColumnKey: ALL_COLUMN_KEY };
    const key = columnFields.map((field) => toPivotDisplayValue(row, field)).join("||");
    return { ...row, __pivotColumnKey: key };
  });
}

function buildRowTree(sourceRows: AnyRecord[], rowFields: PivotField[], depth = 0, parentPath = ""): PivotRowNode[] {
  if (depth >= rowFields.length) return [];
  const fieldDef = rowFields[depth];
  const groups = new Map<string, { label: string; rows: AnyRecord[] }>();

  for (const row of sourceRows) {
    const label = toPivotDisplayValue(row, fieldDef);
    const key = `${fieldDef.field}:${label}`;
    const current = groups.get(key);
    if (current) {
      current.rows.push(row);
    } else {
      groups.set(key, { label, rows: [row] });
    }
  }

  return Array.from(groups.entries())
    .map(([groupKey, group]) => {
      const id = parentPath ? `${parentPath}>${groupKey}` : groupKey;
      return {
        id,
        depth,
        label: group.label,
        rows: group.rows,
        children: buildRowTree(group.rows, rowFields, depth + 1, id),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

function collectInitiallyExpandedIds(nodes: PivotRowNode[], expanded: Set<string>, levels: number) {
  for (const node of nodes) {
    if (node.children.length > 0 && node.depth < Math.max(0, levels - 1)) {
      expanded.add(node.id);
      collectInitiallyExpandedIds(node.children, expanded, levels);
    }
  }
}

function flattenVisibleNodes(nodes: PivotRowNode[], expandedIds: Set<string>, out: PivotRowNode[] = []): PivotRowNode[] {
  for (const node of nodes) {
    out.push(node);
    if (node.children.length > 0 && expandedIds.has(node.id)) {
      flattenVisibleNodes(node.children, expandedIds, out);
    }
  }
  return out;
}

function toCsvValue(value: string): string {
  if (value.includes('"') || value.includes(";") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function JsonRenderPivotTable({ element }: { element: any }) {
  const { data } = useData();
  const props = (element?.props || {}) as AnyRecord;
  const dq = (props?.dataQuery || {}) as AnyRecord;

  const rowFields = React.useMemo(() => normalizePivotFields(props?.rows), [props?.rows]);
  const columnFields = React.useMemo(() => normalizePivotFields(props?.columns), [props?.columns]);
  const valueFields = React.useMemo(() => normalizePivotValues(props?.values), [props?.values]);

  const [rawRows, setRawRows] = React.useState<AnyRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      const query = typeof dq?.query === "string" ? dq.query.trim() : "";
      if (!query) {
        if (!cancelled) {
          setRawRows([]);
          setQueryError("PivotTable requer dataQuery.query");
        }
        return;
      }

      try {
        if (!cancelled) {
          setIsLoading(true);
          setQueryError(null);
        }

        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
        const globalFilters = (data as AnyRecord)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [key, value] of Object.entries(globalFilters)) {
            if (key === "dateRange") continue;
            if ((filters as AnyRecord)[key] === undefined) {
              (filters as AnyRecord)[key] = value;
            }
          }
        }

        const response = await fetch("/api/modulos/query/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dataQuery: {
              query,
              filters,
              limit: dq.limit,
            },
          }),
        });

        const json = await response.json();
        if (!response.ok || json?.success === false) {
          throw new Error(String(json?.message || `Query failed (${response.status})`));
        }

        if (!cancelled) {
          setRawRows(normalizeRows(json?.rows));
          setQueryError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setRawRows([]);
          setQueryError(error instanceof Error ? error.message : "Erro ao executar pivot");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), JSON.stringify((data as AnyRecord)?.filters)]);

  const preparedRows = React.useMemo(
    () => attachColumnKeys(rawRows, columnFields),
    [rawRows, columnFields],
  );

  const columnEntries = React.useMemo(
    () => createColumnEntries(preparedRows, columnFields),
    [preparedRows, columnFields],
  );

  const rowTree = React.useMemo(
    () => buildRowTree(preparedRows, rowFields),
    [preparedRows, rowFields],
  );

  React.useEffect(() => {
    const next = new Set<string>();
    collectInitiallyExpandedIds(rowTree, next, Number(props?.defaultExpandedLevels ?? 1));
    setExpandedIds(next);
  }, [rowTree, props?.defaultExpandedLevels]);

  const visibleRows = React.useMemo(
    () => flattenVisibleNodes(rowTree, expandedIds),
    [rowTree, expandedIds],
  );

  const showSubtotals = props?.showSubtotals !== false;
  const showGrandTotals = props?.showGrandTotals !== false;
  const enableExportCsv = Boolean(props?.enableExportCsv);

  const resolveNodeValue = React.useCallback((nodeRows: AnyRecord[], columnKey: string, valueField: PivotValue) => {
    const scopedRows = columnKey === ALL_COLUMN_KEY
      ? nodeRows
      : nodeRows.filter((row) => row.__pivotColumnKey === columnKey);
    return aggregateRows(scopedRows, valueField);
  }, []);

  const handleToggle = React.useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const exportCsv = React.useCallback(() => {
    const header = [
      rowFields.map((field) => field.label).join(" / ") || "Linhas",
      ...columnEntries.flatMap((column) => (
        valueFields.map((valueField) => {
          if (column.key === ALL_COLUMN_KEY) return valueField.label;
          return `${column.label} - ${valueField.label}`;
        })
      )),
      ...(showGrandTotals ? valueFields.map((valueField) => `Total - ${valueField.label}`) : []),
    ];

    const body = visibleRows.map((node) => {
      const values = columnEntries.flatMap((column) => (
        valueFields.map((valueField) => formatValue(
          resolveNodeValue(node.rows, column.key, valueField),
          valueField.format,
          valueField.decimals,
        ))
      ));
      const totals = showGrandTotals
        ? valueFields.map((valueField) => formatValue(
            aggregateRows(node.rows, valueField),
            valueField.format,
            valueField.decimals,
          ))
        : [];
      return [
        `${"  ".repeat(node.depth)}${node.label}`,
        ...values,
        ...totals,
      ];
    });

    const csv = [header, ...body]
      .map((line) => line.map((cell) => toCsvValue(String(cell ?? ""))).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${String(props?.title || "pivot-table").trim() || "pivot-table"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [columnEntries, props?.title, resolveNodeValue, rowFields, showGrandTotals, valueFields, visibleRows]);

  const headerLabel = rowFields.map((field) => field.label).join(" / ") || "Linhas";
  const emptyMessage = typeof props?.emptyMessage === "string" ? props.emptyMessage : "Nenhum dado encontrado.";
  const loadingMessage = typeof props?.loadingMessage === "string" ? props.loadingMessage : "Carregando pivot...";
  const density = props?.density === "compact" || props?.density === "spacious" ? props.density : "comfortable";
  const rowPadding = density === "compact" ? "6px 8px" : density === "spacious" ? "12px 14px" : "9px 10px";
  const borderColor = typeof props?.borderColor === "string" ? props.borderColor : "#d7dbe3";
  const rounded = props?.rounded !== false;
  const stickyHeader = Boolean(props?.stickyHeader);

  return (
    <div>
      {queryError ? <div className="mb-2 text-xs text-red-600">{queryError}</div> : null}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => {
              const next = new Set<string>();
              collectInitiallyExpandedIds(rowTree, next, rowFields.length + 1);
              setExpandedIds(next);
            }}
          >
            Expandir tudo
          </button>
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => setExpandedIds(new Set())}
          >
            Recolher tudo
          </button>
        </div>
        {enableExportCsv ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
            onClick={exportCsv}
          >
            <Download size={12} />
            Exportar CSV
          </button>
        ) : null}
      </div>

      <div
        style={{
          minHeight: 140,
          height: styleVal(props?.height),
          maxHeight: styleVal(props?.maxHeight),
          overflow: "auto",
          border: props?.bordered === false ? undefined : `1px solid ${borderColor}`,
          borderRadius: rounded ? 8 : 0,
          backgroundColor: "#ffffff",
        }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={stickyHeader ? { position: "sticky", top: 0, zIndex: 2 } : undefined}
            className="bg-slate-50"
          >
            <tr>
              <th
                className="border-b border-r bg-slate-50 text-left font-semibold text-slate-700"
                style={{ padding: rowPadding, borderColor }}
              >
                {headerLabel}
              </th>
              {columnEntries.flatMap((column) => (
                valueFields.map((valueField) => (
                  <th
                    key={`${column.key}:${valueField.field}`}
                    className="border-b border-r bg-slate-50 text-right font-semibold text-slate-700"
                    style={{ padding: rowPadding, borderColor, minWidth: 120 }}
                  >
                    {column.key === ALL_COLUMN_KEY ? valueField.label : `${column.label} - ${valueField.label}`}
                  </th>
                ))
              ))}
              {showGrandTotals
                ? valueFields.map((valueField) => (
                    <th
                      key={`grand-total:${valueField.field}`}
                      className="border-b bg-slate-100 text-right font-semibold text-slate-800"
                      style={{ padding: rowPadding, borderColor, minWidth: 120 }}
                    >
                      Total - {valueField.label}
                    </th>
                  ))
                : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={1 + (columnEntries.length * valueFields.length) + (showGrandTotals ? valueFields.length : 0)}
                  className="text-center text-sm text-slate-500"
                  style={{ padding: "18px 12px" }}
                >
                  {loadingMessage}
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + (columnEntries.length * valueFields.length) + (showGrandTotals ? valueFields.length : 0)}
                  className="text-center text-sm text-slate-500"
                  style={{ padding: "18px 12px" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : visibleRows.map((node) => {
              const canExpand = node.children.length > 0;
              const isExpanded = expandedIds.has(node.id);
              const shouldRenderNodeTotals = showSubtotals || node.children.length === 0;
              return (
                <tr key={node.id} className="border-b" style={{ borderColor }}>
                  <td
                    className="border-r text-left text-slate-800"
                    style={{ padding: rowPadding, borderColor }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${node.depth * 18}px` }}
                    >
                      {canExpand ? (
                        <button
                          type="button"
                          aria-label={isExpanded ? "Recolher grupo" : "Expandir grupo"}
                          className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-slate-600 hover:bg-slate-50"
                          onClick={() => handleToggle(node.id)}
                        >
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      ) : (
                        <span className="inline-block h-5 w-5" />
                      )}
                      <span className={canExpand ? "font-medium" : undefined}>{node.label}</span>
                    </div>
                  </td>
                  {columnEntries.flatMap((column) => (
                    valueFields.map((valueField) => {
                      const numeric = shouldRenderNodeTotals ? resolveNodeValue(node.rows, column.key, valueField) : null;
                      return (
                        <td
                          key={`${node.id}:${column.key}:${valueField.field}`}
                          className="border-r text-right text-slate-700"
                          style={{ padding: rowPadding, borderColor }}
                        >
                          {numeric === null ? "" : formatValue(numeric, valueField.format, valueField.decimals)}
                        </td>
                      );
                    })
                  ))}
                  {showGrandTotals
                    ? valueFields.map((valueField) => (
                        <td
                          key={`${node.id}:grand-total:${valueField.field}`}
                          className="bg-slate-50 text-right font-medium text-slate-800"
                          style={{ padding: rowPadding }}
                        >
                          {shouldRenderNodeTotals
                            ? formatValue(aggregateRows(node.rows, valueField), valueField.format, valueField.decimals)
                            : ""}
                        </td>
                      ))
                    : null}
                </tr>
              );
            })}
          </tbody>
          {showGrandTotals && preparedRows.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 bg-slate-100" style={{ borderColor }}>
                <td className="border-r font-semibold text-slate-900" style={{ padding: rowPadding, borderColor }}>
                  Total geral
                </td>
                {columnEntries.flatMap((column) => (
                  valueFields.map((valueField) => (
                    <td
                      key={`footer:${column.key}:${valueField.field}`}
                      className="border-r text-right font-semibold text-slate-900"
                      style={{ padding: rowPadding, borderColor }}
                    >
                      {formatValue(
                        resolveNodeValue(preparedRows, column.key, valueField),
                        valueField.format,
                        valueField.decimals,
                      )}
                    </td>
                  ))
                ))}
                {valueFields.map((valueField) => (
                  <td
                    key={`footer:grand-total:${valueField.field}`}
                    className="text-right font-semibold text-slate-900"
                    style={{ padding: rowPadding }}
                  >
                    {formatValue(
                      aggregateRows(preparedRows, valueField),
                      valueField.format,
                      valueField.decimals,
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
