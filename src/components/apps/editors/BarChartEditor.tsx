'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface BarChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: BarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function BarChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: BarChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-bar') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Bar Chart Configuration</h4>
      
      <div className="space-y-6">
        {/* Chart Info */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📈 Chart Info</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
              <input
                type="text"
                value={chartConfig.styling?.title || ''}
                onChange={(e) => {
                  console.log('📊 BarChartEditor: Chart title changed to:', e.target.value)
                  onChartConfigChange('styling.title', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sales by Region"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Name</label>
              <input
                type="text"
                value={chartConfig.name || ''}
                onChange={(e) => {
                  console.log('📊 BarChartEditor: Chart name changed to:', e.target.value)
                  onChartConfigChange('name', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Bar Chart"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
              <input
                type="text"
                value="Bar Chart"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Colors & Styling */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Primary Color</label>
              <input
                type="color"
                value={chartConfig.styling?.colors?.[0] || '#2563eb'}
                onChange={(e) => {
                  console.log('📊 BarChartEditor: Primary color changed to:', e.target.value)
                  const newColors = [...(chartConfig.styling?.colors || ['#2563eb'])]
                  newColors[0] = e.target.value
                  onChartConfigChange('styling.colors', newColors)
                }}
                className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color Palette</label>
              <div className="flex gap-2">
                {[
                  { colors: ['#2563eb', '#3b82f6', '#60a5fa'], name: 'Blue' },
                  { colors: ['#dc2626', '#ef4444', '#f87171'], name: 'Red' },
                  { colors: ['#16a34a', '#22c55e', '#4ade80'], name: 'Green' },
                  { colors: ['#ca8a04', '#eab308', '#facc15'], name: 'Yellow' },
                  { colors: ['#9333ea', '#a855f7', '#c084fc'], name: 'Purple' }
                ].map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => {
                      console.log('📊 BarChartEditor: Color palette changed to:', palette.name)
                      onChartConfigChange('styling.colors', palette.colors)
                    }}
                    className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                      JSON.stringify(chartConfig.styling?.colors) === JSON.stringify(palette.colors)
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      {palette.colors.slice(0, 3).map((color, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                    {palette.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Additional Colors</label>
              <div className="grid grid-cols-4 gap-2">
                {(chartConfig.styling?.colors || ['#2563eb']).slice(1, 5).map((color, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-500 mb-1">Color {index + 2}</label>
                    <input
                      type="color"
                      value={color || '#2563eb'}
                      onChange={(e) => {
                        console.log(`📊 BarChartEditor: Color ${index + 2} changed to:`, e.target.value)
                        const newColors = [...(chartConfig.styling?.colors || ['#2563eb'])]
                        newColors[index + 1] = e.target.value
                        onChartConfigChange('styling.colors', newColors)
                      }}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">👁️ Display Options</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.showLegend !== false}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Show legend changed to:', e.target.checked)
                    onChartConfigChange('styling.showLegend', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Legend</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.showGrid !== false}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Show grid changed to:', e.target.checked)
                    onChartConfigChange('styling.showGrid', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Grid</span>
              </label>
            </div>

            {/* Grid Details - Mostrar apenas se showGrid estiver ativo */}
            {chartConfig.styling?.showGrid && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <h6 className="text-xs font-medium text-gray-700 mb-2">Grid Options</h6>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={chartConfig.styling?.enableGridX !== false}
                      onChange={(e) => {
                        console.log('📊 BarChartEditor: Enable grid X changed to:', e.target.checked)
                        onChartConfigChange('styling.enableGridX', e.target.checked)
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-600">Horizontal Lines</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={chartConfig.styling?.enableGridY !== false}
                      onChange={(e) => {
                        console.log('📊 BarChartEditor: Enable grid Y changed to:', e.target.checked)
                        onChartConfigChange('styling.enableGridY', e.target.checked)
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-600">Vertical Lines</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Chart Style</label>
              <div className="flex gap-2">
                {[
                  { value: 'default', label: 'Default', icon: '📊' },
                  { value: 'modern', label: 'Modern', icon: '✨' },
                  { value: 'minimal', label: 'Minimal', icon: '📋' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      console.log('📊 BarChartEditor: Chart style changed to:', style.value)
                      onChartConfigChange('styling.style', style.value)
                    }}
                    className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                      chartConfig.styling?.style === style.value
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Axes */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Data & Axes</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X-Axis Title</label>
                <input
                  type="text"
                  value={chartConfig.styling?.xAxisTitle || ''}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: X-axis title changed to:', e.target.value)
                    onChartConfigChange('styling.xAxisTitle', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Categories"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis Title</label>
                <input
                  type="text"
                  value={chartConfig.styling?.yAxisTitle || ''}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Y-axis title changed to:', e.target.value)
                    onChartConfigChange('styling.yAxisTitle', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Values"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            {/* Legend Accordion */}
            <AccordionItem value="legend" className="border border-gray-200 rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span>🏷️</span>
                  <span className="text-sm font-medium">Legend Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  
                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['bottom', 'top', 'left', 'right'].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => {
                            console.log('📊 BarChartEditor: Legend position changed to:', pos)
                            onChartConfigChange('styling.legendPosition', pos)
                          }}
                          className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                            chartConfig.styling?.legendPosition === pos
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Direction</label>
                    <div className="flex gap-2">
                      {['row', 'column'].map((dir) => (
                        <button
                          key={dir}
                          onClick={() => {
                            console.log('📊 BarChartEditor: Legend direction changed to:', dir)
                            onChartConfigChange('styling.legendDirection', dir)
                          }}
                          className={`px-4 py-2 text-xs border rounded-md transition-colors ${
                            chartConfig.styling?.legendDirection === dir
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symbol Shape */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Symbol Shape</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'circle', icon: '●', label: 'Circle' },
                        { value: 'square', icon: '■', label: 'Square' },
                        { value: 'triangle', icon: '▲', label: 'Triangle' },
                        { value: 'diamond', icon: '♦', label: 'Diamond' }
                      ].map((shape) => (
                        <button
                          key={shape.value}
                          onClick={() => {
                            console.log('📊 BarChartEditor: Legend symbol shape changed to:', shape.value)
                            onChartConfigChange('styling.legendSymbolShape', shape.value)
                          }}
                          className={`px-3 py-2 text-xs border rounded-md flex items-center gap-2 transition-colors ${
                            chartConfig.styling?.legendSymbolShape === shape.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <span>{shape.icon}</span>
                          <span>{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Spacing</label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={chartConfig.styling?.legendSpacing ?? 20}
                        onChange={(e) => {
                          console.log('📊 BarChartEditor: Legend spacing changed to:', e.target.value)
                          onChartConfigChange('styling.legendSpacing', parseInt(e.target.value))
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {chartConfig.styling?.legendSpacing ?? 20}px
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Symbol Size</label>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="2"
                        value={chartConfig.styling?.legendSymbolSize ?? 12}
                        onChange={(e) => {
                          console.log('📊 BarChartEditor: Legend symbol size changed to:', e.target.value)
                          onChartConfigChange('styling.legendSymbolSize', parseInt(e.target.value))
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">
                        {chartConfig.styling?.legendSymbolSize ?? 12}px
                      </div>
                    </div>
                  </div>

                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </div>
  )
}