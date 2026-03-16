"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import { formatChartValue, getByPath, getFieldValue, setByPath, useChartInteraction, useChartServerRows, useResolvedChartColors } from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

export default function JsonRenderRechartsBarChart({ element }: { element: any }) {
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
        series: seriesFieldName ? String(getFieldValue(record, seriesFieldName, ["series"]) ?? "Series") : "Series",
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName, seriesFieldName]);

  const chartData = React.useMemo(() => {
    if (!seriesFieldName) return normalizedRows;
    const byLabel = new Map<string, AnyRecord>();
    normalizedRows.forEach((row) => {
      const current = byLabel.get(row.label) || { label: row.label, filterKey: row.filterKey };
      current[row.series] = row.value;
      byLabel.set(row.label, current);
    });
    return Array.from(byLabel.values());
  }, [normalizedRows, seriesFieldName]);

  const seriesKeys = React.useMemo(() => {
    if (!seriesFieldName) return ["value"];
    return Array.from(new Set(normalizedRows.map((row) => row.series)));
  }, [normalizedRows, seriesFieldName]);

  const layout = recharts.layout === "horizontal" ? "vertical" : "horizontal";
  const stacked = Boolean(recharts.stacked);

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
        <BarChart data={chartData} layout={layout} margin={recharts.margin || { top: 10, right: 12, bottom: 12, left: 0 }} onClick={handleClick} barSize={recharts.barSize}>
          {recharts.showGrid !== false ? <CartesianGrid strokeDasharray={recharts.gridDasharray || "3 3"} vertical={layout === "vertical"} horizontal={layout === "horizontal"} /> : null}
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatChartValue(value, fmt)} />
            </>
          ) : (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatChartValue(value, fmt)} />
              <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={recharts.yAxisWidth || 100} />
            </>
          )}
          <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} />
          {recharts.showLegend !== false && seriesKeys.length > 1 ? <Legend /> : null}
          {seriesKeys.map((key, index) => (
            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} stackId={stacked ? "stack" : undefined} radius={recharts.radius}>
              {seriesKeys.length === 1 && !seriesFieldName
                ? chartData.map((_: any, cellIndex: number) => <Cell key={`cell-${cellIndex}`} fill={colors[cellIndex % colors.length]} />)
                : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
