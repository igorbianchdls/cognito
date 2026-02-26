"use client";

export const DASHBOARD_BACKGROUND_PRESET_VALUES = [
  "none",
  "dot-grid",
  "dot-grid-light",
  "dot-grid-dense",
  "dot-grid-fade",
  "orbital",
  "blueprint",
  "aurora",
  "matrix-glass",
  "matrix-glass-mono",
  "matrix-glass-light",
] as const;

export type DashboardBackgroundPreset = typeof DASHBOARD_BACKGROUND_PRESET_VALUES[number];

export function normalizeDashboardBackgroundPreset(input: unknown): DashboardBackgroundPreset {
  const key = String(input || "none").trim().toLowerCase();
  return (DASHBOARD_BACKGROUND_PRESET_VALUES as readonly string[]).includes(key)
    ? (key as DashboardBackgroundPreset)
    : "none";
}
