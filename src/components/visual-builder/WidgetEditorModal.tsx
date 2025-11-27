'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Widget } from './ConfigParser';
import type { BarChartConfig } from '@/stores/apps/barChartStore';
import type { LineChartConfig } from '@/stores/apps/lineChartStore';
import type { PieChartConfig } from '@/stores/apps/pieChartStore';
import type { AreaChartConfig } from '@/stores/apps/areaChartStore';
import type { GroupedBarChartConfig } from '@/stores/apps/groupedBarChartStore';

interface WidgetEditorModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWidget: Widget) => void;
}

// Known datasets from system prompt (stable at module scope)
type FieldOptions = { dimensions: string[]; measures: string[] };
const KNOWN_TABLES: Record<string, FieldOptions> = {
    // Padrão: vendas.vw_pedidos_completo
    'vendas.vw_pedidos_completo': {
      dimensions: [
        'data_pedido',
        'status',
        'cliente_nome',
        'vendedor_nome',
        'territorio_nome',
        'canal_venda_nome',
        'cupom_codigo',
        'centro_lucro_nome',
        'campanha_venda_nome',
        'filial_nome',
        'unidade_negocio_nome',
        'sales_office_nome',
        'produto_nome',
        'pedido_id',
        'item_id',
        'pedido_criado_em',
        'pedido_atualizado_em',
        'item_criado_em',
        'item_atualizado_em',
      ],
      measures: [
        'pedido_subtotal',
        'desconto_total',
        'pedido_valor_total',
        'quantidade',
        'preco_unitario',
        'item_desconto',
        'item_subtotal',
        // IDs úteis para COUNT/COUNT_DISTINCT
        'pedido_id',
        'item_id',
      ],
    },
    // Metas: comercial.vw_metas_detalhe
    'comercial.vw_metas_detalhe': {
      dimensions: ['vendedor', 'territorio'],
      measures: [
        'valor_meta',
        'subtotal',
        'ticket_medio',
        // campos comuns para contagens quando aplicável
        'cliente_id',
        'pedido_id',
      ],
    },
  };
const KNOWN_TABLE_KEYS = Object.keys(KNOWN_TABLES);

export default function WidgetEditorModal({ widget, isOpen, onClose, onSave }: WidgetEditorModalProps) {

  const DEFAULT_KNOWN_KEY = 'vendas.vw_pedidos_completo';
  const CUSTOM_VALUE = '__custom__';

  // Local tab state for the editor sections
  const [tab, setTab] = useState<'data' | 'estilo'>('data');

  const [formData, setFormData] = useState({
    type: (widget?.type as Widget['type']) || 'bar',
    title: widget?.title || '',
    heightPx: widget?.heightPx || 320,
    dataSource: {
      schema: widget?.dataSource?.schema || '',
      table: widget?.dataSource?.table || '',
      x: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).x || ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension || '',
      y: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).y || ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measure || '',
      aggregation: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).aggregation || 'SUM',
      // multi-series
      dimension1: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension1 || '',
      dimension2: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension2 || '',
      // compare
      dimension: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension || '',
      measureGoal: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measureGoal || '',
      measureActual: ((widget?.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measureActual || ''
    }
  });

  // Simple styling controls for charts (colors and left margin)
  const [styleData, setStyleData] = useState<{ colors: string; marginLeft: number }>({ colors: '', marginLeft: 40 });

  // Initialize styling controls on widget or type change
  useEffect(() => {
    if (!widget) return;
    try {
      const t = widget.type as Widget['type'];
      // Helper getters per type
      const getColors = (): string[] | undefined => {
        if (t === 'bar') return widget.barConfig?.styling?.colors;
        if (t === 'line') return widget.lineConfig?.styling?.colors;
        if (t === 'pie') return widget.pieConfig?.styling?.colors;
        if (t === 'area') return widget.areaConfig?.styling?.colors;
        if (t === 'groupedbar') return widget.groupedBarConfig?.styling?.colors as string[] | undefined;
        return widget.styling?.colors as string[] | undefined;
      };
      const getMarginLeft = (): number | undefined => {
        if (t === 'bar') return widget.barConfig?.margin?.left;
        if (t === 'line') return (widget.lineConfig as Partial<{ margin?: { left?: number } }> | undefined)?.margin?.left;
        if (t === 'pie') return (widget.pieConfig as Partial<{ margin?: { left?: number } }> | undefined)?.margin?.left;
        if (t === 'area') return (widget.areaConfig as Partial<{ margin?: { left?: number } }> | undefined)?.margin?.left;
        if (t === 'groupedbar') return (widget.groupedBarConfig?.margin as { left?: number } | undefined)?.left;
        return undefined;
      };
      const colorsArr = getColors() || [];
      const marginLeft = getMarginLeft();
      setStyleData({ colors: colorsArr.join(', '), marginLeft: typeof marginLeft === 'number' ? marginLeft : 40 });
    } catch {
      setStyleData({ colors: '', marginLeft: 40 });
    }
  }, [widget]);

  // Derive selected table UI state
  const selectedTableValue = useMemo(() => {
    const schema = formData.dataSource.schema?.trim();
    const table = formData.dataSource.table?.trim();
    const full = table ? (schema ? `${schema}.${table}` : table) : '';
    if (!full) return DEFAULT_KNOWN_KEY;
    return KNOWN_TABLE_KEYS.includes(full) ? full : CUSTOM_VALUE;
  }, [formData.dataSource.schema, formData.dataSource.table]);

  const isCustomTable = selectedTableValue === CUSTOM_VALUE;

  const fieldOptions = useMemo<FieldOptions>(() => {
    const schema = formData.dataSource.schema?.trim();
    const table = formData.dataSource.table?.trim();
    const full = table ? (schema ? `${schema}.${table}` : table) : '';
    const key = full && KNOWN_TABLE_KEYS.includes(full) ? full : DEFAULT_KNOWN_KEY;
    return KNOWN_TABLES[key];
  }, [formData.dataSource.schema, formData.dataSource.table]);

  // Helpers by type
  const isSimpleChart = (t: string) => ['bar', 'line', 'pie', 'area'].includes(t);
  const isKpi = (t: string) => t === 'kpi';
  const isMultiSeries = (t: string) => ['stackedbar', 'groupedbar', 'stackedlines', 'radialstacked', 'pivotbar'].includes(t);
  const isCompare = (t: string) => t === 'comparebar';

  // Update form when widget changes
  useEffect(() => {
    if (widget) {
      setFormData({
        type: widget.type,
        title: widget.title || '',
        heightPx: widget.heightPx || 320,
        dataSource: {
          schema: widget.dataSource?.schema || '',
          table: widget.dataSource?.table || '',
          x: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).x || ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension || '',
          y: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).y || ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measure || '',
          aggregation: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).aggregation || 'SUM',
          dimension1: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension1 || '',
          dimension2: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension2 || '',
          dimension: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).dimension || '',
          measureGoal: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measureGoal || '',
          measureActual: ((widget.dataSource ?? {}) as Partial<NonNullable<Widget['dataSource']>>).measureActual || ''
        }
      });
    }
  }, [widget]);

  const handleSave = () => {
    if (!widget) return;

    const dsPatch: Record<string, unknown> = {
      schema: formData.dataSource.schema,
      table: formData.dataSource.table,
    };
    if (isSimpleChart(formData.type)) {
      dsPatch['x'] = formData.dataSource.x;
      dsPatch['dimension'] = formData.dataSource.x;
      dsPatch['y'] = formData.dataSource.y;
      dsPatch['aggregation'] = formData.dataSource.aggregation;
    } else if (isKpi(formData.type)) {
      dsPatch['y'] = formData.dataSource.y;
      dsPatch['aggregation'] = formData.dataSource.aggregation;
    } else if (isMultiSeries(formData.type)) {
      dsPatch['dimension1'] = formData.dataSource.dimension1;
      if (formData.dataSource.dimension2) dsPatch['dimension2'] = formData.dataSource.dimension2;
      dsPatch['y'] = formData.dataSource.y;
      dsPatch['aggregation'] = formData.dataSource.aggregation;
    } else if (isCompare(formData.type)) {
      dsPatch['dimension'] = formData.dataSource.dimension || formData.dataSource.x;
      dsPatch['measureGoal'] = formData.dataSource.measureGoal;
      dsPatch['measureActual'] = formData.dataSource.measureActual;
    }

    // Patch style: colors and margin.left per chart type
    const colorsArray = styleData.colors
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let updatedWidget: Widget = {
      ...widget,
      type: formData.type,
      title: formData.title,
      heightPx: formData.heightPx,
      dataSource: {
        ...(widget.dataSource || {}),
        ...dsPatch
      } as Widget['dataSource']
    };

    const t = formData.type as Widget['type'];
    const applyBarStyling = (cfg?: Partial<BarChartConfig>): Partial<BarChartConfig> => {
      const next: Partial<BarChartConfig> = { ...(cfg || {}) };
      next.styling = { ...(cfg?.styling || {}) } as BarChartConfig['styling'];
      if (colorsArray.length) (next.styling as BarChartConfig['styling']).colors = colorsArray;
      const base = (cfg?.margin || { top: 20, right: 20, bottom: 40, left: 40 }) as NonNullable<BarChartConfig['margin']>;
      next.margin = { ...base, left: Number.isFinite(styleData.marginLeft) ? styleData.marginLeft : base.left };
      return next;
    };
    const applyLineStyling = (cfg?: Partial<LineChartConfig>): Partial<LineChartConfig> => {
      const next: Partial<LineChartConfig> = { ...(cfg || {}) };
      next.styling = { ...(cfg?.styling || {}) } as LineChartConfig['styling'];
      if (colorsArray.length) (next.styling as LineChartConfig['styling']).colors = colorsArray;
      const base = (cfg?.margin || { top: 20, right: 20, bottom: 40, left: 40 }) as NonNullable<LineChartConfig['margin']>;
      next.margin = { ...base, left: Number.isFinite(styleData.marginLeft) ? styleData.marginLeft : base.left } as NonNullable<LineChartConfig['margin']>;
      return next;
    };
    const applyPieStyling = (cfg?: Partial<PieChartConfig>): Partial<PieChartConfig> => {
      const next: Partial<PieChartConfig> = { ...(cfg || {}) };
      next.styling = { ...(cfg?.styling || {}) } as PieChartConfig['styling'];
      if (colorsArray.length) (next.styling as PieChartConfig['styling']).colors = colorsArray;
      const base = (cfg?.margin || { top: 20, right: 20, bottom: 40, left: 40 }) as NonNullable<PieChartConfig['margin']>;
      next.margin = { ...base, left: Number.isFinite(styleData.marginLeft) ? styleData.marginLeft : base.left } as NonNullable<PieChartConfig['margin']>;
      return next;
    };
    const applyAreaStyling = (cfg?: Partial<AreaChartConfig>): Partial<AreaChartConfig> => {
      const next: Partial<AreaChartConfig> = { ...(cfg || {}) };
      next.styling = { ...(cfg?.styling || {}) } as AreaChartConfig['styling'];
      if (colorsArray.length) (next.styling as AreaChartConfig['styling']).colors = colorsArray;
      const base = (cfg?.margin || { top: 20, right: 20, bottom: 40, left: 40 }) as NonNullable<AreaChartConfig['margin']>;
      next.margin = { ...base, left: Number.isFinite(styleData.marginLeft) ? styleData.marginLeft : base.left } as NonNullable<AreaChartConfig['margin']>;
      return next;
    };

    const applyGroupedBarStyling = (cfg?: Partial<GroupedBarChartConfig>): Partial<GroupedBarChartConfig> => {
      const next: Partial<GroupedBarChartConfig> = { ...(cfg || {}) };
      // Ensure styling exists
      next.styling = { ...(cfg?.styling || {}) } as GroupedBarChartConfig['styling'];
      if (colorsArray.length) (next.styling as GroupedBarChartConfig['styling']).colors = colorsArray;
      const prevMargin = (cfg?.margin || {}) as NonNullable<GroupedBarChartConfig['margin']>;
      const base = { top: prevMargin.top ?? 20, right: prevMargin.right ?? 20, bottom: prevMargin.bottom ?? 40, left: prevMargin.left ?? 40 };
      next.margin = { ...base, left: Number.isFinite(styleData.marginLeft) ? styleData.marginLeft : base.left } as NonNullable<GroupedBarChartConfig['margin']>;
      return next;
    };

    if (t === 'bar') {
      updatedWidget = { ...updatedWidget, barConfig: applyBarStyling(updatedWidget.barConfig as Partial<BarChartConfig>) };
    } else if (t === 'line') {
      updatedWidget = { ...updatedWidget, lineConfig: applyLineStyling(updatedWidget.lineConfig as Partial<LineChartConfig>) };
    } else if (t === 'pie') {
      updatedWidget = { ...updatedWidget, pieConfig: applyPieStyling(updatedWidget.pieConfig as Partial<PieChartConfig>) };
    } else if (t === 'area') {
      updatedWidget = { ...updatedWidget, areaConfig: applyAreaStyling(updatedWidget.areaConfig as Partial<AreaChartConfig>) };
    } else if (t === 'groupedbar') {
      // Persist groupedbar styling into widget
      updatedWidget = { ...updatedWidget, groupedBarConfig: applyGroupedBarStyling(updatedWidget.groupedBarConfig as Partial<GroupedBarChartConfig>) };
    }

    onSave(updatedWidget);
    onClose();
  };

  // Portal mounting state
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!isOpen || !widget) return null;
  const modal = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-20 right-8 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 pointer-events-auto max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Editar Widget</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="border-b pb-2 mb-3 flex gap-3">
            <button type="button" className={`text-sm pb-1 border-b-2 ${tab === 'data' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`} onClick={() => setTab('data')}>Data</button>
            <button type="button" className={`text-sm pb-1 border-b-2 ${tab === 'estilo' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`} onClick={() => setTab('estilo')}>Estilo</button>
          </div>
          {tab === 'data' && (
              <div className="space-y-4">
          {/* Widget Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Gráfico
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData,
                type: e.target.value as Widget['type']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="area">Area Chart</option>
              <option value="kpi">KPI</option>
              <option value="stackedbar">Stacked Bar</option>
              <option value="groupedbar">Grouped Bar</option>
              <option value="stackedlines">Stacked Lines</option>
              <option value="radialstacked">Radial Stacked</option>
              <option value="pivotbar">Pivot Bar</option>
              <option value="comparebar">Compare Bar</option>
              <option value="insights">Insights</option>
              <option value="alerts">Alerts</option>
              <option value="recommendations">Recommendations</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura (px)
            </label>
            <input
              type="number"
              value={formData.heightPx}
              onChange={(e) => setFormData({ ...formData, heightPx: parseInt(e.target.value) || 320 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              step="10"
            />
          </div>

          {/* Data Source Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Fonte de Dados</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Table */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tabela
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedTableValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === CUSTOM_VALUE) {
                        // Switch to custom mode; don't alter current schema/table values
                        setFormData({ ...formData, dataSource: { ...formData.dataSource } });
                        return;
                      }
                      // v is like 'schema.table' -> split
                      const dot = v.indexOf('.');
                      const nextSchema = dot > 0 ? v.slice(0, dot) : '';
                      const nextTable = dot > 0 ? v.slice(dot + 1) : v;
                      setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, schema: nextSchema, table: nextTable, x: '', y: '' }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={DEFAULT_KNOWN_KEY}>vendas.vw_pedidos_completo</option>
                    <option value="comercial.vw_metas_detalhe">comercial.vw_metas_detalhe</option>
                    <option value={CUSTOM_VALUE}>Custom…</option>
                  </select>
                </div>
                {isCustomTable && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.dataSource.schema && formData.dataSource.table ? `${formData.dataSource.schema}.${formData.dataSource.table}` : (formData.dataSource.table || '')}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw.includes('.')) {
                          const idx = raw.indexOf('.');
                          const s = raw.slice(0, idx);
                          const t = raw.slice(idx + 1);
                          setFormData({ ...formData, dataSource: { ...formData.dataSource, schema: s, table: t } });
                        } else {
                          setFormData({ ...formData, dataSource: { ...formData.dataSource, schema: '', table: raw } });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="schema.tabela ou nome_tabela"
                    />
                    <p className="mt-1 text-xs text-gray-500">Para usar dropdowns de campos, selecione uma tabela conhecida.</p>
                  </div>
                )}
              </div>

              {/* Aggregation (except compare) */}
              {(!isCompare(formData.type)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agregação
                </label>
                <select
                  value={formData.dataSource.aggregation}
                  onChange={(e) => setFormData({
                    ...formData,
                    dataSource: { ...formData.dataSource, aggregation: e.target.value as 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUM">SUM</option>
                  <option value="COUNT">COUNT</option>
                  <option value="AVG">AVG</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                </select>
              </div>
              )}

              {/* X Field (Dimension) for simple charts */}
              {isSimpleChart(formData.type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campo X (Dimensão)
                  </label>
                  {isCustomTable ? (
                    <input
                      type="text"
                      value={formData.dataSource.x}
                      onChange={(e) => setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, x: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="categoria (dimensão)"
                    />
                  ) : (
                    <select
                      value={formData.dataSource.x || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, x: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione…</option>
                      {fieldOptions.dimensions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Y Field (Measure) for simple charts and KPI and multi-series */}
              {(isSimpleChart(formData.type) || isKpi(formData.type) || isMultiSeries(formData.type)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campo Y (Métrica)
                  </label>
                  {isCustomTable ? (
                    <input
                      type="text"
                      value={formData.dataSource.y}
                      onChange={(e) => setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, y: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="valor (métrica)"
                    />
                  ) : (
                    <select
                      value={formData.dataSource.y || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, y: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione…</option>
                      {fieldOptions.measures.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Multi-series: dimension1/dimension2 */}
              {isMultiSeries(formData.type) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensão 1</label>
                    {isCustomTable ? (
                      <input type="text" value={formData.dataSource.dimension1}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension1: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="dimensão principal" />
                    ) : (
                      <select value={formData.dataSource.dimension1 || ''}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension1: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione…</option>
                        {fieldOptions.dimensions.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensão 2 (Séries)</label>
                    {isCustomTable ? (
                      <input type="text" value={formData.dataSource.dimension2}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension2: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="opcional" />
                    ) : (
                      <select value={formData.dataSource.dimension2 || ''}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension2: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">(Nenhuma)</option>
                        {fieldOptions.dimensions.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    )}
                  </div>
                </>
              )}

              {/* Comparebar: dimension + goal/actual */}
              {isCompare(formData.type) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensão</label>
                    {isCustomTable ? (
                      <input type="text" value={formData.dataSource.dimension}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: vendedor" />
                    ) : (
                      <select value={formData.dataSource.dimension || ''}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, dimension: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione…</option>
                        {fieldOptions.dimensions.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta (measureGoal)</label>
                    {isCustomTable ? (
                      <input type="text" value={formData.dataSource.measureGoal}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, measureGoal: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: valor_meta" />
                    ) : (
                      <select value={formData.dataSource.measureGoal || ''}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, measureGoal: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione…</option>
                        {fieldOptions.measures.map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Realizado (measureActual)</label>
                    {isCustomTable ? (
                      <input type="text" value={formData.dataSource.measureActual}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, measureActual: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: subtotal | novos_clientes | ticket_medio" />
                    ) : (
                      <select value={formData.dataSource.measureActual || ''}
                        onChange={(e) => setFormData({ ...formData, dataSource: { ...formData.dataSource, measureActual: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione…</option>
                        <option value="novos_clientes">novos_clientes</option>
                        <option value="ticket_medio">ticket_medio</option>
                        {fieldOptions.measures.map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                    )}
                  </div>
                </>
              )}
              {/* Close grid and data source section containers */}
            </div>
          </div>
        </div>
          )}

        {/* Style Section */}
        {tab === 'estilo' && (isSimpleChart(formData.type) || isKpi(formData.type) || isMultiSeries(formData.type)) && (
          <div className="pt-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Estilo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cores das Séries</label>
                {/* Lista de cores com color picker */}
                <div className="space-y-2">
                  {(styleData.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0
                    ? styleData.colors.split(',').map(c => c.trim()).filter(Boolean)
                    : ['#3b82f6']
                  ).map((color, idx, arr) => (
                    <div key={`${color}-${idx}`} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#([0-9a-f]{3}){1,2}$/i.test(color) ? color : '#3b82f6'}
                        onChange={(e) => {
                          const list = (styleData.colors || '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                          if (list.length === 0) list.push(e.target.value);
                          else list[idx] = e.target.value;
                          setStyleData({ ...styleData, colors: list.join(', ') });
                        }}
                        className="w-8 h-8 p-0 border rounded"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const list = (styleData.colors || '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                          if (list.length === 0) list.push(e.target.value);
                          else list[idx] = e.target.value;
                          setStyleData({ ...styleData, colors: list.join(', ') });
                        }}
                        placeholder="#3b82f6"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {arr.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = (styleData.colors || '')
                              .split(',')
                              .map(s => s.trim())
                              .filter(Boolean);
                            list.splice(idx, 1);
                            setStyleData({ ...styleData, colors: list.join(', ') });
                          }}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const list = (styleData.colors || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      list.push('#10b981');
                      setStyleData({ ...styleData, colors: list.join(', ') });
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + Adicionar cor
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margin Left (px)</label>
                <input
                  type="number"
                  min={0}
                  value={styleData.marginLeft}
                  onChange={(e) => setStyleData({ ...styleData, marginLeft: parseInt(e.target.value || '0') || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Espaço para eixo Y/labels do gráfico.</p>
              </div>
            </div>
          </div>
        )}

        </div>
        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
