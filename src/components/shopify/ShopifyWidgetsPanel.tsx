'use client'

import { useDraggable } from '@dnd-kit/core'
import type { ShopifyWidget } from '@/types/shopifyWidgets'

interface ShopifyDraggableWidgetProps {
  widget: Omit<ShopifyWidget, 'i' | 'order' | 'config'>
}

function ShopifyDraggableWidget({ widget }: ShopifyDraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: widget.id,
    data: widget,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group border rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
        isDragging 
          ? 'opacity-50 cursor-grabbing bg-purple-50 border-purple-300' 
          : 'bg-gray-50 hover:bg-purple-50 border-gray-200 hover:border-purple-300 cursor-grab'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
          {widget.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm group-hover:text-purple-900">
            {widget.name}
          </div>
          <div className="text-xs text-gray-500 group-hover:text-purple-600 truncate">
            {widget.description}
          </div>
        </div>
      </div>
      
      {/* Drag indicator */}
      <div className="mt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

interface ShopifyWidgetsPanelProps {
  availableWidgets: Omit<ShopifyWidget, 'i' | 'order' | 'config'>[]
}

export default function ShopifyWidgetsPanel({ availableWidgets }: ShopifyWidgetsPanelProps) {
  // Organize widgets by category
  const organizedWidgets = {
    layout: availableWidgets.filter(w => ['header', 'footer'].includes(w.type)),
    content: availableWidgets.filter(w => ['hero', 'product-grid', 'categories'].includes(w.type)),
    functionality: availableWidgets.filter(w => ['search', 'cart'].includes(w.type))
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🛍️</span>
          <h2 className="text-lg font-semibold text-gray-900">Store Components</h2>
        </div>
        <p className="text-sm text-gray-600">
          Drag components to the canvas to build your store
        </p>
      </div>

      {/* Widgets List */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        
        {/* Layout Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>🏗️</span>
            Layout
          </h3>
          <div className="space-y-3">
            {organizedWidgets.layout.map((widget) => (
              <ShopifyDraggableWidget key={widget.id} widget={widget} />
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>📝</span>
            Content
          </h3>
          <div className="space-y-3">
            {organizedWidgets.content.map((widget) => (
              <ShopifyDraggableWidget key={widget.id} widget={widget} />
            ))}
          </div>
        </div>

        {/* Functionality Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>⚙️</span>
            Functionality
          </h3>
          <div className="space-y-3">
            {organizedWidgets.functionality.map((widget) => (
              <ShopifyDraggableWidget key={widget.id} widget={widget} />
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-purple-50">
        <div className="text-xs text-purple-700">
          <p className="mb-2">💡 <strong>How to use:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Drag components to the canvas</li>
            <li>• Components stack vertically</li>
            <li>• Use ↑↓ arrows to reorder</li>
            <li>• Click × to remove components</li>
          </ul>
        </div>
      </div>
    </div>
  )
}