"use client";

import React from "react";

type AnyRecord = Record<string, any>;
type Rgb = { r: number; g: number; b: number };

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

function getStyleBackgroundColor(style?: React.CSSProperties): string | undefined {
  const c = style?.backgroundColor;
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

function isDarkThemeContext(bgColor: string | undefined, baseColor: string | undefined, fgColor?: string): boolean {
  const bg = bgColor ? parseColor(bgColor) : null;
  if (bg) return luminance(bg) < 0.45;
  const fg = fgColor ? parseColor(fgColor) : null;
  if (fg) return luminance(fg) > 0.62;
  const base = baseColor ? parseColor(baseColor) : null;
  if (base) return luminance(base) < 0.42;
  return false;
}

function deriveBaseColor(baseSeed: string, bgSeed: string | undefined, isDark: boolean): string {
  const bg = bgSeed ? parseColor(bgSeed) : null;
  if (bg) {
    const target: Rgb = isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    // Base border should stay close to background.
    return rgbToCss(mixRgb(bg, target, isDark ? 0.16 : 0.1));
  }
  if (isDark) {
    const bgExpr = bgSeed || "#000000";
    return `color-mix(in srgb, ${baseSeed} 52%, ${bgExpr} 48%)`;
  }
  return baseSeed;
}

function deriveCornerColor(baseColor: string, bgSeed: string | undefined, isDark: boolean, fgSeed?: string): string {
  const parsedBg = bgSeed ? parseColor(bgSeed) : null;
  if (parsedBg) {
    const target: Rgb = isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    // Corner should have stronger contrast than the base border.
    return rgbToCss(mixRgb(parsedBg, target, isDark ? 0.45 : 0.34));
  }

  const parsedBase = parseColor(baseColor);
  if (!parsedBase) {
    // Keep corner color theme-aware when base is variable/color-mix.
    if (isDark) {
      const fgExpr = fgSeed || "var(--fg, #e5e7eb)";
      return `color-mix(in srgb, ${baseColor} 35%, ${fgExpr} 65%)`;
    }
    return `color-mix(in srgb, ${baseColor} 68%, var(--fg, #111827) 32%)`;
  }
  if (isDark) {
    const parsedFg = fgSeed ? parseColor(fgSeed) : null;
    const target: Rgb = parsedFg || { r: 255, g: 255, b: 255 };
    return rgbToCss(mixRgb(parsedBase, target, 0.58));
  }
  return rgbToCss(mixRgb(parsedBase, { r: 0, g: 0, b: 0 }, 0.32));
}

function resolveFrame(frame: HudFrameConfig | null | undefined, cssVars?: Record<string, string>, style?: React.CSSProperties) {
  const fromCss = (key: string) => (cssVars && cssVars[key] ? String(cssVars[key]) : undefined);
  const variant = frame?.variant || (fromCss("containerFrameVariant") as "hud" | undefined);
  if (variant !== "hud") return null;

  const styleBorderWidth = toNumber((style as AnyRecord)?.borderWidth, 1);
  const bgColor = getStyleBackgroundColor(style) || fromCss("surfaceBg") || fromCss("bg");
  const fgColor = fromCss("fg");
  const explicitBase = frame?.baseColor || fromCss("containerFrameBaseColor");
  const baseSeed = getStyleBorderColor(style) || fromCss("surfaceBorder") || fromCss("containerBorderColor") || "#4b5563";
  const isDark = isDarkThemeContext(bgColor, baseSeed, fgColor);
  const baseColor = explicitBase ? String(explicitBase) : deriveBaseColor(baseSeed, bgColor, isDark);
  const cornerColor = frame?.cornerColor || fromCss("containerFrameCornerColor") || deriveCornerColor(baseColor, bgColor, isDark, fgColor);
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
    borderColor: s.baseColor,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
  };
  const corner = s.cornerSize;
  const stroke = s.cornerWidth;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snapHalfPx = (n: number) => Math.round(n * 2) / 2;
  const safeCorner = Math.max(0, Math.min(corner, Math.floor(size.width / 2), Math.floor(size.height / 2)));
  // Draw corner accents on the outer border edge so they overlap the base border.
  const xLeft = snapHalfPx(0);
  const yTop = snapHalfPx(0);
  const xRight = snapHalfPx(Math.max(0, size.width));
  const yBottom = snapHalfPx(Math.max(0, size.height));

  return (
    <div ref={rootRef} className={className} style={merged}>
      {children}
      {size.width > 0 && size.height > 0 && (
        <svg
          aria-hidden
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
            shapeRendering: "geometricPrecision",
          }}
        >
          <line x1={xLeft} y1={yTop} x2={xLeft + safeCorner} y2={yTop} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
          <line x1={xLeft} y1={yTop} x2={xLeft} y2={yTop + safeCorner} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />

          <line x1={xRight} y1={yTop} x2={xRight - safeCorner} y2={yTop} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
          <line x1={xRight} y1={yTop} x2={xRight} y2={yTop + safeCorner} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />

          <line x1={xLeft} y1={yBottom} x2={xLeft + safeCorner} y2={yBottom} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
          <line x1={xLeft} y1={yBottom} x2={xLeft} y2={yBottom - safeCorner} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />

          <line x1={xRight} y1={yBottom} x2={xRight - safeCorner} y2={yBottom} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
          <line x1={xRight} y1={yBottom} x2={xRight} y2={yBottom - safeCorner} stroke={s.cornerColor} strokeWidth={stroke} strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}

