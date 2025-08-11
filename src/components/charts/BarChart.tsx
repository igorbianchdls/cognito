'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps, ChartData } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { nivoTheme } from './theme';

// Valores padrão robustos e flexíveis
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 320;
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 64, left: 64 };
const DEFAULT_PADDING = 0.2;
const DEFAULT_INNER_PADDING = 0;
const DEFAULT_BORDER_RADIUS = 0;
const DEFAULT_BORDER_WIDTH = 0;
const DEFAULT_GROUP_MODE = 'grouped';
const DEFAULT_LAYOUT = 'vertical';
const DEFAULT_ENABLE_GRID_X = true;
const DEFAULT_ENABLE_GRID_Y = true;
const DEFAULT_ENABLE_LABEL = true;
const DEFAULT_ENABLE_TOTALS = false;
const DEFAULT_TOTALS_OFFSET = 10;
const DEFAULT_LABEL_OFFSET = 0;

const defaultTooltip = ({ id, value }: { id: string; value: number }) => (
  <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-sm">
    <div className="font-medium text-gray-900">{id}</div>
    <div className="text-blue-600 font-semibold">{formatValue(Number(value))}</div>
  </div>
);

export function BarChart(props: BarChartProps) {
  const {
    data,
    height = DEFAULT_HEIGHT,
    margin = DEFAULT_MARGIN,
    rowHeight = 100,
    gridHeight = 4,
    minHeight = 300,
    xColumn,
    yColumn,
    enableGridX = DEFAULT_ENABLE_GRID_X,
    enableGridY = DEFAULT_ENABLE_GRID_Y,
    title,
    subtitle,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    backgroundColor = '#fff',
    keys,
    indexBy = 'category'
  } = props;

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Nivo
  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0,
    label: item.x || item.label || 'Unknown'
  }));

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

  // Calcular altura baseada no grid layout
  const baseHeight = gridHeight && rowHeight ? rowHeight * gridHeight : height;

  return (
    <div
      style={{
        width: '100%',
        height: gridHeight && rowHeight ? `${baseHeight}px` : '100%',
        minHeight: '300px',
        background: backgroundColor,
        padding: 0,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
      }}
    >
      {title && (
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: `${titleFontSize}px`, 
          fontWeight: titleFontWeight, 
          color: titleColor
        }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <div style={{ 
          margin: '0 0 16px 0', 
          fontSize: `${subtitleFontSize}px`, 
          color: subtitleColor,
          fontWeight: subtitleFontWeight
        }}>
          {subtitle}
        </div>
      )}
      
      <div
        style={{ 
          flex: 1,
          minHeight: `${minHeight}px`,
          height: '100%'
        }}
      >
        <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
          <ResponsiveBar
          data={chartData}
          keys={['value']}
          indexBy="id"
          
          // Margins reduzidas para evitar overflow
          margin={{ top: 12, right: 12, bottom: 20, left: 50 }}
          padding={0.2}
          
          // Cor elegante
          colors={['#2563eb']}
          
          // Bordas sutis
          borderRadius={4}
          borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
          borderWidth={0}
          
          // Eixos limpos (sem linhas)
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            tickRotation: 0,
            format: (value) => value.toString().slice(0, 10)
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
          
          // Labels elegantes
          enableLabel={false}
          
          animate={true}
          motionConfig="gentle"
          theme={elegantTheme}
          
          // Tooltip elegante
          tooltip={({ id, value }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-900">{id}</div>
              <div className="text-blue-600 font-mono font-medium tabular-nums">
                {formatValue(Number(value))}
              </div>
            </div>
          )}
          />
        </div>
      </div>
    </div>
  );
}