"use client";

import React from "react";
import { useData } from "@/components/json-render/context";
import { ResponsivePie } from "@nivo/pie";
import { normalizeTitleStyle, normalizeContainerStyle, buildNivoTheme, applyBorderFromCssVars, ensureSurfaceBackground } from "@/components/json-render/helpers";
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

export default function JsonRenderPieChart({ element }: { element: any }) {
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
  const titleStyle = normalizeTitleStyle((element?.props as AnyRecord)?.titleStyle);
  const borderless = Boolean((element?.props as AnyRecord)?.borderless);
  const containerStyle = ensureSurfaceBackground(applyBorderFromCssVars(normalizeContainerStyle((element?.props as AnyRecord)?.containerStyle, borderless), theme.cssVars), theme.cssVars);

  const pieData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((r) => ({ id: String((r as AnyRecord).label ?? ''), label: String((r as AnyRecord).label ?? ''), value: Number((r as AnyRecord).value ?? 0) }));
  }, [serverRows]);

  let managedScheme: string[] | undefined = undefined;
  const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
  if (rawVar) {
    try { managedScheme = JSON.parse(rawVar); }
    catch { managedScheme = rawVar.split(',').map(s => s.trim()).filter(Boolean); }
  }
  const colors = Array.isArray(colorScheme)
    ? colorScheme
    : (managedScheme || (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']));

  const margin = {
    top: Number(nivo?.margin?.top ?? 10),
    right: Number(nivo?.margin?.right ?? 10),
    bottom: Number(nivo?.margin?.bottom ?? 10),
    left: Number(nivo?.margin?.left ?? 10),
  };

  const innerRadius = typeof nivo?.innerRadius === 'number' ? nivo.innerRadius : 0;
  const padAngle = typeof nivo?.padAngle === 'number' ? nivo.padAngle : 0.7;
  const cornerRadius = typeof nivo?.cornerRadius === 'number' ? nivo.cornerRadius : 3;
  const activeInnerRadiusOffset = typeof nivo?.activeInnerRadiusOffset === 'number' ? nivo.activeInnerRadiusOffset : 0;
  const activeOuterRadiusOffset = typeof nivo?.activeOuterRadiusOffset === 'number' ? nivo.activeOuterRadiusOffset : 8;
  const enableArcLabels = Boolean(nivo?.enableArcLabels ?? true);
  const arcLabelsSkipAngle = typeof nivo?.arcLabelsSkipAngle === 'number' ? nivo.arcLabelsSkipAngle : 10;
  const arcLabelsTextColor = typeof nivo?.arcLabelsTextColor === 'string' ? nivo.arcLabelsTextColor : '#333333';
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (typeof nivo?.motionConfig === 'string' ? nivo.motionConfig : 'gentle') as any;

  const nivoTheme = buildNivoTheme(nivo?.theme);
  return (
    <div className="rounded-lg border p-0 shadow-sm" style={containerStyle}>
      {title && <div className="text-sm font-medium text-gray-900 mb-2" style={titleStyle}>{title}</div>}
      <div style={{ height }}>
        <ResponsivePie
          data={pieData}
          margin={margin}
          innerRadius={innerRadius}
          padAngle={padAngle}
          cornerRadius={cornerRadius}
          activeInnerRadiusOffset={activeInnerRadiusOffset}
          activeOuterRadiusOffset={activeOuterRadiusOffset}
          colors={colors as any}
          enableArcLabels={enableArcLabels}
          arcLabelsSkipAngle={arcLabelsSkipAngle}
          arcLabelsTextColor={arcLabelsTextColor}
          tooltip={({ datum }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200 shadow">
              <div className="font-medium">{datum.label}</div>
              <div>{formatValue(datum.value, fmt)}</div>
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
