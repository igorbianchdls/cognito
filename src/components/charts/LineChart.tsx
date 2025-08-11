'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function LineChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Tema elegante inspirado no shadcn/ui
  const elegantTheme = {
    ...nivoTheme,
    axis: {
      ticks: {
        line: { stroke: 'transparent' }, // Remove tick lines
        text: { fontSize: 12, fill: '#6b7280', fontFamily: 'Geist, sans-serif' }
      },
      domain: { line: { stroke: 'transparent' } } // Remove axis lines
    },
    grid: {
      line: { stroke: '#f1f5f9', strokeWidth: 1 } // Grid sutil
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '300px', height: 'auto', minWidth: 0 }}>
      <ResponsiveLine
        data={[
          {
            id: 'series',
            data: data.map(item => ({
              x: item.x || item.label || 'Unknown',
              y: item.y || item.value || 0
            }))
          }
        ]}
        // Margins com espaço para legenda na parte inferior
        margin={{ top: 12, right: 12, bottom: 80, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        
        // Linha elegante
        lineWidth={2}
        colors={['#2563eb']} // Cor elegante
        
        // Pontos sutis
        pointSize={4}
        pointColor={{ from: 'color' }}
        pointBorderWidth={1}
        pointBorderColor={{ from: 'serieColor' }}
        
        // Eixos limpos (sem linhas)
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          format: (value) => value.toString().slice(0, 8)
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          format: (value) => formatValue(Number(value))
        }}
        
        // Grid apenas horizontal
        enableGridX={false}
        enableGridY={true}
        
        // Interação elegante
        useMesh={true}
        animate={true}
        motionConfig="gentle"
        theme={elegantTheme}
        
        // Tooltip elegante
        tooltip={({ point }) => (
          <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
            <div className="font-medium text-gray-900">{point.data.x}</div>
            <div className="text-blue-600 font-mono font-medium tabular-nums">
              {formatValue(Number(point.data.y))}
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
            symbolShape: 'circle',
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