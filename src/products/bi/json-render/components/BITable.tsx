"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type AnyRecord = Record<string, any>;

export type BITableRow = Record<string, string | number | boolean | null | undefined>;
export type BITableColumnFormat = "text" | "currency" | "percent" | "number" | "date" | "datetime";
export type BITableColumnCellType = "text" | "badge" | "delta" | "progress" | "link";
export type BITableAggregateMode = "sum" | "avg" | "count" | "min" | "max";

export type BITableColumn = {
  id: string;
  accessorKey: string;
  header: string;
  size?: number;
  minSize?: number;
  maxSize?: number;
  format: BITableColumnFormat;
  cell: BITableColumnCellType;
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  sortable?: boolean;
  hideable?: boolean;
  visible?: boolean;
  truncate?: boolean;
  wrap?: boolean;
  textColor?: string;
  headerTooltip?: string;
  footer?: string | BITableAggregateMode;
  aggregate?: BITableAggregateMode;
  meta: AnyRecord;
};

type BITableProps = {
  rows: BITableRow[];
  columns: BITableColumn[];
  height?: string | number;
  maxHeight?: string | number;
  bordered?: boolean;
  rounded?: boolean;
  radius?: number;
  pageSize?: number;
  showPagination?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  rowHover?: boolean;
  borderColor?: string;
  headerBackground?: string;
  headerTextColor?: string;
  footerBackground?: string;
  footerTextColor?: string;
  rowHoverColor?: string;
  rowAlternateBgColor?: string;
  headerStyle?: React.CSSProperties;
  rowStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;
  emptyMessage?: string;
  enableExportCsv?: boolean;
  onRowClick?: (row: BITableRow) => void;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  totalsEnabled?: boolean;
  totalsLabel?: string;
  fontSize?: number;
  padding?: number;
  headerPadding?: number;
  headerFontSize?: number;
  headerFontFamily?: string;
  headerFontWeight?: string;
  headerLetterSpacing?: number;
  headerTextAlign?: "left" | "center" | "right";
  cellFontSize?: number;
  cellFontFamily?: string;
  cellFontWeight?: string;
  cellTextColor?: string;
  cellLetterSpacing?: number;
  cellTextAlign?: "left" | "center" | "right";
};

function styleVal(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
}

function toPercentNumber(value: number): number {
  return Math.abs(value) <= 1 ? value * 100 : value;
}

function formatValue(val: unknown, fmt: BITableColumnFormat, decimals?: number): string {
  if (val == null) return "";
  if (fmt === "text") return String(val);
  if (fmt === "date" || fmt === "datetime") {
    const date = val instanceof Date ? val : new Date(String(val));
    if (Number.isNaN(date.getTime())) return String(val);
    return new Intl.DateTimeFormat(
      "pt-BR",
      fmt === "date" ? { dateStyle: "short" } : { dateStyle: "short", timeStyle: "short" }
    ).format(date);
  }
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val);
  const fractionDigits = typeof decimals === "number" ? decimals : 2;
  if (fmt === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: fractionDigits,
    }).format(n);
  }
  if (fmt === "percent") {
    return `${toPercentNumber(n).toFixed(fractionDigits)}%`;
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function badgeToneClass(tone?: string): string {
  const normalized = String(tone || "").toLowerCase();
  if (normalized === "success") return "border-green-200 bg-green-50 text-green-700";
  if (normalized === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "danger" || normalized === "destructive") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "info") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function aggregateValues(values: unknown[], mode: BITableAggregateMode): number {
  if (mode === "count") return values.filter((value) => value !== null && value !== undefined && value !== "").length;
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  if (mode === "sum") return numbers.reduce((acc, value) => acc + value, 0);
  if (mode === "avg") return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
  if (mode === "min") return Math.min(...numbers);
  return Math.max(...numbers);
}

function escapeCsvValue(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

function compareValues(a: unknown, b: unknown, format: BITableColumnFormat): number {
  if (format === "date" || format === "datetime") {
    const aTime = new Date(String(a ?? "")).getTime();
    const bTime = new Date(String(b ?? "")).getTime();
    if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
  }
  const aNum = Number(a);
  const bNum = Number(b);
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { numeric: true, sensitivity: "base" });
}

function renderCellContent(column: BITableColumn, raw: unknown, row: BITableRow, nullDisplay: string, cellTextColor?: string) {
  const meta = column.meta || {};
  const decimals = typeof meta.decimals === "number" ? meta.decimals : undefined;
  const display = raw == null || raw === "" ? nullDisplay : formatValue(raw, column.format, decimals);
  const baseStyle: React.CSSProperties = {
    color: column.textColor || cellTextColor,
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
    const tone = numericValue === 0 ? "#475569" : isPositive === positiveIsGood ? "#16a34a" : "#dc2626";
    const prefix = numericValue > 0 ? "+" : "";
    return (
      <span style={{ ...baseStyle, color: tone, fontWeight: 500 }}>
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
      <div style={{ ...baseStyle, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ height: 8, flex: 1, overflow: "hidden", borderRadius: 999, backgroundColor: "#e2e8f0" }}>
          <div style={{ height: "100%", width: `${normalized}%`, borderRadius: 999, backgroundColor: "#334155" }} />
        </div>
        <span style={{ minWidth: 56, textAlign: "right" }}>{display}</span>
      </div>
    );
  }

  if (column.cell === "link") {
    const hrefField = typeof meta.hrefField === "string" ? meta.hrefField : "";
    const hrefCandidate = hrefField ? row[hrefField] : raw;
    const href = hrefCandidate == null ? "" : String(hrefCandidate);
    const label = typeof meta.label === "string" ? meta.label : display;
    if (!href) return <span style={baseStyle}>{label}</span>;
    return (
      <a href={href} target={typeof meta.target === "string" ? meta.target : "_blank"} rel="noreferrer" style={{ ...baseStyle, color: "#0369a1", textDecoration: "underline", textUnderlineOffset: 2 }}>
        {label}
      </a>
    );
  }

  return <span style={baseStyle}>{display}</span>;
}

export default function BITable({
  rows,
  columns,
  height,
  maxHeight,
  bordered = false,
  rounded = false,
  radius = 12,
  pageSize = 10,
  showPagination = true,
  stickyHeader = true,
  striped = false,
  rowHover = true,
  borderColor = "#d7dbe3",
  headerBackground = "#f8fafc",
  headerTextColor = "#334155",
  footerBackground = "#f8fafc",
  footerTextColor = "#0f172a",
  rowHoverColor = "#f8fafc",
  rowAlternateBgColor = "#ffffff",
  headerStyle,
  rowStyle,
  cellStyle,
  footerStyle,
  emptyMessage = "Nenhum resultado encontrado.",
  enableExportCsv = false,
  onRowClick,
  defaultSortColumn,
  defaultSortDirection = "asc",
  totalsEnabled = false,
  totalsLabel = "Total",
  fontSize = 14,
  padding = 12,
  headerPadding = 12,
  headerFontSize = 14,
  headerFontFamily = "inherit",
  headerFontWeight = "600",
  headerLetterSpacing,
  headerTextAlign = "left",
  cellFontSize = 14,
  cellFontFamily = "inherit",
  cellFontWeight = "normal",
  cellTextColor = "#475569",
  cellLetterSpacing,
  cellTextAlign = "left",
}: BITableProps) {
  const [sortState, setSortState] = React.useState<{ id: string; desc: boolean } | null>(
    defaultSortColumn ? { id: defaultSortColumn, desc: defaultSortDirection === "desc" } : null
  );
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSizeState, setPageSizeState] = React.useState(pageSize);
  const hasFooter = totalsEnabled || columns.some((column) => column.footer || column.aggregate);

  React.useEffect(() => {
    setPageSizeState(pageSize);
  }, [pageSize]);

  const visibleColumns = React.useMemo(
    () => columns.filter((column) => column.visible !== false),
    [columns]
  );

  const sortedRows = React.useMemo(() => {
    if (!sortState) return rows;
    const column = visibleColumns.find((item) => item.id === sortState.id);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const result = compareValues(a[column.accessorKey], b[column.accessorKey], column.format);
      return sortState.desc ? -result : result;
    });
  }, [rows, visibleColumns, sortState]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSizeState));

  React.useEffect(() => {
    setPageIndex((prev) => Math.min(prev, pageCount - 1));
  }, [pageCount]);

  const pagedRows = React.useMemo(() => {
    if (!showPagination) return sortedRows;
    const start = pageIndex * pageSizeState;
    return sortedRows.slice(start, start + pageSizeState);
  }, [sortedRows, showPagination, pageIndex, pageSizeState]);

  const footerValues = React.useMemo(() => {
    if (!hasFooter) return new Map<string, string>();
    const map = new Map<string, string>();
    visibleColumns.forEach((column, index) => {
      const footerMode = (column.footer || column.aggregate) as string | BITableAggregateMode | undefined;
      if (!footerMode) {
        if (totalsEnabled && index === 0) map.set(column.id, totalsLabel);
        return;
      }
      if (footerMode === "sum" || footerMode === "avg" || footerMode === "count" || footerMode === "min" || footerMode === "max") {
        const values = sortedRows.map((row) => row[column.accessorKey]);
        map.set(column.id, formatValue(aggregateValues(values, footerMode), column.format === "text" ? "number" : column.format));
        return;
      }
      map.set(column.id, footerMode);
    });
    return map;
  }, [hasFooter, visibleColumns, sortedRows, totalsEnabled, totalsLabel]);

  const exportCsv = React.useCallback(() => {
    const headerLine = visibleColumns.map((column) => escapeCsvValue(column.header)).join(",");
    const bodyLines = sortedRows.map((row) =>
      visibleColumns.map((column) => escapeCsvValue(row[column.accessorKey])).join(",")
    );
    const csv = [headerLine, ...bodyLines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "table-export.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, sortedRows]);

  return (
    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: showPagination ? 12 : 0 }}>
      <div
        style={{
          overflow: "auto",
          height: styleVal(height),
          maxHeight: styleVal(maxHeight),
          border: bordered ?                                                             `1px solid ${borderColor}` : undefined,
          borderRadius: rounded ? radius : undefined,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize }}>
          <thead>
            <tr style={{ backgroundColor: (headerStyle?.backgroundColor as string | undefined) || headerBackground }}>
              {visibleColumns.map((column, index) => {
                const isSorted = sortState?.id === column.id;
                const canSort = column.sortable !== false;
                return (
                  <th
                    key={column.id}
                    title={column.headerTooltip}
                    onClick={canSort ? () => {
                      setSortState((prev) => {
                        if (!prev || prev.id !== column.id) return { id: column.id, desc: false };
                        if (prev.desc) return null;
                        return { id: column.id, desc: true };
                      });
                    } : undefined}
                    style={{
                      position: stickyHeader ? "sticky" : undefined,
                      top: stickyHeader ? 0 : undefined,
                      zIndex: stickyHeader ? 1 : undefined,
                      backgroundColor: (headerStyle?.backgroundColor as string | undefined) || headerBackground,
                      color: (headerStyle?.color as string | undefined) || headerTextColor,
                      padding: `${headerPadding}px`,
                      textAlign: column.headerAlign || headerTextAlign,
                      fontSize: headerFontSize,
                      fontFamily: headerFontFamily !== "inherit" ? headerFontFamily : undefined,
                      fontWeight: headerFontWeight,
                      letterSpacing: typeof headerLetterSpacing === "number" ? `${headerLetterSpacing}px` : undefined,
                      borderBottom: `1px solid ${borderColor}`,
                      borderRight: index < visibleColumns.length - 1 ? `1px solid ${borderColor}` : undefined,
                      width: typeof column.size === "number" ? column.size : undefined,
                      minWidth: column.minSize,
                      maxWidth: column.maxSize,
                      whiteSpace: column.wrap ? "normal" : "nowrap",
                      cursor: canSort ? "pointer" : undefined,
                      ...headerStyle,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: column.headerAlign === "right" ? "flex-end" : column.headerAlign === "center" ? "center" : "flex-start", gap: 4 }}>
                      <span>{column.header}</span>
                      {canSort ? (
                        isSorted ? (
                          sortState?.desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                        ) : (
                          <ArrowUpDown size={14} color="#94a3b8" />
                        )
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ padding: "18px 12px", color: cellTextColor, textAlign: "center" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rowIndex) => {
                const baseBackground = striped && rowIndex % 2 === 0 ? rowAlternateBgColor : "#ffffff";
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={(event) => {
                      if (rowHover) event.currentTarget.style.backgroundColor = rowHoverColor;
                    }}
                    onMouseLeave={(event) => {
                      if (rowHover) event.currentTarget.style.backgroundColor = baseBackground;
                    }}
                    style={{
                      backgroundColor: (rowStyle?.backgroundColor as string | undefined) || baseBackground,
                      cursor: onRowClick ? "pointer" : undefined,
                      ...rowStyle,
                    }}
                  >
                    {visibleColumns.map((column, columnIndex) => (
                      <td
                        key={column.id}
                        style={{
                          padding: `${padding}px`,
                          textAlign: column.align || cellTextAlign,
                          color: (cellStyle?.color as string | undefined) || cellTextColor,
                          fontSize: cellFontSize,
                          fontFamily: cellFontFamily !== "inherit" ? cellFontFamily : undefined,
                          fontWeight: cellFontWeight !== "normal" ? cellFontWeight : undefined,
                          letterSpacing: typeof cellLetterSpacing === "number" ? `${cellLetterSpacing}px` : undefined,
                          borderBottom: `1px solid ${borderColor}`,
                          borderRight: columnIndex < visibleColumns.length - 1 ? `1px solid ${borderColor}` : undefined,
                          whiteSpace: column.wrap ? "normal" : "nowrap",
                          overflow: column.truncate ? "hidden" : undefined,
                          textOverflow: column.truncate ? "ellipsis" : undefined,
                          ...cellStyle,
                        }}
                      >
                        {renderCellContent(column, row[column.accessorKey], row, String(column.meta?.nullDisplay || "-"), (cellStyle?.color as string | undefined) || cellTextColor)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {hasFooter ? (
            <tfoot>
              <tr style={{ backgroundColor: (footerStyle?.backgroundColor as string | undefined) || footerBackground }}>
                {visibleColumns.map((column, index) => (
                  <td
                    key={column.id}
                    style={{
                      padding: `${padding}px`,
                      color: (footerStyle?.color as string | undefined) || footerTextColor,
                      fontWeight: 600,
                      textAlign: column.align || cellTextAlign,
                      borderTop: `1px solid ${borderColor}`,
                      borderRight: index < visibleColumns.length - 1 ? `1px solid ${borderColor}` : undefined,
                      ...footerStyle,
                    }}
                  >
                    {footerValues.get(column.id) || ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {showPagination ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "#64748b" }}>
              Página {Math.min(pageIndex + 1, pageCount)} de {pageCount}
            </span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#64748b" }}>
              <span>Rows per page</span>
              <select
                value={String(pageSizeState)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPageSizeState(next);
                  setPageIndex(0);
                }}
                style={{ border: `1px solid ${borderColor}`, borderRadius: 8, padding: "6px 10px", backgroundColor: "#fff", color: "#0f172a" }}
              >
                {[10, 20, 50, 100].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            {enableExportCsv ? (
              <button
                type="button"
                onClick={exportCsv}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "6px 10px", backgroundColor: "#fff", color: "#334155", fontSize: 14 }}
              >
                <Download size={14} />
                CSV
              </button>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={pageIndex === 0}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: `1px solid ${borderColor}`, borderRadius: 8, backgroundColor: "#fff", color: "#334155", opacity: pageIndex === 0 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))}
              disabled={pageIndex >= pageCount - 1}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: `1px solid ${borderColor}`, borderRadius: 8, backgroundColor: "#fff", color: "#334155", opacity: pageIndex >= pageCount - 1 ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
