import { instagramConnector } from '@/products/integracoes/connectors/social/instagramConnector'
import { linkedinConnector } from '@/products/integracoes/connectors/social/linkedinConnector'
import { tiktokConnector } from '@/products/integracoes/connectors/social/tiktokConnector'
import { youtubeConnector } from '@/products/integracoes/connectors/social/youtubeConnector'

export const SOCIAL_CONNECTORS = [
  instagramConnector,
  youtubeConnector,
  linkedinConnector,
  tiktokConnector,
]
