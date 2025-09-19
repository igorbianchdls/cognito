'use client';

import type { Widget } from './ConfigParser';
import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';

// Theme type definition
export type ThemeName = 'light' | 'dark' | 'blue' | 'green' | 'corporate';

// Theme definition interface - expandable for future properties
export interface ThemeDefinition {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  // Future properties can be added here:
  // gradientStart?: string;
  // gradientEnd?: string;
  // accentColor?: string;
  // successColor?: string;
  // warningColor?: string;
  // errorColor?: string;
}

// All available themes
export const THEMES: Record<ThemeName, ThemeDefinition> = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    borderColor: '#e2e8f0',
    shadowColor: '#00000010'
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textColor: '#f1f5f9',
    borderColor: '#374151',
    shadowColor: '#00000040'
  },
  blue: {
    backgroundColor: '#1e40af',
    textColor: '#dbeafe',
    borderColor: '#3b82f6',
    shadowColor: '#1e40af20'
  },
  green: {
    backgroundColor: '#166534',
    textColor: '#dcfce7',
    borderColor: '#22c55e',
    shadowColor: '#16653420'
  },
  corporate: {
    backgroundColor: '#f8fafc',
    textColor: '#334155',
    borderColor: '#cbd5e1',
    shadowColor: '#00000008'
  }
};

// Default chart styling values
const DEFAULT_CHART_STYLING = {
  colors: [],
  showLegend: true,
  showGrid: true
};

export class ThemeManager {
  /**
   * Validates if a theme name is supported
   */
  static isValidTheme(themeName: string): themeName is ThemeName {
    return themeName in THEMES;
  }

  /**
   * Gets theme definition by name
   */
  static getTheme(themeName: ThemeName): ThemeDefinition {
    return THEMES[themeName];
  }

  /**
   * Gets all available theme names
   */
  static getAvailableThemes(): ThemeName[] {
    return Object.keys(THEMES) as ThemeName[];
  }

  /**
   * Applies theme to a single KPI widget
   */
  private static applyThemeToKPI(widget: Widget, theme: ThemeDefinition): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.kpiConfig) {
      clonedWidget.kpiConfig = {} as KPIConfig;
    }

    // Apply theme properties to KPI
    clonedWidget.kpiConfig.kpiContainerBackgroundColor = theme.backgroundColor;
    clonedWidget.kpiConfig.kpiValueColor = theme.textColor;

    return clonedWidget;
  }

  /**
   * Applies theme to a single Bar Chart widget
   */
  private static applyThemeToBarChart(widget: Widget, theme: ThemeDefinition): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.barConfig) {
      clonedWidget.barConfig = {} as Partial<BarChartConfig>;
    }

    if (!clonedWidget.barConfig.styling) {
      clonedWidget.barConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply theme properties to Bar Chart
    clonedWidget.barConfig.styling.backgroundColor = theme.backgroundColor;
    clonedWidget.barConfig.styling.titleColor = theme.textColor;
    clonedWidget.barConfig.styling.axisTextColor = theme.textColor;

    return clonedWidget;
  }

  /**
   * Applies theme to a single Line Chart widget
   */
  private static applyThemeToLineChart(widget: Widget, theme: ThemeDefinition): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.lineConfig) {
      clonedWidget.lineConfig = {} as Partial<LineChartConfig>;
    }

    if (!clonedWidget.lineConfig.styling) {
      clonedWidget.lineConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply theme properties to Line Chart
    clonedWidget.lineConfig.styling.backgroundColor = theme.backgroundColor;
    clonedWidget.lineConfig.styling.titleColor = theme.textColor;
    clonedWidget.lineConfig.styling.axisTextColor = theme.textColor;

    return clonedWidget;
  }

  /**
   * Applies theme to a single Pie Chart widget
   */
  private static applyThemeToPieChart(widget: Widget, theme: ThemeDefinition): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.pieConfig) {
      clonedWidget.pieConfig = {} as Partial<PieChartConfig>;
    }

    if (!clonedWidget.pieConfig.styling) {
      clonedWidget.pieConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply theme properties to Pie Chart
    clonedWidget.pieConfig.styling.backgroundColor = theme.backgroundColor;
    clonedWidget.pieConfig.styling.titleColor = theme.textColor;
    clonedWidget.pieConfig.styling.axisTextColor = theme.textColor;

    return clonedWidget;
  }

  /**
   * Applies theme to a single Area Chart widget
   */
  private static applyThemeToAreaChart(widget: Widget, theme: ThemeDefinition): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.areaConfig) {
      clonedWidget.areaConfig = {} as Partial<AreaChartConfig>;
    }

    if (!clonedWidget.areaConfig.styling) {
      clonedWidget.areaConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply theme properties to Area Chart
    clonedWidget.areaConfig.styling.backgroundColor = theme.backgroundColor;
    clonedWidget.areaConfig.styling.titleColor = theme.textColor;
    clonedWidget.areaConfig.styling.axisTextColor = theme.textColor;

    return clonedWidget;
  }

  /**
   * Applies theme to a single widget based on its type
   */
  static applyThemeToWidget(widget: Widget, themeName: ThemeName): Widget {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Skipping theme application.`);
      return widget;
    }

    const theme = this.getTheme(themeName);

    switch (widget.type) {
      case 'kpi':
        return this.applyThemeToKPI(widget, theme);
      case 'bar':
        return this.applyThemeToBarChart(widget, theme);
      case 'line':
        return this.applyThemeToLineChart(widget, theme);
      case 'pie':
        return this.applyThemeToPieChart(widget, theme);
      case 'area':
        return this.applyThemeToAreaChart(widget, theme);
      default:
        console.warn(`Unknown widget type: ${widget.type}. Skipping theme application.`);
        return widget;
    }
  }

  /**
   * Applies theme to multiple widgets
   */
  static applyThemeToWidgets(widgets: Widget[], themeName: ThemeName): Widget[] {
    return widgets.map(widget => this.applyThemeToWidget(widget, themeName));
  }

  /**
   * Gets theme preview/description for UI
   */
  static getThemePreview(themeName: ThemeName): { name: string; description: string; colors: ThemeDefinition } {
    const theme = this.getTheme(themeName);

    const previews = {
      light: { name: 'Light', description: 'Clean white background with dark text' },
      dark: { name: 'Dark', description: 'Dark background with light text' },
      blue: { name: 'Blue', description: 'Professional blue theme' },
      green: { name: 'Green', description: 'Nature-inspired green theme' },
      corporate: { name: 'Corporate', description: 'Professional light gray theme' }
    };

    return {
      ...previews[themeName],
      colors: theme
    };
  }
}