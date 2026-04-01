'use client'

export type DashboardTemplateKey = 'classic' | 'compras' | 'financeiro' | 'metaads' | 'googleads' | 'shopify'

export const DASHBOARD_TEMPLATE_PALETTES: Record<DashboardTemplateKey, readonly string[]> = {
  classic: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'],
  compras: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
  financeiro: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'],
  metaads: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
  googleads: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
  shopify: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'],
}

export const DASHBOARD_TEMPLATE_DEFAULT_THEMES: Record<DashboardTemplateKey, string> = {
  classic: 'aero',
  compras: 'blue',
  financeiro: 'sand',
  metaads: 'midnight',
  googleads: 'metro',
  shopify: 'light',
}

export function getDashboardTemplatePalette(template: DashboardTemplateKey): string[] {
  return [...DASHBOARD_TEMPLATE_PALETTES[template]]
}

export function getDashboardTemplateThemeName(template: DashboardTemplateKey): string {
  return DASHBOARD_TEMPLATE_DEFAULT_THEMES[template] || 'light'
}

export function buildDashboardThemeImportSource() {
  return `import { resolveDashboardThemeTokens } from './theme-tokens'`
}
