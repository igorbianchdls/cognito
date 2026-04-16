"use client";

import * as React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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

export default function JsonRenderPieChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const props = (element?.props as AnyRecord | undefined) || {};
  const rootStyle = props.style && typeof props.style === "object" ? props.style as React.CSSProperties : undefined;
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | string | undefined) ?? 220;
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const legend = (element?.props?.legend as AnyRecord | undefined) || {};
  const seriesStyle = getChartStyleSeriesConfig(element?.props?.series);
  const { categoryDataKey, keyField, seriesDefs, valueDataKey } = getChartRequestFields(props, dq, { defaultSeriesType: "bar" });
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord, {
    xField: categoryDataKey,
    yField: valueDataKey,
    keyField,
  });
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const legendPosition = String(legend.position ?? legacyRecharts.legendPosition ?? "right").trim().toLowerCase();
  const showLegend = legend.enabled ?? (legacyRecharts.showLegend !== false);
  const innerRadius = seriesStyle.innerRadius ?? legacyRecharts.innerRadius ?? 0;
  const outerRadius = seriesStyle.outerRadius ?? legacyRecharts.outerRadius ?? "80%";
  const paddingAngle = seriesStyle.paddingAngle ?? legacyRecharts.paddingAngle ?? 0;
  const showLabels = seriesStyle.showLabels ?? legacyRecharts.showLabels;
  const tooltipContentStyle = tooltip.contentStyle && typeof tooltip.contentStyle === "object" ? tooltip.contentStyle as React.CSSProperties : undefined;
  const tooltipItemStyle = tooltip.itemStyle && typeof tooltip.itemStyle === "object" ? tooltip.itemStyle as React.CSSProperties : undefined;
  const tooltipLabelStyle = tooltip.labelStyle && typeof tooltip.labelStyle === "object" ? tooltip.labelStyle as React.CSSProperties : undefined;
  const legendWrapperStyle = legend.wrapperStyle && typeof legend.wrapperStyle === "object" ? legend.wrapperStyle as React.CSSProperties : undefined;

  const chartData = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    const primarySeries = seriesDefs[0]?.dataKey || "value";
    return src.map((row) => {
      const record = row as AnyRecord;
      const label = String(getFieldValue(record, categoryDataKey, ["label", "x"]) ?? "");
      return {
        name: label,
        value: Number(getFieldValue(record, primarySeries, ["value", "y"]) ?? 0),
        filterKey: getFieldValue(record, keyField, ["key", categoryDataKey, "label", "x"]),
      };
    });
  }, [serverRows, categoryDataKey, keyField, seriesDefs]);

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
    <div style={{ width: "100%", height, ...rootStyle }}>
      {queryError ? <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700">{queryError}</div> : null}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {showTooltip ? <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} /> : null}
          {showLegend && legendPosition !== "none" ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
              wrapperStyle={legendWrapperStyle}
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
