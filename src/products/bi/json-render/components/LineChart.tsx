"use client";

import * as React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import { formatChartValue, getByPath, getFieldValue, setByPath, useChartInteraction, useChartServerRows, useResolvedChartColors } from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

export default function JsonRenderLineChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const gradientId = React.useId();
  const props = (element?.props as AnyRecord | undefined) || {};
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | string | undefined) ?? 220;
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const grid = (element?.props?.grid as AnyRecord | undefined) || {};
  const xAxis = (element?.props?.xAxis as AnyRecord | undefined) || {};
  const yAxis = (element?.props?.yAxis as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const legend = (element?.props?.legend as AnyRecord | undefined) || {};
  const series = (element?.props?.series as AnyRecord | undefined) || {};
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const seriesFieldName = typeof dq?.seriesField === "string" ? dq.seriesField.trim() : "";
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord);
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const showValueAxis = yAxis.hide === true ? false : (legacyRecharts.showValueAxis ?? true);
  const hideCategoryAxis = Boolean(xAxis.hide ?? legacyRecharts.hideCategoryAxis ?? false);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const legendPosition = String(legend.position ?? legacyRecharts.legendPosition ?? "bottom").trim().toLowerCase();
  const showLegend = legend.enabled ?? (legacyRecharts.showLegend !== false);
  const showGrid = grid.enabled ?? (legacyRecharts.showGrid ?? true);
  const gridVertical = Boolean(grid.vertical ?? legacyRecharts.gridVertical);
  const gridDasharray = String(grid.strokeDasharray ?? legacyRecharts.gridDasharray ?? "3 3");
  const categoryTickMargin = Number(xAxis.tickMargin ?? legacyRecharts.categoryTickMargin ?? 10);
  const valueTickMargin = Number(yAxis.tickMargin ?? legacyRecharts.valueTickMargin ?? 8);
  const valueAxisWidth = Number(yAxis.width ?? legacyRecharts.valueAxisWidth ?? 64);
  const strokeWidth = Number(series.strokeWidth ?? legacyRecharts.strokeWidth ?? 2);
  const showDots = series.showDots ?? legacyRecharts.showDots;
  const activeDot = series.activeDot ?? legacyRecharts.activeDot ?? { r: 4 };
  const curve = series.curve ?? legacyRecharts.curve ?? "monotone";
  const singleSeriesGradient = series.singleSeriesGradient ?? legacyRecharts.singleSeriesGradient;
  const connectNulls = Boolean(series.connectNulls ?? legacyRecharts.connectNulls);
  const margin = (element?.props?.margin as AnyRecord | undefined) || legacyRecharts.margin || { top: 10, right: 12, bottom: 12, left: 12 };

  const normalizedRows = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      return {
        x: getFieldValue(record, xFieldName, ["label", "x"]),
        y: Number(getFieldValue(record, yFieldName, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyFieldName, ["key", xFieldName, "label", "x"]),
        series: seriesFieldName ? String(getFieldValue(record, seriesFieldName, ["series"]) ?? "Series") : "Series",
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, seriesFieldName]);

  const chartData = React.useMemo(() => {
    if (!seriesFieldName) {
      return normalizedRows.map((row) => ({ x: String(row.x ?? ""), value: row.y, filterKey: row.filterKey }));
    }
    const byX = new Map<string, AnyRecord>();
    normalizedRows.forEach((row) => {
      const key = String(row.x ?? "");
      const current = byX.get(key) || { x: key, filterKey: row.filterKey };
      current[row.series] = row.y;
      byX.set(key, current);
    });
    return Array.from(byX.values());
  }, [normalizedRows, seriesFieldName]);

  const seriesKeys = React.useMemo(() => {
    if (!seriesFieldName) return ["value"];
    return Array.from(new Set(normalizedRows.map((row) => row.series)));
  }, [normalizedRows, seriesFieldName]);
  const useSingleSeriesGradient = Boolean(singleSeriesGradient ?? (!seriesFieldName && colors.length > 1));

  const handleClick = React.useCallback((payload: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = payload?.activePayload?.[0]?.payload?.filterKey;
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
        <LineChart data={chartData} margin={margin} onClick={handleClick}>
          {useSingleSeriesGradient ? (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                {colors.map((color, index) => (
                  <stop
                    key={`${color}-${index}`}
                    offset={`${(index / Math.max(colors.length - 1, 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
          ) : null}
          {showGrid ? <CartesianGrid strokeDasharray={gridDasharray} vertical={gridVertical} /> : null}
          <XAxis
            dataKey="x"
            hide={hideCategoryAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={categoryTickMargin}
          />
          <YAxis
            hide={!showValueAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={valueTickMargin}
            tickFormatter={(value) => formatChartValue(value, fmt)}
            width={valueAxisWidth}
          />
          {showTooltip ? <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} /> : null}
          {showLegend && legendPosition !== "none" && seriesKeys.length > 1 ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
            />
          ) : null}
          {seriesKeys.map((key, index) => (
            <Line
              key={key}
              type={curve}
              dataKey={key}
              stroke={useSingleSeriesGradient && seriesKeys.length === 1 ? `url(#${gradientId})` : colors[index % colors.length]}
              strokeWidth={strokeWidth}
              dot={showDots === true ? { fill: colors[index % colors.length], stroke: colors[index % colors.length] } : false}
              activeDot={activeDot}
              connectNulls={connectNulls}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
