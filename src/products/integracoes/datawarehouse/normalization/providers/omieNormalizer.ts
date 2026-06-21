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
      pedidos_compra: 'compras',
      notas_fiscais: 'notas_fiscais',
      notas_servico: 'notas_fiscais_servico',
      categorias: 'categorias',
      departamentos: 'centros_custo',
      servicos: 'servicos',
      contratos: 'contratos',
      estoque_saldos: 'estoque_atual',
      estoque_movimentacoes: 'estoque_movimentacoes',
      lancamentos_financeiros: 'lancamentos_financeiros',
      contas_correntes: 'contas_correntes',
    })
  },
}
