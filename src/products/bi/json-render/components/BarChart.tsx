"use client";

import * as React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import { formatChartValue, getByPath, getFieldValue, setByPath, useChartInteraction, useChartServerRows, useResolvedChartColors } from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

function formatCategoryLabel(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > 3 ? text.slice(0, 3) : text;
}

export default function JsonRenderBarChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = Number(element?.props?.height ?? 220);
  const recharts = ((element?.props?.recharts as AnyRecord | undefined) || {});
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord);
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors(element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const isHorizontalBars = String(recharts.layout ?? "vertical").trim().toLowerCase() === "horizontal";

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      const label = String(getFieldValue(record, xFieldName, ["label", "x"]) ?? "");
      return {
        label,
        shortLabel: formatCategoryLabel(label),
        value: Number(getFieldValue(record, yFieldName, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyFieldName, ["key", xFieldName, "label", "x"]),
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName]);

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
          layout={isHorizontalBars ? "vertical" : "horizontal"}
          margin={recharts.margin || (isHorizontalBars ? { top: 8, right: 12, left: -20, bottom: 8 } : { top: 8, right: 12, left: 12, bottom: 8 })}
          onClick={handleClick}
          barSize={recharts.barSize}
        >
          <CartesianGrid vertical={!isHorizontalBars} horizontal={false} strokeDasharray={recharts.gridDasharray || "3 3"} />
          {isHorizontalBars ? (
            <>
              <XAxis
                type="number"
                dataKey="value"
                hide={Boolean(recharts.hideValueAxis ?? true)}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: String(recharts.valueTickColor ?? "#6b7280"), fontSize: Number(recharts.valueTickFontSize ?? 12) }}
                tickFormatter={(value) => formatChartValue(value, fmt)}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
                tick={{ fill: String(recharts.categoryTickColor ?? "#6b7280"), fontSize: Number(recharts.categoryTickFontSize ?? 12) }}
                tickFormatter={(value: any) => formatCategoryLabel(value)}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
                tick={{ fill: String(recharts.categoryTickColor ?? "#6b7280"), fontSize: Number(recharts.categoryTickFontSize ?? 12) }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: String(recharts.valueTickColor ?? "#6b7280"), fontSize: Number(recharts.valueTickFontSize ?? 12) }}
                tickFormatter={(value) => formatChartValue(value, fmt)}
                width={Number(recharts.valueAxisWidth ?? 56)}
              />
            </>
          )}
          <Tooltip
            cursor={false}
            formatter={(value: any) => formatChartValue(value, fmt)}
            labelFormatter={(_label: any, payload: any) => {
              const first = Array.isArray(payload) ? payload[0] : undefined;
              return first?.payload?.label ?? "";
            }}
          />
          <Bar dataKey="value" radius={Number(recharts.radius ?? 8)}>
            {chartData.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
