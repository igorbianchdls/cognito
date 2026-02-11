"use client";

import React from "react";

type AnyRecord = Record<string, any>;
type Rgb = { r: number; g: number; b: number };
type BorderWidths = { top: number; right: number; bottom: number; left: number };

export type HudFrameConfig = {
  variant?: "hud";
  baseColor?: string;
  cornerColor?: string;
  cornerSize?: number | string;
  cornerWidth?: number | string;
};

type Props = {
  style?: React.CSSProperties;
  frame?: HudFrameConfig | null;
  cssVars?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
};

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const clean = value.trim().replace("px", "");
    const n = Number(clean);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getStyleBorderColor(style?: React.CSSProperties): string | undefined {
  const c = style?.borderColor;
  if (!c) return undefined;
  return String(c);
}

function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();
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

function deriveCornerColor(baseColor: string): string {
  const parsed = parseColor(baseColor);
  if (!parsed) {
    // Keep corner color theme-aware when base color is a CSS variable.
    return `color-mix(in srgb, ${baseColor} 70%, var(--fg, #111827) 30%)`;
  }
  const isDark = luminance(parsed) < 0.45;
  const target: Rgb = isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const amount = isDark ? 0.34 : 0.3;
  return rgbToCss(mixRgb(parsed, target, amount));
}

function resolveFrame(frame: HudFrameConfig | null | undefined, cssVars?: Record<string, string>, style?: React.CSSProperties) {
  const fromCss = (key: string) => (cssVars && cssVars[key] ? String(cssVars[key]) : undefined);
  const variant = frame?.variant || (fromCss("containerFrameVariant") as "hud" | undefined);
  if (variant !== "hud") return null;

  const styleBorderWidth = toNumber((style as AnyRecord)?.borderWidth, 1);
  const baseColor = frame?.baseColor || fromCss("containerFrameBaseColor") || getStyleBorderColor(style) || "#4b5563";
  const cornerColor = frame?.cornerColor || fromCss("containerFrameCornerColor") || deriveCornerColor(baseColor);
  const cornerSize = clamp(
    toNumber(frame?.cornerSize ?? fromCss("containerFrameCornerSize"), 14),
    4,
    64
  );
  const cornerWidth = clamp(
    toNumber(frame?.cornerWidth ?? fromCss("containerFrameCornerWidth"), styleBorderWidth),
    1,
    4
  );

  return { variant, baseColor, cornerColor, cornerSize, cornerWidth };
}

function resolveBorderWidths(style: React.CSSProperties | undefined, fallback: number): BorderWidths {
  const s = (style || {}) as AnyRecord;
  const all = Math.max(0, toNumber(s.borderWidth, fallback));
  return {
    top: Math.max(0, toNumber(s.borderTopWidth, all)),
    right: Math.max(0, toNumber(s.borderRightWidth, all)),
    bottom: Math.max(0, toNumber(s.borderBottomWidth, all)),
    left: Math.max(0, toNumber(s.borderLeftWidth, all)),
  };
}

function lineStyle(color: string, width: number): React.CSSProperties {
  return {
    position: "absolute",
    backgroundColor: color,
    borderRadius: width,
  };
}

export default function FrameSurface({ style, frame, cssVars, className, children }: Props) {
  const resolved = resolveFrame(frame, cssVars, style);
  if (!resolved) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const s = resolved;
  const merged: React.CSSProperties = {
    ...(style || {}),
    position: "relative",
    borderStyle: style?.borderStyle && style.borderStyle !== "none" ? style.borderStyle : "solid",
    borderWidth: style?.borderWidth ?? s.cornerWidth,
    borderColor: style?.borderColor || s.baseColor,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
  };
  const corner = s.cornerSize;
  const stroke = s.cornerWidth;
  const bw = resolveBorderWidths(merged, stroke);
  const topEdge = -bw.top;
  const rightEdge = -bw.right;
  const bottomEdge = -bw.bottom;
  const leftEdge = -bw.left;

  return (
    <div className={className} style={merged}>
      {children}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 0,
        }}
      >
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: leftEdge, top: topEdge, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: leftEdge, top: topEdge, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: rightEdge, top: topEdge, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: rightEdge, top: topEdge, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: leftEdge, bottom: bottomEdge, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: leftEdge, bottom: bottomEdge, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: rightEdge, bottom: bottomEdge, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: rightEdge, bottom: bottomEdge, width: stroke, height: corner }} />
      </div>
    </div>
  );
}

