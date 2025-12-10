"use client";

import { ResponsiveTreeMap } from "@nivo/treemap";
import { EmptyState } from "./EmptyState";

export type TreeNode = {
  name: string;
  value?: number;
  children?: TreeNode[];
};

export interface TreeMapChartProps {
  data: TreeNode; // root node { name: 'root', children: [...] }
  title?: string;
  subtitle?: string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  colors?: string[];
  backgroundColor?: string;

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

const DEFAULT_MARGIN = { top: 36, right: 12, bottom: 12, left: 12 };

export function TreeMapChart(props: TreeMapChartProps) {
  const {
    data,
    title,
    subtitle,
    margin = DEFAULT_MARGIN,
    colors,
    backgroundColor = "#fff",
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

  const hasData = Array.isArray(data?.children) && data.children.length > 0;
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
        <EmptyState title="Sem dados" description="Não há valores para o TreeMap" />
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
        <ResponsiveTreeMap
          data={data}
          identity="name"
          value="value"
          margin={margin}
          leavesOnly={false}
          innerPadding={3}
          outerPadding={3}
          labelSkipSize={10}
          label={(n) => `${n.id}`}
          colors={colors && colors.length > 0 ? colors : { scheme: "nivo" }}
          borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
          labelTextColor={{ from: "color", modifiers: [["darker", 2.0]] }}
        />
      </div>
    </div>
  );
}

