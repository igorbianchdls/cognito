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
    dateField: 'criado_em',
    orderBy: 'date_field',
  },
  {
    resource: 'contatos',
    providerResource: 'contatos',
    dateField: 'criado_em',
    orderBy: 'date_field',
  },
  {
    resource: 'leads',
    providerResource: 'leads',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'oportunidades',
    providerResource: 'oportunidades',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'atividades',
    providerResource: 'atividades',
    dateField: 'criado_em',
    statusField: 'status',
    orderBy: 'date_field',
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
