"use client";

import React from "react";
import LiquidPreviewCanvas from "@/components/visual-builder/LiquidPreviewCanvas";
import { ConfigParser } from "@/components/visual-builder/ConfigParser";
import type { GlobalFilters } from "@/stores/visualBuilderStore";
import type { VBNivoThemeState } from "@/stores/visualBuilderNivoStore";

type Props = {
  code: string;
  interactive?: boolean;
  defaults?: Partial<VBNivoThemeState>;
  className?: string;
  style?: React.CSSProperties;
  onError?: (msg: string) => void;
};

function deriveGlobalFilters(code: string): GlobalFilters {
  try {
    const res = ConfigParser.parse(code);
    const gf = res.globalFilters?.dateRange;
    const allowed = new Set([
      "today",
      "yesterday",
      "last_7_days",
      "last_14_days",
      "last_30_days",
      "last_90_days",
      "current_month",
      "last_month",
      "custom",
    ]);
    const t = (gf?.type || "").toString();
    if (allowed.has(t)) {
      if (t === "custom") {
        return { dateRange: { type: "custom", startDate: gf?.startDate, endDate: gf?.endDate } } as GlobalFilters;
      }
      return { dateRange: { type: t as any } } as GlobalFilters;
    }
  } catch {}
  return { dateRange: { type: "last_30_days" } } as GlobalFilters;
}

function stripScripts(input: string): string {
  try {
    return String(input || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  } catch {
    return input;
  }
}

export default function AppPreviewWrapper({ code, interactive = false, defaults, className, style, onError }: Props) {
  const src = String(code || "").trim();
  const isLiquid = src.startsWith("<");
  if (!isLiquid) {
    const msg = "Conteúdo não é Liquid (<dashboard ...>).";
    onError?.(msg);
    return (
      <div className="p-4 text-sm text-gray-600">
        {msg}
      </div>
    );
  }
  const gf = deriveGlobalFilters(src);
  const safeCode = stripScripts(src);
  return (
    <div className={className} style={style}>
      <LiquidPreviewCanvas code={safeCode} globalFilters={gf} defaults={defaults} interactive={interactive} />
    </div>
  );
}

