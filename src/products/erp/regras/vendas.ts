// Regras de vendas (catálogo: vendas.md). Funções puras.
import { ok, recusa, type Resultado } from './resultado'

/**
 * VD-30: só se entrega (atende) venda confirmada com entrega pendente ou parcial.
 * Mesma regra e mesma mensagem para a entrega total (chat) e a parcial (tela).
 */
export function validarEntrega(venda: { situacao: string; entrega: string }): Resultado {
  return venda.situacao === 'confirmada' && ['pendente', 'parcial'].includes(venda.entrega) ? ok()
    : recusa('VD-30', 'Venda precisa estar confirmada e com entrega pendente para atender.', { codigo: 'INVALID_STATE', status: 409 })
}

// ---------------------------------------------------------------- regras comerciais (etapa 3)

/** VD-21: cliente com bloqueio comercial não compra. */
export function validarClienteLiberado(cliente: { bloqueado: boolean; motivo?: string | null }): Resultado {
  return !cliente.bloqueado ? ok()
    : recusa('VD-21', `Cliente bloqueado para vendas: ${cliente.motivo?.trim() || 'sem motivo informado'}.`, { codigo: 'CUSTOMER_BLOCKED', status: 409 })
}

const reais = (valor: number) => Math.round(valor * 100) / 100

/** Quanto a venda passa do limite de crédito (em aberto + venda − limite), ou null se não passa ou não há limite. */
export function excessoDeCredito(dados: { limite: number | null | undefined; emAberto: number; valorVenda: number }) {
  if (dados.limite === null || dados.limite === undefined) return null
  const exposicao = reais(dados.emAberto + dados.valorVenda)
  if (exposicao <= dados.limite) return null
  return { limite: dados.limite, em_aberto: reais(dados.emAberto), venda: reais(dados.valorVenda), excedente: reais(exposicao - dados.limite) }
}

/**
 * VD-22, VD-23: o em aberto do cliente mais esta venda não passa do limite de crédito (sem limite cadastrado, não há trava).
 * Acima do limite, só passa com motivo informado e por quem gerencia o financeiro.
 */
export function validarCredito(dados: {
  limite: number | null | undefined; emAberto: number; valorVenda: number
  motivoLiberacao?: string | null; podeLiberar?: boolean
}): Resultado {
  const excesso = excessoDeCredito(dados)
  if (!excesso) return ok()
  if (!dados.motivoLiberacao?.trim()) {
    return recusa('VD-22',
      `Limite de crédito excedido em ${excesso.excedente.toFixed(2)} (limite ${excesso.limite.toFixed(2)}, em aberto ${excesso.em_aberto.toFixed(2)}, venda ${excesso.venda.toFixed(2)}). Quem gerencia o financeiro pode liberar informando o motivo.`,
      { codigo: 'CREDIT_LIMIT_EXCEEDED', status: 409, detalhes: excesso })
  }
  if (!dados.podeLiberar) {
    return recusa('VD-23', 'Somente quem gerencia o financeiro pode liberar venda acima do limite de crédito.', { codigo: 'ACCESS_DENIED', status: 403, detalhes: excesso })
  }
  return ok()
}

/** Preço da faixa da tabela de preço para o item (null: item fora da tabela). */
export type PrecoTabela = { preco: number; precoMinimo: number | null; descontoMaximo: number | null }

/** VD-15: com tabela de preço, o preço líquido por unidade não fica abaixo do mínimo e o desconto não passa do máximo da tabela. */
export function validarPrecoTabela(dados: { posicao: number; tabela: PrecoTabela | null; quantidade: number; bruto: number; desconto: number }): Resultado {
  const { tabela, posicao } = dados
  if (!tabela) return ok()
  const liquidoUnitario = (dados.bruto - dados.desconto) / dados.quantidade
  if (tabela.precoMinimo !== null && liquidoUnitario + 1e-9 < tabela.precoMinimo) {
    return recusa('VD-15', `Item ${posicao}: preço líquido abaixo do mínimo da tabela (${tabela.precoMinimo.toFixed(2)}).`)
  }
  if (tabela.descontoMaximo !== null && tabela.preco > 0) {
    const percentual = (1 - liquidoUnitario / tabela.preco) * 100
    if (percentual > tabela.descontoMaximo + 1e-6) {
      return recusa('VD-15', `Item ${posicao}: desconto de ${percentual.toFixed(2)}% acima do máximo da tabela (${tabela.descontoMaximo}%).`)
    }
  }
  return ok()
}

/** VD-16: o desconto total (itens + venda) sobre o valor bruto não passa do máximo permitido ao vendedor. */
export function validarDescontoVendedor(dados: { descontoMaximo: number | null | undefined; bruto: number; desconto: number }): Resultado {
  if (dados.descontoMaximo == null || dados.bruto <= 0 || dados.desconto <= 0) return ok()
  const percentual = Math.round(dados.desconto / dados.bruto * 10000) / 100
  return percentual <= dados.descontoMaximo ? ok()
    : recusa('VD-16', `Desconto de ${percentual.toFixed(2)}% acima do máximo permitido para você (${dados.descontoMaximo.toFixed(2)}%).`,
      { codigo: 'DISCOUNT_LIMIT_EXCEEDED', status: 403, detalhes: { desconto_percentual: percentual, desconto_maximo_percentual: dados.descontoMaximo } })
}
