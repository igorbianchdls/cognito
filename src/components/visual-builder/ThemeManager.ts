'use client';

import type { Widget, GridConfig } from './ConfigParser';
import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';
import { THEME_TOKENS, TYPOGRAPHY_PRESETS, THEME_BACKGROUND_MAPPING, type ThemeTokenName, type DesignTokens } from './DesignTokens';
import { BackgroundManager } from './BackgroundManager';

// Re-export theme name type for compatibility
export type ThemeName = ThemeTokenName;

// Default chart styling values using design tokens
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
    return themeName in THEME_TOKENS;
  }

  /**
   * Gets design tokens by theme name, automatically integrating background from BackgroundManager
   */
  static getThemeTokens(themeName: ThemeName): DesignTokens {
    const baseTokens = THEME_TOKENS[themeName];
    const backgroundPresetKey = THEME_BACKGROUND_MAPPING[themeName];
    const backgroundStyle = BackgroundManager.getBackgroundStyle(backgroundPresetKey);

    // Merge base tokens with background from BackgroundManager
    return {
      ...baseTokens,
      colors: {
        ...baseTokens.colors,
        background: backgroundStyle.backgroundColor || baseTokens.colors.background,
        grid: {
          ...baseTokens.colors.grid,
          background: backgroundStyle.backgroundColor || baseTokens.colors.grid.background
        }
      },
      effects: {
        ...baseTokens.effects,
        gradient: backgroundStyle.backgroundGradient?.enabled ? {
          type: backgroundStyle.backgroundGradient.type,
          direction: backgroundStyle.backgroundGradient.direction,
          startColor: backgroundStyle.backgroundGradient.startColor,
          endColor: backgroundStyle.backgroundGradient.endColor
        } : baseTokens.effects.gradient,
        backdrop: backgroundStyle.backdropFilter?.enabled ? {
          blur: backgroundStyle.backdropFilter.blur,
          saturate: 150, // default values for missing properties
          brightness: 110
        } : baseTokens.effects.backdrop
      }
    };
  }

  /**
   * Gets all available theme names
   */
  static getAvailableThemes(): ThemeName[] {
    return Object.keys(THEME_TOKENS) as ThemeName[];
  }

  /**
   * Applies design tokens to a single KPI widget
   */
  private static applyThemeToKPI(widget: Widget, tokens: DesignTokens): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.kpiConfig) {
      clonedWidget.kpiConfig = {} as KPIConfig;
    }

    // Apply design tokens to KPI with semantic meaning
    clonedWidget.kpiConfig.kpiContainerBackgroundColor = tokens.colors.surface;

    // KPI Value styling (equivalent to title in charts)
    clonedWidget.kpiConfig.kpiValueColor = tokens.colors.text.primary;
    clonedWidget.kpiConfig.kpiValueFontSize = tokens.typography.fontSize.xl;
    clonedWidget.kpiConfig.kpiValueFontWeight = tokens.typography.fontWeight.bold;
    clonedWidget.kpiConfig.kpiValueFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.kpiConfig.kpiValueMarginTop = 0;
    clonedWidget.kpiConfig.kpiValueMarginRight = 0;
    clonedWidget.kpiConfig.kpiValueMarginBottom = 8;
    clonedWidget.kpiConfig.kpiValueMarginLeft = 0;

    // KPI Name styling (equivalent to subtitle in charts)
    clonedWidget.kpiConfig.kpiNameColor = tokens.colors.text.secondary;
    clonedWidget.kpiConfig.kpiNameFontSize = tokens.typography.fontSize.md;
    clonedWidget.kpiConfig.kpiNameFontWeight = tokens.typography.fontWeight.medium;
    clonedWidget.kpiConfig.kpiNameFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.kpiConfig.kpiNameMarginTop = 0;
    clonedWidget.kpiConfig.kpiNameMarginRight = 0;
    clonedWidget.kpiConfig.kpiNameMarginBottom = 4;
    clonedWidget.kpiConfig.kpiNameMarginLeft = 0;

    // Apply advanced effects from tokens
    clonedWidget.kpiConfig.backgroundOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.kpiConfig.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    }
    if (tokens.effects.backdrop) {
      clonedWidget.kpiConfig.backdropFilter = {
        enabled: true,
        blur: tokens.effects.backdrop.blur
      };
    }
    clonedWidget.kpiConfig.containerShadowColor = tokens.effects.shadow.color;
    clonedWidget.kpiConfig.containerShadowOpacity = tokens.effects.shadow.opacity;
    clonedWidget.kpiConfig.containerShadowBlur = tokens.effects.shadow.blur;
    clonedWidget.kpiConfig.containerShadowOffsetX = tokens.effects.shadow.offsetX;
    clonedWidget.kpiConfig.containerShadowOffsetY = tokens.effects.shadow.offsetY;

    // Apply border properties automatically (consistent across all widgets)
    clonedWidget.kpiConfig.kpiContainerBorderColor = tokens.colors.border;
    clonedWidget.kpiConfig.kpiContainerBorderWidth = tokens.borders.width.medium;
    clonedWidget.kpiConfig.kpiContainerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Bar Chart widget
   */
  private static applyThemeToBarChart(widget: Widget, tokens: DesignTokens): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.barConfig) {
      clonedWidget.barConfig = {} as Partial<BarChartConfig>;
    }

    if (!clonedWidget.barConfig.styling) {
      clonedWidget.barConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply design tokens to Bar Chart with direct assignment (like KPI - always applies theme)
    clonedWidget.barConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    clonedWidget.barConfig.styling.titleColor = tokens.colors.text.primary;
    clonedWidget.barConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.barConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.barConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.barConfig.styling.titleMarginTop = 0;
    clonedWidget.barConfig.styling.titleMarginRight = 0;
    clonedWidget.barConfig.styling.titleMarginBottom = 8;
    clonedWidget.barConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.barConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.barConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.barConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.barConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.barConfig.styling.subtitleMarginTop = 0;
    clonedWidget.barConfig.styling.subtitleMarginRight = 0;
    clonedWidget.barConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.barConfig.styling.subtitleMarginLeft = 0;

    clonedWidget.barConfig.styling.axisTextColor = tokens.colors.text.secondary;
    clonedWidget.barConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    clonedWidget.barConfig.styling.colors = [
      tokens.colors.chartElements.bar.fill
    ];

    clonedWidget.barConfig.styling.containerBorderColor = tokens.colors.chartElements.bar.border;
    clonedWidget.barConfig.styling.containerBorderWidth = tokens.borders.width.thin;
    clonedWidget.barConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.barConfig.styling.containerShadowColor = tokens.shadows.medium;

    // Apply advanced effects from tokens
    clonedWidget.barConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.barConfig.styling.containerBackground = `${tokens.effects.gradient.type}-gradient(${tokens.effects.gradient.direction}, ${tokens.effects.gradient.startColor}, ${tokens.effects.gradient.endColor})`;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.barConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    }
    clonedWidget.barConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;

    // Apply border properties automatically (consistent across all widgets)
    clonedWidget.barConfig.styling.containerBorderColor = tokens.colors.border;
    clonedWidget.barConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.barConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Line Chart widget
   */
  private static applyThemeToLineChart(widget: Widget, tokens: DesignTokens): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.lineConfig) {
      clonedWidget.lineConfig = {} as Partial<LineChartConfig>;
    }

    if (!clonedWidget.lineConfig.styling) {
      clonedWidget.lineConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply design tokens to Line Chart with direct assignment (like KPI - always applies theme)
    clonedWidget.lineConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    clonedWidget.lineConfig.styling.titleColor = tokens.colors.text.primary;
    clonedWidget.lineConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.lineConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.lineConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.lineConfig.styling.titleMarginTop = 0;
    clonedWidget.lineConfig.styling.titleMarginRight = 0;
    clonedWidget.lineConfig.styling.titleMarginBottom = 8;
    clonedWidget.lineConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.lineConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.lineConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.lineConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.lineConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.lineConfig.styling.subtitleMarginTop = 0;
    clonedWidget.lineConfig.styling.subtitleMarginRight = 0;
    clonedWidget.lineConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.lineConfig.styling.subtitleMarginLeft = 0;

    clonedWidget.lineConfig.styling.axisTextColor = tokens.colors.text.secondary;
    clonedWidget.lineConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    clonedWidget.lineConfig.styling.colors = [tokens.colors.chartElements.line.stroke];
    clonedWidget.lineConfig.styling.containerBorderColor = tokens.colors.chartElements.line.point;
    clonedWidget.lineConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.lineConfig.styling.pointColor = tokens.colors.chartElements.line.point;
    clonedWidget.lineConfig.styling.pointBorderColor = tokens.colors.chartElements.line.pointBorder;

    // Apply advanced effects from tokens
    clonedWidget.lineConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.lineConfig.styling.containerBackground = `${tokens.effects.gradient.type}-gradient(${tokens.effects.gradient.direction}, ${tokens.effects.gradient.startColor}, ${tokens.effects.gradient.endColor})`;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.lineConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    }
    clonedWidget.lineConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;

    // Apply border properties automatically (consistent across all widgets)
    clonedWidget.lineConfig.styling.containerBorderColor = tokens.colors.border;
    clonedWidget.lineConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.lineConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Pie Chart widget
   */
  private static applyThemeToPieChart(widget: Widget, tokens: DesignTokens): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.pieConfig) {
      clonedWidget.pieConfig = {} as Partial<PieChartConfig>;
    }

    if (!clonedWidget.pieConfig.styling) {
      clonedWidget.pieConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply design tokens to Pie Chart with direct assignment (like KPI - always applies theme)
    clonedWidget.pieConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    clonedWidget.pieConfig.styling.titleColor = tokens.colors.text.primary;
    clonedWidget.pieConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.pieConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.pieConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.pieConfig.styling.titleMarginTop = 0;
    clonedWidget.pieConfig.styling.titleMarginRight = 0;
    clonedWidget.pieConfig.styling.titleMarginBottom = 8;
    clonedWidget.pieConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.pieConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.pieConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.pieConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.pieConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.pieConfig.styling.subtitleMarginTop = 0;
    clonedWidget.pieConfig.styling.subtitleMarginRight = 0;
    clonedWidget.pieConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.pieConfig.styling.subtitleMarginLeft = 0;

    clonedWidget.pieConfig.styling.colors = [
      tokens.colors.chartElements.bar.fill,
      tokens.colors.chartElements.line.stroke,
      tokens.colors.chartElements.area.fill,
      tokens.colors.chartElements.pie.arcLabel
    ];

    clonedWidget.pieConfig.styling.containerBorderColor = tokens.colors.chartElements.pie.border;
    clonedWidget.pieConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.pieConfig.styling.arcLabelsTextColor = tokens.colors.chartElements.pie.arcLabel;
    clonedWidget.pieConfig.styling.arcLinkLabelsTextColor = tokens.colors.chartElements.pie.arcLinkLabel;

    // Apply advanced effects from tokens
    clonedWidget.pieConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.pieConfig.styling.containerBackground = `${tokens.effects.gradient.type}-gradient(${tokens.effects.gradient.direction}, ${tokens.effects.gradient.startColor}, ${tokens.effects.gradient.endColor})`;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.pieConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    }
    clonedWidget.pieConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;

    // Apply border properties automatically (consistent across all widgets)
    clonedWidget.pieConfig.styling.containerBorderColor = tokens.colors.border;
    clonedWidget.pieConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.pieConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Area Chart widget
   */
  private static applyThemeToAreaChart(widget: Widget, tokens: DesignTokens): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.areaConfig) {
      clonedWidget.areaConfig = {} as Partial<AreaChartConfig>;
    }

    if (!clonedWidget.areaConfig.styling) {
      clonedWidget.areaConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply design tokens to Area Chart with direct assignment (like KPI - always applies theme)
    clonedWidget.areaConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    clonedWidget.areaConfig.styling.titleColor = tokens.colors.text.primary;
    clonedWidget.areaConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.areaConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.areaConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.areaConfig.styling.titleMarginTop = 0;
    clonedWidget.areaConfig.styling.titleMarginRight = 0;
    clonedWidget.areaConfig.styling.titleMarginBottom = 8;
    clonedWidget.areaConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.areaConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.areaConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.areaConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.areaConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.areaConfig.styling.subtitleMarginTop = 0;
    clonedWidget.areaConfig.styling.subtitleMarginRight = 0;
    clonedWidget.areaConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.areaConfig.styling.subtitleMarginLeft = 0;

    clonedWidget.areaConfig.styling.axisTextColor = tokens.colors.text.secondary;
    clonedWidget.areaConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    clonedWidget.areaConfig.styling.colors = [tokens.colors.chartElements.area.fill];
    clonedWidget.areaConfig.styling.containerBorderColor = tokens.colors.chartElements.area.stroke;
    clonedWidget.areaConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.areaConfig.styling.lineColor = tokens.colors.chartElements.area.stroke;
    clonedWidget.areaConfig.styling.pointColor = tokens.colors.chartElements.area.point;
    clonedWidget.areaConfig.styling.pointBorderColor = tokens.colors.chartElements.area.pointBorder;

    // Apply advanced effects from tokens
    clonedWidget.areaConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.areaConfig.styling.containerBackground = `${tokens.effects.gradient.type}-gradient(${tokens.effects.gradient.direction}, ${tokens.effects.gradient.startColor}, ${tokens.effects.gradient.endColor})`;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.areaConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    }
    clonedWidget.areaConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;

    // Apply border properties automatically (consistent across all widgets)
    clonedWidget.areaConfig.styling.containerBorderColor = tokens.colors.border;
    clonedWidget.areaConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.areaConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single widget based on its type
   */
  static applyThemeToWidget(widget: Widget, themeName: ThemeName, customFont?: string): Widget {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Skipping theme application.`);
      return widget;
    }

    let tokens = this.getThemeTokens(themeName);

    // Override typography if customFont is provided
    if (customFont && customFont in TYPOGRAPHY_PRESETS) {
      const customTypography = TYPOGRAPHY_PRESETS[customFont as keyof typeof TYPOGRAPHY_PRESETS];
      tokens = {
        ...tokens,
        typography: customTypography
      };
    }

    switch (widget.type) {
      case 'kpi':
        return this.applyThemeToKPI(widget, tokens);
      case 'bar':
        return this.applyThemeToBarChart(widget, tokens);
      case 'line':
        return this.applyThemeToLineChart(widget, tokens);
      case 'pie':
        return this.applyThemeToPieChart(widget, tokens);
      case 'area':
        return this.applyThemeToAreaChart(widget, tokens);
      default:
        console.warn(`Unknown widget type: ${widget.type}. Skipping theme application.`);
        return widget;
    }
  }

  /**
   * Applies design tokens to multiple widgets
   */
  static applyThemeToWidgets(widgets: Widget[], themeName: ThemeName, customFont?: string): Widget[] {
    return widgets.map(widget => this.applyThemeToWidget(widget, themeName, customFont));
  }

  /**
   * Applies design tokens to grid configuration
   */
  static applyThemeToGrid(gridConfig: GridConfig, themeName: ThemeName): GridConfig {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Skipping grid theme application.`);
      return gridConfig;
    }

    const tokens = this.getThemeTokens(themeName);

    // Get the background preset for this theme
    const backgroundPresetKey = THEME_BACKGROUND_MAPPING[themeName];
    const backgroundStyle = BackgroundManager.getBackgroundStyle(backgroundPresetKey);

    return {
      ...gridConfig,
      // Apply background from BackgroundManager instead of hardcoded values
      ...backgroundStyle,

      // Border color from theme tokens (preserve theme consistency)
      borderColor: gridConfig.borderColor || tokens.colors.grid.border,

      // Border & Shadow effects from theme tokens
      borderWidth: gridConfig.borderWidth || tokens.borders.width.thin,
      borderRadius: gridConfig.borderRadius || tokens.borders.radius.md,
      containerShadowColor: gridConfig.containerShadowColor || tokens.effects.shadow.color,
      containerShadowOpacity: gridConfig.containerShadowOpacity || tokens.effects.shadow.opacity,
      containerShadowBlur: gridConfig.containerShadowBlur || tokens.effects.shadow.blur,
      containerShadowOffsetX: gridConfig.containerShadowOffsetX || tokens.effects.shadow.offsetX,
      containerShadowOffsetY: gridConfig.containerShadowOffsetY || tokens.effects.shadow.offsetY,

      // Spacing
      padding: gridConfig.padding || tokens.spacing.md,
      margin: gridConfig.margin || tokens.spacing.sm,

      // Keep advanced effects if they were already set manually
      backgroundOpacity: gridConfig.backgroundOpacity || tokens.effects.opacity.subtle
    };
  }

  /**
   * Gets theme preview/description for UI
   */
  static getThemePreview(themeName: ThemeName): {
    name: string;
    description: string;
    tokens: DesignTokens;
    primaryColor: string;
    backgroundColor: string;
    backgroundPreset: string;
  } {
    const tokens = this.getThemeTokens(themeName);
    const backgroundPresetKey = THEME_BACKGROUND_MAPPING[themeName];
    const backgroundStyle = BackgroundManager.getBackgroundStyle(backgroundPresetKey);

    const previews = {
      light: { name: 'Light', description: 'Clean white background with dark text' },
      dark: { name: 'Dark', description: 'Modern dark theme with enhanced contrast' },
      blue: { name: 'Blue', description: 'Professional blue ocean theme' },
      green: { name: 'Green', description: 'Nature-inspired green theme' },
      corporate: { name: 'Corporate', description: 'Professional business gray theme' },
      navy: { name: 'Navy', description: 'Executive navy blue for C-level presentations' },
      slate: { name: 'Slate', description: 'Premium gray for financial analytics' },
      forest: { name: 'Forest', description: 'Sustainable green for ESG dashboards' },
      burgundy: { name: 'Burgundy', description: 'Sophisticated wine red for sales metrics' },
      platinum: { name: 'Platinum', description: 'Elegant silver for premium reports' }
    };

    return {
      ...previews[themeName],
      tokens,
      primaryColor: tokens.colors.primary,
      backgroundColor: backgroundStyle.backgroundColor || tokens.colors.background || '#ffffff',
      backgroundPreset: backgroundPresetKey
    };
  }

  /**
   * Gets color palette for a theme (useful for UI color pickers)
   */
  static getThemeColorPalette(themeName: ThemeName) {
    const tokens = this.getThemeTokens(themeName);
    return {
      primary: tokens.colors.primary,
      secondary: tokens.colors.secondary,
      accent: tokens.colors.accent,
      surface: tokens.colors.surface,
      background: tokens.colors.background || '#ffffff',
      chartColors: [
        tokens.colors.chart.primary,
        tokens.colors.chart.secondary,
        tokens.colors.chart.tertiary,
        tokens.colors.chart.quaternary
      ]
    };
  }
}