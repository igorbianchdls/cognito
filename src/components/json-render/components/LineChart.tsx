"use client";

import React from "react";
import { useData } from "@/components/json-render/context";
import { ResponsiveLine } from "@nivo/line";
import { normalizeTitleStyle, normalizeContainerStyle, buildNivoTheme, applyBorderFromCssVars, ensureSurfaceBackground, applyShadowFromCssVars, applyH1FromCssVars } from "@/components/json-render/helpers";
import { useThemeOverrides } from "@/components/json-render/theme/ThemeContext";

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

export default function JsonRenderLineChart({ element }: { element: any }) {
  const { data } = useData();
  const theme = useThemeOverrides();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const [serverRows, setServerRows] = React.useState<Array<Record<string, unknown>> | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!dq || !dq.model || !dq.dimension || !dq.measure) { setServerRows(null); return; }
      try {
        const mod = String(dq.model).split('.')[0];
        const url = `/api/modulos/${mod}/query`;
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
        const body = { dataQuery: { model: dq.model, dimension: dq.dimension, dimensionExpr: dq.dimensionExpr, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json();
        const rows = Array.isArray(j?.rows) ? j.rows : [];
        if (!cancelled) setServerRows(rows as any);
      } catch (e) { if (!cancelled) setServerRows([]); }
    }
    run();
    return () => { cancelled = true };
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters)]);
  const title = element?.props?.title as string | undefined;
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const nivo = (element?.props?.nivo as AnyRecord | undefined) || {};
  const titleStyle = applyH1FromCssVars(normalizeTitleStyle((element?.props as AnyRecord)?.titleStyle), theme.cssVars);
  const borderless = Boolean((element?.props as AnyRecord)?.borderless);
  const containerStyle = ensureSurfaceBackground(applyShadowFromCssVars(applyBorderFromCssVars(normalizeContainerStyle((element?.props as AnyRecord)?.containerStyle, borderless), theme.cssVars), theme.cssVars), theme.cssVars);

  const seriesData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return [{ id: title || 'Series', data: src.map((r) => ({ x: String((r as AnyRecord).label ?? ''), y: Number((r as AnyRecord).value ?? 0) })) }];
  }, [title, serverRows]);

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
    right: Number(nivo?.margin?.right ?? 10),
    bottom: Number(nivo?.margin?.bottom ?? 40),
    left: Number(nivo?.margin?.left ?? 48),
  } as const;
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
    // Line x-axis labels are seriesData[0].data[].x
    const labels = (seriesData[0]?.data || []).map((p: any) => String(p.x ?? ''));
    const maxW = labels.length ? Math.max(...labels.map(measureText)) : 0;
    const pad = 12;
    m.bottom = Math.max(m.bottom, Math.min(maxLabelClamp, Math.ceil(maxW) + pad));
    return m;
  }, [baseMargin.top, baseMargin.right, baseMargin.bottom, baseMargin.left, autoMargin, JSON.stringify(seriesData[0]?.data || []), axisFontSize, managerFont]);

  const axisBottom = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: Number(nivo?.axisBottom?.tickRotation ?? 0),
    legend: typeof nivo?.axisBottom?.legend === 'string' ? nivo.axisBottom.legend : undefined,
    legendOffset: Number(nivo?.axisBottom?.legendOffset ?? 32),
  } as const;

  const axisLeft = {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: typeof nivo?.axisLeft?.legend === 'string' ? nivo.axisLeft.legend : undefined,
    legendOffset: Number(nivo?.axisLeft?.legendOffset ?? 40),
  } as const;

  const gridX = Boolean(nivo?.gridX ?? false);
  const gridY = Boolean(nivo?.gridY ?? true);
  const curve = (typeof nivo?.curve === 'string' ? nivo.curve : 'linear') as any;
  const enableArea = Boolean(nivo?.area ?? false);
  const pointSize = typeof nivo?.pointSize === 'number' ? nivo.pointSize : 6;
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (typeof nivo?.motionConfig === 'string' ? nivo.motionConfig : 'gentle') as any;

  let nivoTheme = buildNivoTheme(nivo?.theme);
  const managerFont = (theme.cssVars || {} as any).fontFamily as string | undefined;
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
    <div style={containerStyle}>
      {title && <div className="mb-2" style={titleStyle}>{title}</div>}
      <div style={{ height }}>
        <ResponsiveLine
          data={seriesData}
          margin={computedMargin}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
          colors={colors as any}
          curve={curve}
          enableGridX={gridX}
          enableGridY={gridY}
          axisBottom={axisBottom as any}
          axisLeft={axisLeft as any}
          pointSize={pointSize}
          enableArea={enableArea}
          useMesh={true}
          tooltip={({ point }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200 shadow">
              <div className="font-medium">{point.data.xFormatted}</div>
              <div>{formatValue(point.data.y as any, fmt)}</div>
            </div>
          )}
          animate={animate}
          motionConfig={motionConfig}
          theme={nivoTheme as any}
        />
      </div>
    </div>
  );
}
