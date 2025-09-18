'use client';

import type { Widget } from './ConfigParser';

interface WidgetPreviewProps {
  widget: Widget;
}

export default function WidgetPreview({ widget }: WidgetPreviewProps) {
  const renderChart = () => {
    const commonStyle = "w-full h-20 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm";

    switch (widget.type) {
      case 'bar':
        return (
          <div className={commonStyle}>
            <div className="flex items-end gap-1 h-12">
              <div className="w-3 bg-blue-400 h-8 rounded-sm"></div>
              <div className="w-3 bg-blue-400 h-12 rounded-sm"></div>
              <div className="w-3 bg-blue-400 h-6 rounded-sm"></div>
              <div className="w-3 bg-blue-400 h-10 rounded-sm"></div>
              <div className="w-3 bg-blue-400 h-4 rounded-sm"></div>
            </div>
          </div>
        );

      case 'line':
        return (
          <div className={commonStyle}>
            <svg width="60" height="30" viewBox="0 0 60 30" className="text-green-500">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,25 12,20 24,15 36,10 48,8 60,5"
              />
              <circle cx="0" cy="25" r="2" fill="currentColor" />
              <circle cx="12" cy="20" r="2" fill="currentColor" />
              <circle cx="24" cy="15" r="2" fill="currentColor" />
              <circle cx="36" cy="10" r="2" fill="currentColor" />
              <circle cx="48" cy="8" r="2" fill="currentColor" />
              <circle cx="60" cy="5" r="2" fill="currentColor" />
            </svg>
          </div>
        );

      case 'pie':
        return (
          <div className={commonStyle}>
            <svg width="40" height="40" viewBox="0 0 40 40" className="text-purple-500">
              <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.2" />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="30 70"
                transform="rotate(-90 20 20)"
              />
            </svg>
          </div>
        );

      case 'area':
        return (
          <div className={commonStyle}>
            <svg width="60" height="30" viewBox="0 0 60 30" className="text-orange-500">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <polygon
                fill="url(#areaGradient)"
                points="0,30 0,25 12,20 24,15 36,10 48,8 60,5 60,30"
              />
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,25 12,20 24,15 36,10 48,8 60,5"
              />
            </svg>
          </div>
        );

      default:
        return <div className={commonStyle}>Unknown Chart</div>;
    }
  };

  const renderKPI = () => {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded border border-blue-200 h-20 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-blue-900">
          {widget.unit}{widget.value?.toLocaleString() || '0'}
        </div>
        <div className="text-xs text-blue-600 mt-1">KPI Value</div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 truncate">{widget.title}</h3>
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {widget.type.toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {widget.type === 'kpi' ? renderKPI() : renderChart()}
      </div>

      {/* Data Info */}
      {widget.data && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            X: {widget.data.x} | Y: {widget.data.y}
          </div>
        </div>
      )}
    </div>
  );
}