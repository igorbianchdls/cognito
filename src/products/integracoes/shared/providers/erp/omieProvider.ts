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
  {
    slug: 'pedidos_compra',
    name: 'Pedidos de compra',
    description: 'Pedidos de compra, fornecedores, itens, recebimentos e status.',
    defaultEnabled: false,
  },
  {
    slug: 'notas_fiscais',
    name: 'Notas fiscais',
    description: 'NF-e emitidas, itens, totais, titulos e dados fiscais.',
    defaultEnabled: false,
  },
  {
    slug: 'notas_servico',
    name: 'Notas de servico',
    description: 'NFS-e emitidas, servicos, valores, impostos e status.',
    defaultEnabled: false,
  },
  {
    slug: 'estoque_saldos',
    name: 'Saldos de estoque',
    description: 'Posicao consolidada de estoque por produto e local.',
    defaultEnabled: false,
  },
  {
    slug: 'estoque_movimentacoes',
    name: 'Movimentacoes de estoque',
    description: 'Entradas, saidas e movimentacoes de estoque por periodo.',
    defaultEnabled: false,
  },
  {
    slug: 'lancamentos_financeiros',
    name: 'Lancamentos financeiros',
    description: 'Movimentos financeiros de contas a pagar, receber e conta corrente.',
    defaultEnabled: false,
  },
  {
    slug: 'contas_correntes',
    name: 'Contas correntes',
    description: 'Cadastro de contas correntes, bancos, carteiras e saldos iniciais.',
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
