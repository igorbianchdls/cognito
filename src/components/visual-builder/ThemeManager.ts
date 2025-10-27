'use client';

import type { Widget, GridConfig } from './ConfigParser';
import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';
import { THEME_TOKENS, TYPOGRAPHY_PRESETS, THEME_BACKGROUND_MAPPING, type ThemeTokenName, type DesignTokens } from './DesignTokens';
import { BackgroundManager } from './BackgroundManager';
import { BorderManager, type BorderPresetKey } from './BorderManager';
import { ColorManager, type ColorPresetKey } from './ColorManager';
import { FontManager, type FontSizeKey } from './FontManager';

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
  static getThemeTokens(themeName: ThemeName, corporateColorKey?: string): DesignTokens {
    const baseTokens = THEME_TOKENS[themeName];
    const backgroundPresetKey = THEME_BACKGROUND_MAPPING[themeName];
    const backgroundStyle = BackgroundManager.getBackgroundStyle(backgroundPresetKey);

    // Apply ColorManager colors for all themes
    let mergedColors = baseTokens.colors;

    // Use selected color palette or default to theme name
    const selectedColorKey = (corporateColorKey && ColorManager.isValidPreset(corporateColorKey))
      ? corporateColorKey as ColorPresetKey
      : themeName as ColorPresetKey;

    // Only apply if the color key is valid (theme has a corresponding palette)
    if (ColorManager.isValidPreset(selectedColorKey)) {
      const themeColors = ColorManager.getColorPalette(selectedColorKey);
      mergedColors = {
        ...baseTokens.colors,
        // Apply theme colors from ColorManager
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        accent: themeColors.tertiary,
        borderFocus: themeColors.primary,
        // Chart colors
        chart: {
          ...baseTokens.colors.chart,
          primary: themeColors.primary,
          secondary: themeColors.secondary,
          tertiary: themeColors.tertiary,
          quaternary: themeColors.quaternary,
        },
        // Pie slice colors
        pieSliceColors: themeColors.pieSlices,
        // Chart elements
        chartElements: {
          ...baseTokens.colors.chartElements,
          bar: {
            ...baseTokens.colors.chartElements.bar,
            fill: themeColors.chartElements.bar.fill,
            border: themeColors.chartElements.bar.border,
            label: themeColors.chartElements.bar.label
          },
          line: {
            ...baseTokens.colors.chartElements.line,
            stroke: themeColors.chartElements.line.stroke,
            point: themeColors.chartElements.line.point,
            pointBorder: themeColors.chartElements.line.pointBorder,
            pointLabel: themeColors.chartElements.line.pointLabel
          },
          area: {
            ...baseTokens.colors.chartElements.area,
            fill: themeColors.chartElements.area.fill,
            stroke: themeColors.chartElements.area.stroke,
            point: themeColors.chartElements.area.point,
            pointBorder: themeColors.chartElements.area.pointBorder,
            pointLabel: themeColors.chartElements.area.pointLabel
          },
          pie: {
            ...baseTokens.colors.chartElements.pie,
            border: themeColors.chartElements.pie.border,
            arcLabel: themeColors.chartElements.pie.arcLabel,
            arcLinkLabel: themeColors.chartElements.pie.arcLinkLabel
          }
        }
      };
    }

    // Merge base tokens with background from BackgroundManager and colors
    return {
      ...baseTokens,
      colors: {
        ...mergedColors,
        background: backgroundStyle.backgroundColor || mergedColors.background,
        grid: {
          ...mergedColors.grid,
          background: backgroundStyle.backgroundColor || mergedColors.grid.background
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
  private static applyThemeToKPI(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.kpiConfig) {
      clonedWidget.kpiConfig = {} as KPIConfig;
    }

    // Apply design tokens to KPI with semantic meaning
    clonedWidget.kpiConfig.kpiContainerBackgroundColor = tokens.colors.surface;

    // KPI Value styling (fixed values to match dark cards)
    clonedWidget.kpiConfig.kpiValueColor = tokens.colors.text.primary;
    clonedWidget.kpiConfig.kpiValueFontSize = 28; // Fixed size to match dark cards
    clonedWidget.kpiConfig.kpiValueFontWeight = 600; // Fixed weight to match dark cards
    clonedWidget.kpiConfig.kpiValueFontFamily = tokens.typography.fontFamily.primary;

    // KPI Name styling (fixed size, default weight like dark cards)
    clonedWidget.kpiConfig.kpiNameColor = tokens.colors.text.secondary;
    clonedWidget.kpiConfig.kpiNameFontSize = 14; // Fixed size to match dark cards
    clonedWidget.kpiConfig.kpiNameFontFamily = tokens.typography.fontFamily.primary;

    // Apply advanced effects from tokens
    clonedWidget.kpiConfig.backgroundOpacity = tokens.effects.opacity.medium;

    // Always apply gradient (enabled: true if defined, enabled: false if undefined)
    if (tokens.effects.gradient) {
      clonedWidget.kpiConfig.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.kpiConfig.backgroundGradient = {
        enabled: false,
        type: 'linear',
        direction: '0deg',
        startColor: tokens.colors.surface,
        endColor: tokens.colors.surface
      };
    }

    // Always apply backdrop filter (enabled: true if defined, enabled: false if undefined)
    if (tokens.effects.backdrop) {
      clonedWidget.kpiConfig.backdropFilter = {
        enabled: true,
        blur: tokens.effects.backdrop.blur
      };
    } else {
      clonedWidget.kpiConfig.backdropFilter = {
        enabled: false,
        blur: 0
      };
    }
    // Standard effects from tokens
    clonedWidget.kpiConfig.containerShadowColor = tokens.effects.shadow.color;
    clonedWidget.kpiConfig.containerShadowOpacity = tokens.effects.shadow.opacity;
    clonedWidget.kpiConfig.containerShadowBlur = tokens.effects.shadow.blur;
    clonedWidget.kpiConfig.containerShadowOffsetX = tokens.effects.shadow.offsetX;
    clonedWidget.kpiConfig.containerShadowOffsetY = tokens.effects.shadow.offsetY;

    // Standard border from tokens
    clonedWidget.kpiConfig.kpiContainerBorderColor = tokens.borders.color;
    clonedWidget.kpiConfig.kpiContainerBorderAccentColor = tokens.borders.accentColor;
    clonedWidget.kpiConfig.kpiContainerBorderWidth = tokens.borders.width.thin;
    clonedWidget.kpiConfig.kpiContainerBorderRadius = tokens.borders.radius.md;

    clonedWidget.kpiConfig.kpiContainerShadow = tokens.effects.shadow.opacity > 0;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Bar Chart widget
   */
  private static applyThemeToBarChart(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
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

    clonedWidget.barConfig.styling.axisTextColor = tokens.colors.chart.axis;
    clonedWidget.barConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    // Grid styling - apply theme grid properties
    clonedWidget.barConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.barConfig.styling.gridStrokeWidth = 0.5;

    clonedWidget.barConfig.styling.colors = [
      tokens.colors.chartElements.bar.fill
    ];
    clonedWidget.barConfig.styling.containerShadowColor = tokens.shadows.medium;

    // Apply advanced effects from tokens
    clonedWidget.barConfig.styling.containerOpacity = tokens.effects.opacity.medium;

    // Always apply gradient props directly (like KPI implementation)
    if (tokens.effects.gradient) {
      clonedWidget.barConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.barConfig.styling.backgroundGradient = undefined;
    }

    // Always apply backdrop filter (blur if defined, cleared if undefined)
    if (tokens.effects.backdrop) {
      clonedWidget.barConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.barConfig.styling.containerBackdropFilter = undefined;
    }
    // Create enhanced shadow for hightech theme
    if (tokens.effects.shadow.color === '#00ffff') {
      // Hightech theme: No shadow
      clonedWidget.barConfig.styling.containerBoxShadow = 'none';
    } else {
      // Other themes: Standard shadow
      clonedWidget.barConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Apply border properties from tokens
    clonedWidget.barConfig.styling.containerBorderColor = tokens.borders.color;
    clonedWidget.barConfig.styling.containerBorderAccentColor = tokens.borders.accentColor;
    clonedWidget.barConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.barConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Line Chart widget
   */
  private static applyThemeToLineChart(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
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

    clonedWidget.lineConfig.styling.axisTextColor = tokens.colors.chart.axis;
    clonedWidget.lineConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    // Grid styling - apply theme grid properties
    clonedWidget.lineConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.lineConfig.styling.gridStrokeWidth = 0.5;

    clonedWidget.lineConfig.styling.colors = [tokens.colors.chartElements.line.stroke];
    clonedWidget.lineConfig.styling.containerBorderColor = tokens.colors.chartElements.line.point;
    clonedWidget.lineConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.lineConfig.styling.pointColor = tokens.colors.chartElements.line.point;
    clonedWidget.lineConfig.styling.pointBorderColor = tokens.colors.chartElements.line.pointBorder;

    // Apply advanced effects from tokens
    clonedWidget.lineConfig.styling.containerOpacity = tokens.effects.opacity.medium;

    // Always apply gradient props directly (like KPI implementation)
    if (tokens.effects.gradient) {
      clonedWidget.lineConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.lineConfig.styling.backgroundGradient = undefined;
    }

    // Always apply backdrop filter (blur if defined, cleared if undefined)
    if (tokens.effects.backdrop) {
      clonedWidget.lineConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.lineConfig.styling.containerBackdropFilter = undefined;
    }
    // Create enhanced shadow for hightech theme
    if (tokens.effects.shadow.color === '#00ffff') {
      // Hightech theme: No shadow
      clonedWidget.lineConfig.styling.containerBoxShadow = 'none';
    } else {
      // Other themes: Standard shadow
      clonedWidget.lineConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Apply border properties from tokens
    clonedWidget.lineConfig.styling.containerBorderColor = tokens.borders.color;
    clonedWidget.lineConfig.styling.containerBorderAccentColor = tokens.borders.accentColor;
    clonedWidget.lineConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.lineConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Pie Chart widget
   */
  private static applyThemeToPieChart(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
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

    // Grid styling - apply theme grid properties (for consistency)
    clonedWidget.pieConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.pieConfig.styling.gridStrokeWidth = 0.5;

    // Use dedicated pie slice colors if available, otherwise fallback to mixed chart colors
    clonedWidget.pieConfig.styling.colors = tokens.colors.pieSliceColors || [
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

    // Always apply gradient props directly (like KPI implementation)
    if (tokens.effects.gradient) {
      clonedWidget.pieConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.pieConfig.styling.backgroundGradient = undefined;
    }

    // Always apply backdrop filter (blur if defined, cleared if undefined)
    if (tokens.effects.backdrop) {
      clonedWidget.pieConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.pieConfig.styling.containerBackdropFilter = undefined;
    }
    // Create enhanced shadow for hightech theme
    if (tokens.effects.shadow.color === '#00ffff') {
      // Hightech theme: No shadow
      clonedWidget.pieConfig.styling.containerBoxShadow = 'none';
    } else {
      // Other themes: Standard shadow
      clonedWidget.pieConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Apply border properties from tokens
    clonedWidget.pieConfig.styling.containerBorderColor = tokens.borders.color;
    clonedWidget.pieConfig.styling.containerBorderAccentColor = tokens.borders.accentColor;
    clonedWidget.pieConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.pieConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Area Chart widget
   */
  private static applyThemeToAreaChart(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
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

    clonedWidget.areaConfig.styling.axisTextColor = tokens.colors.chart.axis;
    clonedWidget.areaConfig.styling.axisFontSize = tokens.typography.fontSize.sm;

    // Grid styling - apply theme grid properties
    clonedWidget.areaConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.areaConfig.styling.gridStrokeWidth = 0.5;

    clonedWidget.areaConfig.styling.colors = [tokens.colors.chartElements.area.fill];
    clonedWidget.areaConfig.styling.containerBorderColor = tokens.colors.chartElements.area.stroke;
    clonedWidget.areaConfig.styling.containerBorderRadius = tokens.borders.radius.md;
    clonedWidget.areaConfig.styling.lineColor = tokens.colors.chartElements.area.stroke;
    clonedWidget.areaConfig.styling.pointColor = tokens.colors.chartElements.area.point;
    clonedWidget.areaConfig.styling.pointBorderColor = tokens.colors.chartElements.area.pointBorder;

    // Apply advanced effects from tokens
    clonedWidget.areaConfig.styling.containerOpacity = tokens.effects.opacity.medium;

    // Always apply gradient props directly (like KPI implementation)
    if (tokens.effects.gradient) {
      clonedWidget.areaConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.areaConfig.styling.backgroundGradient = undefined;
    }

    // Always apply backdrop filter (blur if defined, cleared if undefined)
    if (tokens.effects.backdrop) {
      clonedWidget.areaConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.areaConfig.styling.containerBackdropFilter = undefined;
    }
    // Create enhanced shadow for hightech theme
    if (tokens.effects.shadow.color === '#00ffff') {
      // Hightech theme: No shadow
      clonedWidget.areaConfig.styling.containerBoxShadow = 'none';
    } else {
      // Other themes: Standard shadow
      clonedWidget.areaConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Apply border properties from tokens
    clonedWidget.areaConfig.styling.containerBorderColor = tokens.borders.color;
    clonedWidget.areaConfig.styling.containerBorderAccentColor = tokens.borders.accentColor;
    clonedWidget.areaConfig.styling.containerBorderWidth = tokens.borders.width.medium;
    clonedWidget.areaConfig.styling.containerBorderRadius = tokens.borders.radius.lg;

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Insights widget
   */
  private static applyThemeToInsights(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.insightsConfig) {
      clonedWidget.insightsConfig = {};
    }

    // Apply background color
    clonedWidget.insightsConfig.backgroundColor = tokens.colors.surface;

    // Apply border colors from tokens
    clonedWidget.insightsConfig.borderColor = tokens.borders.color;
    clonedWidget.insightsConfig.borderAccentColor = tokens.borders.accentColor;

    // Title styling
    clonedWidget.insightsConfig.titleColor = tokens.colors.text.primary;
    clonedWidget.insightsConfig.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.insightsConfig.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.insightsConfig.titleFontFamily = tokens.typography.fontFamily.primary;

    // Apply gradient if available
    if (tokens.effects.gradient) {
      clonedWidget.insightsConfig.backgroundGradient = {
        enabled: true,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.insightsConfig.backgroundGradient = {
        enabled: false,
        direction: '135deg',
        startColor: tokens.colors.surface,
        endColor: tokens.colors.surface
      };
    }

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Alerts widget
   */
  private static applyThemeToAlerts(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.alertsConfig) {
      clonedWidget.alertsConfig = {};
    }

    // Apply background color
    clonedWidget.alertsConfig.backgroundColor = tokens.colors.surface;

    // Apply border colors from tokens
    clonedWidget.alertsConfig.borderColor = tokens.borders.color;
    clonedWidget.alertsConfig.borderAccentColor = tokens.borders.accentColor;

    // Title styling
    clonedWidget.alertsConfig.titleColor = tokens.colors.text.primary;
    clonedWidget.alertsConfig.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.alertsConfig.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.alertsConfig.titleFontFamily = tokens.typography.fontFamily.primary;

    // Apply gradient if available
    if (tokens.effects.gradient) {
      clonedWidget.alertsConfig.backgroundGradient = {
        enabled: true,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.alertsConfig.backgroundGradient = {
        enabled: false,
        direction: '135deg',
        startColor: tokens.colors.surface,
        endColor: tokens.colors.surface
      };
    }

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Recommendations widget
   */
  private static applyThemeToRecommendations(widget: Widget, tokens: DesignTokens, _themeName: ThemeName): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.recommendationsConfig) {
      clonedWidget.recommendationsConfig = {};
    }

    // Apply background color
    clonedWidget.recommendationsConfig.backgroundColor = tokens.colors.surface;

    // Apply border colors from tokens
    clonedWidget.recommendationsConfig.borderColor = tokens.borders.color;
    clonedWidget.recommendationsConfig.borderAccentColor = tokens.borders.accentColor;

    // Title styling
    clonedWidget.recommendationsConfig.titleColor = tokens.colors.text.primary;
    clonedWidget.recommendationsConfig.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.recommendationsConfig.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.recommendationsConfig.titleFontFamily = tokens.typography.fontFamily.primary;

    // Apply gradient if available
    if (tokens.effects.gradient) {
      clonedWidget.recommendationsConfig.backgroundGradient = {
        enabled: true,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.recommendationsConfig.backgroundGradient = {
        enabled: false,
        direction: '135deg',
        startColor: tokens.colors.surface,
        endColor: tokens.colors.surface
      };
    }

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single widget based on its type
   */
  static applyThemeToWidget(
    widget: Widget,
    themeName: ThemeName,
    customFont?: string,
    corporateColorKey?: string,
    customFontSize?: string,
    borderPresetKey?: string,
    customBorderColor?: string,
    customBorderAccentColor?: string
  ): Widget {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Skipping theme application.`);
      return widget;
    }

    let tokens = this.getThemeTokens(themeName, corporateColorKey);

    // Override typography if customFont is provided
    if (customFont && customFont in TYPOGRAPHY_PRESETS) {
      const customTypography = TYPOGRAPHY_PRESETS[customFont as keyof typeof TYPOGRAPHY_PRESETS];
      tokens = {
        ...tokens,
        typography: customTypography
      };
    }

    // Override title font size if customFontSize is provided
    if (customFontSize && FontManager.isValidFontSize(customFontSize)) {
      const titleFontSize = FontManager.getFontSizeValue(customFontSize as FontSizeKey);
      tokens = {
        ...tokens,
        typography: {
          ...tokens.typography,
          fontSize: {
            ...tokens.typography.fontSize,
            // Override the title size (lg is used for titles)
            lg: titleFontSize
          }
        }
      };
    }

    // Determine border preset
    let effectiveBorderPreset: BorderPresetKey = BorderManager.getDefaultForTheme(themeName);
    if (borderPresetKey && BorderManager.isValidPreset(borderPresetKey)) {
      effectiveBorderPreset = borderPresetKey as BorderPresetKey;
    }

    // Apply theme per widget type
    let themed = widget;
    switch (widget.type) {
      case 'kpi':
        themed = this.applyThemeToKPI(widget, tokens, themeName);
        // Apply border via BorderManager (kpiConfig ensured by applyThemeToKPI)
        Object.assign(
          themed.kpiConfig!,
          BorderManager.getKPICardBorderStyle(effectiveBorderPreset, tokens)
        );
        if (customBorderColor) themed.kpiConfig!.kpiContainerBorderColor = customBorderColor;
        if (customBorderAccentColor) themed.kpiConfig!.kpiContainerBorderAccentColor = customBorderAccentColor;
        return themed;
      case 'bar': {
        themed = this.applyThemeToBarChart(widget, tokens, themeName);
        // barConfig.styling ensured by applyThemeToBarChart
        Object.assign(
          themed.barConfig!.styling!,
          BorderManager.getContainerBorderStyle(effectiveBorderPreset, tokens)
        );
        if (customBorderColor) themed.barConfig!.styling!.containerBorderColor = customBorderColor;
        if (customBorderAccentColor) themed.barConfig!.styling!.containerBorderAccentColor = customBorderAccentColor;
        return themed;
      }
      case 'line': {
        themed = this.applyThemeToLineChart(widget, tokens, themeName);
        Object.assign(
          themed.lineConfig!.styling!,
          BorderManager.getContainerBorderStyle(effectiveBorderPreset, tokens)
        );
        if (customBorderColor) themed.lineConfig!.styling!.containerBorderColor = customBorderColor;
        if (customBorderAccentColor) themed.lineConfig!.styling!.containerBorderAccentColor = customBorderAccentColor;
        return themed;
      }
      case 'pie': {
        themed = this.applyThemeToPieChart(widget, tokens, themeName);
        Object.assign(
          themed.pieConfig!.styling!,
          BorderManager.getContainerBorderStyle(effectiveBorderPreset, tokens)
        );
        if (customBorderColor) themed.pieConfig!.styling!.containerBorderColor = customBorderColor;
        if (customBorderAccentColor) themed.pieConfig!.styling!.containerBorderAccentColor = customBorderAccentColor;
        return themed;
      }
      case 'area': {
        themed = this.applyThemeToAreaChart(widget, tokens, themeName);
        Object.assign(
          themed.areaConfig!.styling!,
          BorderManager.getContainerBorderStyle(effectiveBorderPreset, tokens)
        );
        if (customBorderColor) themed.areaConfig!.styling!.containerBorderColor = customBorderColor;
        if (customBorderAccentColor) themed.areaConfig!.styling!.containerBorderAccentColor = customBorderAccentColor;
        return themed;
      }
      case 'insights': {
        themed = this.applyThemeToInsights(widget, tokens, themeName);
        const b = BorderManager.getBorderStyle(effectiveBorderPreset, tokens);
        themed.insightsConfig!.borderColor = customBorderColor || b.color;
        themed.insightsConfig!.borderAccentColor = customBorderAccentColor || b.accentColor;
        return themed;
      }
      case 'alerts': {
        themed = this.applyThemeToAlerts(widget, tokens, themeName);
        const b = BorderManager.getBorderStyle(effectiveBorderPreset, tokens);
        themed.alertsConfig!.borderColor = customBorderColor || b.color;
        themed.alertsConfig!.borderAccentColor = customBorderAccentColor || b.accentColor;
        return themed;
      }
      case 'recommendations': {
        themed = this.applyThemeToRecommendations(widget, tokens, themeName);
        const b = BorderManager.getBorderStyle(effectiveBorderPreset, tokens);
        themed.recommendationsConfig!.borderColor = customBorderColor || b.color;
        themed.recommendationsConfig!.borderAccentColor = customBorderAccentColor || b.accentColor;
        return themed;
      }
      default:
        console.warn(`Unknown widget type: ${widget.type}. Skipping theme application.`);
        return widget;
    }
  }

  /**
   * Applies design tokens to multiple widgets
   */
  static applyThemeToWidgets(
    widgets: Widget[],
    themeName: ThemeName,
    customFont?: string,
    corporateColorKey?: string,
    customFontSize?: string,
    borderPresetKey?: string,
    customBorderColor?: string,
    customBorderAccentColor?: string
  ): Widget[] {
    return widgets.map(widget => this.applyThemeToWidget(
      widget,
      themeName,
      customFont,
      corporateColorKey,
      customFontSize,
      borderPresetKey,
      customBorderColor,
      customBorderAccentColor
    ));
  }

  /**
   * Applies design tokens to grid configuration
   */
  static applyThemeToGrid(
    gridConfig: GridConfig,
    themeName: ThemeName,
    corporateColorKey?: string,
    customBackground?: string,
    borderPresetKey?: string,
    customBorderColor?: string,
    customBorderAccentColor?: string
  ): GridConfig {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Invalid theme: ${themeName}. Skipping grid theme application.`);
      return gridConfig;
    }

    const tokens = this.getThemeTokens(themeName, corporateColorKey);

    // Use custom background if provided, otherwise use theme default
    let backgroundStyle;
    if (customBackground && BackgroundManager.isValidBackground(customBackground)) {
      backgroundStyle = BackgroundManager.getBackgroundStyle(customBackground);
    } else {
      // Fallback to theme default background
      const backgroundPresetKey = THEME_BACKGROUND_MAPPING[themeName];
      backgroundStyle = BackgroundManager.getBackgroundStyle(backgroundPresetKey);
    }

    // Compute border style from manager
    let effectiveBorderPreset: BorderPresetKey = BorderManager.getDefaultForTheme(themeName);
    if (borderPresetKey && BorderManager.isValidPreset(borderPresetKey)) {
      effectiveBorderPreset = borderPresetKey as BorderPresetKey;
    }
    const gridBorder = BorderManager.getGridBorderStyle(effectiveBorderPreset, tokens);

    return {
      ...gridConfig,
      // Apply background from BackgroundManager instead of hardcoded values
      ...backgroundStyle,

      // Border from BorderManager preset
      borderColor: customBorderColor || gridBorder.borderColor,
      borderWidth: gridBorder.borderWidth,
      borderRadius: gridBorder.borderRadius,

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
      corporate: { name: 'Corporate', description: 'Professional business gray theme' },
      navy: { name: 'Navy', description: 'Executive navy blue for C-level presentations' },
      slate: { name: 'Slate', description: 'Premium gray for financial analytics' },
      forest: { name: 'Forest', description: 'Sustainable green for ESG dashboards' },
      hightech: { name: 'High Tech', description: 'Futuristic neon cyan theme for modern dashboards' },
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
