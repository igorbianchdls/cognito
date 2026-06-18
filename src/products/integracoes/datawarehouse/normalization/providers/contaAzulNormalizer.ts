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
      itens_venda: 'itens_venda',
      venda_detalhes: 'venda_detalhes',
      notas_fiscais: 'notas_fiscais',
      notas_fiscais_servico: 'notas_fiscais_servico',
      categorias: 'categorias',
      centros_custo: 'centros_custo',
      contas_financeiras: 'contas_financeiras',
      transferencias: 'transferencias',
    })
  },
}
