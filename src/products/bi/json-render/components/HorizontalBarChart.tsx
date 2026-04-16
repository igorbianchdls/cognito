"use client";

import * as React from "react";
import { Bar, BarChart as RechartsBarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export default function JsonRenderHorizontalBarChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const props = (element?.props as AnyRecord | undefined) || {};
  const rootStyle = props.style && typeof props.style === "object" ? props.style as React.CSSProperties : undefined;
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | string | undefined) ?? 220;
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const xAxis = (element?.props?.xAxis as AnyRecord | undefined) || {};
  const yAxis = (element?.props?.yAxis as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const seriesStyle = getChartStyleSeriesConfig(element?.props?.series);
  const { axisDataKey, keyField, seriesDefs, valueDataKey } = getChartRequestFields(props, dq, { defaultSeriesType: "bar" });
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord, {
    xField: axisDataKey,
    yField: valueDataKey,
    keyField,
  });
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const showValueAxis = xAxis.hide === true ? false : (legacyRecharts.showValueAxis ?? true);
  const hideCategoryAxis = Boolean(yAxis.hide ?? legacyRecharts.hideCategoryAxis ?? false);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const categoryLabelMode = String(yAxis.labelMode ?? legacyRecharts.categoryLabelMode ?? "short").trim().toLowerCase();
  const valueTickColor = String(xAxis.tickColor ?? legacyRecharts.valueTickColor ?? "#6b7280");
  const valueTickFontSize = Number(xAxis.tickFontSize ?? legacyRecharts.valueTickFontSize ?? 12);
  const categoryTickColor = String(yAxis.tickColor ?? legacyRecharts.categoryTickColor ?? "#6b7280");
  const categoryTickFontSize = Number(yAxis.tickFontSize ?? legacyRecharts.categoryTickFontSize ?? 12);
  const axisColor = String((xAxis.axisColor ?? yAxis.axisColor ?? legacyRecharts.axisColor) ?? "#d4d4d8");
  const barRadius = Number(seriesStyle.radius ?? legacyRecharts.radius ?? 5);
  const barSize = seriesStyle.barSize ?? legacyRecharts.barSize;
  const margin = (element?.props?.margin as AnyRecord | undefined) || legacyRecharts.margin || { left: -20, right: 12, top: 8, bottom: 8 };

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    const primarySeries = seriesDefs[0]?.dataKey || "value";
    return src.map((row) => {
      const record = row as AnyRecord;
      const label = String(getFieldValue(record, axisDataKey, ["label", "x"]) ?? "");
      return {
        label,
        shortLabel: categoryLabelMode === "first-word" ? formatCategoryFirstWord(label) : formatCategoryLabel(label),
        value: Number(getFieldValue(record, primarySeries, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyField, ["key", axisDataKey, "label", "x"]),
      };
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
    <div style={{ width: "100%", height, flex: 1, ...rootStyle }}>
      {queryError ? <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">{queryError}</div> : null}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={margin}
          onClick={handleClick}
          barSize={barSize}
        >
          <XAxis
            type="number"
            dataKey="value"
            hide={!showValueAxis}
            tickLine={false}
            tickMargin={Number(xAxis.tickMargin ?? 10)}
            axisLine={{ stroke: axisColor }}
            tick={{ fill: valueTickColor, fontSize: valueTickFontSize }}
            tickFormatter={(value) => formatChartValue(value, fmt)}
          />
          <YAxis
            dataKey="shortLabel"
            type="category"
            hide={hideCategoryAxis}
            tickLine={false}
            tickMargin={Number(yAxis.tickMargin ?? 10)}
            axisLine={{ stroke: axisColor }}
            interval={0}
            tick={{ fill: categoryTickColor, fontSize: categoryTickFontSize }}
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
          <Bar dataKey="value" radius={barRadius}>
            {chartData.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
