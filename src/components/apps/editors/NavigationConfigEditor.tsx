'use client'

import type { DroppedWidget, NavigationConfig } from '@/types/apps/droppedWidget'

interface NavigationConfigEditorProps {
  selectedWidget: DroppedWidget
  navigationConfig: NavigationConfig
  onNavigationConfigChange: (field: string, value: unknown) => void
}

export default function NavigationConfigEditor({
  selectedWidget,
  navigationConfig,
  onNavigationConfigChange
}: NavigationConfigEditorProps) {
  const themes = [
    { value: 'default', label: 'Default', color: 'bg-gray-800' },
    { value: 'dark', label: 'Dark', color: 'bg-gray-900' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-800' },
    { value: 'green', label: 'Green', color: 'bg-green-800' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-800' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-800' }
  ]

  const tabStyles = [
    { value: 'default', label: 'Default' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'pills', label: 'Pills' }
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Sidebar Theme
        </label>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => onNavigationConfigChange('theme', theme.value)}
              className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-all ${
                navigationConfig.theme === theme.value
                  ? 'border-blue-500 bg-blue-900 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={`w-4 h-4 rounded ${theme.color}`}></div>
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tab Style
        </label>
        <select
          value={navigationConfig.tabStyle || 'default'}
          onChange={(e) => onNavigationConfigChange('tabStyle', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {tabStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Show Add Button */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Show Add Tab Button
        </label>
        <input
          type="checkbox"
          checked={navigationConfig.showAddButton !== false}
          onChange={(e) => onNavigationConfigChange('showAddButton', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Max Tabs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Tabs
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={navigationConfig.maxTabs || 10}
          onChange={(e) => onNavigationConfigChange('maxTabs', parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Sidebar Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sidebar Width (px)
        </label>
        <input
          type="number"
          min="200"
          max="400"
          value={navigationConfig.sidebarWidth || 256}
          onChange={(e) => onNavigationConfigChange('sidebarWidth', parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Default: 256px (w-64)
        </p>
      </div>

      {/* Animation Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Animate Tab Switch
          </label>
          <input
            type="checkbox"
            checked={navigationConfig.animateSwitch !== false}
            onChange={(e) => onNavigationConfigChange('animateSwitch', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {navigationConfig.animateSwitch !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animation Duration (ms)
            </label>
            <input
              type="number"
              min="100"
              max="1000"
              step="50"
              value={navigationConfig.animationDuration || 200}
              onChange={(e) => onNavigationConfigChange('animationDuration', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Responsive Features */}
      <div className="p-3 bg-blue-900 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">🔄 Responsive Features</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• Auto-collapse on mobile screens (&lt; 768px)</div>
          <div>• Toggle button for manual collapse/expand</div>
          <div>• Collapsed view shows tab initials only</div>
          <div>• Smooth transitions and animations</div>
        </div>
      </div>

      {/* Current Theme Preview */}
      <div className="p-3 bg-[#333333] rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Theme: <span className="font-medium">{navigationConfig.theme || 'default'}</span></div>
          <div>Max Tabs: <span className="font-medium">{navigationConfig.maxTabs || 10}</span></div>
          <div>Add Button: <span className="font-medium">{navigationConfig.showAddButton !== false ? 'Yes' : 'No'}</span></div>
          <div>Width: <span className="font-medium">{navigationConfig.sidebarWidth || 256}px</span></div>
        </div>
      </div>
    </div>
  )
}