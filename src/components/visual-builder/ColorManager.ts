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

// Corporate yellow/gold color palette
const CORPORATE_COLORS: CorporateColorPalette = {
  name: 'Corporate',
  description: 'Yellow and gold corporate color palette',

  // Main brand colors
  primary: '#FFC329',      // Main corporate yellow
  secondary: '#FFD666',    // Light yellow
  tertiary: '#E6AF00',     // Gold
  quaternary: '#CC9600',   // Dark gold

  // Pie chart slice colors for variety
  pieSlices: [
    '#FFC329',  // Primary yellow
    '#E6AF00',  // Gold
    '#D4A017',  // Dark gold
    '#B8860B',  // Bronze gold
    '#FFD700',  // Bright gold
    '#DAA520'   // Goldenrod
  ],

  // Chart-specific element colors
  chartElements: {
    bar: {
      fill: '#FFC329',
      border: '#E6AF00',
      label: '#FFFFFF'
    },
    line: {
      stroke: '#FFC329',
      point: '#FFD666',
      pointBorder: '#E6AF00',
      pointLabel: '#FFFFFF'
    },
    area: {
      fill: '#FFC329',
      stroke: '#E6AF00',
      point: '#FFD666',
      pointBorder: '#CC9600',
      pointLabel: '#FFFFFF'
    },
    pie: {
      border: '#E6AF00',
      arcLabel: '#FFFFFF',
      arcLinkLabel: '#FFD666'
    }
  }
};

export type ColorPresetKey = 'corporate';

export class ColorManager {
  /**
   * Gets the corporate color palette
   */
  static getCorporateColors(): CorporateColorPalette {
    return CORPORATE_COLORS;
  }

  /**
   * Gets a specific color from the corporate palette
   */
  static getCorporateColor(type: keyof Omit<CorporateColorPalette, 'name' | 'description' | 'chartElements' | 'pieSlices'>): string {
    return CORPORATE_COLORS[type];
  }

  /**
   * Gets chart element colors for a specific chart type
   */
  static getCorporateChartColors(chartType: keyof CorporateColorPalette['chartElements']) {
    return CORPORATE_COLORS.chartElements[chartType];
  }

  /**
   * Gets pie slice colors array
   */
  static getCorporatePieSliceColors(): string[] {
    return CORPORATE_COLORS.pieSlices;
  }

  /**
   * Gets available color preset keys
   */
  static getAvailablePresets(): ColorPresetKey[] {
    return ['corporate'];
  }

  /**
   * Validates if a color preset key is supported
   */
  static isValidPreset(presetKey: string): presetKey is ColorPresetKey {
    return presetKey === 'corporate';
  }
}