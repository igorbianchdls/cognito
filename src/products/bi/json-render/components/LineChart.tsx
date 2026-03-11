"use client";

import React from "react";
import { useData } from "@/products/bi/json-render/context";
import { ResponsiveLine } from "@nivo/line";
import { buildNivoTheme } from "@/products/bi/json-render/helpers";
import { useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";

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

export default function JsonRenderLineChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const theme = useThemeOverrides();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const seriesFieldName = typeof dq?.seriesField === "string" ? dq.seriesField.trim() : "";
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
        const filters = { ...(dq.filters || {}) } as AnyRecord;
        const dr = (data as any)?.filters?.dateRange;
        if (dr && !filters.de && !filters.ate) { if (dr.from) filters.de = dr.from; if (dr.to) filters.ate = dr.to; }
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
        console.error('[BI/LineChart] query failed', e);
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
  const nivo = (element?.props?.nivo as AnyRecord | undefined) || {};

  const normalizedRows = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((r) => {
      const row = r as AnyRecord;
      const xValue = getFieldValue(row, xFieldName, ["label", "x"]);
      const yValue = getFieldValue(row, yFieldName, ["value", "y"]);
      const keyValue = getFieldValue(row, keyFieldName, ["key", xFieldName, "label", "x"]);
      const seriesValue = seriesFieldName ? getFieldValue(row, seriesFieldName, ["series"]) : undefined;
      return {
        x: xValue,
        y: Number(yValue ?? 0),
        filterKey: keyValue ?? xValue,
        series: seriesFieldName ? String(seriesValue ?? "Series") : "Series",
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, seriesFieldName]);

  const hasSeries = Boolean(seriesFieldName);

  const seriesData = React.useMemo(() => {
    const grouped = new Map<string, Array<{ x: unknown; y: number; filterKey: unknown }>>();
    normalizedRows.forEach((row) => {
      const seriesId = row.series || "Series";
      const existing = grouped.get(seriesId) || [];
      existing.push({
        x: row.x,
        y: row.y,
        filterKey: row.filterKey,
      });
      grouped.set(seriesId, existing);
    });
    return Array.from(grouped.entries()).map(([id, dataPoints]) => ({
      id,
      data: dataPoints,
    }));
  }, [normalizedRows]);
  const seriesMinY = React.useMemo(() => {
    const values = seriesData.flatMap((serie: any) => (serie?.data || []))
      .map((p: any) => Number(p?.y))
      .filter((n: number) => Number.isFinite(n));
    if (!values.length) return undefined;
    return Math.min(...values);
  }, [JSON.stringify(seriesData)]);
  const handleGlobalFilterClick = React.useCallback((point: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = point?.data?.filterKey ?? point?.data?.x ?? point?.id;
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
  const colors = (managedScheme && managedScheme.length)
    ? managedScheme
    : (Array.isArray(colorScheme) ? colorScheme : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6']));

  const baseMargin = {
    top: Number(nivo?.margin?.top ?? 10),
    right: Number(nivo?.margin?.right ?? 16),
    bottom: Number(nivo?.margin?.bottom ?? 40),
    left: Number(nivo?.margin?.left ?? 48),
  } as const;
  const autoMargin = (nivo as AnyRecord)?.autoMargin !== false;
  const maxLabelClamp = typeof (nivo as AnyRecord)?.maxLabelWidth === 'number' ? (nivo as AnyRecord).maxLabelWidth : 220;
  const axisFontSize = typeof (nivo as AnyRecord)?.theme?.fontSize === 'number' ? (nivo as AnyRecord).theme.fontSize : 12;
  const managerFont = (theme.cssVars || {} as any).fontFamily as string | undefined;
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
    // Line x-axis labels are seriesData[0].data[].x
    const labels = Array.from(new Set(seriesData.flatMap((serie: any) => (serie?.data || []).map((p: any) => String(p.x ?? '')))));
    const maxW = labels.length ? Math.max(...labels.map(measureText)) : 0;
    const pad = 12;
    m.bottom = Math.max(m.bottom, Math.min(maxLabelClamp, Math.ceil(maxW) + pad));
    // Point scale places first/last ticks on the plot edges, so edge labels need horizontal margin.
    const firstLabel = labels[0] || "";
    const lastLabel = labels[labels.length - 1] || "";
    const edgePad = 10;
    const firstHalf = Math.ceil(measureText(firstLabel) / 2) + edgePad;
    const lastHalf = Math.ceil(measureText(lastLabel) / 2) + edgePad;
    m.left = Math.max(m.left, Math.min(maxLabelClamp, firstHalf));
    m.right = Math.max(m.right, Math.min(maxLabelClamp, lastHalf));
    return m;
  }, [baseMargin.top, baseMargin.right, baseMargin.bottom, baseMargin.left, autoMargin, JSON.stringify(seriesData[0]?.data || []), axisFontSize, managerFont]);

  const axisBottom = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: Number(nivo?.axisBottom?.tickRotation ?? 0),
    legend: typeof nivo?.axisBottom?.legend === 'string' ? nivo.axisBottom.legend : undefined,
    legendOffset: Number(nivo?.axisBottom?.legendOffset ?? 32),
    ...(nivo?.axisBottom || {}),
  } as const;

  const axisLeft = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: typeof nivo?.axisLeft?.legend === 'string' ? nivo.axisLeft.legend : undefined,
    legendOffset: Number(nivo?.axisLeft?.legendOffset ?? 40),
    ...(nivo?.axisLeft || {}),
  } as const;

  const gridX = Boolean(nivo?.gridX ?? false);
  const gridY = Boolean(nivo?.gridY ?? false);
  const curve = (typeof nivo?.curve === 'string' ? nivo.curve : 'linear') as any;
  const enableArea = Boolean(nivo?.area ?? false);
  const areaOpacity = typeof nivo?.areaOpacity === 'number' ? nivo.areaOpacity : undefined;
  const areaBaselineValue =
    typeof nivo?.areaBaselineValue === 'number'
      ? nivo.areaBaselineValue
      : (enableArea && typeof seriesMinY === 'number' && seriesMinY > 0 ? seriesMinY : undefined);
  const enablePoints = Boolean(nivo?.enablePoints ?? true);
  const pointSize = enablePoints ? (typeof nivo?.pointSize === 'number' ? nivo.pointSize : 6) : 0;
  const pointBorderWidth = typeof nivo?.pointBorderWidth === 'number' ? nivo.pointBorderWidth : undefined;
  const pointColor = nivo?.pointColor;
  const pointBorderColor = nivo?.pointBorderColor;
  const lineWidth = typeof nivo?.lineWidth === 'number' ? nivo.lineWidth : 2;
  const legends = Array.isArray(nivo?.legends) ? nivo.legends : undefined;
  const markers = Array.isArray(nivo?.markers) ? nivo.markers : undefined;
  const xScale = (nivo?.xScale && typeof nivo.xScale === 'object' && !Array.isArray(nivo.xScale))
    ? nivo.xScale
    : { type: 'point' };
  const yScale = (nivo?.yScale && typeof nivo.yScale === 'object' && !Array.isArray(nivo.yScale))
    ? { type: 'linear', stacked: false, min: 'auto', max: 'auto', ...nivo.yScale }
    : { type: 'linear', stacked: false, min: 'auto', max: 'auto' };
  const xFormat = typeof nivo?.xFormat === 'string' ? nivo.xFormat : undefined;
  const yFormat = typeof nivo?.yFormat === 'string' ? nivo.yFormat : undefined;
  const useMesh = Boolean(nivo?.useMesh ?? true);
  const enableSlices = nivo?.enableSlices === 'x' || nivo?.enableSlices === 'y'
    ? nivo.enableSlices
    : (nivo?.enableSlices === false ? false : undefined);
  const tooltipConfig = (nivo?.tooltip && typeof nivo.tooltip === 'object' && !Array.isArray(nivo.tooltip)) ? nivo.tooltip as AnyRecord : {};
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (typeof nivo?.motionConfig === 'string' ? nivo.motionConfig : 'gentle') as any;

  let nivoTheme = buildNivoTheme(nivo?.theme);
  const fg = (theme.cssVars || {} as any).fg as string | undefined;
  if (managerFont || fg) {
    const t: any = { ...(nivoTheme || {}) };
    if (managerFont) t.fontFamily = managerFont;
    if (!t.textColor && fg) t.textColor = fg;
    t.axis = t.axis || {};
    t.axis.ticks = t.axis.ticks || {};
    t.axis.ticks.text = { ...(t.axis.ticks.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.axis.legend = t.axis.legend || {};
    t.axis.legend.text = { ...(t.axis.legend.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    t.labels = t.labels || {};
    t.labels.text = { ...(t.labels.text || {}), ...(managerFont ? { fontFamily: managerFont } : {}), ...(fg ? { fill: fg } : {}) };
    nivoTheme = t;
  }
  return (
    <div>
      {queryError && <div className="mb-2 text-xs text-red-600">{queryError}</div>}
      <div style={{ height }}>
        <ResponsiveLine
          data={seriesData}
          margin={computedMargin}
          xScale={xScale as any}
          yScale={yScale as any}
          colors={colors as any}
          curve={curve}
          lineWidth={lineWidth}
          enableGridX={gridX}
          enableGridY={gridY}
          axisBottom={axisBottom as any}
          axisLeft={axisLeft as any}
          xFormat={xFormat}
          yFormat={yFormat}
          pointSize={pointSize}
          pointBorderWidth={pointBorderWidth}
          pointColor={pointColor as any}
          pointBorderColor={pointBorderColor as any}
          enableArea={enableArea}
          areaOpacity={areaOpacity}
          areaBaselineValue={areaBaselineValue as any}
          legends={legends as any}
          markers={markers as any}
          useMesh={useMesh}
          enableSlices={enableSlices as any}
          tooltip={({ point }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200">
              {tooltipConfig.showLabel !== false && <div className="font-medium">{String(point.data.xFormatted ?? point.data.x ?? "")}</div>}
              {Boolean(tooltipConfig.showSeries ?? hasSeries) && <div>{String(point.serieId ?? "")}</div>}
              {tooltipConfig.showValue !== false && <div>{formatValue(point.data.y as any, fmt)}</div>}
            </div>
          )}
          onClick={shouldClickFilter ? handleGlobalFilterClick : undefined}
          animate={animate}
          motionConfig={motionConfig}
          theme={nivoTheme as any}
        />
      </div>
    </div>
  );
}
