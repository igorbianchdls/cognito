"use client";

export const CARD_STYLE_PRESET_VALUES = ["default", "solid", "glass-dark", "glass-light"] as const;

export type CardStylePreset = typeof CARD_STYLE_PRESET_VALUES[number];

export const CARD_STYLE_PRESET_OPTIONS: Array<{ value: CardStylePreset; label: string }> = [
  { value: "default", label: "Padrão" },
  { value: "solid", label: "Solid" },
  { value: "glass-dark", label: "Glass Dark" },
  { value: "glass-light", label: "Glass Light" },
];

export function normalizeCardStylePreset(input: unknown): CardStylePreset {
  const key = String(input || "default").trim().toLowerCase();
  return (CARD_STYLE_PRESET_VALUES as readonly string[]).includes(key)
    ? (key as CardStylePreset)
    : "default";
}
