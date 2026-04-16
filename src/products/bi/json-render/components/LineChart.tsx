"use client";

import * as React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export default function JsonRenderLineChart({ element }: { element: any }) {
  const { data, setData } = useData();
  const gradientId = React.useId();
  const props = (element?.props as AnyRecord | undefined) || {};
  const rootStyle = props.style && typeof props.style === "object" ? props.style as React.CSSProperties : undefined;
  const dq = (element?.props?.dataQuery as AnyRecord | undefined);
  const fmt = (element?.props?.format ?? "number") as "currency" | "percent" | "number";
  const height = (element?.props?.height as number | string | undefined) ?? 220;
  const legacyRecharts = (element?.props?.recharts as AnyRecord | undefined) || {};
  const grid = (element?.props?.grid as AnyRecord | undefined) || {};
  const xAxis = (element?.props?.xAxis as AnyRecord | undefined) || {};
  const yAxis = (element?.props?.yAxis as AnyRecord | undefined) || {};
  const tooltip = (element?.props?.tooltip as AnyRecord | undefined) || {};
  const legend = (element?.props?.legend as AnyRecord | undefined) || {};
  const seriesStyle = getChartStyleSeriesConfig(element?.props?.series);
  const { axisDataKey, keyField, seriesDefs, seriesField, valueDataKey } = getChartRequestFields(props, dq, { defaultSeriesType: "line" });
  const { serverRows, queryError } = useChartServerRows(dq, data as AnyRecord, {
    xField: axisDataKey,
    yField: valueDataKey,
    keyField,
    seriesField,
  });
  const { clearOnSecondClick, resolvedFilterStorePath, shouldClickFilter } = useChartInteraction(element, dq?.dimension);
  const colors = useResolvedChartColors((element?.props?.colors as string[] | undefined) || element?.props?.colorScheme, ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]);
  const showValueAxis = yAxis.hide === true ? false : (legacyRecharts.showValueAxis ?? true);
  const hideCategoryAxis = Boolean(xAxis.hide ?? legacyRecharts.hideCategoryAxis ?? false);
  const showTooltip = tooltip.enabled ?? legacyRecharts.showTooltip ?? true;
  const legendPosition = String(legend.position ?? legacyRecharts.legendPosition ?? "bottom").trim().toLowerCase();
  const showLegend = legend.enabled ?? (legacyRecharts.showLegend ?? seriesDefs.length > 1);
  const showGrid = grid.enabled ?? (legacyRecharts.showGrid ?? true);
  const gridVertical = Boolean(grid.vertical ?? legacyRecharts.gridVertical);
  const gridStroke = String(grid.stroke ?? legacyRecharts.gridStroke ?? "#e5e7eb");
  const gridDasharray = String(grid.strokeDasharray ?? legacyRecharts.gridDasharray ?? "3 3");
  const categoryTickMargin = Number(xAxis.tickMargin ?? legacyRecharts.categoryTickMargin ?? 10);
  const categoryTickColor = String(xAxis.tickColor ?? legacyRecharts.categoryTickColor ?? "#6b7280");
  const categoryTickFontSize = Number(xAxis.tickFontSize ?? legacyRecharts.categoryTickFontSize ?? 12);
  const valueTickMargin = Number(yAxis.tickMargin ?? legacyRecharts.valueTickMargin ?? 8);
  const valueTickColor = String(yAxis.tickColor ?? legacyRecharts.valueTickColor ?? "#6b7280");
  const valueTickFontSize = Number(yAxis.tickFontSize ?? legacyRecharts.valueTickFontSize ?? 12);
  const valueAxisWidth = Number(yAxis.width ?? legacyRecharts.valueAxisWidth ?? 64);
  const strokeWidth = Number(seriesStyle.strokeWidth ?? legacyRecharts.strokeWidth ?? 2);
  const showDots = seriesStyle.showDots ?? legacyRecharts.showDots;
  const activeDot = seriesStyle.activeDot ?? legacyRecharts.activeDot ?? { r: 4 };
  const curve = seriesStyle.curve ?? legacyRecharts.curve ?? "monotone";
  const singleSeriesGradient = seriesStyle.singleSeriesGradient ?? legacyRecharts.singleSeriesGradient;
  const connectNulls = Boolean(seriesStyle.connectNulls ?? legacyRecharts.connectNulls);
  const margin = (element?.props?.margin as AnyRecord | undefined) || legacyRecharts.margin || { top: 10, right: 12, bottom: 12, left: 12 };
  const tooltipContentStyle = tooltip.contentStyle && typeof tooltip.contentStyle === "object" ? tooltip.contentStyle as React.CSSProperties : undefined;
  const tooltipItemStyle = tooltip.itemStyle && typeof tooltip.itemStyle === "object" ? tooltip.itemStyle as React.CSSProperties : undefined;
  const tooltipLabelStyle = tooltip.labelStyle && typeof tooltip.labelStyle === "object" ? tooltip.labelStyle as React.CSSProperties : undefined;
  const legendWrapperStyle = legend.wrapperStyle && typeof legend.wrapperStyle === "object" ? legend.wrapperStyle as React.CSSProperties : undefined;

  const normalizedRows = React.useMemo(() => {
    const src = Array.isArray(serverRows) ? serverRows : [];
    return src.map((row) => {
      const record = row as AnyRecord;
      const normalized: AnyRecord = {
        x: getFieldValue(record, axisDataKey, ["label", "x"]),
        filterKey: getFieldValue(record, keyField, ["key", axisDataKey, "label", "x"]),
        series: seriesField ? String(getFieldValue(record, seriesField, ["series"]) ?? "Series") : "Series",
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
  }, [serverRows, axisDataKey, keyField, seriesField, seriesDefs]);

  const chartData = React.useMemo(() => {
    if (seriesDefs.length > 1) {
      return normalizedRows.map((row) => {
        const next: AnyRecord = {
          x: String(row.x ?? ""),
          filterKey: row.filterKey,
        };
        for (const seriesDef of seriesDefs) {
          next[seriesDef.dataKey] = Number(row[seriesDef.dataKey] ?? 0);
        }
        return next;
      });
    }
    if (!seriesField) {
      const singleSeries = seriesDefs[0]?.dataKey || "value";
      return normalizedRows.map((row) => ({ x: String(row.x ?? ""), [singleSeries]: Number(row[singleSeries] ?? 0), filterKey: row.filterKey }));
    }
    const byX = new Map<string, AnyRecord>();
    normalizedRows.forEach((row) => {
      const key = String(row.x ?? "");
      const current = byX.get(key) || { x: key, filterKey: row.filterKey };
      current[row.series] = Number(row[seriesDefs[0]?.dataKey || "value"] ?? 0);
      byX.set(key, current);
    });
    return Array.from(byX.values());
  }, [normalizedRows, seriesField, seriesDefs]);

  const seriesKeys = React.useMemo(() => {
    if (seriesDefs.length > 1) return seriesDefs.map((seriesDef) => seriesDef.dataKey);
    if (!seriesField) return [seriesDefs[0]?.dataKey || "value"];
    return Array.from(new Set(normalizedRows.map((row) => row.series)));
  }, [normalizedRows, seriesField, seriesDefs]);
  const renderedSeries = React.useMemo(
    () =>
      seriesKeys.map((key, index) => {
        const seriesDef = seriesDefs.find((entry) => entry.dataKey === key);
        return {
          key,
          label: seriesDef?.label ?? key,
          stroke: seriesDef?.color ?? colors[index % colors.length],
          strokeWidth: seriesDef?.strokeWidth ?? strokeWidth,
        };
      }),
    [seriesKeys, seriesDefs, colors, strokeWidth],
  );
  const useSingleSeriesGradient = Boolean(singleSeriesGradient ?? (!seriesField && seriesDefs.length <= 1 && colors.length > 1));

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
    <div style={{ width: "100%", height, ...rootStyle }}>
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
          {showGrid ? <CartesianGrid stroke={gridStroke} strokeDasharray={gridDasharray} vertical={gridVertical} /> : null}
          <XAxis
            dataKey="x"
            hide={hideCategoryAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={categoryTickMargin}
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
          {showTooltip ? <Tooltip formatter={(value: any) => formatChartValue(value, fmt)} contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} /> : null}
          {showLegend && legendPosition !== "none" && seriesKeys.length > 1 ? (
            <Legend
              verticalAlign={legendPosition === "bottom" ? "bottom" : "middle"}
              align={legendPosition === "right" ? "right" : "center"}
              layout={legendPosition === "right" ? "vertical" : "horizontal"}
              wrapperStyle={legendWrapperStyle}
            />
          ) : null}
          {renderedSeries.map((entry) => (
            <Line
              key={entry.key}
              type={curve}
              dataKey={entry.key}
              name={entry.label}
              stroke={useSingleSeriesGradient && renderedSeries.length === 1 ? `url(#${gradientId})` : entry.stroke}
              strokeWidth={entry.strokeWidth}
              dot={showDots === true ? { fill: entry.stroke, stroke: entry.stroke } : false}
              activeDot={activeDot}
              connectNulls={connectNulls}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
