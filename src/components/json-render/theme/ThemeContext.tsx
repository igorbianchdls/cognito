"use client";

import React, { createContext, useContext, useMemo } from "react";
import { deepMerge } from "@/stores/ui/json-render/utils";
import { builtInThemes, type ThemeOverrides } from "./builtInThemes";

type ThemeContextValue = ThemeOverrides;

const ThemeContext = createContext<ThemeContextValue>({ components: {}, cssVars: {} });

export function useThemeOverrides(): ThemeOverrides {
  return useContext(ThemeContext);
}

const BUILTIN_ALIASES: Record<string, string> = {
  // Map token themes in PT to built-in UI presets
  'branco': 'light',
  'cinza-claro': 'blue',
  'preto': 'black',
  'cinza-escuro': 'dark',
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
  if (css.hasOwnProperty('fontFamily')) (styleVars as any).fontFamily = 'var(--fontFamily)';
  if (css.hasOwnProperty('bg')) (styleVars as any).backgroundColor = 'var(--bg)';
  if (css.hasOwnProperty('fg')) (styleVars as any).color = 'var(--fg)';

  return (
    <ThemeContext.Provider value={combined}>
      <div style={styleVars}>{children}</div>
    </ThemeContext.Provider>
  );
}
