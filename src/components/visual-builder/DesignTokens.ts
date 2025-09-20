'use client';

// Design Tokens System - Centralized design variables for consistent theming

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

  typography: {
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
  }
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
  typography: DARK_TOKENS.typography // Same typography system
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
    grid: {
      background: '#1e293b',
      border: '#475569'
    }
  }
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
    grid: {
      background: '#065f46',
      border: '#059669'
    }
  }
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
    grid: {
      background: '#ffffff',
      border: '#e2e8f0'
    }
  }
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
    grid: {
      background: '#1e293b',
      border: '#475569'
    }
  }
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
    grid: {
      background: '#1e293b',
      border: '#374151'
    }
  }
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
    grid: {
      background: '#166534',
      border: '#15803d'
    }
  }
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
    grid: {
      background: '#7f1d1d',
      border: '#991b1b'
    }
  }
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
    grid: {
      background: '#27272a',
      border: '#3f3f46'
    }
  }
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