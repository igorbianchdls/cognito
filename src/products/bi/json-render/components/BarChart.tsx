"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import { formatChartValue, getByPath, getFieldValue, setByPath, useChartInteraction, useChartServerRows, useResolvedChartColors } from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

export default function JsonRenderBarChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | undefined) ?? 220;
  const recharts = ((element?.props?.recharts as AnyRecord | undefined) || {});
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const seriesFieldName = typeof dq?.seriesField === "string" ? dq.seriesField.trim() : "";
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord);
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors(element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);

  const normalizedRows = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      return {
        label: String(getFieldValue(record, xFieldName, ["label", "x"]) ?? ""),
        value: Number(getFieldValue(record, yFieldName, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyFieldName, ["key", xFieldName, "label", "x"]),
        filterLabel: String(getFieldValue(record, xFieldName, ["label", "x"]) ?? ""),
        series: seriesFieldName ? String(getFieldValue(record, seriesFieldName, ["series"]) ?? "Series") : "Series",
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, seriesFieldName]);

  const chartData = React.useMemo(() => {
    if (!seriesFieldName) return normalizedRows;
    const byLabel = new Map<string, AnyRecord>();
    normalizedRows.forEach((row) => {
      const current = byLabel.get(row.label) || { label: row.label, filterKey: row.filterKey, filterLabel: row.filterLabel };
      current[row.series] = row.value;
      byLabel.set(row.label, current);
    });
    return Array.from(byLabel.values());
  }, [normalizedRows, seriesFieldName]);

  const seriesKeys = React.useMemo(() => {
    if (!seriesFieldName) return ["value"];
    return Array.from(new Set(normalizedRows.map((row) => row.series)));
  }, [normalizedRows, seriesFieldName]);
  const useCategoryColors = Boolean(recharts.colorByCategory ?? !seriesFieldName);
  const requestedLayout = typeof recharts.layout === "string" ? recharts.layout : "horizontal";
  const layout = requestedLayout === "vertical" ? "vertical" : "horizontal";
  const stacked = Boolean(recharts.stacked);
  const margin = recharts.margin || (layout === "vertical"
    ? { top: 10, right: 12, bottom: 12, left: 120 }
    : { top: 10, right: 12, bottom: 44, left: 12 });
  const categoryAxisWidth = Number(recharts.yAxisWidth ?? 120);
  const radius = recharts.radius;
  const showGrid = recharts.showGrid ?? true;
  const xTickCount = Number(recharts.xTickCount ?? 6);
  const valueAxisLabel = typeof recharts.valueAxisLabel === "string"
    ? recharts.valueAxisLabel
    : undefined;

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
        <BarChart data={chartData} layout={layout} margin={margin} onClick={handleClick} barSize={recharts.barSize}>
          {showGrid ? <CartesianGrid strokeDasharray={recharts.gridDasharray || "3 3"} vertical={layout === "vertical"} horizontal={layout === "horizontal"} /> : null}
          {layout === "horizontal" ? (
            <>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={0}
                height={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatChartValue(value, fmt)}
                tickCount={xTickCount}
                width={80}
                label={valueAxisLabel ? { value: valueAxisLabel, angle: -90, position: "insideLeft" } : undefined}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatChartValue(value, fmt)}
                tickCount={xTickCount}
                label={valueAxisLabel ? { value: valueAxisLabel, position: "insideBottom", offset: -4 } : undefined}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={categoryAxisWidth}
                interval={0}
              />
            </>
          )}
          <Tooltip
            formatter={(value: any) => formatChartValue(value, fmt)}
            labelFormatter={(label: any, payload: any) => {
              const first = Array.isArray(payload) ? payload[0] : undefined;
              return first?.payload?.label ?? label ?? "";
            }}
          />
          {recharts.showLegend !== false && seriesKeys.length > 1 ? <Legend /> : null}
          {seriesKeys.map((key, index) => (
            <Bar key={key} dataKey={key} name={key === "value" ? valueAxisLabel || "Valor" : key} fill={colors[index % colors.length]} stackId={stacked ? "stack" : undefined} radius={radius}>
              {useCategoryColors
                ? chartData.map((_: any, cellIndex: number) => <Cell key={`cell-${key}-${cellIndex}`} fill={colors[cellIndex % colors.length]} />)
                : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
