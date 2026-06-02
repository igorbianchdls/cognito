import type { SaaSBrand, SaaSTheme } from '@/remotion/saas/types'

export const SAAS_FONT_STACK = 'Geist, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif'

export const defaultSaaSTheme: SaaSTheme = {
  accent: '#225F42',
  accent2: '#2B7EA5',
  background: '#F4F7F4',
  border: '#DDE7E1',
  fontFamily: SAAS_FONT_STACK,
  muted: '#65716A',
  panel: '#FFFFFF',
  positive: '#22A06B',
  text: '#0F1512',
}

export function resolveSaaSTheme(brand?: SaaSBrand): SaaSTheme {
  return {
    ...defaultSaaSTheme,
    ...(brand?.theme || {}),
  }
}
