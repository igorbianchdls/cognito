"use client";

import React from "react";
import { useDataValue } from "@/components/json-render/context";
import { useThemeOverrides } from "@/components/json-render/theme/ThemeContext";

type AnyRecord = Record<string, any>;

export default function JsonRenderGauge({ element }: { element?: { props?: AnyRecord } }) {
  const p = (element?.props || {}) as AnyRecord;
  const size = Math.max(48, Number(p.size ?? 160));
  const thickness = Math.max(4, Number(p.thickness ?? 14));
  const min = Number(p.min ?? 0);
  const max = Number(p.max ?? (p.format === 'percent' ? 1 : 100));
  const theme = useThemeOverrides();
  // Theme-aware defaults
  const scheme = (() => {
    try { const raw = (theme.cssVars || {} as any).chartColorScheme; if (raw) return JSON.parse(String(raw)); } catch {}
    return undefined as string[] | undefined;
  })();
  const defaultIndicator = p.indicatorColor || (scheme && scheme[0]) || '#3b82f6';
  const surfaceBorder = (theme.cssVars as any)?.surfaceBorder || (theme.cssVars as any)?.containerBorderColor || '#e5e7eb';
  const trackColor = String(p.trackColor ?? surfaceBorder);
  const indicatorColor = String(defaultIndicator);
  const showValue = p.showValue !== false;
  const roundedCaps = p.roundedCaps !== false;
  const format = (p.format ?? 'number') as 'currency'|'percent'|'number';
  const title = (p.title ?? '') as string;
  const label = (p.label ?? '') as string;
  const valuePath = (p.valuePath as string | undefined) || undefined;

  // Read value from context if valuePath provided; otherwise use props.value
  const valueFromPath = valuePath ? useDataValue(valuePath, undefined) : undefined;
  const rawVal = (valueFromPath !== undefined ? Number(valueFromPath) : Number(p.value ?? 0));
  const val = Number.isFinite(rawVal) ? rawVal : 0;

  const clamped = Math.max(min, Math.min(max, val));
  const ratio = max > min ? (clamped - min) / (max - min) : 0;

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = `${Math.max(0.0001, ratio) * c} ${c}`;

  function formatValue(v: number, fmt: 'currency'|'percent'|'number'): string {
    switch (fmt) {
      case 'currency': return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);
      case 'percent': return `${(v * 100).toFixed(2)}%`;
      default: return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v);
    }
  }

  const center = size / 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }} aria-label={`Gauge: ${title || label || ''}, ${formatValue(val, format)} de ${max}`} role="img">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
             style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={r}
            stroke={trackColor}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap={roundedCaps ? 'round' : 'butt'}
            style={{ opacity: 0.5 }}
          />
          <circle
            cx={center}
            cy={center}
            r={r}
            stroke={indicatorColor}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap={roundedCaps ? 'round' : 'butt'}
            strokeDasharray={dash}
            strokeDashoffset={0}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {title && (
            <div className="text-xs" style={{ marginBottom: 2, color: (theme.cssVars as any)?.kpiTitleColor || '#64748b' }}>{title}</div>
          )}
          {showValue && (
            <div className="text-xl font-semibold" style={{ color: (theme.cssVars as any)?.kpiValueColor || '#0f172a' }}>{formatValue(val, format)}</div>
          )}
          {label && (
            <div className="text-xs" style={{ marginTop: 2, color: (theme.cssVars as any)?.kpiTitleColor || '#64748b' }}>{label}</div>
          )}
        </div>
      </div>
    </div>
  );
}
