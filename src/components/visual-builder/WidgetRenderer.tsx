'use client';

import { useState, useEffect } from 'react';
// SQL viewer removed
import type { ChartConfig as RechartsChartConfig } from '@/components/ui/chart';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { StackedLinesChart } from '@/components/charts/StackedLinesChart';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { PivotBarChart } from '@/components/charts/PivotBarChart';
import { RadialStackedChart } from '@/components/charts/RadialStackedChart';
// Removed unused BarChartMultipleRecharts import
import { KPICard } from '@/components/widgets/KPICard';
import InsightsCard from '@/components/widgets/InsightsCard';
import AlertasCard from '@/components/widgets/AlertasCard';
import RecomendacoesCard from '@/components/widgets/RecomendacoesCard';
import InsightsHeroCarousel from '@/components/widgets/InsightsHeroCarousel';
import InsightsCard2 from '@/components/widgets/InsightsCard2';
import { $insights2 } from '@/stores/nexus/insights2Store';
import { useStore as useNanoStore } from '@nanostores/react';
import { $visualBuilderState } from '@/stores/visualBuilderStore';

// Module-level caches to avoid 'any' casting and persist across mounts
type GroupedCacheValue = { items: Array<{ label: string; [key: string]: string | number }>; series: Array<{ key: string; label: string; color: string }> };
const widgetDataCache = new Map<string, WidgetData>();
const widgetGroupedCache = new Map<string, GroupedCacheValue>();
import type { Widget } from '../visual-builder/ConfigParser';
import type { GlobalFilters } from '@/stores/visualBuilderStore';

// Define chart data types
type ChartDataPoint = {
  x: string;
  y: number;
  label: string;
  value: number;
};

type KPIData = {
  value: number;
  previousValue?: number;
  changePct?: number;
  comparisonLabel?: string;
};

type WidgetData = ChartDataPoint[] | KPIData | null;

interface WidgetRendererProps {
  widget: Widget;
  globalFilters?: GlobalFilters;
}

export default function WidgetRenderer({ widget, globalFilters }: WidgetRendererProps) {
  const insights2State = useNanoStore($insights2);
  const vbState = useNanoStore($visualBuilderState);
  const reloadTick = (vbState.reloadTicks && vbState.reloadTicks[widget.id]) || 0;
  const [data, setData] = useState<WidgetData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed SQL modal state

  // State for stackedbar widgets
  const [multipleData, setMultipleData] = useState<{ items: Array<{ label: string; [key: string]: string | number }>; series: Array<{ key: string; label: string; color: string }> } | null>(null);
  const [multipleLoading, setMultipleLoading] = useState(false);
  const [multipleError, setMultipleError] = useState<string | null>(null);

  // Drill state for pivotbar
  const [pivotDrilled, setPivotDrilled] = useState<{ value: string; dim: string } | null>(null);

  type PivotMeasure = 'faturamento' | 'quantidade' | 'pedidos' | 'itens';
  type PivotGroupedRequest = {
    schema?: string;
    table: string;
    dimension1: string;
    dimension2?: string;
    measure?: PivotMeasure;
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
    limit?: number;
    filter?: { dim: string; value: string };
    filters?: GlobalFilters;
  };

  async function drillPivot(category: string) {
    if (!widget.dataSource) return;
    try {
      setMultipleLoading(true);
      setMultipleError(null);
      const ds = widget.dataSource as Partial<{
        schema: string; table: string; dimension1: string; dimension2: string;
        measure: PivotMeasure; aggregation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'; limit: number;
      }>;
      if (!ds.table) return;
      const dim1 = ds.dimension1 || '';
      const nextDim = ds.dimension2 || dim1;
      const body: PivotGroupedRequest = {
        schema: ds.schema,
        table: ds.table,
        dimension1: nextDim,
        measure: ds.measure,
        aggregation: ds.aggregation,
        limit: ds.limit ?? 10,
        filter: { dim: dim1, value: category },
        filters: globalFilters
      };
      const response = await fetch('/api/dashboard-supabase/grouped', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (result.success) {
        setMultipleData({ items: result.items, series: result.series });
        setPivotDrilled({ value: category, dim: dim1 || 'dim1' });
      } else {
        throw new Error(result.error || 'Failed to fetch drill data');
      }
    } catch (err) {
      setMultipleError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMultipleLoading(false);
    }
  }

  async function drillPivotBack() {
    if (!widget.dataSource) return;
    setPivotDrilled(null);
    try {
      setMultipleLoading(true);
      const ds = widget.dataSource as Partial<{
        schema: string; table: string; dimension1: string; dimension2?: string;
        measure?: PivotMeasure; aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'; limit?: number;
      }>;
      if (!ds.table || !ds.dimension1) return;
      const originalBody: PivotGroupedRequest = {
        schema: ds.schema,
        table: ds.table,
        dimension1: ds.dimension1,
        dimension2: ds.dimension2,
        measure: ds.measure,
        aggregation: ds.aggregation,
        limit: ds.limit,
        filters: globalFilters
      };
      const response = await fetch('/api/dashboard-supabase/grouped', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(originalBody) });
      const result = await response.json();
      if (result.success) {
        setMultipleData({ items: result.items, series: result.series });
      }
    } catch {}
    finally { setMultipleLoading(false); }
  }

  // 🔄 Component initialization log
  console.log('🔄 WidgetRenderer mounted:', {
    id: widget.id,
    type: widget.type,
    hasDataSource: !!widget.dataSource,
    dataSource: widget.dataSource
  });

  // Check if widget type needs BigQuery data
  const needsBigQueryData = (type: string): boolean => {
    return ['bar', 'line', 'pie', 'area', 'kpi'].includes(type);
  };

  // Simple in-memory caches per signature (module-level)
  const dataCache = widgetDataCache;
  const groupedCache = widgetGroupedCache;

  const buildSimpleSignature = () => {
    const ds = (widget.dataSource || {}) as Record<string, unknown>;
    const dr = globalFilters?.dateRange
      ? (
          globalFilters.dateRange.type === 'custom'
            ? { t: globalFilters.dateRange.type, s: globalFilters.dateRange.startDate, e: globalFilters.dateRange.endDate }
            : { t: globalFilters.dateRange.type }
        )
      : undefined;
    return JSON.stringify({
      id: widget.id,
      type: widget.type,
      schema: ds['schema'] || '',
      table: ds['table'] || '',
      x: ds['x'] || ds['dimension'] || '',
      y: ds['y'] || ds['measure'] || '',
      agg: ds['aggregation'] || '',
      dr
    });
  };

  const buildGroupedSignature = () => {
    const ds = (widget.dataSource || {}) as Record<string, unknown>;
    const dr = globalFilters?.dateRange
      ? (
          globalFilters.dateRange.type === 'custom'
            ? { t: globalFilters.dateRange.type, s: globalFilters.dateRange.startDate, e: globalFilters.dateRange.endDate }
            : { t: globalFilters.dateRange.type }
        )
      : undefined;
    return JSON.stringify({
      id: widget.id,
      type: widget.type,
      schema: ds['schema'] || '',
      table: ds['table'] || '',
      d1: ds['dimension1'] || ds['dimension'] || '',
      d2: ds['dimension2'] || '',
      m: ds['measure'] || '',
      agg: ds['aggregation'] || '',
      limit: ds['limit'] || '',
      dr
    });
  };

  // Fetch ONLY BigQuery data - no mock data ever
  useEffect(() => {
    // Skip data fetching for widgets that don't need BigQuery data
    if (!needsBigQueryData(widget.type)) {
      return;
    }
    // Wait until dataSource is available to avoid false error states
    if (!widget.dataSource) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      const sig = buildSimpleSignature();
      if (dataCache.has(sig) && reloadTick === 0) {
        setData(dataCache.get(sig) ?? null);
        setError(null);
        setLoading(false);
        return;
      }
      // Se não tem dataSource, não busca nada
      if (!widget.dataSource) {
        setError('No dataSource configured');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📊 Fetching Supabase data for widget:', widget.id);

        // 📤 API request log
        // Map DSL dimension/measure -> API x/y for simple charts
        const ds = widget.dataSource as Partial<{ schema: string; table: string; x: string; y: string; dimension: string; measure: string; where?: string }>;
        // Send measure expression as 'y' and map dimension -> x
        const mappedDataSource = {
          ...ds,
          ...(ds.dimension ? { x: ds.dimension } : {}),
          ...(ds.measure ? { y: ds.measure } : {}),
        } as Partial<{ schema: string; table: string; x: string; y: string; where?: string }>;

        // Normalize schema/table in case table contains schema prefix
        const normalizeSchemaTable = (src: Partial<{ schema?: string; table?: string }>) => {
          const out: Record<string, unknown> = { ...src };
          const schema = (src.schema || '').toString().trim();
          const table = (src.table || '').toString().trim();
          if (table.includes('.')) {
            const dotIdx = table.indexOf('.');
            const tSchema = table.slice(0, dotIdx);
            const tTable = table.slice(dotIdx + 1);
            if (!schema) {
              out.schema = tSchema;
              out.table = tTable;
            } else {
              // If schema already set and table also has schema, strip duplicate
              out.table = tSchema === schema ? tTable : table.split('.').pop();
            }
          }
          return out;
        };
        const normalizedDataSource = normalizeSchemaTable(mappedDataSource);
        const requestPayload = {
          type: widget.type,
          dataSource: normalizedDataSource,
          filters: globalFilters,
          dateFilter: globalFilters?.dateRange
        };
        console.log('📤 Making API request:', {
          url: '/api/dashboard-supabase',
          payload: requestPayload,
          globalFilters: globalFilters
        });

        // Chamar API route - SOMENTE Supabase
        const response = await fetch('/api/dashboard-supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        const result = await response.json();

        // 📥 API response log
        console.log('📥 API response received:', {
          success: result.success,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data),
          dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
          totalRecords: result.totalRecords,
          error: result.error,
          fullResult: result
        });

        if (result.success) {
          setData(result.data);
          dataCache.set(sig, result.data);
          console.log(`✅ Widget data set successfully:`, {
            widgetId: widget.id,
            totalRecords: result.totalRecords,
            dataSet: result.data,
            sqlQuery: result.sql_query
          });
        } else {
          throw new Error(result.error || 'API request failed');
        }
      } catch (err) {
        console.error('❌ Error fetching widget data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // NO FALLBACK - só dados reais
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget.id, widget.dataSource, reloadTick, globalFilters]);

  // Fetch data for multi-series widgets (stacked/grouped/pivot/compare)
  useEffect(() => {
    if (widget.type !== 'stackedbar' && widget.type !== 'groupedbar' && widget.type !== 'stackedlines' && widget.type !== 'radialstacked' && widget.type !== 'pivotbar') {
      return;
    }
    // Wait until dataSource is available to avoid false error states
    if (!widget.dataSource) {
      setMultipleLoading(false);
      setMultipleError(null);
      return;
    }

    async function fetchGroupedData() {
      const sig = buildGroupedSignature();
      if (groupedCache.has(sig) && reloadTick === 0) {
        setMultipleData(groupedCache.get(sig) ?? null);
        setMultipleError(null);
        setMultipleLoading(false);
        return;
      }
      // widget.dataSource is guaranteed here due to early return above

      try {
        setMultipleLoading(true);
        setMultipleError(null);

        console.log('📊 Fetching grouped data for widget:', widget.id);

        const endpoint = '/api/dashboard-supabase/grouped';
        const dsAnyRaw = (widget.dataSource || {}) as Record<string, unknown>;
        // Normalize schema/table for grouped endpoints as well
        const normalizeSchemaTableAny = (src: Record<string, unknown>) => {
          const out = { ...src } as Record<string, unknown>;
          const schema = (out['schema'] || '').toString().trim();
          const table = (out['table'] || '').toString().trim();
          if (table.includes('.')) {
            const idx = table.indexOf('.');
            const tSchema = table.slice(0, idx);
            const tTable = table.slice(idx + 1);
            if (!schema) {
              out['schema'] = tSchema;
              out['table'] = tTable;
            } else {
              out['table'] = tSchema === schema ? tTable : table.split('.').pop();
            }
          }
          return out;
        };
        const dsAny = normalizeSchemaTableAny(dsAnyRaw);
        const payload = { ...dsAny, filters: globalFilters, dateFilter: globalFilters?.dateRange };
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        console.log('📥 Grouped API response:', result);

        if (result.success) {
          setMultipleData({ items: result.items, series: result.series });
          groupedCache.set(sig, { items: result.items, series: result.series });
        } else {
          throw new Error(result.error || 'Failed to fetch grouped data');
        }
      } catch (err) {
        console.error('❌ Error fetching grouped data:', err);
        setMultipleError(err instanceof Error ? err.message : 'Unknown error');
        setMultipleData(null);
      } finally {
        setMultipleLoading(false);
      }
      }

    fetchGroupedData();
  }, [widget.id, widget.dataSource, reloadTick, globalFilters]);

  // Type guard function for KPI data
  const isKPIData = (data: WidgetData): data is KPIData => {
    return data !== null && !Array.isArray(data) && 'value' in data;
  };

  // Use ONLY BigQuery data - no mock fallbacks
  const chartData = Array.isArray(data) ? data : [];
  const kpiValue = widget.type === 'kpi' && isKPIData(data) ? data.value : 0;
  const kpiPrev = widget.type === 'kpi' && isKPIData(data) ? data.previousValue : undefined;
  const kpiChangePct = widget.type === 'kpi' && isKPIData(data) ? data.changePct : undefined;
  const kpiLabel = widget.type === 'kpi' && isKPIData(data) ? data.comparisonLabel : undefined;

  // 🔧 Data processing log
  console.log('🔧 Data processed for widget:', widget.id, {
    originalData: data,
    chartData: chartData,
    chartDataLength: chartData.length,
    kpiValue: kpiValue,
    isKPIData: isKPIData(data),
    widgetType: widget.type,
    finalState: {
      loading,
      error,
      hasData: !!data
    }
  });

  // Get colors from widget-specific config first, then fall back to generic styling
  const getWidgetColors = () => {
    switch (widget.type) {
      case 'bar':
        return widget.barConfig?.styling?.colors;
      case 'line':
        return widget.lineConfig?.styling?.colors;
      case 'pie':
        return widget.pieConfig?.styling?.colors;
      case 'area':
        return widget.areaConfig?.styling?.colors;
      default:
        return null;
    }
  };

  const commonChartProps = {
    data: chartData,
    title: widget.title,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: getWidgetColors() || widget.styling?.colors || ['#2563eb'],
    animate: false,
  };

  // Loading state - only for BigQuery widgets
  if (needsBigQueryData(widget.type) && loading) {
    return (
      <div className="h-full w-full px-0 py-2 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm">Loading data...</div>
        </div>
      </div>
    );
  }

  // Error state - show error, no fallback data - only for BigQuery widgets
  if (needsBigQueryData(widget.type) && error) {
    return (
      <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-red-50 rounded">
        <div className="text-center text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm font-medium mb-1">Supabase Error</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  // Empty data state - only for BigQuery widgets
  if (needsBigQueryData(widget.type) && !loading && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm font-medium mb-1">No Data</div>
          <div className="text-xs">No records found in Supabase</div>
        </div>
      </div>
    );
  }

  // SQL Debug Button removed

  // Store widget content
  let widgetContent;

  switch (widget.type) {
    case 'bar':
      // Debug: Log glass effect and modern CSS props being passed
      console.log('🎨 WidgetRenderer passing DIRECT CSS props to BarChart:', {
        widgetId: widget.id,
        containerGlassEffect: {
          containerBackground: widget.barConfig?.styling?.containerBackground,
          containerOpacity: widget.barConfig?.styling?.containerOpacity,
          containerBackdropFilter: widget.barConfig?.styling?.containerBackdropFilter,
          containerBoxShadow: widget.barConfig?.styling?.containerBoxShadow,
          containerBorder: widget.barConfig?.styling?.containerBorder
        },
        modernEffects: {
          containerFilter: widget.barConfig?.styling?.containerFilter,
          containerTransform: widget.barConfig?.styling?.containerTransform,
          containerTransition: widget.barConfig?.styling?.containerTransition,
          barBrightness: widget.barConfig?.styling?.barBrightness,
          hoverScale: widget.barConfig?.styling?.hoverScale
        }
      });

      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          <BarChart
            {...commonChartProps}
            {...(widget.barConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.barConfig?.margin || commonChartProps.margin}
            legends={widget.barConfig?.legends}
            showLegend={widget.barConfig?.styling?.showLegend}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.barConfig?.styling?.containerBackground}
            backgroundGradient={widget.barConfig?.styling?.backgroundGradient}
            containerOpacity={widget.barConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.barConfig?.styling?.containerBackdropFilter}
            containerFilter={widget.barConfig?.styling?.containerFilter}
            containerBoxShadow={widget.barConfig?.styling?.containerBoxShadow}
            containerTransform={widget.barConfig?.styling?.containerTransform}
            containerTransition={widget.barConfig?.styling?.containerTransition}
            // Bar Visual Effects - CSS Only
            barBrightness={widget.barConfig?.styling?.barBrightness}
            barSaturate={widget.barConfig?.styling?.barSaturate}
            barContrast={widget.barConfig?.styling?.barContrast}
            barBlur={widget.barConfig?.styling?.barBlur}
            barBoxShadow={widget.barConfig?.styling?.barBoxShadow}
            hoverBrightness={widget.barConfig?.styling?.hoverBrightness}
            hoverSaturate={widget.barConfig?.styling?.hoverSaturate}
            hoverScale={widget.barConfig?.styling?.hoverScale}
            hoverBlur={widget.barConfig?.styling?.hoverBlur}
            transitionDuration={widget.barConfig?.styling?.transitionDuration}
            transitionEasing={widget.barConfig?.styling?.transitionEasing}
            // Typography props - Title (TODAS)
            titleFontFamily={widget.barConfig?.styling?.titleFontFamily}
            titleFontSize={widget.barConfig?.styling?.titleFontSize}
            titleFontWeight={widget.barConfig?.styling?.titleFontWeight}
            titleColor={widget.barConfig?.styling?.titleColor}
            titleMarginTop={widget.barConfig?.styling?.titleMarginTop}
            titleMarginLeft={widget.barConfig?.styling?.titleMarginLeft}
            titleMarginBottom={widget.barConfig?.styling?.titleMarginBottom}
            
            // Typography props - Subtitle (TODAS)
            subtitleFontFamily={widget.barConfig?.styling?.subtitleFontFamily}
            subtitleFontSize={widget.barConfig?.styling?.subtitleFontSize}
            subtitleFontWeight={widget.barConfig?.styling?.subtitleFontWeight}
            subtitleColor={widget.barConfig?.styling?.subtitleColor}
            subtitleMarginTop={widget.barConfig?.styling?.subtitleMarginTop}
            subtitleMarginLeft={widget.barConfig?.styling?.subtitleMarginLeft}
            subtitleMarginBottom={widget.barConfig?.styling?.subtitleMarginBottom}
            // Fallback to styling props if barConfig not provided
            enableGridX={widget.barConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.barConfig?.styling?.enableGridY ?? true}
            gridColor={widget.barConfig?.styling?.gridColor}
            gridStrokeWidth={widget.barConfig?.styling?.gridStrokeWidth}
            borderRadius={widget.barConfig?.styling?.borderRadius ?? widget.styling?.borderRadius}
            backgroundColor={widget.barConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
            // Positioning props
            translateY={widget.barConfig?.styling?.translateY}
            marginBottom={widget.barConfig?.styling?.marginBottom}
          />
        </div>
      );
      break;

    case 'line':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          <LineChart
            {...commonChartProps}
            {...(widget.lineConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.lineConfig?.margin || commonChartProps.margin}
            legends={widget.lineConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.lineConfig?.styling?.containerBackground}
            backgroundGradient={widget.lineConfig?.styling?.backgroundGradient}
            containerOpacity={widget.lineConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.lineConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.lineConfig?.styling?.containerBoxShadow}
            // Fallback to default props if lineConfig not provided
            enableGridX={widget.lineConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.lineConfig?.styling?.enableGridY ?? true}
            lineWidth={widget.lineConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.lineConfig?.styling?.enablePoints ?? true}
            pointSize={widget.lineConfig?.styling?.pointSize ?? 6}
            curve={widget.lineConfig?.styling?.curve ?? "cardinal"}
            backgroundColor={widget.lineConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
            // Positioning props
            translateY={widget.lineConfig?.styling?.translateY}
            marginBottom={widget.lineConfig?.styling?.marginBottom}
          />
        </div>
      );
      break;

    case 'pie':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          <PieChart
            {...commonChartProps}
            {...(widget.pieConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.pieConfig?.margin || commonChartProps.margin}
            legends={widget.pieConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.pieConfig?.styling?.containerBackground}
            backgroundGradient={widget.pieConfig?.styling?.backgroundGradient}
            containerOpacity={widget.pieConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.pieConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.pieConfig?.styling?.containerBoxShadow}
            // Fallback to default props if pieConfig not provided
            innerRadius={widget.pieConfig?.styling?.innerRadius ?? 0.5}
            padAngle={widget.pieConfig?.styling?.padAngle ?? 1}
            cornerRadius={widget.pieConfig?.styling?.cornerRadius ?? 2}
            backgroundColor={widget.pieConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
            // Positioning props
            translateY={widget.pieConfig?.styling?.translateY}
            marginBottom={widget.pieConfig?.styling?.marginBottom}
          />
        </div>
      );
      break;

    case 'area':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          <AreaChart
            {...commonChartProps}
            {...(widget.areaConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.areaConfig?.margin || commonChartProps.margin}
            legends={widget.areaConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.areaConfig?.styling?.containerBackground}
            backgroundGradient={widget.areaConfig?.styling?.backgroundGradient}
            containerOpacity={widget.areaConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.areaConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.areaConfig?.styling?.containerBoxShadow}
            // Fallback to default props if areaConfig not provided
            enableGridX={widget.areaConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.areaConfig?.styling?.enableGridY ?? true}
            areaOpacity={widget.areaConfig?.styling?.areaOpacity ?? 0.15}
            lineWidth={widget.areaConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.areaConfig?.styling?.enablePoints ?? true}
            pointSize={widget.areaConfig?.styling?.pointSize ?? 6}
            curve={widget.areaConfig?.styling?.curve ?? "cardinal"}
            backgroundColor={widget.areaConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
            // Positioning props
            translateY={widget.areaConfig?.styling?.translateY}
            marginBottom={widget.areaConfig?.styling?.marginBottom}
          />
        </div>
      );
      break;

    case 'kpi':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          <KPICard
            variant="tile"
            name={widget.title}
            currentValue={kpiValue}
            previousValue={kpiPrev}
            changePct={kpiChangePct}
            comparisonLabel={kpiLabel}
            unit={widget.unit || widget.kpiConfig?.unit}
            success={true}
            {...(widget.kpiConfig || {})}
            // Fallback to styling props if kpiConfig not provided
            kpiContainerBackgroundColor={widget.kpiConfig?.kpiContainerBackgroundColor || widget.styling?.backgroundColor}
            kpiValueColor={widget.kpiConfig?.kpiValueColor || widget.styling?.textColor}
            kpiValueFontSize={widget.kpiConfig?.kpiValueFontSize || widget.styling?.fontSize}
          />
        </div>
      );
      break;

    case 'insights':
      widgetContent = (
        <div className="h-full w-full px-0 py-2">
          <InsightsCard
            title={widget.title}
            useGlobalStore={widget.insightsConfig?.useGlobalStore ?? true}
            {...(widget.insightsConfig || {})}
            titleFontFamily={widget.insightsConfig?.titleFontFamily}
            titleFontSize={widget.insightsConfig?.titleFontSize}
            titleFontWeight={widget.insightsConfig?.titleFontWeight}
            titleColor={widget.insightsConfig?.titleColor}
          />
        </div>
      );
      break;

    case 'alerts':
      widgetContent = (
        <div className="h-full w-full px-0 py-2">
          <AlertasCard
            title={widget.title}
            useGlobalStore={widget.alertsConfig?.useGlobalStore ?? true}
            {...(widget.alertsConfig || {})}
            // Typography props - Title
            titleFontFamily={widget.alertsConfig?.titleFontFamily}
            titleFontSize={widget.alertsConfig?.titleFontSize}
            titleFontWeight={widget.alertsConfig?.titleFontWeight}
            titleColor={widget.alertsConfig?.titleColor}
          />
        </div>
      );
      break;

    case 'insightsHero': {
      const items = widget.insightsHeroConfig?.items || [
        { id: 'i1', headline: '+78%', title: 'increase in your revenue by end of this month is forecasted.', description: 'Asep is about to receive 15K new customers which results in 78% increase in revenue.', rangeLabel: 'This Week' },
        { id: 'i2', headline: '+24%', title: 'expected uplift in mobile conversion compared to last week.', description: 'Evening cohort 20–22h continues to outperform other slots.', rangeLabel: 'This Week' },
        { id: 'i3', headline: '–12%', title: 'drop in bounce rate after homepage UX update.', description: 'Engagement improved across organic traffic and returning users.', rangeLabel: 'This Month' },
      ]

      widgetContent = (
        <div className="h-full w-full px-0 py-2">
          <InsightsHeroCarousel
            items={items}
            variant={widget.insightsHeroConfig?.variant || 'aurora'}
            autoplay={widget.insightsHeroConfig?.autoplayDelay ? { delay: widget.insightsHeroConfig.autoplayDelay } : false}
            loop={widget.insightsHeroConfig?.loop ?? true}
            showArrows={widget.insightsHeroConfig?.showArrows ?? true}
          />
        </div>
      )
      break;
    }

    case 'recommendations':
      widgetContent = (
        <div className="h-full w-full px-0 py-2">
          <RecomendacoesCard
            title={widget.title}
            useGlobalStore={widget.recommendationsConfig?.useGlobalStore ?? true}
            {...(widget.recommendationsConfig || {})}
            // Typography props - Title
            titleFontFamily={widget.recommendationsConfig?.titleFontFamily}
            titleFontSize={widget.recommendationsConfig?.titleFontSize}
            titleFontWeight={widget.recommendationsConfig?.titleFontWeight}
            titleColor={widget.recommendationsConfig?.titleColor}
          />
        </div>
      );
      break;

    case 'insights2': {
      // Try to infer dashboardId from URL (query string)
      let dashboardId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const sp = new URLSearchParams(window.location.search);
          dashboardId = sp.get('dashboardId');
        } catch {}
      }
      const itemsFromStore = dashboardId ? insights2State[dashboardId]?.[widget.id]?.items : undefined;
      const items = itemsFromStore || widget.insights2Config?.items || [];
      const styling = widget.insights2Config?.styling || {};
      widgetContent = (
        <div className="h-full w-full px-0 py-2">
          <InsightsCard2
            title={widget.insights2Config?.title || widget.title || 'Insights'}
            items={items}
            compact={styling.compact ?? true}
            backgroundColor={styling.backgroundColor}
            backgroundOpacity={styling.backgroundOpacity}
            borderColor={styling.borderColor}
            borderRadius={styling.borderRadius}
            bodyFontFamily={styling.bodyFontFamily}
            bodyTextColor={styling.bodyTextColor}
            titleFontFamily={styling.titleFontFamily}
            titleFontSize={styling.titleFontSize}
            titleFontWeight={styling.titleFontWeight}
            titleColor={styling.titleColor}
            titleMarginBottom={styling.titleMarginBottom}
          />
        </div>
      );
      break;
    }

    case 'stackedbar':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading grouped data...</div>
            </div>
          </div>
        );
      } else if (multipleError) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{multipleError}</div>
            </div>
          </div>
        );
      } else if (multipleData && multipleData.items.length > 0) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 relative group">
            
            <StackedBarChart
              {...(widget.stackedBarConfig?.styling || {})}
              // Pass margin and legends from JSON config
              margin={widget.stackedBarConfig?.margin}
              legends={widget.stackedBarConfig?.legends}
              // Orientation (vertical | horizontal)
              layout={widget.stackedBarConfig?.styling?.layout || 'vertical'}
              // Data props (override any styling defaults)
              data={multipleData.items}
              keys={multipleData.series.map(s => s.key)}
              title={widget.title || 'Chart'}
              colors={multipleData.series.map(s => s.color)}
              seriesMetadata={multipleData.series}
              // Container Glass Effect & Modern Styles
              containerBackground={widget.stackedBarConfig?.styling?.containerBackground}
              backgroundGradient={widget.stackedBarConfig?.styling?.backgroundGradient}
              containerOpacity={widget.stackedBarConfig?.styling?.containerOpacity}
              containerBackdropFilter={widget.stackedBarConfig?.styling?.containerBackdropFilter}
              containerFilter={widget.stackedBarConfig?.styling?.containerFilter}
              containerBoxShadow={widget.stackedBarConfig?.styling?.containerBoxShadow}
              containerTransform={widget.stackedBarConfig?.styling?.containerTransform}
              containerTransition={widget.stackedBarConfig?.styling?.containerTransition}
              // Bar Visual Effects
              barBrightness={widget.stackedBarConfig?.styling?.barBrightness}
              barSaturate={widget.stackedBarConfig?.styling?.barSaturate}
              barContrast={widget.stackedBarConfig?.styling?.barContrast}
              barBlur={widget.stackedBarConfig?.styling?.barBlur}
              barBoxShadow={widget.stackedBarConfig?.styling?.barBoxShadow}
              hoverBrightness={widget.stackedBarConfig?.styling?.hoverBrightness}
              hoverSaturate={widget.stackedBarConfig?.styling?.hoverSaturate}
              hoverScale={widget.stackedBarConfig?.styling?.hoverScale}
              hoverBlur={widget.stackedBarConfig?.styling?.hoverBlur}
              transitionDuration={widget.stackedBarConfig?.styling?.transitionDuration}
              transitionEasing={widget.stackedBarConfig?.styling?.transitionEasing}
              // Typography - Title
              titleFontFamily={widget.stackedBarConfig?.styling?.titleFontFamily}
              titleFontSize={widget.stackedBarConfig?.styling?.titleFontSize}
              titleFontWeight={widget.stackedBarConfig?.styling?.titleFontWeight}
              titleColor={widget.stackedBarConfig?.styling?.titleColor}
              titleMarginTop={widget.stackedBarConfig?.styling?.titleMarginTop}
              titleMarginLeft={widget.stackedBarConfig?.styling?.titleMarginLeft}
              titleMarginBottom={widget.stackedBarConfig?.styling?.titleMarginBottom}
              // Typography - Subtitle
              subtitleFontFamily={widget.stackedBarConfig?.styling?.subtitleFontFamily}
              subtitleFontSize={widget.stackedBarConfig?.styling?.subtitleFontSize}
              subtitleFontWeight={widget.stackedBarConfig?.styling?.subtitleFontWeight}
              subtitleColor={widget.stackedBarConfig?.styling?.subtitleColor}
              subtitleMarginTop={widget.stackedBarConfig?.styling?.subtitleMarginTop}
              subtitleMarginLeft={widget.stackedBarConfig?.styling?.subtitleMarginLeft}
              subtitleMarginBottom={widget.stackedBarConfig?.styling?.subtitleMarginBottom}
              // Grid & Style
              enableGridX={widget.stackedBarConfig?.styling?.enableGridX ?? false}
              enableGridY={widget.stackedBarConfig?.styling?.enableGridY ?? true}
              gridColor={widget.stackedBarConfig?.styling?.gridColor}
              gridStrokeWidth={widget.stackedBarConfig?.styling?.gridStrokeWidth}
              borderRadius={widget.stackedBarConfig?.styling?.borderRadius}
              backgroundColor={widget.stackedBarConfig?.styling?.backgroundColor}
              // Positioning
              translateY={widget.stackedBarConfig?.styling?.translateY}
              marginBottom={widget.stackedBarConfig?.styling?.marginBottom}
              // Container Border
              containerBorderWidth={widget.stackedBarConfig?.styling?.containerBorderWidth}
              containerBorderColor={widget.stackedBarConfig?.styling?.containerBorderColor}
              containerBorderAccentColor={widget.stackedBarConfig?.styling?.containerBorderAccentColor}
              containerBorderRadius={widget.stackedBarConfig?.styling?.containerBorderRadius}
              containerBorderVariant={widget.stackedBarConfig?.styling?.containerBorderVariant}
              containerPadding={widget.stackedBarConfig?.styling?.containerPadding}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No grouped data available</div>
            </div>
          </div>
        );
      }
      break;

    case 'groupedbar':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading grouped data...</div>
            </div>
          </div>
        );
      } else if (multipleError) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{multipleError}</div>
            </div>
          </div>
        );
      } else if (multipleData && multipleData.items.length > 0) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 relative group">
            <GroupedBarChart
              {...(widget.groupedBarConfig?.styling || {})}
              // Pass margin and legends from JSON config
              margin={widget.groupedBarConfig?.margin}
              legends={widget.groupedBarConfig?.legends}
              // Orientation (vertical | horizontal)
              layout={widget.groupedBarConfig?.styling?.layout || 'vertical'}
              // Data props (override any styling defaults)
              data={multipleData.items}
              keys={multipleData.series.map(s => s.key)}
              title={widget.title || 'Chart'}
              colors={(widget.groupedBarConfig?.styling?.colors as string[] | undefined)?.length
                ? multipleData.series.map((s, i) => (widget.groupedBarConfig?.styling?.colors as string[])[i] || s.color)
                : multipleData.series.map(s => s.color)
              }
              seriesMetadata={(widget.groupedBarConfig?.styling?.colors as string[] | undefined)?.length
                ? multipleData.series.map((s, i) => ({ ...s, color: (widget.groupedBarConfig?.styling?.colors as string[])[i] || s.color }))
                : multipleData.series
              }
              // Container Glass Effect & Modern Styles
              containerBackground={widget.groupedBarConfig?.styling?.containerBackground}
              backgroundGradient={widget.groupedBarConfig?.styling?.backgroundGradient}
              containerOpacity={widget.groupedBarConfig?.styling?.containerOpacity}
              containerBackdropFilter={widget.groupedBarConfig?.styling?.containerBackdropFilter}
              containerFilter={widget.groupedBarConfig?.styling?.containerFilter}
              containerBoxShadow={widget.groupedBarConfig?.styling?.containerBoxShadow}
              containerTransform={widget.groupedBarConfig?.styling?.containerTransform}
              containerTransition={widget.groupedBarConfig?.styling?.containerTransition}
              // Bar Visual Effects
              barBrightness={widget.groupedBarConfig?.styling?.barBrightness}
              barSaturate={widget.groupedBarConfig?.styling?.barSaturate}
              barContrast={widget.groupedBarConfig?.styling?.barContrast}
              barBlur={widget.groupedBarConfig?.styling?.barBlur}
              barBoxShadow={widget.groupedBarConfig?.styling?.barBoxShadow}
              hoverBrightness={widget.groupedBarConfig?.styling?.hoverBrightness}
              hoverSaturate={widget.groupedBarConfig?.styling?.hoverSaturate}
              hoverScale={widget.groupedBarConfig?.styling?.hoverScale}
              hoverBlur={widget.groupedBarConfig?.styling?.hoverBlur}
              transitionDuration={widget.groupedBarConfig?.styling?.transitionDuration}
              transitionEasing={widget.groupedBarConfig?.styling?.transitionEasing}
              // Typography - Title
              titleFontFamily={widget.groupedBarConfig?.styling?.titleFontFamily}
              titleFontSize={widget.groupedBarConfig?.styling?.titleFontSize}
              titleFontWeight={widget.groupedBarConfig?.styling?.titleFontWeight}
              titleColor={widget.groupedBarConfig?.styling?.titleColor}
              titleMarginTop={widget.groupedBarConfig?.styling?.titleMarginTop}
              titleMarginLeft={widget.groupedBarConfig?.styling?.titleMarginLeft}
              titleMarginBottom={widget.groupedBarConfig?.styling?.titleMarginBottom}
              // Typography - Subtitle
              subtitleFontFamily={widget.groupedBarConfig?.styling?.subtitleFontFamily}
              subtitleFontSize={widget.groupedBarConfig?.styling?.subtitleFontSize}
              subtitleFontWeight={widget.groupedBarConfig?.styling?.subtitleFontWeight}
              subtitleColor={widget.groupedBarConfig?.styling?.subtitleColor}
              subtitleMarginTop={widget.groupedBarConfig?.styling?.subtitleMarginTop}
              subtitleMarginLeft={widget.groupedBarConfig?.styling?.subtitleMarginLeft}
              subtitleMarginBottom={widget.groupedBarConfig?.styling?.subtitleMarginBottom}
              // Grid & Style
              enableGridX={widget.groupedBarConfig?.styling?.enableGridX ?? false}
              enableGridY={widget.groupedBarConfig?.styling?.enableGridY ?? true}
              gridColor={widget.groupedBarConfig?.styling?.gridColor}
              gridStrokeWidth={widget.groupedBarConfig?.styling?.gridStrokeWidth}
              borderRadius={widget.groupedBarConfig?.styling?.borderRadius}
              backgroundColor={widget.groupedBarConfig?.styling?.backgroundColor}
              // Positioning
              translateY={widget.groupedBarConfig?.styling?.translateY}
              marginBottom={widget.groupedBarConfig?.styling?.marginBottom}
              // Container Border
              containerBorderWidth={widget.groupedBarConfig?.styling?.containerBorderWidth}
              containerBorderColor={widget.groupedBarConfig?.styling?.containerBorderColor}
              containerBorderAccentColor={widget.groupedBarConfig?.styling?.containerBorderAccentColor}
              containerBorderRadius={widget.groupedBarConfig?.styling?.containerBorderRadius}
              containerBorderVariant={widget.groupedBarConfig?.styling?.containerBorderVariant}
              containerPadding={widget.groupedBarConfig?.styling?.containerPadding}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No grouped data available</div>
            </div>
          </div>
        );
      }
      break;
    case 'pivotbar':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading grouped data...</div>
            </div>
          </div>
        );
      } else if (multipleError) {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{multipleError}</div>
            </div>
          </div>
        );
      } else if (multipleData && multipleData.items.length > 0) {
        const keys = multipleData.series.map(s => s.key);
        const seriesMetadata = multipleData.series;
        widgetContent = (
          <div className="h-full w-full px-0 py-2 relative group">
            {pivotDrilled && (
              <button onClick={drillPivotBack} className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border border-gray-200 rounded shadow">Voltar</button>
            )}
            <PivotBarChart
              items={multipleData.items}
              keys={keys}
              seriesMetadata={seriesMetadata}
              title={widget.title}
              // Typography
              titleFontFamily={widget.pivotBarConfig?.styling?.titleFontFamily}
              titleFontSize={widget.pivotBarConfig?.styling?.titleFontSize}
              titleFontWeight={widget.pivotBarConfig?.styling?.titleFontWeight}
              titleColor={widget.pivotBarConfig?.styling?.titleColor}
              subtitleFontFamily={widget.pivotBarConfig?.styling?.subtitleFontFamily}
              subtitleFontSize={widget.pivotBarConfig?.styling?.subtitleFontSize}
              subtitleFontWeight={widget.pivotBarConfig?.styling?.subtitleFontWeight}
              subtitleColor={widget.pivotBarConfig?.styling?.subtitleColor}
              showLegend={pivotDrilled ? false : undefined}
              layout={widget.pivotBarConfig?.styling?.layout || 'vertical'}
              groupMode={widget.pivotBarConfig?.styling?.groupMode || 'grouped'}
              enableGridX={widget.pivotBarConfig?.styling?.enableGridX}
              enableGridY={widget.pivotBarConfig?.styling?.enableGridY}
              gridColor={widget.pivotBarConfig?.styling?.gridColor}
              gridStrokeWidth={widget.pivotBarConfig?.styling?.gridStrokeWidth}
              borderRadius={widget.pivotBarConfig?.styling?.borderRadius}
              borderWidth={widget.pivotBarConfig?.styling?.borderWidth}
              containerBackground={widget.pivotBarConfig?.styling?.containerBackground}
              containerOpacity={widget.pivotBarConfig?.styling?.containerOpacity}
              containerBackdropFilter={widget.pivotBarConfig?.styling?.containerBackdropFilter}
              containerFilter={widget.pivotBarConfig?.styling?.containerFilter}
              containerBoxShadow={widget.pivotBarConfig?.styling?.containerBoxShadow}
              containerBorder={widget.pivotBarConfig?.styling?.containerBorder}
              containerTransform={widget.pivotBarConfig?.styling?.containerTransform}
              containerTransition={widget.pivotBarConfig?.styling?.containerTransition}
              containerBorderWidth={widget.pivotBarConfig?.styling?.containerBorderWidth}
              containerBorderColor={widget.pivotBarConfig?.styling?.containerBorderColor}
              containerBorderAccentColor={widget.pivotBarConfig?.styling?.containerBorderAccentColor}
              containerBorderRadius={widget.pivotBarConfig?.styling?.containerBorderRadius}
              containerBorderVariant={widget.pivotBarConfig?.styling?.containerBorderVariant}
              containerPadding={widget.pivotBarConfig?.styling?.containerPadding}
              onBarClick={(category) => drillPivot(category)}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No grouped data available</div>
            </div>
          </div>
        );
      }
      break;

    case 'radialstacked':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading grouped data...</div>
            </div>
          </div>
        );
      } else if (multipleError) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{multipleError}</div>
            </div>
          </div>
        );
      } else if (multipleData && multipleData.items.length > 0) {
        const keys = multipleData.series.map(s => s.key);
        const totals: Record<string, number> = {};
        keys.forEach(k => { totals[k] = 0; });
        multipleData.items.forEach(item => {
          keys.forEach(k => { totals[k] += Number(item[k] || 0) || 0; });
        });
        const dataRow: Record<string, number> = keys.reduce((acc, k) => ({ ...acc, [k]: totals[k] }), {} as Record<string, number>);

        const config: RechartsChartConfig = multipleData.series.reduce((acc, s) => {
          acc[s.key] = { label: s.label, color: s.color };
          return acc;
        }, {} as RechartsChartConfig);

        widgetContent = (
          <div className="h-full w-full p-2 relative group">
            <RadialStackedChart
              data={dataRow}
              keys={keys}
              config={config}
              className="max-w-[320px]"
              title={widget.title || 'Radial Stacked'}
              // Typography
              titleFontFamily={widget.radialStackedConfig?.styling?.titleFontFamily}
              titleFontSize={widget.radialStackedConfig?.styling?.titleFontSize}
              titleFontWeight={widget.radialStackedConfig?.styling?.titleFontWeight}
              titleColor={widget.radialStackedConfig?.styling?.titleColor}
              subtitleFontFamily={widget.radialStackedConfig?.styling?.subtitleFontFamily}
              subtitleFontSize={widget.radialStackedConfig?.styling?.subtitleFontSize}
              subtitleFontWeight={widget.radialStackedConfig?.styling?.subtitleFontWeight}
              subtitleColor={widget.radialStackedConfig?.styling?.subtitleColor}
              containerBackground={widget.radialStackedConfig?.styling?.containerBackground || '#ffffff'}
              containerBorderColor={widget.radialStackedConfig?.styling?.containerBorderColor || '#e5e7eb'}
              containerBorderWidth={widget.radialStackedConfig?.styling?.containerBorderWidth ?? 1}
              containerBorderRadius={widget.radialStackedConfig?.styling?.containerBorderRadius ?? 12}
              containerBorderVariant={widget.radialStackedConfig?.styling?.containerBorderVariant}
              containerBorderAccentColor={widget.radialStackedConfig?.styling?.containerBorderAccentColor}
              containerPadding={widget.radialStackedConfig?.styling?.containerPadding}
              startAngle={widget.radialStackedConfig?.styling?.startAngle}
              endAngle={widget.radialStackedConfig?.styling?.endAngle}
              innerRadius={widget.radialStackedConfig?.styling?.innerRadius}
              outerRadius={widget.radialStackedConfig?.styling?.outerRadius}
              cornerRadius={widget.radialStackedConfig?.styling?.cornerRadius}
              stackId={widget.radialStackedConfig?.styling?.stackId}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No grouped data available</div>
            </div>
          </div>
        );
      }
      break;

    case 'stackedlines':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading grouped data...</div>
            </div>
          </div>
        );
      } else if (multipleError) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{multipleError}</div>
            </div>
          </div>
        );
      } else if (multipleData && multipleData.items.length > 0) {
        widgetContent = (
          <div className="h-full w-full p-2 relative group">
            <StackedLinesChart
              {...(widget.stackedLinesConfig?.styling || {})}
              margin={widget.stackedLinesConfig?.margin}
              legends={widget.stackedLinesConfig?.legends}
              data={multipleData.items}
              keys={multipleData.series.map(s => s.key)}
              title={widget.title || 'Chart'}
              colors={multipleData.series.map(s => s.color)}
              seriesMetadata={multipleData.series}
              // Container styles
              containerBackground={widget.stackedLinesConfig?.styling?.containerBackground}
              backgroundGradient={widget.stackedLinesConfig?.styling?.backgroundGradient}
              containerOpacity={widget.stackedLinesConfig?.styling?.containerOpacity}
              containerBackdropFilter={widget.stackedLinesConfig?.styling?.containerBackdropFilter}
              containerBoxShadow={widget.stackedLinesConfig?.styling?.containerBoxShadow}
              containerTransform={widget.stackedLinesConfig?.styling?.containerTransform}
              containerTransition={widget.stackedLinesConfig?.styling?.containerTransition}
              // Grid & axis
              enableGridX={widget.stackedLinesConfig?.styling?.enableGridX ?? false}
              enableGridY={widget.stackedLinesConfig?.styling?.enableGridY ?? true}
              gridColor={widget.stackedLinesConfig?.styling?.gridColor}
              gridStrokeWidth={widget.stackedLinesConfig?.styling?.gridStrokeWidth}
              // Typography - Title
              titleFontFamily={widget.stackedLinesConfig?.styling?.titleFontFamily}
              titleFontSize={widget.stackedLinesConfig?.styling?.titleFontSize}
              titleFontWeight={widget.stackedLinesConfig?.styling?.titleFontWeight}
              titleColor={widget.stackedLinesConfig?.styling?.titleColor}
              titleMarginTop={widget.stackedLinesConfig?.styling?.titleMarginTop}
              titleMarginLeft={widget.stackedLinesConfig?.styling?.titleMarginLeft}
              titleMarginBottom={widget.stackedLinesConfig?.styling?.titleMarginBottom}
              // Typography - Subtitle
              subtitleFontFamily={widget.stackedLinesConfig?.styling?.subtitleFontFamily}
              subtitleFontSize={widget.stackedLinesConfig?.styling?.subtitleFontSize}
              subtitleFontWeight={widget.stackedLinesConfig?.styling?.subtitleFontWeight}
              subtitleColor={widget.stackedLinesConfig?.styling?.subtitleColor}
              subtitleMarginTop={widget.stackedLinesConfig?.styling?.subtitleMarginTop}
              subtitleMarginLeft={widget.stackedLinesConfig?.styling?.subtitleMarginLeft}
              subtitleMarginBottom={widget.stackedLinesConfig?.styling?.subtitleMarginBottom}
              // Container Border
              containerBorderWidth={widget.stackedLinesConfig?.styling?.containerBorderWidth}
              containerBorderColor={widget.stackedLinesConfig?.styling?.containerBorderColor}
              containerBorderAccentColor={widget.stackedLinesConfig?.styling?.containerBorderAccentColor}
              containerBorderRadius={widget.stackedLinesConfig?.styling?.containerBorderRadius}
              containerBorderVariant={widget.stackedLinesConfig?.styling?.containerBorderVariant}
              containerPadding={widget.stackedLinesConfig?.styling?.containerPadding}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No grouped data available</div>
            </div>
          </div>
        );
      }
      break;

    

    default:
      widgetContent = (
        <div className="h-full w-full px-0 py-2 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">❓</div>
            <div className="text-sm">Unknown widget type: {widget.type}</div>
          </div>
        </div>
      );
      break;
  }

  // Return the widget content
  return widgetContent;
}
