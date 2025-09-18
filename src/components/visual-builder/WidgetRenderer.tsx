'use client';

import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { KPICard } from '@/components/widgets/KPICard';
import type { Widget } from '../visual-builder/ConfigParser';

interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  // Generate sample data for demonstration
  const generateSampleData = () => {
    return [
      { x: 'Jan', y: 65, label: 'January', value: 65 },
      { x: 'Feb', y: 59, label: 'February', value: 59 },
      { x: 'Mar', y: 80, label: 'March', value: 80 },
      { x: 'Apr', y: 81, label: 'April', value: 81 },
      { x: 'May', y: 56, label: 'May', value: 56 },
      { x: 'Jun', y: 55, label: 'June', value: 55 },
    ];
  };

  const commonChartProps = {
    data: generateSampleData(),
    title: widget.title,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: widget.styling?.colors || ['#2563eb'],
    animate: false,
  };

  switch (widget.type) {
    case 'bar':
      return (
        <div className="h-full w-full p-2">
          <BarChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            borderRadius={widget.styling?.borderRadius}
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'line':
      return (
        <div className="h-full w-full p-2">
          <LineChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            lineWidth={2}
            enablePoints={true}
            pointSize={6}
            curve="cardinal"
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'pie':
      return (
        <div className="h-full w-full p-2">
          <PieChart
            {...commonChartProps}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={2}
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'area':
      return (
        <div className="h-full w-full p-2">
          <AreaChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            areaOpacity={0.15}
            lineWidth={2}
            enablePoints={true}
            pointSize={6}
            curve="cardinal"
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'kpi':
      return (
        <div className="h-full w-full p-2">
          <KPICard
            name={widget.title}
            currentValue={widget.value || 0}
            unit={widget.unit}
            kpiContainerBackgroundColor={widget.styling?.backgroundColor}
            kpiValueColor={widget.styling?.textColor}
            kpiValueFontSize={widget.styling?.fontSize}
          />
        </div>
      );

    default:
      return (
        <div className="h-full w-full p-2 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">❓</div>
            <div className="text-sm">Unknown widget type: {widget.type}</div>
          </div>
        </div>
      );
  }
}