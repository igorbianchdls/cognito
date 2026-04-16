"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";
import { resolveInteractionFilterField, resolveInteractionFilterStorePath } from "@/products/bi/json-render/interactionFilters";
import {
  Bar,
  CartesianGrid,
  ComposedChart as RechartsComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";

type AnyRecord = Record<string, any>;

type ComposedSeriesDef = {
  field: string;
  type: "bar" | "line";
  label?: string;
  color?: string;
  yAxis?: "left" | "right";
  strokeWidth?: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValue(val: any, fmt: "currency" | "percent" | "number"): string {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return String(val ?? "");
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(n);
    case "percent":
      return `${(n * 100).toFixed(2)}%`;
    default:
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n);
  }
}

function setByPath(prev: AnyRecord, path: string, value: any): AnyRecord {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return prev || {};
  const root: AnyRecord = Array.isArray(prev) ? ([...prev] as any) : { ...(prev || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    if (i === parts.length - 1) {
      curr[key] = value;
    } else {
      const next = curr[key];
      curr[key] = next && typeof next === "object" ? { ...next } : {};
      curr = curr[key] as AnyRecord;
    }
  }
  return root;
}

function getByPath(data: AnyRecord, path: string): any {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  let curr: any = data;
  for (const key of parts) {
    if (curr == null) return undefined;
    curr = curr[key];
  }
  return curr;
}

function getFieldValue(row: AnyRecord, preferred: string | undefined, fallbacks: string[]): unknown {
  const candidates = [preferred, ...fallbacks].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct !== undefined) return direct;
  }
  return undefined;
}

function inferFilterField(dimension?: string): string {
  const d = (dimension || "").trim().toLowerCase();
  if (!d) return "";
  const map: Record<string, string> = {
    cliente: "cliente_id",
    fornecedor: "fornecedor_id",
    vendedor: "vendedor_id",
    filial: "filial_id",
    unidade_negocio: "unidade_negocio_id",
    canal_venda: "canal_venda_id",
    categoria_receita: "categoria_receita_id",
    categoria_despesa: "categoria_despesa_id",
    centro_lucro: "centro_lucro_id",
    centro_custo: "centro_custo_id",
    departamento: "departamento_id",
    projeto: "projeto_id",
    territorio: "territorio_id",
    status: "status",
  };
  return map[d] || "";
}

function getManagedPalette(rawVar: string | undefined): string[] | undefined {
  if (!rawVar) return undefined;
  try {
    const parsed = JSON.parse(rawVar);
    if (Array.isArray(parsed) && parsed.length) return parsed.map((item) => String(item));
  } catch {}
  const split = rawVar.split(",").map((s) => s.trim()).filter(Boolean);
  return split.length ? split : undefined;
}

function resolveCurveType(raw: unknown): CurveType {
  const value = String(raw || "").trim().toLowerCase();
  const allowed: CurveType[] = [
    "basis",
    "basisClosed",
    "basisOpen",
    "bumpX",
    "bumpY",
    "bump",
    "linear",
    "linearClosed",
    "natural",
    "monotoneX",
    "monotoneY",
    "monotone",
    "step",
    "stepBefore",
    "stepAfter",
  ];
  return allowed.includes(value as CurveType) ? (value as CurveType) : "monotone";
}

function normalizeSeries(rawSeries: unknown): ComposedSeriesDef[] {
  if (!Array.isArray(rawSeries)) return [];
  return rawSeries
    .filter((item): item is AnyRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item): ComposedSeriesDef => {
      const type: "bar" | "line" =
        String(item.type || "bar").trim().toLowerCase() === "line" ? "line" : "bar";
      const yAxis: "left" | "right" =
        String(item.axis || item.yAxis || item.yaxis || "left").trim().toLowerCase() === "right" ? "right" : "left";
      return {
        field: String(item.dataKey || item.field || "").trim(),
        type,
        label: typeof item.label === "string" && item.label.trim() ? item.label : undefined,
        color: typeof item.color === "string" && item.color.trim() ? item.color : undefined,
        yAxis,
        strokeWidth: typeof item.strokeWidth === "number" ? item.strokeWidth : undefined,
      };
    })
    .filter((item) => Boolean(item.field));
}

export default function JsonRenderComposedChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const props = (element?.props || {}) as AnyRecord;
  const rootStyle = props.style && typeof props.style === "object" ? props.style as React.CSSProperties : undefined;
  const dq = element?.props?.dataQuery as AnyRecord | undefined;
  const seriesDefs = React.useMemo(() => normalizeSeries(element?.props?.series), [element?.props?.series]);
  const xAxis = (props.xAxis as AnyRecord | undefined) || {};
  const xFieldName =
    (typeof xAxis.dataKey === "string" && xAxis.dataKey.trim()) ||
    (typeof dq?.xField === "string" && dq.xField.trim()) ||
    "label";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const interaction = (element?.props?.interaction as AnyRecord | undefined) || {};
  const clickAsFilter = Boolean(interaction?.clickAsFilter ?? true);
  const clearOnSecondClick = Boolean(interaction?.clearOnSecondClick ?? true);
  const resolvedFilterField = resolveInteractionFilterField(interaction, inferFilterField(dq?.dimension));
  const resolvedFilterStorePath = resolveInteractionFilterStorePath(interaction, resolvedFilterField);
  const shouldClickFilter = clickAsFilter && Boolean(resolvedFilterStorePath);
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!dq?.query || !xFieldName || !seriesDefs.length) {
        setServerRows(null);
        setQueryError(null);
        return;
      }
      try {
        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
        const globalFilters = (data as any)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === "dateRange") continue;
            if ((filters as AnyRecord)[k] === undefined) (filters as AnyRecord)[k] = v as any;
          }
        }
        const res = await fetch("/api/modulos/query/execute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dataQuery: {
              query: dq.query,
              xField: xFieldName,
              yField: seriesDefs[0]?.field,
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
        if (!cancelled) {
          setServerRows(Array.isArray(j?.rows) ? j.rows : []);
          setQueryError(null);
        }
      } catch (e) {
        console.error("[BI/ComposedChart] query failed", e);
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
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), JSON.stringify(seriesDefs), xFieldName]);

  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | undefined) ?? 280;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const chartProps = isPlainObject(element?.props?.nivo) ? (element.props.nivo as AnyRecord) : {};
  const managedScheme = getManagedPalette((theme.cssVars || {}).chartColorScheme as string | undefined);
  const colors =
    managedScheme && managedScheme.length
      ? managedScheme
      : (chartProps.colors ??
        (Array.isArray(colorScheme)
          ? colorScheme
          : typeof colorScheme === "string"
            ? [colorScheme]
            : ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]));
  const fg = (theme.cssVars || ({} as any)).fg as string | undefined;
  const managerFont = (theme.cssVars || ({} as any)).fontFamily as string | undefined;
  const lineCurve = resolveCurveType(chartProps.curve);

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((rowRaw) => {
      const row = rowRaw as AnyRecord;
      const label = getFieldValue(row, xFieldName, ["label", "x"]);
      const keyValue = getFieldValue(row, keyFieldName, ["key", xFieldName, "label"]);
      const normalized: AnyRecord = {
        label: String(label ?? ""),
        filterKey: keyValue ?? label ?? "",
      };
      for (const series of seriesDefs) {
        const rawValue = getFieldValue(row, series.field, [series.field]);
        const numeric = Number(rawValue ?? 0);
        normalized[series.field] = Number.isFinite(numeric) ? numeric : 0;
      }
      return normalized;
    });
  }, [serverRows, xFieldName, keyFieldName, seriesDefs]);

  const hasRightAxis = React.useMemo(
    () => seriesDefs.some((series) => (series.yAxis || "left") === "right"),
    [seriesDefs],
  );

  const handleChartClick = React.useCallback(
    (state: AnyRecord) => {
      if (!shouldClickFilter || !resolvedFilterStorePath) return;
      const rawValue = state?.activePayload?.[0]?.payload?.filterKey ?? state?.activeLabel;
      if (rawValue === undefined || rawValue === null || rawValue === "") return;
      const nextValue =
        typeof rawValue === "number" || typeof rawValue === "string" ? rawValue : String(rawValue);
      setData((prev) => {
        const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
        const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
        return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : nextValue);
      });
    },
    [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick],
  );

  return (
    <div style={{ width: "100%", height, flex: 1, ...rootStyle }}>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsComposedChart
            data={chartData}
            margin={{ top: 12, right: hasRightAxis ? 28 : 16, bottom: 24, left: 16 }}
            onClick={shouldClickFilter ? handleChartClick : undefined}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={Boolean(chartProps.gridX ?? false)}
              horizontal={Boolean(chartProps.gridY ?? true)}
            />
            <XAxis dataKey="label" tick={{ fill: fg, fontFamily: managerFont, fontSize: 12 } as any} />
            <YAxis yAxisId="left" tick={{ fill: fg, fontFamily: managerFont, fontSize: 12 } as any} />
            {hasRightAxis ? (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: fg, fontFamily: managerFont, fontSize: 12 } as any}
              />
            ) : null}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                    <div className="font-medium">{String(label ?? "")}</div>
                    {payload.map((entry) => (
                      <div key={String(entry.dataKey ?? entry.name ?? "")}>
                        {String(entry.name ?? "")}: {formatValue(entry.value, fmt)}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            {seriesDefs.map((series, index) => {
              const color = series.color || colors[index % colors.length] || colors[0];
              const yAxisId = series.yAxis === "right" ? "right" : "left";
              if (series.type === "line") {
                return (
                  <Line
                    key={`${series.field}-line`}
                    type={lineCurve}
                    dataKey={series.field}
                    name={series.label || series.field}
                    yAxisId={yAxisId}
                    stroke={color}
                    strokeWidth={series.strokeWidth ?? 2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={Boolean(chartProps.animate ?? true)}
                  />
                );
              }
              return (
                <Bar
                  key={`${series.field}-bar`}
                  dataKey={series.field}
                  name={series.label || series.field}
                  yAxisId={yAxisId}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={Boolean(chartProps.animate ?? true)}
                />
              );
            })}
          </RechartsComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
