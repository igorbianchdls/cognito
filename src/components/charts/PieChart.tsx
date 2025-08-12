'use client';

import { ResponsivePie } from '@nivo/pie';
import { BaseChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function PieChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Nivo
  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    label: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0
  }));

  // Tema elegante inspirado no shadcn/ui
  const elegantTheme = {
    ...nivoTheme,
    labels: {
      text: { fontSize: 12, fill: '#374151', fontFamily: 'Geist, sans-serif', fontWeight: 500 }
    },
    legends: {
      text: { fontSize: 12, fill: '#6b7280', fontFamily: 'Geist, sans-serif' }
    }
  };

  // Cores elegantes
  const elegantColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];

  return (
    <div style={{ width: '100%', minHeight: '300px', height: 'auto', minWidth: 0 }}>
      <ResponsivePie
        data={chartData}
        
        // Margins com espaço para legenda na parte inferior
        margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
        
        // Estilo elegante
        innerRadius={0.5}
        padAngle={1}
        cornerRadius={2}
        activeOuterRadiusOffset={4}
        
        // Cores elegantes
        colors={elegantColors}
        
        // Bordas sutis
        borderWidth={0}
        
        // Labels elegantes (sem links)
        enableArcLinkLabels={false}
        arcLabelsSkipAngle={15}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
        
        animate={true}
        motionConfig="gentle"
        theme={elegantTheme}
        
        // Tooltip elegante
        tooltip={({ datum }) => (
          <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
            <div className="font-medium text-gray-900">{datum.id}</div>
            <div className="font-mono font-medium tabular-nums" style={{ color: datum.color }}>
              {formatValue(Number(datum.value))}
            </div>
          </div>
        )}
        
        // Legenda horizontal na parte inferior
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 70,
            itemsSpacing: 20,
            itemWidth: 80,
            itemHeight: 18,
            itemDirection: 'left-to-right',
            itemOpacity: 0.8,
            symbolSize: 12,
            symbolShape: 'square',
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1
                }
              }
            ]
          }
        ]}
      />
    </div>
  );
}