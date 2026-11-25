// Regras de contas a pagar (catálogo: contas-pagar.md). Funções puras. O que vale igual para receber e pagar
// fica em contas-receber.ts.
import { ok, recusa, type Resultado } from './resultado'

/**
 * CPG-07: reduzir a provisão de comissão de uma venda exige permissão de financeiro (antes o banco repetia essa
 * checagem, BD-41) e provisão ainda aberta: sem baixa, crédito, renegociação ou conciliação.
 */
export function validarAjusteComissao(dados: { podeGerenciarFinanceiro: boolean }): Resultado {
  return dados.podeGerenciarFinanceiro ? ok()
    : recusa('CPG-07', 'Esta venda possui comissão provisionada. Quem gerencia o financeiro precisa registrar esta alteração.', { codigo: 'COMMISSION_FINANCIAL_PERMISSION', status: 403 })
}

export function validarProvisaoComissaoAberta(dados: { situacaoTitulo?: string | null; temMovimento?: boolean }): Resultado {
  if (!dados.situacaoTitulo || !['aberto', 'vencido'].includes(dados.situacaoTitulo)) {
    return recusa('CPG-07', 'A comissão possui pagamento, renegociação ou provisão já encerrada. Trate o financeiro antes de cancelar ou devolver a venda.', { codigo: 'COMMISSION_PROVISION_SETTLED', status: 409 })
  }
  if (dados.temMovimento) {
    return recusa('CPG-07', 'A comissão já possui baixa ou conciliação. Estorne ou compense a comissão no financeiro antes de alterar a venda.', { codigo: 'COMMISSION_PROVISION_SETTLED', status: 409 })
  }
  return ok()
}
