"use client";

import React from "react";

type AnyRecord = Record<string, any>;

export type HudFrameConfig = {
  variant?: "hud";
  baseColor?: string;
  cornerColor?: string;
  foldColor?: string;
  cornerSize?: number | string;
  cornerWidth?: number | string;
  innerInset?: number | string;
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

function resolveFrame(frame: HudFrameConfig | null | undefined, cssVars?: Record<string, string>, style?: React.CSSProperties) {
  const fromCss = (key: string) => (cssVars && cssVars[key] ? String(cssVars[key]) : undefined);
  const variant = frame?.variant || (fromCss("containerFrameVariant") as "hud" | undefined);
  if (variant !== "hud") return null;

  const baseColor = frame?.baseColor || fromCss("containerFrameBaseColor") || getStyleBorderColor(style) || "#4b5563";
  const cornerColor = frame?.cornerColor || fromCss("containerFrameCornerColor") || baseColor;
  const foldColor = frame?.foldColor || fromCss("containerFrameFoldColor") || cornerColor;
  const cornerSize = clamp(
    toNumber(frame?.cornerSize ?? fromCss("containerFrameCornerSize"), 14),
    4,
    64
  );
  const cornerWidth = clamp(
    toNumber(frame?.cornerWidth ?? fromCss("containerFrameCornerWidth"), 1),
    1,
    4
  );
  const innerInset = clamp(
    toNumber(frame?.innerInset ?? fromCss("containerFrameInnerInset"), 6),
    2,
    32
  );

  return { variant, baseColor, cornerColor, foldColor, cornerSize, cornerWidth, innerInset };
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
  };

  const radius = (style as AnyRecord)?.borderRadius;
  const corner = s.cornerSize;
  const stroke = s.cornerWidth;
  const inset = s.innerInset;
  const fold = Math.max(6, Math.round(corner * 0.58));

  return (
    <div className={className} style={merged}>
      {children}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: radius as any,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset,
            border: `${stroke}px dashed ${s.foldColor}`,
            borderRadius: radius as any,
            opacity: 0.45,
          }}
        />

        <div style={{ ...lineStyle(s.cornerColor, stroke), left: 0, top: 0, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: 0, top: 0, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: 0, top: 0, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: 0, top: 0, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: 0, bottom: 0, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), left: 0, bottom: 0, width: stroke, height: corner }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: 0, bottom: 0, width: corner, height: stroke }} />
        <div style={{ ...lineStyle(s.cornerColor, stroke), right: 0, bottom: 0, width: stroke, height: corner }} />

        <div
          style={{
            ...lineStyle(s.foldColor, stroke),
            left: inset,
            top: inset,
            width: fold,
            height: stroke,
            transform: "rotate(-45deg)",
            transformOrigin: "left center",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            ...lineStyle(s.foldColor, stroke),
            right: inset,
            top: inset,
            width: fold,
            height: stroke,
            transform: "rotate(45deg)",
            transformOrigin: "right center",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            ...lineStyle(s.foldColor, stroke),
            left: inset,
            bottom: inset,
            width: fold,
            height: stroke,
            transform: "rotate(45deg)",
            transformOrigin: "left center",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            ...lineStyle(s.foldColor, stroke),
            right: inset,
            bottom: inset,
            width: fold,
            height: stroke,
            transform: "rotate(-45deg)",
            transformOrigin: "right center",
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}

