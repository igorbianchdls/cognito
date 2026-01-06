'use client';

import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';
import type { StackedBarChartConfig } from '@/stores/apps/stackedBarChartStore';
import type { StackedLinesChartConfig } from '@/stores/apps/stackedLinesChartStore';
import type { GroupedBarChartConfig } from '@/stores/apps/groupedBarChartStore';
import type { PivotBarChartConfig } from '@/stores/apps/pivotBarChartStore';
import type { RadialStackedChartConfig } from '@/stores/apps/radialStackedChartStore';

// Widget types configurations
export interface InsightsConfig {
  maxItems?: number;
  useGlobalStore?: boolean;
  showActions?: boolean;
  collapsible?: boolean;
  backgroundColor?: string;
  backgroundGradient?: {
    enabled: boolean;
    direction: string;
    startColor: string;
    endColor: string;
  };
  borderColor?: string;
  borderAccentColor?: string;
  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
}

export interface InsightsHeroConfig {
  variant?: 'aurora' | 'blueNight' | 'neoLight' | 'report' | 'emberRed' | 'obsidianBlack' | 'sunsetOrange' | 'crimsonGlow' | 'roseDawn';
  autoplayDelay?: number;
  showArrows?: boolean;
  loop?: boolean;
  items?: Array<{ id: string; headline: string; title: string; description?: string; rangeLabel?: string }>; // optional explicit items
}

export interface AlertsConfig {
  maxItems?: number;
  useGlobalStore?: boolean;
  showActions?: boolean;
  collapsible?: boolean;
  showOnlyCritical?: boolean;
  backgroundColor?: string;
  backgroundGradient?: {
    enabled: boolean;
    direction: string;
    startColor: string;
    endColor: string;
  };
  borderColor?: string;
  borderAccentColor?: string;
  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
}

export interface RecommendationsConfig {
  maxItems?: number;
  useGlobalStore?: boolean;
  showActions?: boolean;
  collapsible?: boolean;
  priorityFilter?: 'all' | 'high' | 'medium' | 'low';
  backgroundColor?: string;
  backgroundGradient?: {
    enabled: boolean;
    direction: string;
    startColor: string;
    endColor: string;
  };
  borderColor?: string;
  borderAccentColor?: string;
  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
}

export interface GridConfig {
  maxRows: number;
  rowHeight: number;
  cols: number;
  height?: number;
  containerHeight?: number;
  backgroundColor?: string;
  borderColor?: string;
  // Typography overrides applied to dashboard container
  letterSpacing?: number; // em units (e.g., -0.02 → '-0.02em')

  // Advanced Background Effects (same as widgets)
  backgroundOpacity?: number;
  backgroundGradient?: {
    enabled: boolean;
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
  backdropFilter?: {
    enabled: boolean;
    blur: number;
  };

  // Advanced Border & Shadow Effects
  borderWidth?: number;
  borderRadius?: number;
  containerShadowColor?: string;
  containerShadowOpacity?: number;
  containerShadowBlur?: number;
  containerShadowOffsetX?: number;
  containerShadowOffsetY?: number;

  // Spacing
  padding?: number;
  margin?: number;

  // Responsive layout rows (for ResponsiveGridCanvas)
  layoutRows?: Record<string, LayoutRow>;

  // New grid layout definition (preferred over layoutRows when present)
  layout?: {
    mode?: 'grid' | 'grid-per-row' | 'grid-per-column';
    rows?: Record<string, {
      desktop?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      tablet?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      mobile?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
    }>;
    columns?: {
      desktop?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      tablet?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
      mobile?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
    };
    columnsTemplate?: {
      desktop?: string;
      tablet?: string;
      mobile?: string;
    };
    columnsInner?: Record<string, {
      desktop?: number;
      tablet?: number;
      mobile?: number;
      label?: string;
    }>;
    groups?: Array<{
      id: string;
      title?: string;
      orientation?: 'horizontal' | 'vertical';
      grid?: {
        desktop?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
        tablet?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
        mobile?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
        template?: { desktop?: string; tablet?: string; mobile?: string };
      };
      style?: Record<string, unknown>;
      children: string[];
    }>;
  };
}

// Dashboard Header styling (per-dashboard)
export interface HeaderConfig {
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  titleLetterSpacing?: number;
  titleLineHeight?: number | string;
  titleMarginTop?: number;
  titleMarginRight?: number;
  titleMarginBottom?: number;
  titleMarginLeft?: number;
  titleTextTransform?: string;
  titleTextAlign?: string;
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  subtitleLetterSpacing?: number;
  subtitleLineHeight?: number | string;
  subtitleMarginTop?: number;
  subtitleMarginRight?: number;
  subtitleMarginBottom?: number;
  subtitleMarginLeft?: number;
  subtitleTextTransform?: string;
  subtitleTextAlign?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  showDatePicker?: boolean;
  // Date picker advanced options (from <daterange> or <datepicker>)
  datePickerAlign?: 'left' | 'right' | string;
  datePickerVariant?: 'button' | 'inline' | string;
  datePickerSize?: 'sm' | 'md' | 'lg' | string;
  datePickerMonths?: number;
  datePickerQuickPresets?: boolean;
  datePickerLocale?: string;
  datePickerFormat?: string;
  datePickerId?: string;
  // Initial type/start/end (used to generate tag from editor)
  datePickerType?: string;
  datePickerStart?: string;
  datePickerEnd?: string;
  // Optional blocks order for header vb-block wrappers
  blocksOrder?: string[];
  // Order of title/subtitle inside header-titles
  titlesOrder?: Array<'h1'|'h2'>;
  // Fraction sizing per vb-block (fr units): key = block id
  blocksFr?: Record<string, number>;
}

// Theme types are now managed by ThemeManager
import { ThemeManager, type ThemeName } from './ThemeManager';
import { BorderManager, type BorderPresetKey } from './BorderManager';

// Responsive layout interfaces
export interface LayoutRow {
  desktop: number;
  tablet: number;
  mobile: number;
}

export interface WidgetSpan {
  desktop?: number;
  tablet?: number;
  mobile?: number;
}

// InsightsCard2 config
export interface Insights2Config {
  title?: string;
  items?: Array<{
    id: string;
    variant?: 'risk' | 'slow' | 'info' | 'custom';
    icon?: string;
    label: string;
    link?: { text: string; url?: string };
    tail?: string;
  }>;
  styling?: {
    backgroundColor?: string;
    backgroundOpacity?: number;
    borderColor?: string;
    borderRadius?: number;
    compact?: boolean;
    // Title typography (to align with chart titles / FontManager)
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: string | number;
    titleColor?: string;
    titleMarginBottom?: number;
    // Body typography for card items
    bodyFontFamily?: string;
    bodyTextColor?: string;
  };
}

export interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'insights' | 'alerts' | 'recommendations' | 'insightsHero' | 'insights2' | 'stackedbar' | 'groupedbar' | 'stackedlines' | 'radialstacked' | 'pivotbar' | 'treemap' | 'scatter' | 'funnel';
  // Legacy absolute grid position (optional; not required by responsive layout)
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  title?: string;

  // Responsive layout properties (for ResponsiveGridCanvas)
  row?: string;           // Reference to layoutRows key (e.g., "1", "2")
  span?: WidgetSpan;      // How many columns to span on each breakpoint
  // For grid-per-column: column start per breakpoint (1-based)
  gridStart?: WidgetSpan;
  order?: number;         // Display order
  heightPx?: number;      // Height in pixels for responsive layout
  // Fractional width per breakpoint when group sizing="fr"
  widthFr?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  data?: {
    x: string;
    y: string;
  };
  value?: number;
  unit?: string;
  dataSource?: {
    table: string;
    schema?: string;
    x?: string;
    y?: string;
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN';
    // For stackedbar widgets
    dimension1?: string;
    dimension2?: string;
    field?: string;
    limit?: number;
    // For comparebar and simplified configs
    dimension?: string;
    topic?: string;
    meta?: string;
    measure?: string;
    measureGoal?: string;
    measureActual?: string;
    // For scatter
    xMeasure?: string;
    yMeasure?: string;
    where?: string;
  };
  styling?: {
    colors?: string[];
    showLegend?: boolean;
    borderRadius?: number;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    [key: string]: string | number | boolean | string[] | undefined;
  };
  kpiConfig?: KPIConfig;
  barConfig?: Partial<BarChartConfig>;
  lineConfig?: Partial<LineChartConfig>;
  pieConfig?: Partial<PieChartConfig>;
  areaConfig?: Partial<AreaChartConfig>;
  stackedBarConfig?: Partial<StackedBarChartConfig>;
  groupedBarConfig?: Partial<GroupedBarChartConfig>;
  stackedLinesConfig?: Partial<StackedLinesChartConfig>;
  radialStackedConfig?: Partial<RadialStackedChartConfig>;
  pivotBarConfig?: Partial<PivotBarChartConfig>;
  insightsConfig?: InsightsConfig;
  // New: Insights hero (Swiper carousel variant)
  insightsHeroConfig?: InsightsHeroConfig;
  alertsConfig?: AlertsConfig;
  recommendationsConfig?: RecommendationsConfig;
  insights2Config?: Insights2Config;
  // Optional: order of KPI title/value/comparison tags parsed from DSL
  kpiTitlesOrder?: Array<'h1'|'h2'|'h3'>;
  // Generic pre-render blocks (<p> from DSL) to render before widget content
  preBlocks?: Array<{ className?: string; attrs?: Record<string, string>; text?: string }>;
  // Raw HTML to render before widget content (outside <chart> / data area)
  preHtml?: string;
  // Style for the outer container (article wrapper) applied in ResponsiveGridCanvas
  containerStyle?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | string;
    borderRadius?: number;
    padding?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
  };
}


export interface ParseError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'validation' | 'warning';
}

export interface ParseResult {
  widgets: Widget[];
  gridConfig: GridConfig;
  errors: ParseError[];
  isValid: boolean;
  dashboardTitle?: string;
  dashboardSubtitle?: string;
  headerConfig?: HeaderConfig;
  // Optional global filters parsed from DSL or JSON
  globalFilters?: {
    dateRange: {
      type: string;
      startDate?: string;
      endDate?: string;
    }
  };
}

export class ConfigParser {
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi', 'insights', 'alerts', 'recommendations', 'insightsHero', 'insights2', 'stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar', 'treemap', 'scatter', 'funnel'];
  private static DEFAULT_GRID_CONFIG: GridConfig = {
    maxRows: 12,
    rowHeight: 30,
    cols: 12
  };


  private static applyThemeToWidgets(
    widgets: Widget[],
    theme: ThemeName,
    customFont?: string,
    corporateColor?: string,
    customFontSize?: string,
    borderOptions?: {
      type?: import('./BorderManager').BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    customChartFontFamily?: string,
    customChartTextColor?: string
  ): Widget[] {
    return ThemeManager.applyThemeToWidgets(
      widgets,
      theme,
      customFont,
      corporateColor,
      customFontSize,
      borderOptions,
      customChartFontFamily,
      customChartTextColor
    );
  }

  static parse(input: string): ParseResult {
    const raw = String(input || '').trim();
    // Liquid-only: require HTML-like Liquid template starting with <dashboard ...>
    if (raw.startsWith('<')) {
      try {
        return this.parseLiquid(raw);
      } catch (error) {
        return {
          widgets: [],
          gridConfig: this.DEFAULT_GRID_CONFIG,
          errors: [{
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : 'Invalid Liquid template',
            type: 'syntax'
          }],
          isValid: false
        };
      }
    }
    // Not Liquid: reject with clear message
    return {
      widgets: [],
      gridConfig: this.DEFAULT_GRID_CONFIG,
      errors: [{ line: 1, column: 1, message: 'Apenas Liquid é suportado aqui. Cole um template começando com <dashboard ...>.', type: 'validation' }],
      isValid: false
    };
  }

  /**
   * Parse HTML-like Liquid template (legacy DSL-compatible) into ParseResult
   * Supported tags: <dashboard>, <row>, <chart>, <kpi>, <datasource/>, <styling/>, <items><item/></items>
   * (Legacy <config> JSON is still accepted as fallback when present.)
   */
  private static parseLiquid(dsl: string): ParseResult {
    const errors: ParseError[] = [];
    const widgets: Widget[] = [];
    const layoutRows: NonNullable<GridConfig['layout']>['rows'] = {};

    // Minimal Liquid-like variable support: {% assign var = 'value' %} and {{ var | default: 'x' }}
    const varMap: Record<string, string> = {};
    try {
      const assignRe = /{%\s*assign\s+([A-Za-z_][\w-]*)\s*=\s*(['"])(.*?)\2\s*%}/gi;
      let am: RegExpExecArray | null;
      while ((am = assignRe.exec(dsl)) !== null) {
        const k = am[1];
        const v = am[3];
        if (k) varMap[k] = v;
      }
    } catch { /* ignore */ }
    const resolveLiquidVars = (s: string): string => {
      if (!s) return s;
      return s.replace(/{{\s*([A-Za-z_][\w-]*)(?:\s*\|\s*default:\s*(['"])(.*?)\2)?\s*}}/gi, (_m, name: string, _q: string, def: string) => {
        const v = varMap[name];
        return (v !== undefined) ? String(v) : (def !== undefined ? String(def) : '');
      });
    };

    const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
    const parseAttrs = (s: string): Record<string, string> => {
      const map: Record<string, string> = {};
      for (const m of s.matchAll(attrRegex)) {
        map[m[1]] = resolveLiquidVars(m[2]);
      }
      return map;
    };

    // Parse container-level style attributes present on <article> (KPI/Chart)
    const parseContainerStyle = (attrs: Record<string,string>) => {
      const num = (v?: string) => (v!=null && v!=='' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
      const get = (k1: string, k2?: string) => (attrs[k1] ?? (k2 ? attrs[k2] : undefined));
      const s: Record<string, unknown> = {};
      const bg = get('backgroundColor','background-color'); if (bg) s.backgroundColor = String(bg);
      const bc = get('borderColor','border-color'); if (bc) s.borderColor = String(bc);
      const tc = get('color'); if (tc) s.color = String(tc);
      const bw = get('borderWidth','border-width'); if (bw!=null) { const n = num(String(bw)); if (n!=null) s.borderWidth = n; }
      const bs = get('borderStyle','border-style'); if (bs) s.borderStyle = String(bs);
      const br = get('borderRadius','border-radius') ?? get('radius'); if (br!=null) { const n = num(String(br)); if (n!=null) s.borderRadius = n; }
      const p  = get('padding'); if (p!=null) { const n = num(String(p)); if (n!=null) s.padding = n; }
      const pt = get('paddingTop','padding-top'); if (pt!=null) { const n = num(String(pt)); if (n!=null) s.paddingTop = n; }
      const pr = get('paddingRight','padding-right'); if (pr!=null) { const n = num(String(pr)); if (n!=null) s.paddingRight = n; }
      const pb = get('paddingBottom','padding-bottom'); if (pb!=null) { const n = num(String(pb)); if (n!=null) s.paddingBottom = n; }
      const pl = get('paddingLeft','padding-left'); if (pl!=null) { const n = num(String(pl)); if (n!=null) s.paddingLeft = n; }
      return Object.keys(s).length ? s as {
        backgroundColor?: string; borderColor?: string; borderWidth?: number; borderStyle?: string; borderRadius?: number;
        padding?: number; paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number;
      } : undefined;
    };

    const dashMatch = dsl.match(/<dashboard\b([^>]*)>/i);
    const dashAttrs = dashMatch ? parseAttrs(dashMatch[1]) : {};
    const themeAttr = dashAttrs['theme'] as ThemeName | undefined;
    // Prefer header; keep dashboard attrs only as legacy fallback
    let dashboardTitle = dashAttrs['title'];
    let dashboardSubtitle = dashAttrs['subtitle'];
    if (dashboardTitle || dashboardSubtitle) {
      errors.push({
        line: 1,
        column: 1,
        type: 'warning',
        message: 'Atributos title/subtitle em <dashboard> estão obsoletos. Use <header title="…" subtitle="…" />.'
      });
    }
    let headerConfig: HeaderConfig | undefined = undefined;
    const layoutMode = (dashAttrs['layout-mode'] as 'grid' | 'grid-per-row' | 'grid-per-column' | undefined) || 'grid-per-row';

    // Dashboard-level date range support
    const dateTypeRaw = dashAttrs['date-type'] || dashAttrs['data'];
    let parsedGlobalFilters: ParseResult['globalFilters'] | undefined = undefined;
    if (typeof dateTypeRaw === 'string' && dateTypeRaw.length > 0) {
      let type = dateTypeRaw;
      let startDate: string | undefined;
      let endDate: string | undefined;
      // Allow compact notation: data="custom:YYYY-MM-DD,YYYY-MM-DD"
      if (/^custom:/i.test(type)) {
        const m = type.split(':')[1] || '';
        const parts = m.split(/[;,]/).map(s => s.trim());
        type = 'custom';
        if (parts[0]) startDate = parts[0];
        if (parts[1]) endDate = parts[1];
      } else if (type === 'custom') {
        startDate = dashAttrs['date-start'];
        endDate = dashAttrs['date-end'];
      }
      parsedGlobalFilters = { globalFilters: { dateRange: { type, ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) } } }.globalFilters;
    }

    // Optional <header> parsing. Use <p> blocks for title/subtitle (no <h1>/<h2> fallback).
    try {
      const headerPair = dsl.match(/<header\b([^>]*)>([\s\S]*?)<\/header>/i);
      const headerSelf = dsl.match(/<header\b([^>]*)\/>/i);
      const num = (v?: string): number | undefined => { if (v == null) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; };
      const cfg: HeaderConfig = {};
      if (headerPair) {
        const hAttrs = parseAttrs(headerPair[1] || '');
        const inner = headerPair[2] || '';
        const pick = (k: string) => (hAttrs[k] !== undefined ? hAttrs[k] : undefined);
        // Container-level styles from <header>
        const bg = pick('backgroundColor') || pick('background-color');
        const bc = pick('borderColor') || pick('border-color');
        const bw = pick('borderWidth') || pick('border-width');
        const bs = pick('borderStyle') || pick('border-style');
        if (bg) cfg.backgroundColor = String(bg);
        if (bc) cfg.borderColor = String(bc);
        if (bw) { const n = num(String(bw)); if (n !== undefined) cfg.borderWidth = n; }
        if (bs && ['solid','dashed','dotted'].includes(String(bs))) cfg.borderStyle = String(bs) as any;
        const sdp = hAttrs['showDatePicker'] ?? hAttrs['show-date-picker'] ?? hAttrs['showDate'];
        if (sdp !== undefined) {
          const v = String(sdp).toLowerCase(); cfg.showDatePicker = !(v === 'false' || v === 'off' || v === '0');
        }
        // Prefer <p> blocks for header title/subtitle
        const pAll: Array<{ open: string; body: string }> = [];
        try {
          const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
          let pm: RegExpExecArray | null;
          while ((pm = pRe.exec(inner)) !== null) pAll.push({ open: pm[1] || '', body: pm[2] || '' });
        } catch {}
        const mapHeaderTextAttrs = (attrsStr: string, target: 'title'|'subtitle') => {
          const a = parseAttrs(attrsStr || '');
          const numv = (v?: string) => (v!=null && v!=='' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
          const ff = a['font-family'] || a['fontFamily']; if (ff) (cfg as any)[`${target}FontFamily`] = String(ff);
          const fs = a['font-size'] || a['fontSize']; if (fs!=null) (cfg as any)[`${target}FontSize`] = numv(String(fs));
          const fw = a['font-weight'] || a['fontWeight']; if (fw) (cfg as any)[`${target}FontWeight`] = (/^\d+$/.test(String(fw)) ? Number(fw) : String(fw));
          const col = a['color']; if (col) (cfg as any)[`${target}Color`] = String(col);
          const ls = a['letter-spacing'] || a['letterSpacing']; if (ls) (cfg as any)[`${target}LetterSpacing`] = numv(String(ls));
          const lh = a['line-height'] || a['lineHeight']; if (lh) (cfg as any)[`${target}LineHeight`] = (/^\d+(?:\.?\d+)?$/.test(String(lh)) ? Number(lh) : String(lh));
          const mt = a['margin-top'] || a['marginTop']; if (mt) (cfg as any)[`${target}MarginTop`] = numv(String(mt));
          const mr = a['margin-right'] || a['marginRight']; if (mr) (cfg as any)[`${target}MarginRight`] = numv(String(mr));
          const mb = a['margin-bottom'] || a['marginBottom']; if (mb) (cfg as any)[`${target}MarginBottom`] = numv(String(mb));
          const ml = a['margin-left'] || a['marginLeft']; if (ml) (cfg as any)[`${target}MarginLeft`] = numv(String(ml));
          const ta = a['text-align'] || a['textAlign']; if (ta) (cfg as any)[`${target}TextAlign`] = String(ta);
          const tt = a['text-transform'] || a['textTransform']; if (tt) (cfg as any)[`${target}TextTransform`] = String(tt);
        };
        if (pAll[0]) {
          const text = resolveLiquidVars((pAll[0].body || '').trim());
          if (text) dashboardTitle = text;
          mapHeaderTextAttrs(pAll[0].open, 'title');
        }
        if (pAll[1]) {
          const text = resolveLiquidVars((pAll[1].body || '').trim());
          if (text) dashboardSubtitle = text;
          mapHeaderTextAttrs(pAll[1].open, 'subtitle');
        }
        // Daterange/Datepicker tag inside header
        const drSelfPair = inner.match(/<(daterange|datepicker)\b([^>]*)\/>/i) || inner.match(/<(daterange|datepicker)\b([^>]*)>([\s\S]*?)<\/\1>/i);
        const drAttrsStr2 = drSelfPair ? (drSelfPair[2] || '') : '';
        if (drAttrsStr2) {
          const drAttrs = parseAttrs(drAttrsStr2);
          cfg.showDatePicker = true;
          if (drAttrs['align']) cfg.datePickerAlign = String(drAttrs['align']);
          if (drAttrs['variant']) cfg.datePickerVariant = String(drAttrs['variant']);
          if (drAttrs['size']) cfg.datePickerSize = String(drAttrs['size']);
          const months = drAttrs['number-of-months'] || drAttrs['months'];
          if (months && !Number.isNaN(Number(months))) cfg.datePickerMonths = Number(months);
          if (drAttrs['quick-presets'] !== undefined) cfg.datePickerQuickPresets = String(drAttrs['quick-presets']).toLowerCase() !== 'false';
          if (drAttrs['locale']) cfg.datePickerLocale = String(drAttrs['locale']);
          if (drAttrs['format']) cfg.datePickerFormat = String(drAttrs['format']);
          if (drAttrs['id']) cfg.datePickerId = String(drAttrs['id']);
          // Map initial filter
          let t = drAttrs['type'];
          let start = drAttrs['start'] || drAttrs['date-start'];
          let end = drAttrs['end'] || drAttrs['date-end'];
          if (t) {
            if (/^custom:/i.test(t)) {
              const m = t.split(':')[1] || '';
              const parts = m.split(/[;,]/).map(s => s.trim());
              t = 'custom';
              if (parts[0]) start = parts[0];
              if (parts[1]) end = parts[1];
            }
            parsedGlobalFilters = { dateRange: { type: t, ...(start ? { startDate: start } : {}), ...(end ? { endDate: end } : {}) } };
          }
        }
        // Capture vb-block wrappers order (by id) inside header
        try {
          const blockRe = /<div\b([^>]*)>([\s\S]*?)<\/div>/gi;
          const order: string[] = [];
          const frMap: Record<string, number> = {};
          let bm: RegExpExecArray | null;
          while ((bm = blockRe.exec(inner)) !== null) {
            const bAttrsStr = bm[1] || '';
            const ba = parseAttrs(bAttrsStr);
            const cls = (ba['class'] || '').split(/\s+/);
            if (cls.includes('vb-block')) {
              const idv = ba['id'] || '';
              if (idv) order.push(idv);
              const frRaw = ba['fr'] || ba['data-fr'];
              if (frRaw && !Number.isNaN(Number(frRaw))) frMap[idv] = Number(frRaw);
            }
          }
          if (order.length) (cfg as any).blocksOrder = order;
          if (Object.keys(frMap).length) (cfg as any).blocksFr = frMap;
        } catch {}
        // Capture titles order inside header-titles block (only <p>)
        try {
          const titlesBlockMatch = inner.match(/<div\b[^>]*\bid=\"header-titles\"[^>]*>([\s\S]*?)<\/div>/i);
          if (titlesBlockMatch) {
            const tInner = titlesBlockMatch[1] || '';
            const pRe = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
            const pFound = tInner.match(pRe) || [];
            const seq: Array<'h1'|'h2'> = [];
            if (pFound.length) {
              if (pFound[0]) seq.push('h1');
              if (pFound[1]) seq.push('h2');
            }
            if (seq.length) (cfg as any).titlesOrder = seq;
          }
        } catch {}
        if (Object.keys(cfg).length > 0) headerConfig = cfg;
      } else if (headerSelf) {
        // Legacy/self-closing: read from header attributes
        const hAttrs = parseAttrs(headerSelf[1] || '');
        if (typeof hAttrs['title'] === 'string' && hAttrs['title'].length > 0) dashboardTitle = hAttrs['title'];
        if (typeof hAttrs['subtitle'] === 'string') dashboardSubtitle = hAttrs['subtitle'];
        const pick = (k: string) => (hAttrs[k] !== undefined ? hAttrs[k] : undefined);
        const bg = pick('backgroundColor') || pick('background-color');
        const tff = pick('titleFontFamily') || pick('title-font-family');
        const tfs = pick('titleFontSize') || pick('title-font-size');
        const tfw = pick('titleFontWeight') || pick('title-font-weight');
        const tc = pick('titleColor') || pick('title-color');
        const sff = pick('subtitleFontFamily') || pick('subtitle-font-family');
        const sfs = pick('subtitleFontSize') || pick('subtitle-font-size');
        const sfw = pick('subtitleFontWeight') || pick('subtitle-font-weight');
        const sc = pick('subtitleColor') || pick('subtitle-color');
        if (bg) cfg.backgroundColor = String(bg);
        if (tff) cfg.titleFontFamily = String(tff);
        if (tfs) cfg.titleFontSize = num(String(tfs));
        if (tfw) cfg.titleFontWeight = (/^\d+$/.test(String(tfw)) ? Number(tfw) : String(tfw));
        if (tc) cfg.titleColor = String(tc);
        if (sff) cfg.subtitleFontFamily = String(sff);
        if (sfs) cfg.subtitleFontSize = num(String(sfs));
        if (sfw) cfg.subtitleFontWeight = (/^\d+$/.test(String(sfw)) ? Number(sfw) : String(sfw));
        if (sc) cfg.subtitleColor = String(sc);
        const bc = pick('borderColor') || pick('border-color');
        const bw = pick('borderWidth') || pick('border-width');
        const bs = pick('borderStyle') || pick('border-style');
        if (bc) cfg.borderColor = String(bc);
        if (bw) { const n = num(String(bw)); if (n !== undefined) cfg.borderWidth = n; }
        if (bs && ['solid','dashed','dotted'].includes(String(bs))) cfg.borderStyle = String(bs) as any;
        const sdp = pick('showDatePicker') || pick('show-date-picker') || pick('showDate');
        if (sdp !== undefined) { const v = String(sdp).toLowerCase(); cfg.showDatePicker = !(v === 'false' || v === 'off' || v === '0'); }
        if (Object.keys(cfg).length > 0) headerConfig = cfg;
      }
    } catch { /* ignore */ }

    // Optional dashboard-level <style>{ ...json... }</style>
    // NOTE: Only capture a <style> that appears immediately after <dashboard ...> (to avoid picking nested group styles)
    let styleObj: Record<string, unknown> | null = null;
    const dashOpen = dsl.match(/<dashboard\b[^>]*>/i);
    if (dashOpen && typeof dashOpen.index === 'number') {
      const start = dashOpen.index + dashOpen[0].length;
      const post = dsl.slice(start);
      const earlyStyle = post.match(/^\s*(?:<!--[\s\S]*?-->\s*)*(<style\b[^>]*>[\s\S]*?<\/style>)/i);
      if (earlyStyle && earlyStyle[1]) {
        const contentMatch = earlyStyle[1].match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
        if (contentMatch && contentMatch[1]) {
          try {
            const parsed = JSON.parse(contentMatch[1].trim());
            if (parsed && typeof parsed === 'object') styleObj = parsed as Record<string, unknown>;
          } catch {
            // ignore malformed style JSON, fall back to attributes
          }
        }
      }
    }

    // Helpers for new tags: <datasource /> and <styling tw="..." />
    // Also: HTML+Liquid binding parser for KPI <section>/<article>/<h1>/<h2>
    const parseBindingPairs = (raw: string): Record<string, string> => {
      const out: Record<string, string> = {};
      if (!raw) return out;
      // Extract first moustache content {{ ... }}; allow outer {{ }} already stripped
      let body = raw.trim();
      const m = body.match(/^\{\{([\s\S]*?)\}\}$/);
      if (m) body = m[1];
      const parts = body.split(';');
      for (let p of parts) {
        p = p.trim();
        if (!p) continue;
        const i = p.indexOf(':');
        if (i === -1) continue;
        const k = p.slice(0, i).trim().toLowerCase();
        const v = resolveLiquidVars(p.slice(i + 1).trim().replace(/^['"]|['"]$/g, ''));
        if (k) out[k] = v;
      }
      return out;
    };

    // Unified HTML sections parser: walks <section> blocks in source order
    const parseSectionsHtml = () => {
      let found = false;
      const secRe = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
      let sm: RegExpExecArray | null;
      // Row index based on encounter order of ANY section type
      let rowIndex = 0;
      while ((sm = secRe.exec(dsl)) !== null) {
        const secAttrs = parseAttrs(sm[1] || '');
        const secType = (secAttrs['data-type'] || secAttrs['type'] || '').toLowerCase();
        if (secType !== 'kpis' && secType !== 'charts') continue;
        found = true;
        rowIndex++;
        const rowId = secAttrs['id'] || `row${rowIndex}`;
        const colsD = Number(secAttrs['data-cols-d'] || secAttrs['cols-d'] || '3') || 3;
        const colsT = Number(secAttrs['data-cols-t'] || secAttrs['cols-t'] || '2') || 2;
        const colsM = Number(secAttrs['data-cols-m'] || secAttrs['cols-m'] || '1') || 1;
        const gapX = secAttrs['data-gap-x'] || secAttrs['gap-x'] ? Number(secAttrs['data-gap-x'] || secAttrs['gap-x']) : undefined;
        const gapY = secAttrs['data-gap-y'] || secAttrs['gap-y'] ? Number(secAttrs['data-gap-y'] || secAttrs['gap-y']) : undefined;
        layoutRows[rowId] = {
          desktop: { columns: Math.max(1, colsD), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          tablet: { columns: Math.max(1, colsT), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          mobile: { columns: Math.max(1, colsM), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
        } as any;

        const sectionBody = sm[2] || '';
        const artRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
        let am: RegExpExecArray | null;
        while ((am = artRe.exec(sectionBody)) !== null) {
          const aAttrs = parseAttrs(am[1] || '');
          const inner = am[2] || '';
          const parseContainerStyle = (attrs: Record<string,string>) => {
            const num = (v?: string) => (v!=null && v!=='' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
            const get = (k1: string, k2?: string) => (attrs[k1] ?? (k2 ? attrs[k2] : undefined));
            const s: Record<string, unknown> = {};
            const bg = get('backgroundColor','background-color'); if (bg) s.backgroundColor = String(bg);
            const bc = get('borderColor','border-color'); if (bc) s.borderColor = String(bc);
            const bw = get('borderWidth','border-width'); if (bw!=null) { const n = num(String(bw)); if (n!=null) s.borderWidth = n; }
            const bs = get('borderStyle','border-style'); if (bs) s.borderStyle = String(bs);
            const br = get('borderRadius','border-radius') ?? get('radius'); if (br!=null) { const n = num(String(br)); if (n!=null) s.borderRadius = n; }
            const p  = get('padding'); if (p!=null) { const n = num(String(p)); if (n!=null) s.padding = n; }
            const pt = get('paddingTop','padding-top'); if (pt!=null) { const n = num(String(pt)); if (n!=null) s.paddingTop = n; }
            const pr = get('paddingRight','padding-right'); if (pr!=null) { const n = num(String(pr)); if (n!=null) s.paddingRight = n; }
            const pb = get('paddingBottom','padding-bottom'); if (pb!=null) { const n = num(String(pb)); if (n!=null) s.paddingBottom = n; }
            const pl = get('paddingLeft','padding-left'); if (pl!=null) { const n = num(String(pl)); if (n!=null) s.paddingLeft = n; }
            return Object.keys(s).length ? s : undefined;
          };

          if (secType === 'kpis') {
            // KPI as pure HTML (no parsing for moustache/props)
            const id = aAttrs['id'] || aAttrs['data-id'] || `kpi_${Date.now()}_${Math.random()}`;
            const orderStr = aAttrs['data-order'] || aAttrs['order'];
            const heightStr = aAttrs['data-height'] || aAttrs['height'];
            const order = orderStr ? Number(orderStr) : undefined;
            const heightPx = heightStr ? Number(heightStr) : undefined;
            const widget: Widget = {
              id,
              type: 'kpi',
              row: rowId,
              ...(typeof order === 'number' ? { order } : {}),
              ...(typeof heightPx === 'number' ? { heightPx } : {}),
            } as Widget;
            const frRaw = aAttrs['fr'] || aAttrs['data-fr'];
            if (frRaw && !Number.isNaN(Number(frRaw)) && Number(frRaw) > 0) {
              (widget as any).widthFr = { desktop: String(Number(frRaw)) + 'fr' };
            }
            const cs = parseContainerStyle(aAttrs); if (cs) (widget as any).containerStyle = cs;
            // Store <p> blocks (pure HTML) as preBlocks for direct rendering
            try {
              const pre: Array<{ className?: string; attrs?: Record<string,string>; text?: string }> = [];
              const pReAll = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
              let pm: RegExpExecArray | null;
              while ((pm = pReAll.exec(inner)) !== null) {
                const attrs = parseAttrs(pm[1] || '');
                const text = resolveLiquidVars((pm[2] || '').trim());
                pre.push({ className: attrs['class'], attrs, text });
              }
              if (pre.length) (widget as any).preBlocks = pre; else (widget as any).preHtml = (inner || '').trim();
            } catch {
              (widget as any).preHtml = (inner || '').trim();
            }
            widgets.push(widget);
          } else {
            // Charts article parsing (title in first <p>, binding in <main>{{ ... }}</main>)
            const id = aAttrs['id'] || aAttrs['data-id'] || `chart_${Date.now()}_${Math.random()}`;
            const orderStr = aAttrs['data-order'] || aAttrs['order'];
            const heightStr = aAttrs['data-height'] || aAttrs['height'];
            const spanDStr = aAttrs['data-span-d'] || aAttrs['span-d'];
            const spanTStr = aAttrs['data-span-t'] || aAttrs['span-t'];
            const spanMStr = aAttrs['data-span-m'] || aAttrs['span-m'];
            let typeRaw = (aAttrs['chart'] || aAttrs['data-chart'] || '').toLowerCase();
            const order = orderStr ? Number(orderStr) : undefined;
            const heightPx = heightStr ? Number(heightStr) : undefined;
            const spanD = spanDStr ? Number(spanDStr) : undefined;
            const spanT = spanTStr ? Number(spanTStr) : undefined;
            const spanM = spanMStr ? Number(spanMStr) : undefined;
            const pTitleMatch = inner.match(/<p\b([^>]*)>([\s\S]*?)<\/p>/i);
            const title = pTitleMatch ? resolveLiquidVars((pTitleMatch[2] || '').trim()) : undefined;
            // We'll prefer storing raw HTML outside <chart> for HTML rendering
            let preBlocksTemp: Array<{ className?: string; attrs?: Record<string,string>; text?: string }> | undefined;

            // Parse <chart> (preferred) or <main> with moustache binding and optional <style>{...}</style>
            const nodeRe = /<(chart|main)\b([^>]*)>([\s\S]*?)<\/\1>/i;
            const nm = inner.match(nodeRe);
            let nodeAttrs: Record<string, string> = {};
            let pairs: Record<string, string> = {};
            let styleObj: Record<string, unknown> | undefined;
            if (nm) {
              const tagName = (nm[1] || 'main').toLowerCase();
              const attrsStr = nm[2] || '';
              const body = nm[3] || '';
              nodeAttrs = parseAttrs(attrsStr);
              if (tagName === 'chart') {
                const t = (nodeAttrs['type'] || nodeAttrs['chart'] || nodeAttrs['data-chart'] || '').toLowerCase();
                if (t) typeRaw = t;
              } else {
                if (nodeAttrs['chart']) typeRaw = String(nodeAttrs['chart']).toLowerCase();
              }
              const moustache = body.match(/\{\{([\s\S]*?)\}\}/);
              if (moustache && moustache[0]) {
                pairs = parseBindingPairs(moustache[0]);
              }
              const st = body.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
              if (st && st[1]) {
                try {
                  const parsed = JSON.parse(st[1].trim());
                  if (parsed && typeof parsed === 'object') styleObj = parsed as Record<string, unknown>;
                } catch { /* ignore */ }
              }
            }

            const type = (typeRaw === 'comparebar') ? 'groupedbar' : typeRaw;
            const ds: any = {};
            if (pairs['schema']) ds.schema = pairs['schema'];
            if (pairs['table'] || pairs['dimension']) ds.table = pairs['table'] || pairs['dimension'];
            if (pairs['dimension']) ds.dimension = pairs['dimension'];
            if (pairs['dimension1']) ds.dimension1 = pairs['dimension1'];
            if (pairs['dimension2']) ds.dimension2 = pairs['dimension2'];
            if (pairs['xmeasure']) ds.xMeasure = pairs['xmeasure'];
            if (pairs['ymeasure']) ds.yMeasure = pairs['ymeasure'];
            if (pairs['measure']) ds.measure = pairs['measure'];
            if (pairs['where']) ds.where = pairs['where'];
            if (pairs['limit'] && !Number.isNaN(Number(pairs['limit']))) ds.limit = Number(pairs['limit']);

            const widget: Widget = {
              id,
              type: (['bar','line','pie','area','groupedbar','stackedbar','stackedlines','radialstacked','pivotbar','treemap','scatter','funnel'].includes(type) ? (type as Widget['type']) : 'bar'),
              row: rowId,
              ...(typeof order === 'number' ? { order } : {}),
              ...(typeof heightPx === 'number' ? { heightPx } : {}),
              ...(title ? { title } : {}),
              ...(Object.keys(ds).length ? { dataSource: ds } : {}),
            } as Widget;
            if (spanD || spanT || spanM) widget.span = { ...(spanD?{desktop:spanD}:{}) , ...(spanT?{tablet:spanT}:{}) , ...(spanM?{mobile:spanM}:{}) };

            // Apply tokens from <style> inside <chart>
            if (styleObj && typeof styleObj['tw'] === 'string') {
              applyStylingTokens(widget, String(styleObj['tw']));
            }

            // Capture HTML outside the <chart> node and convert <p> blocks to preBlocks (with style attrs mapping)
            if (nm && nm[0]) {
              const outer = (inner || '').replace(nm[0], '');
              try {
                const pre: Array<{ className?: string; attrs?: Record<string,string>; text?: string }> = [];
                const pReAll = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
                let pm: RegExpExecArray | null;
                while ((pm = pReAll.exec(outer)) !== null) {
                  const attrs = parseAttrs(pm[1] || '');
                  const text = resolveLiquidVars((pm[2] || '').trim());
                  pre.push({ className: attrs['class'], attrs, text });
                }
                if (pre.length) (widget as any).preBlocks = pre; else {
                  const raw = outer.trim();
                  if (raw) (widget as any).preHtml = raw;
                }
              } catch {
                const raw = outer.trim();
                if (raw) (widget as any).preHtml = raw;
              }
            } else if ((inner || '').trim()) {
              try {
                const pre: Array<{ className?: string; attrs?: Record<string,string>; text?: string }> = [];
                const pReAll = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
                let pm: RegExpExecArray | null;
                while ((pm = pReAll.exec(inner)) !== null) {
                  const attrs = parseAttrs(pm[1] || '');
                  const text = resolveLiquidVars((pm[2] || '').trim());
                  pre.push({ className: attrs['class'], attrs, text });
                }
                if (pre.length) (widget as any).preBlocks = pre; else (widget as any).preHtml = (inner || '').trim();
              } catch {
                (widget as any).preHtml = (inner || '').trim();
              }
            }

            // Support article-level fr width for charts (same as KPIs)
            const frRaw = aAttrs['fr'] || aAttrs['data-fr'];
            if (frRaw && !Number.isNaN(Number(frRaw)) && Number(frRaw) > 0) {
              (widget as any).widthFr = { desktop: String(Number(frRaw)) + 'fr' };
            }
            if (preBlocksTemp && preBlocksTemp.length) (widget as any).preBlocks = preBlocksTemp;

            widgets.push(widget);
          }
        }
      }
      return found;
    };

    const parseKpiSectionHtml = () => {
      let found = false;
      const secRe = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
      let sm: RegExpExecArray | null;
      let rowIndex = 0;
      while ((sm = secRe.exec(dsl)) !== null) {
        const secAttrs = parseAttrs(sm[1] || '');
        const secType = (secAttrs['data-type'] || secAttrs['type'] || '').toLowerCase();
        if (secType !== 'kpis') continue;
        found = true;
        rowIndex++;
        const rowId = secAttrs['id'] || `row${rowIndex}`;
        const colsD = Number(secAttrs['data-cols-d'] || secAttrs['cols-d'] || '3') || 3;
        const colsT = Number(secAttrs['data-cols-t'] || secAttrs['cols-t'] || '2') || 2;
        const colsM = Number(secAttrs['data-cols-m'] || secAttrs['cols-m'] || '1') || 1;
        const gapX = secAttrs['data-gap-x'] || secAttrs['gap-x'] ? Number(secAttrs['data-gap-x'] || secAttrs['gap-x']) : undefined;
        const gapY = secAttrs['data-gap-y'] || secAttrs['gap-y'] ? Number(secAttrs['data-gap-y'] || secAttrs['gap-y']) : undefined;
        layoutRows[rowId] = {
          desktop: { columns: Math.max(1, colsD), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          tablet: { columns: Math.max(1, colsT), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          mobile: { columns: Math.max(1, colsM), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
        } as any;

        const sectionBody = sm[2] || '';
        const artRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
        let am: RegExpExecArray | null;
        while ((am = artRe.exec(sectionBody)) !== null) {
          const aAttrs = parseAttrs(am[1] || '');
          const inner = am[2] || '';
          const id = aAttrs['id'] || aAttrs['data-id'] || `kpi_${Date.now()}_${Math.random()}`;
          const orderStr = aAttrs['data-order'] || aAttrs['order'];
          const heightStr = aAttrs['data-height'] || aAttrs['height'];
          const order = orderStr ? Number(orderStr) : undefined;
          const heightPx = heightStr ? Number(heightStr) : undefined;
          const h1m = inner.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
          const title = h1m ? resolveLiquidVars((h1m[1] || '').trim()) : undefined;
            // Binding inside <h2> (first occurrence)
            let bindingRaw = '';
            const h2m = inner.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
            if (h2m && h2m[1]) bindingRaw = (h2m[1] || '').trim();
            const pairs = bindingRaw ? parseBindingPairs(bindingRaw) : {};
            // Optional comparison in <h3>
            let h3TextRaw = '';
            const h3m = inner.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
            if (h3m && h3m[1]) h3TextRaw = (h3m[1] || '').trim();
            const h3Pairs = h3TextRaw && /\{\{/.test(h3TextRaw) ? parseBindingPairs(h3TextRaw) : {};
          const ds: any = {};
          if (pairs['schema']) ds.schema = pairs['schema'];
          if (pairs['table'] || pairs['dimension']) ds.table = pairs['table'] || pairs['dimension'];
          if (pairs['measure']) ds.measure = pairs['measure'];
          if (pairs['where']) ds.where = pairs['where'];
          if (pairs['limit'] && !Number.isNaN(Number(pairs['limit']))) ds.limit = Number(pairs['limit']);

            const widget: Widget = {
              id,
              type: 'kpi',
              row: rowId,
              ...(typeof order === 'number' ? { order } : {}),
              ...(typeof heightPx === 'number' ? { heightPx } : {}),
              ...(title ? { title } : {}),
              ...(Object.keys(ds).length ? { dataSource: ds } : {}),
            } as Widget;
            // Capture order of title/value/comparison tags present
            try {
              const seq: Array<'h1'|'h2'|'h3'> = [];
              const tagRe = /<(h1|h2|h3)\b[^>]*>[\s\S]*?<\/\1>/gi;
              let tm: RegExpExecArray | null;
              while ((tm = tagRe.exec(inner)) !== null) {
                const tag = (tm[1] || '').toLowerCase();
                if (tag === 'h1' || tag === 'h2' || tag === 'h3') seq.push(tag as 'h1'|'h2'|'h3');
              }
              if (seq.length) (widget as any).kpiTitlesOrder = seq;
            } catch {}
            const frRaw = aAttrs['fr'] || aAttrs['data-fr'];
            if (frRaw && !Number.isNaN(Number(frRaw)) && Number(frRaw) > 0) {
              (widget as any).widthFr = { desktop: String(Number(frRaw)) + 'fr' };
            }
            // Map Tailwind classes from <h1>/<h2>/<h3>
            try {
              const h1Open = inner.match(/<h1\b([^>]*)>/i);
              const h2Open = inner.match(/<h2\b([^>]*)>/i);
              const h3Open = inner.match(/<h3\b([^>]*)>/i);
              const w = widget as unknown as { kpiConfig?: Record<string, unknown> };
              w.kpiConfig = w.kpiConfig || {};
              if (h1Open && h1Open[1]) {
                const a = parseAttrs(h1Open[1] || '');
                if (a['class']) (w.kpiConfig as any)['kpiNameClassName'] = a['class'];
              }
              if (h2Open && h2Open[1]) {
                const a = parseAttrs(h2Open[1] || '');
                if (a['class']) (w.kpiConfig as any)['kpiValueClassName'] = a['class'];
              }
              if (h3Open && h3Open[1]) {
                const a = parseAttrs(h3Open[1] || '');
                if (a['class']) (w.kpiConfig as any)['kpiComparisonClassName'] = a['class'];
              }
            } catch {}

            // Map <h3> to KPI comparison when present
            if (h3TextRaw) {
              const w = widget as unknown as { kpiConfig?: Record<string, unknown> };
              w.kpiConfig = w.kpiConfig || {};
              if (Object.keys(h3Pairs).length > 0) {
                if (h3Pairs['label']) (w.kpiConfig as any)['comparisonLabel'] = h3Pairs['label'];
                if (h3Pairs['changePct'] || h3Pairs['changepct'] || h3Pairs['change_pct']) {
                  const v = Number(h3Pairs['changePct'] || h3Pairs['changepct'] || h3Pairs['change_pct']);
                  if (!Number.isNaN(v)) (w.kpiConfig as any)['change'] = v;
                }
                if (h3Pairs['unit']) (w.kpiConfig as any)['unit'] = h3Pairs['unit'];
              } else {
                // Plain text label
                (w.kpiConfig as any)['comparisonLabel'] = resolveLiquidVars(h3TextRaw);
              }
            }
            widgets.push(widget);
        }
      }
      return found;
    };

    const parseChartSectionHtml = () => {
      let found = false;
      const secRe = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
      let sm: RegExpExecArray | null;
      let rowIndex = Object.keys(layoutRows).length;
      while ((sm = secRe.exec(dsl)) !== null) {
        const secAttrs = parseAttrs(sm[1] || '');
        const secType = (secAttrs['data-type'] || secAttrs['type'] || '').toLowerCase();
        if (secType !== 'charts') continue;
        found = true;
        rowIndex++;
        const rowId = secAttrs['id'] || `row${rowIndex}`;
        const colsD = Number(secAttrs['data-cols-d'] || secAttrs['cols-d'] || '3') || 3;
        const colsT = Number(secAttrs['data-cols-t'] || secAttrs['cols-t'] || '2') || 2;
        const colsM = Number(secAttrs['data-cols-m'] || secAttrs['cols-m'] || '1') || 1;
        const gapX = secAttrs['data-gap-x'] || secAttrs['gap-x'] ? Number(secAttrs['data-gap-x'] || secAttrs['gap-x']) : undefined;
        const gapY = secAttrs['data-gap-y'] || secAttrs['gap-y'] ? Number(secAttrs['data-gap-y'] || secAttrs['gap-y']) : undefined;
        layoutRows[rowId] = {
          desktop: { columns: Math.max(1, colsD), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          tablet: { columns: Math.max(1, colsT), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
          mobile: { columns: Math.max(1, colsM), ...(gapX!=null?{gapX}:{}) , ...(gapY!=null?{gapY}:{}) },
        } as any;

        const sectionBody = sm[2] || '';
        const artRe = /<article\b([^>]*)>([\s\S]*?)<\/article>/gi;
        let am: RegExpExecArray | null;
        while ((am = artRe.exec(sectionBody)) !== null) {
          const aAttrs = parseAttrs(am[1] || '');
          const inner = am[2] || '';
          const id = aAttrs['id'] || aAttrs['data-id'] || `chart_${Date.now()}_${Math.random()}`;
          const orderStr = aAttrs['data-order'] || aAttrs['order'];
          const heightStr = aAttrs['data-height'] || aAttrs['height'];
          const spanDStr = aAttrs['data-span-d'] || aAttrs['span-d'];
          const spanTStr = aAttrs['data-span-t'] || aAttrs['span-t'];
          const spanMStr = aAttrs['data-span-m'] || aAttrs['span-m'];
          let typeRaw = (aAttrs['chart'] || aAttrs['data-chart'] || '').toLowerCase();
          const order = orderStr ? Number(orderStr) : undefined;
          const heightPx = heightStr ? Number(heightStr) : undefined;
          const spanD = spanDStr ? Number(spanDStr) : undefined;
          const spanT = spanTStr ? Number(spanTStr) : undefined;
          const spanM = spanMStr ? Number(spanMStr) : undefined;
          const h1m = inner.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
          const title = h1m ? resolveLiquidVars((h1m[1] || '').trim()) : undefined;

          // Parse <main> with binding and optional <style>{...}</style>
          const mainRe = /<main\b[^>]*>([\s\S]*?)<\/main>/i;
          const mm = inner.match(mainRe);
          let mainAttrs: Record<string, string> = {};
          let pairs: Record<string, string> = {};
          let styleObj: Record<string, unknown> | undefined;
          if (mm && mm[1]) {
            const mainBody = mm[1] || '';
            const mainOpen = (mm[0] || '').match(/<main\b([^>]*)>/i);
            if (mainOpen && mainOpen[1]) {
              mainAttrs = parseAttrs(mainOpen[1]);
              if (mainAttrs['chart']) typeRaw = String(mainAttrs['chart']).toLowerCase();
            }
            const moustache = mainBody.match(/\{\{([\s\S]*?)\}\}/);
            if (moustache && moustache[0]) {
              pairs = parseBindingPairs(moustache[0]);
            }
            const st = mainBody.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
            if (st && st[1]) {
              try {
                const parsed = JSON.parse(st[1].trim());
                if (parsed && typeof parsed === 'object') styleObj = parsed as Record<string, unknown>;
              } catch { /* ignore */ }
            }
          }

          const type = (typeRaw === 'comparebar') ? 'groupedbar' : typeRaw;
          const ds: any = {};
          if (pairs['schema']) ds.schema = pairs['schema'];
          if (pairs['table'] || pairs['dimension']) ds.table = pairs['table'] || pairs['dimension'];
          if (pairs['dimension']) ds.dimension = pairs['dimension'];
          if (pairs['dimension1']) ds.dimension1 = pairs['dimension1'];
          if (pairs['dimension2']) ds.dimension2 = pairs['dimension2'];
          if (pairs['xmeasure']) ds.xMeasure = pairs['xmeasure'];
          if (pairs['ymeasure']) ds.yMeasure = pairs['ymeasure'];
          if (pairs['measure']) ds.measure = pairs['measure'];
          if (pairs['where']) ds.where = pairs['where'];
          if (pairs['limit'] && !Number.isNaN(Number(pairs['limit']))) ds.limit = Number(pairs['limit']);

          const widget: Widget = {
            id,
            type: (['bar','line','pie','area','groupedbar','stackedbar','stackedlines','radialstacked','pivotbar','treemap','scatter','funnel'].includes(type) ? (type as Widget['type']) : 'bar'),
            row: rowId,
            ...(typeof order === 'number' ? { order } : {}),
            ...(typeof heightPx === 'number' ? { heightPx } : {}),
            ...(title ? { title } : {}),
            ...(Object.keys(ds).length ? { dataSource: ds } : {}),
          } as Widget;
            if (spanD || spanT || spanM) widget.span = { ...(spanD?{desktop:spanD}:{}) , ...(spanT?{tablet:spanT}:{}) , ...(spanM?{mobile:spanM}:{}) };
            const frRaw = aAttrs['fr'] || aAttrs['data-fr'];
            if (frRaw && !Number.isNaN(Number(frRaw)) && Number(frRaw) > 0) {
              (widget as any).widthFr = { desktop: String(Number(frRaw)) + 'fr' };
            }
            const cs = parseContainerStyle(aAttrs); if (cs) (widget as any).containerStyle = cs;
          // Charts branch: no KPI tailwind/tag parsing here
          // Apply style.tw from <main><style>{ ... }</style></main>
          if (styleObj && typeof styleObj['tw'] === 'string') {
            applyStylingTokens(widget, String(styleObj['tw']));
          }

          widgets.push(widget);
        }
      }
      return found;
    };
    const applyDataSourceAttrs = (widget: Widget, attrs: Record<string, string>) => {
      const ds: NonNullable<Widget['dataSource']> = {
        ...(widget.dataSource || {}),
      } as NonNullable<Widget['dataSource']>;
      const setStr = (k: keyof NonNullable<Widget['dataSource']>, v?: string) => {
        if (v !== undefined && v !== '') (ds as Record<string, unknown>)[k] = v;
      };
      const setNum = (k: keyof NonNullable<Widget['dataSource']>, v?: string) => {
        if (v !== undefined && v !== '' && !Number.isNaN(Number(v))) (ds as Record<string, unknown>)[k] = Number(v);
      };
      setStr('schema', attrs['schema']);
      setStr('table', attrs['table']);
      setStr('x', attrs['x']);
      setStr('y', attrs['y']);
      // Accept agg or aggregation
      setStr('aggregation', attrs['agg'] || attrs['aggregation']);
      setStr('dimension1', attrs['dimension1']);
      setStr('dimension2', attrs['dimension2']);
      setStr('dimension', attrs['dimension']);
      setStr('measure', attrs['measure']);
      setStr('measureGoal', attrs['measureGoal']);
      setStr('measureActual', attrs['measureActual']);
      // Scatter
      setStr('xMeasure', attrs['xMeasure']);
      setStr('yMeasure', attrs['yMeasure']);
      setStr('field', attrs['field']);
      setStr('where', attrs['where']);
      setStr('topic', attrs['topic']);
      setStr('meta', attrs['meta']);
      setNum('limit', attrs['limit']);
      widget.dataSource = ds;
    };

    const ensureStylingTarget = (widget: Widget): { target: Record<string, unknown>; where: 'widget' | 'bar' | 'line' | 'pie' | 'area' | 'stackedbar' | 'groupedbar' | 'stackedlines' | 'radialstacked' | 'pivotbar' | 'kpi' | 'insights2' } => {
      const w = widget as unknown as {
        styling?: Record<string, unknown>;
        barConfig?: { styling?: Record<string, unknown> };
        lineConfig?: { styling?: Record<string, unknown> };
        pieConfig?: { styling?: Record<string, unknown> };
        areaConfig?: { styling?: Record<string, unknown> };
        stackedBarConfig?: { styling?: Record<string, unknown> };
        groupedBarConfig?: { styling?: Record<string, unknown> };
        stackedLinesConfig?: { styling?: Record<string, unknown> };
        radialStackedConfig?: { styling?: Record<string, unknown> };
        pivotBarConfig?: { styling?: Record<string, unknown> };
        kpiConfig?: Record<string, unknown>;
        insights2Config?: { styling?: Record<string, unknown> };
      };
      switch (widget.type) {
        case 'bar':
          w.barConfig = w.barConfig || {};
          w.barConfig.styling = w.barConfig.styling || {};
          return { target: w.barConfig.styling!, where: 'bar' };
        case 'line':
          w.lineConfig = w.lineConfig || {};
          w.lineConfig.styling = w.lineConfig.styling || {};
          return { target: w.lineConfig.styling!, where: 'line' };
        case 'pie':
          w.pieConfig = w.pieConfig || {};
          w.pieConfig.styling = w.pieConfig.styling || {};
          return { target: w.pieConfig.styling!, where: 'pie' };
        case 'area':
          w.areaConfig = w.areaConfig || {};
          w.areaConfig.styling = w.areaConfig.styling || {};
          return { target: w.areaConfig.styling!, where: 'area' };
        case 'stackedbar':
          w.stackedBarConfig = w.stackedBarConfig || {};
          w.stackedBarConfig.styling = w.stackedBarConfig.styling || {};
          return { target: w.stackedBarConfig.styling!, where: 'stackedbar' };
        case 'groupedbar':
          w.groupedBarConfig = w.groupedBarConfig || {};
          w.groupedBarConfig.styling = w.groupedBarConfig.styling || {};
          return { target: w.groupedBarConfig.styling!, where: 'groupedbar' };
        case 'stackedlines':
          w.stackedLinesConfig = w.stackedLinesConfig || {};
          w.stackedLinesConfig.styling = w.stackedLinesConfig.styling || {};
          return { target: w.stackedLinesConfig.styling!, where: 'stackedlines' };
        case 'radialstacked':
          w.radialStackedConfig = w.radialStackedConfig || {};
          w.radialStackedConfig.styling = w.radialStackedConfig.styling || {};
          return { target: w.radialStackedConfig.styling!, where: 'radialstacked' };
        case 'pivotbar':
          w.pivotBarConfig = w.pivotBarConfig || {};
          w.pivotBarConfig.styling = w.pivotBarConfig.styling || {};
          return { target: w.pivotBarConfig.styling!, where: 'pivotbar' };
        case 'kpi':
          w.kpiConfig = w.kpiConfig || {};
          return { target: w.kpiConfig!, where: 'kpi' };
        case 'insights2':
          w.insights2Config = w.insights2Config || {};
          w.insights2Config.styling = w.insights2Config.styling || {};
          return { target: w.insights2Config.styling!, where: 'insights2' };
        default:
          w.styling = w.styling || {};
          return { target: w.styling!, where: 'widget' };
      }
    };

    const applyStylingTokens = (widget: Widget, tw: string) => {
      if (!tw || !tw.trim()) return;
      const { target, where } = ensureStylingTarget(widget);
      const set = (k: string, v: unknown) => {
        (target as Record<string, unknown>)[k] = v;
      };

      const tokens = tw.trim().split(/\s+/);
      for (const tk of tokens) {
        const parts = tk.split(':');
        if (parts.length === 0) continue;
        const [p0, p1, p2] = parts;
        const key0 = p0?.toLowerCase();
        const key1 = p1?.toLowerCase();
        const val = p2 ?? p1; // for simple pairs like mb:40 p1 holds value

        // Generic booleans and numbers
        if (key0 === 'legend') { set('showLegend', key1 === 'on'); continue; }
        if (key0 === 'grid') { set('showGrid', key1 === 'on'); continue; }
        if (key0 === 'gridx') { set('enableGridX', key1 === 'on'); continue; }
        if (key0 === 'gridy') { set('enableGridY', key1 === 'on'); continue; }
        if (key0 === 'area') { set('enableArea', key1 === 'on'); continue; }
        if (key0 === 'mb') { const n = Number(val); if (!Number.isNaN(n)) set('marginBottom', n); continue; }
        if (key0 === 'compact') { set('compact', key1 === 'on'); continue; }
        if (key0 === 'radius') { const n = Number(val); if (!Number.isNaN(n)) set('borderRadius', n); continue; }
        if (key0 === 'layout') { set('layout', key1); continue; }
        // Axis Bottom tokens: axisBottom:tickSize:6 axisBottom:tickPadding:8 axisBottom:tickRotation:45
        if (key0 === 'axisbottom') {
          const n = Number(val);
          if (key1 === 'ticksize' && !Number.isNaN(n)) { set('axisBottomTickSize', n); continue; }
          if (key1 === 'tickpadding' && !Number.isNaN(n)) { set('axisBottomTickPadding', n); continue; }
          if (key1 === 'tickrotation' && !Number.isNaN(n)) { set('axisBottomTickRotation', n); continue; }
        }
        if (key0 === 'group') { set('groupMode', key1 === 'stacked' ? 'stacked' : 'grouped'); continue; }
        if (key0 === 'color') { set('colors', [val]); continue; }

        // Type-prefixed color, e.g., bar:color:#10b981
        if ((key0 === 'bar' || key0 === 'line' || key0 === 'pie' || key0 === 'area') && key1 === 'color') {
          set('colors', [val]);
          continue;
        }

        // Radial tokens: radial:start:180 radial:end:0 radial:inner:80 radial:outer:130 radial:corner:5
        if (key0 === 'radial') {
          const n = Number(val);
          if (key1 === 'start' && !Number.isNaN(n)) { set('startAngle', n); continue; }
          if (key1 === 'end' && !Number.isNaN(n)) { set('endAngle', n); continue; }
          if (key1 === 'inner' && !Number.isNaN(n)) { set('innerRadius', n); continue; }
          if (key1 === 'outer' && !Number.isNaN(n)) { set('outerRadius', n); continue; }
          if (key1 === 'corner' && !Number.isNaN(n)) { set('cornerRadius', n); continue; }
        }

        // Title tokens: title:font:600, title:size:14, title:color:#333, title:mb:12
        if (key0 === 'title') {
          if (key1 === 'font') { const n = Number(val); set('titleFontWeight', Number.isNaN(n) ? val : n); continue; }
          if (key1 === 'size') { const n = Number(val); if (!Number.isNaN(n)) set('titleFontSize', n); continue; }
          if (key1 === 'color') { set('titleColor', val); continue; }
          if (key1 === 'mb') { const n = Number(val); if (!Number.isNaN(n)) set('titleMarginBottom', n); continue; }
        }

        // KPI tokens: kpi:viz:card, kpi:unit:R$
        if (key0 === 'kpi') {
          const w = widget as unknown as { kpiConfig?: Record<string, unknown> };
          w.kpiConfig = w.kpiConfig || {};
          if (key1 === 'viz') { (w.kpiConfig as Record<string, unknown>)['visualizationType'] = val; continue; }
          if (key1 === 'unit') { (w.kpiConfig as Record<string, unknown>)['unit'] = val; continue; }
        }

        // Border variants: border:variant:smooth
        if (key0 === 'border' && key1 === 'variant') { set('containerBorderVariant', val); continue; }
        if (key0 === 'border' && key1 === 'width') { const n = Number(val); if (!Number.isNaN(n)) set('containerBorderWidth', n); continue; }
        if (key0 === 'border' && key1 === 'color') { set('containerBorderColor', val); continue; }
        // Background color: bg:#ffffff
        if (key0 === 'bg') { set('backgroundColor', val); continue; }
      }
    };

    // Generic visual parser for <kpi> and <chart>
      const parseVisualAttributes = (
        tag: 'chart' | 'kpi',
        attrStr: string,
        innerContent?: string,
        defaultStart?: number
      ): string | undefined => {
        const wa = parseAttrs(attrStr || '');
        const id = wa['id'];
        const typeRaw = tag === 'kpi' ? 'kpi' : (wa['type'] as string | undefined);
        const type = ((typeRaw === 'comparebar') ? 'groupedbar' : typeRaw) as Widget['type'];
        if (!id || !type) {
          errors.push({ line: 1, column: 1, message: `${tag} missing id or type`, type: 'validation' });
          return undefined;
        }
      const order = wa['order'] ? Number(wa['order']) : undefined;
      const heightPx = wa['height'] ? Number(wa['height']) : undefined;
      const title = wa['title'];
      const spanD = wa['span-d'] ? Number(wa['span-d']) : undefined;
      const spanT = wa['span-t'] ? Number(wa['span-t']) : undefined;
      const spanM = wa['span-m'] ? Number(wa['span-m']) : undefined;
      const colD = wa['col-d'] ? Number(wa['col-d']) : undefined;
      const colT = wa['col-t'] ? Number(wa['col-t']) : undefined;
      const colM = wa['col-m'] ? Number(wa['col-m']) : undefined;

        const widget: Widget = {
          id,
          type,
          ...(typeof order === 'number' ? { order } : {}),
          ...(typeof heightPx === 'number' ? { heightPx } : {}),
          ...(title ? { title } : {}),
          ...(spanD || spanT || spanM ? { span: { ...(spanD ? { desktop: spanD } : {}), ...(spanT ? { tablet: spanT } : {}), ...(spanM ? { mobile: spanM } : {}) } } : {}),
          ...((colD || colT || colM || defaultStart)
              ? { gridStart: {
                    ...(colD ? { desktop: colD } : (defaultStart ? { desktop: defaultStart } : {})),
                    ...(colT ? { tablet: colT } : (defaultStart ? { tablet: defaultStart } : {})),
                    ...(colM ? { mobile: colM } : (defaultStart ? { mobile: defaultStart } : {}))
                 } }
              : {})
        } as Widget;

        // Fractional widths: width, width-d, width-t, width-m
        const wd = wa['width'] || wa['width-d'];
        const wt = wa['width-t'] || undefined;
        const wm = wa['width-m'] || undefined;
        const isFr = (v?: string) => typeof v === 'string' && /fr\s*$/i.test(v.trim());
        const trim = (v?: string) => (v || '').trim();
        const frObj: { desktop?: string; tablet?: string; mobile?: string } = {};
        if (isFr(trim(wd))) frObj.desktop = trim(wd);
        if (isFr(trim(wt))) frObj.tablet = trim(wt);
        if (isFr(trim(wm))) frObj.mobile = trim(wm);
        if (Object.keys(frObj).length > 0) widget.widthFr = frObj;

      if (innerContent) {
        // Parse <config> JSON if present
        const cfgMatchInner = innerContent.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
        if (cfgMatchInner && cfgMatchInner[1]) {
          try {
            const cfgJson = JSON.parse(cfgMatchInner[1].trim());
            this.applyWidgetConfig(widget, cfgJson);
          } catch {
            errors.push({ line: 1, column: 1, message: `${tag} ${widget.id}: invalid <config> JSON`, type: 'validation' });
          }
        }
        // Parse <datasource .../>
        const dsMatch = innerContent.match(/<datasource\b([^>]*)\/>/i);
        if (dsMatch && dsMatch[1]) {
          const dsAttrs = parseAttrs(dsMatch[1]);
          applyDataSourceAttrs(widget, dsAttrs);
        }
        // Parse <styling .../?> (self-closing or paired)
        const stMatch = innerContent.match(/<styling\b([^>]*?)(?:\/>|>\s*<\/styling>)/i);
        if (stMatch && stMatch[1]) {
          const stAttrs = parseAttrs(stMatch[1]);
          const tw = stAttrs['tw'] || '';
          applyStylingTokens(widget, tw);
        }
        // Parse <items> for insights2
        const itemsMatch = innerContent.match(/<items\b([^>]*)>([\s\S]*?)<\/items>/i);
        if (itemsMatch) {
          const itemsAttrs = parseAttrs(itemsMatch[1] || '');
          const itemsBody = itemsMatch[2] || '';
          const w = widget as unknown as { insights2Config?: { title?: string; items?: Array<{ id: string; variant?: string; icon?: string; label: string; link?: { text: string; url?: string }; tail?: string }>; styling?: Record<string, unknown> } };
          w.insights2Config = w.insights2Config || {};
          if (itemsAttrs['title']) w.insights2Config.title = itemsAttrs['title'];
          const itemRegex = /<item\b([^>]*)\/>/gi;
          let im: RegExpExecArray | null;
          const collected: Array<{ id: string; variant?: string; icon?: string; label: string; link?: { text: string; url?: string }; tail?: string }> = [];
          while ((im = itemRegex.exec(itemsBody)) !== null) {
            const ia = parseAttrs(im[1] || '');
            const id = ia['id'] || `${Date.now()}-${Math.random()}`;
            const label = ia['label'] || '';
            const variant = ia['variant'];
            const icon = ia['icon'];
            const linkText = ia['link-text'] || ia['linkText'];
            const linkUrl = ia['link-url'] || ia['linkUrl'];
            const tail = ia['tail'];
            const item: { id: string; variant?: string; icon?: string; label: string; link?: { text: string; url?: string }; tail?: string } = { id, label };
            if (variant) item.variant = variant;
            if (icon) item.icon = icon;
            if (linkText || linkUrl) item.link = { text: linkText || '', url: linkUrl };
            if (tail) item.tail = tail;
            collected.push(item);
          }
          if (collected.length) {
            w.insights2Config.items = collected;
          }
        }
      }
      widgets.push(widget);
      return widget.id;
    };

    // First, parse HTML+Liquid <section>/<article> blocks in document order
    const hasHtmlSections = parseSectionsHtml();

    // grid-per-column mode: parse dashboard-level columns and widgets directly
    if (layoutMode === 'grid-per-column') {
      const colsD = Number(dashAttrs['cols-d'] || '0');
      const colsT = Number(dashAttrs['cols-t'] || '0');
      const colsM = Number(dashAttrs['cols-m'] || '0');
      const gapX = dashAttrs['gap-x'] ? Number(dashAttrs['gap-x']) : undefined;
      const gapY = dashAttrs['gap-y'] ? Number(dashAttrs['gap-y']) : undefined;
      const autoRowHeight = dashAttrs['auto-row-height'] ? Number(dashAttrs['auto-row-height']) : undefined;

      const columns = {
        desktop: { columns: Math.max(colsD || 1, 1), gapX, gapY, autoRowHeight },
        tablet: { columns: Math.max(colsT || 1, 1), gapX, gapY, autoRowHeight },
        mobile: { columns: Math.max(colsM || 1, 1), gapX, gapY, autoRowHeight }
      } as NonNullable<GridConfig['layout']>['columns'];

      // Optional template strings for explicit column widths (e.g., "1fr 4fr")
      const tmplD = dashAttrs['template-d'];
      const tmplT = dashAttrs['template-t'];
      const tmplM = dashAttrs['template-m'];
      const columnsTemplate: NonNullable<GridConfig['layout']>['columnsTemplate'] = {};
      if (tmplD) columnsTemplate.desktop = tmplD;
      if (tmplT) columnsTemplate.tablet = tmplT;
      if (tmplM) columnsTemplate.mobile = tmplM;

      // Column inner grid mapping (from <column cols-*> attributes)
      const columnsInner: NonNullable<GridConfig['layout']>['columnsInner'] = {};

      // Parse visuals handled by top-level parseVisualAttributes

      // Prefer columns if present; fallback to global scanning
      const hasColumns = /<column\b/i.test(dsl);
      if (hasColumns) {
        const columnRegex = /<column\b([^>]*)>([\s\S]*?)<\/column>/gi;
        let colMatch: RegExpExecArray | null;
        while ((colMatch = columnRegex.exec(dsl)) !== null) {
          const colAttrs = parseAttrs(colMatch[1] || '');
          const colIdStr = colAttrs['id'];
          const colId = colIdStr ? Number(colIdStr) : NaN;
          if (!colIdStr || !Number.isFinite(colId) || colId < 1) {
            errors.push({ line: 1, column: 1, message: 'Column missing valid id (>=1)', type: 'validation' });
            continue;
          }
          const cD = colAttrs['cols-d'] ? Number(colAttrs['cols-d']) : undefined;
          const cT = colAttrs['cols-t'] ? Number(colAttrs['cols-t']) : undefined;
          const cM = colAttrs['cols-m'] ? Number(colAttrs['cols-m']) : undefined;
          const label = colAttrs['label'];
          columnsInner[String(colId)] = {
            ...(cD ? { desktop: cD } : {}),
            ...(cT ? { tablet: cT } : {}),
            ...(cM ? { mobile: cM } : {}),
            ...(label ? { label } : {})
          };
          const content = colMatch[2] || '';
          // self-closing visuals inside column
          const ws = /<(kpi|chart)\b([^>]*)\/>/gi;
          let wSelf: RegExpExecArray | null;
          while ((wSelf = ws.exec(content)) !== null) {
            const tag = (wSelf[1] as 'kpi' | 'chart');
            const attrs = wSelf[2];
            parseVisualAttributes(tag, attrs, undefined, colId);
          }
          // paired visuals inside column
          const wp = /<(kpi|chart)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
          let wPair: RegExpExecArray | null;
          while ((wPair = wp.exec(content)) !== null) {
          const tag = (wPair[1] as 'kpi' | 'chart');
          const attrs = wPair[2];
          const inner = wPair[3] || '';
          parseVisualAttributes(tag, attrs, inner, colId);
        }
      }
    } else {
        // Global: scan all visuals
        const widgetSelfRegex = /<(kpi|chart)\b([^>]*)\/>/gi;
        let wSelf: RegExpExecArray | null;
        while ((wSelf = widgetSelfRegex.exec(dsl)) !== null) {
          const tag = (wSelf[1] as 'kpi' | 'chart');
          const attrs = wSelf[2];
          parseVisualAttributes(tag, attrs);
        }
        const widgetPairRegex = /<(kpi|chart)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
        let wPair: RegExpExecArray | null;
        while ((wPair = widgetPairRegex.exec(dsl)) !== null) {
          const tag = (wPair[1] as 'kpi' | 'chart');
          const attrs = wPair[2];
          const inner = wPair[3] || '';
          parseVisualAttributes(tag, attrs, inner);
        }
      }

      // Build grid config, apply theme, return
      const baseGrid: GridConfig = {
        maxRows: this.DEFAULT_GRID_CONFIG.maxRows,
        rowHeight: this.DEFAULT_GRID_CONFIG.rowHeight,
        cols: this.DEFAULT_GRID_CONFIG.cols,
        layout: { mode: 'grid-per-column', columns, ...(Object.keys(columnsTemplate).length ? { columnsTemplate } : {}), ...(Object.keys(columnsInner).length ? { columnsInner } : {}) }
      } as GridConfig;

      // Apply style/theme options (same precedence as rows mode)
      const effectiveThemeGpc = (styleObj?.['theme'] as string | undefined) || themeAttr;
      const corporateColorGpc = styleObj?.['corporateColor'] as string | undefined;
      const customBackgroundGpc = styleObj?.['customBackground'] as string | undefined;
      const customLetterSpacingGpc = typeof styleObj?.['customLetterSpacing'] === 'number' ? (styleObj!['customLetterSpacing'] as number) : undefined;
      const customFontGpc = styleObj?.['customFont'] as string | undefined;
      const customFontSizeGpc = styleObj?.['customFontSize'] as string | undefined;
      const borderTypeGpc = typeof styleObj?.['borderType'] === 'string' ? (styleObj!['borderType'] as import('./BorderManager').BorderPresetKey) : undefined;
      const borderColorGpc = typeof styleObj?.['borderColor'] === 'string' ? (styleObj!['borderColor'] as string) : undefined;
      const borderWidthGpc = typeof styleObj?.['borderWidth'] === 'number' ? (styleObj!['borderWidth'] as number) : undefined;
      const borderRadiusGpc = typeof styleObj?.['borderRadius'] === 'number' ? (styleObj!['borderRadius'] as number) : undefined;
      const borderAccentColorGpc = typeof styleObj?.['borderAccentColor'] === 'string' ? (styleObj!['borderAccentColor'] as string) : undefined;
      const borderShadowGpc = typeof styleObj?.['borderShadow'] === 'boolean' ? (styleObj!['borderShadow'] as boolean) : undefined;
      const customChartFontFamilyGpc = typeof styleObj?.['customChartFontFamily'] === 'string' ? (styleObj!['customChartFontFamily'] as string) : undefined;
      const customChartTextColorGpc = typeof styleObj?.['customChartTextColor'] === 'string' ? (styleObj!['customChartTextColor'] as string) : undefined;
      const styleBackgroundColorGpc = typeof styleObj?.['backgroundColor'] === 'string' ? (styleObj!['backgroundColor'] as string) : undefined;

      const themedGridGpc = (effectiveThemeGpc && ThemeManager.isValidTheme(effectiveThemeGpc))
        ? ThemeManager.applyThemeToGrid(baseGrid, effectiveThemeGpc, corporateColorGpc, customBackgroundGpc, customLetterSpacingGpc)
        : { ...baseGrid, letterSpacing: customLetterSpacingGpc };
      const themedGridWithOverridesGpc: GridConfig = {
        ...themedGridGpc,
        ...(styleBackgroundColorGpc ? { backgroundColor: styleBackgroundColorGpc } : {}),
        ...(borderColorGpc ? { borderColor: borderColorGpc } : {}),
        ...(typeof borderWidthGpc === 'number' ? { borderWidth: borderWidthGpc } : {}),
        ...(typeof borderRadiusGpc === 'number' ? { borderRadius: borderRadiusGpc } : {}),
      };
      const themedWidgetsGpc = (effectiveThemeGpc && ThemeManager.isValidTheme(effectiveThemeGpc))
        ? this.applyThemeToWidgets(widgets, effectiveThemeGpc, customFontGpc, corporateColorGpc, customFontSizeGpc, {
            type: borderTypeGpc,
            color: borderColorGpc,
            width: borderWidthGpc,
            radius: borderRadiusGpc,
            accentColor: borderAccentColorGpc,
            shadow: borderShadowGpc,
          }, customChartFontFamilyGpc, customChartTextColorGpc)
        : widgets;

      return {
        widgets: themedWidgetsGpc,
        gridConfig: themedGridWithOverridesGpc,
        errors,
        isValid: errors.length === 0,
        dashboardTitle,
        dashboardSubtitle,
        ...(headerConfig ? { headerConfig } : {})
      };
    }

    // grid mode: single canvas grid with direct <kpi>/<chart> children and optional <group> wrappers
    if (layoutMode === 'grid') {
      // Read columns/gaps from <dashboard>
      const colsD = Number(dashAttrs['cols-d'] || '0');
      const colsT = Number(dashAttrs['cols-t'] || '0');
      const colsM = Number(dashAttrs['cols-m'] || '0');
      const gapX = dashAttrs['gap-x'] ? Number(dashAttrs['gap-x']) : undefined;
      const gapY = dashAttrs['gap-y'] ? Number(dashAttrs['gap-y']) : undefined;
      const autoRowHeight = dashAttrs['auto-row-height'] ? Number(dashAttrs['auto-row-height']) : undefined;

      const columns = {
        desktop: { columns: Math.max(colsD || 1, 1), gapX, gapY, autoRowHeight },
        tablet: { columns: Math.max(colsT || 1, 1), gapX, gapY, autoRowHeight },
        mobile: { columns: Math.max(colsM || 1, 1), gapX, gapY, autoRowHeight }
      } as NonNullable<GridConfig['layout']>['columns'];

      // Optional template strings for explicit column widths
      const tmplD = dashAttrs['template-d'];
      const tmplT = dashAttrs['template-t'];
      const tmplM = dashAttrs['template-m'];
      const columnsTemplate: NonNullable<GridConfig['layout']>['columnsTemplate'] = {};
      if (tmplD) columnsTemplate.desktop = tmplD;
      if (tmplT) columnsTemplate.tablet = tmplT;
      if (tmplM) columnsTemplate.mobile = tmplM;

      // Parse <group> wrappers (optional)
      type GroupSpec = {
        id: string;
        title?: string;
        orientation?: 'horizontal'|'vertical';
        grid?: {
          desktop?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
          tablet?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
          mobile?: { columns: number; gapX?: number; gapY?: number; autoRowHeight?: number };
          template?: { desktop?: string; tablet?: string; mobile?: string };
        };
        children: string[];
      };
      const groups: GroupSpec[] = [];
      const groupRe = /<group\b([^>]*)>([\s\S]*?)<\/group>/gi;
      let gMatch: RegExpExecArray | null;
      // Build a copy of dsl without groups to parse remaining top-level visuals
      let dslOutside = dsl;
      while ((gMatch = groupRe.exec(dsl)) !== null) {
        const gAttrsStr = gMatch[1] || '';
        const gInner = gMatch[2] || '';
        const ga = parseAttrs(gAttrsStr);
        const gid = ga['id'];
        if (!gid) {
          errors.push({ line: 1, column: 1, message: 'group missing id', type: 'validation' });
          continue;
        }
        const title = ga['title'];
        const orientation = (ga['orientation'] as 'horizontal'|'vertical'|undefined);
        const sizing = (ga['sizing'] as 'fr'|'span'|undefined);
        const gColsD = ga['cols-d'] ? Number(ga['cols-d']) : undefined;
        const gColsT = ga['cols-t'] ? Number(ga['cols-t']) : undefined;
        const gColsM = ga['cols-m'] ? Number(ga['cols-m']) : undefined;
        const gGapX = ga['gap-x'] ? Number(ga['gap-x']) : undefined;
        const gGapY = ga['gap-y'] ? Number(ga['gap-y']) : undefined;
        const gAutoRowHeight = ga['auto-row-height'] ? Number(ga['auto-row-height']) : undefined;
        const gTmplD = ga['template-d'];
        const gTmplT = ga['template-t'];
        const gTmplM = ga['template-m'];
        const children: string[] = [];
        // Optional group-level <style>{ ...json... }</style>
        let groupStyle: Record<string, unknown> | undefined;
        const gStyleMatch = gInner.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
        if (gStyleMatch && gStyleMatch[1]) {
          try {
            const parsed = JSON.parse(gStyleMatch[1].trim());
            if (parsed && typeof parsed === 'object') groupStyle = parsed as Record<string, unknown>;
          } catch {
            errors.push({ line: 1, column: 1, message: `group ${gid}: invalid <style> JSON`, type: 'validation' });
          }
        }
        // Parse visuals inside the group
        const gSelf = /<(kpi|chart)\b([^>]*)\/>/gi;
        let gs: RegExpExecArray | null;
        while ((gs = gSelf.exec(gInner)) !== null) {
          const tag = gs[1] as 'kpi'|'chart';
          const attrs = gs[2] || '';
          const id = parseVisualAttributes(tag, attrs);
          if (id) children.push(id);
        }
        const gPair = /<(kpi|chart)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
        let gp: RegExpExecArray | null;
        while ((gp = gPair.exec(gInner)) !== null) {
          const tag = gp[1] as 'kpi'|'chart';
          const attrs = gp[2] || '';
          const inner = gp[3] || '';
          const id = parseVisualAttributes(tag, attrs, inner);
          if (id) children.push(id);
        }
        groups.push({
          id: gid,
          ...(title ? { title } : {}),
          ...(orientation ? { orientation } : {}),
          ...(sizing ? { sizing } : {}),
          grid: {
            desktop: gColsD ? { columns: gColsD, gapX: gGapX, gapY: gGapY, autoRowHeight: gAutoRowHeight } : undefined,
            tablet: gColsT ? { columns: gColsT, gapX: gGapX, gapY: gGapY, autoRowHeight: gAutoRowHeight } : undefined,
            mobile: gColsM ? { columns: gColsM, gapX: gGapX, gapY: gGapY, autoRowHeight: gAutoRowHeight } : undefined,
            template: (gTmplD || gTmplT || gTmplM) ? { desktop: gTmplD, tablet: gTmplT, mobile: gTmplM } : undefined,
          },
          ...(groupStyle ? { style: groupStyle } : {}),
          children,
        });
        // Remove this group's block from outer DSL so we don't duplicate visuals
        dslOutside = dslOutside.replace(gMatch[0], '');
      }

      // Parse remaining top-level visuals (outside groups)
      const selfRe = /<(kpi|chart)\b([^>]*)\/>/gi;
      let sMatch: RegExpExecArray | null;
      while ((sMatch = selfRe.exec(dslOutside)) !== null) {
        const tag = sMatch[1] as 'kpi' | 'chart';
        const attrs = sMatch[2] || '';
        parseVisualAttributes(tag, attrs);
      }
      const pairRe = /<(kpi|chart)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pairRe.exec(dslOutside)) !== null) {
        const tag = pMatch[1] as 'kpi' | 'chart';
        const attrs = pMatch[2] || '';
        const inner = pMatch[3] || '';
        parseVisualAttributes(tag, attrs, inner);
      }

      // Build grid config
      const baseGrid: GridConfig = {
        maxRows: this.DEFAULT_GRID_CONFIG.maxRows,
        rowHeight: this.DEFAULT_GRID_CONFIG.rowHeight,
        cols: this.DEFAULT_GRID_CONFIG.cols,
        layout: { mode: 'grid', columns, ...(Object.keys(columnsTemplate).length ? { columnsTemplate } : {}), ...(groups.length ? { groups } : {}) }
      } as GridConfig;

      // Apply theme/style options (same precedence)
      const effectiveThemeG = (styleObj?.['theme'] as string | undefined) || themeAttr;
      const corporateColorG = styleObj?.['corporateColor'] as string | undefined;
      const customBackgroundG = styleObj?.['customBackground'] as string | undefined;
      const customLetterSpacingG = typeof styleObj?.['customLetterSpacing'] === 'number' ? (styleObj!['customLetterSpacing'] as number) : undefined;
      const customFontG = styleObj?.['customFont'] as string | undefined;
      const customFontSizeG = styleObj?.['customFontSize'] as string | undefined;
      const borderTypeG = typeof styleObj?.['borderType'] === 'string' ? (styleObj!['borderType'] as import('./BorderManager').BorderPresetKey) : undefined;
      const borderColorG = typeof styleObj?.['borderColor'] === 'string' ? (styleObj!['borderColor'] as string) : undefined;
      const borderWidthG = typeof styleObj?.['borderWidth'] === 'number' ? (styleObj!['borderWidth'] as number) : undefined;
      const borderRadiusG = typeof styleObj?.['borderRadius'] === 'number' ? (styleObj!['borderRadius'] as number) : undefined;
      const borderAccentColorG = typeof styleObj?.['borderAccentColor'] === 'string' ? (styleObj!['borderAccentColor'] as string) : undefined;
      const borderShadowG = typeof styleObj?.['borderShadow'] === 'boolean' ? (styleObj!['borderShadow'] as boolean) : undefined;
      const customChartFontFamilyG = typeof styleObj?.['customChartFontFamily'] === 'string' ? (styleObj!['customChartFontFamily'] as string) : undefined;
      const customChartTextColorG = typeof styleObj?.['customChartTextColor'] === 'string' ? (styleObj!['customChartTextColor'] as string) : undefined;
      const styleBackgroundColorG = typeof styleObj?.['backgroundColor'] === 'string' ? (styleObj!['backgroundColor'] as string) : undefined;

      const themedGridG = (effectiveThemeG && ThemeManager.isValidTheme(effectiveThemeG))
        ? ThemeManager.applyThemeToGrid(baseGrid, effectiveThemeG, corporateColorG, customBackgroundG, customLetterSpacingG)
        : { ...baseGrid, letterSpacing: customLetterSpacingG };

      const themedGridWithOverridesG: GridConfig = {
        ...themedGridG,
        ...(styleBackgroundColorG ? { backgroundColor: styleBackgroundColorG } : {}),
        ...(borderColorG ? { borderColor: borderColorG } : {}),
        ...(typeof borderWidthG === 'number' ? { borderWidth: borderWidthG } : {}),
        ...(typeof borderRadiusG === 'number' ? { borderRadius: borderRadiusG } : {}),
      };

      const themedWidgetsG = (effectiveThemeG && ThemeManager.isValidTheme(effectiveThemeG))
        ? this.applyThemeToWidgets(widgets, effectiveThemeG, customFontG, corporateColorG, customFontSizeG, {
            type: borderTypeG,
            color: borderColorG,
            width: borderWidthG,
            radius: borderRadiusG,
            accentColor: borderAccentColorG,
            shadow: borderShadowG,
          }, customChartFontFamilyG, customChartTextColorG)
        : widgets;

      return {
        widgets: themedWidgetsG,
        gridConfig: themedGridWithOverridesG,
        errors,
        isValid: errors.length === 0,
        dashboardTitle,
        dashboardSubtitle,
        ...(headerConfig ? { headerConfig } : {}),
      };
    }

    // Rows
    const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(dsl)) !== null) {
      const rowAttrs = parseAttrs(rowMatch[1] || '');
      const rowId = rowAttrs['id'];
      if (!rowId) {
        errors.push({ line: 1, column: 1, message: 'Row missing id attribute', type: 'validation' });
        continue;
      }
      const colsD = Number(rowAttrs['cols-d'] || '0');
      const colsT = Number(rowAttrs['cols-t'] || '0');
      const colsM = Number(rowAttrs['cols-m'] || '0');
      if (!colsD || !colsT || !colsM) {
        errors.push({ line: 1, column: 1, message: `Row ${rowId}: cols-d/cols-t/cols-m are required`, type: 'validation' });
      }
      const gapXStr = rowAttrs['gap-x'];
      const gapYStr = rowAttrs['gap-y'];
      const arStr = rowAttrs['auto-row-height'];
      const gapX = gapXStr !== undefined ? Number(gapXStr) : undefined;
      const gapY = gapYStr !== undefined ? Number(gapYStr) : undefined;
      const autoRowHeight = arStr !== undefined ? Number(arStr) : undefined;

      layoutRows[rowId] = {
        desktop: { columns: Math.max(colsD || 1, 1), gapX, gapY, autoRowHeight },
        tablet: { columns: Math.max(colsT || 1, 1), gapX, gapY, autoRowHeight },
        mobile: { columns: Math.max(colsM || 1, 1), gapX, gapY, autoRowHeight }
      };

      const rowContent = rowMatch[2] || '';

      // Self-closing visuals
      const widgetSelfRegex = /<(kpi|chart)\b([^>]*)\/>/gi;
      let wMatch: RegExpExecArray | null;
      while ((wMatch = widgetSelfRegex.exec(rowContent)) !== null) {
        const tag = (wMatch[1] as 'kpi' | 'chart');
        const wa = parseAttrs(wMatch[2] || '');
        const widget = this.buildWidgetFromAttrsWithDefault(wa, rowId, tag === 'kpi' ? 'kpi' : undefined, errors);
        if (widget) widgets.push(widget);
      }

      // Pair visuals with optional <config>, <datasource/>, <styling/>
      const widgetPairRegex = /<(kpi|chart)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
      let wpMatch: RegExpExecArray | null;
      while ((wpMatch = widgetPairRegex.exec(rowContent)) !== null) {
        const tag = (wpMatch[1] as 'kpi' | 'chart');
        const wa = parseAttrs(wpMatch[2] || '');
        const inner = wpMatch[3] || '';
        const widget = this.buildWidgetFromAttrsWithDefault(wa, rowId, tag === 'kpi' ? 'kpi' : undefined, errors);
        if (!widget) continue;
        // Extract <config> JSON
        const cfgMatch = inner.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
        if (cfgMatch && cfgMatch[1]) {
          try {
            const cfgJson = JSON.parse(cfgMatch[1].trim());
            this.applyWidgetConfig(widget, cfgJson);
          } catch (e) {
            errors.push({ line: 1, column: 1, message: `${tag} ${widget.id}: invalid <config> JSON`, type: 'validation' });
          }
        }
        // New: parse <datasource .../>
        const dsMatch = inner.match(/<datasource\b([^>]*)\/>/i);
        if (dsMatch && dsMatch[1]) {
          const dsAttrs = parseAttrs(dsMatch[1]);
          applyDataSourceAttrs(widget, dsAttrs);
        }
        // New: parse <styling .../?> (self-closing or paired)
        const stMatch = inner.match(/<styling\b([^>]*?)(?:\/>|>\s*<\/styling>)/i);
        if (stMatch && stMatch[1]) {
          const stAttrs = parseAttrs(stMatch[1]);
          const tw = stAttrs['tw'] || '';
          applyStylingTokens(widget, tw);
        }
        widgets.push(widget);
      }
    }

    // Build grid config
    const baseGrid: GridConfig = {
      maxRows: this.DEFAULT_GRID_CONFIG.maxRows,
      rowHeight: this.DEFAULT_GRID_CONFIG.rowHeight,
      cols: this.DEFAULT_GRID_CONFIG.cols,
      layout: { mode: layoutMode, rows: layoutRows }
    } as GridConfig;

    // Resolve theme and style options
    const effectiveTheme = (styleObj?.['theme'] as string | undefined) || themeAttr;
    const corporateColor = styleObj?.['corporateColor'] as string | undefined;
    const customBackground = styleObj?.['customBackground'] as string | undefined;
    const customLetterSpacing = typeof styleObj?.['customLetterSpacing'] === 'number' ? (styleObj!['customLetterSpacing'] as number) : undefined;
    const customFont = styleObj?.['customFont'] as string | undefined;
    const customFontSize = styleObj?.['customFontSize'] as string | undefined;
    const borderType = typeof styleObj?.['borderType'] === 'string' ? (styleObj!['borderType'] as import('./BorderManager').BorderPresetKey) : undefined;
    const borderColor = typeof styleObj?.['borderColor'] === 'string' ? (styleObj!['borderColor'] as string) : undefined;
    const borderWidth = typeof styleObj?.['borderWidth'] === 'number' ? (styleObj!['borderWidth'] as number) : undefined;
    const borderRadius = typeof styleObj?.['borderRadius'] === 'number' ? (styleObj!['borderRadius'] as number) : undefined;
    const borderAccentColor = typeof styleObj?.['borderAccentColor'] === 'string' ? (styleObj!['borderAccentColor'] as string) : undefined;
    const borderShadow = typeof styleObj?.['borderShadow'] === 'boolean' ? (styleObj!['borderShadow'] as boolean) : undefined;
    const customChartFontFamily = typeof styleObj?.['customChartFontFamily'] === 'string' ? (styleObj!['customChartFontFamily'] as string) : undefined;
    const customChartTextColor = typeof styleObj?.['customChartTextColor'] === 'string' ? (styleObj!['customChartTextColor'] as string) : undefined;
    const styleBackgroundColor = typeof styleObj?.['backgroundColor'] === 'string' ? (styleObj!['backgroundColor'] as string) : undefined;

    // Theme application with style options
    const themedGrid = (effectiveTheme && ThemeManager.isValidTheme(effectiveTheme))
      ? ThemeManager.applyThemeToGrid(baseGrid, effectiveTheme, corporateColor, customBackground, customLetterSpacing)
      : { ...baseGrid, letterSpacing: customLetterSpacing };

    // Override grid border/background from styleObj if provided
    const themedGridWithOverrides: GridConfig = {
      ...themedGrid,
      ...(styleBackgroundColor ? { backgroundColor: styleBackgroundColor } : {}),
      ...(borderColor ? { borderColor } : {}),
      ...(typeof borderWidth === 'number' ? { borderWidth } : {}),
      ...(typeof borderRadius === 'number' ? { borderRadius } : {}),
    };

    const themedWidgets = (effectiveTheme && ThemeManager.isValidTheme(effectiveTheme))
      ? this.applyThemeToWidgets(widgets, effectiveTheme, customFont, corporateColor, customFontSize, {
          type: borderType,
          color: borderColor,
          width: borderWidth,
          radius: borderRadius,
          accentColor: borderAccentColor,
          shadow: borderShadow,
        }, customChartFontFamily, customChartTextColor)
      : widgets;

    return {
      widgets: themedWidgets,
      gridConfig: themedGridWithOverrides,
      errors,
      isValid: errors.length === 0,
      dashboardTitle,
      dashboardSubtitle,
      ...(headerConfig ? { headerConfig } : {}),
      ...(parsedGlobalFilters ? { globalFilters: parsedGlobalFilters } : {})
    };
  }

  private static buildWidgetFromAttrsWithDefault(attrs: Record<string, string>, rowId: string, defaultType: 'kpi' | undefined, errors: ParseError[]): Widget | null {
    const id = attrs['id'];
    const typeRaw = attrs['type'] || defaultType;
    const type = ((typeRaw === 'comparebar') ? 'groupedbar' : (typeRaw as Widget['type']));
    if (!id || !type) {
      errors.push({ line: 1, column: 1, message: `Visual missing id or type in row ${rowId}`, type: 'validation' });
      return null;
    }
    const order = attrs['order'] ? Number(attrs['order']) : undefined;
    const heightPx = attrs['height'] ? Number(attrs['height']) : undefined;
    const spanD = attrs['span-d'] ? Number(attrs['span-d']) : undefined;
    const spanT = attrs['span-t'] ? Number(attrs['span-t']) : undefined;
    const spanM = attrs['span-m'] ? Number(attrs['span-m']) : undefined;
    const title = attrs['title'];

    const widget: Widget = {
      id,
      type,
      row: rowId,
      ...(typeof order === 'number' ? { order } : {}),
      ...(typeof heightPx === 'number' ? { heightPx } : {}),
      ...(title ? { title } : {}),
    } as Widget;

    if (spanD || spanT || spanM) {
      widget.span = {
        ...(spanD ? { desktop: spanD } : {}),
        ...(spanT ? { tablet: spanT } : {}),
        ...(spanM ? { mobile: spanM } : {}),
      };
    }
    return widget;
  }

  private static applyWidgetConfig(widget: Widget, cfg: Record<string, unknown>): void {
    // dataSource mapping
    if (cfg['dataSource'] && typeof cfg['dataSource'] === 'object') {
      widget.dataSource = cfg['dataSource'] as Widget['dataSource'];
    }
    type WidgetConfigKey =
      | 'kpiConfig'
      | 'barConfig'
      | 'lineConfig'
      | 'pieConfig'
      | 'areaConfig'
      | 'stackedBarConfig'
      | 'groupedBarConfig'
      | 'stackedLinesConfig'
      | 'radialStackedConfig'
      | 'pivotBarConfig'
      | 'insights2Config';

    const map: Array<[WidgetConfigKey, string[]]> = [
      ['kpiConfig', ['kpiConfig']],
      ['barConfig', ['barConfig']],
      ['lineConfig', ['lineConfig']],
      ['pieConfig', ['pieConfig']],
      ['areaConfig', ['areaConfig']],
      ['stackedBarConfig', ['stackedBarConfig']],
      ['groupedBarConfig', ['groupedBarConfig']],
      ['stackedLinesConfig', ['stackedLinesConfig']],
      ['radialStackedConfig', ['radialStackedConfig']],
      ['pivotBarConfig', ['pivotBarConfig']],
      ['insights2Config', ['insights2Config', 'insights2']],
    ];

    // Assign config keys in a type-safe way without using 'any'
    const wcfg = widget as unknown as { [K in WidgetConfigKey]?: unknown };
    for (const [prop, keys] of map) {
      for (const k of keys) {
        if (cfg[k] && typeof cfg[k] === 'object') {
          wcfg[prop] = cfg[k] as unknown;
        }
      }
    }

    // Backwards-compat: if incoming JSON provides compareBarConfig, map it into groupedBarConfig
    if (cfg['compareBarConfig'] && typeof cfg['compareBarConfig'] === 'object') {
      const current = (wcfg['groupedBarConfig'] || {}) as Record<string, unknown>;
      wcfg['groupedBarConfig'] = { ...current, ...(cfg['compareBarConfig'] as Record<string, unknown>) } as unknown;
    }
  }

}
