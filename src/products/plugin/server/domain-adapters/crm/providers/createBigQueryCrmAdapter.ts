import type { CrmAdapter } from '@/products/plugin/server/domain-adapters/crm/CrmAdapter'
import type {
  ConnectedCrmAction,
  ConnectedCrmResource,
} from '@/products/plugin/server/domain-adapters/crm/crmTypes'
import {
  readConnectedBigQueryResource,
  type ConnectedBigQueryResourceConfig,
} from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'

const CRM_CONFIGS: ConnectedBigQueryResourceConfig<ConnectedCrmResource>[] = [
  {
    resource: 'contas',
    providerResource: 'contas',
    datasetKind: 'normalized',
    dateField: 'criado_em',
    orderBy: 'date_field',
  },
  {
    resource: 'contatos',
    providerResource: 'contatos',
    datasetKind: 'normalized',
    dateField: 'criado_em',
    orderBy: 'date_field',
  },
  {
    resource: 'leads',
    providerResource: 'leads',
    datasetKind: 'normalized',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'oportunidades',
    providerResource: 'oportunidades',
    datasetKind: 'normalized',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'atividades',
    providerResource: 'atividades',
    datasetKind: 'normalized',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'usuarios',
    providerResource: 'usuarios',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'pipelines',
    providerResource: 'pipelines',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'fases_pipeline',
    providerResource: 'fases_pipeline',
    datasetKind: 'normalized',
    statusField: 'status',
  },
]

export function createBigQueryCrmAdapter(provider: string): CrmAdapter {
  const configByResource = new Map(CRM_CONFIGS.map((config) => [config.resource, config] as const))

  function supports(resource: ConnectedCrmResource, action: ConnectedCrmAction) {
    return (action === 'listar' || action === 'ler') && configByResource.has(resource)
  }

  return {
    provider,
    supports,
    async list(input) {
      return readConnectedBigQueryResource('listar', input, configByResource.get(input.resource)!)
    },
    async read(input) {
      return readConnectedBigQueryResource('ler', input, configByResource.get(input.resource)!)
    },
  }
}
