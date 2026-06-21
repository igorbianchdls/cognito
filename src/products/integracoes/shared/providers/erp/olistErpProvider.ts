import type { IntegrationResource } from '@/products/integracoes/shared/providers/providerTypes'
import { erpProvider } from '@/products/integracoes/shared/providers/erp/erpProviderFactory'

export const OLIST_ERP_RESOURCES: IntegrationResource[] = [
  { slug: 'clientes', name: 'Clientes', description: 'Contatos classificados como clientes.', defaultEnabled: true },
  { slug: 'fornecedores', name: 'Fornecedores', description: 'Contatos classificados como fornecedores.', defaultEnabled: true },
  { slug: 'vendedores', name: 'Vendedores', description: 'Vendedores vinculados a pedidos e comissoes.', defaultEnabled: false },
  { slug: 'produtos', name: 'Produtos', description: 'Catalogo de produtos, descricoes e precos.', defaultEnabled: true },
  { slug: 'variacoes', name: 'Variacoes', description: 'Variacoes de produtos e grades.', defaultEnabled: false },
  { slug: 'marcas', name: 'Marcas', description: 'Marcas do catalogo de produtos.', defaultEnabled: false },
  { slug: 'pedidos_venda', name: 'Pedidos de venda', description: 'Pedidos, situacoes, valores e dados comerciais.', defaultEnabled: true },
  { slug: 'itens_venda', name: 'Itens de venda', description: 'Itens vinculados aos pedidos de venda.', defaultEnabled: true },
  { slug: 'parcelas_venda', name: 'Parcelas de venda', description: 'Parcelas financeiras vinculadas aos pedidos de venda.', defaultEnabled: false },
  { slug: 'compras', name: 'Pedidos de compra', description: 'Ordens e pedidos de compra.', defaultEnabled: false },
  { slug: 'contas_receber', name: 'Contas a receber', description: 'Titulos, vencimentos e recebimentos.', defaultEnabled: true },
  { slug: 'contas_pagar', name: 'Contas a pagar', description: 'Titulos, vencimentos e pagamentos.', defaultEnabled: true },
  { slug: 'notas_fiscais', name: 'Notas fiscais', description: 'NF-e, NFC-e e documentos fiscais.', defaultEnabled: false },
  { slug: 'notas_consumidor', name: 'Notas de consumidor', description: 'NFC-e e documentos de consumidor.', defaultEnabled: false },
  { slug: 'expedicoes', name: 'Expedicoes', description: 'Romaneios, objetos de postagem e rastreios.', defaultEnabled: false },
  { slug: 'separacoes', name: 'Separacoes', description: 'Filas e processos de picking.', defaultEnabled: false },
  { slug: 'estoque', name: 'Saldos de estoque', description: 'Saldo fisico e reservado por produto/deposito.', defaultEnabled: false },
  { slug: 'estoque_movimentacoes', name: 'Movimentacoes de estoque', description: 'Entradas, saidas e ajustes de estoque.', defaultEnabled: false },
  { slug: 'listas_preco', name: 'Listas de preco', description: 'Tabelas de preco e regras comerciais.', defaultEnabled: false },
  { slug: 'formas_envio', name: 'Formas de envio', description: 'Transportadoras e metodos de envio.', defaultEnabled: false },
  { slug: 'formas_pagamento', name: 'Formas de pagamento', description: 'Condicoes e meios de pagamento.', defaultEnabled: false },
  { slug: 'intermediadores', name: 'Intermediadores', description: 'Marketplaces e gateways intermediadores.', defaultEnabled: false },
  { slug: 'categorias', name: 'Categorias', description: 'Categorias hierarquicas do catalogo.', defaultEnabled: false },
  { slug: 'empresa_conectada', name: 'Empresa conectada', description: 'Dados cadastrais da conta autorizada.', defaultEnabled: false },
  { slug: 'uso_api', name: 'Uso da API', description: 'Limites e consumo da API quando disponiveis.', defaultEnabled: false },
  { slug: 'gatilhos', name: 'Gatilhos', description: 'Automacoes e triggers configurados no ERP.', defaultEnabled: false },
]

export const OLIST_ERP_PROVIDER = erpProvider({
  slug: 'olist_erp',
  toolkitSlug: 'OLIST_ERP',
  name: 'Olist ERP',
  description: 'ERP da Olist para ecommerce, financeiro, fiscal, pedidos, estoque e operacao multicanal.',
  authType: 'oauth2',
  supportsOAuthCallback: true,
  supportsIncrementalSync: false,
  resources: OLIST_ERP_RESOURCES,
  tags: ['brasil', 'ecommerce', 'marketplace', 'fiscal'],
})
