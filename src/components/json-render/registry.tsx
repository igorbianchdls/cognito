"use client";

import React from "react";
import JsonRenderBarChart from "@/components/json-render/components/BarChart";
import JsonRenderLineChart from "@/components/json-render/components/LineChart";
import JsonRenderPieChart from "@/components/json-render/components/PieChart";
import { ThemeProvider, useThemeOverrides } from "@/components/json-render/theme/ThemeContext";
import { useDataValue, useData } from "@/components/json-render/context";
import { useStore } from "@nanostores/react";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { $kpiDefaults, $KPIDefaults } from "@/stores/ui/json-render/kpiStore";
import { normalizeTitleStyle, normalizeContainerStyle } from "@/components/json-render/helpers";
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

  Header: ({ element, children, onAction }) => {
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
    const dp = p.datePicker || {};
    const showPicker = Boolean(dp.visible);
    const controlsPosition = (p.controlsPosition ?? dp.position ?? 'right') as 'left'|'right'|'below';
    const mode = (dp.mode ?? 'range') as 'range'|'single';
    const storePath = typeof dp.storePath === 'string' ? dp.storePath : undefined;
    const format = (typeof dp.format === 'string' && dp.format) ? dp.format : 'YYYY-MM-DD';
    const dateStyle: React.CSSProperties = {
      padding: styleVal(dp.style?.padding),
      margin: styleVal(dp.style?.margin),
      fontFamily: dp.style?.fontFamily,
      fontSize: typeof dp.style?.fontSize === 'number' ? `${dp.style?.fontSize}px` : dp.style?.fontSize,
      color: dp.style?.color,
    };
    const { data, setData, getValueByPath } = useData();
    function toISO(d: Date) { return d.toISOString().slice(0,10); }
    function fmt(d?: string) { return d || ''; }
    function getDefaultRange() {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toISO(from), to: toISO(to) };
    }
    function setByPath(prev: any, path: string, value: any) {
      if (!path) return prev;
      const parts = path.split('.').map(s => s.trim()).filter(Boolean);
      const root = Array.isArray(prev) ? [...prev] : { ...(prev || {}) };
      let curr: any = root;
      for (let i = 0; i < parts.length; i++) {
        const k = parts[i];
        if (i === parts.length - 1) {
          curr[k] = value;
        } else {
          curr[k] = typeof curr[k] === 'object' && curr[k] !== null ? { ...curr[k] } : {};
          curr = curr[k];
        }
      }
      return root;
    }
    const stored = storePath ? getValueByPath(storePath, undefined) : undefined;
    let picker: React.ReactNode = null;
    if (showPicker) {
      if (mode === 'range') {
        const curr = (stored && typeof stored === 'object')
          ? { from: fmt((stored as any).from), to: fmt((stored as any).to) }
          : getDefaultRange();
        picker = (
          <div className="flex items-center gap-2" style={dateStyle}>
            <input type="date" className="border border-gray-300 rounded px-2 py-1 text-xs"
              value={curr.from}
              onChange={(e) => {
                if (!storePath) return;
                const next = setByPath(data, storePath, { from: e.target.value, to: curr.to });
                setData(next);
                if (dp.actionOnChange && typeof dp.actionOnChange === 'object') onAction?.(dp.actionOnChange);
              }} />
            <span className="text-xs text-gray-500">até</span>
            <input type="date" className="border border-gray-300 rounded px-2 py-1 text-xs"
              value={curr.to}
              onChange={(e) => {
                if (!storePath) return;
                const next = setByPath(data, storePath, { from: curr.from, to: e.target.value });
                setData(next);
                if (dp.actionOnChange && typeof dp.actionOnChange === 'object') onAction?.(dp.actionOnChange);
              }} />
          </div>
        );
      } else {
        const curr = (stored && typeof stored === 'string') ? stored : getDefaultRange().from;
        picker = (
          <div className="flex items-center gap-2" style={dateStyle}>
            <input type="date" className="border border-gray-300 rounded px-2 py-1 text-xs"
              value={curr}
              onChange={(e) => {
                if (!storePath) return;
                const next = setByPath(data, storePath, e.target.value);
                setData(next);
                if (dp.actionOnChange && typeof dp.actionOnChange === 'object') onAction?.(dp.actionOnChange);
              }} />
          </div>
        );
      }
    }

    // Slicers support
    type Opt = { value: string | number; label: string };
    const slicers = Array.isArray((p as AnyRecord).slicers) ? ((p as AnyRecord).slicers as AnyRecord[]) : [];
    const [optionsMap, setOptionsMap] = React.useState<Record<number, Opt[]>>({});
    React.useEffect(() => {
      let cancelled = false;
      async function run() {
        const tasks = await Promise.allSettled((slicers || []).map(async (s, idx) => {
          const src = s?.source;
          if (!src || typeof src !== 'object') return { idx, opts: [] as Opt[] };
          if (src.type === 'static') {
            const opts = Array.isArray(src.options) ? src.options.map((o: any) => ({ value: o.value, label: String(o.label ?? o.value) })) : [];
            return { idx, opts };
          }
          if (src.type === 'api' && typeof src.url === 'string' && src.url) {
            try {
              const method = (src.method || 'GET').toUpperCase();
              const res = await fetch(src.url, { method, headers: { 'content-type': 'application/json' }, ...(method === 'POST' && src.params ? { body: JSON.stringify(src.params) } : {}) });
              const j = await res.json();
              const raw = Array.isArray(j?.options) ? j.options : (Array.isArray(j?.rows) ? j.rows : []);
              const vf = src.valueField || 'value';
              const lf = src.labelField || 'label';
              const opts = raw.map((r: any) => ({ value: (r?.[vf] ?? r?.value), label: String(r?.[lf] ?? r?.label ?? r?.name ?? r?.nome ?? '') }));
              return { idx, opts };
            } catch {
              return { idx, opts: [] as Opt[] };
            }
          }
          return { idx, opts: [] as Opt[] };
        }));
        if (cancelled) return;
        const map: Record<number, Opt[]> = {};
        for (const t of tasks) if (t.status === 'fulfilled') { map[(t.value as any).idx] = (t.value as any).opts }
        setOptionsMap(map);
      }
      run();
      return () => { cancelled = true };
    }, [JSON.stringify(slicers)]);

    const controls = React.useMemo(() => {
      const elems: React.ReactNode[] = [];
      if (picker) elems.push(picker);
      slicers.forEach((s, idx) => {
        const sp = String(s?.storePath || '').trim();
        if (!sp) return;
        const lbl = typeof s?.label === 'string' ? s.label : undefined;
        const type = (s?.type || 'dropdown') as 'dropdown'|'multi'|'list';
        const placeholder = typeof s?.placeholder === 'string' ? s.placeholder : undefined;
        const width = s?.width;
        const opts = optionsMap[idx] || [];
        const storedVal = getValueByPath(sp, undefined);
        const onChangeValue = (val: any) => {
          const next = setByPath(data, sp, val);
          setData(next);
          if (s?.actionOnChange && typeof s.actionOnChange === 'object') onAction?.(s.actionOnChange);
        };
        if (type === 'list') {
          const arr = Array.isArray(storedVal) ? storedVal : [];
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2" style={{ width: styleVal(width) }}>
              {lbl && <span className="text-xs text-gray-600">{lbl}:</span>}
              <div className="flex items-center gap-2">
                {opts.map((o) => (
                  <label key={String(o.value)} className="inline-flex items-center gap-1 text-xs text-gray-700">
                    <input type="checkbox" className="rounded border-gray-300" checked={arr.includes(o.value)} onChange={(e) => {
                      const nextArr = e.target.checked ? [...arr, o.value] : arr.filter((v: any) => v !== o.value);
                      onChangeValue(nextArr);
                    }} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        } else {
          const isMulti = type === 'multi';
          const val = isMulti ? (Array.isArray(storedVal) ? storedVal : []) : (storedVal ?? '');
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2" style={{ width: styleVal(width) }}>
              {lbl && <span className="text-xs text-gray-600">{lbl}:</span>}
              <select
                multiple={isMulti}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
                value={val as any}
                onChange={(e) => {
                  if (isMulti) {
                    const selected: any[] = Array.from(e.target.selectedOptions).map((o) => (o as any).value).map((x) => (String(Number(x)) === x ? Number(x) : x));
                    onChangeValue(selected);
                  } else {
                    const v = e.target.value;
                    onChangeValue(String(Number(v)) === v ? Number(v) : v);
                  }
                }}
              >
                {!isMulti && placeholder && <option value="">{placeholder}</option>}
                {opts.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                ))}
              </select>
            </div>
          );
        }
      });
      if (elems.length === 0) return null;
      return <div className="flex items-center gap-2">{elems}</div>;
    }, [picker, JSON.stringify(slicers), JSON.stringify(optionsMap), data]);

    return (
      <div className="rounded-md" style={containerStyle}>
        {controlsPosition === 'below' ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold" style={{ color: p.textColor }}>{p.title}</div>
                {p.subtitle && <div className="text-sm" style={{ color: p.subtitleColor }}>{p.subtitle}</div>}
              </div>
            </div>
            {controls && <div className="mt-2">{controls}</div>}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {controlsPosition === 'left' && controls}
              <div>
                <div className="text-lg font-semibold" style={{ color: p.textColor }}>{p.title}</div>
                {p.subtitle && <div className="text-sm" style={{ color: p.subtitleColor }}>{p.subtitle}</div>}
              </div>
            </div>
            {controlsPosition === 'right' && controls}
          </div>
        )}
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
    const valueKey = (p.valueKey ?? 'total') as string;
    const dq = p.dataQuery as AnyRecord | undefined;
    const { data } = useData();
    const [serverValue, setServerValue] = React.useState<number | null>(null);
    React.useEffect(() => {
      let cancelled = false;
      async function run() {
        if (!dq || !dq.model || !dq.measure) { setServerValue(null); return; }
        try {
          const mod = String(dq.model).split('.')[0];
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
          let rows: any[] = [];

          // Decide endpoint: analytics if no dimension and mappable source; else module query
          const hasDimension = Boolean(dq.dimension);
          if (!hasDimension) {
            const modelStr = String(dq.model || '');
            const inferSource = (): string | null => {
              if (modelStr.startsWith('vendas.')) return 'vd';
              if (modelStr.startsWith('financeiro.')) return modelStr.includes('contas_receber') ? 'ar' : 'ap';
              if (modelStr.startsWith('compras.')) return null; // fallback to module query
              return null;
            };
            const source = (dq as any).source || inferSource();
            if (source) {
              const payload: AnyRecord = { source, measure: dq.measure };
              if (typeof filters.de === 'string') payload.from = filters.de;
              if (typeof filters.ate === 'string') payload.to = filters.ate;
              if (typeof filters.tenant_id === 'number') payload.tenant_id = filters.tenant_id;
              const whereRules: AnyRecord[] = [];
              for (const [k, v] of Object.entries(filters)) {
                if (k === 'de' || k === 'ate' || k === 'tenant_id') continue;
                if (Array.isArray(v)) whereRules.push({ col: k, op: 'in', vals: v });
                else whereRules.push({ col: k, op: '=', val: v });
              }
              if (whereRules.length) payload.where = whereRules;
              const res = await fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
              const j = await res.json();
              rows = Array.isArray(j?.rows) ? j.rows : [];
            } else {
              const url = `/api/modulos/${mod}/query`;
              const body = { dataQuery: { model: dq.model, dimension: undefined, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
              const j = await res.json();
              rows = Array.isArray(j?.rows) ? j.rows : [];
            }
          } else {
            const url = `/api/modulos/${mod}/query`;
          const body = { dataQuery: { model: dq.model, dimension: dq.dimension, dimensionExpr: dq.dimensionExpr, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
            const j = await res.json();
            rows = Array.isArray(j?.rows) ? j.rows : [];
          }
          let val: number = 0;
          if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
            const r0 = rows[0] as AnyRecord;
            const keys = [valueKey, 'total', 'valor_total', 'faturamento_total', 'gasto_total', 'count', 'value'];
            for (const k of keys) { if (r0[k] != null) { const n = Number(r0[k]); if (Number.isFinite(n)) { val = n; break; } } }
          }
          if (!cancelled) setServerValue(val);
        } catch (e) { if (!cancelled) setServerValue(0); }
      }
      run();
      return () => { cancelled = true };
    }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters)]);
    const unit = p.unit as string | undefined;
    const fmt = (p.format ?? 'number') as 'currency'|'percent'|'number';
    const deltaPath = p.deltaPath as string | undefined;
    const trendProp = p.trend as ('up'|'down'|'flat'|'auto') | undefined;
    const valueFromPath = useDataValue(valuePath, undefined);
    const value = serverValue !== null ? serverValue : valueFromPath;
    const deltaVal = deltaPath ? useDataValue(deltaPath, undefined) : undefined;
    const trend: 'up'|'down'|'flat' | undefined = (trendProp === 'auto' || trendProp === undefined)
      ? (typeof deltaVal === 'number' ? (deltaVal > 0 ? 'up' : deltaVal < 0 ? 'down' : 'flat') : undefined)
      : (trendProp as any);
    const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■';
    const labelStyle = normalizeTitleStyle(p.labelStyle);
    const valueStyle = normalizeTitleStyle(p.valueStyle);
    const containerStyle = normalizeContainerStyle(p.containerStyle, Boolean(p.borderless));
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" style={containerStyle}>
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
  KPI: ({ element }) => {
    const defs = useStore($KPIDefaults);
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defs as any, (theme.components?.Kpi || {}) as any), (element?.props || {}) as any) as AnyRecord;
    const title = p.title as string;
    const dq = p.dataQuery as AnyRecord;
    const valueKey = (p.valueKey ?? 'total') as string;
    const { data } = useData();
    const [serverValue, setServerValue] = React.useState<number>(0);
    React.useEffect(() => {
      let cancelled = false;
      async function run() {
        try {
          if (!dq || !dq.model || !dq.measure) { if (!cancelled) setServerValue(0); return; }
          const mod = String(dq.model).split('.')[0];
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
          let rows: any[] = [];
          // Prefer analytics for vendas/financeiro when possible
          const modelStr = String(dq.model || '');
          const inferSource = (): string | null => {
            if (modelStr.startsWith('vendas.')) return 'vd';
            if (modelStr.startsWith('financeiro.')) return modelStr.includes('contas_receber') ? 'ar' : 'ap';
            return null; // compras -> fallback module query
          };
          const source = (dq as any).source || inferSource();
          if (source) {
            const payload: AnyRecord = { source, measure: dq.measure };
            if (typeof filters.de === 'string') payload.from = filters.de;
            if (typeof filters.ate === 'string') payload.to = filters.ate;
            if (typeof filters.tenant_id === 'number') payload.tenant_id = filters.tenant_id;
            const whereRules: AnyRecord[] = [];
            for (const [k, v] of Object.entries(filters)) {
              if (k === 'de' || k === 'ate' || k === 'tenant_id') continue;
              if (Array.isArray(v)) whereRules.push({ col: k, op: 'in', vals: v });
              else whereRules.push({ col: k, op: '=', val: v });
            }
            if (whereRules.length) (payload as any).where = whereRules;
            const res = await fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
            const j = await res.json();
            rows = Array.isArray(j?.rows) ? j.rows : [];
          } else {
            const url = `/api/modulos/${mod}/query`;
            const body = { dataQuery: { model: dq.model, dimension: undefined, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
            const j = await res.json();
            rows = Array.isArray(j?.rows) ? j.rows : [];
          }
          let val: number = 0;
          if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
            const r0 = rows[0] as AnyRecord;
            const keys = [valueKey, 'total', 'valor_total', 'faturamento_total', 'gasto_total', 'count', 'value'];
            for (const k of keys) { if (r0[k] != null) { const n = Number(r0[k]); if (Number.isFinite(n)) { val = n; break; } } }
          }
          if (!cancelled) setServerValue(val);
        } catch (e) {
          if (!cancelled) setServerValue(0);
        }
      }
      run();
      return () => { cancelled = true };
    }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters)]);
    const fmt = (p.format ?? 'number') as 'currency'|'percent'|'number';
    const unit = p.unit as string | undefined;
    const titleStyle = normalizeTitleStyle(p.titleStyle);
    const valueStyle = normalizeTitleStyle(p.valueStyle);
    const containerStyle = normalizeContainerStyle(p.containerStyle, Boolean(p.borderless));
    function formatValue(val: any, fmt: 'currency'|'percent'|'number'): string {
      const n = Number(val ?? 0);
      if (!Number.isFinite(n)) return String(val ?? '');
      switch (fmt) {
        case 'currency': return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);
        case 'percent': return `${(n * 100).toFixed(2)}%`;
        default: return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
      }
    }
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" style={containerStyle}>
        <div className="mb-1" style={titleStyle}>{title}</div>
        <div className="text-2xl font-semibold text-gray-900" style={valueStyle}>{formatValue(serverValue, fmt)}{unit ? ` ${unit}` : ''}</div>
      </div>
    );
  },
};
