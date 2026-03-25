"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useData } from "@/products/bi/json-render/context";
import { formatChartValue, getByPath, getFieldValue, setByPath, useChartInteraction, useChartServerRows, useResolvedChartColors } from "@/products/bi/json-render/components/rechartsShared";

type AnyRecord = Record<string, any>;

export default function JsonRenderPieChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const props = (element?.props as AnyRecord | undefined) || {};
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | undefined) ?? 220;
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const legend = (element?.props?.legend as AnyRecord | undefined) || {};
  const series = (element?.props?.series as AnyRecord | undefined) || {};
  const xFieldName = typeof dq?.xField === "string" ? dq.xField.trim() : "label";
  const yFieldName = typeof dq?.yField === "string" ? dq.yField.trim() : "value";
  const keyFieldName = typeof dq?.keyField === "string" ? dq.keyField.trim() : "key";
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord);
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const legendPosition = String(legend.position ?? legacyRecharts.legendPosition ?? "right").trim().toLowerCase();
  const showLegend = legend.enabled ?? (legacyRecharts.showLegend !== false);
  const innerRadius = series.innerRadius ?? legacyRecharts.innerRadius ?? 0;
  const outerRadius = series.outerRadius ?? legacyRecharts.outerRadius ?? "80%";
  const paddingAngle = series.paddingAngle ?? legacyRecharts.paddingAngle ?? 0;
  const showLabels = series.showLabels ?? legacyRecharts.showLabels;

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      const label = String(getFieldValue(record, xFieldName, ["label", "x"]) ?? "");
      return {
        name: label,
        value: Number(getFieldValue(record, yFieldName, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyFieldName, ["key", xFieldName, "label", "x"]),
      };
    });
  }, [serverRows, xFieldName, yFieldName, keyFieldName]);

  const handleClick = React.useCallback((entry: any) => {
    if (!shouldClickFilter || !resolvedFilterStorePath) return;
    const rawValue = entry?.filterKey;
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
        <PieChart>
          {showTooltip ? <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} /> : null}
          {showLegend && legendPosition !== "none" ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
            />
          ) : null}
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            label={showLabels === true}
            onClick={handleClick}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
