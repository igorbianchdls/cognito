import { googleAdsConnector } from '@/products/integracoes/cloud/src/connectors/advertising/googleAdsConnector'
import { metaAdsConnector } from '@/products/integracoes/cloud/src/connectors/advertising/metaAdsConnector'

export const ADVERTISING_CONNECTORS = [
  metaAdsConnector,
  googleAdsConnector,
]
