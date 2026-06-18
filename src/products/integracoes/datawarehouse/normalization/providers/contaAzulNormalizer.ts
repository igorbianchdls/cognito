import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeErpRows } from '@/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils'

export const contaAzulNormalizer: Normalizer = {
  provider: 'conta_azul',
  normalize(input) {
    return normalizeErpRows(input, {
      clientes: 'clientes',
      fornecedores: 'fornecedores',
      produtos: 'produtos',
      contas_receber: 'contas_receber',
      contas_pagar: 'contas_pagar',
      vendas: 'vendas',
    })
  },
}
