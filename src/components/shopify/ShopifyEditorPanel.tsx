'use client'

import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $selectedShopifyWidget, shopifyActions } from '@/stores/shopifyStore'
import type { ShopifyWidget, HeaderConfig, HeroConfig, ProductGridConfig, CategoriesConfig, FooterConfig, SearchConfig, CartConfig } from '@/types/shopifyWidgets'

export default function ShopifyEditorPanel() {
  const selectedWidget = useStore($selectedShopifyWidget)
  const [activeSection, setActiveSection] = useState<'general' | 'config' | 'style'>('general')

  if (!selectedWidget) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-lg font-semibold text-gray-900">Property Editor</h2>
          </div>
          <p className="text-sm text-gray-600">
            Select a component from the canvas to edit its properties
          </p>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-medium mb-2">No Component Selected</p>
            <p className="text-sm">
              Click on a component in the canvas to start editing its properties
            </p>
          </div>
        </div>
      </div>
    )
  }

  const updateConfig = (configChanges: Partial<ShopifyWidget['config']>) => {
    shopifyActions.updateShopifyWidgetConfig(selectedWidget.i, configChanges)
  }

  const updateGeneral = (changes: Partial<ShopifyWidget>) => {
    shopifyActions.editShopifyWidget(selectedWidget.i, changes)
  }

  const sections = [
    { id: 'general', label: 'General', icon: '📝' },
    { id: 'config', label: 'Properties', icon: '⚙️' },
    { id: 'style', label: 'Style', icon: '🎨' },
  ] as const

  const renderGeneralSection = () => (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Component Name
        </label>
        <input
          type="text"
          value={selectedWidget.name}
          onChange={(e) => updateGeneral({ name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icon
        </label>
        <input
          type="text"
          value={selectedWidget.icon}
          onChange={(e) => updateGeneral({ icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="🛍️"
        />
      </div>

      {/* Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Position
        </label>
        <input
          type="number"
          value={selectedWidget.order}
          onChange={(e) => updateGeneral({ order: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="1"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Accent Color
        </label>
        <input
          type="color"
          value={selectedWidget.color || '#7C3AED'}
          onChange={(e) => updateGeneral({ color: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
    </div>
  )

  const renderConfigSection = () => {
    switch (selectedWidget.type) {
      case 'header':
        return <HeaderConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'hero':
        return <HeroConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'product-grid':
        return <ProductGridConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'categories':
        return <CategoriesConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'footer':
        return <FooterConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'search':
        return <SearchConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      case 'cart':
        return <CartConfigEditor config={selectedWidget.config} updateConfig={updateConfig} />
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No specific properties available for this component type.</p>
          </div>
        )
    }
  }

  const renderStyleSection = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-3xl mb-4">🎨</div>
        <p className="text-sm">
          Style properties are configured within each component&apos;s specific settings.
        </p>
        <p className="text-xs mt-2">
          Switch to the Properties tab to customize colors, fonts, and layouts.
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-lg font-semibold text-gray-900">Property Editor</h2>
        </div>
        <p className="text-sm text-gray-600">
          Editing: <span className="font-medium text-purple-700">{selectedWidget.name}</span>
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'general' && renderGeneralSection()}
        {activeSection === 'config' && renderConfigSection()}
        {activeSection === 'style' && renderStyleSection()}
      </div>
    </div>
  )
}

// Individual config editors for each widget type
function HeaderConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: HeaderConfig
  updateConfig: (changes: Partial<HeaderConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo URL
        </label>
        <input
          type="url"
          value={config.logo || ''}
          onChange={(e) => updateConfig({ logo: e.target.value })}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={config.backgroundColor || '#ffffff'}
          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={config.textColor || '#000000'}
          onChange={(e) => updateConfig({ textColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Header Height (px)
        </label>
        <input
          type="number"
          value={config.height || 80}
          onChange={(e) => updateConfig({ height: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="60"
          max="120"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.sticky || false}
          onChange={(e) => updateConfig({ sticky: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Sticky Header
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showSearch || false}
          onChange={(e) => updateConfig({ showSearch: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Search Button
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showCart || false}
          onChange={(e) => updateConfig({ showCart: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Cart Button
        </label>
      </div>
    </div>
  )
}

function HeroConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: HeroConfig
  updateConfig: (changes: Partial<HeroConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Welcome to Our Store"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtitle
        </label>
        <textarea
          value={config.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="Discover amazing products at great prices"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CTA Button Text
        </label>
        <input
          type="text"
          value={config.ctaText || ''}
          onChange={(e) => updateConfig({ ctaText: e.target.value })}
          placeholder="Shop Now"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CTA Button URL
        </label>
        <input
          type="url"
          value={config.ctaUrl || ''}
          onChange={(e) => updateConfig({ ctaUrl: e.target.value })}
          placeholder="/products"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={config.backgroundColor || '#7C3AED'}
          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={config.textColor || '#ffffff'}
          onChange={(e) => updateConfig({ textColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Height (px)
        </label>
        <input
          type="number"
          value={config.height || 400}
          onChange={(e) => updateConfig({ height: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="200"
          max="800"
        />
      </div>
    </div>
  )
}

// Simplified config editors for other widget types
function ProductGridConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: ProductGridConfig
  updateConfig: (changes: Partial<ProductGridConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <input
          type="number"
          value={config.columns || 4}
          onChange={(e) => updateConfig({ columns: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="1"
          max="6"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showFilters || false}
          onChange={(e) => updateConfig({ showFilters: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Filters
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showSorting || false}
          onChange={(e) => updateConfig({ showSorting: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Sorting Options
        </label>
      </div>
    </div>
  )
}

function CategoriesConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: CategoriesConfig
  updateConfig: (changes: Partial<CategoriesConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <input
          type="number"
          value={config.columns || 3}
          onChange={(e) => updateConfig({ columns: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          min="1"
          max="6"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showProductCount || false}
          onChange={(e) => updateConfig({ showProductCount: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Product Count
        </label>
      </div>
    </div>
  )
}

function FooterConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: FooterConfig
  updateConfig: (changes: Partial<FooterConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={config.backgroundColor || '#1F2937'}
          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={config.textColor || '#ffffff'}
          onChange={(e) => updateConfig({ textColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Copyright Text
        </label>
        <input
          type="text"
          value={config.copyright || ''}
          onChange={(e) => updateConfig({ copyright: e.target.value })}
          placeholder="© 2024 Your Store. All rights reserved."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showNewsletter || false}
          onChange={(e) => updateConfig({ showNewsletter: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Newsletter Signup
        </label>
      </div>
    </div>
  )
}

function SearchConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: SearchConfig
  updateConfig: (changes: Partial<SearchConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder Text
        </label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => updateConfig({ placeholder: e.target.value })}
          placeholder="Search products..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showCategories || false}
          onChange={(e) => updateConfig({ showCategories: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Category Filters
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showRecentSearches || false}
          onChange={(e) => updateConfig({ showRecentSearches: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Recent Searches
        </label>
      </div>
    </div>
  )
}

function CartConfigEditor({ 
  config, 
  updateConfig 
}: { 
  config: CartConfig
  updateConfig: (changes: Partial<CartConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cart Icon
        </label>
        <input
          type="text"
          value={config.cartIcon || ''}
          onChange={(e) => updateConfig({ cartIcon: e.target.value })}
          placeholder="🛒"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={config.backgroundColor || '#7C3AED'}
          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showItemCount || false}
          onChange={(e) => updateConfig({ showItemCount: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Item Count
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={config.showTotal || false}
          onChange={(e) => updateConfig({ showTotal: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Show Total Price
        </label>
      </div>
    </div>
  )
}