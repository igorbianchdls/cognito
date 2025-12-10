"use client";

import { ResponsiveFunnel } from "@nivo/funnel";
import { BaseChartProps } from "./types";
import { nivoTheme, colorSchemes } from "./theme";
import { formatValue } from "./utils";
import { EmptyState } from "./EmptyState";

export interface FunnelChartProps extends BaseChartProps {
  // Container & styling
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  colors?: string[];
  backgroundColor?: string;
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderRadius?: number;
  containerPadding?: number;
  // Typography
  title?: string;
  subtitle?: string;
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  // Funnel-specific
  enableLabel?: boolean;
  valueFormat?: (v: number) => string;
}

export function FunnelChart(props: FunnelChartProps) {
  const {
    data,
    title,
    subtitle,
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    colors,
    backgroundColor = "#fff",
    containerBorderWidth = 1,
    containerBorderColor = "#e5e7eb",
    containerBorderRadius = 12,
    containerPadding = 12,
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = "#111827",
    subtitleFontFamily,
    subtitleFontSize = 13,
    subtitleFontWeight = 400,
    subtitleColor = "#6b7280",
    enableLabel = true,
    valueFormat,
  } = props;

  const steps = (data || []).map((item) => ({
    id: (item.x || item.label || "Unknown") as string,
    value: Number(item.y ?? item.value ?? 0),
    label: (item.x || item.label || "Unknown") as string,
  }));

  if (!steps || steps.length === 0) {
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
        <EmptyState message="Sem dados" subtitle="Não há valores para o funil" />
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

      <div style={{ height: `calc(100% - ${title || subtitle ? (margin.top ?? 20) : 0}px)` }}>
        <ResponsiveFunnel
          data={steps}
          margin={margin}
          valueFormat={(v) => (valueFormat ? valueFormat(v) : formatValue(Number(v)))}
          colors={colors && colors.length ? colors : { scheme: colorSchemes.primary }}
          borderWidth={20}
          labelColor={{ from: "color", modifiers: [["darker", 3]] }}
          beforeSeparatorLength={100}
          beforeSeparatorOffset={20}
          afterSeparatorLength={100}
          afterSeparatorOffset={20}
          currentPartSizeExtension={10}
          currentBorderWidth={40}
          theme={nivoTheme}
          animate={true}
          motionConfig="gentle"
          enableLabel={enableLabel}
        />
      </div>
    </div>
  );
}
