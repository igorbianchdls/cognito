"use client";

import { ThemeManager, type ThemeName } from "@/components/visual-builder/ThemeManager";
import type { DesignTokens } from "@/components/visual-builder/DesignTokens";
import type { Managers } from "@/components/json-render/theme/thememanagers";
import { mapManagersToCssVars } from "@/components/json-render/theme/thememanagers";

type AnyRecord = Record<string, any>;
type Rgb = { r: number; g: number; b: number };
export type HeaderThemePreset =
  | "auto"
  | "white"
  | "gray"
  | "purple"
  | "dark"
  | "blue"
  | "teal"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

// Map JSON Render theme names/aliases to DesignTokens theme keys
const THEME_ALIASES: Record<string, ThemeName> = {
  // Light variations
  light: "branco",
  white: "branco",
  claro: "branco",
  // Blue maps to light background with bluish UI accents
  blue: "cinza-claro",
  azure: "cinza-claro",
  "light-blue": "cinza-claro",
  "cinza-claro": "cinza-claro",
  // Dark variations
  dark: "cinza-escuro",
  slate: "cinza-escuro",
  "cinza-escuro": "cinza-escuro",
  // Black variations
  black: "preto",
  preto: "preto",
  // New neutrals
  navy: "cinza-escuro",
  sand: "cinza-claro",
  charcoal: "preto",
  // New elegant themes
  midnight: "cinza-escuro",
  metro: "preto",
  aero: "cinza-escuro",
};

function resolveThemeName(name?: string): ThemeName {
  const key = String(name || "").toLowerCase();
  const mapped = (THEME_ALIASES as AnyRecord)[key] as ThemeName | undefined;
  if (mapped && ThemeManager.isValidTheme(mapped)) return mapped;
  // If user already passed a valid ThemeName from DesignTokens, keep it
  if (name && ThemeManager.isValidTheme(name as any)) return name as ThemeName;
  return "branco"; // default
}

function buildChartScheme(tokens: DesignTokens): string[] {
  const c = (tokens.colors || {}) as AnyRecord;
  const scheme = Array.isArray(c.pieSliceColors) ? (c.pieSliceColors as string[]) : undefined;
  if (scheme && scheme.length) return scheme;
  const chart = (c.chart || {}) as AnyRecord;
  const out: string[] = [];
  if (chart.primary) out.push(String(chart.primary));
  if (chart.secondary) out.push(String(chart.secondary));
  if (chart.tertiary) out.push(String(chart.tertiary));
  if (chart.quaternary) out.push(String(chart.quaternary));
  // Fallback palette if still short
  if (out.length < 5) out.push("#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#ef4444");
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseColor(input: string | undefined): Rgb | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    if (raw.length === 3) {
      return {
        r: parseInt(raw[0] + raw[0], 16),
        g: parseInt(raw[1] + raw[1], 16),
        b: parseInt(raw[2] + raw[2], 16),
      };
    }
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  const rgb = s.match(
    /^rgba?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d+(?:\.\d+)?))?\s*\)$/i
  );
  if (!rgb) return null;
  return {
    r: clamp(Math.round(Number(rgb[1])), 0, 255),
    g: clamp(Math.round(Number(rgb[2])), 0, 255),
    b: clamp(Math.round(Number(rgb[3])), 0, 255),
  };
}

function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(c: Rgb): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
  };
}

function rgbToCss(c: Rgb): string {
  return `rgb(${c.r} ${c.g} ${c.b})`;
}

function normalizeHeaderTheme(input?: string): HeaderThemePreset {
  const key = String(input || "auto").trim().toLowerCase();
  if (!key || key === "auto" || key === "default") return "auto";
  if (["white", "branco", "light"].includes(key)) return "white";
  if (["gray", "grey", "cinza", "light-gray", "light-grey"].includes(key)) return "gray";
  if (["purple", "roxo", "violet", "indigo"].includes(key)) return "purple";
  if (["dark", "preto", "black", "grafite", "charcoal"].includes(key)) return "dark";
  if (["blue", "azul", "royal"].includes(key)) return "blue";
  if (["teal", "turquesa", "ciano"].includes(key)) return "teal";
  if (["emerald", "esmeralda", "green", "verde"].includes(key)) return "emerald";
  if (["amber", "amarelo", "gold", "laranja"].includes(key)) return "amber";
  if (["rose", "pink", "rosa", "magenta"].includes(key)) return "rose";
  if (["slate", "chumbo", "ardosia", "steel"].includes(key)) return "slate";
  // Legacy aliases
  if (["subtle", "soft", "muted", "minimal", "surface", "card", "solid"].includes(key)) return "gray";
  if (["contrast", "strong", "high-contrast"].includes(key)) return "dark";
  return "auto";
}

const FIXED_HEADER_THEMES: Record<Exclude<HeaderThemePreset, "auto">, {
  bg: string;
  text: string;
  subtitle: string;
  border: string;
  dpBg: string;
  dpColor: string;
  dpBorder: string;
  dpIcon: string;
  dpLabel: string;
}> = {
  white: {
    bg: "#ffffff",
    text: "#0f172a",
    subtitle: "#475569",
    border: "#e2e8f0",
    dpBg: "#ffffff",
    dpColor: "#0f172a",
    dpBorder: "#cbd5e1",
    dpIcon: "#334155",
    dpLabel: "#475569",
  },
  gray: {
    bg: "#f3f4f6",
    text: "#111827",
    subtitle: "#4b5563",
    border: "#d1d5db",
    dpBg: "#ffffff",
    dpColor: "#111827",
    dpBorder: "#cbd5e1",
    dpIcon: "#374151",
    dpLabel: "#4b5563",
  },
  purple: {
    bg: "#5b21b6",
    text: "#f5f3ff",
    subtitle: "#ddd6fe",
    border: "#7c3aed",
    dpBg: "#6d28d9",
    dpColor: "#f5f3ff",
    dpBorder: "#a78bfa",
    dpIcon: "#ddd6fe",
    dpLabel: "#ddd6fe",
  },
  dark: {
    bg: "#111827",
    text: "#f9fafb",
    subtitle: "#9ca3af",
    border: "#374151",
    dpBg: "#1f2937",
    dpColor: "#f9fafb",
    dpBorder: "#4b5563",
    dpIcon: "#cbd5e1",
    dpLabel: "#9ca3af",
  },
  blue: {
    bg: "#1d4ed8",
    text: "#eff6ff",
    subtitle: "#bfdbfe",
    border: "#3b82f6",
    dpBg: "#1e40af",
    dpColor: "#eff6ff",
    dpBorder: "#60a5fa",
    dpIcon: "#bfdbfe",
    dpLabel: "#bfdbfe",
  },
  teal: {
    bg: "#0f766e",
    text: "#f0fdfa",
    subtitle: "#99f6e4",
    border: "#14b8a6",
    dpBg: "#115e59",
    dpColor: "#f0fdfa",
    dpBorder: "#2dd4bf",
    dpIcon: "#99f6e4",
    dpLabel: "#99f6e4",
  },
  emerald: {
    bg: "#065f46",
    text: "#ecfdf5",
    subtitle: "#a7f3d0",
    border: "#10b981",
    dpBg: "#047857",
    dpColor: "#ecfdf5",
    dpBorder: "#34d399",
    dpIcon: "#a7f3d0",
    dpLabel: "#a7f3d0",
  },
  amber: {
    bg: "#b45309",
    text: "#fffbeb",
    subtitle: "#fde68a",
    border: "#d97706",
    dpBg: "#92400e",
    dpColor: "#fffbeb",
    dpBorder: "#f59e0b",
    dpIcon: "#fde68a",
    dpLabel: "#fde68a",
  },
  rose: {
    bg: "#9f1239",
    text: "#fff1f2",
    subtitle: "#fecdd3",
    border: "#e11d48",
    dpBg: "#881337",
    dpColor: "#fff1f2",
    dpBorder: "#fb7185",
    dpIcon: "#fecdd3",
    dpLabel: "#fecdd3",
  },
  slate: {
    bg: "#334155",
    text: "#f8fafc",
    subtitle: "#cbd5e1",
    border: "#475569",
    dpBg: "#1e293b",
    dpColor: "#f8fafc",
    dpBorder: "#64748b",
    dpIcon: "#cbd5e1",
    dpLabel: "#cbd5e1",
  },
};

function deriveHeaderVars(args: {
  headerTheme?: string;
  bgColor?: string;
  fgColor?: string;
  surfaceColor?: string;
  borderColor?: string;
}): Record<string, string> {
  const { headerTheme, bgColor, fgColor, surfaceColor, borderColor } = args;
  const out: Record<string, string> = {};
  if (!bgColor) return out;

  const preset = normalizeHeaderTheme(headerTheme);
  if (preset !== "auto") {
    const fixed = FIXED_HEADER_THEMES[preset];
    out.headerBg = fixed.bg;
    out.headerText = fixed.text;
    out.headerSubtitle = fixed.subtitle;
    out.headerBorder = fixed.border;
    out.headerDpBg = fixed.dpBg;
    out.headerDpColor = fixed.dpColor;
    out.headerDpBorder = fixed.dpBorder;
    out.headerDpIcon = fixed.dpIcon;
    out.headerDpLabel = fixed.dpLabel;
    return out;
  }

  const bg = parseColor(bgColor);
  const fg = parseColor(fgColor);
  const surface = parseColor(surfaceColor);
  const border = parseColor(borderColor);

  if (bg) {
    const isDark = luminance(bg) < 0.45;
    const text = fg || (isDark ? { r: 229, g: 231, b: 235 } : { r: 15, g: 23, b: 42 });

    let headerBgRgb: Rgb;
    if (surface) {
      headerBgRgb = surface;
    } else {
      headerBgRgb = mixRgb(bg, text, isDark ? 0.12 : 0.09);
    }

    const headerBorderRgb = border
      ? border
      : mixRgb(bg, text, isDark ? 0.24 : 0.18);

    const subtitleMix = isDark ? 0.36 : 0.42;
    const subtitleRgb = mixRgb(text, headerBgRgb, subtitleMix);

    out.headerBg = rgbToCss(headerBgRgb);
    out.headerBorder = rgbToCss(headerBorderRgb);
    out.headerText = rgbToCss(text);
    out.headerSubtitle = rgbToCss(subtitleRgb);
    const dpBgRgb = mixRgb(headerBgRgb, text, isDark ? 0.1 : 0.03);
    const dpBorderRgb = mixRgb(headerBgRgb, text, isDark ? 0.3 : 0.22);
    out.headerDpBg = rgbToCss(dpBgRgb);
    out.headerDpColor = rgbToCss(text);
    out.headerDpBorder = rgbToCss(dpBorderRgb);
    out.headerDpIcon = rgbToCss(mixRgb(text, subtitleRgb, 0.4));
    out.headerDpLabel = rgbToCss(subtitleRgb);
    return out;
  }

  const fgExpr = fgColor || "#111827";
  out.headerBg = surfaceColor
    ? String(surfaceColor)
    : `color-mix(in srgb, ${bgColor} 90%, ${fgExpr} 10%)`;
  if (borderColor) out.headerBorder = String(borderColor);
  return out;
}

function buildManagersFromTokens(tokens: DesignTokens, name: ThemeName): Managers {
  const fontPrimary = tokens.typography?.fontFamily?.primary || 'Inter, ui-sans-serif, system-ui';
  const borderColor = (tokens.colors as AnyRecord)?.border || '#e5e7eb';
  // Force 2px borders across all containers (including KPI)
  const borderWidth = 2;
  const borderRadius = tokens.borders?.radius?.md ?? 8;
  const textPrimary = tokens.colors?.text?.primary || '#111827';
  const textSecondary = tokens.colors?.text?.secondary || '#475569';
  const surface = (tokens.colors as AnyRecord)?.surface || '#ffffff';
  const background = (tokens.colors as AnyRecord)?.background || surface;
  const chartScheme = buildChartScheme(tokens);

  return {
    font: fontPrimary,
    border: {
      style: 'solid',
      width: borderWidth,
      color: borderColor,
      radius: borderRadius,
      shadow: (name === 'preto' || name === 'cinza-escuro') ? 'sm' : 'md',
    },
    color: { scheme: chartScheme },
    background,
    surface,
    h1: {
      color: textPrimary,
      weight: tokens.typography?.fontWeight?.semibold ?? 600,
      // Slightly larger and more padded by default across all themes
      size: tokens.typography?.fontSize?.md ?? 16,
      font: fontPrimary,
      letterSpacing: '-0.02em',
      padding: 10,
    },
    kpi: {
      title: {
        font: fontPrimary,
        weight: tokens.typography?.fontWeight?.semibold ?? 600,
        color: textSecondary,
        letterSpacing: '-0.01em',
        padding: 0,
      },
      value: {
        font: fontPrimary,
        weight: tokens.typography?.fontWeight?.bold ?? 700,
        color: textPrimary,
        letterSpacing: '-0.02em',
        padding: 0,
      }
    },
    slicer: {
      label: {
        font: fontPrimary,
        weight: tokens.typography?.fontWeight?.medium ?? 500,
        size: tokens.typography?.fontSize?.sm ?? 14,
        color: textSecondary,
        letterSpacing: '-0.01em',
        padding: 2,
      },
      option: {
        font: fontPrimary,
        weight: tokens.typography?.fontWeight?.medium ?? 500,
        size: tokens.typography?.fontSize?.sm ?? 13,
        color: textPrimary,
        letterSpacing: '-0.01em',
        padding: 0,
      }
    }
    ,
    datePicker: {
      label: {
        font: fontPrimary,
        weight: tokens.typography?.fontWeight?.medium ?? 500,
        size: tokens.typography?.fontSize?.sm ?? 14,
        color: textSecondary,
        letterSpacing: '-0.01em',
        padding: 2,
      },
      field: {
        font: fontPrimary,
        size: tokens.typography?.fontSize?.sm ?? 14,
        color: textPrimary,
        background: surface,
        borderColor: borderColor,
        borderWidth: 2,
        radius: borderRadius,
        paddingX: 10,
        paddingY: 6,
        hoverBg: surface,
        focusBorderColor: (tokens.colors as AnyRecord)?.borderFocus || borderColor,
        placeholderColor: textSecondary,
        disabledOpacity: 0.6,
      },
      icon: {
        color: textSecondary,
        background: undefined,
        size: 14,
        padding: 0,
        radius: 0,
        position: 'right',
      }
    }
  };
}

function deepMerge<T extends AnyRecord>(a: T, b: Partial<T>): T {
  const out: AnyRecord = Array.isArray(a) ? [...(a as any)] : { ...(a as any) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      (out as AnyRecord)[k] = deepMerge((out as AnyRecord)[k] || {}, v as AnyRecord);
    } else {
      (out as AnyRecord)[k] = v as any;
    }
  }
  return out as T;
}

export function buildThemeVars(
  name?: string,
  managersOverride?: Managers,
  options?: { headerTheme?: string }
) {
  const resolved = resolveThemeName(name);
  const tokens = ThemeManager.getThemeTokens(resolved);
  const autoManagers = buildManagersFromTokens(tokens, resolved);
  const n = String(name || '').toLowerCase();
  let managers: Managers = autoManagers;
  // Named overrides for common elegant themes
  if (n === 'slate') {
    managers = deepMerge(managers, {
      background: '#1f2937',
      surface: '#334155',
      border: { color: '#374151' },
      h1: { color: '#f8fafc' },
      kpi: { title: { color: '#e2e8f0' }, value: { color: '#f8fafc' } },
      color: { scheme: ['#60a5fa','#94a3b8','#64748b','#475569','#1f2937'] }
    } as Managers);
  } else if (n === 'navy') {
    managers = deepMerge(managers, {
      background: '#0b1220',
      surface: '#111827',
      border: { color: '#1f2937' },
      h1: { color: '#e5e7eb' },
      kpi: { title: { color: '#9ca3af' }, value: { color: '#e5e7eb' } },
      color: { scheme: ['#3b82f6','#0ea5e9','#60a5fa','#22d3ee','#94a3b8'] }
    } as Managers);
  } else if (n === 'sand') {
    managers = deepMerge(managers, {
      background: '#f8f5f0',
      surface: '#ffffff',
      border: { color: '#e5e7eb' },
      h1: { color: '#0f172a' },
      kpi: { title: { color: '#475569' }, value: { color: '#0f172a' } },
      color: { scheme: ['#2563eb','#0ea5e9','#10b981','#94a3b8','#64748b'] }
    } as Managers);
  } else if (n === 'charcoal') {
    managers = deepMerge(managers, {
      background: '#0f1115',
      surface: '#16181d',
      border: { color: '#23262b' },
      h1: { color: '#e5e7eb' },
      kpi: { title: { color: '#9ca3af' }, value: { color: '#e5e7eb' } },
      color: { scheme: ['#60a5fa','#9ca3af','#6b7280','#374151','#111827'] }
    } as Managers);
  }
  else if (n === 'midnight') {
    managers = deepMerge(managers, {
      background: '#0e1330',
      surface: '#1a1f48',
      border: { color: '#2a3060' },
      h1: { color: '#e8eafd' },
      kpi: { title: { color: '#a3a8c4' }, value: { color: '#ffffff' } },
      color: { scheme: ['#7c83ff', '#a78bfa', '#22d3ee', '#60a5fa', '#94a3b8'] }
    } as Managers);
  }
  else if (n === 'metro') {
    managers = deepMerge(managers, {
      background: '#0f1115',
      surface: '#1a1d23',
      border: { color: '#2a2f3a' },
      h1: { color: '#e5e7eb' },
      kpi: { title: { color: '#9ca3af' }, value: { color: '#e5e7eb' } },
      color: { scheme: ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#94a3b8'] }
    } as Managers);
  }
  else if (n === 'aero') {
    managers = deepMerge(managers, {
      background: '#0b1220',
      surface: '#0f1b2e',
      border: { color: '#1f2a3d' },
      h1: { color: '#e6f0ff' },
      kpi: { title: { color: '#9fb3d9' }, value: { color: '#ffffff' } },
      color: { scheme: ['#22d3ee', '#0ea5e9', '#2563eb', '#fb923c', '#f59e0b'] }
    } as Managers);
  }
  if (managersOverride) managers = deepMerge(managers, managersOverride as AnyRecord);

  // Map managers to css vars
  const cssVars = mapManagersToCssVars(managers);

  // Extra vars not covered by Managers schema
  const extraCss: Record<string, string> = {};
  const colors = (tokens.colors || {}) as AnyRecord;
  // Base from tokens
  if (colors?.text?.primary) extraCss.fg = String(colors.text.primary);
  if (colors?.border) extraCss.surfaceBorder = String(colors.border);
  // Override fg/surfaceBorder if managers defined custom ones via overrides above
  if (managers?.kpi?.value?.color) extraCss.fg = String(managers.kpi.value.color);
  if ((managers as AnyRecord)?.border?.color) extraCss.surfaceBorder = String((managers as AnyRecord).border.color);
  // Header styling can be themed independently from dashboard theme.
  const bgSeed = typeof (managers as AnyRecord)?.background === 'string'
    ? String((managers as AnyRecord).background)
    : (colors?.background ? String(colors.background) : undefined);
  const surfaceSeed = typeof (managers as AnyRecord)?.surface === 'string'
    ? String((managers as AnyRecord).surface)
    : (colors?.surface ? String(colors.surface) : undefined);
  const fgSeed = (extraCss.fg || (colors?.text?.primary ? String(colors.text.primary) : undefined));
  const borderSeed = extraCss.surfaceBorder || (colors?.border ? String(colors.border) : undefined);
  const headerVars = deriveHeaderVars({
    headerTheme: options?.headerTheme,
    bgColor: bgSeed,
    fgColor: fgSeed,
    surfaceColor: surfaceSeed,
    borderColor: borderSeed,
  });
  Object.assign(extraCss, headerVars);

  // If theme is "blue", push a stronger blue palette unless overridden
  if (['blue','navy','midnight','aero'].includes(n) && !cssVars.chartColorScheme) {
    extraCss.chartColorScheme = JSON.stringify(["#2563eb", "#60a5fa", "#0ea5e9", "#06b6d4", "#34d399"]);
  }

  return {
    themeName: resolved,
    managers,
    cssVars: { ...extraCss, ...cssVars },
  };
}
