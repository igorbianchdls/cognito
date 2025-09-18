'use client';

import { useState, useEffect } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { KPICard } from '@/components/widgets/KPICard';
import { bigQueryService } from '@/services/bigquery';
import type { Widget } from '../visual-builder/ConfigParser';

// Tipo para dados retornados do BigQuery (copiado de visualization.ts)
type BigQueryRowData = Record<string, unknown>;

// Função para gerar SQL automaticamente (copiada de visualization.ts)
const generateSQL = (tipo: string, x: string, y: string, tabela: string, agregacao?: string): string => {
  const defaultAgregacao = tipo === 'pie' ? 'COUNT' : 'SUM';
  const funcaoAgregacao = agregacao || defaultAgregacao;

  switch (tipo) {
    case 'bar':
    case 'line':
    case 'horizontal-bar':
    case 'area':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${x} LIMIT 50`;
    case 'pie':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT ${x}, COUNT(*) as count FROM ${tabela} GROUP BY ${x} ORDER BY count DESC LIMIT 10`;
      }
      return `SELECT ${x}, ${funcaoAgregacao}(${y}) as ${y} FROM ${tabela} GROUP BY ${x} ORDER BY ${funcaoAgregacao}(${y}) DESC LIMIT 10`;
    case 'kpi':
      if (funcaoAgregacao === 'COUNT') {
        return `SELECT COUNT(*) as total FROM ${tabela}`;
      }
      return `SELECT ${funcaoAgregacao}(${y}) as total FROM ${tabela}`;
    default:
      return `SELECT ${x}, ${y} FROM ${tabela} LIMIT 50`;
  }
};

// Função para processar dados BigQuery (copiada de visualization.ts)
const processDataForChart = (data: BigQueryRowData[], x: string, y: string, tipo: string) => {
  if (tipo === 'kpi') {
    const total = data[0]?.total || 0;
    return { value: Number(total) };
  }

  return data.map(row => ({
    x: String(row[x] || 'N/A'),
    y: Number(row[y] || row.count || 0),
    label: String(row[x] || 'N/A'),
    value: Number(row[y] || row.count || 0)
  }));
};

interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate sample data for fallback
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

  // Fetch real data from BigQuery
  useEffect(() => {
    const fetchData = async () => {
      // Se não tem dataSource, usa dados mock
      if (!widget.dataSource) {
        setData(generateSampleData());
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { table, x, y, aggregation } = widget.dataSource;

        // Gerar SQL automaticamente (mesmo padrão da tool)
        const sqlQuery = generateSQL(widget.type, x, y || 'quantity', table, aggregation);
        console.log('🔍 Generated SQL for widget:', widget.id, sqlQuery);

        // Inicializar BigQuery service se necessário (mesmo padrão da tool)
        if (!bigQueryService['client']) {
          console.log('⚡ Inicializando BigQuery service...');
          await bigQueryService.initialize();
        }

        // Executar query no BigQuery (mesmo padrão da tool)
        console.log('📊 Executando query no BigQuery para widget:', widget.id);
        const result = await bigQueryService.executeQuery({
          query: sqlQuery,
          jobTimeoutMs: 30000
        });

        const rawData = result.data || [];
        console.log(`✅ Widget data fetched: ${rawData.length} records for`, widget.id);

        // Processar dados para formato dos charts (mesmo padrão da tool)
        const processedData = processDataForChart(rawData, x, y || 'quantity', widget.type);
        console.log('🔍 Processed data for widget:', widget.id, processedData);

        setData(processedData);
      } catch (err) {
        console.error('❌ Error fetching widget data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback para dados mock em caso de erro
        setData(generateSampleData());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget.id, widget.dataSource, widget.type]);

  // Preparar dados para charts
  const chartData = data || generateSampleData();
  const kpiValue = widget.type === 'kpi' && data?.value ? data.value : (widget.value || 0);

  const commonChartProps = {
    data: chartData,
    title: widget.title,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: widget.styling?.colors || ['#2563eb'],
    animate: false,
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full w-full p-2 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm">Loading data...</div>
        </div>
      </div>
    );
  }

  // Error state (but still show data with fallback)
  if (error && widget.dataSource) {
    console.warn(`⚠️ Widget ${widget.id} using fallback data due to error:`, error);
  }

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
            currentValue={kpiValue}
            unit={widget.unit}
            success={true}
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