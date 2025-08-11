import { ChartData } from './types';

export function formatValue(value: number): string {
  return Number(value).toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1
  }).format(value / 100);
}

export function getChartTypeName(chartType?: string): string {
  switch (chartType) {
    case 'bar': return 'Bar';
    case 'line': return 'Line';
    case 'pie': return 'Pie';
    case 'scatter': return 'Scatter Plot';
    case 'area': return 'Area';
    case 'heatmap': return 'Heatmap';
    case 'radar': return 'Radar';
    case 'funnel': return 'Funnel';
    case 'treemap': return 'TreeMap';
    case 'stream': return 'Stream';
    default: return 'Chart';
  }
}

export function processDataForChart(
  data: ChartData[], 
  chartType: string, 
  groupBy?: string
): ChartData[] {
  if (!data || data.length === 0) return [];

  if (chartType === 'pie' || groupBy) {
    // Group and aggregate data for pie charts
    const grouped: Record<string, number> = {};
    
    data.forEach(row => {
      const key = String(row.x || row.label || 'Unknown');
      const value = chartType === 'pie' ? 1 : Number(row.y || row.value) || 0;
      grouped[key] = (grouped[key] || 0) + value;
    });

    return Object.entries(grouped)
      .map(([key, value]) => ({
        x: key,
        y: value,
        label: key,
        value: value
      }))
      .sort((a, b) => b.y! - a.y!)
      .slice(0, 10);
  }

  // For other chart types, filter and limit data
  return data
    .filter(row => 
      row.x != null && 
      row.y != null &&
      !isNaN(Number(row.y))
    )
    .slice(0, 50);
}

// EmptyState is now a separate component - see EmptyState.tsx