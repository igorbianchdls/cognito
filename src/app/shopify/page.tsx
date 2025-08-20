'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@nanostores/react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import ShopifyHeader from '@/components/shopify/ShopifyHeader'
import ShopifyWidgetsPanel from '@/components/shopify/ShopifyWidgetsPanel'
import ShopifyEditorPanel from '@/components/shopify/ShopifyEditorPanel'
import ShopifyCanvas from '@/components/shopify/ShopifyCanvas'
import { $shopifyWidgets, shopifyActions } from '@/stores/shopifyStore'
import type { ShopifyWidget } from '@/types/shopifyWidgets'

// Available Shopify widgets que podem ser arrastados para o canvas
const availableShopifyWidgets: Omit<ShopifyWidget, 'i' | 'order' | 'config'>[] = [
  {
    id: 'header-template',
    name: 'Header',
    type: 'header',
    icon: '🏠',
    description: 'Navigation header with logo and menu'
  },
  {
    id: 'hero-template', 
    name: 'Hero Banner',
    type: 'hero',
    icon: '🎯',
    description: 'Large promotional banner section'
  },
  {
    id: 'product-grid-template',
    name: 'Product Grid',
    type: 'product-grid', 
    icon: '🛍️',
    description: 'Grid of products with filters'
  },
  {
    id: 'categories-template',
    name: 'Categories',
    type: 'categories',
    icon: '📂',
    description: 'Product categories showcase'
  },
  {
    id: 'search-template',
    name: 'Search Bar',
    type: 'search',
    icon: '🔍',
    description: 'Product search functionality'
  },
  {
    id: 'cart-template', 
    name: 'Cart Widget',
    type: 'cart',
    icon: '🛒',
    description: 'Shopping cart display'
  },
  {
    id: 'footer-template',
    name: 'Footer',
    type: 'footer',
    icon: '📄',
    description: 'Footer with links and information'
  }
]

export default function ShopifyPage() {
  const shopifyWidgets = useStore($shopifyWidgets)
  const [activeWidget, setActiveWidget] = useState<Omit<ShopifyWidget, 'i' | 'order' | 'config'> | null>(null)
  const [activeTab, setActiveTab] = useState<'widgets' | 'editor'>('widgets')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const widget = active.data.current as Omit<ShopifyWidget, 'i' | 'order' | 'config'>
    setActiveWidget(widget)
    console.log('🛍️ Drag start:', widget.name)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveWidget(null)
    
    if (over?.id === 'shopify-canvas-droppable') {
      const widget = active.data.current as Omit<ShopifyWidget, 'i' | 'order' | 'config'>
      
      console.log('🛍️ Dropping widget on canvas:', widget.name, widget.type)
      
      // Adiciona o widget ao canvas
      shopifyActions.addShopifyWidget({
        name: widget.name,
        type: widget.type as ShopifyWidget['type'],
        icon: widget.icon,
        description: widget.description
      })
    }
  }

  const handleRemoveWidget = useCallback((widgetId: string) => {
    shopifyActions.removeShopifyWidget(widgetId)
  }, [])

  const handleSelectWidget = useCallback((widgetId: string | null) => {
    shopifyActions.selectShopifyWidget(widgetId)
  }, [])

  const handleMoveWidgetUp = useCallback((widgetId: string) => {
    shopifyActions.moveShopifyWidgetUp(widgetId)
  }, [])

  const handleMoveWidgetDown = useCallback((widgetId: string) => {
    shopifyActions.moveShopifyWidgetDown(widgetId)
  }, [])

  const handleClearCanvas = useCallback(() => {
    shopifyActions.clearShopifyWidgets()
  }, [])

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <ShopifyHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          widgetCount={shopifyWidgets.length}
          onClearCanvas={handleClearCanvas}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className={`${
            sidebarCollapsed 
              ? 'w-0 overflow-hidden' 
              : 'w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden'
          } transition-all duration-300 ease-in-out`} style={{ height: 'calc(100vh - 80px)' }}>
            {activeTab === 'widgets' && <ShopifyWidgetsPanel availableWidgets={availableShopifyWidgets} />}
            {activeTab === 'editor' && <ShopifyEditorPanel />}
          </div>
          
          {/* Right Canvas - Store Preview */}
          <div className="flex-1 p-6">
            <ShopifyCanvas 
              widgets={shopifyWidgets}
              onRemoveWidget={handleRemoveWidget}
              onSelectWidget={handleSelectWidget}
              onMoveWidgetUp={handleMoveWidgetUp}
              onMoveWidgetDown={handleMoveWidgetDown}
            />
          </div>
        </div>
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeWidget ? (
          <div className="bg-white border-2 border-purple-500 rounded-lg p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeWidget.icon}</span>
              <div>
                <div className="font-medium text-sm">{activeWidget.name}</div>
                <div className="text-xs text-gray-500">{activeWidget.description}</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}