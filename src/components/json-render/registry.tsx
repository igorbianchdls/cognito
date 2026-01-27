"use client";

import React from "react";
import JsonRenderBarChart from "@/components/json-render/components/BarChart";
import JsonRenderLineChart from "@/components/json-render/components/LineChart";
import JsonRenderPieChart from "@/components/json-render/components/PieChart";
import { ThemeProvider, useThemeOverrides } from "@/components/json-render/theme/ThemeContext";
import { useDataValue, useData } from "@/components/json-render/context";
import { useStore } from "@nanostores/react";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { $kpiDefaults } from "@/stores/ui/json-render/kpiStore";
import { normalizeTitleStyle } from "@/components/json-render/helpers";
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
    const theme = useThemeOverrides();
    const p = deepMerge(theme.components?.Card || {}, element?.props || {}) as AnyRecord;
    const title = p.title ?? "";
    const titleStyle = {
      ...(p.titleStyle ? {
        fontFamily: p.titleStyle.fontFamily,
        fontWeight: p.titleStyle.fontWeight,
        fontSize: typeof p.titleStyle.fontSize === 'number' ? `${p.titleStyle.fontSize}px` : p.titleStyle.fontSize,
        color: p.titleStyle.color,
        letterSpacing: typeof p.titleStyle.letterSpacing === 'number' ? `${p.titleStyle.letterSpacing}px` : p.titleStyle.letterSpacing,
        textTransform: p.titleStyle.textTransform,
        padding: typeof p.titleStyle.padding === 'number' ? `${p.titleStyle.padding}px` : p.titleStyle.padding,
        margin: typeof p.titleStyle.margin === 'number' ? `${p.titleStyle.margin}px` : p.titleStyle.margin,
        textAlign: p.titleStyle.textAlign,
      } : {})
    } as React.CSSProperties;
    const style: React.CSSProperties = {
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderStyle: p.borderWidth ? 'solid' : undefined,
      borderRadius: p.borderRadius,
      padding: styleVal(p.padding) || undefined,
    };
    return (
      <div className="rounded-lg shadow-sm" style={style}>
        {title && <h3 className="text-base font-semibold text-gray-900 mb-2" style={titleStyle}>{title}</h3>}
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
    const childGrow = Boolean(p.childGrow);
    // Read per-child fr from raw element children definitions
    const childDefs: any[] = Array.isArray((element as any)?.children) ? (element as any).children : [];
    const frArr: number[] = childDefs.map((ch) => {
      const w = Number((ch?.props as any)?.fr);
      return Number.isFinite(w) && w > 0 ? w : (childGrow ? 1 : 0);
    });

    // If neither childGrow nor valid fr weights, render as-is
    const hasWeights = frArr.some((w) => w > 0);
    if (!hasWeights) return <div style={style}>{children}</div>;

    const kids = React.Children.toArray(children);
    const wrapped = kids.map((c, i) => {
      const weight = frArr[i] && frArr[i] > 0 ? frArr[i] : 1;
      return (
        <div key={i} style={{ flexGrow: weight, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
          {c}
        </div>
      );
    });
    return <div style={style}>{wrapped}</div>;
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
    const theme = useThemeOverrides();
    const defs = useStore($kpiDefaults);
    const p = deepMerge(deepMerge(defs as any, (theme.components?.Kpi || {}) as any), (element?.props || {}) as any);
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
    const labelStyle = normalizeTitleStyle(p.labelStyle);
    const valueStyle = normalizeTitleStyle(p.valueStyle);
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-1" style={labelStyle}>{label}</div>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-semibold text-gray-900" style={valueStyle}>{formatValue(value, fmt)}{unit ? ` ${unit}` : ''}</div>
          {deltaVal !== undefined && (
            <div className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{arrow} {formatValue(Math.abs(deltaVal), fmt)}</div>
          )}
        </div>
      </div>
    );
  },

  BarChart: ({ element }) => {
    const theme = useThemeOverrides();
    const defs = useStore($barChartDefaults);
    const merged = deepMerge(deepMerge(defs as any, (theme.components?.BarChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderBarChart element={{ props: merged }} />;
  },
  LineChart: ({ element }) => {
    const theme = useThemeOverrides();
    const defs = useStore($lineChartDefaults);
    const merged = deepMerge(deepMerge(defs as any, (theme.components?.LineChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderLineChart element={{ props: merged }} />;
  },
  PieChart: ({ element }) => {
    const theme = useThemeOverrides();
    const defs = useStore($pieChartDefaults);
    const merged = deepMerge(deepMerge(defs as any, (theme.components?.PieChart || {}) as any), (element?.props || {}) as any);
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

  Theme: ({ element, children }) => {
    const name = element?.props?.name as string | undefined;
    return (
      <ThemeProvider name={name}>
        {children}
      </ThemeProvider>
    );
  },
};
