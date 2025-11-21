'use client';

import { useState, useEffect, useMemo } from 'react';
import { Widget } from './ConfigParser';

interface WidgetEditorModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWidget: Widget) => void;
}

export default function WidgetEditorModal({ widget, isOpen, onClose, onSave }: WidgetEditorModalProps) {
  // Known datasets from system prompt (dimensions and measures)
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
  const DEFAULT_TABLE = 'vendas.vw_pedidos_completo';
  const CUSTOM_VALUE = '__custom__';

  const [formData, setFormData] = useState({
    type: widget?.type || 'bar',
    title: widget?.title || '',
    heightPx: widget?.heightPx || 320,
    dataSource: {
      table: widget?.dataSource?.table || '',
      x: widget?.dataSource?.x || '',
      y: widget?.dataSource?.y || '',
      aggregation: widget?.dataSource?.aggregation || 'SUM'
    }
  });

  // Derive selected table UI state
  const selectedTableValue = useMemo(() => {
    const t = formData.dataSource.table?.trim();
    if (!t) return DEFAULT_TABLE;
    return KNOWN_TABLE_KEYS.includes(t) ? t : CUSTOM_VALUE;
  }, [formData.dataSource.table]);

  const isCustomTable = selectedTableValue === CUSTOM_VALUE;

  const fieldOptions = useMemo<FieldOptions>(() => {
    const t = formData.dataSource.table?.trim();
    const key = t && KNOWN_TABLE_KEYS.includes(t) ? t : DEFAULT_TABLE;
    return KNOWN_TABLES[key];
  }, [formData.dataSource.table]);

  // Update form when widget changes
  useEffect(() => {
    if (widget) {
      setFormData({
        type: widget.type,
        title: widget.title || '',
        heightPx: widget.heightPx || 320,
        dataSource: {
          table: widget.dataSource?.table || '',
          x: widget.dataSource?.x || '',
          y: widget.dataSource?.y || '',
          aggregation: widget.dataSource?.aggregation || 'SUM'
        }
      });
    }
  }, [widget]);

  const handleSave = () => {
    if (!widget) return;

    const updatedWidget: Widget = {
      ...widget,
      type: formData.type as 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'insights' | 'alerts' | 'recommendations',
      title: formData.title,
      heightPx: formData.heightPx,
      dataSource: {
        ...widget.dataSource,
        ...formData.dataSource
      }
    };

    onSave(updatedWidget);
    onClose();
  };

  if (!isOpen || !widget) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-20 right-8 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Editar Widget</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
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
                type: e.target.value as 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'insights' | 'alerts' | 'recommendations'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="area">Area Chart</option>
              <option value="kpi">KPI</option>
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
                        // Keep existing table value (if any); user will type below
                        setFormData({ ...formData, dataSource: { ...formData.dataSource } });
                      } else {
                        setFormData({ ...formData, dataSource: { ...formData.dataSource, table: v, x: '', y: '' } });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={DEFAULT_TABLE}>vendas.vw_pedidos_completo</option>
                    <option value="comercial.vw_metas_detalhe">comercial.vw_metas_detalhe</option>
                    <option value={CUSTOM_VALUE}>Custom…</option>
                  </select>
                </div>
                {isCustomTable && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.dataSource.table}
                      onChange={(e) => setFormData({
                        ...formData,
                        dataSource: { ...formData.dataSource, table: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="schema.tabela ou nome_tabela"
                    />
                    <p className="mt-1 text-xs text-gray-500">Para usar dropdowns de campos, selecione uma tabela conhecida.</p>
                  </div>
                )}
              </div>

              {/* Aggregation */}
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

              {/* X Field (Dimension) */}
              {!['kpi', 'insights', 'alerts', 'recommendations'].includes(formData.type) && (
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

              {/* Y Field (Measure) */}
              {!['insights', 'alerts', 'recommendations'].includes(formData.type) && (
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
