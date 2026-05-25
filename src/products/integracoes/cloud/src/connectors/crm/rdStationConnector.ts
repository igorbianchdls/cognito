import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const rdStationConnector = createStubConnector({
  domain: 'crm',
  provider: 'rd_station_crm',
})
