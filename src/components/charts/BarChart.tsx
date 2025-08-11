'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps, ChartData } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { nivoTheme, colorSchemes } from './theme';

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

  // Calcular altura baseada no grid layout
  const calculatedHeight = gridHeight && rowHeight ? rowHeight * gridHeight : height;

  return (
    <div
      style={{
        width: '100%',
        height: gridHeight && rowHeight ? `${calculatedHeight}px` : '100%',
        background: backgroundColor,
        padding: 12,
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
          height: gridHeight && rowHeight ? calculatedHeight : '100%'
        }}
      >
        <ResponsiveBar
          data={chartData}
          keys={['value']}
          indexBy="id"
          margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
          padding={0.2}
          colors={{ scheme: colorSchemes.primary }}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: xColumn || 'X Axis',
            legendPosition: 'middle',
            legendOffset: 50
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yColumn || 'Y Axis',
            legendPosition: 'middle',
            legendOffset: -60,
            format: (value) => formatValue(Number(value))
          }}
          enableLabel={true}
          label={(d) => formatValue(Number(d.value))}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          animate={true}
          motionConfig="gentle"
          theme={nivoTheme}
          tooltip={({ id, value }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded border text-sm">
              <div className="font-semibold">{id}</div>
              <div className="text-blue-600">{formatValue(Number(value))}</div>
            </div>
          )}
        />
      </div>
    </div>
  );
}