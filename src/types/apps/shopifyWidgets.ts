export interface BaseShopifyWidget {
  id: string
  i: string // Para compatibilidade com sistema existente
  name: string
  type: string
  icon: string
  description: string
  order: number // Ordem no canvas (vertical stacking)
  color?: string
}

// Configurações específicas para cada tipo de widget
export interface HeaderConfig {
  logo?: string
  logoAlt?: string
  navigationLinks?: Array<{
    label: string
    url: string
    isActive?: boolean
  }>
  backgroundColor?: string
  textColor?: string
  height?: number
  sticky?: boolean
  showCart?: boolean
  showSearch?: boolean
}

export interface HeroConfig {
  backgroundImage?: string
  backgroundColor?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  overlay?: boolean
  overlayOpacity?: number
  height?: number
}

export interface ProductGridConfig {
  products?: Array<{
    id: string
    name: string
    price: number
    originalPrice?: number
    image: string
    url: string
    badge?: string
  }>
  columns?: number
  showFilters?: boolean
  showSorting?: boolean
  itemsPerPage?: number
  gridGap?: number
}

export interface CategoriesConfig {
  categories?: Array<{
    id: string
    name: string
    image: string
    url: string
    productCount?: number
  }>
  layout?: 'grid' | 'carousel' | 'list'
  showProductCount?: boolean
  columns?: number
}

export interface FooterConfig {
  sections?: Array<{
    title: string
    links: Array<{
      label: string
      url: string
    }>
  }>
  socialMedia?: Array<{
    platform: string
    url: string
    icon: string
  }>
  copyright?: string
  backgroundColor?: string
  textColor?: string
  showNewsletter?: boolean
}

export interface SearchConfig {
  placeholder?: string
  showCategories?: boolean
  showRecentSearches?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

export interface CartConfig {
  showItemCount?: boolean
  showTotal?: boolean
  cartIcon?: string
  backgroundColor?: string
  textColor?: string
}

// Widget específicos com suas configurações
export interface HeaderWidget extends BaseShopifyWidget {
  type: 'header'
  config: HeaderConfig
}

export interface HeroWidget extends BaseShopifyWidget {
  type: 'hero'
  config: HeroConfig
}

export interface ProductGridWidget extends BaseShopifyWidget {
  type: 'product-grid'
  config: ProductGridConfig
}

export interface CategoriesWidget extends BaseShopifyWidget {
  type: 'categories'
  config: CategoriesConfig
}

export interface FooterWidget extends BaseShopifyWidget {
  type: 'footer'
  config: FooterConfig
}

export interface SearchWidget extends BaseShopifyWidget {
  type: 'search'
  config: SearchConfig
}

export interface CartWidget extends BaseShopifyWidget {
  type: 'cart'
  config: CartConfig
}

// Union type para todos os widgets Shopify
export type ShopifyWidget = 
  | HeaderWidget 
  | HeroWidget 
  | ProductGridWidget 
  | CategoriesWidget 
  | FooterWidget
  | SearchWidget
  | CartWidget

// Props para criação de novos widgets
export interface CreateShopifyWidgetProps {
  name: string
  type: ShopifyWidget['type']
  icon?: string
  description?: string
  config?: Partial<ShopifyWidget['config']>
}

// Ordenação de widgets
export interface WidgetOrder {
  id: string
  order: number
}

// Type guards
export function isHeaderWidget(widget: ShopifyWidget): widget is HeaderWidget {
  return widget.type === 'header'
}

export function isHeroWidget(widget: ShopifyWidget): widget is HeroWidget {
  return widget.type === 'hero'
}

export function isProductGridWidget(widget: ShopifyWidget): widget is ProductGridWidget {
  return widget.type === 'product-grid'
}

export function isCategoriesWidget(widget: ShopifyWidget): widget is CategoriesWidget {
  return widget.type === 'categories'
}

export function isFooterWidget(widget: ShopifyWidget): widget is FooterWidget {
  return widget.type === 'footer'
}

export function isSearchWidget(widget: ShopifyWidget): widget is SearchWidget {
  return widget.type === 'search'
}

export function isCartWidget(widget: ShopifyWidget): widget is CartWidget {
  return widget.type === 'cart'
}