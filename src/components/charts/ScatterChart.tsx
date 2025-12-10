"use client";

import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { EmptyState } from "./EmptyState";

export type ScatterSeries = {
  id: string;
  data: Array<{ x: number; y: number; label?: string }>;
};

export interface ScatterChartProps {
  series: ScatterSeries[];
  title?: string;
  subtitle?: string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  colors?: string[];
  backgroundColor?: string;

  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;
  gridColor?: string;
  gridStrokeWidth?: number;

  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;

  // Typography - Subtitle
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;

  // Container Border
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderRadius?: number;
  containerPadding?: number;
}

const DEFAULT_MARGIN = { top: 36, right: 24, bottom: 40, left: 48 };

export function ScatterChart(props: ScatterChartProps) {
  const {
    series,
    title,
    subtitle,
    margin = DEFAULT_MARGIN,
    colors,
    backgroundColor = "#fff",
    enableGridX = true,
    enableGridY = true,
    gridColor,
    gridStrokeWidth,
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = "#111827",
    subtitleFontFamily,
    subtitleFontSize = 13,
    subtitleFontWeight = 400,
    subtitleColor = "#6b7280",
    containerBorderWidth = 1,
    containerBorderColor = "#e5e7eb",
    containerBorderRadius = 12,
    containerPadding = 12,
  } = props;

  const hasData = Array.isArray(series) && series.some((s) => s.data && s.data.length > 0);
  if (!hasData) {
    return (
      <div
        className="w-full h-full"
        style={{
          background: backgroundColor,
          border: `${containerBorderWidth}px solid ${containerBorderColor}`,
          borderRadius: containerBorderRadius,
          padding: containerPadding,
        }}
      >
        <EmptyState message="Sem dados" subtitle="Não há pontos para o Scatter Plot" />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      style={{
        background: backgroundColor,
        border: `${containerBorderWidth}px solid ${containerBorderColor}`,
        borderRadius: containerBorderRadius,
        padding: containerPadding,
      }}
    >
      {(title || subtitle) && (
        <div className="px-1 pt-1 pb-3">
          {title && (
            <h3
              style={{
                fontFamily: titleFontFamily,
                fontSize: titleFontSize,
                fontWeight: titleFontWeight as number,
                color: titleColor,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontFamily: subtitleFontFamily,
                fontSize: subtitleFontSize,
                fontWeight: subtitleFontWeight as number,
                color: subtitleColor,
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{ height: `calc(100% - ${title || subtitle ? margin.top ?? 36 : 0}px)` }}>
        <ResponsiveScatterPlot
          data={series}
          margin={margin}
          colors={colors && colors.length ? colors : { scheme: "category10" }}
          axisBottom={{ legendOffset: 36 }}
          axisLeft={{ legendOffset: -40 }}
          enableGridX={!!enableGridX}
          enableGridY={!!enableGridY}
          theme={
            gridColor || gridStrokeWidth
              ? { grid: { line: { stroke: gridColor, strokeWidth: gridStrokeWidth } } }
              : undefined
          }
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 130,
              itemWidth: 100,
              itemHeight: 18,
              itemsSpacing: 5,
              symbolSize: 12,
              symbolShape: "circle",
            },
          ]}
          tooltip={({ node }) => (
            <div className="rounded-md border bg-white p-2 text-xs shadow">
              <div><strong>{String(node.serieId)}</strong></div>
              <div>x: {node.data.formattedX || node.data.x}</div>
              <div>y: {node.data.formattedY || node.data.y}</div>
              {node.data.label && <div>label: {String(node.data.label)}</div>}
            </div>
          )}
        />
      </div>
    </div>
  );
}
