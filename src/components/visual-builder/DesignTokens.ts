'use client';

// Design Tokens System - Centralized design variables for consistent theming

// Typography Presets - Modular typography configurations
const TYPOGRAPHY_PRESETS = {
  inter: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'JetBrains Mono, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  georgia: {
    fontFamily: {
      primary: 'Georgia, Times New Roman, serif',
      mono: 'Menlo, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 15,
      md: 17,
      lg: 22,
      xl: 28,
      xxl: 38
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  roboto: {
    fontFamily: {
      primary: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'Fira Code, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 19,
      xl: 25,
      xxl: 34
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  arial: {
    fontFamily: {
      primary: 'Arial, Helvetica, sans-serif',
      mono: 'Courier New, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 21,
      xxl: 28
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  segoe: {
    fontFamily: {
      primary: 'Segoe UI, Tahoma, Geneva, sans-serif',
      mono: 'Cascadia Code, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 11,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 26,
      xxl: 36
    },
    fontWeight: {
      normal: 300,
      medium: 400,
      semibold: 500,
      bold: 600
    }
  },
  playfair: {
    fontFamily: {
      primary: 'Playfair Display, Georgia, serif',
      mono: 'SF Mono, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 21,
      xl: 27,
      xxl: 35
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  opensans: {
    fontFamily: {
      primary: 'Open Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'Source Code Pro, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 19,
      xl: 25,
      xxl: 33
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  montserrat: {
    fontFamily: {
      primary: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'JetBrains Mono, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 11,
      sm: 13,
      md: 16,
      lg: 20,
      xl: 26,
      xxl: 35
    },
    fontWeight: {
      normal: 300,
      medium: 450,
      semibold: 550,
      bold: 650
    }
  },
  lato: {
    fontFamily: {
      primary: 'Lato, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'IBM Plex Mono, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 19,
      xl: 24,
      xxl: 32
    },
    fontWeight: {
      normal: 300,
      medium: 400,
      semibold: 600,
      bold: 700
    }
  },
  merriweather: {
    fontFamily: {
      primary: 'Merriweather, Georgia, serif',
      mono: 'Menlo, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 15,
      md: 17,
      lg: 22,
      xl: 28,
      xxl: 37
    },
    fontWeight: {
      normal: 300,
      medium: 400,
      semibold: 700,
      bold: 900
    }
  },
  geist: {
    fontFamily: {
      primary: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'Geist Mono, JetBrains Mono, Consolas, Monaco, monospace'
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

// Export typography presets for external use
export { TYPOGRAPHY_PRESETS };

export interface TextTokens {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
}

export interface SemanticTokens {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ColorTokens {
  // Brand colors
  primary: string;
  secondary: string;
  accent: string;

  // Surface colors (background comes from BackgroundManager)
  background?: string;
  surface: string;
  surfaceElevated: string;

  // Border colors
  border: string;
  borderHover: string;
  borderFocus: string;

  // Text colors
  text: TextTokens;

  // Semantic colors
  semantic: SemanticTokens;

  // Chart specific
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    grid: string;
    axis: string;
  };

  // Pie chart specific colors for varied slices
  pieSliceColors?: string[];

  // Chart Elements - Specific colors for each chart type
  chartElements: {
    bar: {
      fill: string;           // barColor
      border: string;         // borderColor
      label: string;          // labelTextColor
    };
    line: {
      stroke: string;         // lineColor
      point: string;          // pointColor
      pointBorder: string;    // pointBorderColor
      pointLabel: string;     // pointLabelColor
    };
    area: {
      fill: string;           // area fill color
      stroke: string;         // lineColor
      point: string;          // pointColor
      pointBorder: string;    // pointBorderColor
      pointLabel: string;     // pointLabelColor
    };
    pie: {
      border: string;         // borderColor
      arcLabel: string;       // arcLabelsTextColor
      arcLinkLabel: string;   // arcLinkLabelsTextColor
    };
  };

  // Grid specific (background comes from BackgroundManager)
  grid: {
    background?: string;
    border: string;
  };
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ShadowTokens {
  none: string;
  subtle: string;
  medium: string;
  strong: string;
  glow: string;
}

export interface EffectsTokens {
  opacity: {
    transparent: number;
    subtle: number;
    medium: number;
    strong: number;
    opaque: number;
  };
  // gradient and backdrop come from BackgroundManager
  gradient?: {
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
  backdrop?: {
    blur: number;
    saturate: number;
    brightness: number;
  };
  shadow: {
    color: string;
    opacity: number;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface BorderTokens {
  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  width: {
    none: number;
    thin: number;
    medium: number;
    thick: number;
  };
}

export interface TypographyTokens {
  fontFamily: {
    primary: string;
    mono: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

// Complete Design Token System
export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  typography: TypographyTokens;
  effects: EffectsTokens;
}

// Dark Theme Tokens
export const DARK_TOKENS: DesignTokens = {
  colors: {
    // Brand
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',

    // Surfaces (background will come from BackgroundManager)
    surface: '#1B1B1B',
    surfaceElevated: '#262626',

    // Borders
    border: '#404040',
    borderHover: '#525252',
    borderFocus: '#3b82f6',

    // Text
    text: {
      primary: '#ffffff',
      secondary: '#d1d5db',
      muted: '#9ca3af',
      inverse: '#000000'
    },

    // Semantic
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },

    // Chart
    chart: {
      primary: '#3b82f6',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      quaternary: '#ef4444',
      grid: '#404040',
      axis: '#6b7280'
    },

    // Chart Elements - Dark Theme (cores vibrantes para contraste)
    chartElements: {
      bar: {
        fill: '#60a5fa',        // Azul claro vibrante
        border: '#1e40af',      // Azul escuro para borda
        label: '#f1f5f9'        // Branco para labels
      },
      line: {
        stroke: '#34d399',      // Verde claro
        point: '#10b981',       // Verde médio
        pointBorder: '#065f46', // Verde escuro
        pointLabel: '#ecfdf5'   // Verde muito claro
      },
      area: {
        fill: '#a78bfa',        // Roxo claro
        stroke: '#7c3aed',      // Roxo médio
        point: '#5b21b6',       // Roxo escuro
        pointBorder: '#3730a3', // Roxo muito escuro
        pointLabel: '#f3f4f6'   // Cinza claro
      },
      pie: {
        border: '#374151',      // Cinza escuro
        arcLabel: '#f9fafb',    // Branco para labels
        arcLinkLabel: '#d1d5db' // Cinza claro para links
      }
    },

    // Grid (background will come from BackgroundManager)
    grid: {
      border: '#404040'
    }
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },

  shadows: {
    none: 'none',
    subtle: '0 1px 3px rgba(0, 0, 0, 0.4)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.5)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)'
  },

  borders: {
    radius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999
    },
    width: {
      none: 0,
      thin: 1,
      medium: 2,
      thick: 4
    }
  },

  typography: TYPOGRAPHY_PRESETS.inter,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#000000',
      opacity: 0.25,
      blur: 15,
      offsetX: 0,
      offsetY: 8
    }
  }
};

// Light Theme Tokens
export const LIGHT_TOKENS: DesignTokens = {
  colors: {
    // Brand - Azuis da imagem de referência
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#1d4ed8',

    // Surfaces (background will come from BackgroundManager)
    surface: '#ffffff',
    surfaceElevated: '#ffffff',

    // Borders - Mais sutis para visual limpo
    border: '#f1f5f9',
    borderHover: '#e2e8f0',
    borderFocus: '#3b82f6',

    // Text - Melhor hierarquia
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff'
    },

    // Semantic
    semantic: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#3b82f6'
    },

    // Chart - Azuis consistentes
    chart: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      tertiary: '#2563eb',
      quaternary: '#60a5fa',
      grid: '#f1f5f9',
      axis: '#64748b'
    },

    // Chart Elements - Azuis da imagem de referência
    chartElements: {
      bar: {
        fill: '#3b82f6',        // Azul principal da imagem
        border: '#2563eb',      // Azul mais escuro para borda
        label: '#1e293b'        // Texto escuro para contraste
      },
      line: {
        stroke: '#3b82f6',      // Azul principal
        point: '#1d4ed8',       // Azul mais saturado
        pointBorder: '#2563eb', // Azul escuro para borda
        pointLabel: '#475569'   // Cinza para labels
      },
      area: {
        fill: '#93c5fd',        // Azul claro para área
        stroke: '#3b82f6',      // Azul principal para linha
        point: '#1d4ed8',       // Azul saturado
        pointBorder: '#2563eb', // Azul escuro
        pointLabel: '#475569'   // Cinza
      },
      pie: {
        border: '#ffffff',      // Branco para separação
        arcLabel: '#1e293b',    // Texto escuro
        arcLinkLabel: '#475569' // Cinza para links
      }
    },

    // Grid (background will come from BackgroundManager)
    grid: {
      border: '#f1f5f9'
    }
  },

  spacing: DARK_TOKENS.spacing, // Same spacing system

  shadows: {
    none: 'none',
    subtle: '0 1px 3px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.12)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.16)',
    glow: '0 0 20px rgba(59, 130, 246, 0.15)'
  },

  borders: DARK_TOKENS.borders, // Same border system
  typography: TYPOGRAPHY_PRESETS.geist, // Usando Geist

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // Explicit no gradient/backdrop for clean light theme
    gradient: undefined,
    backdrop: undefined,
    shadow: {
      color: '#64748b',
      opacity: 0,
      blur: 8,
      offsetX: 0,
      offsetY: 2
    }
  }
};



// Corporate Theme Tokens
export const CORPORATE_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    // Widget backgrounds - medium purple/navy
    surface: '#27294E',
    surfaceElevated: '#27294E',
    // Brand colors - will be overridden by ColorManager
    primary: DARK_TOKENS.colors.primary, // Placeholder, will be replaced by ColorManager
    secondary: DARK_TOKENS.colors.secondary, // Placeholder, will be replaced by ColorManager
    accent: DARK_TOKENS.colors.accent, // Placeholder, will be replaced by ColorManager
    // Borders suitable for dark background
    border: '#3A3C5C',
    borderHover: '#4A4D6B',
    borderFocus: DARK_TOKENS.colors.borderFocus, // Placeholder, will be replaced by ColorManager
    // Text colors for dark background
    text: {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      muted: '#FFFFFF',
      inverse: '#151138'
    },

    // Chart colors with white axis - non-color properties only
    chart: {
      ...DARK_TOKENS.colors.chart,
      // Color properties will be overridden by ColorManager
      grid: '#3A3C5C', // Keep grid color as it's not yellow
      axis: '#FFFFFF'  // Keep axis color as it's white
    },

    // Pie slice colors - will be overridden by ColorManager
    pieSliceColors: DARK_TOKENS.colors.pieSliceColors, // Placeholder

    // Chart elements - will be overridden by ColorManager
    chartElements: DARK_TOKENS.colors.chartElements, // Placeholder
    grid: {
      border: '#3A3C5C'
    }
  },
  typography: TYPOGRAPHY_PRESETS.arial,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#475569',
      opacity: 0.1,
      blur: 8,
      offsetX: 0,
      offsetY: 2
    }
  }
};

// Navy Theme Tokens - Azul Marinho Executivo
export const NAVY_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    // Widgets/cards in lighter navy blue (como na imagem)
    surface: '#2d3748',
    surfaceElevated: '#4a5568',
    // Navy azuis da imagem
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    // Bordas sutis
    border: '#4a5568',
    borderHover: '#718096',
    borderFocus: '#3b82f6',
    // Texto claro para contraste
    text: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      muted: '#cbd5e1',
      inverse: '#1a202c'
    },
    // Semantic colors (alertas etc)
    semantic: {
      success: '#48bb78',
      warning: '#ed8936',
      error: '#f56565',
      info: '#3b82f6'
    },
    // Charts colors
    chart: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      tertiary: '#93c5fd',
      quaternary: '#bfdbfe',
      grid: '#4a5568',
      axis: '#718096'
    },
    chartElements: {
      bar: {
        fill: '#3b82f6',
        border: '#2563eb',
        label: '#ffffff'
      },
      line: {
        stroke: '#60a5fa',
        point: '#93c5fd',
        pointBorder: '#3b82f6',
        pointLabel: '#e2e8f0'
      },
      area: {
        fill: '#2563eb',
        stroke: '#3b82f6',
        point: '#60a5fa',
        pointBorder: '#2563eb',
        pointLabel: '#ffffff'
      },
      pie: {
        border: '#4a5568',
        arcLabel: '#ffffff',
        arcLinkLabel: '#e2e8f0'
      }
    },
    grid: {
      border: '#475569'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.georgia,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#1e40af',
      opacity: 0.35,
      blur: 18,
      offsetX: 0,
      offsetY: 10
    }
  }
};

// Slate Theme Tokens - Cinza Moderno Premium
export const SLATE_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    surface: '#1e293b',
    surfaceElevated: '#334155',
    primary: '#475569',
    secondary: '#64748b',
    accent: '#94a3b8',
    border: '#374151',
    borderHover: '#475569',
    borderFocus: '#64748b',
    text: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      muted: '#cbd5e1',
      inverse: '#0f172a'
    },
    chart: {
      primary: '#475569',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      quaternary: '#cbd5e1',
      grid: '#374151',
      axis: '#64748b'
    },
    chartElements: {
      bar: {
        fill: '#64748b',
        border: '#475569',
        label: '#f8fafc'
      },
      line: {
        stroke: '#94a3b8',
        point: '#cbd5e1',
        pointBorder: '#64748b',
        pointLabel: '#e2e8f0'
      },
      area: {
        fill: '#475569',
        stroke: '#64748b',
        point: '#94a3b8',
        pointBorder: '#374151',
        pointLabel: '#f8fafc'
      },
      pie: {
        border: '#374151',
        arcLabel: '#f8fafc',
        arcLinkLabel: '#e2e8f0'
      }
    },
    grid: {
      border: '#374151'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.segoe,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#374151',
      opacity: 0.4,
      blur: 22,
      offsetX: -2,
      offsetY: 12
    }
  }
};

// Forest Theme Tokens - Verde Empresarial Sustentável
export const FOREST_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    surface: '#166534',
    surfaceElevated: '#15803d',
    primary: '#16a34a',
    secondary: '#22c55e',
    accent: '#4ade80',
    border: '#15803d',
    borderHover: '#16a34a',
    borderFocus: '#22c55e',
    text: {
      primary: '#f0fdf4',
      secondary: '#dcfce7',
      muted: '#bbf7d0',
      inverse: '#14532d'
    },
    semantic: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6'
    },
    chart: {
      primary: '#16a34a',
      secondary: '#22c55e',
      tertiary: '#4ade80',
      quaternary: '#86efac',
      grid: '#15803d',
      axis: '#22c55e'
    },
    chartElements: {
      bar: {
        fill: '#16a34a',
        border: '#15803d',
        label: '#f0fdf4'
      },
      line: {
        stroke: '#22c55e',
        point: '#4ade80',
        pointBorder: '#16a34a',
        pointLabel: '#dcfce7'
      },
      area: {
        fill: '#15803d',
        stroke: '#16a34a',
        point: '#22c55e',
        pointBorder: '#166534',
        pointLabel: '#f0fdf4'
      },
      pie: {
        border: '#15803d',
        arcLabel: '#f0fdf4',
        arcLinkLabel: '#dcfce7'
      }
    },
    grid: {
      border: '#15803d'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.montserrat,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#16a34a',
      opacity: 0.2,
      blur: 14,
      offsetX: 3,
      offsetY: 6
    }
  }
};

// High Tech Theme Tokens - Futurístico Ciano/Azul
export const HIGHTECH_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    surface: '#0a0f1c',
    surfaceElevated: '#111827',
    primary: '#00ffff',
    secondary: '#0dcaf0',
    accent: '#20c997',
    border: '#1f2937',
    borderHover: '#374151',
    borderFocus: '#00ffff',
    text: {
      primary: '#ffffff',
      secondary: '#e0f2fe',
      muted: '#b3e5fc',
      inverse: '#000a0f'
    },
    semantic: {
      success: '#00ff88',
      warning: '#ffa726',
      error: '#ff5252',
      info: '#00ffff'
    },
    chart: {
      primary: '#00ffff',
      secondary: '#0dcaf0',
      tertiary: '#20c997',
      quaternary: '#40e0d0',
      grid: '#1f2937',
      axis: '#9ca3af'
    },
    chartElements: {
      bar: {
        fill: '#00ffff',        // Bright cyan fill
        border: '#0dcaf0',      // Cyan border with glow
        label: '#ffffff'        // White text for contrast
      },
      line: {
        stroke: '#0dcaf0',      // Cyan line
        point: '#00ffff',       // Bright cyan points
        pointBorder: '#20c997', // Teal border
        pointLabel: '#e0f2fe'   // Light blue labels
      },
      area: {
        fill: '#003d4d',        // Dark cyan fill
        stroke: '#00ffff',      // Bright cyan stroke
        point: '#0dcaf0',       // Cyan points
        pointBorder: '#005563', // Dark teal border
        pointLabel: '#ffffff'   // White labels
      },
      pie: {
        border: '#1f2937',      // Dark border
        arcLabel: '#ffffff',    // White labels
        arcLinkLabel: '#e0f2fe' // Light blue links
      }
    },
    grid: {
      border: '#1f2937'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.geist,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 0.85,
      medium: 0.9,
      strong: 0.95,
      opaque: 1
    },
    // Futuristic gradient background
    gradient: {
      type: 'linear',
      direction: '135deg',
      startColor: 'rgba(10, 15, 28, 0.4)',
      endColor: 'rgba(17, 24, 39, 0.2)'
    },
    // Glassmorphism backdrop filter
    backdrop: {
      blur: 20,
      saturate: 180,
      brightness: 120
    },
    // High-tech shadows with cyan glow
    shadow: {
      color: '#00ffff',
      opacity: 0.4,
      blur: 20,
      offsetX: 0,
      offsetY: 8
    }
  }
};


// Platinum Theme Tokens - Prata Elegante
export const PLATINUM_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    surface: '#27272a',
    surfaceElevated: '#3f3f46',
    primary: '#71717a',
    secondary: '#a1a1aa',
    accent: '#d4d4d8',
    border: '#3f3f46',
    borderHover: '#52525b',
    borderFocus: '#71717a',
    text: {
      primary: '#fafafa',
      secondary: '#f4f4f5',
      muted: '#e4e4e7',
      inverse: '#18181b'
    },
    chart: {
      primary: '#71717a',
      secondary: '#a1a1aa',
      tertiary: '#d4d4d8',
      quaternary: '#f4f4f5',
      grid: '#3f3f46',
      axis: '#a1a1aa'
    },
    chartElements: {
      bar: {
        fill: '#71717a',
        border: '#52525b',
        label: '#fafafa'
      },
      line: {
        stroke: '#a1a1aa',
        point: '#d4d4d8',
        pointBorder: '#71717a',
        pointLabel: '#f4f4f5'
      },
      area: {
        fill: '#52525b',
        stroke: '#71717a',
        point: '#a1a1aa',
        pointBorder: '#3f3f46',
        pointLabel: '#fafafa'
      },
      pie: {
        border: '#3f3f46',
        arcLabel: '#fafafa',
        arcLinkLabel: '#f4f4f5'
      }
    },
    grid: {
      border: '#3f3f46'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.merriweather,

  effects: {
    opacity: {
      transparent: 0,
      subtle: 1.0,
      medium: 1.0,
      strong: 1.0,
      opaque: 1
    },
    // gradient and backdrop will come from BackgroundManager
    shadow: {
      color: '#71717a',
      opacity: 0.3,
      blur: 20,
      offsetX: 0,
      offsetY: 8
    }
  }
};

// Theme mapping
export const THEME_TOKENS = {
  light: LIGHT_TOKENS,
  dark: DARK_TOKENS,
  corporate: CORPORATE_TOKENS,
  navy: NAVY_TOKENS,
  slate: SLATE_TOKENS,
  forest: FOREST_TOKENS,
  hightech: HIGHTECH_TOKENS,
  platinum: PLATINUM_TOKENS
} as const;

export type ThemeTokenName = keyof typeof THEME_TOKENS;

// Import background manager for theme integration
import type { BackgroundPresetKey } from './BackgroundManager';

// Theme to Background mapping - each theme uses a specific background preset
export const THEME_BACKGROUND_MAPPING: Record<ThemeTokenName, BackgroundPresetKey> = {
  light: 'light',
  dark: 'black',
  corporate: 'corporate',
  navy: 'navy',
  slate: 'glassDark',
  forest: 'darkGray',
  hightech: 'hightech',
  platinum: 'glassLight'
} as const;