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
  const height = (element?.props?.height as number | undefined) ?? 220;
  const recharts = { ...((element?.props?.recharts as AnyRecord | undefined) || {}), ...props };
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const seriesFieldName = typeof dq?.seriesField === "string" ? dq.seriesField.trim() : "";
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord);
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors(element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const showValueAxis = recharts.showValueAxis ?? true;
  const hideCategoryAxis = Boolean(recharts.hideCategoryAxis ?? false);
  const showTooltip = recharts.showTooltip ?? true;
  const legendPosition = String(recharts.legendPosition ?? "bottom").trim().toLowerCase();

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
  const useSingleSeriesGradient = Boolean(recharts.singleSeriesGradient ?? (!seriesFieldName && colors.length > 1));

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
        <LineChart data={chartData} margin={recharts.margin || { top: 10, right: 12, bottom: 12, left: 0 }} onClick={handleClick}>
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
          {recharts.showGrid !== false ? <CartesianGrid strokeDasharray={recharts.gridDasharray || "3 3"} vertical={Boolean(recharts.gridVertical)} /> : null}
          <XAxis dataKey="x" hide={hideCategoryAxis} tickLine={false} axisLine={false} />
          <YAxis hide={!showValueAxis} tickLine={false} axisLine={false} tickFormatter={(value) => formatChartValue(value, fmt)} />
          {showTooltip ? <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} /> : null}
          {recharts.showLegend !== false && legendPosition !== "none" && seriesKeys.length > 1 ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
            />
          ) : null}
          {seriesKeys.map((key, index) => (
            <Line
              key={key}
              type={recharts.curve || "monotone"}
              dataKey={key}
              stroke={useSingleSeriesGradient && seriesKeys.length === 1 ? `url(#${gradientId})` : colors[index % colors.length]}
              strokeWidth={Number(recharts.strokeWidth ?? 2)}
              dot={recharts.showDots === true ? { fill: colors[index % colors.length], stroke: colors[index % colors.length] } : false}
              activeDot={recharts.activeDot ?? { r: 4 }}
              connectNulls={Boolean(recharts.connectNulls)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
