import type { SocialAdapter } from '@/products/mcp-apps/server/domain-adapters/social/socialTypes'
import { instagramSocialAdapter } from '@/products/mcp-apps/server/domain-adapters/social/providers/instagramSocialAdapter'
import { linkedinSocialAdapter } from '@/products/mcp-apps/server/domain-adapters/social/providers/linkedinSocialAdapter'
import { tiktokSocialAdapter } from '@/products/mcp-apps/server/domain-adapters/social/providers/tiktokSocialAdapter'
import { youtubeSocialAdapter } from '@/products/mcp-apps/server/domain-adapters/social/providers/youtubeSocialAdapter'

const SOCIAL_ADAPTERS = new Map<string, SocialAdapter>(
  [instagramSocialAdapter, youtubeSocialAdapter, linkedinSocialAdapter, tiktokSocialAdapter]
    .map((adapter) => [adapter.provider, adapter] as const),
)

export function getSocialAdapter(provider: string) {
  return SOCIAL_ADAPTERS.get(provider)
}

export function listSocialAdapterProviders() {
  return [...SOCIAL_ADAPTERS.keys()]
}
