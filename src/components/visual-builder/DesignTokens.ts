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
  }
};

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

  // Surface colors
  background: string;
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

  // Grid specific
  grid: {
    background: string;
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
}

// Dark Theme Tokens
export const DARK_TOKENS: DesignTokens = {
  colors: {
    // Brand
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',

    // Surfaces
    background: '#0a0a0a',
    surface: '#171717',
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

    // Grid
    grid: {
      background: '#171717',
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

  typography: TYPOGRAPHY_PRESETS.inter
};

// Light Theme Tokens
export const LIGHT_TOKENS: DesignTokens = {
  colors: {
    // Brand
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#0891b2',

    // Surfaces
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceElevated: '#ffffff',

    // Borders
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    borderFocus: '#2563eb',

    // Text
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff'
    },

    // Semantic
    semantic: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb'
    },

    // Chart
    chart: {
      primary: '#2563eb',
      secondary: '#059669',
      tertiary: '#d97706',
      quaternary: '#dc2626',
      grid: '#e2e8f0',
      axis: '#64748b'
    },

    // Chart Elements - Light Theme (cores saturadas para contraste)
    chartElements: {
      bar: {
        fill: '#1d4ed8',        // Azul saturado
        border: '#1e3a8a',      // Azul muito escuro
        label: '#1e293b'        // Cinza escuro para labels
      },
      line: {
        stroke: '#059669',      // Verde saturado
        point: '#047857',       // Verde escuro
        pointBorder: '#064e3b', // Verde muito escuro
        pointLabel: '#374151'   // Cinza escuro
      },
      area: {
        fill: '#7c2d12',        // Laranja escuro
        stroke: '#ea580c',      // Laranja médio
        point: '#9a3412',       // Laranja saturado
        pointBorder: '#7c2d12', // Laranja escuro
        pointLabel: '#374151'   // Cinza escuro
      },
      pie: {
        border: '#ffffff',      // Branco para separação
        arcLabel: '#111827',    // Preto para labels
        arcLinkLabel: '#374151' // Cinza escuro para links
      }
    },

    // Grid
    grid: {
      background: '#ffffff',
      border: '#e2e8f0'
    }
  },

  spacing: DARK_TOKENS.spacing, // Same spacing system

  shadows: {
    none: 'none',
    subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(37, 99, 235, 0.2)'
  },

  borders: DARK_TOKENS.borders, // Same border system
  typography: TYPOGRAPHY_PRESETS.opensans
};

// Blue Theme Tokens
export const BLUE_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    primary: '#60a5fa',
    accent: '#38bdf8',
    border: '#475569',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#0f172a'
    },
    chartElements: {
      bar: {
        fill: '#3b82f6',
        border: '#1e40af',
        label: '#e2e8f0'
      },
      line: {
        stroke: '#60a5fa',
        point: '#93c5fd',
        pointBorder: '#1e40af',
        pointLabel: '#dbeafe'
      },
      area: {
        fill: '#1e40af',
        stroke: '#3b82f6',
        point: '#60a5fa',
        pointBorder: '#1e3a8a',
        pointLabel: '#e2e8f0'
      },
      pie: {
        border: '#475569',
        arcLabel: '#f1f5f9',
        arcLinkLabel: '#cbd5e1'
      }
    },
    grid: {
      background: '#1e293b',
      border: '#475569'
    }
  },
  typography: TYPOGRAPHY_PRESETS.roboto
};

// Green Theme Tokens
export const GREEN_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#064e3b',
    surface: '#065f46',
    surfaceElevated: '#047857',
    primary: '#34d399',
    accent: '#6ee7b7',
    border: '#059669',
    text: {
      primary: '#ecfdf5',
      secondary: '#d1fae5',
      muted: '#a7f3d0',
      inverse: '#064e3b'
    },
    chartElements: {
      bar: {
        fill: '#10b981',
        border: '#047857',
        label: '#ecfdf5'
      },
      line: {
        stroke: '#34d399',
        point: '#6ee7b7',
        pointBorder: '#047857',
        pointLabel: '#d1fae5'
      },
      area: {
        fill: '#047857',
        stroke: '#10b981',
        point: '#34d399',
        pointBorder: '#065f46',
        pointLabel: '#ecfdf5'
      },
      pie: {
        border: '#059669',
        arcLabel: '#ecfdf5',
        arcLinkLabel: '#d1fae5'
      }
    },
    grid: {
      background: '#065f46',
      border: '#059669'
    }
  },
  typography: TYPOGRAPHY_PRESETS.lato
};

// Corporate Theme Tokens
export const CORPORATE_TOKENS: DesignTokens = {
  ...LIGHT_TOKENS,
  colors: {
    ...LIGHT_TOKENS.colors,
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9',
    primary: '#475569',
    secondary: '#64748b',
    accent: '#0f172a',
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      muted: '#64748b',
      inverse: '#ffffff'
    },
    chartElements: {
      bar: {
        fill: '#475569',
        border: '#334155',
        label: '#0f172a'
      },
      line: {
        stroke: '#64748b',
        point: '#94a3b8',
        pointBorder: '#475569',
        pointLabel: '#334155'
      },
      area: {
        fill: '#334155',
        stroke: '#475569',
        point: '#64748b',
        pointBorder: '#1e293b',
        pointLabel: '#0f172a'
      },
      pie: {
        border: '#e2e8f0',
        arcLabel: '#0f172a',
        arcLinkLabel: '#334155'
      }
    },
    grid: {
      background: '#ffffff',
      border: '#e2e8f0'
    }
  },
  typography: TYPOGRAPHY_PRESETS.arial
};

// Navy Theme Tokens - Azul Marinho Executivo
export const NAVY_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    border: '#475569',
    borderHover: '#64748b',
    borderFocus: '#3b82f6',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#0f172a'
    },
    chart: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      tertiary: '#60a5fa',
      quaternary: '#93c5fd',
      grid: '#475569',
      axis: '#64748b'
    },
    chartElements: {
      bar: {
        fill: '#1e40af',
        border: '#1e3a8a',
        label: '#f1f5f9'
      },
      line: {
        stroke: '#3b82f6',
        point: '#60a5fa',
        pointBorder: '#1e40af',
        pointLabel: '#cbd5e1'
      },
      area: {
        fill: '#1e3a8a',
        stroke: '#1e40af',
        point: '#3b82f6',
        pointBorder: '#1e3a8a',
        pointLabel: '#f1f5f9'
      },
      pie: {
        border: '#475569',
        arcLabel: '#f1f5f9',
        arcLinkLabel: '#cbd5e1'
      }
    },
    grid: {
      background: '#1e293b',
      border: '#475569'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.georgia
};

// Slate Theme Tokens - Cinza Moderno Premium
export const SLATE_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#0f172a',
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
      background: '#1e293b',
      border: '#374151'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.segoe
};

// Forest Theme Tokens - Verde Empresarial Sustentável
export const FOREST_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#14532d',
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
      background: '#166534',
      border: '#15803d'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.montserrat
};

// Burgundy Theme Tokens - Vermelho Vinho Sofisticado
export const BURGUNDY_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#450a0a',
    surface: '#7f1d1d',
    surfaceElevated: '#991b1b',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171',
    border: '#991b1b',
    borderHover: '#dc2626',
    borderFocus: '#ef4444',
    text: {
      primary: '#fef2f2',
      secondary: '#fee2e2',
      muted: '#fecaca',
      inverse: '#450a0a'
    },
    semantic: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6'
    },
    chart: {
      primary: '#dc2626',
      secondary: '#ef4444',
      tertiary: '#f87171',
      quaternary: '#fca5a5',
      grid: '#991b1b',
      axis: '#ef4444'
    },
    chartElements: {
      bar: {
        fill: '#dc2626',
        border: '#991b1b',
        label: '#fef2f2'
      },
      line: {
        stroke: '#ef4444',
        point: '#f87171',
        pointBorder: '#dc2626',
        pointLabel: '#fee2e2'
      },
      area: {
        fill: '#991b1b',
        stroke: '#dc2626',
        point: '#ef4444',
        pointBorder: '#7f1d1d',
        pointLabel: '#fef2f2'
      },
      pie: {
        border: '#991b1b',
        arcLabel: '#fef2f2',
        arcLinkLabel: '#fee2e2'
      }
    },
    grid: {
      background: '#7f1d1d',
      border: '#991b1b'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.playfair
};

// Platinum Theme Tokens - Prata Elegante
export const PLATINUM_TOKENS: DesignTokens = {
  ...DARK_TOKENS,
  colors: {
    ...DARK_TOKENS.colors,
    background: '#18181b',
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
      background: '#27272a',
      border: '#3f3f46'
    }
  },

  spacing: DARK_TOKENS.spacing,
  shadows: DARK_TOKENS.shadows,
  borders: DARK_TOKENS.borders,

  typography: TYPOGRAPHY_PRESETS.merriweather
};

// Theme mapping
export const THEME_TOKENS = {
  light: LIGHT_TOKENS,
  dark: DARK_TOKENS,
  blue: BLUE_TOKENS,
  green: GREEN_TOKENS,
  corporate: CORPORATE_TOKENS,
  navy: NAVY_TOKENS,
  slate: SLATE_TOKENS,
  forest: FOREST_TOKENS,
  burgundy: BURGUNDY_TOKENS,
  platinum: PLATINUM_TOKENS
} as const;

export type ThemeTokenName = keyof typeof THEME_TOKENS;