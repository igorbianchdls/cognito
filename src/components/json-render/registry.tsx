"use client";

import React from "react";
import JsonRenderBarChart from "@/components/json-render/components/BarChart";
import { useDataValue, useData } from "@/components/json-render/context";

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
    const label = element?.props?.label ?? '';
    const valuePath = element?.props?.valuePath ?? '';
    const unit = element?.props?.unit as string | undefined;
    const fmt = (element?.props?.format ?? 'number') as 'currency'|'percent'|'number';
    const deltaPath = element?.props?.deltaPath as string | undefined;
    const trendProp = element?.props?.trend as ('up'|'down'|'flat') | undefined;
    const value = useDataValue(valuePath, undefined);
    const deltaVal = deltaPath ? useDataValue(deltaPath, undefined) : undefined;
    const trend: 'up'|'down'|'flat' | undefined = trendProp ?? (typeof deltaVal === 'number' ? (deltaVal > 0 ? 'up' : deltaVal < 0 ? 'down' : 'flat') : undefined);
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

  BarChart: ({ element }) => <JsonRenderBarChart element={element} />,

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
