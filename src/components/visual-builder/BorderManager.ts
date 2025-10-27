'use client';

import type { DesignTokens } from './DesignTokens';

// Border preset key type
export type BorderPresetKey =
  | 'none'
  | 'subtle-rounded'
  | 'strong-rounded'
  | 'square'
  | 'pill'
  | 'corners-accent';

export interface BorderStyle {
  width: number;
  radius: number;
  color: string;
  accentColor?: string;
}

export interface BorderPreview {
  key: BorderPresetKey;
  name: string;
  description: string;
  previewStyle: React.CSSProperties;
}

export interface BorderColorPreview {
  key: string;
  name: string;
  color: string;
}

// Human-friendly metadata for presets
const BORDER_PRESETS_META: Record<BorderPresetKey, { name: string; description: string }> = {
  none: { name: 'None', description: 'No border, flat look' },
  'subtle-rounded': { name: 'Subtle Rounded', description: 'Thin border, medium radius' },
  'strong-rounded': { name: 'Strong Rounded', description: 'Thicker border, large radius' },
  square: { name: 'Square', description: 'Clean square corners' },
  pill: { name: 'Pill', description: 'Full radius (rounded pill)' },
  'corners-accent': { name: 'Corners Accent', description: 'Corner accents with subtle base' },
};

/**
 * Computes a border style for a given preset using current theme tokens
 */
export class BorderManager {
  /**
   * Calculates raw border values from tokens and preset
   */
  static getBorderStyle(presetKey: BorderPresetKey, tokens: DesignTokens): BorderStyle {
    const thin = tokens.borders.width.thin;
    const medium = tokens.borders.width.medium;
    const thick = tokens.borders.width.thick;
    const r = tokens.borders.radius;
    const baseColor = tokens.borders.color;
    const accent = tokens.borders.accentColor;

    switch (presetKey) {
      case 'none':
        return { width: 0, radius: r.none, color: 'transparent', accentColor: 'transparent' };
      case 'subtle-rounded':
        return { width: thin, radius: r.md, color: baseColor, accentColor: accent };
      case 'strong-rounded':
        return { width: medium, radius: r.lg, color: baseColor, accentColor: accent };
      case 'square':
        return { width: thin, radius: r.none, color: baseColor, accentColor: accent };
      case 'pill':
        return { width: medium, radius: r.full, color: baseColor, accentColor: accent };
      case 'corners-accent':
        // Use very subtle base to let accent corners pop
        return { width: thin, radius: r.md, color: baseColor, accentColor: accent };
      default:
        return { width: thin, radius: r.md, color: baseColor, accentColor: accent };
    }
  }

  /**
   * Maps to container border prop names used by chart widgets
   */
  static getContainerBorderStyle(presetKey: BorderPresetKey, tokens: DesignTokens) {
    const b = this.getBorderStyle(presetKey, tokens);
    return {
      containerBorderWidth: b.width,
      containerBorderRadius: b.radius,
      containerBorderColor: b.color,
      containerBorderAccentColor: b.accentColor,
    } as const;
  }

  /**
   * Maps to KPI card border prop names
   */
  static getKPICardBorderStyle(presetKey: BorderPresetKey, tokens: DesignTokens) {
    const b = this.getBorderStyle(presetKey, tokens);
    return {
      kpiContainerBorderWidth: b.width,
      kpiContainerBorderRadius: b.radius,
      kpiContainerBorderColor: b.color,
      kpiContainerBorderAccentColor: b.accentColor,
    } as const;
  }

  /**
   * Maps to grid config border prop names
   */
  static getGridBorderStyle(presetKey: BorderPresetKey, tokens: DesignTokens) {
    const b = this.getBorderStyle(presetKey, tokens);
    return {
      borderWidth: b.width,
      borderRadius: b.radius,
      borderColor: b.color,
    } as const;
  }

  /**
   * Returns available presets for UI listing, with basic preview styles
   */
  static getAvailableBorders(tokens?: DesignTokens): BorderPreview[] {
    // When tokens provided, use theme colors; otherwise default neutral gray
    const color = tokens?.borders.color ?? '#d1d5db';
    const accent = tokens?.borders.accentColor ?? '#bbb';

    const keys: BorderPresetKey[] = ['none', 'subtle-rounded', 'strong-rounded', 'square', 'pill', 'corners-accent'];

    // Fallback values when tokens are not available
    const fallbackWidth: Record<BorderPresetKey, number> = {
      none: 0,
      'subtle-rounded': 1,
      'strong-rounded': 2,
      square: 1,
      pill: 2,
      'corners-accent': 1,
    };
    const fallbackRadius: Record<BorderPresetKey, number> = {
      none: 0,
      'subtle-rounded': 8,
      'strong-rounded': 12,
      square: 0,
      pill: 9999,
      'corners-accent': 8,
    };

    return keys.map((key) => {
      const width = tokens ? this.getBorderStyle(key, tokens).width : fallbackWidth[key];
      const radius = tokens ? this.getBorderStyle(key, tokens).radius : fallbackRadius[key];

      const previewStyle: React.CSSProperties = {
        width: 24,
        height: 24,
        borderStyle: 'solid',
        borderWidth: width,
        borderRadius: radius,
        borderColor: color,
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
      };

      // Add small corner accent indicators for presets that use accent
      if (key !== 'none') {
        previewStyle.boxShadow = `inset 0 0 0 1px ${accent}`;
      }

      return {
        key,
        name: BORDER_PRESETS_META[key].name,
        description: BORDER_PRESETS_META[key].description,
        previewStyle,
      };
    });
  }

  /**
   * Validates preset key
   */
  static isValidPreset(key: string): key is BorderPresetKey {
    return ['none', 'subtle-rounded', 'strong-rounded', 'square', 'pill', 'corners-accent'].includes(key);
  }

  /**
   * Default preset per theme name (string to avoid circular deps)
   */
  static getDefaultForTheme(themeName?: string): BorderPresetKey {
    const mapping: Record<string, BorderPresetKey> = {
      light: 'subtle-rounded',
      dark: 'subtle-rounded',
      corporate: 'square',
      navy: 'strong-rounded',
      slate: 'corners-accent',
      forest: 'pill',
      hightech: 'square',
      platinum: 'subtle-rounded',
    };
    return (themeName && mapping[themeName]) || 'subtle-rounded';
  }

  /**
   * Global default when theme isn’t specified
   */
  static getDefaultPreset(): BorderPresetKey {
    return 'subtle-rounded';
  }

  /**
   * Suggests a set of border colors for UI selection
   */
  static getAvailableBorderColors(tokens?: DesignTokens): BorderColorPreview[] {
    const themeBorder = tokens?.borders.color ?? '#d1d5db';
    const themeAccent = tokens?.borders.accentColor ?? '#bbb';
    const primary = tokens?.colors.primary ?? '#3b82f6';
    const secondary = tokens?.colors.secondary ?? '#64748b';
    const surface = tokens?.colors.surface ?? '#ffffff';

    const basic: BorderColorPreview[] = [
      { key: 'theme-border', name: 'Theme Border', color: themeBorder },
      { key: 'theme-accent', name: 'Theme Accent', color: themeAccent },
      { key: 'primary', name: 'Primary', color: primary },
      { key: 'secondary', name: 'Secondary', color: secondary },
      { key: 'surface', name: 'Surface', color: surface },
    ];

    // Neutral palette additions
    const neutrals: BorderColorPreview[] = [
      { key: 'black', name: 'Black', color: '#000000' },
      { key: 'white', name: 'White', color: '#ffffff' },
      { key: 'gray-200', name: 'Gray 200', color: '#e5e7eb' },
      { key: 'gray-400', name: 'Gray 400', color: '#9ca3af' },
      { key: 'blue-300', name: 'Blue 300', color: '#93c5fd' },
    ];

    return [...basic, ...neutrals];
  }
}
