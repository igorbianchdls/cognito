'use client';

// Background presets for grid/canvas backgrounds
interface BackgroundPresetBase {
  type: 'solid' | 'gradient' | 'glass';
  name: string;
  description: string;
  backgroundColor: string;
}

interface SolidBackgroundPreset extends BackgroundPresetBase {
  type: 'solid';
  backgroundGradient: { enabled: false };
}

interface GradientBackgroundPreset extends BackgroundPresetBase {
  type: 'gradient';
  backgroundGradient: {
    enabled: true;
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
}

interface GlassBackgroundPreset extends BackgroundPresetBase {
  type: 'glass';
  backgroundGradient: { enabled: false };
  backdropFilter: {
    enabled: boolean;
    blur: number;
  };
}

type BackgroundPreset = SolidBackgroundPreset | GradientBackgroundPreset | GlassBackgroundPreset;

const BACKGROUND_PRESETS: Record<string, BackgroundPreset> = {
  // Fundos sólidos (4 opções)
  'fundo-branco': {
    type: 'solid',
    name: 'Fundo Branco',
    description: 'Branco puro para dashboards claros',
    backgroundColor: '#ffffff',
    backgroundGradient: { enabled: false }
  },
  'fundo-cinza-claro': {
    type: 'solid',
    name: 'Fundo Cinza Claro',
    description: 'Cinza muito claro para contraste suave',
    backgroundColor: '#f8fafc',
    backgroundGradient: { enabled: false }
  },
  'fundo-cinza-escuro': {
    type: 'solid',
    name: 'Fundo Cinza Escuro',
    description: 'Cinza escuro para dashboards escuros',
    backgroundColor: '#1f2937',
    backgroundGradient: { enabled: false }
  },
  'fundo-preto': {
    type: 'solid',
    name: 'Fundo Preto',
    description: 'Preto puro para alto contraste',
    backgroundColor: '#000000',
    backgroundGradient: { enabled: false }
  }
};

export type BackgroundPresetKey = keyof typeof BACKGROUND_PRESETS;

export interface BackgroundStyle {
  backgroundColor?: string;
  backgroundGradient?: {
    enabled: boolean;
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
  backdropFilter?: {
    enabled: boolean;
    blur: number;
  };
}

export interface BackgroundPreview {
  key: BackgroundPresetKey;
  name: string;
  description: string;
  type: 'solid' | 'gradient' | 'glass';
  previewStyle: React.CSSProperties;
}

export class BackgroundManager {
  /**
   * Gets all available background presets
   */
  static getAvailableBackgrounds(): BackgroundPreview[] {
    return Object.entries(BACKGROUND_PRESETS).map(([key, preset]) => ({
      key: key as BackgroundPresetKey,
      name: preset.name,
      description: preset.description,
      type: preset.type as 'solid' | 'gradient' | 'glass',
      previewStyle: this.getPreviewStyle(key as BackgroundPresetKey)
    }));
  }

  /**
   * Gets background style for a specific preset
   */
  static getBackgroundStyle(backgroundKey: BackgroundPresetKey): BackgroundStyle {
    const preset = BACKGROUND_PRESETS[backgroundKey];
    if (!preset) {
      console.warn(`Background preset "${backgroundKey}" not found`);
      return {
        backgroundColor: '#ffffff',
        backgroundGradient: {
          enabled: false,
          type: 'linear',
          direction: '0deg',
          startColor: '#ffffff',
          endColor: '#ffffff'
        }
      };
    }

    const style: BackgroundStyle = {
      backgroundColor: preset.backgroundColor
    };

    // Handle gradient backgrounds
    if (preset.type === 'gradient') {
      style.backgroundGradient = {
        enabled: true,
        type: preset.backgroundGradient.type,
        direction: preset.backgroundGradient.direction,
        startColor: preset.backgroundGradient.startColor,
        endColor: preset.backgroundGradient.endColor
      };
    } else {
      style.backgroundGradient = {
        enabled: false,
        type: 'linear',
        direction: '0deg',
        startColor: preset.backgroundColor,
        endColor: preset.backgroundColor
      };
    }

    // Add backdrop filter for glass effects
    if (preset.type === 'glass') {
      style.backdropFilter = preset.backdropFilter;
    }

    return style;
  }

  /**
   * Gets preview style for dropdown display
   */
  static getPreviewStyle(backgroundKey: BackgroundPresetKey): React.CSSProperties {
    const preset = BACKGROUND_PRESETS[backgroundKey];
    if (!preset) return {};

    const baseStyle: React.CSSProperties = {
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      border: '1px solid rgba(0,0,0,0.1)'
    };

    if (preset.type === 'gradient') {
      return {
        ...baseStyle,
        background: `linear-gradient(${preset.backgroundGradient.direction}, ${preset.backgroundGradient.startColor}, ${preset.backgroundGradient.endColor})`
      };
    }

    return {
      ...baseStyle,
      backgroundColor: preset.backgroundColor
    };
  }

  /**
   * Validates if a background preset exists
   */
  static isValidBackground(backgroundKey: string): backgroundKey is BackgroundPresetKey {
    return backgroundKey in BACKGROUND_PRESETS;
  }

  /**
   * Gets default background
   */
  static getDefaultBackground(): BackgroundPresetKey {
    return 'fundo-branco';
  }
}

// Export presets for external use if needed
export { BACKGROUND_PRESETS };
