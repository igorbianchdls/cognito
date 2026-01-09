'use client';

import { useState, useEffect } from 'react';
// SQL viewer removed
import type { ChartConfig as RechartsChartConfig } from '@/components/ui/chart';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { ScatterChart } from '@/components/charts/ScatterChart';
import { TreeMapChart } from '@/components/charts/TreeMapChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { StackedLinesChart } from '@/components/charts/StackedLinesChart';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { GroupedBarChart } from '@/components/charts/GroupedBarChart';
import { PivotBarChart } from '@/components/charts/PivotBarChart';
import { RadialStackedChart } from '@/components/charts/RadialStackedChart';
// Removed unused BarChartMultipleRecharts import
import { KPICard } from '@/components/widgets/KPICard';
import InsightsCard from '@/components/widgets/InsightsCard';
import AlertasCard from '@/components/widgets/AlertasCard';
import RecomendacoesCard from '@/components/widgets/RecomendacoesCard';
import { $vbNivoTheme } from '@/stores/visualBuilderNivoStore';
import InsightsHeroCarousel from '@/components/widgets/InsightsHeroCarousel';
import InsightsCard2 from '@/components/widgets/InsightsCard2';
import { $insights2 } from '@/stores/nexus/insights2Store';
import { useStore as useNanoStore } from '@nanostores/react';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';

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
  const vbNivo = useNanoStore($vbNivoTheme);
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

  // (Removed KPI titles DnD overlay per request)

  // Check if widget type needs BigQuery data
  const needsBigQueryData = (type: string): boolean => {
    return ['bar', 'line', 'pie', 'area', 'stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar', 'treemap', 'scatter', 'funnel'].includes(type);
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

  // Fetch data for multi-series widgets (stacked/grouped/pivot/treemap/funnel)
  useEffect(() => {
    if (widget.type !== 'stackedbar' && widget.type !== 'groupedbar' && widget.type !== 'stackedlines' && widget.type !== 'radialstacked' && widget.type !== 'pivotbar' && widget.type !== 'treemap' && widget.type !== 'funnel') {
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

  // Fetch data for scatter widgets (two measures)
  const [scatterSeries, setScatterSeries] = useState<Array<{ id: string; data: Array<{ x: number; y: number; label?: string }> }> | null>(null);
  const [scatterLoading, setScatterLoading] = useState(false);
  const [scatterError, setScatterError] = useState<string | null>(null);

  useEffect(() => {
    if (widget.type !== 'scatter') return;
    if (!widget.dataSource) { setScatterLoading(false); setScatterError(null); return; }
    const dsAny = widget.dataSource as Record<string, unknown>;
    if (!dsAny['table'] || !dsAny['xMeasure'] || !dsAny['yMeasure']) return;
    (async () => {
      try {
        setScatterLoading(true);
        setScatterError(null);
        // Normalize schema.table
        const normalize = (src: Record<string, unknown>) => {
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
        const payload = normalize(dsAny);
        const response = await fetch('/api/dashboard-supabase/scatter', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: payload['schema'],
            table: payload['table'],
            dimension: payload['dimension'],
            xMeasure: payload['xMeasure'],
            yMeasure: payload['yMeasure'],
            where: payload['where'],
            dateFilter: globalFilters?.dateRange,
            filters: globalFilters
          })
        });
        const result = await response.json();
        if (result.success) {
          setScatterSeries(result.series);
        } else {
          throw new Error(result.error || 'Failed to fetch scatter data');
        }
      } catch (err) {
        setScatterError(err instanceof Error ? err.message : 'Unknown error');
        setScatterSeries(null);
      } finally {
        setScatterLoading(false);
      }
    })();
  }, [widget.id, widget.dataSource, reloadTick, globalFilters]);

  // Type guard function for KPI data
  const isKPIData = (data: WidgetData): data is KPIData => {
    return data !== null && !Array.isArray(data) && 'value' in data;
  };

  // Fallback generators for CHARTS (not KPI)
  const generateFallbackSimple = (): Array<{ x: string; y: number; label: string; value: number }> => {
    const labels = widget.type === 'line'
      ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai']
      : ['A', 'B', 'C', 'D', 'E'];
    const values = [120, 80, 150, 60, 100];
    return labels.map((l, i) => ({ x: l, y: values[i % values.length], label: l, value: values[i % values.length] }));
  };
  const generateFallbackMultiple = () => {
    const items = [
      { label: 'A', S1: 120, S2: 60 },
      { label: 'B', S1: 80,  S2: 40 },
      { label: 'C', S1: 150, S2: 90 },
      { label: 'D', S1: 60,  S2: 30 },
    ];
    const series = [
      { key: 'S1', label: 'Série 1', color: '#2563eb' },
      { key: 'S2', label: 'Série 2', color: '#10b981' },
    ];
    return { items, series };
  };
  const generateFallbackScatter = () => ([{ id: 'Série', data: [
    { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 2.5 }, { x: 4, y: 4 }, { x: 5, y: 3.2 }
  ] }]);

  // Build effective chart data with fallback for charts
  const chartDataRaw = Array.isArray(data) ? data : [];
  const chartData = (widget.type !== 'kpi' && needsBigQueryData(widget.type) && !loading && (error || chartDataRaw.length === 0))
    ? generateFallbackSimple()
    : chartDataRaw;
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

  const hasPreBlocks = Boolean(((widget as any).preHtml as string | undefined)?.trim()) || (Array.isArray((widget as any).preBlocks) && (widget as any).preBlocks.length > 0);
  const commonChartProps = {
    data: chartData,
    title: undefined,
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

  // Error state - for KPI keep error; for charts, continue to fallback
  if (needsBigQueryData(widget.type) && error && widget.type === 'kpi') {
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

  // Empty data state - KPI only; charts continue with fallback
  if (needsBigQueryData(widget.type) && widget.type === 'kpi' && !loading && (!data || (Array.isArray(data) && data.length === 0))) {
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

  // Render generic preBlocks (<p> parsed from DSL) above widget content (charts, etc.)
  const renderPreBlocks = () => {
    const blocks = (widget as any).preBlocks as Array<{ className?: string; attrs?: Record<string,string>; text?: string }> | undefined;
    if (blocks && blocks.length) {
      const styleFromAttrs = (a: Record<string,string> | undefined): React.CSSProperties => {
        const s: React.CSSProperties = {};
        if (!a) return s;
        const num = (v?: string) => (v!=null && v!=='' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
        const map = [
          ['marginBottom','margin-bottom','marginBottom'],
          ['marginTop','margin-top','marginTop'],
          ['marginLeft','margin-left','marginLeft'],
          ['marginRight','margin-right','marginRight'],
          ['paddingBottom','padding-bottom','paddingBottom'],
          ['paddingTop','padding-top','paddingTop'],
          ['paddingLeft','padding-left','paddingLeft'],
          ['paddingRight','padding-right','paddingRight'],
          ['fontSize','font-size','fontSize'],
          ['fontWeight','font-weight','fontWeight'],
          ['lineHeight','line-height','lineHeight'],
          ['letterSpacing','letter-spacing','letterSpacing'],
          ['fontFamily','font-family','fontFamily'],
          ['color','color','color'],
          ['textAlign','text-align','textAlign'],
          ['textTransform','text-transform','textTransform'],
          ['fontStyle','font-style','fontStyle'],
        ] as const;
        for (const [camel, kebab, key] of map) {
          const v = a[camel] ?? a[kebab];
          if (v != null && v !== '') {
            if (['color','textAlign','fontFamily','textTransform','fontStyle'].includes(key)) (s as any)[key] = v;
            else (s as any)[key] = num(String(v)) ?? v;
          }
        }
        return s;
      };
      return (
        <div className="mb-1">
          {blocks.map((b, i) => (
            <p key={`pre-${widget.id}-${i}`} className={b.className || undefined} style={styleFromAttrs(b.attrs)}>
              {b.text}
            </p>
          ))}
        </div>
      );
    }
    const preHtml = (widget as any).preHtml as string | undefined;
    if (preHtml && preHtml.trim()) {
      return (
        <div className="mb-1" dangerouslySetInnerHTML={{ __html: preHtml }} />
      );
    }
    return null;
  };

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
          {renderPreBlocks()}
          <BarChart
            enableGridX={vbNivo.enableGridX}
            enableGridY={vbNivo.enableGridY}
            gridColor={vbNivo.gridColor}
            gridStrokeWidth={vbNivo.gridStrokeWidth}
            axisFontFamily={vbNivo.axisFontFamily}
            axisFontSize={vbNivo.axisFontSize}
            axisFontWeight={vbNivo.axisFontWeight}
            axisTextColor={vbNivo.axisTextColor}
            axisLegendFontSize={vbNivo.axisLegendFontSize}
            axisLegendFontWeight={vbNivo.axisLegendFontWeight}
            labelsFontFamily={vbNivo.labelsFontFamily}
            labelsFontSize={vbNivo.labelsFontSize}
            labelsFontWeight={vbNivo.labelsFontWeight}
            labelsTextColor={vbNivo.labelsTextColor}
            legendsFontFamily={vbNivo.legendsFontFamily}
            legendsFontSize={vbNivo.legendsFontSize}
            legendsFontWeight={vbNivo.legendsFontWeight}
            legendsTextColor={vbNivo.legendsTextColor}
            tooltipFontFamily={vbNivo.tooltipFontFamily}
            tooltipFontSize={vbNivo.tooltipFontSize}
            animate={vbNivo.animate}
            motionConfig={vbNivo.motionConfig}
            {...commonChartProps}
            {...(widget.barConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.barConfig?.margin || commonChartProps.margin}
            legends={widget.barConfig?.legends}
            showLegend={widget.barConfig?.styling?.showLegend}
            containerClassName="h-full"
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
            // Fallback to styling props if barConfig not provided
            enableGridX={widget.barConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.barConfig?.styling?.enableGridY ?? true}
            gridColor={widget.barConfig?.styling?.gridColor}
            gridStrokeWidth={widget.barConfig?.styling?.gridStrokeWidth}
            borderRadius={widget.barConfig?.styling?.borderRadius ?? widget.styling?.borderRadius}
            axisBottom={(() => {
              const s = widget.barConfig?.styling as Record<string, unknown> | undefined;
              const ts = s?.['axisBottomTickSize'] as number | undefined;
              const tp = s?.['axisBottomTickPadding'] as number | undefined;
              const tr = s?.['axisBottomTickRotation'] as number | undefined;
              if (ts === undefined && tp === undefined && tr === undefined) return undefined;
              return { tickSize: ts, tickPadding: tp, tickRotation: tr } as any;
            })()}
          />
        </div>
      );
      break;

    case 'line':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          {renderPreBlocks()}
          <LineChart
            enableGridX={vbNivo.enableGridX}
            enableGridY={vbNivo.enableGridY}
            gridColor={vbNivo.gridColor}
            gridStrokeWidth={vbNivo.gridStrokeWidth}
            axisFontFamily={vbNivo.axisFontFamily}
            axisFontSize={vbNivo.axisFontSize}
            axisFontWeight={vbNivo.axisFontWeight}
            axisTextColor={vbNivo.axisTextColor}
            axisLegendFontSize={vbNivo.axisLegendFontSize}
            axisLegendFontWeight={vbNivo.axisLegendFontWeight}
            labelsFontFamily={vbNivo.labelsFontFamily}
            labelsFontSize={vbNivo.labelsFontSize}
            labelsFontWeight={vbNivo.labelsFontWeight}
            labelsTextColor={vbNivo.labelsTextColor}
            legendsFontFamily={vbNivo.legendsFontFamily}
            legendsFontSize={vbNivo.legendsFontSize}
            legendsFontWeight={vbNivo.legendsFontWeight}
            legendsTextColor={vbNivo.legendsTextColor}
            tooltipFontFamily={vbNivo.tooltipFontFamily}
            tooltipFontSize={vbNivo.tooltipFontSize}
            animate={vbNivo.animate}
            motionConfig={vbNivo.motionConfig}
            {...commonChartProps}
            {...(widget.lineConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.lineConfig?.margin || commonChartProps.margin}
            legends={widget.lineConfig?.legends}
            containerClassName="h-full"
            // Fallback to default props if lineConfig not provided
            enableGridX={widget.lineConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.lineConfig?.styling?.enableGridY ?? true}
            lineWidth={widget.lineConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.lineConfig?.styling?.enablePoints ?? true}
            pointSize={widget.lineConfig?.styling?.pointSize ?? 6}
            curve={widget.lineConfig?.styling?.curve ?? "cardinal"}
            
            axisBottom={(() => {
              const s = widget.lineConfig?.styling as Record<string, unknown> | undefined;
              const ts = s?.['axisBottomTickSize'] as number | undefined;
              const tp = s?.['axisBottomTickPadding'] as number | undefined;
              const tr = s?.['axisBottomTickRotation'] as number | undefined;
              if (ts === undefined && tp === undefined && tr === undefined) return undefined;
              return { tickSize: ts, tickPadding: tp, tickRotation: tr } as any;
            })()}
          />
        </div>
      );
      break;

    case 'pie':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          {renderPreBlocks()}
          <PieChart
            gridColor={vbNivo.gridColor}
            gridStrokeWidth={vbNivo.gridStrokeWidth}
            labelsFontFamily={vbNivo.labelsFontFamily}
            labelsFontSize={vbNivo.labelsFontSize}
            labelsFontWeight={vbNivo.labelsFontWeight}
            labelsTextColor={vbNivo.labelsTextColor}
            legendsFontFamily={vbNivo.legendsFontFamily}
            legendsFontSize={vbNivo.legendsFontSize}
            legendsFontWeight={vbNivo.legendsFontWeight}
            legendsTextColor={vbNivo.legendsTextColor}
            tooltipFontFamily={vbNivo.tooltipFontFamily}
            tooltipFontSize={vbNivo.tooltipFontSize}
            animate={vbNivo.animate}
            motionConfig={vbNivo.motionConfig}
            {...commonChartProps}
            {...(widget.pieConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.pieConfig?.margin || commonChartProps.margin}
            legends={widget.pieConfig?.legends}
            containerClassName="h-full"
            // Fallback to default props if pieConfig not provided
            innerRadius={widget.pieConfig?.styling?.innerRadius ?? 0.5}
            padAngle={widget.pieConfig?.styling?.padAngle ?? 1}
            cornerRadius={widget.pieConfig?.styling?.cornerRadius ?? 2}
            
          />
        </div>
      );
      break;

    case 'area':
      widgetContent = (
        <div className="h-full w-full px-0 py-2 relative group">
          {renderPreBlocks()}
          <AreaChart
            enableGridX={vbNivo.enableGridX}
            enableGridY={vbNivo.enableGridY}
            gridColor={vbNivo.gridColor}
            gridStrokeWidth={vbNivo.gridStrokeWidth}
            axisFontFamily={vbNivo.axisFontFamily}
            axisFontSize={vbNivo.axisFontSize}
            axisFontWeight={vbNivo.axisFontWeight}
            axisTextColor={vbNivo.axisTextColor}
            axisLegendFontSize={vbNivo.axisLegendFontSize}
            axisLegendFontWeight={vbNivo.axisLegendFontWeight}
            labelsFontFamily={vbNivo.labelsFontFamily}
            labelsFontSize={vbNivo.labelsFontSize}
            labelsFontWeight={vbNivo.labelsFontWeight}
            labelsTextColor={vbNivo.labelsTextColor}
            legendsFontFamily={vbNivo.legendsFontFamily}
            legendsFontSize={vbNivo.legendsFontSize}
            legendsFontWeight={vbNivo.legendsFontWeight}
            legendsTextColor={vbNivo.legendsTextColor}
            tooltipFontFamily={vbNivo.tooltipFontFamily}
            tooltipFontSize={vbNivo.tooltipFontSize}
            animate={vbNivo.animate}
            motionConfig={vbNivo.motionConfig}
            {...commonChartProps}
            {...(widget.areaConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.areaConfig?.margin || commonChartProps.margin}
            legends={widget.areaConfig?.legends}
            containerClassName="h-full"
            // Fallback to default props if areaConfig not provided
            enableGridX={widget.areaConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.areaConfig?.styling?.enableGridY ?? true}
            areaOpacity={widget.areaConfig?.styling?.areaOpacity ?? 0.15}
            lineWidth={widget.areaConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.areaConfig?.styling?.enablePoints ?? true}
            pointSize={widget.areaConfig?.styling?.pointSize ?? 6}
            curve={widget.areaConfig?.styling?.curve ?? "cardinal"}
            
            axisBottom={(() => {
              const s = widget.areaConfig?.styling as Record<string, unknown> | undefined;
              const ts = s?.['axisBottomTickSize'] as number | undefined;
              const tp = s?.['axisBottomTickPadding'] as number | undefined;
              const tr = s?.['axisBottomTickRotation'] as number | undefined;
              if (ts === undefined && tp === undefined && tr === undefined) return undefined;
              return { tickSize: ts, tickPadding: tp, tickRotation: tr } as any;
            })()}
          />
        </div>
      );
      break;

    case 'kpi': {
      // If parser provided direct HTML blocks for KPI, render them as plain <p>
      const kpiBlocks = (widget as any).kpiHtmlBlocks as Array<{ role: 'title'|'value'|'comparison'; attrs: Record<string,string>; text?: string }> | undefined;
      if (Array.isArray(kpiBlocks) && kpiBlocks.length) {
        const styleFromAttrs = (a: Record<string,string> | undefined): React.CSSProperties => {
          const s: React.CSSProperties = {};
          if (!a) return s;
          const num = (v?: string) => (v!=null && v!=='' && !Number.isNaN(Number(v)) ? Number(v) : undefined);
          const map = [
            ['marginBottom','margin-bottom','marginBottom'],
            ['marginTop','margin-top','marginTop'],
            ['marginLeft','margin-left','marginLeft'],
            ['marginRight','margin-right','marginRight'],
            ['paddingBottom','padding-bottom','paddingBottom'],
            ['paddingTop','padding-top','paddingTop'],
            ['paddingLeft','padding-left','paddingLeft'],
            ['paddingRight','padding-right','paddingRight'],
            ['fontSize','font-size','fontSize'],
            ['fontWeight','font-weight','fontWeight'],
            ['lineHeight','line-height','lineHeight'],
            ['letterSpacing','letter-spacing','letterSpacing'],
            ['fontFamily','font-family','fontFamily'],
            ['color','color','color'],
            ['textAlign','text-align','textAlign'],
            ['textTransform','text-transform','textTransform'],
            ['fontStyle','font-style','fontStyle'],
          ] as const;
          for (const [camel, kebab, key] of map) {
            const v = a[camel] ?? a[kebab];
            if (v != null && v !== '') {
              if (['color','textAlign','fontFamily','textTransform','fontStyle'].includes(key)) (s as any)[key] = v;
              else (s as any)[key] = num(String(v)) ?? v;
            }
          }
          return s;
        };

        const unit = (widget as any).unit || (widget as any).kpiConfig?.unit || '';
        const valueText = typeof kpiValue === 'number' ? `${unit ? unit : ''}${kpiValue.toLocaleString('pt-BR')}` : `${unit ? unit : ''}${kpiValue ?? ''}`;
        const comparisonText = ((): string | undefined => {
          if (typeof kpiChangePct === 'number' && !Number.isNaN(kpiChangePct)) {
            const pct = Math.abs(kpiChangePct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            return kpiLabel ? `${kpiLabel} • ${pct}%` : `${pct}%`;
          }
          return kpiLabel || undefined;
        })();

        widgetContent = (
          <div className="h-full w-full px-0 py-2 relative group">
            {renderPreBlocks()}
            <div>
              {kpiBlocks.map((b, i) => {
                const style = styleFromAttrs(b.attrs);
                let text: string | undefined = b.text;
                if (!text) {
                  if (b.role === 'value') text = valueText;
                  else if (b.role === 'comparison') text = comparisonText;
                }
                return (
                  <p key={`kpi-${widget.id}-${i}`} style={style}>{text}</p>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Backward compatibility: render KPICard as before
        widgetContent = (
          <div className="h-full w-full px-0 py-2 relative group">
            {renderPreBlocks()}
            <KPICard
              variant="tile"
              name={widget.title}
              currentValue={kpiValue}
              previousValue={kpiPrev}
              changePct={kpiChangePct}
              comparisonLabel={kpiLabel}
              unit={widget.unit || widget.kpiConfig?.unit}
              success={true}
              enableTitlesReorder
              titlesOrder={(() => {
                const hasH3 = Boolean(kpiLabel) || typeof kpiChangePct === 'number';
                const fallback: Array<'h1'|'h2'|'h3'> = hasH3 ? ['h1','h2','h3'] : ['h1','h2'];
                return (Array.isArray(widget.kpiTitlesOrder) && widget.kpiTitlesOrder.length ? (widget.kpiTitlesOrder as Array<'h1'|'h2'|'h3'>) : fallback);
              })()}
              onTitlesOrderChange={(ids) => {
                try {
                  visualBuilderActions.updateKpiTitlesOrderInState(widget.id, ids)
                } catch {}
                try {
                  visualBuilderActions.updateKpiTitlesOrderInCode(widget.id, ids)
                } catch {}
              }}
              {...(widget.kpiConfig || {})}
              kpiContainerBackgroundColor={widget.kpiConfig?.kpiContainerBackgroundColor || widget.styling?.backgroundColor}
              kpiValueColor={widget.kpiConfig?.kpiValueColor || widget.styling?.textColor}
              kpiValueFontSize={widget.kpiConfig?.kpiValueFontSize || widget.styling?.fontSize}
            />
          </div>
        );
      }
      break;
    }
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

    case 'treemap':
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
        // Build hierarchical data
        const hasSeries = (multipleData.series || []).length > 1 || (multipleData.series[0]?.key !== 'value');
        let treeData: any = { name: 'root', children: [] as any[] };
        if (hasSeries) {
          // dimension1 as parent, dimension2 as children
          for (const row of multipleData.items) {
            const parent: any = { name: String(row.label), children: [] as any[] };
            for (const s of multipleData.series) {
              const v = Number((row as any)[s.key] || 0);
              if (v > 0) parent.children.push({ name: s.label || s.key, value: v });
            }
            if (parent.children.length > 0) treeData.children.push(parent);
          }
        } else {
          // Single level
          treeData.children = multipleData.items.map((row) => ({ name: String(row.label), value: Number((row as any).value || 0) }));
        }

        widgetContent = (
          <div className="h-full w-full p-2 relative group">
            {renderPreBlocks()}
            <TreeMapChart
              data={treeData}
              title={undefined}
              colors={(widget.styling?.colors as string[] | undefined)}
              
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

    case 'scatter':
      if (scatterLoading) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading data...</div>
            </div>
          </div>
        );
      } else if (scatterError) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center text-red-600">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1">Error</div>
              <div className="text-xs">{scatterError}</div>
            </div>
          </div>
        );
      } else if (scatterSeries && scatterSeries.length > 0) {
        widgetContent = (
          <div className="h-full w-full p-2 relative group">
            {renderPreBlocks()}
            <ScatterChart
              series={scatterSeries}
              title={undefined}
              colors={(widget.styling?.colors as string[] | undefined)}
              
              enableGridX={widget.styling?.enableGridX as boolean | undefined}
              enableGridY={widget.styling?.enableGridY as boolean | undefined}
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No data available</div>
            </div>
          </div>
        );
      }
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
            {renderPreBlocks()}
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
              title={undefined}
              colors={multipleData.series.map(s => s.color)}
              seriesMetadata={multipleData.series}
              
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
              axisBottom={(() => {
                const s = widget.stackedBarConfig?.styling as Record<string, unknown> | undefined;
                const ts = s?.['axisBottomTickSize'] as number | undefined;
                const tp = s?.['axisBottomTickPadding'] as number | undefined;
                const tr = s?.['axisBottomTickRotation'] as number | undefined;
                if (ts === undefined && tp === undefined && tr === undefined) return undefined;
                return { tickSize: ts, tickPadding: tp, tickRotation: tr } as any;
              })()}
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
            {renderPreBlocks()}
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
              title={undefined}
              colors={(widget.groupedBarConfig?.styling?.colors as string[] | undefined)?.length
                ? multipleData.series.map((s, i) => (widget.groupedBarConfig?.styling?.colors as string[])[i] || s.color)
                : multipleData.series.map(s => s.color)
              }
              seriesMetadata={(widget.groupedBarConfig?.styling?.colors as string[] | undefined)?.length
                ? multipleData.series.map((s, i) => ({ ...s, color: (widget.groupedBarConfig?.styling?.colors as string[])[i] || s.color }))
                : multipleData.series
              }
              
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
              axisBottom={(() => {
                const s = widget.groupedBarConfig?.styling as Record<string, unknown> | undefined;
                const ts = s?.['axisBottomTickSize'] as number | undefined;
                const tp = s?.['axisBottomTickPadding'] as number | undefined;
                const tr = s?.['axisBottomTickRotation'] as number | undefined;
                if (ts === undefined && tp === undefined && tr === undefined) return undefined;
                return { tickSize: ts, tickPadding: tp, tickRotation: tr } as any;
              })()}
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
            {renderPreBlocks()}
            {pivotDrilled && (
              <button onClick={drillPivotBack} className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-white border border-gray-200 rounded shadow">Voltar</button>
            )}
            <PivotBarChart
              items={multipleData.items}
              keys={keys}
              seriesMetadata={seriesMetadata}
              title={undefined}
              // Typography
              
              showLegend={pivotDrilled ? false : undefined}
              layout={widget.pivotBarConfig?.styling?.layout || 'vertical'}
              groupMode={widget.pivotBarConfig?.styling?.groupMode || 'grouped'}
              enableGridX={widget.pivotBarConfig?.styling?.enableGridX}
              enableGridY={widget.pivotBarConfig?.styling?.enableGridY}
              gridColor={widget.pivotBarConfig?.styling?.gridColor}
              gridStrokeWidth={widget.pivotBarConfig?.styling?.gridStrokeWidth}
              borderRadius={widget.pivotBarConfig?.styling?.borderRadius}
              borderWidth={widget.pivotBarConfig?.styling?.borderWidth}
              
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
            {renderPreBlocks()}
            <RadialStackedChart
              data={dataRow}
              keys={keys}
              config={config}
              className="max-w-[320px]"
              title={undefined}
              
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
            {renderPreBlocks()}
            <StackedLinesChart
              {...(widget.stackedLinesConfig?.styling || {})}
              margin={widget.stackedLinesConfig?.margin}
              legends={widget.stackedLinesConfig?.legends}
              data={multipleData.items}
              keys={multipleData.series.map(s => s.key)}
              title={undefined}
              colors={multipleData.series.map(s => s.color)}
              seriesMetadata={multipleData.series}
              
              // Grid & axis
              enableGridX={widget.stackedLinesConfig?.styling?.enableGridX ?? false}
              enableGridY={widget.stackedLinesConfig?.styling?.enableGridY ?? true}
              gridColor={widget.stackedLinesConfig?.styling?.gridColor}
              gridStrokeWidth={widget.stackedLinesConfig?.styling?.gridStrokeWidth}
              
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

    case 'funnel':
      if (multipleLoading) {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Loading data...</div>
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
        // Convert items to ChartData for FunnelChart
        const steps = multipleData.items.map((it) => ({
          label: String(it.label),
          value: Number((it as any).value || 0)
        }));
        widgetContent = (
          <div className="h-full w-full p-2 relative group">
            {renderPreBlocks()}
            <FunnelChart
              data={steps as any}
              title={undefined}
              colors={(widget.styling?.colors as string[] | undefined)}
              
            />
          </div>
        );
      } else {
        widgetContent = (
          <div className="h-full w-full p-2 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">No data available</div>
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
