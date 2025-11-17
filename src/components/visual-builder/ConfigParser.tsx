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

export interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'insights' | 'alerts' | 'recommendations' | 'insightsHero' | 'stackedbar' | 'groupedbar' | 'stackedlines' | 'radialstacked' | 'pivotbar';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  title?: string;

  // Responsive layout properties (for ResponsiveGridCanvas)
  row?: string;           // Reference to layoutRows key (e.g., "1", "2")
  span?: WidgetSpan;      // How many columns to span on each breakpoint
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
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi', 'insights', 'alerts', 'recommendations', 'insightsHero', 'stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar'];
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
    }
  ): Widget[] {
    return ThemeManager.applyThemeToWidgets(
      widgets,
      theme,
      customFont,
      corporateColor,
      customFontSize,
      borderOptions
    );
  }

  static parse(jsonString: string): ParseResult {
    try {
      // Step 1: Parse JSON (same as chart stores)
      const config = JSON.parse(jsonString);

      // Step 2: Extract widgets, grid config, theme, custom font, custom font size, custom background, corporate color, layout columns and dashboard metadata
      const widgets = (config.widgets || []) as Widget[];
      const rawGridConfig = config.config || {};
      const theme = config.theme as ThemeName;
      const customFont = config.customFont as string;
      const customFontSize = config.customFontSize as string;
      const customBackground = config.customBackground as string;
      const corporateColor = config.corporateColor as string;
      const layoutRows = (config.layoutRows || rawGridConfig.layoutRows) as Record<string, LayoutRow> | undefined;
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
        layoutRows: layoutRows
      };

      // Step 4: Basic filter for runtime safety only
      const validWidgets = widgets.filter(widget => {
        return widget &&
               typeof widget.id === 'string' &&
               typeof widget.type === 'string' &&
               this.VALID_TYPES.includes(widget.type) &&
               widget.position &&
               typeof widget.position.x === 'number' &&
               typeof widget.position.y === 'number' &&
               typeof widget.position.w === 'number' &&
               typeof widget.position.h === 'number' &&
               typeof widget.title === 'string';
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
          })
        : validWidgets;

      // Step 6: Apply theme to grid (now handles custom background internally)
      const themedGridConfig = (theme && ThemeManager.isValidTheme(theme))
        ? ThemeManager.applyThemeToGrid(gridConfig, theme, corporateColor, customBackground)
        : gridConfig;

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

}
