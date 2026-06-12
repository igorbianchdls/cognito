import { bitrix24Connector } from '@/products/integracoes/connectors/crm/bitrix24Connector'
import { hubspotConnector } from '@/products/integracoes/connectors/crm/hubspotConnector'
import { pipedriveConnector } from '@/products/integracoes/connectors/crm/pipedriveConnector'
import { rdStationConnector } from '@/products/integracoes/connectors/crm/rdStationConnector'
import { salesforceConnector } from '@/products/integracoes/connectors/crm/salesforceConnector'

export const CRM_CONNECTORS = [
  bitrix24Connector,
  hubspotConnector,
  pipedriveConnector,
  salesforceConnector,
  rdStationConnector,
]
