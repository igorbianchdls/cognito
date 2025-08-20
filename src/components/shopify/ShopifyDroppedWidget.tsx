'use client'

import { useState } from 'react'
import HeaderWidget from './widgets/HeaderWidget'
import HeroWidget from './widgets/HeroWidget'
import ProductGridWidget from './widgets/ProductGridWidget'
import CategoriesWidget from './widgets/CategoriesWidget'
import FooterWidget from './widgets/FooterWidget'
import SearchWidget from './widgets/SearchWidget'
import CartWidget from './widgets/CartWidget'
import type { ShopifyWidget } from '@/types/shopifyWidgets'

interface ShopifyDroppedWidgetProps {
  widget: ShopifyWidget
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isSelected?: boolean
  position: number
  totalWidgets: number
}

export default function ShopifyDroppedWidget({ 
  widget, 
  onRemove, 
  onMoveUp,
  onMoveDown,
  isSelected = false,
  position,
  totalWidgets
}: ShopifyDroppedWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const renderWidget = () => {
    switch (widget.type) {
      case 'header':
        return <HeaderWidget widget={widget} />
      case 'hero':
        return <HeroWidget widget={widget} />
      case 'product-grid':
        return <ProductGridWidget widget={widget} />
      case 'categories':
        return <CategoriesWidget widget={widget} />
      case 'footer':
        return <FooterWidget widget={widget} />
      case 'search':
        return <SearchWidget widget={widget} />
      case 'cart':
        return <CartWidget widget={widget} />
      default:
        return (
          <div className="h-32 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">{widget.icon}</div>
              <div className="text-sm font-medium">{widget.name}</div>
              <div className="text-xs text-gray-400">Component not implemented</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className={`relative group transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-purple-500 ring-opacity-75' 
          : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Widget Controls Overlay */}
      <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 transition-opacity duration-200 ${
        isHovered || isSelected ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Position Indicator */}
        <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-sm">
          {position}/{totalWidgets}
        </div>
        
        {/* Move Up Button */}
        {onMoveUp && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xs transition-colors duration-200"
            title="Move up"
          >
            ↑
          </button>
        )}
        
        {/* Move Down Button */}
        {onMoveDown && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-xs transition-colors duration-200"
            title="Move down"
          >
            ↓
          </button>
        )}
        
        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center text-xs font-medium transition-colors duration-200"
          title="Remove widget"
        >
          ×
        </button>
      </div>

      {/* Widget Label (on hover) */}
      <div className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
        isHovered || isSelected ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1">
          <span>{widget.icon}</span>
          <span>{widget.name}</span>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
        </div>
      )}

      {/* Widget Content */}
      <div className="relative">
        {renderWidget()}
      </div>

      {/* Hover Effect */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-purple-500 bg-opacity-5 pointer-events-none"></div>
      )}
    </div>
  )
}