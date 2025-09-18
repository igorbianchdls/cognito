'use client';

import { useState } from 'react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';

export default function VisualBuilderPage() {
  const [code, setCode] = useState(`{
  "widgets": [
    {
      "id": "chart1",
      "type": "bar",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "title": "Sales by Month",
      "data": {
        "x": "month",
        "y": "sales"
      }
    },
    {
      "id": "kpi1",
      "type": "kpi",
      "position": { "x": 6, "y": 0, "w": 3, "h": 2 },
      "title": "Total Revenue",
      "value": 15240,
      "unit": "$"
    },
    {
      "id": "chart2",
      "type": "line",
      "position": { "x": 0, "y": 4, "w": 9, "h": 4 },
      "title": "Growth Trend",
      "data": {
        "x": "date",
        "y": "growth"
      }
    }
  ]
}`);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
            <p className="text-sm text-gray-600 mt-1">Create charts and KPIs with coordinates</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Config
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Import Config
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex h-[calc(100vh-81px)]">
        {/* Left Panel - Monaco Editor */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configuration Editor</h2>
            <p className="text-sm text-gray-600">Define your widgets with JSON coordinates</p>
          </div>
          <div className="h-[calc(100%-73px)]">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language="json"
            />
          </div>
        </div>

        {/* Right Panel - Grid Canvas */}
        <div className="w-1/2 bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
            <p className="text-sm text-gray-600">Real-time visualization of your widgets</p>
          </div>
          <div className="h-[calc(100%-73px)] p-6 overflow-auto">
            <GridCanvas config={code} />
          </div>
        </div>
      </div>
    </div>
  );
}