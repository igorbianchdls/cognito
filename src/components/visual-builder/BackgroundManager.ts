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
  // Solid Colors
  white: {
    type: 'solid',
    name: 'White',
    description: 'Clean white background',
    backgroundColor: '#ffffff',
    backgroundGradient: { enabled: false }
  },
  light: {
    type: 'solid',
    name: 'Light',
    description: 'Light gray background for modern themes',
    backgroundColor: '#f8fafc',
    backgroundGradient: { enabled: false }
  },
  black: {
    type: 'solid',
    name: 'Black',
    description: 'Pure black background',
    backgroundColor: '#000000',
    backgroundGradient: { enabled: false }
  },
  lightGray: {
    type: 'solid',
    name: 'Light Gray',
    description: 'Subtle gray background',
    backgroundColor: '#f8f9fa',
    backgroundGradient: { enabled: false }
  },
  darkGray: {
    type: 'solid',
    name: 'Dark Gray',
    description: 'Dark charcoal background',
    backgroundColor: '#1f2937',
    backgroundGradient: { enabled: false }
  },
  navy: {
    type: 'solid',
    name: 'Navy',
    description: 'Deep navy blue background like dashboard',
    backgroundColor: '#1a202c',
    backgroundGradient: { enabled: false }
  },
  corporate: {
    type: 'solid',
    name: 'Corporate',
    description: 'Corporate dark purple background',
    backgroundColor: '#151138',
    backgroundGradient: { enabled: false }
  },

  // Gradients
  blueGradient: {
    type: 'gradient',
    name: 'Blue Gradient',
    description: 'Blue to purple gradient',
    backgroundColor: '#667eea',
    backgroundGradient: {
      enabled: true,
      type: 'linear',
      direction: '135deg',
      startColor: '#667eea',
      endColor: '#764ba2'
    }
  },
  greenGradient: {
    type: 'gradient',
    name: 'Green Gradient',
    description: 'Teal to blue gradient',
    backgroundColor: '#11998e',
    backgroundGradient: {
      enabled: true,
      type: 'linear',
      direction: '135deg',
      startColor: '#11998e',
      endColor: '#38ef7d'
    }
  },
  sunsetGradient: {
    type: 'gradient',
    name: 'Sunset Gradient',
    description: 'Orange to pink gradient',
    backgroundColor: '#ff9a9e',
    backgroundGradient: {
      enabled: true,
      type: 'linear',
      direction: '135deg',
      startColor: '#ff9a9e',
      endColor: '#fecfef'
    }
  },
  darkGradient: {
    type: 'gradient',
    name: 'Dark Gradient',
    description: 'Deep dark background',
    backgroundColor: '#0A0A0A',
    backgroundGradient: {
      enabled: true,
      type: 'linear',
      direction: '135deg',
      startColor: '#0A0A0A',
      endColor: '#0A0A0A'
    }
  },

  // Glass Effects
  glassLight: {
    type: 'glass',
    name: 'Glass Light',
    description: 'Light glass with blur',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backgroundGradient: { enabled: false },
    backdropFilter: {
      enabled: true,
      blur: 10
    }
  },
  glassDark: {
    type: 'glass',
    name: 'Glass Dark',
    description: 'Dark glass with blur',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backgroundGradient: { enabled: false },
    backdropFilter: {
      enabled: true,
      blur: 15
    }
  },
  hightech: {
    type: 'gradient',
    name: 'High Tech',
    description: 'Futuristic dark gradient with cyan accents',
    backgroundColor: '#000000',
    backgroundGradient: {
      enabled: true,
      type: 'linear',
      direction: '135deg',
      startColor: '#000000',
      endColor: '#001a2e'
    }
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
    return 'white';
  }
}

// Export presets for external use if needed
export { BACKGROUND_PRESETS };