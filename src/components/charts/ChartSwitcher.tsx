"use client";

import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as BarChartComp } from './BarChart';
import { LineChart as LineChartComp } from './LineChart';
import { AreaChart as AreaChartComp } from './AreaChart';
import { PieChart as PieChartComp } from './PieChart';

type ChartType = 'bar' | 'line' | 'area' | 'pie';

export type ChartSwitcherOptions<T extends Record<string, unknown>> = {
  xKey?: string;
  valueKeys?: string[];
  initialChartType?: ChartType;
  metricLabels?: Record<string, string>;
  title?: string;
  subtitle?: string;
  xLegend?: string;
  yLegend?: string;
  seriesLabel?: string;
  transform?: (rows: T[]) => T[];
  chartTypes?: ChartType[];
  // Date filtering (optional)
  showDateFilter?: boolean; // force show
  onDateRangeChange?: (range: { from?: string; to?: string; preset?: string }) => void | Promise<void>;
};

export function ChartSwitcher<T extends Record<string, unknown>>({
  rows,
  options = {},
}: {
  rows: T[];
  options?: ChartSwitcherOptions<T>;
}) {
  const {
    xKey: xKeyProp,
    valueKeys: valueKeysProp,
    initialChartType = 'bar',
    metricLabels = {},
    title,
    subtitle,
    xLegend,
    yLegend,
    seriesLabel: seriesLabelProp,
    transform,
    chartTypes = ['bar', 'line', 'area', 'pie'],
    showDateFilter = false,
    onDateRangeChange,
  } = options;

  const effectiveRows = useMemo(() => (transform ? transform(rows) : rows), [rows, transform]);

  const sample = effectiveRows[0] ?? {} as T;
  const keys = useMemo(() => Object.keys(sample as Record<string, unknown>), [sample]);

  const autoXKey = useMemo(() => {
    if (xKeyProp) return xKeyProp;
    // prefer a string-like field
    for (const k of keys) {
      const v = (sample as Record<string, unknown>)[k];
      if (typeof v === 'string') return k;
    }
    // fallback to first key
    return keys[0];
  }, [keys, sample, xKeyProp]);

  const autoValueKeys = useMemo(() => {
    if (valueKeysProp && valueKeysProp.length) return valueKeysProp;
    const result: string[] = [];
    for (const k of keys) {
      const v = (sample as Record<string, unknown>)[k];
      if (typeof v === 'number') result.push(k);
      else if (typeof v === 'string') {
        const n = Number(v.replace?.(/[^0-9,.-]/g, '').replace(',', '.') ?? v);
        if (!Number.isNaN(n)) result.push(k);
      }
    }
    return result;
  }, [keys, sample, valueKeysProp]);

  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [metricKey, setMetricKey] = useState<string>(autoValueKeys[0] ?? '');
  const [datePreset, setDatePreset] = useState<string>('');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const metricLabel = metricLabels[metricKey] ?? metricKey;
  const effectiveSeriesLabel = seriesLabelProp ?? metricLabel ?? 'Valor';
  const effectiveXLegend = xLegend ?? autoXKey ?? 'Categoria';
  const effectiveYLegend = yLegend ?? metricLabel ?? 'Valor';

  const chartData = useMemo(() => {
    if (!effectiveRows?.length || !autoXKey || !metricKey) return [] as Array<{ x: string; y: number }>;
    return effectiveRows.map((r) => {
      const xRaw = (r as Record<string, unknown>)[autoXKey];
      const yRaw = (r as Record<string, unknown>)[metricKey];
      const x = typeof xRaw === 'string' ? xRaw : String(xRaw ?? '');
      let y = 0;
      if (typeof yRaw === 'number') y = yRaw;
      else if (typeof yRaw === 'string') {
        const parsed = Number(yRaw.replace?.(/[^0-9,.-]/g, '').replace(',', '.') ?? yRaw);
        y = Number.isFinite(parsed) ? parsed : 0;
      }
      return { x, y };
    });
  }, [effectiveRows, autoXKey, metricKey]);

  const chartTypeOptions = (chartTypes.length ? chartTypes : ['bar', 'line', 'area', 'pie']) as ChartType[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <SelectTrigger size="sm" className="min-w-[160px]">
              <SelectValue placeholder="Tipo de gráfico" />
            </SelectTrigger>
            <SelectContent>
              {chartTypeOptions.includes('bar') && <SelectItem value="bar">Bar</SelectItem>}
              {chartTypeOptions.includes('line') && <SelectItem value="line">Line</SelectItem>}
              {chartTypeOptions.includes('area') && <SelectItem value="area">Area</SelectItem>}
              {chartTypeOptions.includes('pie') && <SelectItem value="pie">Pie</SelectItem>}
            </SelectContent>
          </Select>

          {autoValueKeys.length > 1 && (
            <Select value={metricKey} onValueChange={(v) => setMetricKey(v)}>
              <SelectTrigger size="sm" className="min-w-[160px]">
                <SelectValue placeholder="Métrica" />
              </SelectTrigger>
              <SelectContent>
                {autoValueKeys.map((k) => (
                  <SelectItem key={k} value={k}>{metricLabels[k] ?? k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(showDateFilter || onDateRangeChange) && (
            <>
              <Select
                value={datePreset}
                onValueChange={async (v) => {
                  setDatePreset(v);
                  const today = new Date();
                  const toISO = (d: Date) => d.toISOString().slice(0, 10);
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  if (onDateRangeChange) {
                    if (v === 'all') {
                      await onDateRangeChange({ preset: 'all' });
                    } else if (v === '7d') {
                      const from = new Date(today);
                      from.setDate(today.getDate() - 6);
                      await onDateRangeChange({ from: toISO(from), to: toISO(today), preset: '7d' });
                    } else if (v === '30d') {
                      const from = new Date(today);
                      from.setDate(today.getDate() - 29);
                      await onDateRangeChange({ from: toISO(from), to: toISO(today), preset: '30d' });
                    } else if (v === 'this-month') {
                      await onDateRangeChange({ from: toISO(startOfMonth), to: toISO(today), preset: 'this-month' });
                    }
                  }
                }}
              >
                <SelectTrigger size="sm" className="min-w-[160px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="this-month">Este mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="custom">Personalizado…</SelectItem>
                </SelectContent>
              </Select>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 rounded border border-slate-300 px-2 text-sm"
                  />
                  <span className="text-sm text-slate-500">até</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 rounded border border-slate-300 px-2 text-sm"
                  />
                  <button
                    className="h-8 rounded bg-slate-900 px-3 text-sm text-white hover:bg-slate-800"
                    onClick={async () => {
                      if (onDateRangeChange) {
                        await onDateRangeChange({ from: customFrom || undefined, to: customTo || undefined, preset: 'custom' });
                      }
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="h-[360px] w-full">
        {chartType === 'bar' && (
          <BarChartComp
            data={chartData}
            seriesLabel={effectiveSeriesLabel}
            title={title}
            subtitle={subtitle}
            containerClassName="h-full"
            containerBorderAccentColor="transparent"
            axisBottom={{ legend: effectiveXLegend, legendOffset: 36, tickRotation: -25 }}
            axisLeft={{ legend: effectiveYLegend, legendOffset: -60 }}
            enableLabel
            labelFormat={(v: number) => (Number.isFinite(v) ? String(v) : String(Number(v)))}
          />
        )}
        {chartType === 'line' && (
          <LineChartComp
            data={chartData}
            seriesLabel={effectiveSeriesLabel}
            title={title}
            subtitle={subtitle}
            containerClassName="h-full"
            containerBorderAccentColor="transparent"
            axisBottom={{ legend: effectiveXLegend, legendOffset: 36, tickRotation: -25 }}
            axisLeft={{ legend: effectiveYLegend, legendOffset: -60 }}
            enablePoints
            curve="monotoneX"
          />
        )}
        {chartType === 'area' && (
          <AreaChartComp
            data={chartData}
            xColumn="x"
            yColumn="y"
            title={title}
            subtitle={subtitle}
            containerClassName="h-full"
            containerBorderAccentColor="transparent"
            axisBottom={{ legend: effectiveXLegend, legendOffset: 36, tickRotation: -25 }}
            axisLeft={{ legend: effectiveYLegend, legendOffset: -60 }}
            enableArea
            areaOpacity={0.25}
            curve="monotoneX"
          />
        )}
        {chartType === 'pie' && (
          <PieChartComp
            data={chartData}
            title={title}
            subtitle={subtitle}
            containerClassName="h-full"
            containerBorderAccentColor="transparent"
          />
        )}
      </div>
    </div>
  );
}
