'use client';

import { useState, useEffect } from 'react';
import { Widget } from './ConfigParser';

interface WidgetEditorModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWidget: Widget) => void;
}

export default function WidgetEditorModal({ widget, isOpen, onClose, onSave }: WidgetEditorModalProps) {
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

  // Update form when widget changes
  useEffect(() => {
    if (widget) {
      setFormData({
        type: widget.type,
        title: widget.title,
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
      type: formData.type as 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'table',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="area">Area Chart</option>
              <option value="kpi">KPI</option>
              <option value="table">Table</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tabela
                </label>
                <input
                  type="text"
                  value={formData.dataSource.table}
                  onChange={(e) => setFormData({
                    ...formData,
                    dataSource: { ...formData.dataSource, table: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nome_tabela"
                />
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
                    dataSource: { ...formData.dataSource, aggregation: e.target.value }
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

              {/* X Field */}
              {formData.type !== 'kpi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campo X (Dimensão)
                  </label>
                  <input
                    type="text"
                    value={formData.dataSource.x}
                    onChange={(e) => setFormData({
                      ...formData,
                      dataSource: { ...formData.dataSource, x: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="categoria"
                  />
                </div>
              )}

              {/* Y Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campo Y (Métrica)
                </label>
                <input
                  type="text"
                  value={formData.dataSource.y}
                  onChange={(e) => setFormData({
                    ...formData,
                    dataSource: { ...formData.dataSource, y: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="valor"
                />
              </div>
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
