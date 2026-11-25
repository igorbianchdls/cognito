// Regras de compras (catálogo: compras.md). Funções puras.
import { ok, recusa, type Resultado } from './resultado'

/** CP-10: confirmar exige compra não cancelada, com fornecedor, total > 0, pelo menos um item e data válida. */
export function validarConfirmacaoCompra(dados: { cancelada?: boolean; temFornecedor?: boolean; total?: number; quantidadeItens?: number; dataValida?: boolean }): Resultado {
  if (dados.cancelada) return recusa('CP-10', 'Compra cancelada não pode ser confirmada.')
  if (dados.temFornecedor === false) return recusa('CP-10', 'Compra precisa ter fornecedor para ser confirmada.')
  if (dados.total !== undefined && !(Math.round(dados.total * 100) > 0)) return recusa('CP-10', 'Compra precisa ter total maior que zero para ser confirmada.')
  if (dados.quantidadeItens !== undefined && dados.quantidadeItens <= 0) return recusa('CP-10', 'Compra precisa ter pelo menos um item para ser confirmada.')
  if (dados.dataValida === false) return recusa('CP-10', 'Compra precisa ter data valida para ser confirmada.')
  return ok()
}

/**
 * CP-31: não cancela compra que já teve mercadoria recebida (o caminho é a devolução ao fornecedor, CP-40), nem com nota
 * fiscal vinculada ativa ou com pagamento (estorne antes).
 */
export function validarCancelamentoCompra(fatos: { temRecebimento?: boolean; temNotaAtiva?: boolean; temPagamento?: boolean }): Resultado {
  if (fatos.temRecebimento) return recusa('CP-31', 'Esta compra já teve mercadoria recebida. Use a devolução ao fornecedor em vez de cancelar.', { codigo: 'PURCHASE_HAS_RECEIPTS', status: 409 })
  if (fatos.temNotaAtiva) return recusa('CP-31', 'Desvincule ou cancele a nota fiscal antes de cancelar a compra.')
  if (fatos.temPagamento) return recusa('CP-31', 'Compra com pagamento não pode ser cancelada sem estorno.')
  return ok()
}

/**
 * CP-40, CP-41, CP-43: devolução ao fornecedor é integral, só de compra de produtos totalmente recebida, uma vez só,
 * e exige reverter créditos e renegociações antes.
 */
export function validarDevolucaoCompra(fatos: { jaDevolvida?: boolean; situacao?: string; tipoCompra?: string; temCreditosOuRenegociacoes?: boolean }): Resultado {
  if (fatos.jaDevolvida) return recusa('CP-41', 'Esta compra já foi devolvida integralmente.', { codigo: 'INVALID_STATE', status: 409 })
  if (fatos.situacao !== undefined && (fatos.situacao !== 'recebida' || fatos.tipoCompra !== 'produto')) {
    return recusa('CP-40', 'A devolução integral exige uma compra de produtos totalmente recebida.', { codigo: 'INVALID_STATE', status: 409 })
  }
  if (fatos.temCreditosOuRenegociacoes) return recusa('CP-43', 'Reverta créditos e renegociações vinculados antes de devolver a compra.', { codigo: 'INVALID_STATE', status: 409 })
  return ok()
}

/** CP-13: só compra efetiva gera conta a pagar; cotação e pedido precisam ser confirmados antes. (Antes no banco, BD-42.) */
export function validarContaPagarDaCompra(dados: { tipoMovimento: string }): Resultado {
  return dados.tipoMovimento === 'compra' ? ok()
    : recusa('CP-13', 'Só compra confirmada gera conta a pagar. Confirme a cotação ou o pedido antes.', { codigo: 'INVALID_STATE', status: 409 })
}

/** CP-20: só se recebe mercadoria de compra confirmada; rascunho (cotação ou compra não confirmada) e cancelada não. */
export function validarRecebimentoCompra(dados: { situacao: string }): Resultado {
  if (dados.situacao === 'cancelada') return recusa('CP-20', 'Compra cancelada não pode ser recebida.', { codigo: 'INVALID_STATE', status: 409 })
  if (dados.situacao === 'rascunho') return recusa('CP-20', 'Confirme a compra antes de receber a mercadoria.', { codigo: 'INVALID_STATE', status: 409 })
  return ok()
}
