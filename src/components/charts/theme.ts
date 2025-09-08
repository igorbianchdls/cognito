// Common theme for all Nivo charts
export const nivoTheme = {
  axis: {
    ticks: {
      text: { fontSize: 12, fill: '#6b7280' }
    },
    legend: {
      text: { fontSize: 14, fill: '#374151', fontWeight: 500 }
    }
  },
  labels: {
    text: { fontSize: 11, fill: '#1f2937', fontWeight: 500 }
  },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#1f2937',
      fontSize: 12,
      borderRadius: 8,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }
  }
};

// Typography configuration interface
interface TypographyConfig {
  axisFontFamily?: string
  axisFontSize?: number
  axisFontWeight?: number
  axisTextColor?: string
  axisLegendFontSize?: number
  axisLegendFontWeight?: number
  labelsFontFamily?: string
  labelsFontSize?: number
  labelsFontWeight?: number
  labelsTextColor?: string
  legendsFontFamily?: string
  legendsFontSize?: number
  legendsFontWeight?: number
  legendsTextColor?: string
  tooltipFontSize?: number
  tooltipFontFamily?: string
}

// Create elegant theme with custom typography
export const createElegantTheme = (typography: TypographyConfig = {}) => {
  const {
    axisFontFamily = 'Geist, sans-serif',
    axisFontSize = 12,
    axisFontWeight = 400,
    axisTextColor = '#6b7280',
    axisLegendFontSize = 14,
    axisLegendFontWeight = 500,
    labelsFontFamily = 'Geist, sans-serif',
    labelsFontSize = 11,
    labelsFontWeight = 500,
    labelsTextColor = '#1f2937',
    legendsFontFamily = 'Geist, sans-serif',
    legendsFontSize = 12,
    legendsFontWeight = 400,
    legendsTextColor = '#6b7280',
    tooltipFontSize = 12,
    tooltipFontFamily = 'Geist, sans-serif'
  } = typography

  return {
    ...nivoTheme,
    axis: {
      ticks: {
        line: { stroke: 'transparent' }, // Remove tick lines
        text: { 
          fontSize: axisFontSize, 
          fill: axisTextColor, 
          fontFamily: axisFontFamily,
          fontWeight: axisFontWeight
        }
      },
      legend: {
        text: { 
          fontSize: axisLegendFontSize, 
          fill: axisTextColor, 
          fontWeight: axisLegendFontWeight,
          fontFamily: axisFontFamily
        }
      },
      domain: { line: { stroke: 'transparent' } } // Remove axis lines
    },
    grid: {
      line: { stroke: '#f1f5f9', strokeWidth: 1 } // Grid sutil
    },
    labels: {
      text: { 
        fontSize: labelsFontSize, 
        fill: labelsTextColor, 
        fontFamily: labelsFontFamily,
        fontWeight: labelsFontWeight
      }
    },
    legends: {
      text: { 
        fontSize: legendsFontSize, 
        fill: legendsTextColor, 
        fontFamily: legendsFontFamily,
        fontWeight: legendsFontWeight
      }
    },
    tooltip: {
      container: {
        ...nivoTheme.tooltip.container,
        fontSize: tooltipFontSize,
        fontFamily: tooltipFontFamily
      }
    }
  }
}

// Default elegant theme (backward compatibility)
export const elegantTheme = createElegantTheme();

// Common color schemes
export const colorSchemes = {
  primary: 'blue_green',
  secondary: 'category10',
  accent: 'paired'
} as const;