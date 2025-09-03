'use client'

import { useStore } from '@nanostores/react'
import { 
  chartActions, 
  $availableTables, 
  $selectedTable, 
  $tableColumns, 
  $loadingTables, 
  $loadingColumns, 
  $loadingChartUpdate,
  $stagedXAxis,
  $stagedYAxis, 
  $stagedFilters,
  type BigQueryField
} from '@/stores/apps/chartStore'
import { isChartWidget, isBarChart, isLineChart, isPieChart, isAreaChart } from '@/types/apps/chartWidgets'
import type { BaseChartConfig, BarChartConfig, LineChartConfig, PieChartConfig, AreaChartConfig } from '@/types/apps/chartWidgets'
import type { BaseWidget } from '@/types/apps/baseWidget'
import { ColorInput, NumberInput } from '../editors/controls'
import { Slider } from '@/components/ui/slider'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Database, RefreshCw } from 'lucide-react'
import DropZone from '../builder/DropZone'
import DraggableColumn from '../builder/DraggableColumn'
import ContainerConfigEditor from '../editors/ContainerConfigEditor'
import ChartBigQueryUpdate from './ChartBigQueryUpdate'
import type { ContainerConfig } from '@/types/apps/widget'

interface ChartEditorTabsProps {
  selectedWidget: BaseWidget
  chartConfig: BaseChartConfig
  containerConfig: ContainerConfig
  onChartConfigChange: (field: string, value: unknown) => void
  onContainerConfigChange: (field: string, value: unknown) => void
  onWidgetPositionChange: (field: string, value: number) => void
  onChartDragEnd: (event: DragEndEvent) => void
  onRemoveChartField: (dropZoneType: string, fieldName: string) => void
  onUpdateChartData: () => void
  hasChartChanged: boolean
}

export default function ChartEditorTabs({
  selectedWidget,
  chartConfig,
  containerConfig,
  onChartConfigChange,
  onContainerConfigChange,
  onWidgetPositionChange,
  onChartDragEnd,
  onRemoveChartField,
  onUpdateChartData,
  hasChartChanged
}: ChartEditorTabsProps) {
  // Chart data management (using store)
  const availableTables = useStore($availableTables)
  const selectedTable = useStore($selectedTable)
  const tableColumns = useStore($tableColumns)
  const loadingTables = useStore($loadingTables)
  const loadingColumns = useStore($loadingColumns)
  const loadingChartUpdate = useStore($loadingChartUpdate)
  const stagedXAxis = useStore($stagedXAxis)
  const stagedYAxis = useStore($stagedYAxis)
  const stagedFilters = useStore($stagedFilters)

  const renderChartDesignTab = () => (
    <div className="space-y-6">
      {/* Visual & Colors */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🎨 Visual & Colors</h3>
        <div className="space-y-4">
          {/* Background */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Background</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                    style={{ backgroundColor: chartConfig.backgroundColor || '#ffffff' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = chartConfig.backgroundColor || '#ffffff';
                      input.onchange = (e) => onChartConfigChange('backgroundColor', (e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <input
                    type="text"
                    value={(chartConfig.backgroundColor || '#ffffff').replace('#', '').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                        onChartConfigChange('backgroundColor', `#${hex}`);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(((chartConfig as Record<string, unknown>).backgroundOpacity as number ?? 1) * 100)}
                    onChange={(e) => {
                      const opacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                      onChartConfigChange('backgroundOpacity', opacity);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Border */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Border</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                    style={{ backgroundColor: chartConfig.borderColor || '#e5e7eb' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = chartConfig.borderColor || '#e5e7eb';
                      input.onchange = (e) => onChartConfigChange('borderColor', (e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <input
                    type="text"
                    value={(chartConfig.borderColor || '#e5e7eb').replace('#', '').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                        onChartConfigChange('borderColor', `#${hex}`);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={chartConfig.borderWidth || 0}
                    onChange={(e) => {
                      const width = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                      onChartConfigChange('borderWidth', width);
                    }}
                    className="w-full h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Text */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">✍️ Title & Text</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title Text</label>
            <input
              type="text"
              value={chartConfig.title || ''}
              onChange={(e) => onChartConfigChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Chart Title"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="Font Size"
              value={chartConfig.titleFontSize || 16}
              onChange={(value) => onChartConfigChange('titleFontSize', value)}
              min={12}
              max={32}
              step={1}
              suffix="px"
            />
            <ColorInput
              label="Color"
              value={chartConfig.titleColor || '#1f2937'}
              onChange={(value) => onChartConfigChange('titleColor', value)}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
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
        </div>
      </div>

      {/* Animation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🎬 Animation</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Motion Config</label>
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

      {/* Chart Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">⚙️ Chart Settings</h3>
        <div className="space-y-4">
          {/* Color Scheme - Common to all charts */}
          {selectedWidget && isChartWidget(selectedWidget) && (
            <div className="bg-gray-50 rounded px-3 py-2">
              <label className="block text-xs text-gray-600 mb-2">🎨 Color Scheme</label>
              <select
                value={chartConfig.colorScheme?.scheme || 'nivo'}
                onChange={(e) => onChartConfigChange('colorScheme', { scheme: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nivo">Nivo (Default)</option>
                <option value="category10">Category 10</option>
                <option value="accent">Accent</option>
                <option value="dark2">Dark 2</option>
                <option value="paired">Paired</option>
                <option value="pastel1">Pastel 1</option>
                <option value="pastel2">Pastel 2</option>
                <option value="set1">Set 1</option>
                <option value="set2">Set 2</option>
                <option value="set3">Set 3</option>
              </select>
            </div>
          )}

          {/* Bar Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isBarChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Display Mode</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center">
                    <select
                      value={(chartConfig as BarChartConfig).groupMode || 'stacked'}
                      onChange={(e) => onChartConfigChange('groupMode', e.target.value as 'grouped' | 'stacked')}
                      className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    >
                      <option value="grouped">Grouped</option>
                      <option value="stacked">Stacked</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center">
                    <select
                      value={(chartConfig as BarChartConfig).layout || 'vertical'}
                      onChange={(e) => onChartConfigChange('layout', e.target.value as 'horizontal' | 'vertical')}
                      className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Additional Bar Chart Style Props */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Style Options</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Bar Spacing</label>
                    <Slider
                      value={[(chartConfig as BarChartConfig).padding || 0.3]}
                      onValueChange={([value]) => onChartConfigChange('padding', value)}
                      max={0.8}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Inner Padding</label>
                    <Slider
                      value={[(chartConfig as BarChartConfig).innerPadding || 0]}
                      onValueChange={([value]) => onChartConfigChange('innerPadding', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isLineChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Line Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Curve</label>
                  <select
                    value={(chartConfig as LineChartConfig).curve || 'cardinal'}
                    onChange={(e) => onChartConfigChange('curve', e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="linear">Linear</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull Rom</option>
                    <option value="monotoneX">Monotone X</option>
                  </select>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Line Width</label>
                  <Slider
                    value={[(chartConfig as LineChartConfig).lineWidth || 2]}
                    onValueChange={([value]) => onChartConfigChange('lineWidth', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as LineChartConfig).enablePoints !== false}
                    onChange={(e) => onChartConfigChange('enablePoints', e.target.checked)}
                    className="rounded"
                  />
                  Points
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as LineChartConfig).enableArea || false}
                    onChange={(e) => onChartConfigChange('enableArea', e.target.checked)}
                    className="rounded"
                  />
                  Fill Area
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Point Size</label>
                  <Slider
                    value={[(chartConfig as LineChartConfig).pointSize || 4]}
                    onValueChange={([value]) => onChartConfigChange('pointSize', value)}
                    max={15}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Line Chart Style Props */}
              {(chartConfig as LineChartConfig).enableArea && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-600 mb-2">Area Style</h5>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Area Opacity</label>
                    <Slider
                      value={[(chartConfig as LineChartConfig).areaOpacity || 0.2]}
                      onValueChange={([value]) => onChartConfigChange('areaOpacity', value)}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pie Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isPieChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Pie Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Inner Radius</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).innerRadius || 0]}
                    onValueChange={([value]) => onChartConfigChange('innerRadius', value)}
                    max={0.9}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Corner Radius</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).cornerRadius || 2]}
                    onValueChange={([value]) => onChartConfigChange('cornerRadius', value)}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as PieChartConfig).enableArcLinkLabels !== false}
                    onChange={(e) => onChartConfigChange('enableArcLinkLabels', e.target.checked)}
                    className="rounded"
                  />
                  Arc Labels
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Pad Angle</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).padAngle || 0.7]}
                    onValueChange={([value]) => onChartConfigChange('padAngle', value)}
                    max={5}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Pie Chart Style Props */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Advanced Style</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Active Offset</label>
                    <Slider
                      value={[(chartConfig as PieChartConfig).activeOuterRadiusOffset || 8]}
                      onValueChange={([value]) => onChartConfigChange('activeOuterRadiusOffset', value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Arc Skip Angle</label>
                    <Slider
                      value={[(chartConfig as PieChartConfig).arcLabelsSkipAngle || 10]}
                      onValueChange={([value]) => onChartConfigChange('arcLabelsSkipAngle', value)}
                      max={45}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Area Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isAreaChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Area Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Curve</label>
                  <select
                    value={(chartConfig as AreaChartConfig).curve || 'cardinal'}
                    onChange={(e) => onChartConfigChange('curve', e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="linear">Linear</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull Rom</option>
                    <option value="monotoneX">Monotone X</option>
                  </select>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Area Opacity</label>
                  <Slider
                    value={[(chartConfig as AreaChartConfig).areaOpacity || 0.15]}
                    onValueChange={([value]) => onChartConfigChange('areaOpacity', value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as AreaChartConfig).enablePoints || false}
                    onChange={(e) => onChartConfigChange('enablePoints', e.target.checked)}
                    className="rounded"
                  />
                  Show Points
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Line Width</label>
                  <Slider
                    value={[(chartConfig as AreaChartConfig).lineWidth || 2]}
                    onValueChange={([value]) => onChartConfigChange('lineWidth', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Area Chart Style Props */}
              {(chartConfig as AreaChartConfig).enablePoints && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-600 mb-2">Point Style</h5>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Point Size</label>
                    <Slider
                      value={[(chartConfig as AreaChartConfig).pointSize || 6]}
                      onValueChange={([value]) => onChartConfigChange('pointSize', value)}
                      max={15}
                      min={2}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Spacing</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.padding || 0.1]}
                    onValueChange={([value]) => onChartConfigChange('padding', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.padding || 0.1}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.innerPadding || 0]}
                    onValueChange={([value]) => onChartConfigChange('innerPadding', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.innerPadding || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container Configuration - Design Tab Only */}
      {selectedWidget && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ContainerConfigEditor
            selectedWidget={selectedWidget}
            containerConfig={containerConfig}
            onContainerConfigChange={onContainerConfigChange}
          />
        </div>
      )}
    </div>
  )

  const renderChartLayoutTab = () => (
    <div className="space-y-6">
      {/* Layout & Spacing */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📏 Layout & Spacing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Margin</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <NumberInput
                  label="Top"
                  value={chartConfig.margin?.top || 60}
                  onChange={(value) => onChartConfigChange('margin', { ...chartConfig.margin, top: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Right"
                  value={chartConfig.margin?.right || 80}
                  onChange={(value) => onChartConfigChange('margin', { ...chartConfig.margin, right: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Bottom"
                  value={chartConfig.margin?.bottom || 60}
                  onChange={(value) => onChartConfigChange('margin', { ...chartConfig.margin, bottom: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Left"
                  value={chartConfig.margin?.left || 60}
                  onChange={(value) => onChartConfigChange('margin', { ...chartConfig.margin, left: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
            </div>
          </div>
          <div>
            <NumberInput
              label="Padding"
              value={chartConfig.padding || 0}
              onChange={(value) => onChartConfigChange('padding', value)}
              min={0}
              max={50}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      </div>

      {/* Grid & Axes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📐 Grid & Axes</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chartConfig.enableGridX !== false}
                onChange={(e) => onChartConfigChange('enableGridX', e.target.checked)}
                className="rounded"
              />
              Enable Grid X
            </label>
            <label className="flex items-center gap-2 text-sm">
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
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Bottom Axis</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Legend</label>
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
                  <NumberInput
                    label="Rotation"
                    value={chartConfig.axisBottom?.tickRotation || 0}
                    onChange={(value) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickRotation: value })}
                    min={-90}
                    max={90}
                    step={15}
                    suffix="°"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Tick Size"
                    value={chartConfig.axisBottom?.tickSize || 5}
                    onChange={(value) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickSize: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Padding"
                    value={chartConfig.axisBottom?.tickPadding || 5}
                    onChange={(value) => onChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickPadding: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Left Axis */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Left Axis</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Legend</label>
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
                  <NumberInput
                    label="Rotation"
                    value={chartConfig.axisLeft?.tickRotation || 0}
                    onChange={(value) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickRotation: value })}
                    min={-90}
                    max={90}
                    step={15}
                    suffix="°"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Tick Size"
                    value={chartConfig.axisLeft?.tickSize || 5}
                    onChange={(value) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickSize: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Padding"
                    value={chartConfig.axisLeft?.tickPadding || 5}
                    onChange={(value) => onChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickPadding: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChartDataTab = () => {
    // Convert chart config fields to SelectedField format
    const currentXAxisFields = chartConfig.xAxis?.field ? [{
      name: chartConfig.xAxis.field,
      type: chartConfig.xAxis.type || 'string',
      sourceTable: chartConfig.dataSource || ''
    }] : []

    const currentYAxisFields = chartConfig.yAxis?.field ? [{
      name: chartConfig.yAxis.field,
      type: chartConfig.yAxis.type || 'numeric',
      sourceTable: chartConfig.dataSource || ''
    }] : []

    const currentFilterFields = chartConfig.filters?.map(filter => ({
      name: filter.name,
      type: filter.type,
      sourceTable: chartConfig.dataSource || ''
    })) || []

    // Get saved SQL query from widget bigqueryData
    const getSavedChartQuery = (): string => {
      return (selectedWidget as any)?.bigqueryData?.query || ''
    }

    return (
      <div className="space-y-6">
        {/* Chart Data Fields */}
        <ChartBigQueryUpdate
          currentXAxisFields={currentXAxisFields}
          currentYAxisFields={currentYAxisFields}
          currentFilterFields={currentFilterFields}
          getSavedChartQuery={getSavedChartQuery}
          hasUpdatedChartQuery={false} // TODO: Implement updated query tracking
          updatedChartQuery={''} // TODO: Implement updated query tracking
          onChartDragEnd={onChartDragEnd}
          onRemoveChartField={onRemoveChartField}
          onUpdateChartData={onUpdateChartData}
          onShowSqlModal={(query: string) => {
            // TODO: Implement SQL modal display similar to TableConfigEditor
            console.log('Show SQL Modal:', query)
          }}
          hasChartChanged={hasChartChanged}
        />

      {/* Labels */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🏷️ Labels</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chartConfig.enableLabel !== false}
                onChange={(e) => onChartConfigChange('enableLabel', e.target.checked)}
                className="rounded"
              />
              Enable Labels
            </label>
            <ColorInput
              label="Label Color"
              value={chartConfig.labelTextColor || '#374151'}
              onChange={(value) => onChartConfigChange('labelTextColor', value)}
            />
          </div>
          {chartConfig.enableLabel !== false && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Position</label>
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
                <NumberInput
                  label="Skip Width"
                  value={chartConfig.labelSkipWidth || 0}
                  onChange={(value) => onChartConfigChange('labelSkipWidth', value)}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Skip Height"
                  value={chartConfig.labelSkipHeight || 0}
                  onChange={(value) => onChartConfigChange('labelSkipHeight', value)}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📍 Position & Size</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={selectedWidget?.x || 0}
                    onChange={(e) => {
                      const x = Math.max(0, Math.min(11, parseInt(e.target.value) || 0));
                      onWidgetPositionChange('x', x);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">X</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={selectedWidget?.y || 0}
                    onChange={(e) => {
                      const y = Math.max(0, parseInt(e.target.value) || 0);
                      onWidgetPositionChange('y', y);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">Y</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedWidget?.w || 4}
                    onChange={(e) => {
                      const w = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                      onWidgetPositionChange('w', w);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">W</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={selectedWidget?.h || 3}
                    onChange={(e) => {
                      const h = Math.max(1, parseInt(e.target.value) || 1);
                      onWidgetPositionChange('h', h);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">H</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legends */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🏷️ Legends</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Direction & Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <select
                    value={chartConfig.legends?.direction || 'column'}
                    onChange={(e) => onChartConfigChange('legends', { ...chartConfig.legends, direction: e.target.value as 'column' | 'row' })}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="column">Column</option>
                    <option value="row">Row</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.translateY || 0]}
                    onValueChange={([value]) => onChartConfigChange('legends', { ...chartConfig.legends, translateY: value })}
                    max={100}
                    min={-100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.translateY || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Item Settings</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemWidth || 60]}
                    onValueChange={([value]) => onChartConfigChange('legends', { ...chartConfig.legends, itemWidth: value })}
                    max={200}
                    min={20}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemWidth || 60}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemHeight || 18]}
                    onValueChange={([value]) => onChartConfigChange('legends', { ...chartConfig.legends, itemHeight: value })}
                    max={50}
                    min={10}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemHeight || 18}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemsSpacing || 2]}
                    onValueChange={([value]) => onChartConfigChange('legends', { ...chartConfig.legends, itemsSpacing: value })}
                    max={20}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemsSpacing || 2}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.symbolSize || 12]}
                    onValueChange={([value]) => onChartConfigChange('legends', { ...chartConfig.legends, symbolSize: value })}
                    max={30}
                    min={6}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.symbolSize || 12}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Item Direction</h4>
            <div className="bg-gray-50 rounded px-2 py-1">
              <div className="flex items-center">
                <select
                  value={chartConfig.legends?.itemDirection || 'left-to-right'}
                  onChange={(e) => {
                    onChartConfigChange('legends', { ...chartConfig.legends, itemDirection: e.target.value });
                  }}
                  className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                >
                  <option value="left-to-right">Left to Right</option>
                  <option value="right-to-left">Right to Left</option>
                  <option value="top-to-bottom">Top to Bottom</option>
                  <option value="bottom-to-top">Bottom to Top</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

  return {
    renderChartDesignTab,
    renderChartLayoutTab,
    renderChartDataTab
  }
}