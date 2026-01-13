"use client";

import { useEffect, useMemo, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LiquidParser } from "@/components/visual-builder/LiquidParser";
import { QueryEngine } from "@/components/visual-builder/QueryEngine";
import type { GlobalFilters } from "@/stores/visualBuilderStore";
import type { VBNivoThemeState } from "@/stores/visualBuilderNivoStore";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { PieChart } from "@/components/charts/PieChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";

type LiquidPreviewCanvasProps = {
  code: string;
  globalFilters?: GlobalFilters;
  defaults?: Partial<VBNivoThemeState>;
  className?: string;
  style?: React.CSSProperties;
};

const DEFAULTS: VBNivoThemeState = {
  enableGridX: false,
  enableGridY: true,
  showLegend: true,
  animate: true,
  motionConfig: "gentle",
  gridColor: "#f1f5f9",
  gridStrokeWidth: 1,
  axisFontFamily: "Geist, sans-serif",
  axisFontSize: 12,
  axisFontWeight: 400,
  axisTextColor: "#6b7280",
  axisLegendFontSize: 14,
  axisLegendFontWeight: 500,
  labelsFontFamily: "Geist, sans-serif",
  labelsFontSize: 11,
  labelsFontWeight: 500,
  labelsTextColor: "#1f2937",
  legendsFontFamily: "Geist, sans-serif",
  legendsFontSize: 12,
  legendsFontWeight: 400,
  legendsTextColor: "#6b7280",
  tooltipFontSize: 12,
  tooltipFontFamily: "Geist, sans-serif",
};

export default function LiquidPreviewCanvas({ code, globalFilters, defaults, className, style }: LiquidPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Root[]>([]);

  const vb = useMemo<VBNivoThemeState>(() => ({ ...DEFAULTS, ...(defaults || {}) }), [defaults]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Cleanup previous mounts
    for (const r of rootsRef.current) {
      try { r.unmount(); } catch {}
    }
    rootsRef.current = [];
    el.innerHTML = "";

    const parsed = LiquidParser.parse(code);
    if (parsed.mode !== 'html') {
      el.innerHTML = '<div style="padding:12px;color:#6b7280;font-size:12px;">Preview disponível apenas para &lt;dashboard render="html"&gt;…&lt;/dashboard&gt;.</div>';
      return;
    }

    el.innerHTML = parsed.html || '';

    // Mount charts with simulated data first
    for (const spec of parsed.charts) {
      const mount = el.querySelector(`[data-liquid-chart="${spec.id}"]`) as HTMLElement | null;
      if (!mount) continue;
      if (!mount.style.height || mount.style.height === '') mount.style.height = (spec.height && Number.isFinite(spec.height) ? `${spec.height}px` : '320px');
      mount.style.width = mount.style.width || '100%';
      const root = createRoot(mount);
      rootsRef.current.push(root);

      const common: any = {
        data: spec.data,
        enableGridX: vb.enableGridX,
        enableGridY: vb.enableGridY,
        gridColor: vb.gridColor,
        gridStrokeWidth: vb.gridStrokeWidth,
        axisFontFamily: vb.axisFontFamily,
        axisFontSize: vb.axisFontSize,
        axisFontWeight: vb.axisFontWeight,
        axisTextColor: vb.axisTextColor,
        axisLegendFontSize: vb.axisLegendFontSize,
        axisLegendFontWeight: vb.axisLegendFontWeight,
        labelsFontFamily: vb.labelsFontFamily,
        labelsFontSize: vb.labelsFontSize,
        labelsFontWeight: vb.labelsFontWeight,
        labelsTextColor: vb.labelsTextColor,
        legendsFontFamily: vb.legendsFontFamily,
        legendsFontSize: vb.legendsFontSize,
        legendsFontWeight: vb.legendsFontWeight,
        legendsTextColor: vb.legendsTextColor,
        animate: vb.animate,
        motionConfig: vb.motionConfig,
        containerClassName: 'nivo-container',
        containerBorderVariant: 'none',
        containerPadding: 0,
        containerBorderRadius: 0,
        backgroundColor: 'transparent',
        containerBackground: 'transparent',
      };

      switch (spec.type) {
        case 'line': root.render(<LineChart {...common} />); break;
        case 'pie': root.render(<PieChart {...common} />); break;
        case 'area': root.render(<AreaChart {...common} enableArea={true} />); break;
        case 'groupedbar': root.render(<GroupedBarChart data={spec.data as any} />); break;
        default: {
          const barBase: any = {
            containerClassName: 'nivo-container',
            containerBorderVariant: 'none',
            containerPadding: 0,
            containerBorderRadius: 0,
            backgroundColor: 'transparent',
            containerBackground: 'transparent',
          };
          const barProps: any = { ...barBase, ...(spec as any).props, data: spec.data };
          root.render(<BarChart {...barProps} />);
          break;
        }
      }

      // fetch data if querySpec exists
      if (spec.querySpec) {
        QueryEngine.resolve(spec.querySpec, globalFilters as GlobalFilters).then((rows) => {
          if (!Array.isArray(rows) || rows.length === 0) return;
          try {
            switch (spec.type) {
              case 'line': root.render(<LineChart {...common} data={rows} />); break;
              case 'pie': root.render(<PieChart {...common} data={rows} />); break;
              case 'area': root.render(<AreaChart {...common} data={rows} enableArea={true} />); break;
              case 'groupedbar': root.render(<GroupedBarChart data={rows as any} />); break;
              default: {
                const barBase: any = {
                  containerClassName: 'nivo-container',
                  containerBorderVariant: 'none',
                  containerPadding: 0,
                  containerBorderRadius: 0,
                  backgroundColor: 'transparent',
                  containerBackground: 'transparent',
                };
                const barProps: any = { ...barBase, ...(spec as any).props, data: rows };
                root.render(<BarChart {...barProps} />);
                break;
              }
            }
          } catch {}
        }).catch(() => { /* ignore */ });
      }
    }

    return () => {
      for (const r of rootsRef.current) {
        try { r.unmount(); } catch {}
      }
      rootsRef.current = [];
      try { el.innerHTML = ""; } catch {}
    };
  }, [code, globalFilters, vb]);

  return <div ref={containerRef} className={className} style={style} />;
}

