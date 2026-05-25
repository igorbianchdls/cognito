import { hubspotConnector } from '@/products/integracoes/cloud/src/connectors/crm/hubspotConnector'
import { pipedriveConnector } from '@/products/integracoes/cloud/src/connectors/crm/pipedriveConnector'
import { rdStationConnector } from '@/products/integracoes/cloud/src/connectors/crm/rdStationConnector'
import { salesforceConnector } from '@/products/integracoes/cloud/src/connectors/crm/salesforceConnector'

export const CRM_CONNECTORS = [
  hubspotConnector,
  pipedriveConnector,
  salesforceConnector,
  rdStationConnector,
]
