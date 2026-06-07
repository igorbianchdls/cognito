import { createPostgresAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createPostgresAdapter'
import type { ConnectedPostgresResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'
import type {
  PaidMediaAdapter,
  PaidMediaResource,
} from '@/products/mcp-apps/server/domain-adapters/paid-media/paidMediaTypes'

const PAID_MEDIA_CONFIGS: ConnectedPostgresResourceConfig<PaidMediaResource>[] = [
  {
    resource: 'contas',
    providerResource: 'accounts',
    table: 'trafegopago.contas_midia',
    orderBy: 't.nome_conta ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'campanhas',
    providerResource: 'campaigns',
    table: 'trafegopago.campanhas',
    statusColumn: 'status',
    orderBy: 't.nome ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'anuncios',
    providerResource: 'ads',
    table: 'trafegopago.anuncios',
    statusColumn: 'status',
    orderBy: 't.nome ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'desempenho-diario',
    providerResource: 'insights_campaign_daily',
    table: 'trafegopago.desempenho_diario',
    dateColumn: 'data_ref',
    orderBy: 't.data_ref DESC NULLS LAST, t.id DESC',
  },
]

export function createPaidMediaAdapter(provider: string): PaidMediaAdapter {
  return createPostgresAdapter(provider, PAID_MEDIA_CONFIGS)
}
