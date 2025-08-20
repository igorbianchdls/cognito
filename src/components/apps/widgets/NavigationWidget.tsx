'use client'

import { useState, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { $multiCanvasState, $activeTab, multiCanvasActions } from '@/stores/multiCanvasStore'
import type { DroppedWidget } from '@/types/widget'

interface NavigationWidgetProps {
  widget: DroppedWidget
}

export default function NavigationWidget({ widget }: NavigationWidgetProps) {
  const multiCanvasState = useStore($multiCanvasState)
  const activeTab = useStore($activeTab)
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const config = widget.config?.navigationConfig || {}

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

  const tabStyle = config.tabStyle || 'default'
  const showAddButton = config.showAddButton !== false
  const maxTabs = config.maxTabs || 10

  return (
    <div 
      className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: config.backgroundColor || '#ffffff',
        borderColor: config.borderColor || '#e5e7eb',
        borderRadius: `${config.borderRadius || 8}px`
      }}
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">📑</span>
          <span className="text-sm font-medium text-gray-700">Navigation</span>
        </div>
        <div className="text-xs text-gray-500">
          {multiCanvasState.tabs.length} tab{multiCanvasState.tabs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabs Container */}
      <div className="px-2 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {multiCanvasState.tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`group flex items-center min-w-0 px-3 py-1.5 rounded cursor-pointer transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${
                tabStyle === 'rounded' ? 'rounded-lg' : 
                tabStyle === 'pills' ? 'rounded-full' : 'rounded'
              }`}
            >
              {/* Tab Content */}
              <div className="flex items-center min-w-0 gap-2">
                {editingTab === tab.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleRename(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    className="bg-transparent border-0 outline-0 text-sm min-w-0 w-20"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span 
                      className="text-sm truncate max-w-24"
                      onDoubleClick={(e) => startRename(e, tab.id, tab.name)}
                    >
                      {tab.name}
                    </span>
                    
                    {/* Widget Count Badge */}
                    {tab.widgets.length > 0 && (
                      <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full min-w-0">
                        {tab.widgets.length}
                      </span>
                    )}
                  </>
                )}
                
                {/* Close Button */}
                {multiCanvasState.tabs.length > 1 && (
                  <button
                    onClick={(e) => handleRemoveTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 ml-1 flex-shrink-0"
                    title="Remove tab"
                  >
                    <span className="text-sm">×</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Add Tab Button */}
          {showAddButton && multiCanvasState.tabs.length < maxTabs && (
            <button
              onClick={handleAddTab}
              className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all duration-200 flex-shrink-0"
              title="Add new tab"
            >
              <span className="text-sm">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Active: {multiCanvasState.tabs.find(t => t.id === activeTab)?.name}</span>
          <span>{multiCanvasState.tabs.find(t => t.id === activeTab)?.widgets.length || 0} widgets</span>
        </div>
      </div>
    </div>
  )
}