import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeErpRows } from '@/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils'

export const blingNormalizer: Normalizer = {
  provider: 'bling',
  normalize(input) {
    return normalizeErpRows(input, {
      clientes: 'clientes',
      fornecedores: 'fornecedores',
      produtos: 'produtos',
      contas_receber: 'contas_receber',
      contas_pagar: 'contas_pagar',
      pedidos_venda: 'vendas',
      servicos: 'servicos',
      notas_fiscais: 'notas_fiscais',
      notas_servico: 'notas_fiscais_servico',
      categorias: 'categorias',
      categorias_receitas_despesas: 'categorias',
      estoque: 'estoque_atual',
    })
  },
}
