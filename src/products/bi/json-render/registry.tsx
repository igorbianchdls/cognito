"use client";

import React from "react";
import JsonRenderBarChart from "@/products/bi/json-render/components/BarChart";
import JsonRenderHorizontalBarChart from "@/products/bi/json-render/components/HorizontalBarChart";
import JsonRenderLineChart from "@/products/bi/json-render/components/LineChart";
import JsonRenderPieChart from "@/products/bi/json-render/components/PieChart";
import JsonRenderScatterChart from "@/products/bi/json-render/components/ScatterChart";
import JsonRenderRadarChart from "@/products/bi/json-render/components/RadarChart";
import JsonRenderTreemapChart from "@/products/bi/json-render/components/TreemapChart";
import JsonRenderComposedChart from "@/products/bi/json-render/components/ComposedChart";
import JsonRenderFunnelChart from "@/products/bi/json-render/components/FunnelChart";
import JsonRenderSankeyChart from "@/products/bi/json-render/components/SankeyChart";
import JsonRenderSparkline from "@/products/bi/json-render/components/Sparkline";
import JsonRenderGauge from "@/products/bi/json-render/components/Gauge";
import JsonRenderTable from "@/products/bi/json-render/components/Table";
import JsonRenderPivotTable from "@/products/bi/json-render/components/PivotTable";
import FrameSurface from "@/products/bi/json-render/components/FrameSurface";
import DashboardBackgroundLayer from "@/products/bi/json-render/backgrounds/DashboardBackgroundLayer";
import { normalizeDashboardBackgroundPreset } from "@/products/bi/json-render/backgrounds/types";
import { ThemeProvider, useThemeOverrides } from "@/products/bi/json-render/theme/ThemeContext";
import { mapManagersToCssVars } from "@/products/bi/json-render/theme/thememanagers";
import { buildThemeVars } from "@/products/bi/json-render/theme/themeAdapter";
import { useDataValue, useData } from "@/products/bi/json-render/context";
import { applyPrimaryDateRange } from "@/products/bi/json-render/dateFilters";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { normalizeTitleStyle, normalizeContainerStyle, applyBorderFromCssVars, ensureSurfaceBackground, applyH1FromCssVars, applyKpiValueFromCssVars, applySlicerLabelFromCssVars, applySlicerOptionFromCssVars, applyDatePickerIconFromCssVars, applyDatePickerFieldFromCssVars, applyDatePickerLabelFromCssVars } from "@/products/bi/json-render/helpers";
import { Calendar, Sparkles, TrendingUp, TrendingDown, TriangleAlert, AlertCircle, BadgeCheck, Lightbulb, Brain, CircleDollarSign, ShoppingCart, Users, Package, Activity, CircleHelp } from 'lucide-react';

type AnyRecord = Record<string, any>;

// Defaults (local) — substituem stores globais
const defaultHeader = {
  direction: 'row',
  justify: 'between',
  align: 'center',
  gap: 12,
  titleAlign: 'left',
  backgroundColor: 'transparent',
  textColor: '#111827',
  subtitleColor: '#6b7280',
  padding: '4px 12px',
  borderColor: '#e5e7eb',
  borderWidth: 0,
  borderBottomWidth: 0,
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

const defaultSidebar = {
  direction: 'column',
  gap: 10,
  justify: 'start',
  align: 'stretch',
  padding: 12,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 10,
  sticky: false,
  top: 12,
} as const;

const defaultTab = {
  padding: '10px 12px',
  margin: 0,
  backgroundColor: '#ffffff',
  activeBackgroundColor: '#111827',
  textColor: '#374151',
  activeTextColor: '#ffffff',
  borderColor: '#d1d5db',
  activeBorderColor: '#111827',
  borderWidth: 1,
  radius: 8,
  fontSize: 13,
  fontWeight: 600,
} as const;

// (removed old Kpi defaults)

const defaultKPI = {
  format: 'number' as 'currency'|'percent'|'number',
  valueStyle: { fontWeight: 700, fontSize: 24, color: '#0f172a', textTransform: 'none', textAlign: 'left' },
} as const;

const defaultGauge = {
  format: 'number' as 'currency'|'percent'|'number',
  width: 220,
  height: 130,
  thickness: 16,
  trackColor: '#e5e7eb',
  valueColor: '#2563eb',
  targetColor: '#0f172a',
  roundedCaps: true,
  showValue: true,
  showMinMax: true,
  showTarget: true,
  startAngle: -110,
  endAngle: 110,
} as const;

const defaultBarChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 8, textAlign: 'left' },
  nivo: { layout: 'vertical', padding: 0.3, groupMode: 'grouped', gridX: false, gridY: false, axisBottom: { tickRotation: 0, legendOffset: 32 }, axisLeft: { legendOffset: 40 }, margin: { top: 10, right: 10, bottom: 40, left: 48 }, animate: true, motionConfig: 'gentle' },
} as const;

const defaultLineChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  nivo: { gridX: false, gridY: false, curve: 'linear', pointSize: 6, margin: { top: 10, right: 10, bottom: 40, left: 48 }, animate: true, motionConfig: 'gentle' },
} as const;

const defaultPieChart = {
  height: 220,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  nivo: { innerRadius: 0, padAngle: 0.7, cornerRadius: 3, activeOuterRadiusOffset: 8, enableArcLabels: true, arcLabelsSkipAngle: 10, arcLabelsTextColor: '#333333', margin: { top: 10, right: 10, bottom: 10, left: 10 }, animate: true, motionConfig: 'gentle' },
} as const;

const defaultScatterChart = {
  height: 260,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
  nivo: { range: [60, 360], animate: true },
} as const;

const defaultRadarChart = {
  height: 260,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
  nivo: { outerRadius: '72%', fillOpacity: 0.28, animate: true },
} as const;

const defaultTreemapChart = {
  height: 280,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { aspectRatio: 4 / 3, animate: true },
} as const;

const defaultComposedChart = {
  height: 280,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { gridX: false, gridY: true, curve: 'monotone', animate: true },
} as const;

const defaultFunnelChart = {
  height: 300,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { animate: true },
} as const;

const defaultSankeyChart = {
  height: 360,
  format: 'number' as 'currency'|'percent'|'number',
  titleStyle: { padding: 6, textAlign: 'left' },
  colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  nivo: { nodePadding: 14, nodeWidth: 14, linkCurvature: 0.5, iterations: 32, sort: true, animate: true },
} as const;

const defaultAISummary = {
  titleStyle: { padding: '6px 0', margin: 0, textAlign: 'left' },
  itemGap: 10,
  contentPaddingX: 12,
  contentPaddingBottom: 10,
  iconGap: 10,
  iconBoxSize: 30,
  iconSize: 16,
  iconBoxRadius: 8,
  itemTextStyle: { fontWeight: 500, fontSize: 13, color: '#334155' },
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8 },
  borderless: false,
} as const;

const defaultTable = {
  pageSize: 10,
  showPagination: true,
  showColumnToggle: true,
  enableSearch: true,
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  striped: false,
  editableMode: false,
  editableCells: 'none',
  editableRowActions: {
    allowAdd: false,
    allowDelete: false,
    allowDuplicate: false,
  },
  containerStyle: { borderColor: '#e5e7eb', borderWidth: 1, borderStyle: 'solid', borderRadius: 8, padding: 12 },
  borderless: false,
} as const;

const defaultPivotTable = {
  stickyHeader: true,
  bordered: true,
  rounded: true,
  density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  showSubtotals: true,
  showGrandTotals: true,
  defaultExpandedLevels: 1,
  enableExportCsv: false,
} as const;

const aiSummaryIconMap: Record<string, React.ComponentType<any>> = {
  sparkles: Sparkles,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  trianglealert: TriangleAlert,
  alertcircle: AlertCircle,
  badgecheck: BadgeCheck,
  lightbulb: Lightbulb,
  brain: Brain,
  circledollarsign: CircleDollarSign,
  shoppingcart: ShoppingCart,
  users: Users,
  package: Package,
  activity: Activity,
  help: CircleHelp,
  circlehelp: CircleHelp,
};

const iconMap: Record<string, React.ComponentType<any>> = {
  calendar: Calendar,
  sparkles: Sparkles,
  trendingup: TrendingUp,
  trendingdown: TrendingDown,
  trianglealert: TriangleAlert,
  alertcircle: AlertCircle,
  badgecheck: BadgeCheck,
  lightbulb: Lightbulb,
  brain: Brain,
  circledollarsign: CircleDollarSign,
  dollarsign: CircleDollarSign,
  revenue: CircleDollarSign,
  shoppingcart: ShoppingCart,
  cart: ShoppingCart,
  orders: ShoppingCart,
  users: Users,
  package: Package,
  activity: Activity,
  help: CircleHelp,
  circlehelp: CircleHelp,
};

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

function setDataByPath(prev: AnyRecord, path: string, value: any): AnyRecord {
  const parts = String(path || '').split('.').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return prev || {};
  const root: AnyRecord = Array.isArray(prev) ? [...prev] as any : { ...(prev || {}) };
  let curr: AnyRecord = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      if (value === undefined) delete curr[key];
      else curr[key] = value;
    } else {
      const next = curr[key];
      curr[key] = next && typeof next === 'object' ? { ...next } : {};
      curr = curr[key] as AnyRecord;
    }
  }
  return root;
}

function parseIsoDate(input: unknown): Date | null {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function shiftMonthsClamped(date: Date, delta: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const first = new Date(year, month + delta, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(day, lastDay));
}

function deriveComparisonRange(mode: unknown, fromRaw: unknown, toRaw: unknown): { from: string; to: string } | null {
  const from = parseIsoDate(fromRaw);
  const to = parseIsoDate(toRaw);
  if (!from || !to) return null;
  const normalizedMode = String(mode || '').trim();
  if (!normalizedMode) return null;

  if (normalizedMode === 'previous_period') {
    const diffDays = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
    const compareTo = shiftDays(from, -1);
    const compareFrom = shiftDays(compareTo, -diffDays);
    return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) };
  }

  if (normalizedMode === 'previous_month') {
    return {
      from: formatIsoDate(shiftMonthsClamped(from, -1)),
      to: formatIsoDate(shiftMonthsClamped(to, -1)),
    };
  }

  if (normalizedMode === 'previous_year') {
    const compareFrom = new Date(from);
    compareFrom.setFullYear(compareFrom.getFullYear() - 1);
    const compareTo = new Date(to);
    compareTo.setFullYear(compareTo.getFullYear() - 1);
    return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) };
  }

  return null;
}

function resolveTextSpacingStyle(p: AnyRecord | undefined): React.CSSProperties {
  return {
    margin: styleVal(p?.margin),
    marginTop: styleVal(p?.marginTop),
    marginRight: styleVal(p?.marginRight),
    marginBottom: styleVal(p?.marginBottom),
    marginLeft: styleVal(p?.marginLeft),
    padding: styleVal(p?.padding),
    paddingTop: styleVal(p?.paddingTop),
    paddingRight: styleVal(p?.paddingRight),
    paddingBottom: styleVal(p?.paddingBottom),
    paddingLeft: styleVal(p?.paddingLeft),
  };
}

function resolveBoxStyle(p: AnyRecord | undefined): React.CSSProperties {
  return {
    ...resolveTextSpacingStyle(p),
    backgroundColor: p?.backgroundColor,
    borderColor: p?.borderColor,
    borderStyle: p?.borderStyle || (p?.borderWidth ? 'solid' : undefined),
    borderWidth: styleVal(p?.borderWidth),
    borderRadius: styleVal(p?.borderRadius),
    boxShadow: p?.boxShadow,
    width: styleVal(p?.width),
    minWidth: styleVal(p?.minWidth),
    maxWidth: styleVal(p?.maxWidth),
    height: styleVal(p?.height),
    minHeight: styleVal(p?.minHeight),
    maxHeight: styleVal(p?.maxHeight),
    overflow: p?.overflow,
    overflowX: p?.overflowX,
    overflowY: p?.overflowY,
    ...((p?.style && typeof p.style === 'object') ? p.style : {}),
  };
}

function buildHtmlBlockStyle(p: AnyRecord | undefined): React.CSSProperties {
  const style: React.CSSProperties = {
    ...resolveBoxStyle(p),
  };
  if (p?.direction || p?.justify || p?.align || p?.gap || p?.wrap) {
    style.display = 'flex';
    style.flexDirection = (p?.direction ?? 'column') as any;
    style.justifyContent = mapJustify(p?.justify);
    style.alignItems = mapAlign(p?.align);
    style.gap = styleVal(p?.gap);
    style.flexWrap = p?.wrap ? 'wrap' : 'nowrap';
  }
  return style;
}

function toFlexNumber(v: unknown): number | undefined {
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function resolveFlexItemStyle(rawProps: AnyRecord | undefined): React.CSSProperties {
  const p = (rawProps || {}) as AnyRecord;
  const fr = Number(p.fr);
  if (Number.isFinite(fr) && fr > 0) {
    return { flexGrow: fr, flexShrink: 1, flexBasis: 0, minWidth: 0 };
  }

  const grow = toFlexNumber(p.grow);
  const shrink = toFlexNumber(p.shrink);
  const basis = styleVal(p.basis);

  const out: React.CSSProperties = {};
  if (grow !== undefined) out.flexGrow = grow;
  if (shrink !== undefined) out.flexShrink = shrink;
  if (basis !== undefined) out.flexBasis = basis;
  if ((grow ?? 0) > 0 && basis === undefined) out.flexBasis = 0;
  if ((grow ?? 0) > 0 || (Number.isFinite(fr) && fr > 0)) out.minWidth = 0;
  return out;
}

function normalizeIconKey(input: unknown): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function hexToRgba(hex: string, alpha: number): string | null {
  const raw = String(hex || '').trim();
  const m = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const v = m[1];
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function getPathValue(obj: any, path: string): any {
  if (!path || !obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.').map((s) => s.trim()).filter(Boolean);
  let curr = obj as any;
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return undefined;
    curr = curr[part];
  }
  return curr;
}

type SlicerOpt = { value: string | number; label: string };

function mapRawToOptions(raw: any[], valueField?: string, labelField?: string): SlicerOpt[] {
  const vf = valueField || 'value';
  const lf = labelField || 'label';
  return raw.map((r: any) => ({
    value: r?.[vf] ?? r?.value,
    label: String(r?.[lf] ?? r?.label ?? r?.name ?? r?.nome ?? ''),
  }));
}

async function fetchOptionsFromSource(
  src: AnyRecord,
  args: { term?: string; data?: AnyRecord; readByPath?: (path: string, fallback?: any) => any },
): Promise<SlicerOpt[]> {
  if (!src || typeof src !== 'object') return [];
  const term = String(args.term || '').trim();

  if (src.type === 'static') {
    const opts = Array.isArray(src.options) ? src.options : [];
    return mapRawToOptions(opts);
  }

  if (typeof src.query === 'string' && src.query.trim()) {
    try {
      const filters = applyPrimaryDateRange({ ...((args?.data as AnyRecord)?.filters || {}) } as AnyRecord, args?.data);
      if (term && filters.q === undefined) filters.q = term;
      delete filters.dateRange;

      const limitRaw = Number(src.limit ?? 200);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(2000, limitRaw)) : 200;
      const res = await fetch('/api/modulos/query/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dataQuery: {
            query: src.query,
            filters,
            limit,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok || j?.success === false) {
        throw new Error(String(j?.message || `Query failed (${res.status})`));
      }
      const rows = Array.isArray(j?.rows) ? j.rows : [];
      return rows
        .map((r: AnyRecord): SlicerOpt => ({
          value: (r?.value ?? r?.id ?? r?.key ?? ''),
          label: String(r?.label ?? r?.nome ?? r?.name ?? r?.value ?? r?.id ?? ''),
        }))
        .filter((o: SlicerOpt) => o.label.trim() !== '');
    } catch (e) {
      console.error('[BI/SlicerOptions] sql query failed', e);
      return [];
    }
  }

  if (src.type === 'options' && typeof src.model === 'string' && typeof src.field === 'string') {
    try {
      const pageSizeRaw = Number(src.pageSize ?? src.limit ?? 50);
      const limit = Number.isFinite(pageSizeRaw) ? Math.max(1, Math.min(200, pageSizeRaw)) : 50;
      const payload: AnyRecord = {
        model: src.model,
        field: src.field,
        limit,
      };
      if (term) payload.q = term;

      const dependsOn = Array.isArray(src.dependsOn) ? src.dependsOn.filter((p: any) => typeof p === 'string' && p.trim()) : [];
      if (dependsOn.length) {
        const contextFilters: AnyRecord = {};
        for (const depPath of dependsOn) {
          const depKey = String(depPath).split('.').pop() || String(depPath);
          const depVal = args.readByPath
            ? args.readByPath(String(depPath), undefined)
            : getPathValue(args.data, String(depPath));
          if (depVal !== undefined && depVal !== null && depVal !== '' && (!Array.isArray(depVal) || depVal.length > 0)) {
            contextFilters[depKey] = depVal;
          }
        }
        if (Object.keys(contextFilters).length > 0) {
          payload.contextFilters = contextFilters;
        }
      }

      const res = await fetch('/api/modulos/options/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || j?.success === false) {
        throw new Error(String(j?.message || `Options resolve failed (${res.status})`));
      }
      const raw = Array.isArray(j?.options) ? j.options : [];
      return mapRawToOptions(raw, src.valueField, src.labelField);
    } catch (e) {
      console.error('[BI/SlicerOptions] resolve failed', e);
      return [];
    }
  }

  if (src.type === 'api' && typeof src.url === 'string' && src.url) {
    try {
      const method = (src.method || 'GET').toUpperCase();
      let url = src.url as string;
      if (method === 'GET' && term) url += (url.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(term);
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ ...(src.params || {}), ...(term ? { q: term } : {}) }) } : {}),
      });
      const j = await res.json();
      const raw = Array.isArray(j?.options) ? j.options : (Array.isArray(j?.rows) ? j.rows : []);
      return mapRawToOptions(raw, src.valueField, src.labelField);
    } catch {
      return [];
    }
  }

  if (src.type === 'query' && typeof src.model === 'string' && typeof src.dimension === 'string') {
    try {
      const mod = String(src.model).split('.')[0];
      const body = {
        dataQuery: {
          model: src.model,
          dimension: src.dimension,
          measure: 'COUNT()',
          filters: src.filters || {},
          orderBy: { field: 'dimension', dir: 'asc' },
          limit: src.limit || 100,
        },
      };
      const res = await fetch(`/api/modulos/${mod}/query`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      const rows = Array.isArray(j?.rows) ? j.rows : [];
      return rows.map((r: any) => ({ value: r?.label ?? '', label: String(r?.label ?? '') }));
    } catch {
      return [];
    }
  }

  return [];
}

function resolveSlicerFields(element: any, propsFields: unknown): AnyRecord[] {
  const explicitFields = Array.isArray(propsFields)
    ? propsFields.filter((field): field is AnyRecord => Boolean(field && typeof field === 'object' && !Array.isArray(field)))
    : [];
  if (explicitFields.length > 0) return explicitFields;

  const childDefs = Array.isArray(element?.children) ? element.children : [];
  return childDefs
    .filter((child: AnyRecord) => String(child?.type || '') === 'SlicerField')
    .map((child: AnyRecord) => ((child?.props && typeof child.props === 'object' && !Array.isArray(child.props)) ? child.props as AnyRecord : {}))
    .filter((field: AnyRecord) => Object.keys(field).length > 0);
}

type SlicerVariant = 'checklist' | 'dropdown' | 'tile';
type SlicerSelectionMode = 'single' | 'multiple';

function resolveSlicerUiChild(element: any): { variant?: SlicerVariant; props: AnyRecord } {
  const childDefs = Array.isArray(element?.children) ? element.children : [];
  for (const child of childDefs) {
    const type = String((child as AnyRecord)?.type || '').trim();
    if (type === 'OptionList') {
      return {
        variant: 'checklist',
        props: ((child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props))
          ? ((child as AnyRecord).props as AnyRecord)
          : {},
      };
    }
    if (type === 'Select') {
      return {
        variant: 'dropdown',
        props: ((child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props))
          ? ((child as AnyRecord).props as AnyRecord)
          : {},
      };
    }
    if (type === 'Tile') {
      return {
        variant: 'tile',
        props: ((child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props))
          ? ((child as AnyRecord).props as AnyRecord)
          : {},
      };
    }
  }
  return { props: {} };
}

function resolveSlicerStorePath(config: AnyRecord | null | undefined): string {
  const explicit = String(config?.storePath || '').trim();
  if (explicit) return explicit;
  const field = String(config?.field || '').trim();
  if (field) return `filters.${field}`;
  return '';
}

function resolveSlicerFieldBinding(config: AnyRecord | null | undefined): { key: string; table: string; field: string } | null {
  const key = String(config?.field || '').trim();
  const table = String(config?.table || '').trim();
  if (!key || !table) return null;
  return { key, table, field: key };
}

function resolveSingleSlicerField(element: any, props: AnyRecord): AnyRecord | null {
  const storePath = resolveSlicerStorePath(props);
  if (!storePath) return null;
  const fieldKeys = [
    'label',
    'table',
    'field',
    'mode',
    'storePath',
    'placeholder',
    'clearable',
    'selectAll',
    'search',
    'width',
    'query',
    'limit',
    'source',
    'actionOnChange',
  ] as const;
  const field: AnyRecord = {};
  for (const key of fieldKeys) {
    if (props[key] !== undefined) field[key] = props[key];
  }
  field.storePath = storePath;
  const uiChild = resolveSlicerUiChild(element);
  if (uiChild.variant && field.variant === undefined) field.variant = uiChild.variant;
  return { ...field, ...uiChild.props };
}

function resolveSlicerDefinitions(element: any, props: AnyRecord): AnyRecord[] {
  const fields = resolveSlicerFields(element, props.fields);
  if (fields.length > 0) return fields;
  const single = resolveSingleSlicerField(element, props);
  return single ? [single] : [];
}

function resolveSlicerPresentation(field: AnyRecord): { variant: SlicerVariant; selectionMode: SlicerSelectionMode } {
  const variant =
    field?.variant === 'dropdown' || field?.variant === 'tile' || field?.variant === 'checklist'
      ? (field.variant as SlicerVariant)
      : 'checklist';
  const selectionMode =
    field?.mode === 'single' || field?.mode === 'multiple'
      ? (field.mode as SlicerSelectionMode)
      : 'multiple';
  return { variant, selectionMode };
}

function buildSlicerControlStyle(field: AnyRecord): React.CSSProperties {
  return {
    borderColor: typeof field?.borderColor === 'string' ? field.borderColor : undefined,
    color: typeof field?.textColor === 'string' ? field.textColor : undefined,
    backgroundColor: typeof field?.backgroundColor === 'string' ? field.backgroundColor : undefined,
    fontSize: styleVal(field?.fontSize),
    fontWeight: field?.fontWeight as React.CSSProperties['fontWeight'],
    borderRadius: styleVal(field?.radius),
    padding: styleVal(field?.padding),
  };
}

function buildSlicerOptionTextStyle(field: AnyRecord, baseStyle: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyle,
    color: typeof field?.textColor === 'string' ? field.textColor : baseStyle.color,
    fontSize: styleVal(field?.fontSize) || baseStyle.fontSize,
    fontWeight: (field?.fontWeight as React.CSSProperties['fontWeight']) ?? baseStyle.fontWeight,
  };
}

function SlicerContent({
  element,
  fields,
  layout,
  applyMode,
  onAction,
  suppressFieldLabels = false,
  padded = false,
}: {
  element: any;
  fields: AnyRecord[];
  layout: 'vertical' | 'horizontal';
  applyMode: 'auto' | 'manual';
  onAction?: (action: any) => void;
  suppressFieldLabels?: boolean;
  padded?: boolean;
}) {
  const theme = useThemeOverrides();
  const { data, setData, getValueByPath } = useData();
  const [optionsMap, setOptionsMap] = React.useState<Record<number, SlicerOpt[]>>({});
  const [searchMap, setSearchMap] = React.useState<Record<number, string>>({});
  const [pendingMap, setPendingMap] = React.useState<Record<number, any>>({});

  function setByPath(prev: any, path: string, value: any) {
    if (!path) return prev;
    const parts = path.split('.').map((s) => s.trim()).filter(Boolean);
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

  const effectiveGet = React.useCallback((idx: number, sp: string, isMulti: boolean) => {
    if (applyMode === 'manual' && Object.prototype.hasOwnProperty.call(pendingMap, idx)) return pendingMap[idx];
    const v = getValueByPath(sp, undefined);
    return isMulti ? (Array.isArray(v) ? v : []) : (v ?? '');
  }, [applyMode, getValueByPath, pendingMap]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      const tasks = await Promise.allSettled(fields.map(async (field, idx) => {
        const src =
          (field?.source && typeof field.source === 'object')
            ? (field.source as AnyRecord)
            : (typeof field?.query === 'string' && field.query.trim()
                ? ({ query: field.query, ...(Number.isFinite(Number(field?.limit)) ? { limit: Number(field.limit) } : {}) } as AnyRecord)
                : null);
        if (!src || typeof src !== 'object') return { idx, opts: [] as SlicerOpt[] };
        const term = searchMap[idx] || '';
        const opts = await fetchOptionsFromSource(src, { term, data, readByPath: getValueByPath });
        return { idx, opts };
      }));
      if (cancelled) return;
      const nextMap: Record<number, SlicerOpt[]> = {};
      for (const task of tasks) {
        if (task.status === 'fulfilled') nextMap[(task.value as any).idx] = (task.value as any).opts;
      }
      setOptionsMap(nextMap);
    }
    load();
    return () => { cancelled = true };
  }, [fields, searchMap, data, getValueByPath]);

  const onChangeField = React.useCallback((idx: number, storePath: string, value: any, autoAction?: AnyRecord) => {
    if (applyMode === 'manual') {
      setPendingMap((prev) => ({ ...prev, [idx]: value }));
      return;
    }
    const field = fields[idx];
    let next = setByPath(data, storePath, value);
    const binding = resolveSlicerFieldBinding(field);
    if (binding) {
      next = setByPath(next, `filters.__fields.${binding.key}`, { table: binding.table, field: binding.field });
    }
    setData(next);
    if (autoAction && typeof autoAction === 'object') onAction?.(autoAction);
  }, [applyMode, data, fields, onAction, setData]);

  const onApplyAll = React.useCallback(() => {
    let next = data;
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      const storePath = resolveSlicerStorePath(field);
      if (!storePath) continue;
      if (Object.prototype.hasOwnProperty.call(pendingMap, i)) {
        next = setByPath(next, storePath, pendingMap[i]);
        const binding = resolveSlicerFieldBinding(field);
        if (binding) {
          next = setByPath(next, `filters.__fields.${binding.key}`, { table: binding.table, field: binding.field });
        }
      }
    }
    setData(next);
    const actionOnApply = element?.props?.actionOnApply;
    if (actionOnApply && typeof actionOnApply === 'object') onAction?.(actionOnApply);
  }, [data, element?.props?.actionOnApply, fields, onAction, pendingMap, setData]);

  const wrapperClassName = `${layout === 'horizontal' ? 'flex items-start gap-3 flex-wrap' : 'space-y-3'}${padded ? ' p-2' : ''}`;

  return (
    <>
      <div className={wrapperClassName}>
        {fields.map((field, idx) => {
          const storePath = resolveSlicerStorePath(field);
          if (!storePath) return null;

          const label = typeof field?.label === 'string' ? field.label : undefined;
          const labelStyle = applySlicerLabelFromCssVars(normalizeTitleStyle((field as any)?.labelStyle), theme.cssVars);
          const opts = optionsMap[idx] || [];
          const width = field?.width !== undefined ? (typeof field.width === 'number' ? `${field.width}px` : field.width) : undefined;
          const { variant, selectionMode } = resolveSlicerPresentation(field);
          const isMulti = selectionMode === 'multiple';
          const stored = effectiveGet(idx, storePath, isMulti);
          const clearable = field?.clearable !== false;
          const selectAll = Boolean(field?.selectAll);
          const showSearch = Boolean(field?.search);
          const controlStyle = buildSlicerControlStyle(field);
          const optionTextStyle = buildSlicerOptionTextStyle(
            field,
            (applySlicerOptionFromCssVars(normalizeTitleStyle((field as any)?.optionStyle), theme.cssVars) || {}) as React.CSSProperties,
          );
          const listMaxHeight = styleVal(field?.maxHeight) || '12rem';
          const itemGap = styleVal(field?.itemGap) || '0.25rem';

          if (variant === 'tile') {
            const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange);
            return (
              <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                {label && !suppressFieldLabels && <div className="text-xs" style={labelStyle}>{label}</div>}
                <div className="flex flex-col gap-2">
                  {showSearch && (
                    <input
                      type="text"
                      value={searchMap[idx] || ''}
                      onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Buscar..."
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      style={controlStyle}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {opts.map((option) => {
                      const selected = isMulti ? (Array.isArray(stored) && stored.includes(option.value)) : stored === option.value;
                      const tileCfg = ((((theme as any).components?.Filter as any)?.tile) || (((theme as any).components?.SlicerCard as any)?.tile) || {});
                      const base = String(tileCfg.baseClass || 'text-xs font-medium rounded-md min-w-[110px] h-9 px-3 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-[0.98]');
                      const selectedClass = String(tileCfg.selectedClass || 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700');
                      const unselectedClass = String(tileCfg.unselectedClass || 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200');
                      return (
                        <button
                          key={String(option.value)}
                          type="button"
                          className={`${base} ${selected ? selectedClass : unselectedClass}`}
                          onClick={() => {
                            if (isMulti) {
                              const arr = Array.isArray(stored) ? stored.slice() : [];
                              const exists = arr.includes(option.value);
                              const nextArr = exists ? arr.filter((v: any) => v !== option.value) : [...arr, option.value];
                              onChangeField(idx, storePath, nextArr, field.actionOnChange);
                            } else {
                              const nextVal = stored === option.value ? (clearable ? undefined : option.value) : option.value;
                              onChangeField(idx, storePath, nextVal, field.actionOnChange);
                            }
                          }}
                          style={(() => {
                            const style = applySlicerOptionFromCssVars(undefined, theme.cssVars) || {};
                            delete (style as any).color;
                            return { ...(style as any), ...controlStyle } as any;
                          })()}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectAll && isMulti && (
                    <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => onChangeField(idx, storePath, opts.map((option) => option.value), field.actionOnChange)}>Selecionar todos</button>
                  )}
                  {clearable && (
                    <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
                  )}
                </div>
              </div>
            );
          }

          if (variant === 'checklist') {
            const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange);
            return (
              <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                {label && !suppressFieldLabels && <div className="text-xs" style={labelStyle}>{label}</div>}
                <div className="flex flex-col gap-2">
                  {showSearch && (
                    <input
                      type="text"
                      value={searchMap[idx] || ''}
                      onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Buscar..."
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      style={controlStyle}
                    />
                  )}
                  <div
                    className="flex flex-col overflow-y-auto rounded-md border border-gray-300 px-2 py-2 pr-1"
                    style={{
                      ...controlStyle,
                      gap: itemGap,
                      maxHeight: listMaxHeight,
                    }}
                  >
                    {opts.map((option) => (
                      <label key={String(option.value)} className="inline-flex items-center gap-2 text-xs">
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          className="rounded border-gray-300"
                          style={{ accentColor: typeof field?.checkColor === 'string' ? field.checkColor : undefined }}
                          name={isMulti ? undefined : `slicer-${idx}`}
                          checked={isMulti ? (Array.isArray(stored) && stored.includes(option.value)) : stored === option.value}
                          onChange={(e) => {
                            if (isMulti) {
                              const arr = Array.isArray(stored) ? stored.slice() : [];
                              const nextArr = e.target.checked ? [...arr, option.value] : arr.filter((v: any) => v !== option.value);
                              onChangeField(idx, storePath, nextArr, field.actionOnChange);
                              return;
                            }
                            onChangeField(idx, storePath, option.value, field.actionOnChange);
                          }}
                        />
                        <span style={optionTextStyle}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectAll && isMulti && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => onChangeField(idx, storePath, opts.map((option) => option.value), field.actionOnChange)}>Selecionar todos</button>
                    )}
                    {clearable && (
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          const value = isMulti ? (Array.isArray(stored) ? stored : []) : (stored ?? '');
          const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange);
          return (
            <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
              {label && !suppressFieldLabels && <div className="text-xs" style={labelStyle}>{label}</div>}
              <div className="flex flex-col gap-2">
                {showSearch && (
                  <input
                    type="text"
                    value={searchMap[idx] || ''}
                    onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Buscar..."
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    style={controlStyle}
                  />
                )}
                <select
                  multiple={isMulti}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  style={{ ...optionTextStyle, ...controlStyle, maxHeight: styleVal(field?.maxHeight) } as any}
                  value={value as any}
                  onChange={(e) => {
                    if (isMulti) {
                      const selected: any[] = Array.from(e.target.selectedOptions)
                        .map((option) => (option as any).value)
                        .map((raw) => (String(Number(raw)) === raw ? Number(raw) : raw));
                      onChangeField(idx, storePath, selected, field.actionOnChange);
                    } else {
                      const nextValue = e.target.value;
                      if (nextValue === '') {
                        onChangeField(idx, storePath, undefined, field.actionOnChange);
                        return;
                      }
                      onChangeField(idx, storePath, String(Number(nextValue)) === nextValue ? Number(nextValue) : nextValue, field.actionOnChange);
                    }
                  }}
                >
                  {(!isMulti && typeof field?.placeholder === 'string' && field.placeholder) ? <option value="">{field.placeholder}</option> : null}
                  {opts.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
                  ))}
                </select>
              </div>
              {clearable && (
                <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
              )}
            </div>
          );
        })}
      </div>
      {applyMode === 'manual' && (
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={onApplyAll} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">
            Aplicar
          </button>
        </div>
      )}
    </>
  );
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
    case 'left': return 'flex-start';
    case 'center': return 'center';
    case 'end': return 'flex-end';
    case 'right': return 'flex-end';
    case 'stretch': return 'stretch';
    default: return undefined;
  }
}

// Themed Date input with custom icon
function DateFieldWithIcon({ value, onChange, fieldStyle, iconStyleOverride }: { value: string; onChange: (v: string) => void; fieldStyle?: React.CSSProperties; iconStyleOverride?: React.CSSProperties }) {
  const theme = useThemeOverrides();
  const ref = React.useRef<HTMLInputElement>(null);
  const iconVars = applyDatePickerIconFromCssVars(undefined, theme.cssVars) as React.CSSProperties | undefined;
  const pos = ((theme.cssVars || {} as any).dpIconPosition as string) || 'right';
  const sizeNum = (() => {
    const fs = (iconVars as any)?.fontSize;
    if (!fs) return 14;
    const m = String(fs).match(/\d+/);
    return m ? Number(m[0]) : 14;
  })();
  const color = (iconVars as any)?.color as string | undefined;
  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: pos === 'right' ? 6 : undefined,
    left: pos === 'left' ? 6 : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ...iconVars,
    ...iconStyleOverride,
  };
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    paddingRight: pos === 'right' ? 24 : undefined,
    paddingLeft: pos === 'left' ? 24 : undefined,
    ...fieldStyle,
  };
  return (
    <div className="dp-themed flex items-center" style={wrapperStyle}>
      <input
        ref={ref}
        type="date"
        className="outline-none bg-transparent text-xs"
        style={{ border: 'none', background: 'transparent', color: 'inherit' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span
        aria-label="Abrir seletor de data"
        role="button"
        style={iconStyle}
        onClick={() => { (ref.current as any)?.showPicker?.(); ref.current?.focus(); }}
      >
        <Calendar size={sizeNum} color={color} />
      </span>
    </div>
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function pickerFontStyle(raw?: AnyRecord): React.CSSProperties {
  if (!raw || typeof raw !== 'object') return {};
  return {
    fontFamily: typeof raw.fontFamily === 'string' ? raw.fontFamily : undefined,
    fontSize: styleVal(raw.fontSize),
    fontWeight: raw.fontWeight,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    letterSpacing: styleVal(raw.letterSpacing),
  };
}

function pickerButtonStyle(raw?: AnyRecord): React.CSSProperties {
  if (!raw || typeof raw !== 'object') return {};
  return {
    backgroundColor: typeof raw.backgroundColor === 'string' ? raw.backgroundColor : undefined,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    borderColor: typeof raw.borderColor === 'string' ? raw.borderColor : undefined,
    borderWidth: styleVal(raw.borderWidth),
    borderRadius: styleVal(raw.borderRadius),
    paddingTop: styleVal(raw.paddingY),
    paddingBottom: styleVal(raw.paddingY),
    paddingLeft: styleVal(raw.paddingX),
    paddingRight: styleVal(raw.paddingX),
    padding: styleVal(raw.padding),
    width: styleVal(raw.width),
    height: styleVal(raw.height),
    ...pickerFontStyle(raw),
  };
}

export const registry: Record<string, React.FC<{ element: any; children?: React.ReactNode; data?: AnyRecord; onAction?: (action: any) => void }>> = {
  Card: ({ element, children }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(theme.components?.Card || {}, element?.props || {}) as AnyRecord;
    const title = p.title ?? "";
    const titleStyle = applyH1FromCssVars(normalizeTitleStyle(p.titleStyle), theme.cssVars) as React.CSSProperties | undefined;
    const css = (theme.cssVars || {}) as AnyRecord;
    const styleBase: React.CSSProperties = {
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderStyle: p.borderStyle || (p.borderWidth ? 'solid' : undefined),
      borderRadius: p.borderRadius,
      margin: styleVal(p.margin),
      marginTop: styleVal(p.marginTop),
      marginRight: styleVal(p.marginRight),
      marginBottom: styleVal(p.marginBottom),
      marginLeft: styleVal(p.marginLeft),
      width: styleVal(p.width),
      minWidth: styleVal(p.minWidth),
      maxWidth: styleVal(p.maxWidth),
      minHeight: styleVal(p.minHeight),
      height: styleVal(p.height),
      maxHeight: styleVal(p.maxHeight),
      overflow: p.overflow,
      overflowX: p.overflowX,
      overflowY: p.overflowY,
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
    };
    const style = ensureSurfaceBackground(
      applyBorderFromCssVars(styleBase as any, theme.cssVars),
      theme.cssVars
    ) as React.CSSProperties;
    style.boxShadow = undefined;
    if (p.boxShadow) style.boxShadow = p.boxShadow;
    const contentStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: (p.direction ?? 'column') as any,
      justifyContent: mapJustify(p.justify),
      alignItems: mapAlign(p.align),
      gap: styleVal(p.gap ?? 8),
      flexWrap: p.wrap ? 'wrap' : 'nowrap',
      minWidth: 0,
      boxSizing: 'border-box',
      padding: styleVal(p.padding) || undefined,
      paddingTop: styleVal(p.paddingTop),
      paddingRight: styleVal(p.paddingRight),
      paddingBottom: styleVal(p.paddingBottom),
      paddingLeft: styleVal(p.paddingLeft),
      width: '100%',
      height: '100%',
    };
    return (
      <FrameSurface style={style} frame={p?.frame as AnyRecord} cssVars={theme.cssVars}>
        {title ? (
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              lineHeight: 1.3,
              fontWeight: 600,
              color: css.fg || '#0f172a',
              ...(titleStyle || {}),
            }}
          >
            {title}
          </h3>
        ) : null}
        <div style={contentStyle}>{children}</div>
      </FrameSurface>
    );
  },
  Text: ({ element, children }) => {
    const theme = useThemeOverrides();
    const textTheme = ((((theme.components as any)?.Text || {}) as AnyRecord));
    const p = deepMerge(textTheme, (element?.props || {}) as AnyRecord) as AnyRecord;
    const text = String(p.text ?? p.title ?? '').trim();
    const titleStyle = (normalizeTitleStyle(p.titleStyle) || {}) as React.CSSProperties;
    const css = (theme.cssVars || {}) as AnyRecord;
    const style: React.CSSProperties = {
      margin: 0,
      color: css.headerSubtitle || css.headerSubtitleColor || '#4b5563',
      fontSize: '14px',
      lineHeight: 1.7,
      fontWeight: 400,
      whiteSpace: 'normal',
      ...(titleStyle || {}),
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    return <p style={style}>{text || children}</p>;
  },
  Bold: ({ element, children }) => {
    const theme = useThemeOverrides();
    const p = ((element?.props || {}) as AnyRecord);
    const titleStyle = (normalizeTitleStyle(p.titleStyle) || {}) as React.CSSProperties;
    return (
      <strong
        style={{
          fontWeight: 600,
          ...(titleStyle || {}),
          ...((p.style && typeof p.style === 'object') ? p.style : {}),
        }}
      >
        {children}
      </strong>
    );
  },
  TextNode: ({ element }) => {
    const text = String((element?.props as AnyRecord | undefined)?.text ?? '');
    return text || null;
  },
  Br: () => {
    return <br />;
  },
  List: ({ element, children }) => {
    const p = (element?.props || {}) as AnyRecord;
    const variant = String(p.variant || 'bullet');
    const itemGap = styleVal(p.gap) || '10px';
    const itemTextStyle: React.CSSProperties = {
      ...((normalizeTitleStyle(p.itemTitleStyle) || {}) as React.CSSProperties),
      ...((p.itemStyle && typeof p.itemStyle === 'object') ? p.itemStyle : {}),
    };
    const listStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: itemGap,
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    const childDefs: AnyRecord[] = Array.isArray((element as any)?.children) ? (element as any).children : [];
    return (
      <div style={listStyle}>
        {React.Children.toArray(children).map((child, index) => {
          const childDef = childDefs[index] || {};
          const childProps = (childDef?.props || {}) as AnyRecord;
          const markerColor = String(childProps.iconColor || p.iconColor || p.markerColor || '#4b5563');
          const iconName = String(childProps.icon || p.icon || '').trim();
          let marker: React.ReactNode = <span style={{ color: markerColor, fontSize: '16px', lineHeight: 1 }}>•</span>;
          if (variant === 'numbered') {
            marker = <span style={{ color: markerColor, fontSize: '13px', fontWeight: 600, lineHeight: 1 }}>{index + 1}.</span>;
          } else if (variant === 'check') {
            marker = <BadgeCheck size={16} style={{ color: markerColor }} />;
          } else if (variant === 'icon') {
            const IconComp = iconMap[normalizeIconKey(iconName)] || Sparkles;
            marker = <IconComp size={16} style={{ color: markerColor }} />;
          }
          return (
            <div key={`list-item-${index}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '16px', minWidth: '16px', display: 'flex', justifyContent: 'center', paddingTop: '2px' }}>{marker}</div>
              <div style={{ minWidth: 0, ...itemTextStyle, ...((normalizeTitleStyle(childProps.titleStyle) || {}) as React.CSSProperties), ...((childProps.style && typeof childProps.style === 'object') ? childProps.style : {}) }}>{child}</div>
            </div>
          );
        })}
      </div>
    );
  },
  ListItem: ({ children }) => {
    return <>{children}</>;
  },
  Icon: ({ element }) => {
    const theme = useThemeOverrides();
    const p = (element?.props || {}) as AnyRecord;
    const IconComp = iconMap[normalizeIconKey(p.name)] || CircleHelp;
    const sizeRaw = Number(p.size);
    const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 18;
    const strokeWidthRaw = Number(p.strokeWidth);
    const strokeWidth = Number.isFinite(strokeWidthRaw) && strokeWidthRaw > 0 ? strokeWidthRaw : 2;
    const color = typeof p.color === 'string' && p.color.trim() ? p.color : (((theme.cssVars || {}) as AnyRecord).fg || '#0f172a');
    const style: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderStyle: p.borderWidth ? 'solid' : undefined,
      borderWidth: p.borderWidth,
      borderRadius: styleVal(p.borderRadius ?? p.radius),
      padding: styleVal(p.padding),
      color,
      flexShrink: 0,
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    return (
      <span style={style}>
        <IconComp size={size} strokeWidth={strokeWidth} />
      </span>
    );
  },

  Image: ({ element }) => {
    const p = (element?.props || {}) as AnyRecord;
    const style: React.CSSProperties = {
      display: 'block',
      width: styleVal(p.width),
      height: styleVal(p.height),
      minWidth: styleVal(p.minWidth),
      maxWidth: styleVal(p.maxWidth),
      minHeight: styleVal(p.minHeight),
      maxHeight: styleVal(p.maxHeight),
      margin: styleVal(p.margin),
      marginTop: styleVal(p.marginTop),
      marginRight: styleVal(p.marginRight),
      marginBottom: styleVal(p.marginBottom),
      marginLeft: styleVal(p.marginLeft),
      borderColor: p.borderColor,
      borderWidth: styleVal(p.borderWidth),
      borderStyle: p.borderWidth ? 'solid' : undefined,
      borderRadius: styleVal(p.borderRadius),
      boxShadow: p.boxShadow,
      backgroundColor: p.backgroundColor,
      objectFit: (p.objectFit || p.fit || 'cover') as any,
      overflow: 'hidden',
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
    };
    return <img src={String(p.src || '')} alt={String(p.alt || '')} style={style} />;
  },

  Divider: ({ element }) => {
    const p = (element?.props || {}) as AnyRecord;
    const label = String(p.label || '').trim();
    const lineColor = String(p.color || '#D9DDE5');
    const thickness = styleVal(p.height ?? p.thickness) || '1px';
    const labelStyle: React.CSSProperties = {
      ...((normalizeTitleStyle(p.titleStyle) || {}) as React.CSSProperties),
      ...((p.labelStyle && typeof p.labelStyle === 'object') ? p.labelStyle : {}),
    };
    const wrapStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: styleVal(p.width) || '100%',
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    const lineStyle: React.CSSProperties = {
      flex: 1,
      height: thickness,
      backgroundColor: lineColor,
      borderRadius: thickness,
    };
    if (!label) return <div style={{ ...wrapStyle, gap: 0 }}><div style={lineStyle} /></div>;
    return (
      <div style={wrapStyle}>
        <div style={lineStyle} />
        <span style={{ fontSize: '11px', color: '#7B8190', letterSpacing: '0.04em', textTransform: 'uppercase', ...(labelStyle || {}) }}>{label}</span>
        <div style={lineStyle} />
      </div>
    );
  },

  Callout: ({ element, children }) => {
    const p = (element?.props || {}) as AnyRecord;
    const text = String(p.text || '').trim();
    const title = String(p.title || '').trim();
    const IconComp = p.icon ? (iconMap[normalizeIconKey(p.icon)] || Sparkles) : null;
    const boxStyle: React.CSSProperties = {
      backgroundColor: p.backgroundColor || '#F7F9FC',
      borderColor: p.borderColor || '#E3E8F1',
      borderWidth: styleVal(p.borderWidth ?? 1),
      borderStyle: (p.borderWidth ?? 1) ? 'solid' : undefined,
      borderRadius: styleVal(p.borderRadius ?? 18),
      padding: styleVal(p.padding ?? 18),
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    const titleStyle: React.CSSProperties = {
      ...((normalizeTitleStyle(p.titleStyle) || {}) as React.CSSProperties),
      ...((p.headerStyle && typeof p.headerStyle === 'object') ? p.headerStyle : {}),
    };
    const textStyle: React.CSSProperties = {
      ...((normalizeTitleStyle(p.textStyle) || {}) as React.CSSProperties),
      ...((p.bodyStyle && typeof p.bodyStyle === 'object') ? p.bodyStyle : {}),
    };
    return (
      <div style={boxStyle}>
        {(title || IconComp) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: text || children ? '8px' : 0 }}>
            {IconComp ? <IconComp size={16} style={{ color: String(p.iconColor || '#2563eb') }} /> : null}
            {title ? <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', ...(titleStyle || {}) }}>{title}</div> : null}
          </div>
        ) : null}
        {text ? <div style={{ fontSize: '14px', lineHeight: 1.65, color: '#4B5563', ...(textStyle || {}) }}>{text}</div> : null}
        {!text ? children : null}
      </div>
    );
  },

  Badge: ({ element }) => {
    const p = (element?.props || {}) as AnyRecord;
    const text = String(p.text ?? p.title ?? '').trim();
    const IconComp = p.icon ? (iconMap[normalizeIconKey(p.icon)] || Sparkles) : null;
    const textStyle = (normalizeTitleStyle(p.titleStyle) || {}) as React.CSSProperties;
    const style: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: p.backgroundColor || '#F3F5F8',
      borderColor: p.borderColor || '#D7DCE5',
      borderWidth: styleVal(p.borderWidth ?? 1),
      borderStyle: (p.borderWidth ?? 1) ? 'solid' : undefined,
      borderRadius: styleVal(p.borderRadius ?? 999),
      padding: styleVal(p.padding) || undefined,
      paddingTop: styleVal(p.paddingTop ?? p.paddingY ?? 4),
      paddingBottom: styleVal(p.paddingBottom ?? p.paddingY ?? 4),
      paddingLeft: styleVal(p.paddingLeft ?? p.paddingX ?? 10),
      paddingRight: styleVal(p.paddingRight ?? p.paddingX ?? 10),
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
      ...resolveTextSpacingStyle(p),
    };
    return (
      <div style={style}>
        {IconComp ? <IconComp size={14} style={{ color: String(p.iconColor || '#4B5563') }} /> : null}
        <span style={{ fontSize: '12px', lineHeight: 1, color: '#4B5563', ...(textStyle || {}) }}>{text}</span>
      </div>
    );
  },

  Tab: ({ element }) => {
    const { data, setData } = useData();
    const p = deepMerge(defaultTab as AnyRecord, (element?.props || {}) as AnyRecord) as AnyRecord;
    const id = String(p.id || p.label || '').trim();
    const label = String(p.label || p.id || '').trim();
    const activeTab = typeof data?.ui?.activeTab === 'string' ? data.ui.activeTab.trim() : '';
    const isActive = Boolean(id) && activeTab === id;

    React.useEffect(() => {
      if (!id) return;
      setData((prev) => {
        const current = typeof (prev as AnyRecord)?.ui?.activeTab === 'string'
          ? ((prev as AnyRecord).ui.activeTab as string).trim()
          : '';
        if (current) return prev as AnyRecord;
        return setDataByPath((prev || {}) as AnyRecord, 'ui.activeTab', id);
      });
    }, [id, setData]);

    const style: React.CSSProperties = {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: styleVal(p.padding),
      margin: styleVal(p.margin),
      backgroundColor: isActive ? p.activeBackgroundColor : p.backgroundColor,
      color: isActive ? p.activeTextColor : p.textColor,
      borderColor: isActive ? p.activeBorderColor : p.borderColor,
      borderStyle: Number(p.borderWidth) ? 'solid' : undefined,
      borderWidth: p.borderWidth,
      borderRadius: styleVal(p.radius),
      fontSize: styleVal(p.fontSize),
      fontWeight: p.fontWeight,
      cursor: 'pointer',
      transition: 'background-color 120ms ease, color 120ms ease, border-color 120ms ease',
    };

    if (!id || !label) return null;

    return (
      <button
        type="button"
        style={style}
        onClick={() => setData((prev) => setDataByPath((prev || {}) as AnyRecord, 'ui.activeTab', id))}
      >
        {label}
      </button>
    );
  },

  Header: ({ element, children, onAction }) => {
    const theme = useThemeOverrides();
    const css = (theme.cssVars || {}) as AnyRecord;
    const p = deepMerge(deepMerge(defaultHeader as any, (theme.components?.Header || {}) as any), (element?.props || {}) as any) as AnyRecord;
    const direction = (p.direction ?? 'row') as 'row' | 'column';
    const justify = (p.justify ?? (direction === 'row' ? 'between' : 'start')) as 'start'|'center'|'end'|'between'|'around'|'evenly';
    const align = (p.align ?? (direction === 'row' ? 'center' : 'start')) as 'start'|'center'|'end'|'stretch'|'left'|'right';
    const layoutGap = styleVal(p.gap ?? (direction === 'row' ? 12 : 8));
    const containerStyle: React.CSSProperties = {
      backgroundColor: p.backgroundColor,
      color: p.textColor,
      padding: styleVal(p.padding),
      margin: styleVal(p.margin),
      borderColor: p.borderColor,
      borderStyle: 'solid',
      borderWidth: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: p.borderBottomWidth ?? p.borderWidth ?? 1,
      borderLeftWidth: 0,
      borderRadius: 0,
      width: styleVal(p.width),
      height: styleVal(p.height),
    };
    const wrappedStyle = ensureSurfaceBackground(
      applyBorderFromCssVars(containerStyle as any, theme.cssVars),
      theme.cssVars
    ) as React.CSSProperties;
    const requestedBottom = Number(p.borderBottomWidth ?? p.borderWidth ?? wrappedStyle.borderBottomWidth ?? wrappedStyle.borderWidth ?? 1);
    const bottomWidth = Number.isFinite(requestedBottom) && requestedBottom > 0 ? requestedBottom : 0;
    wrappedStyle.borderStyle = bottomWidth > 0 ? 'solid' : 'none';
    wrappedStyle.borderWidth = 0;
    wrappedStyle.borderTopWidth = 0;
    wrappedStyle.borderRightWidth = 0;
    wrappedStyle.borderBottomWidth = bottomWidth;
    wrappedStyle.borderLeftWidth = 0;
    wrappedStyle.borderRadius = 0;
    wrappedStyle.borderTopLeftRadius = 0;
    wrappedStyle.borderTopRightRadius = 0;
    wrappedStyle.borderBottomRightRadius = 0;
    wrappedStyle.borderBottomLeftRadius = 0;
    wrappedStyle.boxShadow = undefined;
    const dp = p.datePicker || {};
    const showPicker = Boolean(dp.visible);
    const mode = (dp.mode ?? 'range') as 'range'|'single';
    const storePath = typeof dp.storePath === 'string' ? dp.storePath : undefined;
    const dateTable = typeof dp.table === 'string' ? dp.table.trim() : '';
    const dateField = typeof dp.field === 'string' ? dp.field.trim() : '';
    const isSemanticDatePicker = Boolean(dateTable && dateField);
    const format = (typeof dp.format === 'string' && dp.format) ? dp.format : 'YYYY-MM-DD';
    const legacyPickerTextStyle = ({
      fontFamily: typeof (dp.style as any)?.fontFamily === 'string' ? (dp.style as any).fontFamily : undefined,
      fontSize: styleVal((dp.style as any)?.fontSize),
      color: typeof (dp.style as any)?.color === 'string' ? (dp.style as any).color : undefined,
    }) as React.CSSProperties;
    const explicitPickerTextStyle = pickerFontStyle((dp.style as any)?.textStyle as AnyRecord);
    const pickerTextStyle = ({
      ...legacyPickerTextStyle,
      ...explicitPickerTextStyle,
    }) as React.CSSProperties;
    const baseDateLabelStyle = applyDatePickerLabelFromCssVars(normalizeTitleStyle((dp.style as any)?.labelStyle), theme.cssVars) as React.CSSProperties | undefined;
    const dateLabelStyle = ({
      ...pickerTextStyle,
      ...baseDateLabelStyle,
      color: baseDateLabelStyle?.color || pickerTextStyle.color || css.headerDpLabel || p.subtitleColor,
    }) as React.CSSProperties;
    const baseDateFieldStyle = applyDatePickerFieldFromCssVars(undefined, theme.cssVars) as React.CSSProperties | undefined;
    const dateFieldStyle = ({
      ...pickerTextStyle,
      ...baseDateFieldStyle,
      backgroundColor: baseDateFieldStyle?.backgroundColor || css.headerDpBg,
      color: baseDateFieldStyle?.color || pickerTextStyle.color || css.headerDpColor || p.textColor,
      borderColor: baseDateFieldStyle?.borderColor || css.headerDpBorder || p.borderColor,
    }) as React.CSSProperties;
    const dateIconStyle = ({
      color: css.headerDpIcon || css.headerDpColor || p.textColor,
    }) as React.CSSProperties;
    const dateFieldOverride = applyDatePickerFieldFromCssVars((dp.style as any)?.fieldStyle, undefined) as React.CSSProperties | undefined;
    const { data, setData, getValueByPath } = useData();
    const [customPickerOpen, setCustomPickerOpen] = React.useState(false);
    const customPickerRef = React.useRef<HTMLDivElement>(null);
    function toISO(d: Date) { return d.toISOString().slice(0,10); }
    function fmt(d?: string) { return d || ''; }
    function getDefaultRange() {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toISO(from), to: toISO(to) };
    }
    function getPresetRange(preset: '7d' | '14d' | '30d' | '90d' | 'month') {
      const today = new Date();
      if (preset === 'month') return { from: toISO(startOfMonth(today)), to: toISO(endOfMonth(today)) };
      const days = Number.parseInt(preset, 10);
      const from = addDays(today, -(days - 1));
      return { from: toISO(from), to: toISO(today) };
    }
    function isSameRange(a?: { from?: string; to?: string }, b?: { from?: string; to?: string }) {
      return String(a?.from || '') === String(b?.from || '') && String(a?.to || '') === String(b?.to || '');
    }
    function setByPath(prev: any, path: string, value: any) {
      if (!path) return prev;
      const parts = path.split('.').map(s => s.trim()).filter(Boolean);
      const root = Array.isArray(prev) ? [...prev] : { ...(prev || {}) };
      let curr: any = root;
      for (let i = 0; i < parts.length; i++) {
        const k = parts[i];
        if (i === parts.length - 1) {
          if (value === undefined) delete curr[k];
          else curr[k] = value;
        } else {
          curr[k] = typeof curr[k] === 'object' && curr[k] !== null ? { ...curr[k] } : {};
          curr = curr[k];
        }
      }
      return root;
    }
    function buildDateFilterMeta(value: any) {
      if (!isSemanticDatePicker) return undefined;
      if (mode === 'single') {
        const singleValue = typeof value === 'string' ? value : '';
        return {
          table: dateTable,
          field: dateField,
          mode: 'single',
          ...(singleValue ? { value: singleValue } : {}),
        };
      }
      const range = value && typeof value === 'object' ? value : {};
      const from = fmt((range as any).from);
      const to = fmt((range as any).to);
      return {
        table: dateTable,
        field: dateField,
        mode: 'range',
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      };
    }
    function resolveStoredDatePickerValue() {
      if (storePath) return getValueByPath(storePath, undefined);
      if (!isSemanticDatePicker) return undefined;
      const raw = getValueByPath('filters.__date', undefined);
      const marker = Array.isArray(raw)
        ? raw.find((entry) => entry?.table === dateTable && entry?.field === dateField)
        : raw;
      if (!marker || marker.table !== dateTable || marker.field !== dateField) return undefined;
      if (mode === 'single') return typeof marker.value === 'string' ? marker.value : undefined;
      return {
        from: fmt(marker.from),
        to: fmt(marker.to),
      };
    }
    function buildDatePickerAction(value: any) {
      if (!dp.actionOnChange || typeof dp.actionOnChange !== 'object') return null;
      const dateFilter = buildDateFilterMeta(value);
      const dateRange = mode === 'single'
        ? (() => {
            const selected = typeof value === 'string' ? value : '';
            return selected ? { from: selected, to: selected } : undefined;
          })()
        : (() => {
            const range = value && typeof value === 'object' ? value : {};
            const from = fmt((range as any).from);
            const to = fmt((range as any).to);
            return from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined;
          })();
      return {
        ...(dp.actionOnChange as AnyRecord),
        ...(dateRange ? { dateRange } : {}),
        ...(dateFilter ? { dateFilter } : {}),
      };
    }
    function setDatePickerValue(value: any) {
      const dateFilter = buildDateFilterMeta(value);
      const action = buildDatePickerAction(value);
      setData((prev) => {
        let next = prev;
        if (storePath) next = setByPath(next, storePath, value);
        if (isSemanticDatePicker) next = setByPath(next, 'filters.__date', dateFilter);
        return next;
      });
      if (action) onAction?.(action);
    }
    React.useEffect(() => {
      if (!customPickerOpen) return;
      function onPointerDown(ev: MouseEvent) {
        const target = ev.target as Node | null;
        if (customPickerRef.current && target && !customPickerRef.current.contains(target)) {
          setCustomPickerOpen(false);
        }
      }
      document.addEventListener('mousedown', onPointerDown);
      return () => document.removeEventListener('mousedown', onPointerDown);
    }, [customPickerOpen]);
    const stored = resolveStoredDatePickerValue();
    let picker: React.ReactNode = null;
    if (showPicker) {
      if (mode === 'range') {
        const curr = (stored && typeof stored === 'object')
          ? { from: fmt((stored as any).from), to: fmt((stored as any).to) }
          : getDefaultRange();
        const presetKeys = (Array.isArray(dp.presets) && dp.presets.length
          ? dp.presets
          : ['7d', '14d', '30d']) as Array<'7d' | '14d' | '30d' | '90d' | 'month'>;
        const activePreset = presetKeys.find((preset) => isSameRange(curr, getPresetRange(preset)));
        const setRange = (range: { from: string; to: string }) => setDatePickerValue(range);
        const presetButtonStyleRaw = pickerButtonStyle((dp.style as any)?.presetButtonStyle as AnyRecord);
        const activePresetButtonStyleRaw = pickerButtonStyle((dp.style as any)?.activePresetButtonStyle as AnyRecord);
        const calendarButtonStyleRaw = pickerButtonStyle((dp.style as any)?.calendarButtonStyle as AnyRecord);
        const popoverStyleRaw = pickerButtonStyle((dp.style as any)?.popoverStyle as AnyRecord);
        const presetButtonStyle = (active: boolean): React.CSSProperties => ({
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 32,
          padding: '0 10px',
          borderRadius: 8,
          border: `1px solid ${active ? (css.headerDpBorder || '#c7d2fe') : (css.headerDpBorder || '#d1d5db')}`,
          backgroundColor: active ? (css.headerDpBg || '#eff6ff') : 'transparent',
          color: active ? (css.headerDpColor || css.headerDpIcon || '#0f172a') : (css.headerDpColor || '#4b5563'),
          fontSize: 12,
          fontWeight: active ? 600 : 500,
          lineHeight: 1,
          cursor: 'pointer',
          transition: 'all 120ms ease',
          ...pickerTextStyle,
          ...presetButtonStyleRaw,
          ...(active ? activePresetButtonStyleRaw : {}),
          borderStyle: 'solid',
        });
        const calendarButtonStyle: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${css.headerDpBorder || '#d1d5db'}`,
          backgroundColor: customPickerOpen ? (css.headerDpBg || '#eff6ff') : 'transparent',
          color: css.headerDpIcon || css.headerDpColor || '#4b5563',
          cursor: 'pointer',
          ...pickerTextStyle,
          ...calendarButtonStyleRaw,
          borderStyle: 'solid',
        };
        const customPopoverStyle: React.CSSProperties = {
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 30,
          minWidth: 250,
          padding: 12,
          borderRadius: 10,
          border: `1px solid ${css.headerDpBorder || '#d1d5db'}`,
          backgroundColor: css.headerDpBg || '#ffffff',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          ...popoverStyleRaw,
          borderStyle: 'solid',
        };
        picker = (
          <div className="flex items-center gap-2">
            {presetKeys.map((preset) => (
              <button
                key={preset}
                type="button"
                style={presetButtonStyle(activePreset === preset)}
                onClick={() => {
                  setRange(getPresetRange(preset));
                  setCustomPickerOpen(false);
                }}
              >
                {preset}
              </button>
            ))}
            <div ref={customPickerRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Abrir período customizado"
                style={calendarButtonStyle}
                onClick={() => setCustomPickerOpen((prev) => !prev)}
              >
                <Calendar size={16} />
              </button>
              {customPickerOpen ? (
                <div style={customPopoverStyle}>
                  <div className="flex items-center gap-2">
                    <DateFieldWithIcon
                      value={curr.from}
                      onChange={(val: string) => setRange({ from: val, to: curr.to })}
                      fieldStyle={{ ...dateFieldStyle, ...dateFieldOverride }}
                      iconStyleOverride={dateIconStyle}
                    />
                    <span className="text-xs" style={dateLabelStyle}>até</span>
                    <DateFieldWithIcon
                      value={curr.to}
                      onChange={(val: string) => setRange({ from: curr.from, to: val })}
                      fieldStyle={{ ...dateFieldStyle, ...dateFieldOverride }}
                      iconStyleOverride={dateIconStyle}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      } else {
        const curr = (stored && typeof stored === 'string') ? stored : getDefaultRange().from;
        picker = (
          <div className="flex items-center gap-2">
            <DateFieldWithIcon
              value={curr}
              onChange={(val: string) => {
                setDatePickerValue(val);
              }}
              fieldStyle={{ ...dateFieldStyle, ...dateFieldOverride }}
              iconStyleOverride={dateIconStyle}
            />
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
          const src =
            (s?.source && typeof s.source === 'object')
              ? (s.source as AnyRecord)
              : (typeof s?.query === 'string' && s.query.trim()
                  ? ({ query: s.query, ...(Number.isFinite(Number(s?.limit)) ? { limit: Number(s.limit) } : {}) } as AnyRecord)
                  : null);
          if (!src || typeof src !== 'object') return { idx, opts: [] as Opt[] };
          const opts = await fetchOptionsFromSource(src, { data, readByPath: getValueByPath });
          return { idx, opts };
        }));
        if (cancelled) return;
        const map: Record<number, Opt[]> = {};
        for (const t of tasks) if (t.status === 'fulfilled') { map[(t.value as any).idx] = (t.value as any).opts }
        setOptionsMap(map);
      }
      run();
      return () => { cancelled = true };
    }, [JSON.stringify(slicers), JSON.stringify(data)]);

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
        const sp = resolveSlicerStorePath(s as AnyRecord);
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
                  const tileCfg = (((theme as any).components?.Filter as any)?.tile) || {};
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

    const hasChildren = React.Children.count(children) > 0;
    const fallbackTitle = typeof p.title === 'string' && p.title.trim() ? p.title.trim() : '';
    const fallbackSubtitle = typeof p.subtitle === 'string' && p.subtitle.trim() ? p.subtitle.trim() : '';
    const fallbackHeaderTitleStyle = (() => {
      const s = applyH1FromCssVars({ color: p.textColor }, theme.cssVars) || {};
      (s as AnyRecord).color = p.textColor;
      return s as React.CSSProperties;
    })();
    const fallbackSubtitleStyle: React.CSSProperties = {
      color: p.subtitleColor,
      fontSize: '12px',
      lineHeight: 1.4,
    };
    const fallbackContent = (!hasChildren && (fallbackTitle || fallbackSubtitle)) ? (
      <div style={{ padding: '3px 6px', textAlign: 'left', minWidth: 0 }}>
        {fallbackTitle ? (
          <div style={{ fontSize: '20px', lineHeight: 1.3, fontWeight: 600, ...fallbackHeaderTitleStyle }}>
            {fallbackTitle}
          </div>
        ) : null}
        {fallbackSubtitle ? <div style={{ marginTop: '2px', ...fallbackSubtitleStyle }}>{fallbackSubtitle}</div> : null}
      </div>
    ) : null;

    return (
      <div className="rounded-md" style={wrappedStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: direction,
            justifyContent: mapJustify(justify),
            alignItems: mapAlign(align),
            gap: layoutGap,
            width: '100%',
          }}
        >
          {hasChildren ? children : fallbackContent}
          {controls}
        </div>
      </div>
    );
  },

  Container: ({ element, children }) => {
    const theme = useThemeOverrides();
    const containerTheme = ((theme.components as any)?.Container || {}) as AnyRecord;
    const p = deepMerge(deepMerge(defaultDiv as any, containerTheme), (element?.props || {}) as any) as AnyRecord;
    const style: React.CSSProperties = {
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: (p.direction ?? 'column') as any,
      gap: styleVal(p.gap),
      flexWrap: p.wrap ? 'wrap' : 'nowrap',
      justifyContent: mapJustify(p.justify),
      alignItems: mapAlign(p.align),
      padding: styleVal(p.padding),
      paddingTop: styleVal(p.paddingTop),
      paddingRight: styleVal(p.paddingRight),
      paddingBottom: styleVal(p.paddingBottom),
      paddingLeft: styleVal(p.paddingLeft),
      margin: styleVal(p.margin),
      marginTop: styleVal(p.marginTop),
      marginRight: styleVal(p.marginRight),
      marginBottom: styleVal(p.marginBottom),
      marginLeft: styleVal(p.marginLeft),
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderStyle: p.borderStyle || (p.borderWidth ? 'solid' : undefined),
      borderRadius: p.borderRadius,
      boxShadow: p.boxShadow,
      width: styleVal(p.width),
      minWidth: styleVal(p.minWidth),
      maxWidth: styleVal(p.maxWidth),
      minHeight: styleVal(p.minHeight),
      height: styleVal(p.height),
      maxHeight: styleVal(p.maxHeight),
      overflow: p.overflow,
      overflowX: p.overflowX,
      overflowY: p.overflowY,
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
    };
    const childDefs: AnyRecord[] = Array.isArray((element as any)?.children) ? (element as any).children : [];
    const itemStyles = childDefs.map((ch) => resolveFlexItemStyle((ch?.props as AnyRecord) || {}));
    const hasItemSizing = itemStyles.some((s) => Object.keys(s).length > 0);

    if (!hasItemSizing) {
      return (
        <div style={style}>
          {children}
        </div>
      );
    }

    const kids = React.Children.toArray(children);
    const wrapped = kids.map((c, i) => {
      const childDef = childDefs[i] || {};
      const childType = String(childDef?.type || '');
      const isRow = (p.direction ?? 'column') === 'row';
      const isSidebarChild = childType === 'Sidebar';
      const itemStyle = itemStyles[i] || {};
      const childWrapStyle: React.CSSProperties = { ...itemStyle };
      if (isRow && isSidebarChild) {
        childWrapStyle.display = 'flex';
        childWrapStyle.alignSelf = 'stretch';
        childWrapStyle.minHeight = 0;
      }
      if (isRow && (Number(childWrapStyle.flexGrow) > 0 || Number(childWrapStyle.flexBasis) === 0)) {
        childWrapStyle.minWidth = 0;
      }
      if (!isRow) {
        childWrapStyle.width = '100%';
      }
      return (
        <div key={i} style={childWrapStyle}>
          {c}
        </div>
      );
    });
    return (
      <div style={style}>
        {wrapped}
      </div>
    );
  },
  Sidebar: ({ element, children }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(
      deepMerge(defaultSidebar as AnyRecord, (((theme.components as any)?.Sidebar || {}) as AnyRecord)),
      (element?.props || {}) as AnyRecord,
    ) as AnyRecord;

    const styleBase: React.CSSProperties = {
      display: 'flex',
      flexDirection: (p.direction ?? 'column') as any,
      gap: styleVal(p.gap),
      justifyContent: mapJustify(p.justify),
      alignItems: mapAlign(p.align),
      padding: styleVal(p.padding),
      paddingTop: styleVal(p.paddingTop),
      paddingRight: styleVal(p.paddingRight),
      paddingBottom: styleVal(p.paddingBottom),
      paddingLeft: styleVal(p.paddingLeft),
      margin: styleVal(p.margin),
      marginTop: styleVal(p.marginTop),
      marginRight: styleVal(p.marginRight),
      marginBottom: styleVal(p.marginBottom),
      marginLeft: styleVal(p.marginLeft),
      width: styleVal(p.width),
      minWidth: styleVal(p.minWidth),
      maxWidth: styleVal(p.maxWidth),
      minHeight: styleVal(p.minHeight),
      maxHeight: styleVal(p.maxHeight),
      height: styleVal(p.height),
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderStyle: p.borderStyle || (p.borderWidth ? 'solid' : undefined),
      borderWidth: p.borderWidth,
      borderRadius: p.borderRadius,
      boxShadow: p.boxShadow,
      position: p.sticky ? 'sticky' : undefined,
      top: p.sticky ? styleVal(p.top ?? 12) : undefined,
      overflow: p.overflow,
      overflowY: p.overflowY,
      overflowX: p.overflowX,
      boxSizing: 'border-box',
      ...((p.style && typeof p.style === 'object') ? p.style : {}),
    };
    const style = ensureSurfaceBackground(
      applyBorderFromCssVars(styleBase as AnyRecord, theme.cssVars),
      theme.cssVars
    ) as React.CSSProperties;
    if (style) (style as AnyRecord).boxShadow = undefined;

    return (
      <FrameSurface style={style} frame={p?.frame as AnyRecord} cssVars={theme.cssVars}>
        {children}
      </FrameSurface>
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


  BarChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultBarChart as any, (theme.components?.BarChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderBarChart element={{ props: merged }} />;
  },
  HorizontalBarChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultBarChart as any, ((theme.components as any)?.HorizontalBarChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderHorizontalBarChart element={{ props: merged }} />;
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
  ScatterChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultScatterChart as any, ((theme.components as any)?.ScatterChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderScatterChart element={{ props: merged }} />;
  },
  RadarChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultRadarChart as any, ((theme.components as any)?.RadarChart || {}) as any), (element?.props || {}) as any);
    return <JsonRenderRadarChart element={{ props: merged }} />;
  },
  TreemapChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultTreemapChart as any, ((theme.components as any)?.TreemapChart || {}) as AnyRecord), (element?.props || {}) as AnyRecord);
    return <JsonRenderTreemapChart element={{ props: merged }} />;
  },
  ComposedChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultComposedChart as any, ((theme.components as any)?.ComposedChart || {}) as AnyRecord), (element?.props || {}) as AnyRecord);
    return <JsonRenderComposedChart element={{ props: merged }} />;
  },
  FunnelChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultFunnelChart as any, ((theme.components as any)?.FunnelChart || {}) as AnyRecord), (element?.props || {}) as AnyRecord);
    return <JsonRenderFunnelChart element={{ props: merged }} />;
  },
  SankeyChart: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(deepMerge(defaultSankeyChart as any, ((theme.components as any)?.SankeyChart || {}) as AnyRecord), (element?.props || {}) as AnyRecord);
    return <JsonRenderSankeyChart element={{ props: merged }} />;
  },
  Table: ({ element }) => {
    const merged = deepMerge(
      defaultTable as any,
      (element?.props || {}) as AnyRecord
    );
    return <JsonRenderTable element={{ props: merged }} />;
  },
  PivotTable: ({ element }) => {
    const theme = useThemeOverrides();
    const merged = deepMerge(
      deepMerge(defaultPivotTable as any, ((theme.components as any)?.PivotTable || {}) as AnyRecord),
      (element?.props || {}) as AnyRecord
    );
    return <JsonRenderPivotTable element={{ props: merged }} />;
  },

  Gauge: ({ element }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultGauge as any, ((theme.components as any)?.Gauge || {}) as AnyRecord), (element?.props || {}) as any) as AnyRecord;
    return <JsonRenderGauge element={{ props: p }} />;
  },

  AISummary: ({ element }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultAISummary as any, ((theme.components as any)?.AISummary || {}) as AnyRecord), (element?.props || {}) as AnyRecord) as AnyRecord;
    const items = Array.isArray(p.items) ? p.items as AnyRecord[] : [];
    const itemTextStyle = applySlicerOptionFromCssVars(normalizeTitleStyle(p.itemTextStyle), theme.cssVars) as React.CSSProperties | undefined;
    const itemGap = Number.isFinite(Number(p.itemGap)) ? Number(p.itemGap) : 10;
    const contentPaddingX = styleVal(p.contentPaddingX) || '12px';
    const contentPaddingBottom = styleVal(p.contentPaddingBottom) || '10px';
    const iconGap = Number.isFinite(Number(p.iconGap)) ? Number(p.iconGap) : 10;
    const iconBoxSize = Number.isFinite(Number(p.iconBoxSize)) ? Number(p.iconBoxSize) : 30;
    const iconSize = Number.isFinite(Number(p.iconSize)) ? Number(p.iconSize) : 16;
    const iconBoxRadius = styleVal(p.iconBoxRadius) || '8px';

    let managedScheme: string[] | undefined = undefined;
    const rawVar = (theme.cssVars || {}).chartColorScheme as unknown as string | undefined;
    if (rawVar) {
      try { managedScheme = JSON.parse(rawVar); }
      catch { managedScheme = rawVar.split(',').map((s) => s.trim()).filter(Boolean); }
    }
    const explicitScheme = Array.isArray(p.colorScheme) ? p.colorScheme.map(String) : (typeof p.colorScheme === 'string' ? [p.colorScheme] : []);
    const palette = (explicitScheme.length ? explicitScheme : (managedScheme && managedScheme.length ? managedScheme : ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']));

    return (
      <div
        className="flex flex-col"
        style={{ gap: `${itemGap}px`, paddingLeft: contentPaddingX, paddingRight: contentPaddingX, paddingBottom: contentPaddingBottom }}
      >
        {items.map((it, idx) => {
          const IconComp = aiSummaryIconMap[normalizeIconKey(it?.icon)] || Sparkles;
          const accent = String(it?.iconColor || palette[idx % palette.length] || '#3b82f6');
          const bg = String(it?.iconBgColor || hexToRgba(accent, 0.16) || `color-mix(in srgb, ${accent} 16%, transparent)`);
          return (
            <div key={`ai-summary-item-${idx}`} className="flex items-start" style={{ gap: `${iconGap}px` }}>
              <div
                className="inline-flex items-center justify-center shrink-0"
                style={{
                  width: `${iconBoxSize}px`,
                  height: `${iconBoxSize}px`,
                  borderRadius: iconBoxRadius,
                  backgroundColor: bg,
                  border: `1px solid ${hexToRgba(accent, 0.28) || accent}`,
                }}
              >
                <IconComp size={iconSize} style={{ color: accent }} />
              </div>
              <div className="text-sm leading-5 whitespace-pre-wrap break-words" style={itemTextStyle}>
                {String(it?.text || '')}
              </div>
            </div>
          );
        })}
        {items.length === 0 ? (
          <div className="text-xs text-gray-400">Sem itens</div>
        ) : null}
      </div>
    );
  },

  Filter: ({ element, onAction }) => {
    const theme = useThemeOverrides();
    const p = deepMerge((theme.components?.Filter || {}) as AnyRecord, (element?.props || {}) as AnyRecord) as AnyRecord;
    const layout = (p.layout || 'vertical') as 'vertical' | 'horizontal';
    const applyMode = (p.applyMode || 'auto') as 'auto' | 'manual';
    const fields = resolveSlicerDefinitions(element, p);
    return (
      <SlicerContent
        element={{ ...element, props: p }}
        fields={fields}
        layout={layout}
        applyMode={applyMode}
        onAction={onAction}
      />
    );
  },

  SlicerField: () => null,
  OptionList: () => null,
  Select: () => null,

  SlicerCard: ({ element, onAction }) => {
    const theme = useThemeOverrides();
    const p = deepMerge((theme.components?.SlicerCard || {}) as AnyRecord, (element?.props || {}) as AnyRecord) as AnyRecord;
    const title = p.title as string | undefined;
    const borderless = Boolean(p.borderless);
    const containerStyle = ensureSurfaceBackground(applyBorderFromCssVars(normalizeContainerStyle(p.containerStyle, borderless), theme.cssVars), theme.cssVars);
    if (containerStyle) (containerStyle as AnyRecord).boxShadow = undefined;
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
          const src =
            (f?.source && typeof f.source === 'object')
              ? (f.source as AnyRecord)
              : (typeof f?.query === 'string' && f.query.trim()
                  ? ({ query: f.query, ...(Number.isFinite(Number(f?.limit)) ? { limit: Number(f.limit) } : {}) } as AnyRecord)
                  : null);
          if (!src || typeof src !== 'object') return { idx, opts: [] as Opt[] };
          const term = searchMap[idx] || '';
          const opts = await fetchOptionsFromSource(src, { term, data, readByPath: getValueByPath });
          return { idx, opts };
        }))
        if (cancelled) return;
        const map: Record<number, Opt[]> = {};
        for (const t of tasks) if (t.status === 'fulfilled') map[(t.value as any).idx] = (t.value as any).opts;
        setOptionsMap(map);
      }
      load();
      return () => { cancelled = true };
    }, [JSON.stringify(fields), JSON.stringify(searchMap), JSON.stringify(data)]);

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
        const sp = resolveSlicerStorePath(f);
        if (!sp) continue;
        if (pendingMap.hasOwnProperty(i)) next = setByPath(next, sp, pendingMap[i]);
      }
      setData(next);
      if (p.actionOnApply && typeof p.actionOnApply === 'object') onAction?.(p.actionOnApply);
    };

    const card = (
      <FrameSurface style={containerStyle} frame={p?.containerStyle?.frame as AnyRecord} cssVars={theme.cssVars}>
        {title && <div className="mb-0" style={applyH1FromCssVars(undefined, theme.cssVars)}>{title}</div>}
        <div className={(layout === 'horizontal' ? 'flex items-start gap-3 flex-wrap' : 'space-y-3') + ' p-2'}>
          {fields.map((f, idx) => {
            const sp = resolveSlicerStorePath(f);
            if (!sp) return null;
            const lbl = typeof f?.label === 'string' ? f.label : undefined;
            const lblStyle = applySlicerLabelFromCssVars(normalizeTitleStyle((f as any)?.labelStyle), theme.cssVars);
            const opts = optionsMap[idx] || [];
            const width = (f?.width !== undefined) ? (typeof f.width === 'number' ? `${f.width}px` : f.width) : undefined;
            const t = (f?.type || 'list') as 'list'|'dropdown'|'multi'|'tile'|'tile-multi';
            const isMulti = (t === 'tile-multi' || t === 'list' || t === 'multi');
            const stored = effectiveGet(idx, sp, isMulti);
            const clearable = (f?.clearable !== false);
            const selectAll = Boolean(f?.selectAll);
            const showSearch = Boolean(f?.search);

            if (t === 'tile' || t === 'tile-multi') {
              const onClear = () => onChangeField(idx, sp, isMulti ? [] : undefined, f.actionOnChange);
              return (
                <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                  {lbl && !title && <div className="text-xs" style={lblStyle}>{lbl}</div>}
                  <div className="flex flex-col gap-2">
                    {showSearch && (
                      <input
                        type="text"
                        value={searchMap[idx] || ''}
                        onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="Buscar..."
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      {opts.map((o) => {
                        const selected = isMulti ? (Array.isArray(stored) && stored.includes(o.value)) : (stored === o.value);
                        const tileCfgCard = ((((theme as any).components?.SlicerCard as any)?.tile) || (((theme as any).components?.Filter as any)?.tile) || {});
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

            if (t === 'list') {
              const onClear = () => onChangeField(idx, sp, [], f.actionOnChange);
              return (
                <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                  {lbl && !title && <div className="text-xs" style={lblStyle}>{lbl}</div>}
                  <div className="flex flex-col gap-2 p-2">
                    {showSearch && (
                      <input
                        type="text"
                        value={searchMap[idx] || ''}
                        onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="Buscar..."
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    )}
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
                        <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            const val = t === 'multi' ? (Array.isArray(stored) ? stored : []) : (stored ?? '');
            const onClear = () => onChangeField(idx, sp, t === 'multi' ? [] : undefined, f.actionOnChange);
            return (
              <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                {lbl && !title && <div className="text-xs" style={lblStyle}>{lbl}</div>}
                <div className="flex flex-col gap-2">
                  {showSearch && (
                    <input
                      type="text"
                      value={searchMap[idx] || ''}
                      onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Buscar..."
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                  )}
                  <select
                    multiple={t === 'multi'}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                    style={applySlicerOptionFromCssVars(normalizeTitleStyle((f as any)?.optionStyle), theme.cssVars) as any}
                    value={val as any}
                    onChange={(e) => {
                      if (t === 'multi') {
                        const selected: any[] = Array.from(e.target.selectedOptions).map((o) => (o as any).value).map((x) => (String(Number(x)) === x ? Number(x) : x));
                        onChangeField(idx, sp, selected, f.actionOnChange);
                      } else {
                        const v = e.target.value;
                        onChangeField(idx, sp, String(Number(v)) === v ? Number(v) : v, f.actionOnChange);
                      }
                    }}
                  >
                    {(t !== 'multi' && typeof f?.placeholder === 'string' && f.placeholder) && <option value="">{f.placeholder}</option>}
                    {opts.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {clearable && (
                  <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={onClear}>Limpar</button>
                )}
              </div>
            );
          })}
        </div>
        {applyMode === 'manual' && (
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={onApplyAll} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">
              Aplicar
            </button>
          </div>
        )}
      </FrameSurface>
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
        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        {label}
      </button>
    );
  },

  Theme: ({ element, children }) => {
    const name = element?.props?.name as string | undefined;
    const headerTheme = element?.props?.headerTheme as string | undefined;
    const mgr = (element?.props?.managers || {}) as AnyRecord;
    const preset = buildThemeVars(name, mgr as any, { headerTheme });
    const cssVars = preset.cssVars || mapManagersToCssVars(mgr);
    const backgroundPreset = normalizeDashboardBackgroundPreset(
      (mgr as AnyRecord)?.backgroundPreset ?? (cssVars as AnyRecord)?.dashboardBackgroundPreset
    );
    return (
      <ThemeProvider name={name} cssVars={cssVars}>
        <div
          style={{
            position: 'relative',
            isolation: 'isolate',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <DashboardBackgroundLayer preset={backgroundPreset} />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {children}
          </div>
        </div>
      </ThemeProvider>
    );
  },
  KPI: ({ element }) => {
    const theme = useThemeOverrides();
    const p = deepMerge(deepMerge(defaultKPI as any, (theme.components?.Kpi || {}) as any), (element?.props || {}) as any) as AnyRecord;
    const dq = p.dataQuery as AnyRecord;
    const valueKey = (p.valueKey ?? 'value') as string;
    const resultPath = typeof p.resultPath === 'string' && p.resultPath.trim() ? p.resultPath.trim() : '';
    const comparisonMode = typeof p.comparisonMode === 'string' ? p.comparisonMode : undefined;
    const { data, setData } = useData();
    const [serverValue, setServerValue] = React.useState<number>(0);
    const [queryError, setQueryError] = React.useState<string | null>(null);
    React.useEffect(() => {
      let cancelled = false;
      async function run() {
        try {
          const isSqlQueryMode = Boolean(typeof dq?.query === 'string' && dq.query.trim())
          if (!dq || (!isSqlQueryMode && (!dq.model || !dq.measure))) {
            if (!cancelled) {
              setServerValue(0);
              setQueryError(null);
            }
            return;
          }
          if (!cancelled) setQueryError(null);
          const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data);
          const comparisonRange = deriveComparisonRange(comparisonMode, filters.de, filters.ate);
          if (comparisonRange) {
            if (filters.compare_de === undefined) filters.compare_de = comparisonRange.from;
            if (filters.compare_ate === undefined) filters.compare_ate = comparisonRange.to;
            if (filters.comparison_mode === undefined) filters.comparison_mode = comparisonMode;
          }
          const globalFilters = (data as any)?.filters;
          if (globalFilters && typeof globalFilters === 'object') {
            for (const [k, v] of Object.entries(globalFilters)) {
              if (k === 'dateRange') continue;
              if (filters[k as any] === undefined) (filters as any)[k] = v as any;
            }
          }
          const url = isSqlQueryMode
            ? '/api/modulos/query/execute'
            : `/api/modulos/${String(dq.model).split('.')[0]}/query`;
          const body = isSqlQueryMode
            ? {
                dataQuery: {
                  query: dq.query,
                  ...(typeof dq.yField === 'string' && dq.yField.trim() ? { yField: dq.yField.trim() } : {}),
                  ...(typeof dq.xField === 'string' && dq.xField.trim() ? { xField: dq.xField.trim() } : {}),
                  ...(typeof dq.keyField === 'string' && dq.keyField.trim() ? { keyField: dq.keyField.trim() } : {}),
                  filters,
                  limit: dq.limit ?? 1,
                },
              }
            : { dataQuery: { model: dq.model, dimension: undefined, measure: dq.measure, filters, orderBy: dq.orderBy, limit: dq.limit } };
          const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          const j = await res.json();
          if (!res.ok || j?.success === false) {
            throw new Error(String(j?.message || `Query failed (${res.status})`));
          }
          const rows = Array.isArray(j?.rows) ? j.rows : [];
          const firstRow = rows.length > 0 && rows[0] && typeof rows[0] === 'object'
            ? ({ ...(rows[0] as AnyRecord) } as AnyRecord)
            : undefined;
          let val: number = 0;
          if (firstRow) {
            const r0 = firstRow;
            const keys = [valueKey, 'total', 'valor_total', 'faturamento_total', 'gasto_total', 'count', 'value'];
            for (const k of keys) { if (r0[k] != null) { const n = Number(r0[k]); if (Number.isFinite(n)) { val = n; break; } } }
          }
          if (!cancelled) {
            setServerValue(val);
            setQueryError(null);
            if (resultPath) {
              setData((prev) => setDataByPath((prev || {}) as AnyRecord, resultPath, firstRow));
            }
          }
        } catch (e) {
          console.error('[BI/KPI] query failed', e);
          if (!cancelled) {
            setServerValue(0);
            setQueryError(e instanceof Error ? e.message : 'Erro ao executar query');
            if (resultPath) {
              setData((prev) => setDataByPath((prev || {}) as AnyRecord, resultPath, undefined));
            }
          }
        }
      }
      run();
      return () => { cancelled = true };
    }, [JSON.stringify(dq), JSON.stringify((data as any)?.filters), comparisonMode, resultPath]);
    const fmt = (p.format ?? 'number') as 'currency'|'percent'|'number';
    const unit = p.unit as string | undefined;
    const valueStyle = applyKpiValueFromCssVars(normalizeTitleStyle(p.valueStyle), theme.cssVars);
    const valuePath = (p.valuePath as string | undefined) || undefined;
    // Keep hook order stable across renders.
    const valueFromPath = useDataValue(valuePath || '', undefined);
    function formatValue(val: any, fmt: 'currency'|'percent'|'number'): string {
      const n = Number(val ?? 0);
      if (!Number.isFinite(n)) return String(val ?? '');
      switch (fmt) {
        case 'currency': return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);
        case 'percent': return `${(n * 100).toFixed(2)}%`;
        default: return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
      }
    }
    const hasServerQuery = Boolean(dq && ((dq.model && dq.measure) || (typeof dq.query === 'string' && dq.query.trim())));
    const displayValue = hasServerQuery ? serverValue : (valueFromPath ?? 0);
    return (
      <div>
        <div className="text-2xl font-semibold" style={valueStyle}>{formatValue(displayValue, fmt)}{unit ? ` ${unit}` : ''}</div>
        {queryError && <div className="mt-1 text-xs text-red-600">{queryError}</div>}
      </div>
    );
  },
  KPICompare: ({ element }) => {
    const theme = useThemeOverrides();
    const p = (element?.props || {}) as AnyRecord;
    const sourcePath = typeof p.sourcePath === 'string' ? p.sourcePath : '';
    const source = useDataValue(sourcePath, undefined) as AnyRecord | undefined;
    const comparisonValueField = typeof p.comparisonValueField === 'string' ? p.comparisonValueField : 'delta_percent';
    const labelField = typeof p.labelField === 'string' ? p.labelField : 'comparison_label';
    const rawValue = source?.[comparisonValueField];
    const numericValue = Number(rawValue ?? 0);
    const hasNumericValue = Number.isFinite(numericValue);
    const fmt = (p.format ?? 'percent') as 'currency'|'percent'|'number';
    const invertDirection = Boolean(p.invertDirection);
    const signedValue = hasNumericValue ? numericValue : 0;
    const effectiveValue = invertDirection ? signedValue * -1 : signedValue;
    const isPositive = effectiveValue > 0;
    const isNegative = effectiveValue < 0;
    const positiveColor = String(p.positiveColor || '#16a34a');
    const negativeColor = String(p.negativeColor || '#dc2626');
    const neutralColor = String(p.neutralColor || '#6b7280');
    const color = isPositive ? positiveColor : isNegative ? negativeColor : neutralColor;
    const showIcon = Boolean(p.showIcon ?? true);
    const valueStyle = normalizeTitleStyle(p.valueStyle) as React.CSSProperties | undefined;
    const labelStyle = normalizeTitleStyle(p.labelStyle) as React.CSSProperties | undefined;
    const label = String(p.label || source?.[labelField] || '').trim();
    function formatCompareValue(val: number, format: 'currency'|'percent'|'number'): string {
      if (!Number.isFinite(val)) return '0';
      if (format === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val);
      if (format === 'percent') return `${val.toFixed(1)}%`;
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(val);
    }
    const display = `${isPositive ? '+' : ''}${formatCompareValue(signedValue, fmt)}`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {showIcon ? (
          isPositive ? <TrendingUp size={14} color={color} /> : isNegative ? <TrendingDown size={14} color={color} /> : <Activity size={14} color={color} />
        ) : null}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ color, fontSize: '12px', fontWeight: 600, ...(valueStyle || {}) }}>{display}</span>
          {label ? <span style={{ color: neutralColor, fontSize: '12px', ...(labelStyle || {}) }}>{label}</span> : null}
        </div>
      </div>
    );
  },
  Sparkline: ({ element }) => {
    return <JsonRenderSparkline element={element} />;
  },
};
