import type { IntegracaoUserItem, ToolkitStatusMap } from '@/products/integracoes/shared/types'

type StatusItem = {
  slug?: string
  connection?: {
    connectedAccount?: { id?: string }
    isActive?: boolean
  }
}

type StatusResponse = {
  ok?: boolean
  error?: string
  connected?: boolean
  items?: StatusItem[]
}

type UsersResponse = {
  ok?: boolean
  error?: string
  items?: IntegracaoUserItem[]
}

type AuthorizeResponse = {
  ok?: boolean
  error?: string
  redirectUrl?: string
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }

  return query.toString()
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Falha na requisição')
  }

  return payload as T
}

function mapStatusItems(items: StatusItem[] | undefined): ToolkitStatusMap {
  const map: ToolkitStatusMap = {}

  for (const item of items || []) {
    const slug = (item.slug || '').toLowerCase()
    if (!slug) continue

    const connected = Boolean(item.connection?.connectedAccount?.id || item.connection?.isActive)
    map[slug] = connected
  }

  return map
}

export async function fetchToolkitStatusMap(params?: {
  toolkit?: string
  userId?: string
}): Promise<ToolkitStatusMap> {
  const query = buildQuery({ toolkit: params?.toolkit, userId: params?.userId })
  const suffix = query ? `?${query}` : ''

  const payload = await requestJson<StatusResponse>(`/api/integracoes/status${suffix}`)

  if (params?.toolkit && typeof payload.connected === 'boolean') {
    return {
      [params.toolkit]: payload.connected,
      [params.toolkit.toLowerCase()]: payload.connected,
    }
  }

  return mapStatusItems(payload.items)
}

export async function fetchToolkitConnection(toolkit: string, userId?: string): Promise<boolean> {
  const map = await fetchToolkitStatusMap({ toolkit, userId })
  const key = toolkit || ''

  return Boolean(map[key] ?? map[key.toLowerCase()])
}

export async function fetchIntegracoesUsers(query?: string): Promise<IntegracaoUserItem[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  const payload = await requestJson<UsersResponse>(`/api/integracoes/users${suffix}`)

  return Array.isArray(payload.items) ? payload.items : []
}

export async function requestIntegracaoAuthorize(toolkit: string, userId: string): Promise<string> {
  const payload = await requestJson<AuthorizeResponse>('/api/integracoes/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolkit, userId }),
  })

  const redirectUrl = (payload.redirectUrl || '').toString()
  if (!redirectUrl) throw new Error('Redirect URL vazio')

  return redirectUrl
}
