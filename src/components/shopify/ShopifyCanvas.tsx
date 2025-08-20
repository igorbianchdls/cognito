'use client'

import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { useDroppable } from '@dnd-kit/core'
import ShopifyDroppedWidget from './ShopifyDroppedWidget'
import { $selectedShopifyId, $orderedShopifyWidgets } from '@/stores/shopifyStore'
import type { ShopifyWidget } from '@/types/shopifyWidgets'

interface ShopifyCanvasProps {
  widgets: ShopifyWidget[]
  onRemoveWidget: (widgetId: string) => void
  onSelectWidget: (widgetId: string | null) => void
  onMoveWidgetUp: (widgetId: string) => void
  onMoveWidgetDown: (widgetId: string) => void
}

export default function ShopifyCanvas({ 
  widgets,
  onRemoveWidget,
  onSelectWidget,
  onMoveWidgetUp,
  onMoveWidgetDown
}: ShopifyCanvasProps) {
  const selectedWidgetId = useStore($selectedShopifyId)
  const orderedWidgets = useStore($orderedShopifyWidgets)
  const { setNodeRef, isOver } = useDroppable({
    id: 'shopify-canvas-droppable'
  })

  const handleWidgetClick = (widgetId: string) => {
    onSelectWidget(widgetId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>🏪</span>
              Store Preview
            </h2>
            <p className="text-sm text-gray-600">
              {widgets.length === 0 
                ? 'Drop components here to build your store'
                : `Preview of your store with ${widgets.length} component${widgets.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          
          {/* Canvas Controls */}
          {widgets.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                title="Zoom to fit"
              >
                🔍 Fit
              </button>
              <button
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                title="Full screen preview"
              >
                ⛶ Fullscreen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-4xl">
          {/* Device Frame */}
          <div className="bg-gray-800 p-2 rounded-lg shadow-lg">
            {/* Device Header */}
            <div className="bg-gray-700 px-3 py-2 rounded-t flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-300 bg-gray-600 px-3 py-1 rounded">
                  your-store.myshopify.com
                </div>
              </div>
            </div>

            {/* Canvas Drop Area */}
            <div 
              ref={setNodeRef}
              className={`min-h-[600px] bg-white overflow-y-auto relative transition-colors ${
                isOver ? 'bg-purple-50 border-2 border-purple-300 border-dashed' : ''
              }`}
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              {widgets.length === 0 ? (
                /* Empty State */
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛍️</div>
                    <p className="text-lg font-medium">Build Your Store</p>
                    <p className="text-sm">Drag components from the left panel to get started</p>
                    <div className="mt-4 text-xs text-gray-500">
                      Start with a Header → Add Hero Banner → Include Products
                    </div>
                  </div>
                </div>
              ) : (
                /* Widgets List - Stacked Vertically */
                <div className="relative">
                  {orderedWidgets.map((widget, index) => (
                    <div 
                      key={widget.i}
                      onClick={() => handleWidgetClick(widget.i)}
                      className={`relative transition-all duration-200 ${
                        selectedWidgetId === widget.i 
                          ? 'ring-2 ring-purple-500 ring-opacity-75' 
                          : ''
                      }`}
                    >
                      <ShopifyDroppedWidget 
                        widget={widget} 
                        onRemove={() => onRemoveWidget(widget.i)}
                        onMoveUp={index > 0 ? () => onMoveWidgetUp(widget.i) : undefined}
                        onMoveDown={index < orderedWidgets.length - 1 ? () => onMoveWidgetDown(widget.i) : undefined}
                        isSelected={selectedWidgetId === widget.i}
                        position={index + 1}
                        totalWidgets={orderedWidgets.length}
                      />
                    </div>
                  ))}
                  
                  {/* Drop Zone Indicator at Bottom */}
                  {isOver && (
                    <div className="h-16 border-2 border-purple-300 border-dashed bg-purple-50 flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-medium">
                        Drop component here
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Canvas Info */}
          {widgets.length > 0 && (
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>This is a preview of how your store will look to customers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}