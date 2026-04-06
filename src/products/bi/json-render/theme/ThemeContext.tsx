"use client";

import React, { createContext, useContext, useMemo } from "react";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { builtInThemes, type ThemeOverrides } from "./builtInThemes";

type ThemeContextValue = ThemeOverrides;

const ThemeContext = createContext<ThemeContextValue>({ components: {}, cssVars: {} });

export function useThemeOverrides(): ThemeOverrides {
  return useContext(ThemeContext);
}

function resolveShadowToken(value: unknown): string | undefined {
  const token = String(value || "").trim().toLowerCase();
  if (!token || token === "none") return undefined;
  if (token === "sm") return "0 1px 2px rgba(15, 23, 42, 0.08)";
  if (token === "md") return "0 4px 10px rgba(15, 23, 42, 0.10)";
  if (token === "lg") return "0 10px 24px rgba(15, 23, 42, 0.12)";
  if (token === "xl") return "0 18px 36px rgba(15, 23, 42, 0.14)";
  if (token === "2xl") return "0 26px 52px rgba(15, 23, 42, 0.16)";
  return value == null ? undefined : String(value);
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function extractStyleLike(component: unknown): React.CSSProperties {
  const source = asRecord(component);
  const out: React.CSSProperties = {};
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    if (
      key === "backgroundColor" ||
      key === "color" ||
      key === "borderColor" ||
      key === "borderStyle" ||
      key === "borderWidth" ||
      key === "borderRadius" ||
      key === "padding" ||
      key === "fontFamily" ||
      key === "fontWeight" ||
      key === "fontSize" ||
      key === "letterSpacing" ||
      key === "lineHeight" ||
      key === "textTransform" ||
      key === "boxShadow"
    ) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function getSemanticUiStyle(
  theme: ThemeOverrides | null | undefined,
  uiRoleRaw?: unknown,
  tagRaw?: unknown,
  state?: { active?: boolean },
): React.CSSProperties {
  const themeValue = theme || { components: {}, cssVars: {} };
  const components = themeValue.components || {};
  const cssVars = themeValue.cssVars || {};
  const role = String(uiRoleRaw || "").trim().toLowerCase();
  const tag = String(tagRaw || "").trim().toLowerCase();
  const isActive = Boolean(state?.active);
  const titleComponent = extractStyleLike((components as Record<string, unknown>).Title);
  const subtitleComponent = extractStyleLike(asRecord((components as Record<string, unknown>).Subtitle).titleStyle);
  const cardComponent = extractStyleLike((components as Record<string, unknown>).Card);

  const isTitleRole =
    role === "title" ||
    role === "card-title" ||
    role === "page-title" ||
    role === "chart-title" ||
    role === "section-title" ||
    role === "table-title" ||
    (!role && (tag === "h1" || tag === "h2" || tag === "h3"));
  const isEyebrowRole = role === "eyebrow" || role === "subtitle" || role === "card-subtitle";
  const isCardRole = role === "card" || role === "chart-card" || role === "table-card" || role === "pivot-card";
  const isBodyRole = role === "body" || role === "card-body" || role === "chart-body" || role === "table-body";
  const isMutedRole = role === "muted" || role === "description" || role === "card-description";

  if (isCardRole) {
    return {
      backgroundColor: cardComponent.backgroundColor || "var(--surfaceBg, transparent)",
      borderColor: cardComponent.borderColor || "var(--containerBorderColor, var(--surfaceBorder, transparent))",
      borderStyle: String(cardComponent.borderStyle || cssVars.containerBorderStyle || "solid"),
      borderWidth: cardComponent.borderWidth || cssVars.containerBorderWidth || 1,
      borderRadius: cardComponent.borderRadius || cssVars.containerRadius || 12,
      boxShadow: cardComponent.boxShadow || resolveShadowToken(cssVars.containerShadow),
      padding: cardComponent.padding,
    };
  }

  if (isTitleRole) {
    return {
      color: titleComponent.color || "var(--h1Color, currentColor)",
      fontFamily: titleComponent.fontFamily || "var(--h1FontFamily, inherit)",
      fontWeight: titleComponent.fontWeight || "var(--h1FontWeight, inherit)",
      fontSize: titleComponent.fontSize || "var(--h1FontSize, inherit)",
      letterSpacing: titleComponent.letterSpacing || "var(--h1LetterSpacing, inherit)",
      padding: titleComponent.padding || "var(--h1Padding, 0px)",
    };
  }

  if (isEyebrowRole) {
    return {
      color: subtitleComponent.color || "var(--headerSubtitle, currentColor)",
      fontFamily: subtitleComponent.fontFamily,
      fontWeight: subtitleComponent.fontWeight,
      fontSize: subtitleComponent.fontSize,
      letterSpacing: subtitleComponent.letterSpacing,
      padding: subtitleComponent.padding,
    };
  }

  if (isBodyRole) {
    return {
      fontFamily: "var(--fontFamily, inherit)",
      color: "var(--fg, currentColor)",
      lineHeight: 1.6,
    };
  }

  if (isMutedRole) {
    return {
      fontFamily: "var(--fontFamily, inherit)",
      color: "var(--textSecondary, var(--headerSubtitle, currentColor))",
      lineHeight: 1.6,
    };
  }

  if (role === "kpi-title" || role === "kpi-label") {
    return {
      color: "var(--kpiTitleColor, currentColor)",
      fontFamily: "var(--kpiTitleFontFamily, inherit)",
      fontWeight: "var(--kpiTitleFontWeight, inherit)",
      fontSize: "var(--kpiTitleFontSize, inherit)",
      letterSpacing: "var(--kpiTitleLetterSpacing, inherit)",
      padding: "var(--kpiTitlePadding, 0px)",
    };
  }

  if (role === "kpi-value") {
    return {
      color: "var(--kpiValueColor, currentColor)",
      fontFamily: "var(--kpiValueFontFamily, inherit)",
      fontWeight: "var(--kpiValueFontWeight, inherit)",
      fontSize: "var(--kpiValueFontSize, inherit)",
      letterSpacing: "var(--kpiValueLetterSpacing, inherit)",
      padding: "var(--kpiValuePadding, 0px)",
      lineHeight: 1,
    };
  }

  if (role === "kpi-delta" || role === "kpi-compare") {
    return {
      fontFamily: "var(--fontFamily, inherit)",
      color: "var(--textSecondary, var(--headerSubtitle, currentColor))",
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.4,
    };
  }

  if (role === "tabs") {
    return {
      boxSizing: "border-box",
    };
  }

  if (role === "tab") {
    return {
      borderRadius: 999,
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: isActive ? "var(--fg, #0f172a)" : "var(--surfaceBorder, var(--containerBorderColor, #cbd5e1))",
      backgroundColor: isActive ? "var(--fg, #0f172a)" : "var(--surfaceBg, rgba(255,255,255,0.7))",
      color: isActive ? "var(--bg, #ffffff)" : "var(--fg, #0f172a)",
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "0.01em",
    };
  }

  return {};
}

export function useSemanticUiStyle(
  uiRole?: unknown,
  tag?: unknown,
  state?: { active?: boolean },
): React.CSSProperties {
  const theme = useThemeOverrides();
  return useMemo(() => getSemanticUiStyle(theme, uiRole, tag, state), [theme, uiRole, tag, state?.active]);
}

const BUILTIN_ALIASES: Record<string, string> = {
  // Map token themes in PT to built-in UI presets
  'branco': 'light',
  'cinza-claro': 'blue',
  'preto': 'black',
  'cinza-escuro': 'dark',
  // New common elegant themes
  'slate': 'dark',
  'navy': 'dark',
  'sand': 'light',
  'charcoal': 'black',
  // Elegant themes should still inherit a base Header component
  // so header text uses CSS vars instead of hardcoded defaults.
  'midnight': 'dark',
  'metro': 'black',
  'aero': 'dark',
};

export function ThemeProvider({ name, components, cssVars, children }: { name?: string; components?: ThemeOverrides['components']; cssVars?: Record<string,string>; children: React.ReactNode }) {
  const value = useMemo<ThemeOverrides>(() => {
    const mapped = name && BUILTIN_ALIASES[String(name).toLowerCase()];
    const chosenName = mapped || name;
    const base = chosenName && builtInThemes[chosenName] ? builtInThemes[chosenName] : { components: {}, cssVars: {} };
    const merged = {
      components: deepMerge(base.components || {}, components || {}),
      cssVars: { ...(base.cssVars || {}), ...(cssVars || {}) }
    } as ThemeOverrides;
    return merged;
  }, [name, components, cssVars]);

  const parent = useThemeOverrides();
  const combined = useMemo<ThemeOverrides>(() => {
    return {
      components: deepMerge(parent.components || {}, value.components || {}),
      cssVars: { ...(parent.cssVars || {}), ...(value.cssVars || {}) },
    };
  }, [parent, value]);

  const styleVars: React.CSSProperties = {};
  for (const k of Object.keys(combined.cssVars || {})) {
    (styleVars as any)[`--${k}`] = (combined.cssVars as any)[k];
  }
  const css = combined.cssVars || {};
  const fxPreset = typeof (css as any).dashboardBackgroundPreset === 'string'
    ? String((css as any).dashboardBackgroundPreset).trim().toLowerCase()
    : '';
  const hasFxBackground = Boolean(fxPreset && fxPreset !== 'none');
  if (css.hasOwnProperty('fontFamily')) (styleVars as any).fontFamily = 'var(--fontFamily)';
  if (css.hasOwnProperty('bg') && !hasFxBackground) (styleVars as any).backgroundColor = 'var(--bg)';
  if (css.hasOwnProperty('fg')) (styleVars as any).color = 'var(--fg)';

  return (
    <ThemeContext.Provider value={combined}>
      <div style={styleVars}>{children}</div>
    </ThemeContext.Provider>
  );
}
