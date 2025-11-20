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
  };
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
    borderColor?: string;
    borderRadius?: number;
    compact?: boolean;
  };
}

export interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'insights' | 'alerts' | 'recommendations' | 'insightsHero' | 'insights2' | 'stackedbar' | 'groupedbar' | 'stackedlines' | 'radialstacked' | 'pivotbar' | 'comparebar';
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
  // Compare chart (two measures vs one dimension)
  compareBarConfig?: {
    styling?: {
      showLegend?: boolean;
      marginBottom?: number;
      colors?: string[];
      backgroundColor?: string;
      gridColor?: string;
      // Nivo options
      groupMode?: 'grouped' | 'stacked';
      layout?: 'vertical' | 'horizontal';
    };
  };
  insightsConfig?: InsightsConfig;
  // New: Insights hero (Swiper carousel variant)
  insightsHeroConfig?: InsightsHeroConfig;
  alertsConfig?: AlertsConfig;
  recommendationsConfig?: RecommendationsConfig;
  insights2Config?: Insights2Config;
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
}

export class ConfigParser {
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi', 'insights', 'alerts', 'recommendations', 'insightsHero', 'insights2', 'stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar', 'comparebar'];
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

  static parse(jsonString: string): ParseResult {
    try {
      const raw = String(jsonString || '').trim();
      // DSL detection: starts with tag and contains <row or <dashboard or <widget
      if (
        raw.startsWith('<') &&
        (/<row\b/i.test(raw) || /<dashboard\b/i.test(raw) || /<widget\b/i.test(raw))
      ) {
        return this.parseDsl(raw);
      }
      // Step 1: Parse JSON (same as chart stores)
      const config = JSON.parse(jsonString);

      // Step 2: Extract widgets, grid config, theme, custom font, custom font size, custom background, corporate color, layout columns and dashboard metadata
      const widgets = (config.widgets || []) as Widget[];
      const rawGridConfig = config.config || {};
      const theme = config.theme as ThemeName;
      const customFont = config.customFont as string;
      const customFontSize = config.customFontSize as string;
      const customLetterSpacing = typeof config.customLetterSpacing === 'number' ? config.customLetterSpacing : undefined;
      const customBackground = config.customBackground as string;
      const customChartFontFamily = typeof config.customChartFontFamily === 'string' ? config.customChartFontFamily : undefined;
      const customChartTextColor = typeof config.customChartTextColor === 'string' ? config.customChartTextColor : undefined;
      const corporateColor = config.corporateColor as string;
      const layoutRows = (config.layoutRows || rawGridConfig.layoutRows) as Record<string, LayoutRow> | undefined;
      // New layout definition (top-level or inside config)
      const layoutDef = (config.layout || rawGridConfig.layout) as GridConfig['layout'] | undefined;
      const dashboardTitle = typeof config.dashboardTitle === 'string' ? config.dashboardTitle : undefined;
      const dashboardSubtitle = typeof config.dashboardSubtitle === 'string' ? config.dashboardSubtitle : undefined;

      // Border options (top-level)
      const borderType = typeof config.borderType === 'string' && BorderManager.isValid(config.borderType)
        ? (config.borderType as BorderPresetKey)
        : undefined;
      const borderColor = typeof config.borderColor === 'string' ? config.borderColor : undefined;
      const borderWidth = typeof config.borderWidth === 'number' ? config.borderWidth : undefined;
      const borderRadius = typeof config.borderRadius === 'number' ? config.borderRadius : undefined;
      const borderAccentColor = typeof config.borderAccentColor === 'string' ? config.borderAccentColor : undefined;
      const borderShadow = typeof config.borderShadow === 'boolean' ? config.borderShadow : undefined;

      // Step 3: Process grid config with defaults
      const gridConfig: GridConfig = {
        maxRows: typeof rawGridConfig.maxRows === 'number' && rawGridConfig.maxRows > 0
          ? rawGridConfig.maxRows : this.DEFAULT_GRID_CONFIG.maxRows,
        rowHeight: typeof rawGridConfig.rowHeight === 'number' && rawGridConfig.rowHeight > 0
          ? rawGridConfig.rowHeight : this.DEFAULT_GRID_CONFIG.rowHeight,
        cols: typeof rawGridConfig.cols === 'number' && rawGridConfig.cols > 0
          ? rawGridConfig.cols : this.DEFAULT_GRID_CONFIG.cols,
        height: typeof rawGridConfig.height === 'number' && rawGridConfig.height > 0
          ? rawGridConfig.height : undefined,
        backgroundColor: typeof rawGridConfig.backgroundColor === 'string'
          ? rawGridConfig.backgroundColor : undefined,
        borderColor: typeof rawGridConfig.borderColor === 'string'
          ? rawGridConfig.borderColor : undefined,

        // Add responsive layout rows
        layoutRows: layoutRows,
        // New grid layout definition
        layout: layoutDef
      };

      // Step 4: Basic filter for runtime safety only
      const validWidgets = widgets.filter(widget => {
        // Basic safety checks only; 'position' is optional for responsive layout
        const hasBasic = widget && typeof widget.id === 'string' && typeof widget.type === 'string' && this.VALID_TYPES.includes(widget.type);
        const hasTitle = typeof widget.title === 'string' || widget.title === undefined;
        // If a legacy 'position' is provided, it must be numeric; otherwise ignore
        const validPosition = !widget.position || (
          typeof widget.position.x === 'number' &&
          typeof widget.position.y === 'number' &&
          typeof widget.position.w === 'number' &&
          typeof widget.position.h === 'number'
        );
        return Boolean(hasBasic && hasTitle && validPosition);
      });

      // Step 5: Apply theme to widgets and grid if theme is specified and valid
      const themedWidgets = (theme && ThemeManager.isValidTheme(theme))
        ? this.applyThemeToWidgets(validWidgets, theme, customFont, corporateColor, customFontSize, {
            type: borderType,
            color: borderColor,
            width: borderWidth,
            radius: borderRadius,
            accentColor: borderAccentColor,
            shadow: borderShadow,
          }, customChartFontFamily, customChartTextColor)
        : validWidgets;

      // Step 6: Apply theme to grid (now handles custom background internally)
      const themedGridConfig = (theme && ThemeManager.isValidTheme(theme))
        ? ThemeManager.applyThemeToGrid(gridConfig, theme, corporateColor, customBackground, customLetterSpacing)
        : { ...gridConfig, letterSpacing: customLetterSpacing };

      return {
        widgets: themedWidgets,
        gridConfig: themedGridConfig,
        errors: [],
        isValid: true,
        dashboardTitle,
        dashboardSubtitle
      };
    } catch (error) {
      return {
        widgets: [],
        gridConfig: this.DEFAULT_GRID_CONFIG,
        errors: [{
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Invalid JSON',
          type: 'syntax'
        }],
        isValid: false
      };
    }
  }

  /**
   * Parse HTML-like DSL into ParseResult
   * Supported tags: <dashboard>, <row>, <widget>, <config>
   */
  private static parseDsl(dsl: string): ParseResult {
    const errors: ParseError[] = [];
    const widgets: Widget[] = [];
    const layoutRows: NonNullable<GridConfig['layout']>['rows'] = {};

    const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
    const parseAttrs = (s: string): Record<string, string> => {
      const map: Record<string, string> = {};
      for (const m of s.matchAll(attrRegex)) {
        map[m[1]] = m[2];
      }
      return map;
    };

    const dashMatch = dsl.match(/<dashboard\b([^>]*)>/i);
    const dashAttrs = dashMatch ? parseAttrs(dashMatch[1]) : {};
    const themeAttr = dashAttrs['theme'] as ThemeName | undefined;
    const dashboardTitle = dashAttrs['title'];
    const dashboardSubtitle = dashAttrs['subtitle'];
    const layoutMode = (dashAttrs['layout-mode'] as 'grid' | 'grid-per-row' | 'grid-per-column' | undefined) || 'grid-per-row';

    // Optional dashboard-level <style>{ ...json... }</style>
    const styleMatch = dsl.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
    let styleObj: Record<string, unknown> | null = null;
    if (styleMatch && styleMatch[1]) {
      try {
        const parsed = JSON.parse(styleMatch[1].trim());
        if (parsed && typeof parsed === 'object') styleObj = parsed as Record<string, unknown>;
      } catch {
        // ignore malformed style JSON, fall back to attributes
      }
    }

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

      // Parse widgets (self-closing and pair with <config>)
      const parseWidgetAttributes = (attrStr: string, innerConfig?: string, defaultStart?: number) => {
        const wa = parseAttrs(attrStr || '');
        const id = wa['id'];
        const type = wa['type'] as Widget['type'];
        if (!id || !type) {
          errors.push({ line: 1, column: 1, message: 'Widget missing id or type', type: 'validation' });
          return;
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

        if (innerConfig) {
          try {
            const cfgJson = JSON.parse(innerConfig.trim());
            this.applyWidgetConfig(widget, cfgJson);
          } catch {
            errors.push({ line: 1, column: 1, message: `Widget ${widget.id}: invalid <config> JSON`, type: 'validation' });
          }
        }
        widgets.push(widget);
      };

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
          // self-closing widgets inside column
          const ws = /<widget\b([^>]*)\/>/gi;
          let wSelf: RegExpExecArray | null;
          while ((wSelf = ws.exec(content)) !== null) {
            parseWidgetAttributes(wSelf[1], undefined, colId);
          }
          // paired widgets inside column
          const wp = /<widget\b([^>]*)>([\s\S]*?)<\/widget>/gi;
          let wPair: RegExpExecArray | null;
          while ((wPair = wp.exec(content)) !== null) {
            const inner = wPair[2] || '';
            const cfgMatch = inner.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
            parseWidgetAttributes(wPair[1], cfgMatch && cfgMatch[1] ? cfgMatch[1] : undefined, colId);
          }
        }
      } else {
        // Global: scan all widgets
        const widgetSelfRegex = /<widget\b([^>]*)\/>/gi;
        let wSelf: RegExpExecArray | null;
        while ((wSelf = widgetSelfRegex.exec(dsl)) !== null) {
          parseWidgetAttributes(wSelf[1]);
        }
        const widgetPairRegex = /<widget\b([^>]*)>([\s\S]*?)<\/widget>/gi;
        let wPair: RegExpExecArray | null;
        while ((wPair = widgetPairRegex.exec(dsl)) !== null) {
          const inner = wPair[2] || '';
          const cfgMatch = inner.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
          parseWidgetAttributes(wPair[1], cfgMatch && cfgMatch[1] ? cfgMatch[1] : undefined);
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
        dashboardSubtitle
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

      // Self-closing widgets
      const widgetSelfRegex = /<widget\b([^>]*)\/>/gi;
      let wMatch: RegExpExecArray | null;
      while ((wMatch = widgetSelfRegex.exec(rowContent)) !== null) {
        const wa = parseAttrs(wMatch[1] || '');
        const widget = this.buildWidgetFromAttrs(wa, rowId, errors);
        if (widget) widgets.push(widget);
      }

      // Pair widgets with optional <config>
      const widgetPairRegex = /<widget\b([^>]*)>([\s\S]*?)<\/widget>/gi;
      let wpMatch: RegExpExecArray | null;
      while ((wpMatch = widgetPairRegex.exec(rowContent)) !== null) {
        const wa = parseAttrs(wpMatch[1] || '');
        const inner = wpMatch[2] || '';
        const widget = this.buildWidgetFromAttrs(wa, rowId, errors);
        if (!widget) continue;
        // Extract <config> JSON
        const cfgMatch = inner.match(/<config\b[^>]*>([\s\S]*?)<\/config>/i);
        if (cfgMatch && cfgMatch[1]) {
          try {
            const cfgJson = JSON.parse(cfgMatch[1].trim());
            this.applyWidgetConfig(widget, cfgJson);
          } catch (e) {
            errors.push({ line: 1, column: 1, message: `Widget ${widget.id}: invalid <config> JSON`, type: 'validation' });
          }
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
      dashboardSubtitle
    };
  }

  private static buildWidgetFromAttrs(attrs: Record<string, string>, rowId: string, errors: ParseError[]): Widget | null {
    const id = attrs['id'];
    const type = attrs['type'] as Widget['type'];
    if (!id || !type) {
      errors.push({ line: 1, column: 1, message: `Widget missing id or type in row ${rowId}`, type: 'validation' });
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
      | 'compareBarConfig'
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
      ['compareBarConfig', ['compareBarConfig']],
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
  }

}
