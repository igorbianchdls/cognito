import type { PaidMediaAdapter } from '@/products/plugin/server/domain-adapters/paid-media/paidMediaTypes'
import { googleAdsPaidMediaAdapter } from '@/products/plugin/server/domain-adapters/paid-media/providers/googleAdsPaidMediaAdapter'
import { metaAdsPaidMediaAdapter } from '@/products/plugin/server/domain-adapters/paid-media/providers/metaAdsPaidMediaAdapter'

const PAID_MEDIA_ADAPTERS = new Map<string, PaidMediaAdapter>(
  [metaAdsPaidMediaAdapter, googleAdsPaidMediaAdapter].map((adapter) => [adapter.provider, adapter] as const),
)

export function getPaidMediaAdapter(provider: string) {
  return PAID_MEDIA_ADAPTERS.get(provider)
}

export function listPaidMediaAdapterProviders() {
  return [...PAID_MEDIA_ADAPTERS.keys()]
}
