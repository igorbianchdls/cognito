"use client";

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';

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
        axisBottom={{ tickSize: 0, tickPadding: 8, legendOffset: 0 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        theme={theme}
        animate={false}
        tooltip={({ id, value, indexValue }) => (
          <div style={{ padding: '6px 8px' }}>
            <div style={{ fontWeight: 600 }}>{String(indexValue)}</div>
            <div>{String(id)}: {Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
        )}
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
        tooltip={({ value, indexValue }) => (
          <div style={{ padding: '6px 8px' }}>
            <div style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(indexValue)}</div>
            <div>{Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
        )}
      />
    </div>
  );
}

