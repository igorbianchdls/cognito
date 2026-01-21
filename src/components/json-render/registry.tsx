"use client";

import React from "react";
import JsonRenderBarChart from "@/components/json-render/components/BarChart";
import JsonRenderLineChart from "@/components/json-render/components/LineChart";
import JsonRenderPieChart from "@/components/json-render/components/PieChart";
import { useDataValue, useData } from "@/components/json-render/context";
import { useStore } from "@nanostores/react";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { $kpiDefaults } from "@/stores/ui/json-render/kpiStore";
import { $barChartDefaults } from "@/stores/ui/json-render/barChartStore";
import { $lineChartDefaults } from "@/stores/ui/json-render/lineChartStore";
import { $pieChartDefaults } from "@/stores/ui/json-render/pieChartStore";
import { $headerDefaults } from "@/stores/ui/json-render/headerStore";
import { $divDefaults } from "@/stores/ui/json-render/divStore";

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

function styleVal(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return typeof v === 'number' ? `${v}px` : String(v);
}

function mapJustify(v?: string): React.CSSProperties['justifyContent'] | undefined {
  switch (v) {
    case 'start': return 'flex-start';
    case 'center': return 'center';
    case 'end': return 'flex-end';
    case 'between': return 'space-between';
    case 'around': return 'space-around';
    case 'evenly': return 'space-evenly';
    default: return undefined;
  }
}

function mapAlign(v?: string): React.CSSProperties['alignItems'] | undefined {
  switch (v) {
    case 'start': return 'flex-start';
    case 'center': return 'center';
    case 'end': return 'flex-end';
    case 'stretch': return 'stretch';
    default: return undefined;
  }
}

export const registry: Record<string, React.FC<{ element: any; children?: React.ReactNode; data?: AnyRecord; onAction?: (action: any) => void }>> = {
  Card: ({ element, children }) => {
    const title = element?.props?.title ?? "";
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="space-y-2">{children}</div>
      </div>
    );
  },

  Header: ({ element, children }) => {
    const defs = useStore($headerDefaults);
    const p = deepMerge(defs as any, (element?.props || {}) as any) as AnyRecord;
    const align = (p.align ?? 'left') as 'left'|'center'|'right';
    const hasBorder = [p.borderWidth, p.borderTopWidth, p.borderRightWidth, p.borderBottomWidth, p.borderLeftWidth]
      .some((w: any) => typeof w === 'number' && w > 0);
    const containerStyle: React.CSSProperties = {
      backgroundColor: p.backgroundColor,
      color: p.textColor,
      padding: styleVal(p.padding),
      margin: styleVal(p.margin),
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderTopWidth: p.borderTopWidth,
      borderRightWidth: p.borderRightWidth,
      borderBottomWidth: p.borderBottomWidth,
      borderLeftWidth: p.borderLeftWidth,
      borderStyle: hasBorder ? 'solid' : undefined,
      borderRadius: p.borderRadius,
      width: styleVal(p.width),
      height: styleVal(p.height),
      textAlign: align,
    };
    return (
      <div className="rounded-md" style={containerStyle}>
        <div>
          <div className="text-lg font-semibold" style={{ color: p.textColor }}>{p.title}</div>
          {p.subtitle && <div className="text-sm" style={{ color: p.subtitleColor }}>{p.subtitle}</div>}
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    );
  },

  Div: ({ element, children }) => {
    const defs = useStore($divDefaults);
    const p = deepMerge(defs as any, (element?.props || {}) as any) as AnyRecord;
    const style: React.CSSProperties = {
      display: 'flex',
      flexDirection: (p.direction ?? 'column') as any,
      gap: styleVal(p.gap),
      flexWrap: p.wrap ? 'wrap' : 'nowrap',
      justifyContent: mapJustify(p.justify),
      alignItems: mapAlign(p.align),
      padding: styleVal(p.padding),
      margin: styleVal(p.margin),
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderStyle: p.borderWidth ? 'solid' : undefined,
      borderRadius: p.borderRadius,
      width: styleVal(p.width),
      height: styleVal(p.height),
    };
    return (
      <div style={style}>{children}</div>
    );
  },

  Metric: ({ element, data }) => {
    const label = element?.props?.label ?? "";
    const valuePath = element?.props?.valuePath ?? "";
    const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
    // Prefer DataProvider; fallback to data prop
    const fallback = React.useMemo(() => {
      if (!data || !valuePath) return undefined;
      return valuePath
        .split('.')
        .reduce((acc: any, k: string) => (acc ? (acc as any)[k] : undefined), data as any);
    }, [data, valuePath]);
    const value = useDataValue(valuePath, fallback);
    return (
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-lg font-semibold text-gray-900">{formatValue(value, fmt)}</span>
      </div>
    );
  },

  Kpi: ({ element }) => {
    const defs = useStore($kpiDefaults);
    const p = deepMerge(defs as any, (element?.props || {}) as any);
    const label = p.label ?? '';
    const valuePath = p.valuePath ?? '';
    const unit = p.unit as string | undefined;
    const fmt = (p.format ?? 'number') as 'currency'|'percent'|'number';
    const deltaPath = p.deltaPath as string | undefined;
    const trendProp = p.trend as ('up'|'down'|'flat'|'auto') | undefined;
    const value = useDataValue(valuePath, undefined);
    const deltaVal = deltaPath ? useDataValue(deltaPath, undefined) : undefined;
    const trend: 'up'|'down'|'flat' | undefined = (trendProp === 'auto' || trendProp === undefined)
      ? (typeof deltaVal === 'number' ? (deltaVal > 0 ? 'up' : deltaVal < 0 ? 'down' : 'flat') : undefined)
      : (trendProp as any);
    const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■';
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-semibold text-gray-900">{formatValue(value, fmt)}{unit ? ` ${unit}` : ''}</div>
          {deltaVal !== undefined && (
            <div className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{arrow} {formatValue(Math.abs(deltaVal), fmt)}</div>
          )}
        </div>
      </div>
    );
  },

  BarChart: ({ element }) => {
    const defs = useStore($barChartDefaults);
    const merged = deepMerge(defs as any, (element?.props || {}) as any);
    return <JsonRenderBarChart element={{ props: merged }} />;
  },
  LineChart: ({ element }) => {
    const defs = useStore($lineChartDefaults);
    const merged = deepMerge(defs as any, (element?.props || {}) as any);
    return <JsonRenderLineChart element={{ props: merged }} />;
  },
  PieChart: ({ element }) => {
    const defs = useStore($pieChartDefaults);
    const merged = deepMerge(defs as any, (element?.props || {}) as any);
    return <JsonRenderPieChart element={{ props: merged }} />;
  },

  Button: ({ element, onAction }) => {
    const label = element?.props?.label ?? "Button";
    const action = element?.props?.action ?? null;
    return (
      <button
        type="button"
        onClick={() => onAction && action ? onAction(action) : undefined}
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
      >
        {label}
      </button>
    );
  },
};
