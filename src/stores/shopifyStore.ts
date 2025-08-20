import { atom, computed } from 'nanostores'
import type { 
  ShopifyWidget, 
  CreateShopifyWidgetProps,
  HeaderWidget,
  HeroWidget,
  ProductGridWidget,
  CategoriesWidget,
  FooterWidget,
  SearchWidget,
  CartWidget,
  WidgetOrder
} from '@/types/shopifyWidgets'

// Main shopify widgets atom
export const $shopifyWidgets = atom<ShopifyWidget[]>([])

// Selected widget atom
export const $selectedShopifyId = atom<string | null>(null)

// Computed for selected widget
export const $selectedShopifyWidget = computed([$shopifyWidgets, $selectedShopifyId], (widgets, selectedId) => {
  if (!selectedId) return null
  return widgets.find(w => w.i === selectedId) || null
})

// Widgets ordered by their order property (for canvas display)
export const $orderedShopifyWidgets = computed([$shopifyWidgets], (widgets) => {
  return [...widgets].sort((a, b) => a.order - b.order)
})

// Widget count
export const $shopifyWidgetCount = computed([$shopifyWidgets], (widgets) => widgets.length)

// Widget creation helpers
function createBaseShopifyWidget(props: CreateShopifyWidgetProps): Omit<ShopifyWidget, 'config'> {
  const timestamp = Date.now()
  const currentWidgets = $shopifyWidgets.get()
  const maxOrder = currentWidgets.length > 0 ? Math.max(...currentWidgets.map(w => w.order)) : 0
  
  return {
    id: `shopify-${props.type}-${timestamp}`,
    i: `shopify-${props.type}-${timestamp}`,
    name: props.name,
    type: props.type,
    icon: props.icon || '🛍️',
    description: props.description || `${props.type} widget`,
    order: maxOrder + 1, // Adiciona no final
    color: '#7C3AED' // Purple theme para Shopify
  }
}

// Shopify Actions
export const shopifyActions = {
  // Set all widgets
  setShopifyWidgets: (widgets: ShopifyWidget[]) => {
    console.log('🛍️ Setting Shopify widgets:', widgets.length)
    $shopifyWidgets.set(widgets)
  },

  // Add widget to canvas
  addShopifyWidget: (props: CreateShopifyWidgetProps) => {
    console.log('➕ Adding Shopify widget:', props.type, props.name)
    
    const baseWidget = createBaseShopifyWidget(props)
    let widget: ShopifyWidget
    
    switch (props.type) {
      case 'header':
        widget = {
          ...baseWidget,
          type: 'header',
          config: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            height: 80,
            sticky: true,
            showCart: true,
            showSearch: true,
            navigationLinks: [
              { label: 'Home', url: '/', isActive: true },
              { label: 'Products', url: '/products' },
              { label: 'About', url: '/about' },
              { label: 'Contact', url: '/contact' }
            ],
            ...props.config
          }
        } as HeaderWidget
        break
        
      case 'hero':
        widget = {
          ...baseWidget,
          type: 'hero',
          config: {
            title: 'Welcome to Our Store',
            subtitle: 'Discover amazing products at great prices',
            ctaText: 'Shop Now',
            ctaUrl: '/products',
            textAlign: 'center',
            textColor: '#ffffff',
            backgroundColor: '#7C3AED',
            height: 400,
            overlay: true,
            overlayOpacity: 0.4,
            ...props.config
          }
        } as HeroWidget
        break
        
      case 'product-grid':
        widget = {
          ...baseWidget,
          type: 'product-grid',
          config: {
            columns: 4,
            showFilters: true,
            showSorting: true,
            itemsPerPage: 12,
            gridGap: 20,
            products: [
              {
                id: '1',
                name: 'Product 1',
                price: 29.99,
                image: 'https://via.placeholder.com/300x300',
                url: '/product/1'
              },
              {
                id: '2',
                name: 'Product 2',
                price: 39.99,
                originalPrice: 49.99,
                image: 'https://via.placeholder.com/300x300',
                url: '/product/2',
                badge: 'Sale'
              }
            ],
            ...props.config
          }
        } as ProductGridWidget
        break
        
      case 'categories':
        widget = {
          ...baseWidget,
          type: 'categories',
          config: {
            layout: 'grid',
            columns: 3,
            showProductCount: true,
            categories: [
              {
                id: '1',
                name: 'Electronics',
                image: 'https://via.placeholder.com/300x200',
                url: '/category/electronics',
                productCount: 25
              },
              {
                id: '2',
                name: 'Clothing',
                image: 'https://via.placeholder.com/300x200',
                url: '/category/clothing',
                productCount: 40
              }
            ],
            ...props.config
          }
        } as CategoriesWidget
        break
        
      case 'footer':
        widget = {
          ...baseWidget,
          type: 'footer',
          config: {
            backgroundColor: '#1F2937',
            textColor: '#ffffff',
            copyright: '© 2024 Your Store. All rights reserved.',
            showNewsletter: true,
            sections: [
              {
                title: 'Company',
                links: [
                  { label: 'About Us', url: '/about' },
                  { label: 'Contact', url: '/contact' },
                  { label: 'Careers', url: '/careers' }
                ]
              },
              {
                title: 'Support',
                links: [
                  { label: 'Help Center', url: '/help' },
                  { label: 'Returns', url: '/returns' },
                  { label: 'Shipping', url: '/shipping' }
                ]
              }
            ],
            socialMedia: [
              { platform: 'Facebook', url: 'https://facebook.com', icon: '📘' },
              { platform: 'Instagram', url: 'https://instagram.com', icon: '📷' },
              { platform: 'Twitter', url: 'https://twitter.com', icon: '🐦' }
            ],
            ...props.config
          }
        } as FooterWidget
        break
        
      case 'search':
        widget = {
          ...baseWidget,
          type: 'search',
          config: {
            placeholder: 'Search products...',
            showCategories: true,
            showRecentSearches: true,
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            textColor: '#000000',
            ...props.config
          }
        } as SearchWidget
        break
        
      case 'cart':
        widget = {
          ...baseWidget,
          type: 'cart',
          config: {
            showItemCount: true,
            showTotal: true,
            cartIcon: '🛒',
            backgroundColor: '#7C3AED',
            textColor: '#ffffff',
            ...props.config
          }
        } as CartWidget
        break
        
      default:
        throw new Error(`Unknown Shopify widget type: ${props.type}`)
    }
    
    const currentWidgets = $shopifyWidgets.get()
    $shopifyWidgets.set([...currentWidgets, widget])
    
    return widget
  },

  // Edit widget config
  editShopifyWidget: (widgetId: string, changes: Partial<ShopifyWidget>) => {
    console.log('✏️ Editing Shopify widget:', { widgetId, changes })
    const currentWidgets = $shopifyWidgets.get()
    
    const updatedWidgets = currentWidgets.map(widget => {
      if (widget.i !== widgetId) return widget
      return { ...widget, ...changes }
    })
    $shopifyWidgets.set(updatedWidgets)
  },

  // Update widget config specifically
  updateShopifyWidgetConfig: <T extends ShopifyWidget>(widgetId: string, configChanges: Partial<T['config']>) => {
    console.log('🔧 Updating Shopify widget config:', { widgetId, configChanges })
    const currentWidgets = $shopifyWidgets.get()
    
    const updatedWidgets = currentWidgets.map(widget => {
      if (widget.i === widgetId) {
        return {
          ...widget,
          config: { ...widget.config, ...configChanges }
        }
      }
      return widget
    })
    
    $shopifyWidgets.set(updatedWidgets)
  },

  // Remove widget
  removeShopifyWidget: (widgetId: string) => {
    console.log('🗑️ Removing Shopify widget:', widgetId)
    const currentWidgets = $shopifyWidgets.get()
    const newWidgets = currentWidgets.filter(widget => widget.i !== widgetId)
    $shopifyWidgets.set(newWidgets)
    
    // Clear selection if removed widget was selected
    if ($selectedShopifyId.get() === widgetId) {
      $selectedShopifyId.set(null)
    }
  },

  // Select widget
  selectShopifyWidget: (widgetId: string | null) => {
    console.log('🎯 Selecting Shopify widget:', widgetId)
    $selectedShopifyId.set(widgetId)
  },

  // Reorder widgets
  reorderShopifyWidgets: (newOrder: WidgetOrder[]) => {
    console.log('📋 Reordering Shopify widgets:', newOrder)
    const currentWidgets = $shopifyWidgets.get()
    
    const updatedWidgets = currentWidgets.map(widget => {
      const orderInfo = newOrder.find(o => o.id === widget.i)
      if (orderInfo) {
        return { ...widget, order: orderInfo.order }
      }
      return widget
    })
    
    $shopifyWidgets.set(updatedWidgets)
  },

  // Move widget up in order
  moveShopifyWidgetUp: (widgetId: string) => {
    const currentWidgets = $shopifyWidgets.get()
    const widget = currentWidgets.find(w => w.i === widgetId)
    if (!widget || widget.order === 1) return
    
    const previousWidget = currentWidgets.find(w => w.order === widget.order - 1)
    if (!previousWidget) return
    
    shopifyActions.reorderShopifyWidgets([
      { id: widgetId, order: widget.order - 1 },
      { id: previousWidget.i, order: widget.order }
    ])
  },

  // Move widget down in order  
  moveShopifyWidgetDown: (widgetId: string) => {
    const currentWidgets = $shopifyWidgets.get()
    const widget = currentWidgets.find(w => w.i === widgetId)
    const maxOrder = Math.max(...currentWidgets.map(w => w.order))
    if (!widget || widget.order === maxOrder) return
    
    const nextWidget = currentWidgets.find(w => w.order === widget.order + 1)
    if (!nextWidget) return
    
    shopifyActions.reorderShopifyWidgets([
      { id: widgetId, order: widget.order + 1 },
      { id: nextWidget.i, order: widget.order }
    ])
  },

  // Clear all widgets
  clearShopifyWidgets: () => {
    console.log('🧹 Clearing all Shopify widgets')
    $shopifyWidgets.set([])
    $selectedShopifyId.set(null)
  },

  // Duplicate widget
  duplicateShopifyWidget: (widgetId: string) => {
    console.log('📋 Duplicating Shopify widget:', widgetId)
    const currentWidgets = $shopifyWidgets.get()
    const widgetToDuplicate = currentWidgets.find(widget => widget.i === widgetId)
    
    if (!widgetToDuplicate) {
      console.warn('Shopify widget not found for duplication:', widgetId)
      return
    }
    
    const timestamp = Date.now()
    const maxOrder = Math.max(...currentWidgets.map(w => w.order))
    
    const duplicatedWidget = {
      ...widgetToDuplicate,
      id: `shopify-${widgetToDuplicate.type}-${timestamp}`,
      i: `shopify-${widgetToDuplicate.type}-${timestamp}`,
      name: `${widgetToDuplicate.name} (Copy)`,
      order: maxOrder + 1
    } as ShopifyWidget
    
    $shopifyWidgets.set([...currentWidgets, duplicatedWidget])
    return duplicatedWidget
  }
}