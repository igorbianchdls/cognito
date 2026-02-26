"use client";

import type { DashboardBackgroundPreset } from "@/products/bi/json-render/backgrounds/types";

export const DASHBOARD_BACKGROUND_PRESET_OPTIONS: Array<{ value: DashboardBackgroundPreset; label: string }> = [
  { value: "none", label: "Nenhum" },
  { value: "dot-grid", label: "Dot Grid" },
  { value: "dot-grid-light", label: "Dot Grid Light" },
  { value: "dot-grid-dense", label: "Dot Grid Dense" },
  { value: "dot-grid-fade", label: "Dot Grid Fade" },
  { value: "orbital", label: "Orbital Grid" },
  { value: "blueprint", label: "Blueprint Scan" },
  { value: "aurora", label: "Aurora Executive" },
  { value: "matrix-glass", label: "Matrix Glass (Color)" },
  { value: "matrix-glass-mono", label: "Matrix Glass Mono" },
  { value: "matrix-glass-light", label: "Matrix Glass Light" },
];
