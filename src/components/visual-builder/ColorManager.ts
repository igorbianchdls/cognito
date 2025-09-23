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

// Corporate color palettes
const CORPORATE_COLOR_PALETTES: Record<string, CorporateColorPalette> = {
  corporate: {
    name: 'Corporate Yellow',
    description: 'Yellow and gold corporate color palette',
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
  corporate_blue: {
    name: 'Corporate Blue',
    description: 'Blue corporate color palette',
    primary: '#3B82F6',
    secondary: '#60A5FA',
    tertiary: '#2563EB',
    quaternary: '#1D4ED8',
    pieSlices: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#60A5FA', '#93C5FD'],
    chartElements: {
      bar: { fill: '#3B82F6', border: '#2563EB', label: '#FFFFFF' },
      line: { stroke: '#3B82F6', point: '#60A5FA', pointBorder: '#2563EB', pointLabel: '#FFFFFF' },
      area: { fill: '#3B82F6', stroke: '#2563EB', point: '#60A5FA', pointBorder: '#1D4ED8', pointLabel: '#FFFFFF' },
      pie: { border: '#2563EB', arcLabel: '#FFFFFF', arcLinkLabel: '#60A5FA' }
    }
  },
  corporate_green: {
    name: 'Corporate Green',
    description: 'Green corporate color palette',
    primary: '#10B981',
    secondary: '#34D399',
    tertiary: '#059669',
    quaternary: '#047857',
    pieSlices: ['#10B981', '#059669', '#047857', '#065F46', '#34D399', '#6EE7B7'],
    chartElements: {
      bar: { fill: '#10B981', border: '#059669', label: '#FFFFFF' },
      line: { stroke: '#10B981', point: '#34D399', pointBorder: '#059669', pointLabel: '#FFFFFF' },
      area: { fill: '#10B981', stroke: '#059669', point: '#34D399', pointBorder: '#047857', pointLabel: '#FFFFFF' },
      pie: { border: '#059669', arcLabel: '#FFFFFF', arcLinkLabel: '#34D399' }
    }
  },
  corporate_red: {
    name: 'Corporate Red',
    description: 'Red corporate color palette',
    primary: '#EF4444',
    secondary: '#F87171',
    tertiary: '#DC2626',
    quaternary: '#B91C1C',
    pieSlices: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#F87171', '#FCA5A5'],
    chartElements: {
      bar: { fill: '#EF4444', border: '#DC2626', label: '#FFFFFF' },
      line: { stroke: '#EF4444', point: '#F87171', pointBorder: '#DC2626', pointLabel: '#FFFFFF' },
      area: { fill: '#EF4444', stroke: '#DC2626', point: '#F87171', pointBorder: '#B91C1C', pointLabel: '#FFFFFF' },
      pie: { border: '#DC2626', arcLabel: '#FFFFFF', arcLinkLabel: '#F87171' }
    }
  },
  corporate_purple: {
    name: 'Corporate Purple',
    description: 'Purple corporate color palette',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    tertiary: '#7C3AED',
    quaternary: '#6D28D9',
    pieSlices: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#A78BFA', '#C4B5FD'],
    chartElements: {
      bar: { fill: '#8B5CF6', border: '#7C3AED', label: '#FFFFFF' },
      line: { stroke: '#8B5CF6', point: '#A78BFA', pointBorder: '#7C3AED', pointLabel: '#FFFFFF' },
      area: { fill: '#8B5CF6', stroke: '#7C3AED', point: '#A78BFA', pointBorder: '#6D28D9', pointLabel: '#FFFFFF' },
      pie: { border: '#7C3AED', arcLabel: '#FFFFFF', arcLinkLabel: '#A78BFA' }
    }
  }
};

export type ColorPresetKey = 'corporate' | 'corporate_blue' | 'corporate_green' | 'corporate_red' | 'corporate_purple';

export interface ColorPreview {
  key: ColorPresetKey;
  name: string;
  description: string;
  primary: string;
  secondary: string;
}

export class ColorManager {
  /**
   * Gets a specific corporate color palette
   */
  static getColorPalette(key: ColorPresetKey): CorporateColorPalette {
    return CORPORATE_COLOR_PALETTES[key];
  }

  /**
   * Gets the corporate color palette (backward compatibility)
   */
  static getCorporateColors(): CorporateColorPalette {
    return CORPORATE_COLOR_PALETTES.corporate;
  }

  /**
   * Gets available corporate color palettes for selection
   */
  static getAvailableColorPalettes(): ColorPreview[] {
    return Object.entries(CORPORATE_COLOR_PALETTES).map(([key, palette]) => ({
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
    return CORPORATE_COLOR_PALETTES[paletteKey][type];
  }

  /**
   * Gets chart element colors for a specific chart type and palette
   */
  static getChartColors(paletteKey: ColorPresetKey, chartType: keyof CorporateColorPalette['chartElements']) {
    return CORPORATE_COLOR_PALETTES[paletteKey].chartElements[chartType];
  }

  /**
   * Gets pie slice colors array for a specific palette
   */
  static getPieSliceColors(paletteKey: ColorPresetKey): string[] {
    return CORPORATE_COLOR_PALETTES[paletteKey].pieSlices;
  }

  /**
   * Gets available color preset keys
   */
  static getAvailablePresets(): ColorPresetKey[] {
    return Object.keys(CORPORATE_COLOR_PALETTES) as ColorPresetKey[];
  }

  /**
   * Validates if a color preset key is supported
   */
  static isValidPreset(presetKey: string): presetKey is ColorPresetKey {
    return presetKey in CORPORATE_COLOR_PALETTES;
  }
}