import type { DateRange } from '@/products/apps/shared/types'

type ModuleSlug = 'financeiro' | 'vendas' | 'compras' | 'estoque' | 'crm'

type DashboardPayload = {
  charts?: Record<string, unknown>
  kpis?: Record<string, unknown>
}

export function getCurrentMonthDateRange(): Required<DateRange> {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)

  return {
    from: toISO(firstDay),
    to: toISO(lastDay),
  }
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value))
    }
  }

  return qs.toString()
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function fetchModuleDashboard(
  moduleSlug: ModuleSlug,
  options: { de?: string; ate?: string; limit?: number } = {},
): Promise<DashboardPayload | null> {
  const query = buildQuery({ de: options.de, ate: options.ate, limit: options.limit ?? 8 })
  return fetchJson<DashboardPayload>(`/api/modulos/${moduleSlug}/dashboard?${query}`)
}

export async function fetchModuleRows(moduleSlug: ModuleSlug, view: string): Promise<unknown[]> {
  const query = buildQuery({ view, page: 1, pageSize: 1000 })
  const payload = await fetchJson<{ rows?: unknown[] }>(`/api/modulos/${moduleSlug}?${query}`)
  return Array.isArray(payload?.rows) ? payload.rows : []
}

export function hasChartsData(charts: Record<string, unknown> | undefined): boolean {
  if (!charts) return false
  return Object.values(charts).some((value) => Array.isArray(value) && value.length > 0)
}
