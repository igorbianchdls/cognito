'use client'

import type { DroppedWidget } from '@/types/widget'
import { isChartWidget } from '@/types/chartWidgets'
import type { BaseChartConfig } from '@/types/chartWidgets'

interface ChartConfigEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: BaseChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function ChartConfigEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: ChartConfigEditorProps) {
  
  if (!selectedWidget || !isChartWidget(selectedWidget)) {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Chart Configuration</h4>
      
      <div className="space-y-6">
        {/* Visual & Colors */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">🎨 Visual & Colors</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                <input
                  type="color"
                  value={chartConfig.backgroundColor || '#ffffff'}
                  onChange={(e) => onChartConfigChange('backgroundColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                <input
                  type="color"
                  value={chartConfig.borderColor || '#e5e7eb'}
                  onChange={(e) => onChartConfigChange('borderColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={chartConfig.borderRadius || 0}
                  onChange={(e) => onChartConfigChange('borderRadius', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{chartConfig.borderRadius || 0}px</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={chartConfig.borderWidth || 0}
                  onChange={(e) => onChartConfigChange('borderWidth', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{chartConfig.borderWidth || 0}px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid & Axes */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Grid & Axes</h5>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.enableGridX !== false}
                  onChange={(e) => onChartConfigChange('enableGridX', e.target.checked)}
                  className="rounded"
                />
                Enable Grid X
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.enableGridY !== false}
                  onChange={(e) => onChartConfigChange('enableGridY', e.target.checked)}
                  className="rounded"
                />
                Enable Grid Y
              </label>
            </div>
            
            {/* Bottom Axis */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h6 className="text-xs font-medium text-gray-600 mb-2">Bottom Axis</h6>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Legend</label>
                  <input
                    type="text"
                    value={chartConfig.axisBottom?.legend || ''}
                    onChange={(e) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, legend: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="X-axis label"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Rotation</label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="15"
                      value={chartConfig.axisBottom?.tickRotation || 0}
                      onChange={(e) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickRotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisBottom?.tickRotation || 0}°</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Size</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={chartConfig.axisBottom?.tickSize || 5}
                      onChange={(e) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisBottom?.tickSize || 5}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Padding</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={chartConfig.axisBottom?.tickPadding || 5}
                      onChange={(e) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickPadding: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisBottom?.tickPadding || 5}px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Axis */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h6 className="text-xs font-medium text-gray-600 mb-2">Left Axis</h6>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Legend</label>
                  <input
                    type="text"
                    value={chartConfig.axisLeft?.legend || ''}
                    onChange={(e) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, legend: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Y-axis label"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Rotation</label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="15"
                      value={chartConfig.axisLeft?.tickRotation || 0}
                      onChange={(e) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickRotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisLeft?.tickRotation || 0}°</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Size</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={chartConfig.axisLeft?.tickSize || 5}
                      onChange={(e) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisLeft?.tickSize || 5}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tick Padding</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={chartConfig.axisLeft?.tickPadding || 5}
                      onChange={(e) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickPadding: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.axisLeft?.tickPadding || 5}px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout & Spacing */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📏 Layout & Spacing</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Margin</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.margin?.top || 60}
                    onChange={(e) => onChartConfigChange('margin', { ...chartConfig.margin, top: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.margin?.top || 60}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.margin?.right || 80}
                    onChange={(e) => onChartConfigChange('margin', { ...chartConfig.margin, right: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.margin?.right || 80}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.margin?.bottom || 60}
                    onChange={(e) => onChartConfigChange('margin', { ...chartConfig.margin, bottom: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.margin?.bottom || 60}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.margin?.left || 60}
                    onChange={(e) => onChartConfigChange('margin', { ...chartConfig.margin, left: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.margin?.left || 60}px</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={chartConfig.padding || 0}
                onChange={(e) => onChartConfigChange('padding', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{chartConfig.padding || 0}px</span>
            </div>
          </div>
        </div>

        {/* Title & Text */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">✍️ Title & Text</h5>
          <div className="space-y-4">
            {/* Title */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h6 className="text-xs font-medium text-gray-600 mb-2">Title</h6>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title Text</label>
                  <input
                    type="text"
                    value={chartConfig.title || ''}
                    onChange={(e) => onChartConfigChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Chart Title"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="32"
                      step="1"
                      value={chartConfig.titleFontSize || 16}
                      onChange={(e) => onChartConfigChange('titleFontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.titleFontSize || 16}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={chartConfig.titleColor || '#1f2937'}
                      onChange={(e) => onChartConfigChange('titleColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Weight</label>
                    <select
                      value={chartConfig.titleFontWeight || 600}
                      onChange={(e) => onChartConfigChange('titleFontWeight', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value={400}>Normal</option>
                      <option value={500}>Medium</option>
                      <option value={600}>Semi Bold</option>
                      <option value={700}>Bold</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={chartConfig.showTitle !== false}
                    onChange={(e) => onChartConfigChange('showTitle', e.target.checked)}
                    className="rounded"
                  />
                  Show Title
                </label>
              </div>
            </div>

            {/* Subtitle */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h6 className="text-xs font-medium text-gray-600 mb-2">Subtitle</h6>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtitle Text</label>
                  <input
                    type="text"
                    value={chartConfig.subtitle || ''}
                    onChange={(e) => onChartConfigChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Chart Subtitle"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <input
                      type="range"
                      min="10"
                      max="20"
                      step="1"
                      value={chartConfig.subtitleFontSize || 12}
                      onChange={(e) => onChartConfigChange('subtitleFontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{chartConfig.subtitleFontSize || 12}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={chartConfig.subtitleColor || '#6b7280'}
                      onChange={(e) => onChartConfigChange('subtitleColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Weight</label>
                    <select
                      value={chartConfig.subtitleFontWeight || 400}
                      onChange={(e) => onChartConfigChange('subtitleFontWeight', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value={300}>Light</option>
                      <option value={400}>Normal</option>
                      <option value={500}>Medium</option>
                      <option value={600}>Semi Bold</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={chartConfig.showSubtitle !== false}
                    onChange={(e) => onChartConfigChange('showSubtitle', e.target.checked)}
                    className="rounded"
                  />
                  Show Subtitle
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">🏷️ Labels</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.enableLabel !== false}
                  onChange={(e) => onChartConfigChange('enableLabel', e.target.checked)}
                  className="rounded"
                />
                Enable Labels
              </label>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Label Color</label>
                <input
                  type="color"
                  value={chartConfig.labelTextColor || '#374151'}
                  onChange={(e) => onChartConfigChange('labelTextColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
            </div>
            {chartConfig.enableLabel !== false && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Position</label>
                  <select
                    value={chartConfig.labelPosition || 'middle'}
                    onChange={(e) => onChartConfigChange('labelPosition', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="start">Start</option>
                    <option value="middle">Middle</option>
                    <option value="end">End</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Skip Width</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.labelSkipWidth || 0}
                    onChange={(e) => onChartConfigChange('labelSkipWidth', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.labelSkipWidth || 0}px</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Skip Height</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chartConfig.labelSkipHeight || 0}
                    onChange={(e) => onChartConfigChange('labelSkipHeight', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{chartConfig.labelSkipHeight || 0}px</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animation & Interaction */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">🎬 Animation</h5>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={chartConfig.animate !== false}
                onChange={(e) => onChartConfigChange('animate', e.target.checked)}
                className="rounded"
              />
              Enable Animation
            </label>
            {chartConfig.animate !== false && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motion Config</label>
                <select
                  value={chartConfig.motionConfig || 'default'}
                  onChange={(e) => onChartConfigChange('motionConfig', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="default">Default</option>
                  <option value="gentle">Gentle</option>
                  <option value="wobbly">Wobbly</option>
                  <option value="stiff">Stiff</option>
                  <option value="slow">Slow</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}