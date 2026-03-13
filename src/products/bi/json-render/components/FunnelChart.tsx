"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";
import { resolveInteractionFilterField, resolveInteractionFilterStorePath } from "@/products/bi/json-render/interactionFilters";
import {
  Funnel,
  FunnelChart as RechartsFunnelChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type AnyRecord = Record<string, any>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValue(val: any, fmt: "currency" | "percent" | "number"): string {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return String(val ?? "");
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
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
    if (i === parts.length - 1) curr[key] = value;
    else {
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
  const candidates = [preferred, ...fallbacks].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
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

export default function JsonRenderFunnelChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const dq = element?.props?.dataQuery as AnyRecord | undefined;
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
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
      if (!dq?.query || !dq.xField || !dq.yField) {
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
              xField: dq.xField,
              yField: dq.yField,
              keyField: dq.keyField,
              filters,
              limit: dq.limit,
            },
          }),
        });
        const j = await res.json();
        if (!res.ok || j?.success === false) throw new Error(String(j?.message || `Query failed (${res.status})`));
        if (!cancelled) {
          setServerRows(Array.isArray(j?.rows) ? j.rows : []);
          setQueryError(null);
        }
      } catch (e) {
        console.error("[BI/FunnelChart] query failed", e);
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
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters)]);

  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | undefined) ?? 300;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const chartProps = isPlainObject(element?.props?.nivo) ? (element.props.nivo as AnyRecord) : {};
  const managedScheme = getManagedPalette((theme.cssVars || {}).chartColorScheme as string | undefined);
  const colors = managedScheme && managedScheme.length
    ? managedScheme
    : (chartProps.colors ?? (Array.isArray(colorScheme) ? colorScheme : (typeof colorScheme === "string" ? [colorScheme] : ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"])));
  const fg = (theme.cssVars || ({} as any)).fg as string | undefined;
  const managerFont = (theme.cssVars || ({} as any)).fontFamily as string | undefined;

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((rowRaw, index) => {
      const row = rowRaw as AnyRecord;
      const label = String(getFieldValue(row, xFieldName, ["label", "x", "name"]) ?? "");
      const value = Number(getFieldValue(row, yFieldName, ["value", "y"]) ?? 0);
      const keyValue = getFieldValue(row, keyFieldName, ["key", xFieldName, "label"]);
      return {
        name: label,
        value: Number.isFinite(value) ? value : 0,
        filterKey: keyValue ?? label,
        fill: colors[index % colors.length] || colors[0],
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, JSON.stringify(colors)]);

  const handleStepClick = React.useCallback((entry: AnyRecord) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = entry?.payload?.filterKey ?? entry?.filterKey ?? entry?.name;
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const nextValue = typeof rawValue === "number" || typeof rawValue === "string" ? rawValue : String(rawValue);
    setData((prev) => {
      const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
      const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
      return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : nextValue);
    });
  }, [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick]);

  return (
    <div>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsFunnelChart>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as AnyRecord;
                return (
                  <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                    <div className="font-medium">{String(item?.name ?? "")}</div>
                    <div>{formatValue(item?.value, fmt)}</div>
                  </div>
                );
              }}
            />
            <Legend />
            <Funnel
              data={chartData as any}
              dataKey="value"
              nameKey="name"
              isAnimationActive={Boolean(chartProps.animate ?? true)}
              onClick={shouldClickFilter ? handleStepClick : undefined}
            >
              <LabelList
                position="right"
                fill={fg}
                style={{ fontFamily: managerFont, fontSize: 12 }}
                dataKey="name"
              />
            </Funnel>
          </RechartsFunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
