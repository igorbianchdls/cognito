"use client";

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { useMemo } from 'react';

const theme = {
  axis: {
    ticks: { text: { fontSize: 11, fill: '#6b7280' } },
    legend: { text: { fontSize: 12, fill: '#374151', fontWeight: 500 } },
  },
  labels: { text: { fontSize: 11, fill: '#374151' } },
  tooltip: {
    container: {
      background: '#fff', color: '#111827', fontSize: 12,
      borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)'
    }
  }
} as const;

export function CashGroupedBar({ data, height = 180 }: { data: Array<{ label: string; entradas: number; saidas: number }>; height?: number }) {
  const chartData = data.map(d => ({ label: d.label, Entradas: d.entradas, Saídas: d.saidas }));
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    chartData.forEach(d => m.set(d.label, (d.Entradas || 0) + (d["Saídas"] || 0)));
    return m;
  }, [chartData]);
  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={chartData}
        keys={["Entradas", "Saídas"]}
        indexBy="label"
        margin={{ top: 10, right: 12, bottom: 30, left: 48 }}
        padding={0.3}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={["#10b981", "#ef4444"]}
        enableLabel={false}
        enableGridY={true}
        axisBottom={{ tickSize: 0, tickPadding: 8, legendOffset: 0 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        theme={theme}
        animate={false}
        legends={[{
          dataFrom: 'keys', anchor: 'bottom', direction: 'row', translateY: 28,
          itemWidth: 80, itemHeight: 12, symbolSize: 10, itemsSpacing: 12,
        }]}
        tooltip={({ id, value, indexValue }) => {
          const tot = totals.get(String(indexValue)) || 0;
          const pct = tot > 0 ? (Number(value || 0) / tot) * 100 : 0;
          return (
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontWeight: 600 }}>{String(indexValue)}</div>
              <div>{String(id)}: {Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div style={{ color: '#6b7280' }}>Participação: {pct.toFixed(1)}%</div>
              <div style={{ color: '#6b7280' }}>Total: {tot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>
          );
        }}
      />
    </div>
  );
}

export function ProjectedLine({ points, height = 180 }: { points: Array<{ x: string; y: number }>; height?: number }) {
  const series = [{ id: 'Saldo Projetado', color: '#2563eb', data: points }];
  return (
    <div style={{ height }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 10, right: 12, bottom: 30, left: 48 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        enablePoints={true}
        pointSize={6}
        useMesh={true}
        enableArea={true}
        areaOpacity={0.2}
        colors={["#2563eb"]}
        theme={theme}
        animate={false}
        tooltip={({ point }) => (
          <div style={{ padding: '6px 8px' }}>
            <div style={{ fontWeight: 600 }}>{String(point.data.x)}</div>
            <div>Saldo: {Number(point.data.y || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
        )}
      />
    </div>
  );
}

export function SimpleHorizontalBar({ items, color = '#64748b', height = 180 }: { items: Array<{ label: string; value: number }>; color?: string; height?: number }) {
  const data = items.map(it => ({ label: it.label, Valor: it.value }));
  const total = useMemo(() => items.reduce((acc, it) => acc + (it.value || 0), 0), [items]);
  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={data}
        keys={["Valor"]}
        indexBy="label"
        layout="horizontal"
        margin={{ top: 10, right: 12, bottom: 10, left: 120 }}
        padding={0.3}
        colors={[color]}
        enableGridY={false}
        enableLabel={false}
        axisBottom={{ tickSize: 0, tickPadding: 6 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        theme={theme}
        animate={false}
        tooltip={({ value, indexValue }) => {
          const v = Number(value || 0);
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(indexValue)}</div>
              <div>Valor: {v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div style={{ color: '#6b7280' }}>Participação: {pct.toFixed(1)}%</div>
              <div style={{ color: '#6b7280' }}>Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>
          );
        }}
      />
    </div>
  );
}

export function MultiLine({
  series,
  height = 220,
}: {
  series: Array<{ id: string; color?: string; points: Array<{ x: string; y: number }> }>;
  height?: number;
}) {
  const data: { id: string; color?: string; data: { x: string; y: number }[] }[] =
    series.map(s => ({ id: s.id, color: s.color, data: s.points }));
  const colors = series.map(s => s.color || undefined).filter(Boolean) as string[];
  return (
    <div style={{ height }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 10, right: 12, bottom: 30, left: 48 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        enablePoints={true}
        pointSize={6}
        useMesh={true}
        enableArea={false}
        colors={colors.length ? colors : undefined}
        theme={theme}
        animate={false}
        legends={[{
          anchor: 'bottom', direction: 'row', translateY: 28, itemWidth: 90, itemHeight: 12, symbolSize: 10, itemsSpacing: 12,
        }]}
      />
    </div>
  );
}
