"use client";

import React from "react";
import type { DashboardBackgroundPreset } from "@/products/bi/json-render/backgrounds/types";
import { normalizeDashboardBackgroundPreset } from "@/products/bi/json-render/backgrounds/types";

const abs: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

function layer(style: React.CSSProperties, key: string) {
  return <div key={key} aria-hidden style={{ ...abs, ...style }} />;
}

function DotGridBase({
  mode,
  dense = false,
  fade = false,
}: {
  mode: "dark" | "light";
  dense?: boolean;
  fade?: boolean;
}) {
  const dark = mode === "dark";
  const size = dense ? 12 : 18;
  const dotInner = dense ? 0.6 : 0.7;
  const dotOuter = dense ? 0.8 : 0.95;

  return (
    <>
      {layer(
        {
          zIndex: 0,
          background: dark
            ? "linear-gradient(180deg, #070707 0%, #0a0a0a 52%, #060606 100%)"
            : "linear-gradient(180deg, #f4f5f7 0%, #eef0f3 55%, #e9ecf0 100%)",
        },
        "base",
      )}
      {layer(
        {
          zIndex: 1,
          backgroundImage: dark
            ? `radial-gradient(circle, rgba(110, 110, 110, ${dense ? 0.42 : 0.45}) ${dotInner}px, transparent ${dotOuter}px)`
            : "radial-gradient(circle, rgba(97, 103, 113, 0.3) 0.8px, transparent 1px)",
          backgroundSize: `${size}px ${size}px`,
          opacity: dark ? (dense ? 0.45 : 0.38) : 0.5,
          ...(fade
            ? {
                maskImage:
                  "radial-gradient(circle at center, transparent 14%, black 42%, black 58%, transparent 92%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 14%, black 42%, black 58%, transparent 92%)",
              }
            : {}),
        },
        "dots",
      )}
      {layer(
        {
          zIndex: 2,
          background: dark
            ? dense
              ? "radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.02), transparent 42%), radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.015), transparent 48%)"
              : fade
                ? "radial-gradient(circle at center, rgba(255, 255, 255, 0.02), transparent 55%)"
                : "radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.025), transparent 35%), radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.02), transparent 35%)"
            : "linear-gradient(120deg, rgba(255, 255, 255, 0.45), transparent 42%), linear-gradient(300deg, rgba(255, 255, 255, 0.35), transparent 46%)",
        },
        "sheen",
      )}
      {layer(
        {
          zIndex: 3,
          background: dark
            ? `radial-gradient(circle at center, transparent ${fade ? "34%" : dense ? "36%" : "38%"}, rgba(0, 0, 0, ${dense ? "0.44" : "0.4"}) 100%)`
            : "radial-gradient(circle at center, transparent 42%, rgba(87, 93, 104, 0.1) 100%)",
        },
        "vignette",
      )}
    </>
  );
}

function MatrixGlassBase({ mode }: { mode: "mono" | "light" }) {
  if (mode === "light") {
    return (
      <>
        {layer(
          {
            zIndex: 0,
            background:
              "radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.8), transparent 34%), radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.72), transparent 34%), linear-gradient(180deg, #f1f2f4 0%, #eceef1 48%, #e7eaee 100%)",
          },
          "base",
        )}
        {layer(
          {
            zIndex: 1,
            backgroundImage:
              "linear-gradient(rgba(88, 94, 104, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 94, 104, 0.12) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.75,
          },
          "grid",
        )}
        {layer(
          {
            zIndex: 2,
            background:
              "linear-gradient(120deg, rgba(255, 255, 255, 0.6), transparent 38%), linear-gradient(300deg, rgba(255, 255, 255, 0.45), transparent 44%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35), transparent 65%)",
          },
          "glass",
        )}
        {layer(
          {
            zIndex: 3,
            background:
              "radial-gradient(circle at center, transparent 38%, rgba(77, 83, 94, 0.12) 100%)",
          },
          "vignette",
        )}
      </>
    );
  }

  return (
    <>
      {layer(
        {
          zIndex: 0,
          background: "linear-gradient(180deg, #060606 0%, #090909 50%, #050505 100%)",
        },
        "base",
      )}
      {layer(
        {
          zIndex: 1,
          backgroundImage:
            "linear-gradient(rgba(70, 70, 70, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(70, 70, 70, 0.18) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.55,
        },
        "grid",
      )}
      {layer(
        {
          zIndex: 2,
          background:
            "linear-gradient(120deg, rgba(255, 255, 255, 0.02), transparent 42%), linear-gradient(300deg, rgba(255, 255, 255, 0.015), transparent 46%), radial-gradient(circle at 50% -10%, rgba(255, 255, 255, 0.02), transparent 45%)",
        },
        "glass",
      )}
      {layer(
        {
          zIndex: 3,
          background:
            "radial-gradient(circle at center, transparent 34%, rgba(0, 0, 0, 0.45) 100%)",
        },
        "vignette",
      )}
    </>
  );
}

function OrbitalBase() {
  return (
    <>
      {layer({ zIndex: 0, background: "#030508" }, "base")}
      {layer({
        zIndex: 1,
        backgroundImage:
          "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }, "grid")}
      {layer({
        zIndex: 2,
        background:
          "radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.08), transparent 42%), radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.06), transparent 60%)",
      }, "rings")}
      {layer({
        zIndex: 3,
        background:
          "radial-gradient(circle at 12% 8%, rgba(124, 58, 237, 0.18), transparent 34%), radial-gradient(circle at 88% 82%, rgba(0, 212, 255, 0.16), transparent 34%), radial-gradient(circle at 30% 78%, rgba(16, 185, 129, 0.1), transparent 30%)",
        filter: "blur(36px)",
      }, "glow")}
    </>
  );
}

function BlueprintBase() {
  return (
    <>
      {layer({
        zIndex: 0,
        background:
          "radial-gradient(circle at 15% 18%, rgba(56, 189, 248, 0.16), transparent 36%), radial-gradient(circle at 84% 22%, rgba(14, 165, 233, 0.14), transparent 40%), radial-gradient(circle at 70% 82%, rgba(59, 130, 246, 0.12), transparent 42%), linear-gradient(180deg, #04111f 0%, #030c16 45%, #02070d 100%)",
      }, "base")}
      {layer({
        zIndex: 1,
        backgroundImage:
          "linear-gradient(rgba(125, 211, 252, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 211, 252, 0.045) 1px, transparent 1px), linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px)",
        backgroundSize: "72px 72px, 72px 72px, 18px 18px, 18px 18px",
      }, "grid")}
      {layer({
        zIndex: 2,
        background:
          "radial-gradient(circle at center, rgba(148, 163, 184, 0.06), transparent 55%), linear-gradient(135deg, rgba(56, 189, 248, 0.05), transparent 45%, rgba(59, 130, 246, 0.04))",
      }, "fx")}
      {layer({
        zIndex: 3,
        background:
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)",
        opacity: 0.35,
      }, "scanline")}
    </>
  );
}

function AuroraBase() {
  return (
    <>
      {layer({ zIndex: 0, background: "#07080d" }, "base")}
      {layer({
        zIndex: 1,
        background:
          "radial-gradient(circle at 20% 10%, rgba(16, 185, 129, 0.08), transparent 30%), radial-gradient(circle at 80% 15%, rgba(59, 130, 246, 0.09), transparent 35%), radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.08), transparent 40%)",
      }, "ambience")}
      {layer({
        zIndex: 2,
        background:
          "radial-gradient(circle at 8% 22%, rgba(16,185,129,0.20), transparent 30%), radial-gradient(circle at 88% 16%, rgba(59,130,246,0.20), transparent 32%), radial-gradient(circle at 44% 92%, rgba(168,85,247,0.18), transparent 34%)",
        filter: "blur(58px)",
        opacity: 0.8,
      }, "aurora")}
      {layer({
        zIndex: 3,
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(circle at center, black 35%, transparent 95%)",
        WebkitMaskImage: "radial-gradient(circle at center, black 35%, transparent 95%)",
      }, "grid")}
    </>
  );
}

function MatrixGlassColorBase() {
  return (
    <>
      {layer({
        zIndex: 0,
        background:
          "radial-gradient(circle at 8% 12%, rgba(99, 102, 241, 0.16), transparent 34%), radial-gradient(circle at 90% 14%, rgba(236, 72, 153, 0.12), transparent 34%), radial-gradient(circle at 82% 84%, rgba(16, 185, 129, 0.12), transparent 36%), #06070b",
      }, "base")}
      {layer({
        zIndex: 1,
        backgroundImage:
          "linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }, "grid")}
      {layer({
        zIndex: 2,
        background:
          "linear-gradient(120deg, rgba(255, 255, 255, 0.02), transparent 38%), linear-gradient(300deg, rgba(255, 255, 255, 0.02), transparent 42%)",
      }, "glass")}
      {layer({
        zIndex: 3,
        background: "radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.42) 100%)",
      }, "vignette")}
    </>
  );
}

function renderPreset(preset: DashboardBackgroundPreset) {
  switch (preset) {
    case "dot-grid":
      return <DotGridBase mode="dark" />;
    case "dot-grid-light":
      return <DotGridBase mode="light" />;
    case "dot-grid-dense":
      return <DotGridBase mode="dark" dense />;
    case "dot-grid-fade":
      return <DotGridBase mode="dark" fade />;
    case "orbital":
      return <OrbitalBase />;
    case "blueprint":
      return <BlueprintBase />;
    case "aurora":
      return <AuroraBase />;
    case "matrix-glass":
      return <MatrixGlassColorBase />;
    case "matrix-glass-mono":
      return <MatrixGlassBase mode="mono" />;
    case "matrix-glass-light":
      return <MatrixGlassBase mode="light" />;
    default:
      return null;
  }
}

export default function DashboardBackgroundLayer({ preset }: { preset?: DashboardBackgroundPreset | string | null }) {
  const normalized = normalizeDashboardBackgroundPreset(preset);
  if (normalized === "none") return null;
  return (
    <div
      aria-hidden
      style={{
        ...abs,
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {renderPreset(normalized)}
    </div>
  );
}
