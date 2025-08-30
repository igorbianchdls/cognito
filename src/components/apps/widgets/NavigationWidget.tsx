'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $multiCanvasState, $activeTab, multiCanvasActions } from '@/stores/apps/multiCanvasStore'
import type { DroppedWidget } from '@/types/widget'

interface NavigationWidgetProps {
  widget: DroppedWidget
}

export default function NavigationWidget({ widget }: NavigationWidgetProps) {
  const multiCanvasState = useStore($multiCanvasState)
  const activeTab = useStore($activeTab)
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const config = widget.config?.navigationConfig || {}

  // Auto-collapse on mobile screens
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768 // md breakpoint
      setIsCollapsed(isMobile)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleTabClick = (tabId: string) => {
    if (editingTab === tabId) return
    multiCanvasActions.switchTab(tabId)
  }

  const handleAddTab = () => {
    multiCanvasActions.addTab()
  }

  const handleRemoveTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    multiCanvasActions.removeTab(tabId)
  }

  const startRename = (e: React.MouseEvent, tabId: string, currentName: string) => {
    e.stopPropagation()
    setEditingTab(tabId)
    setTempName(currentName)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const handleRename = (tabId: string) => {
    if (tempName.trim()) {
      multiCanvasActions.renameTab(tabId, tempName.trim())
    }
    setEditingTab(null)
    setTempName('')
  }

  const cancelRename = () => {
    setEditingTab(null)
    setTempName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleRename(tabId)
    } else if (e.key === 'Escape') {
      cancelRename()
    }
  }

  const showAddButton = config.showAddButton !== false
  const maxTabs = config.maxTabs || 10
  const theme = config.theme || 'default'

  // Theme configurations
  const themes = {
    default: {
      bg: 'bg-gray-800',
      text: 'text-gray-100',
      activeText: 'text-white',
      activeBg: 'bg-blue-600',
      hover: 'hover:bg-gray-700',
      border: 'border-gray-700'
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-gray-300',
      activeText: 'text-white',
      activeBg: 'bg-gray-700',
      hover: 'hover:bg-gray-800',
      border: 'border-gray-800'
    },
    blue: {
      bg: 'bg-blue-800',
      text: 'text-blue-100',
      activeText: 'text-white',
      activeBg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      border: 'border-blue-700'
    },
    green: {
      bg: 'bg-green-800',
      text: 'text-green-100',
      activeText: 'text-white',
      activeBg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      border: 'border-green-700'
    },
    purple: {
      bg: 'bg-purple-800',
      text: 'text-purple-100',
      activeText: 'text-white',
      activeBg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      border: 'border-purple-700'
    },
    orange: {
      bg: 'bg-orange-800',
      text: 'text-orange-100',
      activeText: 'text-white',
      activeBg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      border: 'border-orange-700'
    }
  }

  const currentTheme = themes[theme]

  return (
    <div className={`w-full h-full ${currentTheme.bg} overflow-hidden flex flex-col transition-all duration-300`}>
      {/* Sidebar Header */}
      <div className={`px-4 py-4 border-b ${currentTheme.border}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className="text-xl">📑</span>
            {!isCollapsed && (
              <div>
                <h2 className={`text-sm font-semibold ${currentTheme.activeText}`}>Navigation</h2>
                <p className={`text-xs ${currentTheme.text}`}>
                  {multiCanvasState.tabs.length} tab{multiCanvasState.tabs.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-md ${currentTheme.hover} transition-colors ${currentTheme.text} hover:${currentTheme.activeText}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-sm">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs List - Vertical Stack */}
      <div className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-1 px-3">
          {multiCanvasState.tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                activeTab === tab.id
                  ? `${currentTheme.activeBg} ${currentTheme.activeText} shadow-sm`
                  : `${currentTheme.text} ${currentTheme.hover}`
              }`}
              title={isCollapsed ? tab.name : undefined}
            >
              {isCollapsed ? (
                /* Collapsed view - only show first letter */
                <div className="flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {tab.name.charAt(0).toUpperCase()}
                  </span>
                  {tab.widgets.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.widgets.length > 9 ? '9+' : tab.widgets.length}
                    </span>
                  )}
                </div>
              ) : (
                /* Expanded view - full content */
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {editingTab === tab.id ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => handleRename(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, tab.id)}
                        className="bg-transparent border-0 outline-0 text-sm flex-1 text-white placeholder-gray-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="text-sm font-medium truncate"
                        onDoubleClick={(e) => startRename(e, tab.id, tab.name)}
                      >
                        {tab.name}
                      </span>
                    )}
                    
                    {/* Widget Count Badge */}
                    {tab.widgets.length > 0 && !editingTab && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {tab.widgets.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  {multiCanvasState.tabs.length > 1 && (
                    <button
                      onClick={(e) => handleRemoveTab(e, tab.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 ml-2 flex-shrink-0 p-1"
                      title="Remove tab"
                    >
                      <span className="text-sm">×</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Add Tab Button */}
        {showAddButton && multiCanvasState.tabs.length < maxTabs && (
          <div className="px-3 mt-2">
            <button
              onClick={handleAddTab}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed ${currentTheme.border} ${currentTheme.text} ${currentTheme.hover} rounded-lg transition-all duration-200`}
              title="Add new tab"
            >
              <span className="text-sm">+</span>
              {!isCollapsed && <span className="text-sm font-medium">Add Tab</span>}
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className={`px-4 py-3 border-t ${currentTheme.border} bg-black bg-opacity-10`}>
          <div className="space-y-1">
            <div className={`text-xs font-medium ${currentTheme.activeText}`}>
              Active: {multiCanvasState.tabs.find(t => t.id === activeTab)?.name}
            </div>
            <div className={`text-xs ${currentTheme.text}`}>
              {multiCanvasState.tabs.find(t => t.id === activeTab)?.widgets.length || 0} widgets in this tab
            </div>
          </div>
        </div>
      )}
    </div>
  )
}