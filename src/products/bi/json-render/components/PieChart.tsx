"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { ResponsivePie } from "@nivo/pie";
import { buildNivoTheme, isPlainObject, omitObjectKeys } from "@/products/bi/json-render/helpers";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";

type AnyRecord = Record<string, any>;

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
  const root: AnyRecord = Array.isArray(prev) ? [...prev] as any : { ...(prev || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      curr[key] = value;
    } else {
      const next = curr[key];
      curr[key] = (next && typeof next === "object") ? { ...next } : {};
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
  const d = (dimension || '').trim().toLowerCase();
  if (!d) return '';
  const map: Record<string, string> = {
    cliente: 'cliente_id',
    fornecedor: 'fornecedor_id',
    vendedor: 'vendedor_id',
    filial: 'filial_id',
    unidade_negocio: 'unidade_negocio_id',
    canal_venda: 'canal_venda_id',
    categoria_receita: 'categoria_receita_id',
    categoria_despesa: 'categoria_despesa_id',
    centro_lucro: 'centro_lucro_id',
    centro_custo: 'centro_custo_id',
    departamento: 'departamento_id',
    projeto: 'projeto_id',
    territorio: 'territorio_id',
    status: 'status',
  };
  return map[d] || '';
}

export default function JsonRenderPieChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const interaction = (element?.props?.interaction as AnyRecord | undefined) || {};
  const clickAsFilter = Boolean(interaction?.clickAsFilter ?? true);
  const clearOnSecondClick = Boolean(interaction?.clearOnSecondClick ?? true);
  const filterFieldFromConfig = typeof interaction?.filterField === "string" ? interaction.filterField.trim() : "";
  const filterStorePathFromConfig = typeof interaction?.storePath === "string" ? interaction.storePath.trim() : "";
  const resolvedFilterField = filterFieldFromConfig || inferFilterField(dq?.dimension);
  const resolvedFilterStorePath = filterStorePathFromConfig || (resolvedFilterField ? `filters.${resolvedFilterField}` : "");
  const shouldClickFilter = clickAsFilter && Boolean(resolvedFilterStorePath);
  const isSqlQueryMode = Boolean(typeof dq?.query === "string" && dq.query.trim());
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!dq || (!isSqlQueryMode && (!dq.model || !dq.dimension || !dq.measure))) { setServerRows(null); setQueryError(null); return; }
      if (isSqlQueryMode && (!dq.xField || !dq.yField)) { setServerRows(null); setQueryError(null); return; }
      try {
        if (!cancelled) setQueryError(null);
        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
        const globalFilters = (data as any)?.filters;
        if (globalFilters && typeof globalFilters === 'object') {
          for (const [k, v] of Object.entries(globalFilters)) {
            if (k === 'dateRange') continue;
            if (filters[k as any] === undefined) (filters as any)[k] = v as any;
          }
        }
        const url = isSqlQueryMode
          ? "/api/modulos/query/execute"
          : `/api/modulos/${String(dq.model).split(".")[0]}/query`;
        const body = isSqlQueryMode
          ? {
              dataQuery: {
                query: dq.query,
                xField: dq.xField,
                yField: dq.yField,
                keyField: dq.keyField,
                seriesField: dq.seriesField,
                filters,
                limit: dq.limit,
              },
            }
          : { dataQuery: { model: dq.model, dimension: dq.dimension, dimensionExpr: dq.dimensionExpr, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json();
        if (!res.ok || j?.success === false) throw new Error(String(j?.message || `Query failed (${res.status})`));
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) {
          setServerRows(rows as any);
          setQueryError(null);
        }
      } catch (e) {
        console.error('[BI/PieChart] query failed', e);
        if (!cancelled) {
          setServerRows([]);
          setQueryError(e instanceof Error ? e.message : 'Erro ao executar query');
        }
      }
    }
    run();
    return () => { cancelled = true };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), isSqlQueryMode]);
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const rawNivoProps = isPlainObject(element?.props?.nivo) ? element.props.nivo as AnyRecord : {};

  const pieData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    const rows = src.map((r) => {
      const row = r as AnyRecord;
      const labelValue = getFieldValue(row, xFieldName, ["label", "x"]);
      const value = getFieldValue(row, yFieldName, ["value", "y"]);
      const keyValue = getFieldValue(row, keyFieldName, ["key", xFieldName, "label", "x"]);
      return {
        id: String(labelValue ?? ''),
        label: String(labelValue ?? ''),
        value: Number(value ?? 0),
        filterKey: keyValue ?? String(labelValue ?? ''),
      };
    });
    if (Boolean(rawNivoProps?.sortByValue ?? false)) {
      rows.sort((a, b) => b.value - a.value);
    }
    return rows;
  }, [serverRows, xFieldName, yFieldName, keyFieldName, rawNivoProps?.sortByValue]);
  const handleGlobalFilterClick = React.useCallback((datum: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = datum?.data?.filterKey ?? datum?.filterKey ?? datum?.id ?? datum?.label;
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const nextValue = (typeof rawValue === "number" || typeof rawValue === "string") ? rawValue : String(rawValue);
    setData((prev) => {
      const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
      const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
      return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : nextValue);
    });
  }, [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick]);

  let managedScheme: string[] | undefined = undefined;
  const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
  if (rawVar) {
    try { managedScheme = JSON.parse(rawVar); }
    catch { managedScheme = rawVar.split(',').map(s => s.trim()).filter(Boolean); }
  }
  const resolvedColors = (managedScheme && managedScheme.length)
    ? managedScheme
    : (rawNivoProps.colors ?? (Array.isArray(colorScheme) ? colorScheme : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'])));

  const resolvedMargin = {
    top: Number(rawNivoProps?.margin?.top ?? 20),
    right: Number(rawNivoProps?.margin?.right ?? 20),
    bottom: Number(rawNivoProps?.margin?.bottom ?? 20),
    left: Number(rawNivoProps?.margin?.left ?? 20),
  };

  const resolvedInnerRadius = typeof rawNivoProps?.innerRadius === 'number' ? rawNivoProps.innerRadius : 0;
  const resolvedPadAngle = typeof rawNivoProps?.padAngle === 'number' ? rawNivoProps.padAngle : 0.7;
  const resolvedCornerRadius = typeof rawNivoProps?.cornerRadius === 'number' ? rawNivoProps.cornerRadius : 3;
  const resolvedStartAngle = typeof rawNivoProps?.startAngle === 'number' ? rawNivoProps.startAngle : undefined;
  const resolvedEndAngle = typeof rawNivoProps?.endAngle === 'number' ? rawNivoProps.endAngle : undefined;
  const resolvedActiveInnerRadiusOffset = typeof rawNivoProps?.activeInnerRadiusOffset === 'number' ? rawNivoProps.activeInnerRadiusOffset : 0;
  const resolvedActiveOuterRadiusOffset = typeof rawNivoProps?.activeOuterRadiusOffset === 'number' ? rawNivoProps.activeOuterRadiusOffset : 8;
  const resolvedEnableArcLabels = Boolean(rawNivoProps?.enableArcLabels ?? true);
  const resolvedEnableArcLinkLabels = Boolean(rawNivoProps?.enableArcLinkLabels ?? false);
  const resolvedArcLabelsSkipAngle = typeof rawNivoProps?.arcLabelsSkipAngle === 'number' ? rawNivoProps.arcLabelsSkipAngle : 10;
  const resolvedArcLabelsTextColor = typeof rawNivoProps?.arcLabelsTextColor === 'string' ? rawNivoProps.arcLabelsTextColor : '#333333';
  const resolvedArcLinkLabelsSkipAngle = typeof rawNivoProps?.arcLinkLabelsSkipAngle === 'number' ? rawNivoProps.arcLinkLabelsSkipAngle : undefined;
  const resolvedArcLinkLabelsTextColor = typeof rawNivoProps?.arcLinkLabelsTextColor === 'string' ? rawNivoProps.arcLinkLabelsTextColor : undefined;
  const resolvedLegends = Array.isArray(rawNivoProps?.legends) ? rawNivoProps.legends : undefined;
  const tooltipConfig = isPlainObject(rawNivoProps?.tooltip) ? rawNivoProps.tooltip as AnyRecord : {};
  const resolvedAnimate = Boolean(rawNivoProps?.animate ?? true);
  const resolvedMotionConfig = (rawNivoProps?.motionConfig ?? 'gentle') as any;
  let resolvedNivoTheme = buildNivoTheme(rawNivoProps?.theme);
  const managerFont = (theme.cssVars || {} as any).fontFamily as string | undefined;
  const fg = (theme.cssVars || {} as any).fg as string | undefined;
  if (managerFont || fg) {
    const t: any = { ...(resolvedNivoTheme || {}) };
    if (managerFont) t.fontFamily = managerFont;
    if (!t.textColor && fg) t.textColor = fg;
    t.labels = t.labels || {};
    t.labels.text = { ...(t.labels.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis = t.axis || {};
    t.axis.ticks = t.axis.ticks || {};
    t.axis.ticks.text = { ...(t.axis.ticks.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis.legend = t.axis.legend || {};
    t.axis.legend.text = { ...(t.axis.legend.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    resolvedNivoTheme = t;
  }
  const resolvedNivoProps = {
    ...rawNivoProps,
    margin: resolvedMargin,
    innerRadius: resolvedInnerRadius,
    padAngle: resolvedPadAngle,
    cornerRadius: resolvedCornerRadius,
    startAngle: resolvedStartAngle,
    endAngle: resolvedEndAngle,
    activeInnerRadiusOffset: resolvedActiveInnerRadiusOffset,
    activeOuterRadiusOffset: resolvedActiveOuterRadiusOffset,
    colors: resolvedColors,
    enableArcLabels: resolvedEnableArcLabels,
    enableArcLinkLabels: resolvedEnableArcLinkLabels,
    arcLabelsSkipAngle: resolvedArcLabelsSkipAngle,
    arcLabelsTextColor: resolvedArcLabelsTextColor,
    arcLinkLabelsSkipAngle: resolvedArcLinkLabelsSkipAngle,
    arcLinkLabelsTextColor: resolvedArcLinkLabelsTextColor,
    legends: resolvedLegends,
    animate: resolvedAnimate,
    motionConfig: resolvedMotionConfig,
    theme: resolvedNivoTheme,
  } satisfies AnyRecord;
  const forwardedNivoProps = omitObjectKeys(resolvedNivoProps, [
    'theme',
    'tooltip',
    'margin',
    'colors',
    'innerRadius',
    'padAngle',
    'cornerRadius',
    'startAngle',
    'endAngle',
    'activeInnerRadiusOffset',
    'activeOuterRadiusOffset',
    'enableArcLabels',
    'enableArcLinkLabels',
    'arcLabelsSkipAngle',
    'arcLabelsTextColor',
    'arcLinkLabelsSkipAngle',
    'arcLinkLabelsTextColor',
    'legends',
    'animate',
    'motionConfig',
  ]);
  const totalValue = React.useMemo(
    () => pieData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [pieData]
  );
  return (
    <div>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ height }}>
        <ResponsivePie
          {...forwardedNivoProps}
          data={pieData}
          margin={resolvedNivoProps.margin as any}
          innerRadius={resolvedNivoProps.innerRadius as any}
          padAngle={resolvedNivoProps.padAngle as any}
          cornerRadius={resolvedNivoProps.cornerRadius as any}
          startAngle={resolvedNivoProps.startAngle as any}
          endAngle={resolvedNivoProps.endAngle as any}
          activeInnerRadiusOffset={resolvedNivoProps.activeInnerRadiusOffset as any}
          activeOuterRadiusOffset={resolvedNivoProps.activeOuterRadiusOffset as any}
          colors={resolvedNivoProps.colors as any}
          enableArcLabels={resolvedNivoProps.enableArcLabels as any}
          enableArcLinkLabels={resolvedNivoProps.enableArcLinkLabels as any}
          arcLabelsSkipAngle={resolvedNivoProps.arcLabelsSkipAngle as any}
          arcLabelsTextColor={resolvedNivoProps.arcLabelsTextColor as any}
          arcLinkLabelsSkipAngle={resolvedNivoProps.arcLinkLabelsSkipAngle as any}
          arcLinkLabelsTextColor={resolvedNivoProps.arcLinkLabelsTextColor as any}
          legends={resolvedNivoProps.legends as any}
          tooltip={({ datum }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200">
              {tooltipConfig.showLabel !== false && <div className="font-medium">{datum.label}</div>}
              {tooltipConfig.showValue !== false && <div>{formatValue(datum.value, fmt)}</div>}
              {Boolean(tooltipConfig.showPercentOfTotal ?? false) && totalValue > 0 && (
                <div>{`${((Number(datum.value || 0) / totalValue) * 100).toFixed(1)}% do total`}</div>
              )}
            </div>
          )}
          onClick={shouldClickFilter ? handleGlobalFilterClick : undefined}
          animate={resolvedNivoProps.animate as any}
          motionConfig={resolvedNivoProps.motionConfig as any}
          theme={resolvedNivoProps.theme as any}
        />
      </div>
    </div>
  );
}
