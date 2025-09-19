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
  containerHeight?: number;
}

export type Theme = 'light' | 'dark';

export interface ThemeConfig {
  light: {
    backgroundColor: string;
  };
  dark: {
    backgroundColor: string;
  };
}

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

  private static THEME_COLORS: ThemeConfig = {
    light: {
      backgroundColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#1a1a1a'
    }
  };

  private static applyThemeToWidgets(widgets: Widget[], theme: Theme): Widget[] {
    const backgroundColor = this.THEME_COLORS[theme].backgroundColor;

    return widgets.map(widget => {
      const clonedWidget = { ...widget };

      switch (widget.type) {
        case 'kpi':
          if (!clonedWidget.kpiConfig) {
            clonedWidget.kpiConfig = {};
          }
          clonedWidget.kpiConfig.kpiContainerBackgroundColor = backgroundColor;
          break;

        case 'bar':
          if (!clonedWidget.barConfig) {
            clonedWidget.barConfig = {};
          }
          if (!clonedWidget.barConfig.styling) {
            clonedWidget.barConfig.styling = {};
          }
          clonedWidget.barConfig.styling.backgroundColor = backgroundColor;
          break;

        case 'line':
          if (!clonedWidget.lineConfig) {
            clonedWidget.lineConfig = {};
          }
          if (!clonedWidget.lineConfig.styling) {
            clonedWidget.lineConfig.styling = {};
          }
          clonedWidget.lineConfig.styling.backgroundColor = backgroundColor;
          break;

        case 'pie':
          if (!clonedWidget.pieConfig) {
            clonedWidget.pieConfig = {};
          }
          if (!clonedWidget.pieConfig.styling) {
            clonedWidget.pieConfig.styling = {};
          }
          clonedWidget.pieConfig.styling.backgroundColor = backgroundColor;
          break;

        case 'area':
          if (!clonedWidget.areaConfig) {
            clonedWidget.areaConfig = {};
          }
          if (!clonedWidget.areaConfig.styling) {
            clonedWidget.areaConfig.styling = {};
          }
          clonedWidget.areaConfig.styling.backgroundColor = backgroundColor;
          break;
      }

      return clonedWidget;
    });
  }

  static parse(jsonString: string): ParseResult {
    try {
      // Step 1: Parse JSON (same as chart stores)
      const config = JSON.parse(jsonString);

      // Step 2: Extract widgets, grid config, and theme
      const widgets = (config.widgets || []) as Widget[];
      const rawGridConfig = config.config || {};
      const theme = config.theme as Theme;

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

      // Step 5: Apply theme to widgets if theme is specified
      const themedWidgets = theme ? this.applyThemeToWidgets(validWidgets, theme) : validWidgets;

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