import { instagramSocialApiAdapter } from '@/products/plugin/server/domain-adapters/social/providers/socialApiAdapters'
import { linkedinSocialApiAdapter } from '@/products/plugin/server/domain-adapters/social/providers/socialApiAdapters'
import { tiktokSocialApiAdapter } from '@/products/plugin/server/domain-adapters/social/providers/socialApiAdapters'
import { youtubeSocialApiAdapter } from '@/products/plugin/server/domain-adapters/social/providers/socialApiAdapters'
import type { SocialApiAdapter } from '@/products/plugin/server/domain-adapters/social/socialTypes'

const SOCIAL_API_ADAPTERS = new Map<string, SocialApiAdapter>(
  [
    instagramSocialApiAdapter,
    youtubeSocialApiAdapter,
    linkedinSocialApiAdapter,
    tiktokSocialApiAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getSocialApiAdapter(provider: string) {
  return SOCIAL_API_ADAPTERS.get(provider)
}

export function listSocialApiAdapterProviders() {
  return [...SOCIAL_API_ADAPTERS.keys()]
}
