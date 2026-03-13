"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { ResponsiveBar } from "@nivo/bar";
import { buildNivoTheme, isPlainObject, omitObjectKeys } from "@/products/bi/json-render/helpers";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";
import { resolveInteractionFilterField, resolveInteractionFilterStorePath } from "@/products/bi/json-render/interactionFilters";

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

export default function JsonRenderBarChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const rawNivoProps = isPlainObject(element?.props?.nivo) ? element.props.nivo as AnyRecord : {};
  const nivo = rawNivoProps;

  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const seriesFieldName = typeof dq?.seriesField === "string" ? dq.seriesField.trim() : "";
  const drilldown = (element?.props?.drilldown as AnyRecord | undefined);
  const interaction = (element?.props?.interaction as AnyRecord | undefined) || {};
  const inferFilterField = React.useCallback((dimension?: string) => {
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
  }, []);
  const drillLevels = React.useMemo(() => {
    const raw = Array.isArray(drilldown?.levels) ? drilldown.levels : [];
    return raw
      .map((level: any, idx: number) => {
        if (!level || typeof level !== 'object') return null;
        const dimension = typeof level.dimension === 'string' ? level.dimension.trim() : '';
        const dimensionExpr = typeof level.dimensionExpr === 'string' ? level.dimensionExpr.trim() : '';
        if (!dimension && !dimensionExpr) return null;
        const filterFieldFromConfig = typeof level.filterField === 'string' ? level.filterField.trim() : '';
        const filterField = filterFieldFromConfig || inferFilterField(dimension);
        return {
          label: typeof level.label === 'string' && level.label.trim() ? level.label.trim() : `Nivel ${idx + 1}`,
          dimension,
          dimensionExpr,
          filterField,
        };
      })
      .filter(Boolean) as Array<{ label: string; dimension?: string; dimensionExpr?: string; filterField?: string }>;
  }, [JSON.stringify(drilldown?.levels || []), inferFilterField]);
  const drillEnabled = drillLevels.length > 0;
  const clickAsFilter = Boolean(interaction?.clickAsFilter ?? true);
  const clearOnSecondClick = Boolean(interaction?.clearOnSecondClick ?? true);
  const resolvedFilterField = resolveInteractionFilterField(interaction, inferFilterField(dq?.dimension));
  const resolvedFilterStorePath = resolveInteractionFilterStorePath(interaction, resolvedFilterField);
  const alsoWithDrill = Boolean(interaction?.alsoWithDrill ?? false);
  const shouldClickFilter = clickAsFilter && Boolean(resolvedFilterStorePath) && (!drillEnabled || alsoWithDrill);
  const [drillLevelIndex, setDrillLevelIndex] = React.useState(0);
  const [drillPath, setDrillPath] = React.useState<Array<{ level: number; label: string; value: string | number; filterField: string }>>([]);
  React.useEffect(() => {
    setDrillLevelIndex(0);
    setDrillPath([]);
  }, [JSON.stringify(drilldown?.levels || []), JSON.stringify(dq)]);
  const activeDrillLevel = drillEnabled ? drillLevels[Math.min(drillLevelIndex, drillLevels.length - 1)] : null;
  const effectiveDimension = (activeDrillLevel?.dimension && activeDrillLevel.dimension.length > 0)
    ? activeDrillLevel.dimension
    : dq?.dimension;
  const effectiveDimensionExpr = (activeDrillLevel?.dimensionExpr && activeDrillLevel.dimensionExpr.length > 0)
    ? activeDrillLevel.dimensionExpr
    : dq?.dimensionExpr;
  const isSqlQueryMode = Boolean(typeof dq?.query === "string" && dq.query.trim());
  const canDrillDown = drillEnabled && drillLevelIndex < (drillLevels.length - 1);
  const canDrillUp = drillEnabled && drillLevelIndex > 0;
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (
        !dq ||
        (!isSqlQueryMode && (!dq.model || (!effectiveDimension && !effectiveDimensionExpr) || !dq.measure))
      ) { setServerRows(null); setQueryError(null); return; }
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
        if (drillEnabled && drillPath.length > 0) {
          for (let i = 0; i < Math.min(drillLevelIndex, drillPath.length); i++) {
            const step = drillPath[i];
            if (!step?.filterField) continue;
            (filters as AnyRecord)[step.filterField] = step.value;
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
          : { dataQuery: { model: dq.model, dimension: effectiveDimension, dimensionExpr: effectiveDimensionExpr, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json();
        if (!res.ok || j?.success === false) throw new Error(String(j?.message || `Query failed (${res.status})`));
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) {
          setServerRows(rows as any);
          setQueryError(null);
        }
      } catch (e) {
        console.error('[BI/BarChart] query failed', e);
        if (!cancelled) {
          setServerRows([]);
          setQueryError(e instanceof Error ? e.message : 'Erro ao executar query');
        }
      }
    }
    run();
    return () => { cancelled = true };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), effectiveDimension, effectiveDimensionExpr, isSqlQueryMode, drillEnabled, drillLevelIndex, JSON.stringify(drillPath)]);

  const normalizedRows = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((r) => {
      const row = r as AnyRecord;
      const xValue = getFieldValue(row, xFieldName, ["label", "x"]);
      const yValue = getFieldValue(row, yFieldName, ["value", "y"]);
      const keyValue = getFieldValue(row, keyFieldName, ["key", xFieldName, "label", "x"]);
      const seriesValue = seriesFieldName ? getFieldValue(row, seriesFieldName, ["series"]) : undefined;
      return {
        label: String(xValue ?? ""),
        value: Number(yValue ?? 0),
        drillKey: keyValue ?? String(xValue ?? ""),
        series: seriesFieldName ? String(seriesValue ?? "Series") : undefined,
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, seriesFieldName]);

  const hasSeries = Boolean(seriesFieldName);
  const barSeriesKeys = React.useMemo(() => {
    if (!hasSeries) return ["value"];
    const keys = new Set<string>();
    normalizedRows.forEach((row) => {
      const series = String(row.series || "Series");
      if (series) keys.add(series);
    });
    return Array.from(keys);
  }, [hasSeries, normalizedRows]);

  const barData = React.useMemo(() => {
    if (!hasSeries) {
      return normalizedRows.map((row) => ({
        indexLabel: row.label,
        label: row.label,
        value: row.value,
        drillKey: row.drillKey,
      }));
    }
    const grouped = new Map<string, AnyRecord>();
    normalizedRows.forEach((row) => {
      const indexLabel = row.label;
      const series = String(row.series || "Series");
      const current = grouped.get(indexLabel) || {
        indexLabel,
        label: indexLabel,
        drillKey: row.drillKey,
        __rawKeys: {},
        __groupTotal: 0,
      };
      current[series] = row.value;
      current.__rawKeys[series] = row.drillKey;
      current.__groupTotal += row.value;
      grouped.set(indexLabel, current);
    });
    return Array.from(grouped.values());
  }, [hasSeries, normalizedRows]);

  // Color manager override via Theme cssVars
  let managedScheme: string[] | undefined = undefined;
  const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
  if (rawVar) {
    try { managedScheme = JSON.parse(rawVar); }
    catch { managedScheme = rawVar.split(',').map(s => s.trim()).filter(Boolean); }
  }
  const colors = (managedScheme && managedScheme.length)
    ? managedScheme
    : (nivo.colors ?? (Array.isArray(colorScheme) ? colorScheme : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6'])));

  // Determine layout early (used by auto-margin)
  const layout = (typeof (nivo as AnyRecord)?.layout === 'string' ? (nivo as AnyRecord).layout : 'vertical') as 'vertical'|'horizontal';
  // Base margins
  const baseMargin = {
    top: Number(nivo?.margin?.top ?? 10),
    right: Number(nivo?.margin?.right ?? 10),
    bottom: Number(nivo?.margin?.bottom ?? 40),
    left: Number(nivo?.margin?.left ?? 48),
  } as const;
  const managerFont = (theme.cssVars || {} as any).fontFamily as string | undefined;
  // Auto‑margin to avoid clipping long axis labels
  const autoMargin = (nivo as AnyRecord)?.autoMargin !== false;
  const maxLabelClamp = typeof (nivo as AnyRecord)?.maxLabelWidth === 'number' ? (nivo as AnyRecord).maxLabelWidth : 220;
  const axisFontSize = typeof (nivo as AnyRecord)?.theme?.fontSize === 'number' ? (nivo as AnyRecord).theme.fontSize : 12;
  const canvasMeasure = React.useMemo(() => {
    if (typeof document === 'undefined') return null as HTMLCanvasElement | null;
    const c = document.createElement('canvas');
    return c;
  }, []);
  function measureText(text: string): number {
    if (!canvasMeasure) return Math.max(0, text?.length || 0) * (axisFontSize * 0.6);
    const ctx = canvasMeasure.getContext('2d');
    if (!ctx) return Math.max(0, text?.length || 0) * (axisFontSize * 0.6);
    const firstFamily = (managerFont || 'Inter, sans-serif').split(',')[0];
    ctx.font = `${axisFontSize}px ${firstFamily}`;
    return ctx.measureText(String(text || '')).width;
  }
  const computedMargin = React.useMemo(() => {
    const m = { ...baseMargin } as { top: number; right: number; bottom: number; left: number };
    if (!autoMargin) return m;
    const labels = barData.map(d => d.label || '');
    const maxW = labels.length ? Math.max(...labels.map(measureText)) : 0;
    const pad = 12;
    if ((layout as any) === 'horizontal') {
      m.left = Math.max(m.left, Math.min(maxLabelClamp, Math.ceil(maxW) + pad));
    } else {
      m.bottom = Math.max(m.bottom, Math.min(maxLabelClamp, Math.ceil(maxW) + pad));
    }
    return m;
  }, [baseMargin.top, baseMargin.right, baseMargin.bottom, baseMargin.left, autoMargin, barData.map(d => d.label).join('|'), layout, axisFontSize, managerFont]);

  const axisBottom = nivo?.axisBottom === null
    ? null
    : {
        tickSize: 5,
        tickPadding: 5,
        tickRotation: Number(nivo?.axisBottom?.tickRotation ?? 0),
        legend: typeof nivo?.axisBottom?.legend === 'string' ? nivo.axisBottom.legend : undefined,
        legendOffset: Number(nivo?.axisBottom?.legendOffset ?? 32),
        tickValues: nivo?.axisBottom?.tickValues ?? ((layout === 'horizontal')
          ? Number(nivo?.axisBottom?.maxTicks ?? 5)
          : undefined),
        ...(isPlainObject(nivo?.axisBottom) ? nivo.axisBottom : {}),
      } as const;

  const axisLeft = nivo?.axisLeft === null
    ? null
    : {
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: typeof nivo?.axisLeft?.legend === 'string' ? nivo.axisLeft.legend : undefined,
        legendOffset: Number(nivo?.axisLeft?.legendOffset ?? 40),
        tickValues: nivo?.axisLeft?.tickValues ?? ((layout === 'vertical')
          ? Number(nivo?.axisLeft?.maxTicks ?? 5)
          : undefined),
        ...(isPlainObject(nivo?.axisLeft) ? nivo.axisLeft : {}),
      } as const;

  const padding = typeof nivo?.padding === 'number' ? nivo.padding : 0.3;
  const innerPadding = typeof nivo?.innerPadding === 'number' ? nivo.innerPadding : undefined;
  const borderRadius = typeof (nivo as AnyRecord)?.borderRadius === 'number'
    ? Number((nivo as AnyRecord).borderRadius)
    : 6;
  const borderWidth = typeof nivo?.borderWidth === 'number' ? nivo.borderWidth : 0;
  const borderColor = nivo?.borderColor;
  const groupMode = (nivo?.groupMode === 'stacked' ? 'stacked' : 'grouped') as 'grouped'|'stacked';
  const colorBy = (typeof (nivo as AnyRecord)?.colorBy === 'string'
    ? (nivo as AnyRecord).colorBy
    : 'indexValue') as any;
  const minValue = nivo?.minValue ?? 'auto';
  const maxValue = nivo?.maxValue ?? 'auto';
  const valueScale = isPlainObject(nivo?.valueScale)
    ? { ...nivo.valueScale, min: nivo?.valueScale?.min ?? minValue, max: nivo?.valueScale?.max ?? maxValue }
    : { type: 'linear', min: minValue, max: maxValue };
  const enableGridX = typeof nivo?.enableGridX === 'boolean' ? nivo.enableGridX : Boolean(nivo?.gridX ?? false);
  const enableGridY = typeof nivo?.enableGridY === 'boolean' ? nivo.enableGridY : Boolean(nivo?.gridY ?? false);
  const enableLabel = Boolean(nivo?.enableLabel ?? false);
  const labelSkipWidth = typeof nivo?.labelSkipWidth === 'number' ? nivo.labelSkipWidth : 12;
  const labelSkipHeight = typeof nivo?.labelSkipHeight === 'number' ? nivo.labelSkipHeight : 12;
  const labelTextColor = nivo?.labelTextColor ?? { from: 'color', modifiers: [['darker', 1.4]] };
  const legends = Array.isArray(nivo?.legends) ? nivo.legends : undefined;
  const markers = Array.isArray(nivo?.markers) ? nivo.markers : undefined;
  const tooltipConfig = isPlainObject(nivo?.tooltip) ? nivo.tooltip as AnyRecord : {};
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (nivo?.motionConfig ?? 'gentle') as any;
  const forwardedNivoProps = omitObjectKeys(rawNivoProps, [
    'theme',
    'tooltip',
    'margin',
    'colors',
    'layout',
    'padding',
    'innerPadding',
    'borderRadius',
    'borderWidth',
    'borderColor',
    'groupMode',
    'colorBy',
    'minValue',
    'maxValue',
    'enableGridX',
    'enableGridY',
    'gridX',
    'gridY',
    'axisBottom',
    'axisLeft',
    'labelSkipWidth',
    'labelSkipHeight',
    'enableLabel',
    'labelTextColor',
    'legends',
    'markers',
    'animate',
    'motionConfig',
    'autoMargin',
    'maxLabelWidth',
  ]);

  let resolvedNivoTheme = buildNivoTheme(rawNivoProps?.theme);
  const fg = (theme.cssVars || {} as any).fg as string | undefined;
  if (managerFont || fg) {
    const t: any = { ...(resolvedNivoTheme || {}) };
    if (managerFont) t.fontFamily = managerFont;
    if (!t.textColor && fg) t.textColor = fg;
    t.axis = t.axis || {};
    t.axis.ticks = t.axis.ticks || {};
    t.axis.ticks.text = { ...(t.axis.ticks.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis.legend = t.axis.legend || {};
    t.axis.legend.text = { ...(t.axis.legend.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.labels = t.labels || {};
    t.labels.text = { ...(t.labels.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    resolvedNivoTheme = t;
  }
  const resolvedNivoProps = {
    ...rawNivoProps,
    margin: computedMargin,
    padding,
    innerPadding,
    borderRadius,
    borderWidth,
    borderColor,
    groupMode,
    layout,
    colorBy,
    minValue,
    maxValue,
    valueScale,
    colors,
    enableGridX,
    enableGridY,
    axisBottom,
    axisLeft,
    labelSkipWidth,
    labelSkipHeight,
    enableLabel,
    labelTextColor,
    legends,
    markers,
    animate,
    motionConfig,
    theme: resolvedNivoTheme,
  } satisfies AnyRecord;
  const handleDrillDown = React.useCallback((point: any) => {
    if (!canDrillDown || !activeDrillLevel) return;
    const row = (point?.data || point || {}) as AnyRecord;
    const clickedLabel = String(row.label ?? row.indexValue ?? '');
    const rawKey = row.drillKey ?? row.key ?? row.id ?? clickedLabel;
    const normalizedKey = (typeof rawKey === 'number' || typeof rawKey === 'string') ? rawKey : clickedLabel;
    const filterField = typeof activeDrillLevel.filterField === 'string' ? activeDrillLevel.filterField.trim() : '';
    setDrillPath((prev) => {
      const prefix = prev.slice(0, drillLevelIndex);
      if (!filterField || normalizedKey === undefined || normalizedKey === null || normalizedKey === '') {
        return prefix;
      }
      return [...prefix, { level: drillLevelIndex, label: clickedLabel, value: normalizedKey, filterField }];
    });
    setDrillLevelIndex((prev) => Math.min(prev + 1, drillLevels.length - 1));
  }, [canDrillDown, activeDrillLevel, drillLevelIndex, drillLevels.length]);
  const handleGlobalFilterClick = React.useCallback((point: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const row = (point?.data || point || {}) as AnyRecord;
    const seriesKey = String(point?.id ?? "");
    const rawValue = row.__rawKeys?.[seriesKey] ?? row.drillKey ?? row.key ?? row.id ?? row.label ?? row.indexValue;
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    const nextValue = (typeof rawValue === "number" || typeof rawValue === "string") ? rawValue : String(rawValue);
    setData((prev) => {
      const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
      const shouldClear = clearOnSecondClick && String(current ?? "") === String(nextValue);
      return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : nextValue);
    });
  }, [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick]);
  const handleDrillUp = React.useCallback(() => {
    setDrillLevelIndex((prev) => {
      const next = Math.max(0, prev - 1);
      setDrillPath((path) => path.slice(0, next));
      return next;
    });
  }, []);
  const handleDrillReset = React.useCallback(() => {
    setDrillLevelIndex(0);
    setDrillPath([]);
  }, []);
  const breadcrumb = React.useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i <= drillLevelIndex; i++) {
      const level = drillLevels[i];
      if (!level) break;
      const step = drillPath[i];
      labels.push(step?.label ? `${level.label}: ${step.label}` : level.label);
    }
    return labels.join(' > ');
  }, [drillLevelIndex, drillLevels, drillPath]);
  const handleChartClick = React.useCallback((point: any) => {
    if (shouldClickFilter) handleGlobalFilterClick(point);
    if (canDrillDown) handleDrillDown(point);
  }, [shouldClickFilter, handleGlobalFilterClick, canDrillDown, handleDrillDown]);
  return (
    <div style={{ overflow: 'visible' }}>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      {drillEnabled && drilldown?.showBreadcrumb !== false && (
        <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-500">
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canDrillUp}
            onClick={handleDrillUp}
          >
            Voltar
          </button>
          <span>{breadcrumb}</span>
          {canDrillUp && (
            <button
              type="button"
              className="rounded border border-gray-300 px-2 py-0.5"
              onClick={handleDrillReset}
            >
              Reset
            </button>
          )}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveBar
          {...forwardedNivoProps}
          data={barData}
          keys={barSeriesKeys}
          indexBy="indexLabel"
          margin={resolvedNivoProps.margin as any}
          padding={resolvedNivoProps.padding as any}
          innerPadding={resolvedNivoProps.innerPadding as any}
          borderRadius={resolvedNivoProps.borderRadius as any}
          borderWidth={resolvedNivoProps.borderWidth as any}
          borderColor={resolvedNivoProps.borderColor as any}
          groupMode={resolvedNivoProps.groupMode as any}
          layout={resolvedNivoProps.layout as any}
          colorBy={resolvedNivoProps.colorBy as any}
          valueScale={resolvedNivoProps.valueScale as any}
          colors={resolvedNivoProps.colors as any}
          enableGridX={resolvedNivoProps.enableGridX as any}
          enableGridY={resolvedNivoProps.enableGridY as any}
          axisBottom={resolvedNivoProps.axisBottom as any}
          axisLeft={resolvedNivoProps.axisLeft as any}
          labelSkipWidth={resolvedNivoProps.labelSkipWidth as any}
          labelSkipHeight={resolvedNivoProps.labelSkipHeight as any}
          enableLabel={resolvedNivoProps.enableLabel as any}
          labelTextColor={resolvedNivoProps.labelTextColor as any}
          legends={resolvedNivoProps.legends as any}
          markers={resolvedNivoProps.markers as any}
          tooltip={({ data, id, value, indexValue }) => {
            const rawData = data as AnyRecord;
            const groupTotal = Number(rawData.__groupTotal ?? 0);
            const showLabel = tooltipConfig.showLabel !== false;
            const showValue = tooltipConfig.showValue !== false;
            const showSeries = Boolean(tooltipConfig.showSeries ?? hasSeries);
            const showPercentOfGroup = Boolean(tooltipConfig.showPercentOfGroup ?? false);
            const percentOfGroup = groupTotal > 0 && typeof value === 'number'
              ? Number(value) / groupTotal
              : undefined;
            return (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200">
              {showLabel && <div className="font-medium">{String(indexValue ?? rawData.label ?? "")}</div>}
              {showSeries && <div>{String(id ?? "")}</div>}
              {showValue && <div>{formatValue(value, fmt)}</div>}
              {showPercentOfGroup && percentOfGroup !== undefined && (
                <div>{`${(percentOfGroup * 100).toFixed(1)}% do grupo`}</div>
              )}
            </div>
            );
          }}
          onClick={(canDrillDown || shouldClickFilter) ? handleChartClick : undefined}
          animate={resolvedNivoProps.animate as any}
          motionConfig={resolvedNivoProps.motionConfig as any}
          theme={resolvedNivoProps.theme as any}
        />
      </div>
    </div>
  );
}
