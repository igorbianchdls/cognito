"use client";

import React from "react";
import JsonRenderBarChart from "@/components/json-render/components/BarChart";
import JsonRenderLineChart from "@/components/json-render/components/LineChart";
import JsonRenderPieChart from "@/components/json-render/components/PieChart";
import { ThemeProvider, useThemeOverrides } from "@/components/json-render/theme/ThemeContext";
import { mapManagersToCssVars } from "@/components/json-render/theme/thememanagers";
import { buildThemeVars } from "@/components/json-render/theme/themeAdapter";
import { useDataValue, useData } from "@/components/json-render/context";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { normalizeTitleStyle, normalizeContainerStyle, applyBorderFromCssVars, ensureSurfaceBackground, applyShadowFromCssVars, applyH1FromCssVars, applyKpiTitleFromCssVars, applyKpiValueFromCssVars, applySlicerLabelFromCssVars, applySlicerOptionFromCssVars } from "@/components/json-render/helpers";

type AnyRecord = Record<string, any>;

// Defaults (local) — substituem stores globais
const defaultHeader = {
  align: 'left',
  backgroundColor: 'transparent',
  textColor: '#111827',
  subtitleColor: '#6b7280',
  padding: 12,
  borderColor: '#e5e7eb',
  borderWidth: 0,
  borderBottomWidth: 1,
  borderRadius: 0,
} as const;

const defaultDiv = {
  direction: 'column',
  gap: 8,
  wrap: false,
  justify: 'start',
  align: 'stretch',
  padding: 0,
  backgroundColor: 'transparent',
  borderWidth: 0,
  borderRadius: 0,
} as const;

// (removed old Kpi defaults)

const defaultKPI = {
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { fontWeight: 600, fontSize: 12, color: '#64748b', textTransform: 'none', textAlign: 'left' },
  valueStyle: { fontWeight: 700, fontSize: 24, color: '#0f172a', textTransform: 'none', textAlign: 'left' },
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8, padding: 12 },
  borderless: false,
} as const;

const defaultBarChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 8, textAlign: 'left' },
  colorScheme: ['#3b82f6'],
  nivo: { layout: 'vertical', padding: 0.3, groupMode: 'grouped', gridY: true, axisBottom: { tickRotation: 0, legendOffset: 32 }, axisLeft: { legendOffset: 40 }, margin: { top: 10, right: 10, bottom: 40, left: 48 }, animate: true, motionConfig: 'gentle' },
} as const;

const defaultLineChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6'],
  nivo: { gridY: true, curve: 'linear', pointSize: 6, margin: { top: 10, right: 10, bottom: 40, left: 48 }, animate: true, motionConfig: 'gentle' },
} as const;

const defaultPieChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  nivo: { innerRadius: 0, padAngle: 0.7, cornerRadius: 3, activeOuterRadiusOffset: 8, enableArcLabels: true, arcLabelsSkipAngle: 10, arcLabelsTextColor: '#333333', margin: { top: 10, right: 10, bottom: 10, left: 10 }, animate: true, motionConfig: 'gentle' },
} as const;

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
    const titleStyle = applyH1FromCssVars(normalizeTitleStyle(p.titleStyle), theme.cssVars) as React.CSSProperties | undefined;
    const styleBase: React.CSSProperties = {
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderStyle: p.borderWidth ? 'solid' : undefined,
      borderRadius: p.borderRadius,
      padding: styleVal(p.padding) || undefined,
    };
    const style = ensureSurfaceBackground(
      applyShadowFromCssVars(
        applyBorderFromCssVars(styleBase as any, theme.cssVars),
        theme.cssVars
      ),
      theme.cssVars
    ) as React.CSSProperties;
    return (
      <div style={style}>
        {title && <h3 className="text-base font-semibold text-gray-900 mb-0" style={titleStyle}>{title}</h3>}
        <div className="space-y-2">{children}</div>
      </div>
    );
  },

  Header: ({ element, children, onAction }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultHeader as any, (theme.components?.Header || {}) as any), (element?.props || {}) as any) as AnyRecord;
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
    const wrappedStyle = ensureSurfaceBackground(
      applyShadowFromCssVars(
        applyBorderFromCssVars(containerStyle as any, theme.cssVars),
        theme.cssVars
      ),
      theme.cssVars
    ) as React.CSSProperties;
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
        // Numeric range slicer
        if ((s as any)?.type === 'range') {
          const r = s as AnyRecord;
          const minPath = String(r.storeMinPath || '').trim();
          const maxPath = String(r.storeMaxPath || '').trim();
          if (!minPath || !maxPath) return;
          const lbl = typeof r.label === 'string' ? r.label : undefined;
          const lblStyle = applySlicerLabelFromCssVars(normalizeTitleStyle((r as any)?.labelStyle), theme.cssVars);
          const step = typeof r.step === 'number' ? r.step : 1;
          const prefix = typeof r.prefix === 'string' ? r.prefix : undefined;
          const suffix = typeof r.suffix === 'string' ? r.suffix : undefined;
          const phMin = typeof r.placeholderMin === 'string' ? r.placeholderMin : '';
          const phMax = typeof r.placeholderMax === 'string' ? r.placeholderMax : '';
          const width = r?.width;
          const curMin = getValueByPath(minPath, undefined);
          const curMax = getValueByPath(maxPath, undefined);
          const parseNum = (v: string): number | undefined => {
            if (v.trim() === '') return undefined;
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
          };
          const onChangeMin = (val: string) => {
            const nextVal = parseNum(val);
            const next = setByPath(data, minPath, nextVal);
            setData(next);
            if (r?.actionOnChange && typeof r.actionOnChange === 'object') onAction?.(r.actionOnChange);
          };
          const onChangeMax = (val: string) => {
            const nextVal = parseNum(val);
            const next = setByPath(data, maxPath, nextVal);
            setData(next);
            if (r?.actionOnChange && typeof r.actionOnChange === 'object') onAction?.(r.actionOnChange);
          };
          const onClear = () => {
            let next = setByPath(data, minPath, undefined);
            next = setByPath(next, maxPath, undefined);
            setData(next);
            if (r?.actionOnChange && typeof r.actionOnChange === 'object') onAction?.(r.actionOnChange);
          };
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2 p-2" style={{ width: styleVal(width) }}>
              {lbl && <span className="text-xs" style={lblStyle}>{lbl}:</span>}
              {prefix && <span className="text-xs text-gray-500">{prefix}</span>}
              <input type="number" step={step} placeholder={phMin} className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                value={curMin ?? ''}
                onChange={(e) => onChangeMin(e.target.value)} />
              <span className="text-xs text-gray-500">até</span>
              <input type="number" step={step} placeholder={phMax} className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                value={curMax ?? ''}
                onChange={(e) => onChangeMax(e.target.value)} />
              {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
              {(r.clearable !== false) && (
                <button type="button" onClick={onClear} className="text-[11px] text-blue-600 hover:underline">Limpar</button>
              )}
            </div>
          );
          return;
        }
        const sp = String((s as any)?.storePath || '').trim();
        if (!sp) return;
        const lbl = typeof s?.label === 'string' ? s.label : undefined;
        const lblStyle = applySlicerLabelFromCssVars(normalizeTitleStyle((s as any)?.labelStyle), theme.cssVars);
        const type = (s?.type || 'dropdown') as 'dropdown'|'multi'|'list'|'tile'|'tile-multi';
        const placeholder = typeof s?.placeholder === 'string' ? s.placeholder : undefined;
        const width = s?.width;
        const opts = optionsMap[idx] || [];
        const storedVal = getValueByPath(sp, undefined);
        const onChangeValue = (val: any) => {
          const next = setByPath(data, sp, val);
          setData(next);
          if (s?.actionOnChange && typeof s.actionOnChange === 'object') onAction?.(s.actionOnChange);
        };
        // Tile (single) and Tile (multi)
        if (type === 'tile' || type === 'tile-multi') {
          const isMulti = type === 'tile-multi';
          const clearable = ((s as any)?.clearable !== false);
          const current = isMulti ? (Array.isArray(storedVal) ? storedVal : []) : (storedVal ?? undefined);
          const onClear = () => {
            if (isMulti) onChangeValue([]); else onChangeValue(undefined);
          };
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2 flex-wrap p-2" style={{ width: styleVal(width) }}>
              {lbl && !p.title && <span className="text-xs mr-1" style={lblStyle}>{lbl}:</span>}
              <div className="flex items-center gap-2 flex-wrap">
                {opts.map((o) => {
                  const selected = isMulti ? (current as any[]).includes(o.value) : current === o.value;
                  const tileCfg = (((theme as any).components?.Slicer as any)?.tile) || {};
                      const base = String(tileCfg.baseClass || 'text-xs font-medium rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]');
                  const selectedClass = String(tileCfg.selectedClass || 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700');
                  const unselectedClass = String(tileCfg.unselectedClass || 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200');
                  const cls = selected ? selectedClass : unselectedClass;
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      className={`${base} ${cls}`}
                      onClick={() => {
                        if (isMulti) {
                          const arr = Array.isArray(current) ? current.slice() : [];
                          const exists = arr.includes(o.value);
                          const nextArr = exists ? arr.filter((v: any) => v !== o.value) : [...arr, o.value];
                          onChangeValue(nextArr);
                        } else {
                          const nextVal = (current === o.value) ? (clearable ? undefined : o.value) : o.value;
                          onChangeValue(nextVal);
                        }
                      }}
                    >
                      <span style={(() => { const sopt = applySlicerOptionFromCssVars(undefined, theme.cssVars) || {}; delete (sopt as any).color; return sopt as any; })()}>{o.label}</span>
                    </button>
                  );
                })}
              </div>
              {clearable && (
                <button type="button" onClick={onClear} className="text-[11px] text-blue-600 hover:underline">Limpar</button>
              )}
            </div>
          );
          return;
        }
        if (type === 'list') {
          const arr = Array.isArray(storedVal) ? storedVal : [];
          const onClear = () => {
            onChangeValue([]);
          };
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2 p-2" style={{ width: styleVal(width) }}>
              {lbl && !p.title && <span className="text-xs" style={lblStyle}>{lbl}:</span>}
              <div className="flex items-center gap-2">
                {opts.map((o) => (
                  <label key={String(o.value)} className="inline-flex items-center gap-1 text-xs">
                    <input type="checkbox" className="rounded border-gray-300" checked={arr.includes(o.value)} onChange={(e) => {
                      const nextArr = e.target.checked ? [...arr, o.value] : arr.filter((v: any) => v !== o.value);
                      onChangeValue(nextArr);
                    }} />
                    <span style={applySlicerOptionFromCssVars(normalizeTitleStyle((s as any)?.optionStyle), theme.cssVars)}>{o.label}</span>
                  </label>
                ))}
              </div>
              {((s as any).clearable !== false) && (
                <button type="button" onClick={onClear} className="text-[11px] text-blue-600 hover:underline">Limpar</button>
              )}
            </div>
          );
        } else {
          const isMulti = type === 'multi';
          const val = isMulti ? (Array.isArray(storedVal) ? storedVal : []) : (storedVal ?? '');
          const onClear = () => {
            if (isMulti) onChangeValue([]); else onChangeValue(undefined);
          };
          elems.push(
            <div key={`slicer-${idx}`} className="flex items-center gap-2 p-2" style={{ width: styleVal(width) }}>
              {lbl && !p.title && <span className="text-xs" style={lblStyle}>{lbl}:</span>}
              <select
                multiple={isMulti}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
                style={applySlicerOptionFromCssVars(normalizeTitleStyle((s as any)?.optionStyle), theme.cssVars) as any}
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
              {((s as any).clearable !== false) && (
                <button type="button" onClick={onClear} className="text-[11px] text-blue-600 hover:underline">Limpar</button>
              )}
            </div>
          );
        }
      });
      if (elems.length === 0) return null;
      return <div className="flex items-center gap-2 p-2">{elems}</div>;
    }, [picker, JSON.stringify(slicers), JSON.stringify(optionsMap), data]);

    return (
      <div className="rounded-md" style={wrappedStyle}>
        {controlsPosition === 'below' ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold" style={applyH1FromCssVars({ color: p.textColor }, theme.cssVars)}>{p.title}</div>
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
                <div className="text-lg font-semibold" style={applyH1FromCssVars({ color: p.textColor }, theme.cssVars)}>{p.title}</div>
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
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultDiv as any, (theme.components?.Div || {}) as any), (element?.props || {}) as any) as AnyRecord;
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


  BarChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultBarChart as any, (theme.components?.BarChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderBarChart element={{ props: merged }} />;
  },
  LineChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultLineChart as any, (theme.components?.LineChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderLineChart element={{ props: merged }} />;
  },
  PieChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultPieChart as any, (theme.components?.PieChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderPieChart element={{ props: merged }} />;
  },

  SlicerCard: ({ element, onAction }) => {
    const theme = useThemeOverrides();
    const p = deepMerge((theme.components?.SlicerCard || {}) as AnyRecord, (element?.props || {}) as AnyRecord) as AnyRecord;
    const title = p.title as string | undefined;
    const borderless = Boolean(p.borderless);
    const containerStyle = ensureSurfaceBackground(applyShadowFromCssVars(applyBorderFromCssVars(normalizeContainerStyle(p.containerStyle, borderless), theme.cssVars), theme.cssVars), theme.cssVars);
    const layout = (p.layout || 'vertical') as 'vertical'|'horizontal';
    const applyMode = (p.applyMode || 'auto') as 'auto'|'manual';
    const fields = Array.isArray(p.fields) ? (p.fields as AnyRecord[]) : [];
    const { data, setData, getValueByPath } = useData();

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

    type Opt = { value: string|number; label: string };
    const [optionsMap, setOptionsMap] = React.useState<Record<number, Opt[]>>({});
    const [searchMap, setSearchMap] = React.useState<Record<number, string>>({});
    const [pendingMap, setPendingMap] = React.useState<Record<number, any>>({});

    const effectiveGet = (idx: number, sp: string, isMulti: boolean) => {
      if (applyMode === 'manual' && pendingMap.hasOwnProperty(idx)) return pendingMap[idx];
      const v = getValueByPath(sp, undefined);
      return isMulti ? (Array.isArray(v) ? v : []) : (v ?? '');
    };

    React.useEffect(() => {
      let cancelled = false;
      async function load() {
        const tasks = await Promise.allSettled(fields.map(async (f, idx) => {
          const src = f?.source;
          if (!src || typeof src !== 'object') return { idx, opts: [] as Opt[] };
          if (src.type === 'static') {
            const opts = Array.isArray(src.options) ? src.options.map((o: any) => ({ value: o.value, label: String(o.label ?? o.value) })) : [];
            return { idx, opts };
          }
          const term = searchMap[idx] || '';
          if (src.type === 'api' && typeof src.url === 'string' && src.url) {
            try {
              const method = (src.method || 'GET').toUpperCase();
              let url = src.url as string;
              if (method === 'GET' && term) url += (url.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(term);
              const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify({ ...(src.params||{}), ...(term ? { q: term } : {}) }) } : {}) });
              const j = await res.json();
              const raw = Array.isArray(j?.options) ? j.options : (Array.isArray(j?.rows) ? j.rows : []);
              const vf = src.valueField || 'value';
              const lf = src.labelField || 'label';
              const opts = raw.map((r: any) => ({ value: (r?.[vf] ?? r?.value), label: String(r?.[lf] ?? r?.label ?? r?.name ?? r?.nome ?? '') }));
              return { idx, opts };
            } catch { return { idx, opts: [] as Opt[] } }
          }
          if (src.type === 'query' && typeof src.model === 'string' && typeof src.dimension === 'string') {
            try {
              const mod = String(src.model).split('.')[0];
              const body = { dataQuery: { model: src.model, dimension: src.dimension, measure: 'COUNT()', filters: src.filters || {}, orderBy: { field: 'dimension', dir: 'asc' }, limit: src.limit || 100 } };
              const res = await fetch(`/api/modulos/${mod}/query`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
              const j = await res.json();
              const rows = Array.isArray(j?.rows) ? j.rows : [];
              const opts = rows.map((r: any) => ({ value: (r?.label ?? ''), label: String(r?.label ?? '') }));
              return { idx, opts };
            } catch { return { idx, opts: [] as Opt[] } }
          }
          return { idx, opts: [] as Opt[] };
        }))
        if (cancelled) return;
        const map: Record<number, Opt[]> = {};
        for (const t of tasks) if (t.status === 'fulfilled') map[(t.value as any).idx] = (t.value as any).opts;
        setOptionsMap(map);
      }
      load();
      return () => { cancelled = true };
    }, [JSON.stringify(fields), JSON.stringify(searchMap)]);

    const onChangeField = (idx: number, sp: string, value: any, autoAction?: AnyRecord) => {
      if (applyMode === 'manual') {
        setPendingMap((prev) => ({ ...prev, [idx]: value }));
      } else {
        const next = setByPath(data, sp, value);
        setData(next);
        if (autoAction && typeof autoAction === 'object') onAction?.(autoAction);
      }
    };

    const onApplyAll = () => {
      let next = data;
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const sp = String(f?.storePath || '').trim();
        if (!sp) continue;
        if (pendingMap.hasOwnProperty(i)) next = setByPath(next, sp, pendingMap[i]);
      }
      setData(next);
      if (p.actionOnApply && typeof p.actionOnApply === 'object') onAction?.(p.actionOnApply);
    };

    const card = (
      <div style={containerStyle}>
        {title && <div className="mb-0" style={applyH1FromCssVars(undefined, theme.cssVars)}>{title}</div>}
        <div className={(layout === 'horizontal' ? 'flex items-start gap-3 flex-wrap' : 'space-y-3') + ' p-2'}>
          {(() => {
            const f = (fields && fields.length > 0) ? fields[0] : undefined;
            if (!f) return null;
            const idx = 0;
            const sp = String(f?.storePath || '').trim();
            if (!sp) return null;
            const lbl = typeof f?.label === 'string' ? f.label : undefined;
            const lblStyle = applySlicerLabelFromCssVars(normalizeTitleStyle((f as any)?.labelStyle), theme.cssVars);
            const opts = optionsMap[idx] || [];
            const width = (f?.width !== undefined) ? (typeof f.width === 'number' ? `${f.width}px` : f.width) : undefined;
            const t = (f?.type || 'list') as 'list'|'dropdown'|'tile'|'tile-multi';
            const isMulti = (t === 'tile-multi' || t === 'list');
            const stored = effectiveGet(idx, sp, isMulti);
            const clearable = (f?.clearable !== false);
            const selectAll = Boolean(f?.selectAll);
            const showSearch = false;
            if (t === 'tile' || t === 'tile-multi') {
              const onClear = () => onChangeField(idx, sp, isMulti ? [] : undefined, f.actionOnChange);
              return (
                <div className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                  {lbl && !title && <div className="text-xs" style={lblStyle}>{lbl}</div>}
                  <div className="flex flex-wrap gap-2">
                    {opts.map((o) => {
                      const selected = isMulti ? (Array.isArray(stored) && stored.includes(o.value)) : (stored === o.value);
                      const tileCfgCard = ((((theme as any).components?.SlicerCard as any)?.tile) || (((theme as any).components?.Slicer as any)?.tile) || {});
                      const base = String(tileCfgCard.baseClass || 'text-xs font-medium rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]');
                      const selectedClass = String(tileCfgCard.selectedClass || 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700');
                      const unselectedClass = String(tileCfgCard.unselectedClass || 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200');
                      const cls = selected ? selectedClass : unselectedClass;
                      return (
                        <button
                          key={String(o.value)}
                          type="button"
                          className={`${base} ${cls}`}
                          onClick={() => {
                            if (isMulti) {
                              const arr = Array.isArray(stored) ? stored.slice() : [];
                              const exists = arr.includes(o.value);
                              const nextArr = exists ? arr.filter((v: any) => v !== o.value) : [...arr, o.value];
                              onChangeField(idx, sp, nextArr, f.actionOnChange);
                            } else {
                              const nextVal = (stored === o.value) ? (clearable ? undefined : o.value) : o.value;
                              onChangeField(idx, sp, nextVal, f.actionOnChange);
                            }
                          }}
                          style={(() => { const s = applySlicerOptionFromCssVars(undefined, theme.cssVars) || {}; delete (s as any).color; return s as any; })()}
                        >{o.label}</button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectAll && isMulti && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => onChangeField(idx, sp, opts.map(o => o.value), f.actionOnChange)}>Selecionar todos</button>
                    )}
                    {clearable && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
                    )}
                  </div>
                </div>
              );
            }
            // Default list (checkboxes)
            return (
              <div className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                {lbl && !title && <div className="text-xs" style={lblStyle}>{lbl}</div>}
                {/* search input removido */}
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {opts.map((o) => (
                      <label key={String(o.value)} className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={Array.isArray(stored) && stored.includes(o.value)}
                          onChange={(e) => {
                            const arr = Array.isArray(stored) ? stored.slice() : [];
                            const nextArr = e.target.checked ? [...arr, o.value] : arr.filter((v: any) => v !== o.value);
                            onChangeField(idx, sp, nextArr, f.actionOnChange);
                          }}
                        />
                        <span style={applySlicerOptionFromCssVars(normalizeTitleStyle((f as any)?.optionStyle), theme.cssVars)}>{o.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectAll && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => onChangeField(idx, sp, opts.map(o => o.value), f.actionOnChange)}>Selecionar todos</button>
                    )}
                    {clearable && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => onChangeField(idx, sp, [], f.actionOnChange)}>Limpar</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {applyMode === 'manual' && (
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onApplyAll} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">
              Aplicar
            </button>
          </div>
        )}
      </div>
    );
    return card;
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
    const mgr = (element?.props?.managers || {}) as AnyRecord;
    const preset = buildThemeVars(name, mgr as any);
    const cssVars = preset.cssVars || mapManagersToCssVars(mgr);
    return (
      <ThemeProvider name={name} cssVars={cssVars}>
        {children}
      </ThemeProvider>
    );
  },
  KPI: ({ element }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultKPI as any, (theme.components?.Kpi || {}) as any), (element?.props || {}) as any) as AnyRecord;
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
          const url = `/api/modulos/${mod}/query`;
          const body = { dataQuery: { model: dq.model, dimension: undefined, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
          const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          const j = await res.json();
          const rows = Array.isArray(j?.rows) ? j.rows : [];
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
    const titleStyle = applyKpiTitleFromCssVars(normalizeTitleStyle(p.titleStyle), theme.cssVars);
    const valueStyle = applyKpiValueFromCssVars(normalizeTitleStyle(p.valueStyle), theme.cssVars);
    const containerStyle = ensureSurfaceBackground(applyShadowFromCssVars(applyBorderFromCssVars(normalizeContainerStyle(p.containerStyle, Boolean(p.borderless)), theme.cssVars), theme.cssVars), theme.cssVars);
    const valuePath = (p.valuePath as string | undefined) || undefined;
    const valueFromPath = valuePath ? useDataValue(valuePath, undefined) : undefined;
    function formatValue(val: any, fmt: 'currency'|'percent'|'number'): string {
      const n = Number(val ?? 0);
      if (!Number.isFinite(n)) return String(val ?? '');
      switch (fmt) {
        case 'currency': return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);
        case 'percent': return `${(n * 100).toFixed(2)}%`;
        default: return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
      }
    }
    const displayValue = (dq && dq.model && dq.measure) ? serverValue : (valueFromPath ?? 0);
    return (
      <div style={containerStyle}>
        <div className="mb-1" style={titleStyle}>{title}</div>
        <div className="text-2xl font-semibold" style={valueStyle}>{formatValue(displayValue, fmt)}{unit ? ` ${unit}` : ''}</div>
      </div>
    );
  },
};
