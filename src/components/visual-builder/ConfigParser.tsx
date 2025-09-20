'use client';

import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';

export interface GridConfig {
  maxRows: number;
  rowHeight: number;
  cols: number;
  height?: number;
  containerHeight?: number;
}

// Theme types are now managed by ThemeManager
import { ThemeManager, type ThemeName } from './ThemeManager';

export interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'kpi';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  title: string;
  data?: {
    x: string;
    y: string;
  };
  value?: number;
  unit?: string;
  dataSource?: {
    table: string;
    x: string;
    y?: string;
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN';
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
}

export class ConfigParser {
  private static VALID_TYPES = ['bar', 'line', 'pie', 'area', 'kpi'];
  private static DEFAULT_GRID_CONFIG: GridConfig = {
    maxRows: 12,
    rowHeight: 30,
    cols: 12
  };


  private static applyThemeToWidgets(widgets: Widget[], theme: ThemeName): Widget[] {
    return ThemeManager.applyThemeToWidgets(widgets, theme);
  }

  static parse(jsonString: string): ParseResult {
    try {
      // Step 1: Parse JSON (same as chart stores)
      const config = JSON.parse(jsonString);

      // Step 2: Extract widgets, grid config, and theme
      const widgets = (config.widgets || []) as Widget[];
      const rawGridConfig = config.config || {};
      const theme = config.theme as ThemeName;

      // Step 3: Process grid config with defaults
      const gridConfig: GridConfig = {
        maxRows: typeof rawGridConfig.maxRows === 'number' && rawGridConfig.maxRows > 0
          ? rawGridConfig.maxRows : this.DEFAULT_GRID_CONFIG.maxRows,
        rowHeight: typeof rawGridConfig.rowHeight === 'number' && rawGridConfig.rowHeight > 0
          ? rawGridConfig.rowHeight : this.DEFAULT_GRID_CONFIG.rowHeight,
        cols: typeof rawGridConfig.cols === 'number' && rawGridConfig.cols > 0
          ? rawGridConfig.cols : this.DEFAULT_GRID_CONFIG.cols
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

      // Step 5: Apply theme to widgets if theme is specified and valid
      const themedWidgets = (theme && ThemeManager.isValidTheme(theme))
        ? this.applyThemeToWidgets(validWidgets, theme)
        : validWidgets;

      return {
        widgets: themedWidgets,
        gridConfig,
        errors: [],
        isValid: true
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