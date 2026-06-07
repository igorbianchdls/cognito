import type { CrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/CrmAdapter'
import type {
  ConnectedCrmAction,
  ConnectedCrmResource,
} from '@/products/mcp-apps/server/domain-adapters/crm/crmTypes'
import {
  readConnectedPostgresResource,
  type ConnectedPostgresResourceConfig,
} from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'

const CRM_CONFIGS: ConnectedPostgresResourceConfig<ConnectedCrmResource>[] = [
  {
    resource: 'contas',
    providerResource: 'contas',
    table: 'crm.contas',
    dateColumn: 'criado_em',
    orderBy: 't.criado_em DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'contatos',
    providerResource: 'contatos',
    table: 'crm.contatos',
    dateColumn: 'criado_em',
    orderBy: 't.criado_em DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'leads',
    providerResource: 'leads',
    table: 'crm.leads',
    dateColumn: 'criado_em',
    statusColumn: 'status',
    orderBy: 't.criado_em DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'oportunidades',
    providerResource: 'oportunidades',
    table: 'crm.oportunidades',
    dateColumn: 'criado_em',
    statusColumn: 'status',
    orderBy: 't.criado_em DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'atividades',
    providerResource: 'atividades',
    table: 'crm.atividades',
    dateColumn: 'criado_em',
    statusColumn: 'status',
    orderBy: 't.criado_em DESC NULLS LAST, t.id DESC',
  },
]

export function createPostgresCrmAdapter(provider: string): CrmAdapter {
  const configByResource = new Map(CRM_CONFIGS.map((config) => [config.resource, config] as const))

  function supports(resource: ConnectedCrmResource, action: ConnectedCrmAction) {
    return (action === 'listar' || action === 'ler') && configByResource.has(resource)
  }

  return {
    provider,
    supports,
    async list(input) {
      return readConnectedPostgresResource('listar', input, configByResource.get(input.resource)!)
    },
    async read(input) {
      return readConnectedPostgresResource('ler', input, configByResource.get(input.resource)!)
    },
  }
}
