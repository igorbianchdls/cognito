"use client";

import { ThemeManager, type ThemeName } from "@/components/visual-builder/ThemeManager";
import type { DesignTokens } from "@/components/visual-builder/DesignTokens";
import type { Managers } from "@/components/json-render/theme/thememanagers";
import { mapManagersToCssVars } from "@/components/json-render/theme/thememanagers";

type AnyRecord = Record<string, any>;

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

function buildManagersFromTokens(tokens: DesignTokens, name: ThemeName): Managers {
  const fontPrimary = tokens.typography?.fontFamily?.primary || 'Inter, ui-sans-serif, system-ui';
  const borderColor = (tokens.colors as AnyRecord)?.border || '#e5e7eb';
  const borderWidth = tokens.borders?.width?.thin ?? 1;
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
      size: tokens.typography?.fontSize?.sm ?? 14,
      font: fontPrimary,
      letterSpacing: '-0.02em',
      padding: 6,
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

export function buildThemeVars(name?: string, managersOverride?: Managers) {
  const resolved = resolveThemeName(name);
  const tokens = ThemeManager.getThemeTokens(resolved);
  const autoManagers = buildManagersFromTokens(tokens, resolved);
  const managers: Managers = managersOverride ? deepMerge(autoManagers, managersOverride as AnyRecord) : autoManagers;

  // Map managers to css vars
  const cssVars = mapManagersToCssVars(managers);

  // Extra vars not covered by Managers schema
  const extraCss: Record<string, string> = {};
  const colors = (tokens.colors || {}) as AnyRecord;
  if (colors?.text?.primary) extraCss.fg = String(colors.text.primary);
  if (colors?.border) extraCss.surfaceBorder = String(colors.border);

  // If theme is "blue", push a stronger blue palette unless overridden
  if (String(name || '').toLowerCase() === 'blue' && !cssVars.chartColorScheme) {
    extraCss.chartColorScheme = JSON.stringify(["#2563eb", "#60a5fa", "#0ea5e9", "#06b6d4", "#34d399"]);
  }

  return {
    themeName: resolved,
    managers,
    cssVars: { ...extraCss, ...cssVars },
  };
}

