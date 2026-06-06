import type { IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'
import { erpProvider } from '@/products/integracoes/shared/providers/erp/erpProviderFactory'

export const OMIE_RESOURCES: IntegrationResource[] = [
  {
    slug: 'clientes',
    name: 'Clientes',
    description: 'Cadastro de clientes, documentos e dados comerciais.',
    defaultEnabled: true,
  },
  {
    slug: 'fornecedores',
    name: 'Fornecedores',
    description: 'Cadastro de fornecedores e parceiros de compra.',
    defaultEnabled: true,
  },
  {
    slug: 'produtos',
    name: 'Produtos',
    description: 'Produtos, servicos, unidades, precos e classificacoes.',
    defaultEnabled: true,
  },
  {
    slug: 'pedidos_venda',
    name: 'Pedidos de venda',
    description: 'Pedidos, itens, descontos e situacao comercial.',
    defaultEnabled: true,
  },
  {
    slug: 'contas_receber',
    name: 'Contas a receber',
    description: 'Titulos, vencimentos, recebimentos e inadimplencia.',
    defaultEnabled: true,
  },
  {
    slug: 'contas_pagar',
    name: 'Contas a pagar',
    description: 'Titulos, vencimentos, pagamentos e fornecedores.',
    defaultEnabled: true,
  },
  {
    slug: 'categorias',
    name: 'Categorias',
    description: 'Categorias financeiras e classificacoes operacionais.',
    defaultEnabled: false,
  },
]

export const OMIE_PROVIDER = erpProvider({
  slug: 'omie',
  toolkitSlug: 'OMIE',
  name: 'Omie',
  description: 'ERP com financeiro, fiscal, pedidos, estoque e automacao operacional.',
  authType: 'api_key',
  supportsOAuthCallback: false,
  resources: OMIE_RESOURCES,
  tags: ['brasil', 'pme', 'fiscal'],
})
