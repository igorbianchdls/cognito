'use client';

import type { Widget, GridConfig, Insights2Config } from './ConfigParser';
import type { KPIConfig } from '@/types/apps/kpiWidgets';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';
import type { StackedBarChartConfig } from '@/stores/apps/stackedBarChartStore';
import type { GroupedBarChartConfig } from '@/stores/apps/groupedBarChartStore';
import type { StackedLinesChartConfig } from '@/stores/apps/stackedLinesChartStore';
import type { PivotBarChartConfig } from '@/stores/apps/pivotBarChartStore';
import type { RadialStackedChartConfig } from '@/stores/apps/radialStackedChartStore';
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
  private static applyThemeToKPI(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    }
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.kpiConfig) {
      clonedWidget.kpiConfig = {} as KPIConfig;
    }

    // Apply design tokens to KPI with semantic meaning
    if (clonedWidget.kpiConfig.kpiContainerBackgroundColor === undefined) {
      clonedWidget.kpiConfig.kpiContainerBackgroundColor = tokens.colors.surface;
    }

    // KPI Value styling (fixed values to match dark cards)
    if (clonedWidget.kpiConfig.kpiValueColor === undefined) {
      clonedWidget.kpiConfig.kpiValueColor = tokens.colors.text.primary;
    }
    clonedWidget.kpiConfig.kpiValueFontSize = 28; // Fixed size to match dark cards
    clonedWidget.kpiConfig.kpiValueFontWeight = 600; // Fixed weight to match dark cards
    clonedWidget.kpiConfig.kpiValueFontFamily = tokens.typography.fontFamily.primary;

    // KPI Name styling (fixed size, default weight like dark cards)
    if (clonedWidget.kpiConfig.kpiNameColor === undefined) {
      clonedWidget.kpiConfig.kpiNameColor = tokens.colors.text.secondary;
    }
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

    // Apply Border Manager style (global)
    const preset: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type))
      ? borderOptions.type
      : 'suave'
    const style = BorderManager.getStyle(preset, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })

    // Map to KPI config / KPICard props
    clonedWidget.kpiConfig.kpiContainerBorderColor = style.color
    clonedWidget.kpiConfig.kpiContainerBorderWidth = style.width
    clonedWidget.kpiConfig.kpiContainerBorderRadius = style.radius
    clonedWidget.kpiConfig.kpiContainerShadow = style.shadow
    clonedWidget.kpiConfig.kpiContainerBorderAccentColor = style.accentColor
    clonedWidget.kpiConfig.borderVariant = style.type === 'acentuada' ? 'accent' : (style.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Bar Chart widget
   */
  private static applyThemeToBarChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.barConfig) {
      clonedWidget.barConfig = {} as Partial<BarChartConfig>;
    }

    if (!clonedWidget.barConfig.styling) {
      // Preserve any user-provided styling (e.g., barColor, colors)
      const userStyling: Partial<BarChartConfig['styling']> = widget.barConfig?.styling ? { ...(widget.barConfig.styling as BarChartConfig['styling']) } : {};
      const defaultStyling: Partial<BarChartConfig['styling']> = { ...DEFAULT_CHART_STYLING } as Partial<BarChartConfig['styling']>;
      clonedWidget.barConfig.styling = { ...defaultStyling, ...userStyling } as BarChartConfig['styling'];
    }

    // Apply design tokens to Bar Chart with direct assignment (like KPI - always applies theme)
    clonedWidget.barConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    if (clonedWidget.barConfig.styling.titleColor === undefined) {
      clonedWidget.barConfig.styling.titleColor = tokens.colors.text.primary;
    }
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

    if (clonedWidget.barConfig.styling.axisTextColor === undefined) {
      clonedWidget.barConfig.styling.axisTextColor = chartBodyTextColor || tokens.colors.chart.axis;
    }
    clonedWidget.barConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    if (clonedWidget.barConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) {
      clonedWidget.barConfig.styling.axisFontFamily = chartBodyFontFamily;
    }
    if (clonedWidget.barConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) {
      clonedWidget.barConfig.styling.labelsFontFamily = chartBodyFontFamily;
    }
    if (clonedWidget.barConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) {
      clonedWidget.barConfig.styling.legendsFontFamily = chartBodyFontFamily;
    }
    if (clonedWidget.barConfig.styling.tooltipFontFamily === undefined && chartBodyFontFamily) {
      clonedWidget.barConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    }
    if (clonedWidget.barConfig.styling.labelsTextColor === undefined && chartBodyTextColor) {
      clonedWidget.barConfig.styling.labelsTextColor = chartBodyTextColor;
    }
    if (clonedWidget.barConfig.styling.legendsTextColor === undefined && chartBodyTextColor) {
      clonedWidget.barConfig.styling.legendsTextColor = chartBodyTextColor;
    }

    // Grid styling - apply theme grid properties
    clonedWidget.barConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.barConfig.styling.gridStrokeWidth = 0.5;

    // Respect user-defined color overrides from JSON
    const userBarColor = widget.barConfig?.styling?.barColor;
    const userColors = widget.barConfig?.styling?.colors;
    if (!userBarColor && !userColors) {
      clonedWidget.barConfig.styling.colors = [ tokens.colors.chartElements.bar.fill ];
    }
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

    // Apply border via BorderManager
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.barConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.barConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.barConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.barConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.barConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.barConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.barConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Stacked Bar Chart widget
   */
  private static applyThemeToStackedBarChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.stackedBarConfig) {
      clonedWidget.stackedBarConfig = {} as Partial<StackedBarChartConfig>;
    }

    if (!clonedWidget.stackedBarConfig.styling) {
      clonedWidget.stackedBarConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Apply design tokens to Stacked Bar Chart
    clonedWidget.stackedBarConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    if (clonedWidget.stackedBarConfig.styling.titleColor === undefined) {
      clonedWidget.stackedBarConfig.styling.titleColor = tokens.colors.text.primary;
    }
    clonedWidget.stackedBarConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.stackedBarConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.stackedBarConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.stackedBarConfig.styling.titleMarginTop = 0;
    clonedWidget.stackedBarConfig.styling.titleMarginRight = 0;
    clonedWidget.stackedBarConfig.styling.titleMarginBottom = 8;
    clonedWidget.stackedBarConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.stackedBarConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.stackedBarConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.stackedBarConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.stackedBarConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.stackedBarConfig.styling.subtitleMarginTop = 0;
    clonedWidget.stackedBarConfig.styling.subtitleMarginRight = 0;
    clonedWidget.stackedBarConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.stackedBarConfig.styling.subtitleMarginLeft = 0;

    if (clonedWidget.stackedBarConfig.styling.axisTextColor === undefined) {
      clonedWidget.stackedBarConfig.styling.axisTextColor = chartBodyTextColor || tokens.colors.chart.axis;
    }
    clonedWidget.stackedBarConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    if (clonedWidget.stackedBarConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedBarConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedBarConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedBarConfig.styling.labelsFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedBarConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedBarConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedBarConfig.styling.tooltipFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedBarConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedBarConfig.styling.labelsTextColor === undefined && chartBodyTextColor) clonedWidget.stackedBarConfig.styling.labelsTextColor = chartBodyTextColor;
    if (clonedWidget.stackedBarConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.stackedBarConfig.styling.legendsTextColor = chartBodyTextColor;

    // Grid styling - apply theme grid properties
    clonedWidget.stackedBarConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.stackedBarConfig.styling.gridStrokeWidth = 0.5;

    clonedWidget.stackedBarConfig.styling.colors = [
      tokens.colors.chartElements.bar.fill
    ];
    clonedWidget.stackedBarConfig.styling.containerShadowColor = tokens.shadows.medium;

    // Apply advanced effects from tokens
    clonedWidget.stackedBarConfig.styling.containerOpacity = tokens.effects.opacity.medium;

    // Always apply gradient props directly
    if (tokens.effects.gradient) {
      clonedWidget.stackedBarConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.stackedBarConfig.styling.backgroundGradient = undefined;
    }

    // Always apply backdrop filter
    if (tokens.effects.backdrop) {
      clonedWidget.stackedBarConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.stackedBarConfig.styling.containerBackdropFilter = undefined;
    }

    // Create enhanced shadow
    if (tokens.effects.shadow.color === '#00ffff') {
      // Hightech theme: No shadow
      clonedWidget.stackedBarConfig.styling.containerBoxShadow = 'none';
    } else {
      // Other themes: Standard shadow
      clonedWidget.stackedBarConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Apply border via BorderManager
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.stackedBarConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.stackedBarConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.stackedBarConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.stackedBarConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.stackedBarConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.stackedBarConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.stackedBarConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Grouped Bar Chart widget
   */
  private static applyThemeToGroupedBarChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.groupedBarConfig) {
      clonedWidget.groupedBarConfig = {} as Partial<GroupedBarChartConfig>;
    }

    if (!clonedWidget.groupedBarConfig.styling) {
      clonedWidget.groupedBarConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Background
    clonedWidget.groupedBarConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling - complete props
    if (clonedWidget.groupedBarConfig.styling.titleColor === undefined) {
      clonedWidget.groupedBarConfig.styling.titleColor = tokens.colors.text.primary;
    }
    clonedWidget.groupedBarConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.groupedBarConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.groupedBarConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.groupedBarConfig.styling.titleMarginTop = 0;
    clonedWidget.groupedBarConfig.styling.titleMarginRight = 0;
    clonedWidget.groupedBarConfig.styling.titleMarginBottom = 8;
    clonedWidget.groupedBarConfig.styling.titleMarginLeft = 0;

    // Subtitle styling - complete props
    clonedWidget.groupedBarConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.groupedBarConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.groupedBarConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.groupedBarConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.groupedBarConfig.styling.subtitleMarginTop = 0;
    clonedWidget.groupedBarConfig.styling.subtitleMarginRight = 0;
    clonedWidget.groupedBarConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.groupedBarConfig.styling.subtitleMarginLeft = 0;

    // Axis & grid
    if (clonedWidget.groupedBarConfig.styling.axisTextColor === undefined) {
      clonedWidget.groupedBarConfig.styling.axisTextColor = chartBodyTextColor || tokens.colors.chart.axis;
    }
    clonedWidget.groupedBarConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    if (clonedWidget.groupedBarConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.groupedBarConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.groupedBarConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) clonedWidget.groupedBarConfig.styling.labelsFontFamily = chartBodyFontFamily;
    if (clonedWidget.groupedBarConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.groupedBarConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.groupedBarConfig.styling.tooltipFontFamily === undefined && chartBodyFontFamily) clonedWidget.groupedBarConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    if (clonedWidget.groupedBarConfig.styling.labelsTextColor === undefined && chartBodyTextColor) clonedWidget.groupedBarConfig.styling.labelsTextColor = chartBodyTextColor;
    if (clonedWidget.groupedBarConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.groupedBarConfig.styling.legendsTextColor = chartBodyTextColor;
    clonedWidget.groupedBarConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.groupedBarConfig.styling.gridStrokeWidth = 0.5;

    // Series colors
    clonedWidget.groupedBarConfig.styling.colors = [
      tokens.colors.chartElements.bar.fill
    ];
    clonedWidget.groupedBarConfig.styling.containerShadowColor = tokens.shadows.medium;

    // Effects
    clonedWidget.groupedBarConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.groupedBarConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.groupedBarConfig.styling.backgroundGradient = undefined;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.groupedBarConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.groupedBarConfig.styling.containerBackdropFilter = undefined;
    }
    if (tokens.effects.shadow.color === '#00ffff') {
      clonedWidget.groupedBarConfig.styling.containerBoxShadow = 'none';
    } else {
      clonedWidget.groupedBarConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Border
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.groupedBarConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.groupedBarConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.groupedBarConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.groupedBarConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.groupedBarConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.groupedBarConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.groupedBarConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth');

    return clonedWidget;
  }
  /**
   * Applies design tokens to a single Pivot Bar Chart widget
   */
  private static applyThemeToPivotBarChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
    const clonedWidget = { ...widget };
    if (!clonedWidget.pivotBarConfig) {
      clonedWidget.pivotBarConfig = {} as Partial<PivotBarChartConfig>;
    }
    if (!clonedWidget.pivotBarConfig.styling) {
      clonedWidget.pivotBarConfig.styling = {} as PivotBarChartConfig['styling'];
    }

    // Background (use container background for pivot bar)
    if (clonedWidget.pivotBarConfig.styling.containerBackground === undefined) {
      clonedWidget.pivotBarConfig.styling.containerBackground = tokens.colors.surface;
    }

    // Title styling
    if (clonedWidget.pivotBarConfig.styling.titleColor === undefined) {
    if (clonedWidget.pivotBarConfig.styling.titleColor === undefined) {
      clonedWidget.pivotBarConfig.styling.titleColor = tokens.colors.text.primary;
    }
    if (clonedWidget.pivotBarConfig.styling.axisTextColor === undefined && chartBodyTextColor) clonedWidget.pivotBarConfig.styling.axisTextColor = chartBodyTextColor;
    if (clonedWidget.pivotBarConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.pivotBarConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.pivotBarConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.pivotBarConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.pivotBarConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.pivotBarConfig.styling.legendsTextColor = chartBodyTextColor;
    }
    clonedWidget.pivotBarConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.pivotBarConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.pivotBarConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;

    // Subtitle
    clonedWidget.pivotBarConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.pivotBarConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.pivotBarConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.pivotBarConfig.styling.subtitleColor = tokens.colors.text.secondary;

    // Grid
    clonedWidget.pivotBarConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.pivotBarConfig.styling.gridStrokeWidth = 0.5;

    // Effects
    clonedWidget.pivotBarConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.backdrop) {
      clonedWidget.pivotBarConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.pivotBarConfig.styling.containerBackdropFilter = undefined;
    }
    if (tokens.effects.shadow.color === '#00ffff') {
      clonedWidget.pivotBarConfig.styling.containerBoxShadow = 'none';
    } else {
      clonedWidget.pivotBarConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Border via BorderManager
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.pivotBarConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.pivotBarConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.pivotBarConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.pivotBarConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.pivotBarConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.pivotBarConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.pivotBarConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth');

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Stacked Lines Chart widget
   */
  private static applyThemeToStackedLinesChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.stackedLinesConfig) {
      clonedWidget.stackedLinesConfig = {} as Partial<StackedLinesChartConfig>;
    }

    if (!clonedWidget.stackedLinesConfig.styling) {
      clonedWidget.stackedLinesConfig.styling = { ...DEFAULT_CHART_STYLING };
    }

    // Background
    clonedWidget.stackedLinesConfig.styling.backgroundColor = tokens.colors.surface;

    // Title styling
    if (clonedWidget.stackedLinesConfig.styling.titleColor === undefined) {
    if (clonedWidget.stackedLinesConfig.styling.titleColor === undefined) {
      clonedWidget.stackedLinesConfig.styling.titleColor = tokens.colors.text.primary;
    }
    if (clonedWidget.stackedLinesConfig.styling.axisTextColor === undefined && chartBodyTextColor) clonedWidget.stackedLinesConfig.styling.axisTextColor = chartBodyTextColor;
    if (clonedWidget.stackedLinesConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedLinesConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedLinesConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedLinesConfig.styling.labelsFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedLinesConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.stackedLinesConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.stackedLinesConfig.styling.labelsTextColor === undefined && chartBodyTextColor) clonedWidget.stackedLinesConfig.styling.labelsTextColor = chartBodyTextColor;
    if (clonedWidget.stackedLinesConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.stackedLinesConfig.styling.legendsTextColor = chartBodyTextColor;
    }
    clonedWidget.stackedLinesConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.stackedLinesConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.stackedLinesConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.stackedLinesConfig.styling.titleMarginTop = 0;
    clonedWidget.stackedLinesConfig.styling.titleMarginRight = 0;
    clonedWidget.stackedLinesConfig.styling.titleMarginBottom = 8;
    clonedWidget.stackedLinesConfig.styling.titleMarginLeft = 0;

    // Subtitle styling
    clonedWidget.stackedLinesConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.stackedLinesConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.stackedLinesConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.stackedLinesConfig.styling.subtitleColor = tokens.colors.text.secondary;
    clonedWidget.stackedLinesConfig.styling.subtitleMarginTop = 0;
    clonedWidget.stackedLinesConfig.styling.subtitleMarginRight = 0;
    clonedWidget.stackedLinesConfig.styling.subtitleMarginBottom = 16;
    clonedWidget.stackedLinesConfig.styling.subtitleMarginLeft = 0;

    // Axis & grid
    clonedWidget.stackedLinesConfig.styling.axisTextColor = tokens.colors.chart.axis;
    clonedWidget.stackedLinesConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    clonedWidget.stackedLinesConfig.styling.gridColor = tokens.colors.chart.grid;
    clonedWidget.stackedLinesConfig.styling.gridStrokeWidth = 0.5;

    // Line defaults
    clonedWidget.stackedLinesConfig.styling.colors = [tokens.colors.chartElements.line.stroke];
    clonedWidget.stackedLinesConfig.styling.lineWidth = 2;
    clonedWidget.stackedLinesConfig.styling.enablePoints = true;
    clonedWidget.stackedLinesConfig.styling.pointSize = 6;
    clonedWidget.stackedLinesConfig.styling.curve = 'cardinal';
    clonedWidget.stackedLinesConfig.styling.enableArea = true;
    clonedWidget.stackedLinesConfig.styling.areaOpacity = 0.15;

    // Effects
    clonedWidget.stackedLinesConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.gradient) {
      clonedWidget.stackedLinesConfig.styling.backgroundGradient = {
        enabled: true,
        type: tokens.effects.gradient.type,
        direction: tokens.effects.gradient.direction,
        startColor: tokens.effects.gradient.startColor,
        endColor: tokens.effects.gradient.endColor
      };
    } else {
      clonedWidget.stackedLinesConfig.styling.backgroundGradient = undefined;
    }
    if (tokens.effects.backdrop) {
      clonedWidget.stackedLinesConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.stackedLinesConfig.styling.containerBackdropFilter = undefined;
    }
    if (tokens.effects.shadow.color === '#00ffff') {
      clonedWidget.stackedLinesConfig.styling.containerBoxShadow = 'none';
    } else {
      clonedWidget.stackedLinesConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Border
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.stackedLinesConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.stackedLinesConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.stackedLinesConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.stackedLinesConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.stackedLinesConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.stackedLinesConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.stackedLinesConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth');

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Radial Stacked Chart widget
   */
  private static applyThemeToRadialStackedChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    }
  ): Widget {
    const clonedWidget = { ...widget };

    if (!clonedWidget.radialStackedConfig) {
      clonedWidget.radialStackedConfig = {} as Partial<RadialStackedChartConfig>;
    }
    if (!clonedWidget.radialStackedConfig.styling) {
      clonedWidget.radialStackedConfig.styling = {} as RadialStackedChartConfig['styling'];
    }

    // Background
    if (clonedWidget.radialStackedConfig.styling.containerBackground === undefined) {
      clonedWidget.radialStackedConfig.styling.containerBackground = tokens.colors.surface;
    }
    
    // Title styling
    if (clonedWidget.radialStackedConfig.styling.titleColor === undefined) {
      clonedWidget.radialStackedConfig.styling.titleColor = tokens.colors.text.primary;
    }
    clonedWidget.radialStackedConfig.styling.titleFontSize = tokens.typography.fontSize.lg;
    clonedWidget.radialStackedConfig.styling.titleFontWeight = tokens.typography.fontWeight.semibold;
    clonedWidget.radialStackedConfig.styling.titleFontFamily = tokens.typography.fontFamily.primary;
    
    // Subtitle styling
    clonedWidget.radialStackedConfig.styling.subtitleFontFamily = tokens.typography.fontFamily.primary;
    clonedWidget.radialStackedConfig.styling.subtitleFontSize = tokens.typography.fontSize.sm;
    clonedWidget.radialStackedConfig.styling.subtitleFontWeight = tokens.typography.fontWeight.normal;
    clonedWidget.radialStackedConfig.styling.subtitleColor = tokens.colors.text.secondary;

    // Effects (kept for consistency even if component uses minimal props)
    clonedWidget.radialStackedConfig.styling.containerOpacity = tokens.effects.opacity.medium;
    if (tokens.effects.backdrop) {
      clonedWidget.radialStackedConfig.styling.containerBackdropFilter = `blur(${tokens.effects.backdrop.blur}px) saturate(${tokens.effects.backdrop.saturate}%) brightness(${tokens.effects.backdrop.brightness}%)`;
    } else {
      clonedWidget.radialStackedConfig.styling.containerBackdropFilter = undefined;
    }
    if (tokens.effects.shadow.color === '#00ffff') {
      clonedWidget.radialStackedConfig.styling.containerBoxShadow = 'none';
    } else {
      clonedWidget.radialStackedConfig.styling.containerBoxShadow = `${tokens.effects.shadow.offsetX}px ${tokens.effects.shadow.offsetY}px ${tokens.effects.shadow.blur}px rgba(0, 0, 0, ${tokens.effects.shadow.opacity})`;
    }

    // Border via BorderManager
    const presetB: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const bStyle = BorderManager.getStyle(presetB, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.radialStackedConfig.styling.containerBorderColor = bStyle.color;
    clonedWidget.radialStackedConfig.styling.containerBorderAccentColor = bStyle.accentColor;
    clonedWidget.radialStackedConfig.styling.containerBorderWidth = bStyle.width;
    clonedWidget.radialStackedConfig.styling.containerBorderRadius = bStyle.radius;
    clonedWidget.radialStackedConfig.styling.containerBoxShadow = bStyle.shadow ? (clonedWidget.radialStackedConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.radialStackedConfig.styling.containerBorderVariant = bStyle.type === 'acentuada' ? 'accent' : (bStyle.type === 'sem-borda' ? 'none' : 'smooth');

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Line Chart widget
   */
  private static applyThemeToLineChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
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
    if (clonedWidget.lineConfig.styling.titleColor === undefined) {
      clonedWidget.lineConfig.styling.titleColor = tokens.colors.text.primary;
    }
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

    if (clonedWidget.lineConfig.styling.axisTextColor === undefined) {
      clonedWidget.lineConfig.styling.axisTextColor = chartBodyTextColor || tokens.colors.chart.axis;
    }
    clonedWidget.lineConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    if (clonedWidget.lineConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.lineConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.lineConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) clonedWidget.lineConfig.styling.labelsFontFamily = chartBodyFontFamily;
    if (clonedWidget.lineConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.lineConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.lineConfig.styling.tooltipFontFamily === undefined && chartBodyFontFamily) clonedWidget.lineConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    if (clonedWidget.lineConfig.styling.labelsTextColor === undefined && chartBodyTextColor) clonedWidget.lineConfig.styling.labelsTextColor = chartBodyTextColor;
    if (clonedWidget.lineConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.lineConfig.styling.legendsTextColor = chartBodyTextColor;

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

    // Apply border via BorderManager
    const presetL: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const lStyle = BorderManager.getStyle(presetL, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.lineConfig.styling.containerBorderColor = lStyle.color;
    clonedWidget.lineConfig.styling.containerBorderAccentColor = lStyle.accentColor;
    clonedWidget.lineConfig.styling.containerBorderWidth = lStyle.width;
    clonedWidget.lineConfig.styling.containerBorderRadius = lStyle.radius;
    clonedWidget.lineConfig.styling.containerBoxShadow = lStyle.shadow ? (clonedWidget.lineConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.lineConfig.styling.containerBorderVariant = lStyle.type === 'acentuada' ? 'accent' : (lStyle.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Pie Chart widget
   */
  private static applyThemeToPieChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
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
    if (clonedWidget.pieConfig.styling.titleColor === undefined) {
      clonedWidget.pieConfig.styling.titleColor = tokens.colors.text.primary;
    }
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
    if (chartBodyFontFamily) {
      if (clonedWidget.pieConfig.styling.legendsFontFamily === undefined) clonedWidget.pieConfig.styling.legendsFontFamily = chartBodyFontFamily;
      if (clonedWidget.pieConfig.styling.labelsFontFamily === undefined) clonedWidget.pieConfig.styling.labelsFontFamily = chartBodyFontFamily;
      if (clonedWidget.pieConfig.styling.tooltipFontFamily === undefined) clonedWidget.pieConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    }
    if (chartBodyTextColor) {
      if (clonedWidget.pieConfig.styling.legendsTextColor === undefined) clonedWidget.pieConfig.styling.legendsTextColor = chartBodyTextColor;
      if (clonedWidget.pieConfig.styling.labelsTextColor === undefined) clonedWidget.pieConfig.styling.labelsTextColor = chartBodyTextColor;
    }

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

    // Apply border via BorderManager
    const presetP: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const pStyle = BorderManager.getStyle(presetP, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.pieConfig.styling.containerBorderColor = pStyle.color;
    clonedWidget.pieConfig.styling.containerBorderAccentColor = pStyle.accentColor;
    clonedWidget.pieConfig.styling.containerBorderWidth = pStyle.width;
    clonedWidget.pieConfig.styling.containerBorderRadius = pStyle.radius;
    clonedWidget.pieConfig.styling.containerBoxShadow = pStyle.shadow ? (clonedWidget.pieConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.pieConfig.styling.containerBorderVariant = pStyle.type === 'acentuada' ? 'accent' : (pStyle.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Area Chart widget
   */
  private static applyThemeToAreaChart(
    widget: Widget,
    tokens: DesignTokens,
    _themeName: ThemeName,
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    chartBodyFontFamily?: string,
    chartBodyTextColor?: string
  ): Widget {
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
    if (clonedWidget.areaConfig.styling.titleColor === undefined) {
      clonedWidget.areaConfig.styling.titleColor = tokens.colors.text.primary;
    }
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

    if (clonedWidget.areaConfig.styling.axisTextColor === undefined) {
      clonedWidget.areaConfig.styling.axisTextColor = chartBodyTextColor || tokens.colors.chart.axis;
    }
    clonedWidget.areaConfig.styling.axisFontSize = tokens.typography.fontSize.sm;
    if (clonedWidget.areaConfig.styling.axisFontFamily === undefined && chartBodyFontFamily) clonedWidget.areaConfig.styling.axisFontFamily = chartBodyFontFamily;
    if (clonedWidget.areaConfig.styling.labelsFontFamily === undefined && chartBodyFontFamily) clonedWidget.areaConfig.styling.labelsFontFamily = chartBodyFontFamily;
    if (clonedWidget.areaConfig.styling.legendsFontFamily === undefined && chartBodyFontFamily) clonedWidget.areaConfig.styling.legendsFontFamily = chartBodyFontFamily;
    if (clonedWidget.areaConfig.styling.tooltipFontFamily === undefined && chartBodyFontFamily) clonedWidget.areaConfig.styling.tooltipFontFamily = chartBodyFontFamily;
    if (clonedWidget.areaConfig.styling.labelsTextColor === undefined && chartBodyTextColor) clonedWidget.areaConfig.styling.labelsTextColor = chartBodyTextColor;
    if (clonedWidget.areaConfig.styling.legendsTextColor === undefined && chartBodyTextColor) clonedWidget.areaConfig.styling.legendsTextColor = chartBodyTextColor;

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

    // Apply border via BorderManager
    const presetA: BorderPresetKey = (borderOptions?.type && BorderManager.isValid(borderOptions.type)) ? borderOptions.type : 'suave'
    const aStyle = BorderManager.getStyle(presetA, {
      color: borderOptions?.color,
      width: borderOptions?.width,
      radius: borderOptions?.radius,
      accentColor: borderOptions?.accentColor,
      shadow: borderOptions?.shadow,
    })
    clonedWidget.areaConfig.styling.containerBorderColor = aStyle.color;
    clonedWidget.areaConfig.styling.containerBorderAccentColor = aStyle.accentColor;
    clonedWidget.areaConfig.styling.containerBorderWidth = aStyle.width;
    clonedWidget.areaConfig.styling.containerBorderRadius = aStyle.radius;
    clonedWidget.areaConfig.styling.containerBoxShadow = aStyle.shadow ? (clonedWidget.areaConfig.styling.containerBoxShadow || '0 1px 2px rgba(0,0,0,.06)') : 'none';
    clonedWidget.areaConfig.styling.containerBorderVariant = aStyle.type === 'acentuada' ? 'accent' : (aStyle.type === 'sem-borda' ? 'none' : 'smooth')

    return clonedWidget;
  }

  /**
   * Applies design tokens to a single Insights widget
   */
  private static applyThemeToInsights(widget: Widget, tokens: DesignTokens): Widget {
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
  private static applyThemeToAlerts(widget: Widget, tokens: DesignTokens): Widget {
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
  private static applyThemeToRecommendations(widget: Widget, tokens: DesignTokens): Widget {
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
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    customChartFontFamilyKey?: string,
    customChartTextColor?: string
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

    // Resolve chart body font family (from preset key)
    let chartBodyFontFamily: string | undefined = undefined;
    if (customChartFontFamilyKey && FontManager.isValidFont(customChartFontFamilyKey)) {
      chartBodyFontFamily = FontManager.getFontFamily(customChartFontFamilyKey);
    }

    // Apply theme per widget type
    let themed = widget;
    switch (widget.type) {
      case 'kpi':
        themed = this.applyThemeToKPI(widget, tokens, themeName, borderOptions);
        return themed;
      case 'bar': {
        themed = this.applyThemeToBarChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'line': {
        themed = this.applyThemeToLineChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'pie': {
        themed = this.applyThemeToPieChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'area': {
        themed = this.applyThemeToAreaChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'stackedbar': {
        themed = this.applyThemeToStackedBarChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'groupedbar': {
        themed = this.applyThemeToGroupedBarChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'radialstacked': {
        themed = this.applyThemeToRadialStackedChart(widget, tokens, themeName, borderOptions);
        return themed;
      }
      case 'stackedlines': {
        themed = this.applyThemeToStackedLinesChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'pivotbar': {
        themed = this.applyThemeToPivotBarChart(widget, tokens, themeName, borderOptions, chartBodyFontFamily, customChartTextColor);
        return themed;
      }
      case 'insights': {
        themed = this.applyThemeToInsights(widget, tokens);
        return themed;
      }
      case 'insights2': {
        // Apply theme to Insights v2 (card list) using title typography from tokens
        const cloned: Widget = { ...widget };
        if (!cloned.insights2Config) cloned.insights2Config = {} as Insights2Config;
        const st: NonNullable<Insights2Config['styling']> = (cloned.insights2Config.styling = (cloned.insights2Config.styling || {}) as NonNullable<Insights2Config['styling']>);
        // Background and borders
        if (st.backgroundColor === undefined) st.backgroundColor = tokens.colors.surface;
        if (st.borderColor === undefined) st.borderColor = tokens.borders.color;
        if (st.borderRadius === undefined) st.borderRadius = tokens.borders.radius.md;
        // Title typography (align with chart titles)
        if (st.titleColor === undefined) st.titleColor = tokens.colors.text.primary;
        if (st.titleFontSize === undefined) st.titleFontSize = tokens.typography.fontSize.lg;
        if (st.titleFontWeight === undefined) st.titleFontWeight = tokens.typography.fontWeight.semibold;
        if (st.titleFontFamily === undefined) st.titleFontFamily = tokens.typography.fontFamily.primary;
        if (st.titleMarginBottom === undefined) st.titleMarginBottom = 8;
        return cloned;
      }
      case 'alerts': {
        themed = this.applyThemeToAlerts(widget, tokens);
        return themed;
      }
      case 'recommendations': {
        themed = this.applyThemeToRecommendations(widget, tokens);
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
    borderOptions?: {
      type?: BorderPresetKey;
      color?: string;
      width?: number;
      radius?: number;
      accentColor?: string;
      shadow?: boolean;
    },
    customChartFontFamily?: string,
    customChartTextColor?: string
  ): Widget[] {
    return widgets.map(widget => this.applyThemeToWidget(
      widget,
      themeName,
      customFont,
      corporateColorKey,
      customFontSize,
      borderOptions,
      customChartFontFamily,
      customChartTextColor
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
    customLetterSpacing?: number
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

    // Merge background with preference for explicit gridConfig values
    const mergedBackground = {
      ...backgroundStyle,
      ...(gridConfig.backgroundColor ? { backgroundColor: gridConfig.backgroundColor } : {}),
      ...(gridConfig.backgroundGradient ? { backgroundGradient: gridConfig.backgroundGradient } : {}),
    };

    return {
      ...gridConfig,
      // Apply background with explicit overrides taking precedence
      ...mergedBackground,

      // Fixed border style (gray, no shadow)
      borderColor: '#d1d5db',
      borderWidth: 1,
      borderRadius: 8,

      // Spacing
      padding: gridConfig.padding || tokens.spacing.md,
      margin: gridConfig.margin || tokens.spacing.sm,

      // Typography override — letter spacing in em (applied by container)
      letterSpacing: typeof customLetterSpacing === 'number' ? customLetterSpacing : gridConfig.letterSpacing,

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
      'branco': { name: 'Branco', description: 'Cartões brancos, texto escuro' },
      'cinza-claro': { name: 'Cinza Claro', description: 'Cartões cinza claro, texto escuro' },
      'preto': { name: 'Preto', description: 'Cartões pretos, texto claro' },
      'cinza-escuro': { name: 'Cinza Escuro', description: 'Cartões cinza escuro, texto claro' }
    } as const;

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
