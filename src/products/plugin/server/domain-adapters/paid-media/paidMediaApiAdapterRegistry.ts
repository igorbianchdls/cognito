import {
  googleAdsPaidMediaApiAdapter,
  metaAdsPaidMediaApiAdapter,
} from '@/products/plugin/server/domain-adapters/paid-media/providers/paidMediaApiAdapters'
import type { PaidMediaApiAdapter } from '@/products/plugin/server/domain-adapters/paid-media/paidMediaTypes'

const PAID_MEDIA_API_ADAPTERS = new Map<string, PaidMediaApiAdapter>(
  [metaAdsPaidMediaApiAdapter, googleAdsPaidMediaApiAdapter].map((adapter) => [adapter.provider, adapter] as const),
)

export function getPaidMediaApiAdapter(provider: string) {
  return PAID_MEDIA_API_ADAPTERS.get(provider)
}

export function listPaidMediaApiAdapterProviders() {
  return [...PAID_MEDIA_API_ADAPTERS.keys()]
}
