"use client";

import React from "react";
import { useData } from "@/components/json-render/context";
import { ResponsivePie } from "@nivo/pie";
import { aggregateByDimension, getByPath, parseMeasureSpec } from "@/components/json-render/helpers";

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
  const title = element?.props?.title as string | undefined;
  const dataPath = element?.props?.dataPath as string;
  const xKey = element?.props?.xKey as string;
  const yKey = element?.props?.yKey as string;
  const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
  const height = (element?.props?.height as number | undefined) ?? 220;
  const colorScheme = element?.props?.colorScheme as string | string[] | undefined;
  const nivo = (element?.props?.nivo as AnyRecord | undefined) || {};

  const rows: Array<Record<string, unknown>> = React.useMemo(() => {
    if (!dataPath) return [];
    try {
      const parts = dataPath.split('.').map((s: string) => s.trim()).filter(Boolean);
      let curr: any = data;
      for (const p of parts) { curr = curr?.[p]; }
      return Array.isArray(curr) ? curr as Array<Record<string, unknown>> : [];
    } catch { return []; }
  }, [data, dataPath]);

  const pieData = React.useMemo(() => {
    const spec = parseMeasureSpec(yKey);
    if (spec) {
      const agg = aggregateByDimension(rows as AnyRecord[], xKey, yKey);
      return agg.map(d => ({ id: d.label, label: d.label, value: d.value }));
    }
    return (rows as AnyRecord[]).map((r) => ({
      id: String(getByPath(r, xKey, '')),
      label: String(getByPath(r, xKey, '')),
      value: Number(getByPath(r, yKey, 0) ?? 0),
    }));
  }, [rows, xKey, yKey]);

  const colors = Array.isArray(colorScheme)
    ? colorScheme
    : (typeof colorScheme === 'string' ? [colorScheme] : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-0 shadow-sm">
      {title && <div className="text-sm font-medium text-gray-900 mb-2">{title}</div>}
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
        />
      </div>
    </div>
  );
}
