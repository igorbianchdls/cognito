'use client'

interface ShopifyHeaderProps {
  activeTab: 'widgets' | 'editor'
  onTabChange: (tab: 'widgets' | 'editor') => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  widgetCount: number
  onClearCanvas: () => void
}

export default function ShopifyHeader({ 
  activeTab,
  onTabChange,
  sidebarCollapsed, 
  onToggleSidebar, 
  widgetCount,
  onClearCanvas 
}: ShopifyHeaderProps) {
  
  const handleClearClick = () => {
    if (widgetCount === 0) return
    
    if (confirm(`Are you sure you want to clear all ${widgetCount} widgets from the canvas?`)) {
      onClearCanvas()
    }
  }

  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: '🧩' },
    { id: 'editor', label: 'Editor', icon: '⚙️' },
  ] as const

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Toggle Sidebar Button */}
          <button
            onClick={onToggleSidebar}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg font-mono">
              {sidebarCollapsed ? '☰' : '⟨'}
            </span>
          </button>

          {/* Store Title */}
          <div className="flex items-center gap-3 mr-6">
            <span className="text-2xl">🛍️</span>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Shopify Builder</h1>
              <p className="text-sm text-gray-600">
                {widgetCount === 0 
                  ? 'Build your store with drag & drop'
                  : `${widgetCount} component${widgetCount !== 1 ? 's' : ''} added`
                }
              </p>
            </div>
          </div>

          {/* Tabs */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Clear Canvas Button */}
          <button
            onClick={handleClearClick}
            disabled={widgetCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              widgetCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
            title="Clear all widgets from canvas"
          >
            <span className="text-base">🧹</span>
            Clear Canvas
          </button>

          {/* Preview Button */}
          <button
            disabled={widgetCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              widgetCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Preview your store"
          >
            <span className="text-base">👁️</span>
            Preview
          </button>

          {/* Save Store Button */}
          <button
            disabled={widgetCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              widgetCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Save your store configuration"
          >
            <span className="text-base">💾</span>
            Save Store
          </button>
        </div>
      </div>

      {/* Store Stats Bar */}
      {widgetCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Store Ready
            </div>
            <div>
              {widgetCount} Component{widgetCount !== 1 ? 's' : ''} Added
            </div>
            <div>
              Auto-saved 2 min ago
            </div>
          </div>
        </div>
      )}
    </div>
  )
}