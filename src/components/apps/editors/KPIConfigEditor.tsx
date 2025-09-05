'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { isKPIWidget } from '@/types/apps/kpiWidgets'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import { Slider } from '@/components/ui/slider'

interface KPIConfigEditorProps {
  selectedWidget: DroppedWidget
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

export default function KPIConfigEditor({ 
  selectedWidget, 
  kpiConfig, 
  onKPIConfigChange 
}: KPIConfigEditorProps) {
  
  if (!selectedWidget || !isKPIWidget(selectedWidget)) {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 KPI Configuration</h4>
      
      <div className="space-y-6">
        {/* Data & Values */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📈 Data & Values</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KPI Name</label>
              <input
                type="text"
                value={kpiConfig.name || ''}
                onChange={(e) => onKPIConfigChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sales Revenue"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                <input
                  type="text"
                  value={kpiConfig.unit || ''}
                  onChange={(e) => onKPIConfigChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$, %, units"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Current Value</label>
                <input
                  type="number"
                  step="any"
                  value={kpiConfig.value || ''}
                  onChange={(e) => onKPIConfigChange('value', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1247"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target Value</label>
                <input
                  type="number"
                  step="any"
                  value={kpiConfig.target || ''}
                  onChange={(e) => onKPIConfigChange('target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Change %</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiConfig.change || ''}
                  onChange={(e) => onKPIConfigChange('change', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="7.9"
                />
              </div>
            </div>
          </div>
        </div>
      

        {/* Colors & Styling */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color Scheme</label>
            <select
              value={kpiConfig.colorScheme || 'blue'}
              onChange={(e) => onKPIConfigChange('colorScheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="green">🟢 Green</option>
              <option value="blue">🔵 Blue</option>
              <option value="orange">🟠 Orange</option>
              <option value="red">🔴 Red</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
              <input
                type="color"
                value={kpiConfig.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  console.log('🎨 KPIConfigEditor: Background color changed to:', e.target.value)
                  onKPIConfigChange('backgroundColor', e.target.value)
                }}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Background Opacity</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[((kpiConfig as Record<string, unknown>).backgroundOpacity as number) ?? 1]}
                  onValueChange={([value]) => onKPIConfigChange('backgroundOpacity', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 min-w-[40px] text-right">
                  {Math.round(((kpiConfig as Record<string, unknown>).backgroundOpacity as number ?? 1) * 100)} %
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
              <input
                type="color"
                value={kpiConfig.borderColor || '#e5e7eb'}
                onChange={(e) => onKPIConfigChange('borderColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={((kpiConfig as Record<string, unknown>).borderOpacity as number) ?? 1}
                onChange={(e) => onKPIConfigChange('borderOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round(((kpiConfig as Record<string, unknown>).borderOpacity as number ?? 1) * 100)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
              <input
                type="number"
                min="0"
                max="5"
                value={kpiConfig.borderWidth || 1}
                onChange={(e) => onKPIConfigChange('borderWidth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
              <input
                type="number"
                min="0"
                max="20"
                value={kpiConfig.borderRadius || 8}
                onChange={(e) => onKPIConfigChange('borderRadius', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={kpiConfig.shadow !== false}
                  onChange={(e) => onKPIConfigChange('shadow', e.target.checked)}
                  className="rounded"
                />
                Drop Shadow
              </label>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">✍️ Typography</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Value Styling</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                <input
                  type="range"
                  min="16"
                  max="72"
                  step="2"
                  value={kpiConfig.valueFontSize || 36}
                  onChange={(e) => {
                    console.log('🎨 KPIConfigEditor: Value font size changed to:', e.target.value)
                    onKPIConfigChange('valueFontSize', parseInt(e.target.value))
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{kpiConfig.valueFontSize || 36}px</span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color</label>
                <input
                  type="color"
                  value={kpiConfig.valueColor || '#1f2937'}
                  onChange={(e) => {
                    console.log('🎨 KPIConfigEditor: Value color changed to:', e.target.value)
                    onKPIConfigChange('valueColor', e.target.value)
                  }}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight</label>
                <select
                  value={kpiConfig.valueFontWeight || 700}
                  onChange={(e) => onKPIConfigChange('valueFontWeight', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                >
                  <option value={400}>Normal</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi Bold</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra Bold</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Name Styling</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={kpiConfig.nameFontSize || 14}
                  onChange={(e) => onKPIConfigChange('nameFontSize', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{kpiConfig.nameFontSize || 14}px</span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color</label>
                <input
                  type="color"
                  value={kpiConfig.nameColor || '#6b7280'}
                  onChange={(e) => onKPIConfigChange('nameColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight</label>
                <select
                  value={kpiConfig.nameFontWeight || 500}
                  onChange={(e) => onKPIConfigChange('nameFontWeight', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                >
                  <option value={400}>Normal</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi Bold</option>
                  <option value={700}>Bold</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Change Color</label>
              <input
                type="color"
                value={kpiConfig.changeColor || '#16a34a'}
                onChange={(e) => onKPIConfigChange('changeColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Color</label>
              <input
                type="color"
                value={kpiConfig.targetColor || '#9ca3af'}
                onChange={(e) => onKPIConfigChange('targetColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Layout & Spacing */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Layout & Spacing</h5>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
            <div className="flex gap-1">
              {[
                { value: 'left', icon: '⬅️', label: 'Left' },
                { value: 'center', icon: '⬆️', label: 'Center' },
                { value: 'right', icon: '➡️', label: 'Right' }
              ].map((align) => (
                <button
                  key={align.value}
                  onClick={() => onKPIConfigChange('textAlign', align.value)}
                  className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                    (kpiConfig.textAlign || 'center') === align.value
                      ? 'bg-blue-900 border-blue-300 text-blue-300'
                      : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-1">{align.icon}</span>
                  {align.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
            <input
              type="range"
              min="4"
              max="32"
              step="2"
              value={kpiConfig.padding || 16}
              onChange={(e) => onKPIConfigChange('padding', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>4px</span>
              <span className="font-medium">{kpiConfig.padding || 16}px</span>
              <span>32px</span>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">👁️ Display Options</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Visualization Type</label>
              <div className="flex gap-1">
                {[
                  { value: 'card', label: 'Card', icon: '📄' },
                  { value: 'minimal', label: 'Minimal', icon: '📊' },
                  { value: 'detailed', label: 'Detailed', icon: '📈' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => onKPIConfigChange('visualizationType', type.value)}
                    className={`px-2 py-2 text-xs border rounded-md transition-colors ${
                      (kpiConfig.visualizationType || 'card') === type.value
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={kpiConfig.showTarget !== false}
                  onChange={(e) => onKPIConfigChange('showTarget', e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Target Value</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={kpiConfig.showTrend !== false}
                  onChange={(e) => onKPIConfigChange('showTrend', e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Trend Indicator</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={kpiConfig.enableSimulation !== false}
                  onChange={(e) => onKPIConfigChange('enableSimulation', e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Enable Live Simulation</span>
              </label>
              
              {kpiConfig.enableSimulation !== false && (
                <div className="ml-6 pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Value</label>
                      <input
                        type="number"
                        value={kpiConfig.simulationRange?.min || 800}
                        onChange={(e) => onKPIConfigChange('simulationRange', {
                          ...kpiConfig.simulationRange,
                          min: parseInt(e.target.value) || 800
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Value</label>
                      <input
                        type="number"
                        value={kpiConfig.simulationRange?.max || 1400}
                        onChange={(e) => onKPIConfigChange('simulationRange', {
                          ...kpiConfig.simulationRange,
                          max: parseInt(e.target.value) || 1400
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}