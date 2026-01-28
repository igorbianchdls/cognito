"use client";

import React from "react";
import { useData } from "@/components/json-render/context";
import { ResponsiveBar } from "@nivo/bar";
import { normalizeTitleStyle, normalizeContainerStyle, buildNivoTheme } from "@/components/json-render/helpers";

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

export default function JsonRenderBarChart({ element }: { element: any }) {
  const { data } = useData();
  const title = element?.props?.title as string | undefined;
  const xKey = element?.props?.xKey as string;
  const yKey = element?.props?.yKey as string;
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const nivo = (element?.props?.nivo as AnyRecord | undefined) || {};
  const titleStyle = normalizeTitleStyle((element?.props as AnyRecord)?.titleStyle);
  const borderless = Boolean((element?.props as AnyRecord)?.borderless);
  const containerStyle = normalizeContainerStyle((element?.props as AnyRecord)?.containerStyle, borderless);

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
        if (dr && !filters.de && !filters.ate) {
          if (dr.from) filters.de = dr.from;
          if (dr.to) filters.ate = dr.to;
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
  }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters?.dateRange)]);

  const barData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((r) => ({
      label: String((r as AnyRecord)[xKey] ?? ''),
      value: Number((r as AnyRecord)[yKey] ?? 0),
    }));
  }, [xKey, yKey, serverRows]);

  const colors = Array.isArray(colorScheme)
    ? colorScheme
    : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6']);

  const margin = {
    top: Number(nivo?.margin?.top ?? 10),
    right: Number(nivo?.margin?.right ?? 10),
    bottom: Number(nivo?.margin?.bottom ?? 40),
    left: Number(nivo?.margin?.left ?? 48),
  };

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

  const padding = typeof nivo?.padding === 'number' ? nivo.padding : 0.3;
  const groupMode = (nivo?.groupMode === 'stacked' ? 'stacked' : 'grouped') as 'grouped'|'stacked';
  const layout = (typeof (nivo as AnyRecord)?.layout === 'string' ? (nivo as AnyRecord).layout : 'vertical') as 'vertical'|'horizontal';
  const gridX = Boolean(nivo?.gridX ?? false);
  const gridY = Boolean(nivo?.gridY ?? true);
  const enableLabel = Boolean(nivo?.enableLabel ?? false);
  const labelSkipWidth = typeof nivo?.labelSkipWidth === 'number' ? nivo.labelSkipWidth : 12;
  const labelSkipHeight = typeof nivo?.labelSkipHeight === 'number' ? nivo.labelSkipHeight : 12;
  const animate = Boolean(nivo?.animate ?? true);
  const motionConfig = (typeof nivo?.motionConfig === 'string' ? nivo.motionConfig : 'gentle') as any;

  const nivoTheme = buildNivoTheme(nivo?.theme);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-0 shadow-sm" style={containerStyle}>
      {title && <div className="text-sm font-medium text-gray-900 mb-2" style={titleStyle}>{title}</div>}
      <div style={{ height }}>
        <ResponsiveBar
          data={barData}
          keys={["value"]}
          indexBy="label"
          margin={margin}
          padding={padding}
          groupMode={groupMode}
          layout={layout as any}
          colors={colors as any}
          enableGridX={gridX}
          enableGridY={gridY}
          axisBottom={axisBottom as any}
          axisLeft={axisLeft as any}
          labelSkipWidth={labelSkipWidth}
          labelSkipHeight={labelSkipHeight}
          enableLabel={enableLabel}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
          tooltip={({ data }) => (
            <div className="rounded bg-white px-2 py-1 text-xs text-gray-700 border border-gray-200 shadow">
              <div className="font-medium">{(data as any).label}</div>
              <div>{formatValue((data as any).value, fmt)}</div>
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
