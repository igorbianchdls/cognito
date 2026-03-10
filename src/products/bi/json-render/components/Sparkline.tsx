"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";

type AnyRecord = Record<string, any>;

function stylePx(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export default function JsonRenderSparkline({ element }: { element: any }) {
  const { data } = useData();
  const theme = useThemeOverrides();
  const p = (element?.props || {}) as AnyRecord;
  const dq = (p.dataQuery || {}) as AnyRecord;
  const isSqlQueryMode = Boolean(typeof dq?.query === "string" && dq.query.trim());
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!isSqlQueryMode || !dq?.query || !dq?.xField || !dq?.yField) {
        setServerRows(null);
        setQueryError(null);
        return;
      }
      try {
        if (!cancelled) setQueryError(null);
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
              limit: dq.limit,
            },
          }),
        });
        const j = await res.json();
        if (!res.ok || j?.success === false) {
          throw new Error(String(j?.message || `Query failed (${res.status})`));
        }
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) {
          setServerRows(rows as any);
          setQueryError(null);
        }
      } catch (e) {
        console.error("[BI/Sparkline] query failed", e);
        if (!cancelled) {
          setServerRows([]);
          setQueryError(e instanceof Error ? e.message : "Erro ao executar query");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), isSqlQueryMode]);

  const colorScheme = p.colorScheme as string | string[] | undefined;
  let managedScheme: string[] | undefined = undefined;
  const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
  if (rawVar) {
    try { managedScheme = JSON.parse(rawVar); }
    catch { managedScheme = rawVar.split(",").map((s) => s.trim()).filter(Boolean); }
  }
  const fallbackStroke = (managedScheme && managedScheme.length)
    ? managedScheme[0]
    : (Array.isArray(colorScheme) ? colorScheme[0] : (typeof colorScheme === "string" ? colorScheme : "#2563eb"));

  const strokeColor = String(p.strokeColor || fallbackStroke);
  const fillColor = String(p.fillColor || "rgba(37, 99, 235, 0.16)");
  const strokeWidth = stylePx(p.strokeWidth, 2);
  const height = stylePx(p.height, 42);
  const area = p.area !== false;
  const showDots = Boolean(p.showDots ?? false);
  const dotColor = String(p.dotColor || strokeColor);
  const width = 100;

  const points = React.useMemo(() => {
    const rows = Array.isArray(serverRows) ? serverRows : [];
    const values = rows
      .map((row, idx) => ({
        index: idx,
        label: String((row as AnyRecord)[dq.xField] ?? (row as AnyRecord).label ?? ""),
        value: Number((row as AnyRecord)[dq.yField] ?? (row as AnyRecord).value ?? 0),
      }))
      .filter((row) => Number.isFinite(row.value));
    if (!values.length) return [];
    const min = Math.min(...values.map((row) => row.value));
    const max = Math.max(...values.map((row) => row.value));
    const range = max - min || 1;
    const usableWidth = width - strokeWidth;
    const usableHeight = height - strokeWidth;
    return values.map((row, idx) => {
      const x = values.length === 1 ? usableWidth / 2 : (idx / (values.length - 1)) * usableWidth + strokeWidth / 2;
      const y = usableHeight - (((row.value - min) / range) * (usableHeight - strokeWidth)) + strokeWidth / 2;
      return { ...row, x, y };
    });
  }, [serverRows, dq.xField, dq.yField, height, strokeWidth]);

  const linePath = React.useMemo(() => {
    if (!points.length) return "";
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  }, [points]);

  const areaPath = React.useMemo(() => {
    if (!points.length) return "";
    const start = points[0];
    const end = points[points.length - 1];
    return `${linePath} L ${end.x.toFixed(2)} ${(height - strokeWidth / 2).toFixed(2)} L ${start.x.toFixed(2)} ${(height - strokeWidth / 2).toFixed(2)} Z`;
  }, [points, linePath, height, strokeWidth]);

  if (queryError) {
    return <div className="text-xs text-red-600">{queryError}</div>;
  }

  if (!points.length) {
    return <div style={{ height }} />;
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Sparkline">
      {area && areaPath ? <path d={areaPath} fill={fillColor} stroke="none" /> : null}
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {showDots ? points.map((point) => (
        <circle key={`${point.index}-${point.label}`} cx={point.x} cy={point.y} r={Math.max(1.5, strokeWidth)} fill={dotColor} />
      )) : null}
    </svg>
  );
}
