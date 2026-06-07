import type { IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'
import { erpProvider } from '@/products/integracoes/shared/providers/erp/erpProviderFactory'

export const BLING_RESOURCES: IntegrationResource[] = [
  {
    slug: 'clientes',
    name: 'Clientes',
    description: 'Contatos do tipo cliente, documentos e dados comerciais.',
    defaultEnabled: true,
  },
  {
    slug: 'fornecedores',
    name: 'Fornecedores',
    description: 'Contatos do tipo fornecedor e parceiros de compra.',
    defaultEnabled: true,
  },
  {
    slug: 'produtos',
    name: 'Produtos',
    description: 'Catalogo de produtos, precos e informacoes comerciais.',
    defaultEnabled: true,
  },
  {
    slug: 'pedidos_venda',
    name: 'Pedidos de venda',
    description: 'Pedidos, itens e situacao comercial.',
    defaultEnabled: true,
  },
  {
    slug: 'compras',
    name: 'Pedidos de compra',
    description: 'Pedidos de compra, itens e fornecedores.',
    defaultEnabled: false,
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
    slug: 'notas_fiscais',
    name: 'Notas fiscais',
    description: 'Documentos fiscais, emissoes, cancelamentos e valores.',
    defaultEnabled: false,
  },
  {
    slug: 'estoque',
    name: 'Estoque',
    description: 'Saldos de estoque por produto.',
    defaultEnabled: false,
  },
  {
    slug: 'categorias',
    name: 'Categorias',
    description: 'Categorias de produtos e classificacoes comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'servicos',
    name: 'Servicos',
    description: 'Servicos cadastrados para vendas e emissao fiscal.',
    defaultEnabled: false,
  },
  {
    slug: 'notas_servico',
    name: 'Notas de servico',
    description: 'NFS-e, valores, tomadores e status fiscal.',
    defaultEnabled: false,
  },
  {
    slug: 'notas_consumidor',
    name: 'Notas de consumidor',
    description: 'NFC-e emitidas no varejo e frente de caixa.',
    defaultEnabled: false,
  },
  {
    slug: 'formas_pagamento',
    name: 'Formas de pagamento',
    description: 'Formas de pagamento usadas em pedidos, contas e notas.',
    defaultEnabled: false,
  },
  {
    slug: 'vendedores',
    name: 'Vendedores',
    description: 'Cadastro de vendedores e responsaveis comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'transportadoras',
    name: 'Transportadoras',
    description: 'Transportadoras e dados de frete.',
    defaultEnabled: false,
  },
  {
    slug: 'canais_venda',
    name: 'Canais de venda',
    description: 'Canais, marketplaces e origens comerciais.',
    defaultEnabled: false,
  },
  {
    slug: 'lojas',
    name: 'Lojas',
    description: 'Lojas e contas comerciais conectadas ao Bling.',
    defaultEnabled: false,
  },
  {
    slug: 'categorias_receitas_despesas',
    name: 'Categorias financeiras',
    description: 'Categorias de receitas e despesas.',
    defaultEnabled: false,
  },
  {
    slug: 'depositos',
    name: 'Depositos',
    description: 'Depositos e locais de estoque.',
    defaultEnabled: false,
  },
]

export const BLING_PROVIDER = erpProvider({
  slug: 'bling',
  toolkitSlug: 'BLING',
  name: 'Bling',
  description: 'ERP para ecommerce, estoque, pedidos, notas fiscais e marketplaces.',
  authType: 'oauth2',
  supportsOAuthCallback: true,
  resources: BLING_RESOURCES,
  tags: ['brasil', 'ecommerce', 'marketplace'],
})
