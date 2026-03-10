"use client";

import React from "react";
import { useData, useDataValue } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";

type AnyRecord = Record<string, any>;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + (r * Math.cos(angleRad)),
    y: cy + (r * Math.sin(angleRad)),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function describeLineAtAngle(cx: number, cy: number, innerR: number, outerR: number, angleDeg: number) {
  const start = polarToCartesian(cx, cy, innerR, angleDeg);
  const end = polarToCartesian(cx, cy, outerR, angleDeg);
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function firstNumericValue(row: AnyRecord | undefined, candidates: string[]): number {
  if (!row || typeof row !== "object") return 0;
  for (const key of candidates) {
    const raw = row[key];
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function formatValue(val: number, fmt: "currency" | "percent" | "number"): string {
  if (!Number.isFinite(val)) return "0";
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(val);
    case "percent":
      return `${val.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(val);
  }
}

export default function JsonRenderGauge({ element }: { element?: { props?: AnyRecord } }) {
  const p = (element?.props || {}) as AnyRecord;
  const theme = useThemeOverrides();
  const { data } = useData();
  const valuePath = (p.valuePath as string | undefined) || undefined;
  const valueFromPath = useDataValue(valuePath || "", undefined);
  const dq = (p.dataQuery || {}) as AnyRecord;
  const isSqlQueryMode = Boolean(typeof dq?.query === "string" && dq.query.trim());
  const [serverRow, setServerRow] = React.useState<AnyRecord | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isSqlQueryMode) {
        setServerRow(null);
        setQueryError(null);
        return;
      }
      try {
        const filters = { ...(dq.filters || {}) } as AnyRecord;
        const dr = (data as any)?.filters?.dateRange;
        if (dr && !filters.de && !filters.ate) {
          if (dr.from) filters.de = dr.from;
          if (dr.to) filters.ate = dr.to;
        }
        const globalFilters = (data as any)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === "dateRange") continue;
            if ((filters as any)[k] === undefined) (filters as any)[k] = v as any;
          }
        }
        const res = await fetch("/api/modulos/query/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dataQuery: {
              query: dq.query,
              xField: dq.xField,
              yField: dq.yField,
              keyField: dq.keyField,
              filters,
              limit: dq.limit ?? 1,
            },
          }),
        });
        const j = await res.json();
        if (!res.ok || j?.success === false) {
          throw new Error(String(j?.message || `Query failed (${res.status})`));
        }
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        const firstRow = rows.length > 0 && rows[0] && typeof rows[0] === "object"
          ? ({ ...(rows[0] as AnyRecord) } as AnyRecord)
          : null;
        if (!cancelled) {
          setServerRow(firstRow);
          setQueryError(null);
        }
      } catch (e) {
        console.error("[BI/Gauge] query failed", e);
        if (!cancelled) {
          setServerRow(null);
          setQueryError(e instanceof Error ? e.message : "Erro ao executar query");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), isSqlQueryMode]);

  const format = (p.format ?? "number") as "currency" | "percent" | "number";
  const width = Math.max(120, Number(p.width ?? p.size ?? 220));
  const height = Math.max(72, Number(p.height ?? 130));
  const thickness = Math.max(6, Number(p.thickness ?? 16));
  const min = Number(p.min ?? 0);
  const themeScheme = (() => {
    try {
      const raw = (theme.cssVars || {} as any).chartColorScheme;
      if (raw) return JSON.parse(String(raw));
    } catch {}
    return undefined as string[] | undefined;
  })();
  const defaultValueColor = p.valueColor || p.indicatorColor || (themeScheme && themeScheme[0]) || "#2563eb";
  const trackColor = String(p.trackColor ?? (theme.cssVars as any)?.surfaceBorder ?? "#e5e7eb");
  const valueColor = String(defaultValueColor);
  const targetColor = String(p.targetColor ?? "#0f172a");
  const roundedCaps = p.roundedCaps !== false;
  const showValue = p.showValue !== false;
  const showMinMax = Boolean(p.showMinMax ?? true);
  const showTarget = Boolean(p.showTarget ?? true);
  const startAngle = Number(p.startAngle ?? -110);
  const endAngle = Number(p.endAngle ?? 110);

  const valueField = typeof p.valueField === "string" ? p.valueField : "value";
  const targetField = typeof p.targetField === "string" ? p.targetField : "target";
  const maxField = typeof p.maxField === "string" ? p.maxField : "max";
  const minField = typeof p.minField === "string" ? p.minField : "min";
  const row = serverRow || undefined;
  const resolvedMin = row ? firstNumericValue(row, [minField]) || min : min;
  const propTarget = Number(p.target);
  const targetFromRow = row ? firstNumericValue(row, [targetField]) : 0;
  const resolvedTarget = Number.isFinite(propTarget) ? propTarget : targetFromRow;
  const propMax = Number(p.max);
  const rowMax = row ? firstNumericValue(row, [maxField]) : 0;
  const resolvedMax = Number.isFinite(propMax) ? propMax : (rowMax || resolvedTarget || (format === "percent" ? 100 : 100));

  const rawValue = row
    ? firstNumericValue(row, [valueField, "value", "total", "valor_total"])
    : (valueFromPath !== undefined ? Number(valueFromPath) : Number(p.value ?? 0));
  const value = Number.isFinite(rawValue) ? rawValue : 0;
  const clampedValue = Math.max(resolvedMin, Math.min(resolvedMax, value));
  const ratio = resolvedMax > resolvedMin ? (clampedValue - resolvedMin) / (resolvedMax - resolvedMin) : 0;
  const clampedTarget = Math.max(resolvedMin, Math.min(resolvedMax, resolvedTarget));
  const targetRatio = resolvedMax > resolvedMin ? (clampedTarget - resolvedMin) / (resolvedMax - resolvedMin) : 0;

  const cx = width / 2;
  const cy = height - 12;
  const r = Math.min(width / 2 - thickness, height - thickness - 10);
  const fullArc = describeArc(cx, cy, r, startAngle, endAngle);
  const currentAngle = startAngle + ((endAngle - startAngle) * ratio);
  const valueArc = describeArc(cx, cy, r, startAngle, currentAngle);
  const targetAngle = startAngle + ((endAngle - startAngle) * targetRatio);
  const targetMarker = describeLineAtAngle(cx, cy, r - thickness / 2 - 4, r + thickness / 2 + 2, targetAngle);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Gauge ${formatValue(value, format)}`}>
        <path
          d={fullArc}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
          strokeLinecap={roundedCaps ? "round" : "butt"}
          opacity={0.48}
        />
        <path
          d={valueArc}
          fill="none"
          stroke={valueColor}
          strokeWidth={thickness}
          strokeLinecap={roundedCaps ? "round" : "butt"}
        />
        {showTarget && Number.isFinite(resolvedTarget) ? (
          <path
            d={targetMarker}
            fill="none"
            stroke={targetColor}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      {showValue ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 24, lineHeight: 1.05, fontWeight: 700, color: (theme.cssVars as any)?.kpiValueColor || "#0f172a" }}>
            {formatValue(value, format)}
          </div>
          {Number.isFinite(resolvedTarget) ? (
            <div style={{ fontSize: 12, color: (theme.cssVars as any)?.kpiTitleColor || "#6b7280" }}>
              Meta {formatValue(resolvedTarget, format)}
            </div>
          ) : null}
        </div>
      ) : null}
      {showMinMax ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: (theme.cssVars as any)?.kpiTitleColor || "#6b7280" }}>
          <span>{formatValue(resolvedMin, format)}</span>
          <span>{formatValue(resolvedMax, format)}</span>
        </div>
      ) : null}
      {queryError ? <div className="text-xs text-red-600">{queryError}</div> : null}
    </div>
  );
}
