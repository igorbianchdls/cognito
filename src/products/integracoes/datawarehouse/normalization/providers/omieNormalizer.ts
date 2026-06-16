import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeErpRows } from '@/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils'

export const omieNormalizer: Normalizer = {
  provider: 'omie',
  normalize(input) {
    return normalizeErpRows(input, {
      clientes: 'clientes',
      fornecedores: 'fornecedores',
      produtos: 'produtos',
      contas_receber: 'contas_receber',
      contas_pagar: 'contas_pagar',
      pedidos_venda: 'vendas',
      estoque_saldos: 'estoque_atual',
    })
  },
}
