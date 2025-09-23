'use client';

// Font preset interface
export interface FontPreset {
  key: string;
  name: string;
  description: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'display' | 'system';
  weight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  style: 'modern' | 'classic' | 'elegant' | 'technical' | 'creative';
}

// Font presets organized by category
const FONT_PRESETS: Record<string, FontPreset> = {
  // Modern Sans-Serif
  inter: {
    key: 'inter',
    name: 'Inter',
    description: 'Modern geometric sans-serif, excellent for UI',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    weight: 'medium',
    style: 'modern'
  },
  opensans: {
    key: 'opensans',
    name: 'Open Sans',
    description: 'Friendly and clean, optimized for readability',
    family: 'Open Sans, sans-serif',
    category: 'sans-serif',
    weight: 'normal',
    style: 'modern'
  },
  roboto: {
    key: 'roboto',
    name: 'Roboto',
    description: 'Google\'s signature font, technical and clean',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    weight: 'normal',
    style: 'technical'
  },
  lato: {
    key: 'lato',
    name: 'Lato',
    description: 'Semi-rounded letterforms, warm and friendly',
    family: 'Lato, sans-serif',
    category: 'sans-serif',
    weight: 'normal',
    style: 'modern'
  },
  montserrat: {
    key: 'montserrat',
    name: 'Montserrat',
    description: 'Inspired by urban typography, modern geometric',
    family: 'Montserrat, sans-serif',
    category: 'sans-serif',
    weight: 'semibold',
    style: 'modern'
  },
  geist: {
    key: 'geist',
    name: 'Geist',
    description: 'Vercel\'s modern interface font, clean and minimal',
    family: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'sans-serif',
    weight: 'medium',
    style: 'modern'
  },

  // System Fonts
  arial: {
    key: 'arial',
    name: 'Arial',
    description: 'Classic system font, universally available',
    family: 'Arial, sans-serif',
    category: 'system',
    weight: 'normal',
    style: 'classic'
  },
  segoe: {
    key: 'segoe',
    name: 'Segoe UI',
    description: 'Microsoft\'s modern system font',
    family: 'Segoe UI, sans-serif',
    category: 'system',
    weight: 'normal',
    style: 'modern'
  },

  // Classic Serif
  georgia: {
    key: 'georgia',
    name: 'Georgia',
    description: 'Elegant serif designed for screen reading',
    family: 'Georgia, serif',
    category: 'serif',
    weight: 'normal',
    style: 'classic'
  },
  merriweather: {
    key: 'merriweather',
    name: 'Merriweather',
    description: 'Designed for pleasant reading on screens',
    family: 'Merriweather, serif',
    category: 'serif',
    weight: 'normal',
    style: 'elegant'
  },

  // Display Fonts
  playfair: {
    key: 'playfair',
    name: 'Playfair Display',
    description: 'High-contrast serif for headings and titles',
    family: 'Playfair Display, serif',
    category: 'display',
    weight: 'bold',
    style: 'elegant'
  }
};

// Theme to default font mapping
const THEME_FONT_MAPPING: Record<string, string> = {
  light: 'opensans',
  dark: 'inter',
  blue: 'roboto',
  green: 'lato',
  corporate: 'arial',
  navy: 'segoe',
  slate: 'montserrat',
  forest: 'playfair',
  burgundy: 'georgia',
  platinum: 'merriweather'
};

export type FontPresetKey = 'inter' | 'opensans' | 'roboto' | 'lato' | 'montserrat' | 'geist' | 'arial' | 'segoe' | 'georgia' | 'merriweather' | 'playfair';

export interface FontPreview {
  key: FontPresetKey;
  name: string;
  description: string;
  family: string;
  category: string;
  style: string;
}

// Font size presets interface
export interface FontSizePreset {
  key: string;
  name: string;
  description: string;
  value: number; // px value
  usage: string;
}

// Font size presets for titles
const FONT_SIZE_PRESETS: Record<string, FontSizePreset> = {
  xs: {
    key: 'xs',
    name: 'Extra Small',
    description: 'Very small titles (12px)',
    value: 12,
    usage: 'Compact widgets'
  },
  sm: {
    key: 'sm',
    name: 'Small',
    description: 'Small titles (14px)',
    value: 14,
    usage: 'Dense dashboards'
  },
  md: {
    key: 'md',
    name: 'Medium',
    description: 'Medium titles (16px)',
    value: 16,
    usage: 'Standard size'
  },
  lg: {
    key: 'lg',
    name: 'Large',
    description: 'Large titles (18px)',
    value: 18,
    usage: 'Default recommended'
  },
  xl: {
    key: 'xl',
    name: 'Extra Large',
    description: 'Extra large titles (24px)',
    value: 24,
    usage: 'Emphasis titles'
  },
  xxl: {
    key: 'xxl',
    name: 'Extra Extra Large',
    description: 'Very large titles (32px)',
    value: 32,
    usage: 'Hero widgets'
  }
};

export type FontSizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface FontSizePreview {
  key: FontSizeKey;
  name: string;
  description: string;
  value: number;
  usage: string;
}

export class FontManager {
  /**
   * Gets a specific font preset
   */
  static getFontPreset(key: FontPresetKey): FontPreset {
    return FONT_PRESETS[key];
  }

  /**
   * Gets available fonts for selection UI
   */
  static getAvailableFonts(): FontPreview[] {
    return Object.values(FONT_PRESETS).map(font => ({
      key: font.key as FontPresetKey,
      name: font.name,
      description: font.description,
      family: font.family,
      category: font.category,
      style: font.style
    }));
  }

  /**
   * Gets fonts organized by category
   */
  static getFontsByCategory(): Record<string, FontPreview[]> {
    const fonts = this.getAvailableFonts();
    return fonts.reduce((acc, font) => {
      if (!acc[font.category]) {
        acc[font.category] = [];
      }
      acc[font.category].push(font);
      return acc;
    }, {} as Record<string, FontPreview[]>);
  }

  /**
   * Gets default font for a specific theme
   */
  static getThemeDefaultFont(themeName: string): FontPresetKey {
    const defaultFont = THEME_FONT_MAPPING[themeName];
    return (defaultFont && this.isValidFont(defaultFont)) ? defaultFont as FontPresetKey : 'inter';
  }

  /**
   * Gets the default font (fallback)
   */
  static getDefaultFont(): FontPresetKey {
    return 'inter';
  }

  /**
   * Validates if a font key is supported
   */
  static isValidFont(fontKey: string): fontKey is FontPresetKey {
    return fontKey in FONT_PRESETS;
  }

  /**
   * Gets available font preset keys
   */
  static getAvailablePresets(): FontPresetKey[] {
    return Object.keys(FONT_PRESETS) as FontPresetKey[];
  }

  /**
   * Gets font family string for CSS
   */
  static getFontFamily(fontKey: FontPresetKey): string {
    return FONT_PRESETS[fontKey]?.family || 'Inter, sans-serif';
  }

  /**
   * Gets font information for a specific key
   */
  static getFontInfo(fontKey: FontPresetKey): {
    family: string;
    name: string;
    category: string;
    weight: string;
    style: string;
  } {
    const preset = FONT_PRESETS[fontKey];
    return {
      family: preset.family,
      name: preset.name,
      category: preset.category,
      weight: preset.weight,
      style: preset.style
    };
  }

  /**
   * Updates theme font mapping (for future extensibility)
   */
  static updateThemeFont(themeName: string, fontKey: FontPresetKey): void {
    if (this.isValidFont(fontKey)) {
      THEME_FONT_MAPPING[themeName] = fontKey;
    }
  }

  // ===== FONT SIZE METHODS =====

  /**
   * Gets a specific font size preset
   */
  static getFontSizePreset(key: FontSizeKey): FontSizePreset {
    return FONT_SIZE_PRESETS[key];
  }

  /**
   * Gets available font sizes for selection UI
   */
  static getAvailableFontSizes(): FontSizePreview[] {
    return Object.values(FONT_SIZE_PRESETS).map(size => ({
      key: size.key as FontSizeKey,
      name: size.name,
      description: size.description,
      value: size.value,
      usage: size.usage
    }));
  }

  /**
   * Gets font size value in pixels
   */
  static getFontSizeValue(sizeKey: FontSizeKey): number {
    return FONT_SIZE_PRESETS[sizeKey]?.value || 18;
  }

  /**
   * Gets the default font size for titles
   */
  static getDefaultFontSize(): FontSizeKey {
    return 'lg';
  }

  /**
   * Validates if a font size key is supported
   */
  static isValidFontSize(sizeKey: string): sizeKey is FontSizeKey {
    return sizeKey in FONT_SIZE_PRESETS;
  }

  /**
   * Gets available font size preset keys
   */
  static getAvailableFontSizeKeys(): FontSizeKey[] {
    return Object.keys(FONT_SIZE_PRESETS) as FontSizeKey[];
  }

  /**
   * Gets font size information for a specific key
   */
  static getFontSizeInfo(sizeKey: FontSizeKey): {
    name: string;
    value: number;
    description: string;
    usage: string;
  } {
    const preset = FONT_SIZE_PRESETS[sizeKey];
    return {
      name: preset.name,
      value: preset.value,
      description: preset.description,
      usage: preset.usage
    };
  }
}