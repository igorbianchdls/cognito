import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeErpRows } from '@/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils'

export const contaAzulNormalizer: Normalizer = {
  provider: 'conta_azul',
  normalize(input) {
    return normalizeErpRows(input, {
      clientes: 'clientes',
      fornecedores: 'fornecedores',
      produtos: 'produtos',
      produto_categorias: 'produto_categorias',
      produto_cest: 'produto_cest',
      produto_ecommerce_marcas: 'produto_ecommerce_marcas',
      produto_ncm: 'produto_ncm',
      produto_unidades_medida: 'produto_unidades_medida',
      servicos: 'servicos',
      empresa_conectada: 'empresa_conectada',
      contas_receber: 'contas_receber',
      contas_pagar: 'contas_pagar',
      vendas: 'vendas',
      vendedores: 'vendedores',
      contratos: 'contratos',
      itens_venda: 'itens_venda',
      venda_detalhes: 'venda_detalhes',
      venda_proximo_numero: 'venda_proximo_numero',
      contrato_proximo_numero: 'contrato_proximo_numero',
      notas_fiscais: 'notas_fiscais',
      notas_fiscais_servico: 'notas_fiscais_servico',
      categorias: 'categorias',
      categorias_dre: 'categorias_dre',
      centros_custo: 'centros_custo',
      contas_financeiras: 'contas_financeiras',
      saldos_contas_financeiras: 'saldos_contas_financeiras',
      transferencias: 'transferencias',
      eventos_financeiros_alteracoes: 'eventos_financeiros_alteracoes',
      saldos_iniciais: 'saldos_iniciais',
    })
  },
}
