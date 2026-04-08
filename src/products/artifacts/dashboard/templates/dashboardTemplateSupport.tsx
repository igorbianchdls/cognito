'use client'

export type DashboardTemplateKey = 'classic' | 'classicgrid' | 'containers' | 'layouttest' | 'compras' | 'financeiro' | 'metaads' | 'googleads' | 'shopify'

export const DASHBOARD_TEMPLATE_DEFAULT_THEMES: Record<DashboardTemplateKey, string> = {
  classic: 'light',
  classicgrid: 'light',
  containers: 'light',
  layouttest: 'light',
  compras: 'blue',
  financeiro: 'sand',
  metaads: 'midnight',
  googleads: 'metro',
  shopify: 'light',
}

export function getDashboardTemplateThemeName(template: DashboardTemplateKey): string {
  return DASHBOARD_TEMPLATE_DEFAULT_THEMES[template] || 'light'
}
