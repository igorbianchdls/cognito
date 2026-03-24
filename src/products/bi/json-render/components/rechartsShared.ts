"use client";

import * as React from "react";

import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";
import { resolveInteractionFilterField, resolveInteractionFilterStorePath } from "@/products/bi/json-render/interactionFilters";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";

type AnyRecord = Record<string, any>;
type SemanticChartModelConfig = {
  table: string
  alias: string
  defaultTimeDimension?: string
}

const SEMANTIC_CHART_MODELS: Record<string, SemanticChartModelConfig> = {
  "vendas.pedidos": {
    table: "vendas.pedidos",
    alias: "p",
    defaultTimeDimension: "data_pedido",
  },
};

export function formatChartValue(val: any, fmt: "currency" | "percent" | "number"): string {
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

export function setByPath(prev: AnyRecord, path: string, value: any): AnyRecord {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return prev || {};
  const root: AnyRecord = Array.isArray(prev) ? [...prev] as any : { ...(prev || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) curr[key] = value;
    else {
      const next = curr[key];
      curr[key] = (next && typeof next === "object") ? { ...next } : {};
      curr = curr[key] as AnyRecord;
    }
  }
  return root;
}

export function getByPath(data: AnyRecord, path: string): any {
  const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
  let curr: any = data;
  for (const key of parts) {
    if (curr == null) return undefined;
    curr = curr[key];
  }
  return curr;
}

export function getFieldValue(row: AnyRecord, preferred: string | undefined, fallbacks: string[]): unknown {
  const candidates = [preferred, ...fallbacks].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct !== undefined) return direct;
  }
  return undefined;
}

function replaceSemanticAlias(input: string, alias: string) {
  return input.replace(/\{\{\s*alias\s*\}\}/g, alias);
}

function resolveSemanticExpr(input: unknown, alias: string): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "";
  const replaced = replaceSemanticAlias(raw, alias);
  if (/^[A-Za-z_][\w$]*$/.test(replaced)) return `${alias}.${replaced}`;
  return replaced;
}

function resolveSemanticChartOrderBy(orderBy: unknown, mode: "dimension" | "time"): string | null {
  if (typeof orderBy === "string" && orderBy.trim()) return orderBy.trim();

  const firstRule =
    Array.isArray(orderBy) && orderBy.length > 0 && orderBy[0] && typeof orderBy[0] === "object"
      ? orderBy[0]
      : orderBy && typeof orderBy === "object"
        ? orderBy
        : null;

  if (!firstRule) {
    return mode === "time" ? "key ASC" : "value DESC";
  }

  const fieldRaw = typeof (firstRule as AnyRecord).field === "string" ? (firstRule as AnyRecord).field.trim() : "";
  const directionRaw =
    typeof (firstRule as AnyRecord).direction === "string"
      ? (firstRule as AnyRecord).direction.trim()
      : typeof (firstRule as AnyRecord).dir === "string"
        ? (firstRule as AnyRecord).dir.trim()
        : mode === "time"
          ? "asc"
          : "desc";

  const direction = directionRaw.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const fieldMap: Record<string, string> = {
    dimension: "label",
    label: "label",
    key: "key",
    value: "value",
    time: "key",
  };
  const field = fieldMap[fieldRaw] || fieldRaw || (mode === "time" ? "key" : "value");
  if (!field) return null;
  return `${field} ${direction}`;
}

function resolveTimeSeriesSelect(timeExpr: string, granularityRaw: unknown) {
  const granularity = typeof granularityRaw === "string" ? granularityRaw.trim().toLowerCase() : "day";
  if (granularity === "month") {
    return {
      key: `TO_CHAR(DATE_TRUNC('month', ${timeExpr}), 'YYYY-MM')`,
      label: `TO_CHAR(DATE_TRUNC('month', ${timeExpr}), 'MM/YYYY')`,
    };
  }
  if (granularity === "week") {
    return {
      key: `TO_CHAR(DATE_TRUNC('week', ${timeExpr}), 'YYYY-MM-DD')`,
      label: `TO_CHAR(DATE_TRUNC('week', ${timeExpr}), 'DD/MM')`,
    };
  }
  return {
    key: `TO_CHAR(${timeExpr}::date, 'YYYY-MM-DD')`,
    label: `TO_CHAR(${timeExpr}::date, 'DD/MM')`,
  };
}

function compileSemanticChartQuery(dq: AnyRecord | undefined): string | null {
  if (!dq || (typeof dq.query === "string" && dq.query.trim())) return null;

  const modelId = typeof dq.model === "string" ? dq.model.trim() : "";
  const measureExpr = typeof dq.measure === "string" ? dq.measure.trim() : "";
  if (!modelId || !measureExpr) return null;

  const model = SEMANTIC_CHART_MODELS[modelId];
  if (!model) return null;

  const alias = typeof dq.alias === "string" && dq.alias.trim() ? dq.alias.trim() : model.alias;
  const measure = resolveSemanticExpr(measureExpr, alias);
  const dimension = resolveSemanticExpr(dq.dimension, alias);
  const timeDimension = resolveSemanticExpr(dq.timeDimension || model.defaultTimeDimension, alias);
  const limit =
    typeof dq.limit === "number" && Number.isFinite(dq.limit) && dq.limit > 0
      ? Math.floor(dq.limit)
      : undefined;

  let query = "";
  if (dimension) {
    query = `SELECT\n  ${dimension} AS key,\n  ${dimension} AS label,\n  ${measure} AS value\nFROM ${model.table} ${alias}\nWHERE 1=1\n  {{filters:${alias}}}\nGROUP BY 1, 2`;
    const orderBy = resolveSemanticChartOrderBy(dq.orderBy, "dimension");
    if (orderBy) query += `\nORDER BY ${orderBy}`;
  } else if (timeDimension) {
    const timeSelect = resolveTimeSeriesSelect(timeDimension, dq.granularity);
    query = `SELECT\n  ${timeSelect.key} AS key,\n  ${timeSelect.label} AS label,\n  ${measure} AS value\nFROM ${model.table} ${alias}\nWHERE 1=1\n  {{filters:${alias}}}\nGROUP BY 1, 2`;
    const orderBy = resolveSemanticChartOrderBy(dq.orderBy, "time");
    if (orderBy) query += `\nORDER BY ${orderBy}`;
  } else {
    return null;
  }

  if (limit !== undefined) query += `\nLIMIT ${limit}`;
  return query;
}

export function inferFilterField(dimension?: string): string {
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

export function useChartInteraction(element: any, dimension?: string) {
  const interaction = (element?.props?.interaction as AnyRecord | undefined) || {};
  const clickAsFilter = Boolean(interaction?.clickAsFilter ?? true);
  const clearOnSecondClick = Boolean(interaction?.clearOnSecondClick ?? true);
  const resolvedFilterField = resolveInteractionFilterField(interaction, inferFilterField(dimension));
  const resolvedFilterStorePath = resolveInteractionFilterStorePath(interaction, resolvedFilterField);
  return {
    clearOnSecondClick,
    resolvedFilterStorePath,
    shouldClickFilter: clickAsFilter && Boolean(resolvedFilterStorePath),
  };
}

export function useResolvedChartColors(colorScheme: string | string[] | undefined, fallback: string[]) {
  const theme = useThemeOverrides();
  return React.useMemo(() => {
    if (Array.isArray(colorScheme) && colorScheme.length) return colorScheme;
    if (typeof colorScheme === "string" && colorScheme.trim()) return [colorScheme.trim()];
    const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
    if (rawVar) {
      try {
        const parsed = JSON.parse(rawVar);
        if (Array.isArray(parsed) && parsed.length) return parsed.map(String);
      } catch {
        const parsed = rawVar.split(",").map((s) => s.trim()).filter(Boolean);
        if (parsed.length) return parsed;
      }
    }
    return fallback;
  }, [colorScheme, JSON.stringify(fallback), theme.cssVars]);
}

export function useChartServerRows(dq: AnyRecord | undefined, data: AnyRecord) {
  const semanticQuery = React.useMemo(() => compileSemanticChartQuery(dq), [JSON.stringify(dq)]);
  const isSqlQueryMode = Boolean((typeof dq?.query === "string" && dq.query.trim()) || semanticQuery);
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!dq || (!isSqlQueryMode && (!dq.model || !dq.dimension || !dq.measure))) {
        setServerRows(null);
        setQueryError(null);
        return;
      }
      if (typeof dq?.query === "string" && dq.query.trim() && (!dq.xField || !dq.yField)) {
        setServerRows(null);
        setQueryError(null);
        return;
      }
      try {
        if (!cancelled) setQueryError(null);
        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
        const globalFilters = (data as any)?.filters;
        if (globalFilters && typeof globalFilters === "object") {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === "dateRange") continue;
            if (filters[k as any] === undefined) (filters as any)[k] = v as any;
          }
        }
        const url = isSqlQueryMode
          ? "/api/modulos/query/execute"
          : `/api/modulos/${String(dq.model).split(".")[0]}/query`;
        const body = isSqlQueryMode
          ? {
              dataQuery: {
                query: (typeof dq?.query === "string" && dq.query.trim()) ? dq.query : semanticQuery,
                xField: dq.xField,
                yField: dq.yField,
                keyField: dq.keyField,
                seriesField: dq.seriesField,
                filters,
                limit: dq.limit,
              },
            }
          : {
              dataQuery: {
                model: dq.model,
                dimension: dq.dimension,
                dimensionExpr: dq.dimensionExpr,
                measure: dq.measure,
                filters,
                orderBy: dq.orderBy,
                limit: dq.limit,
              },
            };
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok || j?.success === false) throw new Error(String(j?.message || `Query failed (${res.status})`));
        if (!cancelled) {
          setServerRows(Array.isArray(j?.rows) ? j.rows : []);
          setQueryError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setServerRows([]);
          setQueryError(e instanceof Error ? e.message : "Erro ao executar query");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), isSqlQueryMode, semanticQuery]);

  return { queryError, serverRows };
}
