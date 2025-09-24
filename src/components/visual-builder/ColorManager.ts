'use client';

// Corporate color palette interface
export interface CorporateColorPalette {
  name: string;
  description: string;
  primary: string;      // Main corporate yellow
  secondary: string;    // Light yellow
  tertiary: string;     // Gold
  quaternary: string;   // Dark gold
  pieSlices: string[];  // Array of yellow/gold variations for pie charts
  chartElements: {
    bar: {
      fill: string;
      border: string;
      label: string;
    };
    line: {
      stroke: string;
      point: string;
      pointBorder: string;
      pointLabel: string;
    };
    area: {
      fill: string;
      stroke: string;
      point: string;
      pointBorder: string;
      pointLabel: string;
    };
    pie: {
      border: string;
      arcLabel: string;
      arcLinkLabel: string;
    };
  };
}

// Theme-specific color palettes (one for each theme)
const THEME_COLOR_PALETTES: Record<string, CorporateColorPalette> = {
  light: {
    name: 'Light Theme',
    description: 'Clean light colors with blue accents',
    primary: '#2563EB',
    secondary: '#60A5FA',
    tertiary: '#1D4ED8',
    quaternary: '#1E40AF',
    pieSlices: ['#2563EB', '#60A5FA', '#3B82F6', '#1D4ED8', '#93C5FD', '#DBEAFE'],
    chartElements: {
      bar: { fill: '#2563EB', border: '#1D4ED8', label: '#FFFFFF' },
      line: { stroke: '#2563EB', point: '#60A5FA', pointBorder: '#1D4ED8', pointLabel: '#FFFFFF' },
      area: { fill: '#2563EB', stroke: '#1D4ED8', point: '#60A5FA', pointBorder: '#1E40AF', pointLabel: '#FFFFFF' },
      pie: { border: '#1D4ED8', arcLabel: '#FFFFFF', arcLinkLabel: '#60A5FA' }
    }
  },
  dark: {
    name: 'Dark Theme',
    description: 'Modern dark colors with cyan accents',
    primary: '#06B6D4',
    secondary: '#67E8F9',
    tertiary: '#0891B2',
    quaternary: '#0E7490',
    pieSlices: ['#06B6D4', '#0891B2', '#0E7490', '#155E75', '#67E8F9', '#A5F3FC'],
    chartElements: {
      bar: { fill: '#06B6D4', border: '#0891B2', label: '#FFFFFF' },
      line: { stroke: '#06B6D4', point: '#67E8F9', pointBorder: '#0891B2', pointLabel: '#FFFFFF' },
      area: { fill: '#06B6D4', stroke: '#0891B2', point: '#67E8F9', pointBorder: '#0E7490', pointLabel: '#FFFFFF' },
      pie: { border: '#0891B2', arcLabel: '#FFFFFF', arcLinkLabel: '#67E8F9' }
    }
  },
  corporate: {
    name: 'Corporate Theme',
    description: 'Professional yellow corporate palette',
    primary: '#FFC329',
    secondary: '#FFD666',
    tertiary: '#E6AF00',
    quaternary: '#CC9600',
    pieSlices: ['#FFC329', '#E6AF00', '#D4A017', '#B8860B', '#FFD700', '#DAA520'],
    chartElements: {
      bar: { fill: '#FFC329', border: '#E6AF00', label: '#FFFFFF' },
      line: { stroke: '#FFC329', point: '#FFD666', pointBorder: '#E6AF00', pointLabel: '#FFFFFF' },
      area: { fill: '#FFC329', stroke: '#E6AF00', point: '#FFD666', pointBorder: '#CC9600', pointLabel: '#FFFFFF' },
      pie: { border: '#E6AF00', arcLabel: '#FFFFFF', arcLinkLabel: '#FFD666' }
    }
  },
  navy: {
    name: 'Navy Theme',
    description: 'Executive navy blue palette',
    primary: '#1E3A8A',
    secondary: '#3B82F6',
    tertiary: '#1E40AF',
    quaternary: '#312E81',
    pieSlices: ['#1E3A8A', '#1E40AF', '#312E81', '#1E1B4B', '#3B82F6', '#60A5FA'],
    chartElements: {
      bar: { fill: '#1E3A8A', border: '#1E40AF', label: '#FFFFFF' },
      line: { stroke: '#1E3A8A', point: '#3B82F6', pointBorder: '#1E40AF', pointLabel: '#FFFFFF' },
      area: { fill: '#1E3A8A', stroke: '#1E40AF', point: '#3B82F6', pointBorder: '#312E81', pointLabel: '#FFFFFF' },
      pie: { border: '#1E40AF', arcLabel: '#FFFFFF', arcLinkLabel: '#3B82F6' }
    }
  },
  slate: {
    name: 'Slate Theme',
    description: 'Premium gray slate palette',
    primary: '#475569',
    secondary: '#64748B',
    tertiary: '#334155',
    quaternary: '#1E293B',
    pieSlices: ['#475569', '#334155', '#1E293B', '#0F172A', '#64748B', '#94A3B8'],
    chartElements: {
      bar: { fill: '#475569', border: '#334155', label: '#FFFFFF' },
      line: { stroke: '#475569', point: '#64748B', pointBorder: '#334155', pointLabel: '#FFFFFF' },
      area: { fill: '#475569', stroke: '#334155', point: '#64748B', pointBorder: '#1E293B', pointLabel: '#FFFFFF' },
      pie: { border: '#334155', arcLabel: '#FFFFFF', arcLinkLabel: '#64748B' }
    }
  },
  forest: {
    name: 'Forest Theme',
    description: 'Deep forest green palette',
    primary: '#166534',
    secondary: '#22C55E',
    tertiary: '#15803D',
    quaternary: '#14532D',
    pieSlices: ['#166534', '#15803D', '#14532D', '#052E16', '#22C55E', '#4ADE80'],
    chartElements: {
      bar: { fill: '#166534', border: '#15803D', label: '#FFFFFF' },
      line: { stroke: '#166534', point: '#22C55E', pointBorder: '#15803D', pointLabel: '#FFFFFF' },
      area: { fill: '#166534', stroke: '#15803D', point: '#22C55E', pointBorder: '#14532D', pointLabel: '#FFFFFF' },
      pie: { border: '#15803D', arcLabel: '#FFFFFF', arcLinkLabel: '#22C55E' }
    }
  },
  platinum: {
    name: 'Platinum Theme',
    description: 'Elegant silver platinum palette',
    primary: '#6B7280',
    secondary: '#9CA3AF',
    tertiary: '#4B5563',
    quaternary: '#374151',
    pieSlices: ['#6B7280', '#4B5563', '#374151', '#1F2937', '#9CA3AF', '#D1D5DB'],
    chartElements: {
      bar: { fill: '#6B7280', border: '#4B5563', label: '#FFFFFF' },
      line: { stroke: '#6B7280', point: '#9CA3AF', pointBorder: '#4B5563', pointLabel: '#FFFFFF' },
      area: { fill: '#6B7280', stroke: '#4B5563', point: '#9CA3AF', pointBorder: '#374151', pointLabel: '#FFFFFF' },
      pie: { border: '#4B5563', arcLabel: '#FFFFFF', arcLinkLabel: '#9CA3AF' }
    }
  }
};

export type ColorPresetKey = 'light' | 'dark' | 'corporate' | 'navy' | 'slate' | 'forest' | 'platinum';

export interface ColorPreview {
  key: ColorPresetKey;
  name: string;
  description: string;
  primary: string;
  secondary: string;
}

export class ColorManager {
  /**
   * Gets a specific theme color palette
   */
  static getColorPalette(key: ColorPresetKey): CorporateColorPalette {
    return THEME_COLOR_PALETTES[key];
  }

  /**
   * Gets the corporate color palette (backward compatibility)
   */
  static getCorporateColors(): CorporateColorPalette {
    return THEME_COLOR_PALETTES.corporate;
  }

  /**
   * Gets available theme color palettes for selection
   */
  static getAvailableColorPalettes(): ColorPreview[] {
    return Object.entries(THEME_COLOR_PALETTES).map(([key, palette]) => ({
      key: key as ColorPresetKey,
      name: palette.name,
      description: palette.description,
      primary: palette.primary,
      secondary: palette.secondary
    }));
  }

  /**
   * Gets a specific color from a palette
   */
  static getColor(paletteKey: ColorPresetKey, type: keyof Omit<CorporateColorPalette, 'name' | 'description' | 'chartElements' | 'pieSlices'>): string {
    return THEME_COLOR_PALETTES[paletteKey][type];
  }

  /**
   * Gets chart element colors for a specific chart type and palette
   */
  static getChartColors(paletteKey: ColorPresetKey, chartType: keyof CorporateColorPalette['chartElements']) {
    return THEME_COLOR_PALETTES[paletteKey].chartElements[chartType];
  }

  /**
   * Gets pie slice colors array for a specific palette
   */
  static getPieSliceColors(paletteKey: ColorPresetKey): string[] {
    return THEME_COLOR_PALETTES[paletteKey].pieSlices;
  }

  /**
   * Gets available color preset keys
   */
  static getAvailablePresets(): ColorPresetKey[] {
    return Object.keys(THEME_COLOR_PALETTES) as ColorPresetKey[];
  }

  /**
   * Validates if a color preset key is supported
   */
  static isValidPreset(presetKey: string): presetKey is ColorPresetKey {
    return presetKey in THEME_COLOR_PALETTES;
  }
}