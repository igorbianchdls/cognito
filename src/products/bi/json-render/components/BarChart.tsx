"use client";

import * as React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import {
  formatChartValue,
  getByPath,
  getChartRequestFields,
  getChartStyleSeriesConfig,
  getFieldValue,
  setByPath,
  useChartInteraction,
  useChartServerRows,
  useResolvedChartColors,
} from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

function formatCategoryLabel(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > 3 ? text.slice(0, 3) : text;
}

function formatCategoryFirstWord(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const [firstWord = ""] = text.split(/\s+/);
  return firstWord;
}

export default function JsonRenderBarChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const props = (element?.props as AnyRecord | undefined) || {};
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = Number(element?.props?.height ?? 220);
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const grid = (element?.props?.grid as AnyRecord | undefined) || {};
  const xAxis = (element?.props?.xAxis as AnyRecord | undefined) || {};
  const yAxis = (element?.props?.yAxis as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const legend = (element?.props?.legend as AnyRecord | undefined) || {};
  const seriesStyle = getChartStyleSeriesConfig(element?.props?.series);
  const { axisDataKey, keyField, seriesDefs, valueDataKey } = getChartRequestFields(props, dq, { defaultSeriesType: "bar" });
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord, {
    xField: axisDataKey,
    yField: valueDataKey,
    keyField,
  });
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const categoryLabelMode = String(xAxis.labelMode ?? legacyRecharts.categoryLabelMode ?? "short").trim().toLowerCase();
  const showValueAxis = yAxis.hide === true ? false : (legacyRecharts.showValueAxis ?? true);
  const hideCategoryAxis = Boolean(xAxis.hide ?? legacyRecharts.hideCategoryAxis ?? false);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const showLegend = legend.enabled ?? legacyRecharts.showLegend ?? seriesDefs.length > 1;
  const legendPosition = String(legend.position ?? legacyRecharts.legendPosition ?? "bottom").trim().toLowerCase();
  const showGrid = grid.enabled ?? (legacyRecharts.showGrid ?? true);
  const gridVertical = Boolean(grid.vertical ?? legacyRecharts.gridVertical ?? false);
  const gridDasharray = String(grid.strokeDasharray ?? legacyRecharts.gridDasharray ?? "3 3");
  const categoryTickMargin = Number(xAxis.tickMargin ?? legacyRecharts.categoryTickMargin ?? 10);
  const categoryTickColor = String(xAxis.tickColor ?? legacyRecharts.categoryTickColor ?? "#6b7280");
  const categoryTickFontSize = Number(xAxis.tickFontSize ?? legacyRecharts.categoryTickFontSize ?? 12);
  const valueTickMargin = Number(yAxis.tickMargin ?? legacyRecharts.valueTickMargin ?? 8);
  const valueTickColor = String(yAxis.tickColor ?? legacyRecharts.valueTickColor ?? "#6b7280");
  const valueTickFontSize = Number(yAxis.tickFontSize ?? legacyRecharts.valueTickFontSize ?? 12);
  const valueAxisWidth = Number(yAxis.width ?? legacyRecharts.valueAxisWidth ?? 64);
  const barRadius = Number(seriesStyle.radius ?? legacyRecharts.radius ?? 8);
  const barSize = seriesStyle.barSize ?? legacyRecharts.barSize;
  const margin = (element?.props?.margin as AnyRecord | undefined) || legacyRecharts.margin || { top: 8, right: 12, left: 18, bottom: 8 };

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      const label = String(getFieldValue(record, axisDataKey, ["label", "x"]) ?? "");
      const normalized: AnyRecord = {
        label,
        shortLabel:
          categoryLabelMode === "first-word"
            ? formatCategoryFirstWord(label)
            : categoryLabelMode === "short"
              ? formatCategoryLabel(label)
              : label,
        filterKey: getFieldValue(record, keyField, ["key", axisDataKey, "label", "x"]),
      };
      for (const [index, seriesDef] of seriesDefs.entries()) {
        normalized[seriesDef.dataKey] = Number(
          getFieldValue(
            record,
            seriesDef.dataKey,
            index === 0 ? ["value", "y"] : [seriesDef.dataKey],
          ) ?? 0,
        );
      }
      return normalized;
    });
  }, [serverRows, axisDataKey, keyField, categoryLabelMode, seriesDefs]);

  const handleClick = React.useCallback((state: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = state?.activePayload?.[0]?.payload?.filterKey;
    if (rawValue === undefined || rawValue === null || rawValue === "") return;
    setData((prev) => {
      const current = getByPath((prev || {}) as AnyRecord, resolvedFilterStorePath);
      const shouldClear = clearOnSecondClick && String(current ?? "") === String(rawValue);
      return setByPath((prev || {}) as AnyRecord, resolvedFilterStorePath, shouldClear ? undefined : rawValue);
    });
  }, [shouldClickFilter, resolvedFilterStorePath, setData, clearOnSecondClick]);

  return (
    <div style={{ height, width: "100%" }}>
      {queryError ? <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">{queryError}</div> : null}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          accessibilityLayer
          data={chartData}
          margin={margin}
          onClick={handleClick}
          barSize={barSize}
        >
          {showGrid ? <CartesianGrid vertical={gridVertical} strokeDasharray={gridDasharray} /> : null}
          <XAxis
            dataKey="shortLabel"
            hide={hideCategoryAxis}
            tickLine={false}
            tickMargin={categoryTickMargin}
            axisLine={false}
            interval={0}
            tick={{ fill: categoryTickColor, fontSize: categoryTickFontSize }}
          />
          <YAxis
            hide={!showValueAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={valueTickMargin}
            tick={{ fill: valueTickColor, fontSize: valueTickFontSize }}
            tickFormatter={(value) => formatChartValue(value, fmt)}
            width={valueAxisWidth}
          />
          {showTooltip ? (
            <Tooltip
              cursor={false}
              formatter={(value: any) => formatChartValue(value, fmt)}
              labelFormatter={(_label: any, payload: any) => {
                const first = Array.isArray(payload) ? payload[0] : undefined;
                return first?.payload?.label ?? "";
              }}
            />
          ) : null}
          {showLegend && legendPosition !== "none" ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
            />
          ) : null}
          {seriesDefs.map((seriesDef, seriesIndex) => (
            <Bar
              key={seriesDef.dataKey}
              dataKey={seriesDef.dataKey}
              name={seriesDef.label ?? seriesDef.dataKey}
              fill={seriesDef.color ?? colors[seriesIndex % colors.length]}
              radius={barRadius}
            >
              {seriesDefs.length === 1
                ? chartData.map((entry, index) => (
                    <Cell
                      key={`${entry.label}-${index}`}
                      fill={seriesDef.color ?? colors[index % colors.length]}
                    />
                  ))
                : null}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
