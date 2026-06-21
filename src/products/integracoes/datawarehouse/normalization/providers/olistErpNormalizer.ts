import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeErpRows } from '@/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils'

function normalizeProvider(inputProvider: string) {
  return inputProvider === 'tiny' ? 'olist_erp' : inputProvider
}

export const olistErpNormalizer: Normalizer = {
  provider: 'olist_erp',
  normalize(input) {
    return normalizeErpRows({
      ...input,
      provider: normalizeProvider(input.provider),
    }, {
      clientes: 'clientes',
      fornecedores: 'fornecedores',
      vendedores: 'vendedores',
      produtos: 'produtos',
      variacoes: 'variacoes',
      marcas: 'marcas',
      pedidos_venda: 'vendas',
      itens_venda: 'itens_venda',
      parcelas_venda: 'parcelas_venda',
      compras: 'compras',
      contas_receber: 'contas_receber',
      contas_pagar: 'contas_pagar',
      notas_fiscais: 'notas_fiscais',
      notas_consumidor: 'notas_consumidor',
      expedicoes: 'expedicoes',
      separacoes: 'separacoes',
      estoque: 'estoque_atual',
      estoque_movimentacoes: 'estoque_movimentacoes',
      listas_preco: 'listas_preco',
      formas_envio: 'formas_envio',
      formas_pagamento: 'formas_pagamento',
      intermediadores: 'intermediadores',
      categorias: 'categorias',
      empresa_conectada: 'empresa_conectada',
      uso_api: 'uso_api',
      gatilhos: 'gatilhos',
    })
  },
}

export const tinyNormalizer: Normalizer = {
  ...olistErpNormalizer,
  provider: 'tiny',
}
