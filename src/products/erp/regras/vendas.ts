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

// ---------------------------------------------------------------- orçamento (etapa 4)

/** Situações comerciais do orçamento (proposta). */
export const SITUACOES_ORCAMENTO = ['em_andamento', 'enviada', 'aprovado', 'recusado', 'convertido', 'cancelado'] as const
export type SituacaoOrcamento = typeof SITUACOES_ORCAMENTO[number]

/** Normaliza a situação gravada (aceita nomes antigos como "aprovada", "em_aberto"). */
export function situacaoOrcamento(valor: unknown): SituacaoOrcamento {
  const apelidos: Record<string, SituacaoOrcamento> = { em_aberto: 'em_andamento', aprovada: 'aprovado', recusada: 'recusado', cancelada: 'cancelado' }
  const bruto = String(valor || 'em_andamento')
  return apelidos[bruto] || (SITUACOES_ORCAMENTO.includes(bruto as SituacaoOrcamento) ? bruto as SituacaoOrcamento : 'em_andamento')
}

/** VD-01: recusado, convertido ou cancelado é orçamento encerrado. */
export function orcamentoEncerrado(situacao: unknown): boolean {
  return ['recusado', 'convertido', 'cancelado'].includes(situacaoOrcamento(situacao))
}

/** VD-02: orçamento com validade antes de hoje (da empresa, GE-01) está vencido. */
export function validarOrcamentoVigente(dados: { validade?: string | null; hoje: string }): Resultado {
  return !dados.validade || dados.validade >= dados.hoje ? ok()
    : recusa('VD-02', 'Orçamento vencido. Renove a validade no orçamento antes de enviar, aprovar ou converter.', { codigo: 'QUOTE_EXPIRED', status: 409 })
}

export type AcaoOrcamento = 'enviar' | 'aprovar' | 'recusar' | 'cancelar'

/**
 * VD-01, VD-02, VD-03: encerrado não aceita nenhuma ação; enviar e aprovar exigem orçamento vigente;
 * aprovado não volta para enviado.
 */
export function validarAcaoOrcamento(dados: { acao: AcaoOrcamento; situacao: unknown; cancelado?: boolean; validade?: string | null; hoje: string }): Resultado {
  if (dados.cancelado || orcamentoEncerrado(dados.situacao)) {
    return recusa('VD-01', 'Orçamento encerrado não pode ser alterado.', { codigo: 'INVALID_STATE', status: 409 })
  }
  if (dados.acao === 'enviar' || dados.acao === 'aprovar') {
    const vigente = validarOrcamentoVigente(dados)
    if (!vigente.ok) return vigente
  }
  if (dados.acao === 'enviar' && !['em_andamento', 'enviada'].includes(situacaoOrcamento(dados.situacao))) {
    return recusa('VD-03', 'Orçamento aprovado não pode voltar para enviado.', { codigo: 'INVALID_STATE', status: 409 })
  }
  return ok()
}

/** Situação do orçamento depois da ação. */
export function situacaoAposAcaoOrcamento(acao: AcaoOrcamento): SituacaoOrcamento {
  return ({ enviar: 'enviada', aprovar: 'aprovado', recusar: 'recusado', cancelar: 'cancelado' } as const)[acao]
}

// ---------------------------------------------------------------- cancelar e devolver (etapa 5)

/**
 * VD-41, VD-42, VD-43: venda confirmada não é cancelada direto se tiver devolução, mercadoria entregue,
 * nota fiscal ativa, cobrança ativa ou pagamento. Recebe só os fatos já conferidos (na ordem das consultas).
 */
export function validarCancelamentoVenda(fatos: {
  temDevolucao?: boolean; temEntrega?: boolean; temNotaAtiva?: boolean; temCobrancaAtiva?: boolean; temPagamento?: boolean
}): Resultado {
  if (fatos.temDevolucao) return recusa('VD-41', 'Esta venda possui devolução registrada e não pode ser cancelada diretamente. Para encerrar o saldo, use o abatimento ou aplique o crédito nas parcelas da própria venda.', { codigo: 'SALE_HAS_RETURNS', status: 409 })
  if (fatos.temEntrega) return recusa('VD-42', 'Esta venda já possui mercadoria entregue. Registre a devolução e seu tratamento financeiro; o cancelamento direto não está disponível.', { codigo: 'SALE_HAS_DELIVERIES', status: 409 })
  if (fatos.temNotaAtiva) return recusa('VD-43', 'Cancele ou exclua a nota fiscal antes de cancelar a venda.')
  if (fatos.temCobrancaAtiva) return recusa('VD-43', 'Cancele a cobrança ativa antes de cancelar a venda.')
  if (fatos.temPagamento) return recusa('VD-43', 'Venda com pagamento não pode ser cancelada sem estorno.')
  return ok()
}

/** VD-51: produto devolve só o entregue ainda não devolvido; serviço, o vendido ainda não devolvido. */
export function validarQuantidadeDevolucao(dados: { posicao: number; quantidade: number; limite: number; ehProduto: boolean }): Resultado {
  if (dados.quantidade <= dados.limite + 1e-9) return ok()
  return recusa('VD-51', dados.ehProduto
    ? `Item ${dados.posicao}: só ${dados.limite} unidade(s) entregue(s) ainda podem ser devolvidas. Itens não entregues: cancele a venda.`
    : `Item ${dados.posicao}: só ${dados.limite} unidade(s) ainda podem ser devolvidas.`)
}

/** VD-53: no tratamento "abater", o em aberto da venda precisa cobrir o valor devolvido (em centavos). */
export function validarAbatimentoDevolucao(dados: { emAbertoCentavos: number; totalCentavos: number }): Resultado {
  return dados.emAbertoCentavos >= dados.totalCentavos ? ok()
    : recusa('VD-53', `A venda tem ${(dados.emAbertoCentavos / 100).toFixed(2)} em aberto, menos que a devolução (${(dados.totalCentavos / 100).toFixed(2)}). Use crédito ou reembolso.`, { status: 409 })
}

/**
 * VD-01, VD-02 na conversão: orçamento encerrado (ou cancelado/excluído) não vira venda; vencido precisa renovar a validade.
 * Antes ficava no banco (BD-30, gatilho validar_conversao_proposta).
 */
export function validarConversaoOrcamento(dados: { situacao: unknown; cancelado?: boolean; validade?: string | null; hoje: string }): Resultado {
  if (dados.cancelado || orcamentoEncerrado(dados.situacao)) {
    return recusa('VD-01', 'Orçamento encerrado não pode ser convertido.', { codigo: 'INVALID_STATE', status: 409 })
  }
  return validarOrcamentoVigente(dados)
}

// ---------------------------------------------------------------- origem entre documentos (etapa 9, antes no banco: BD-42)

/** VD-09: orçamento vira pedido ou venda; pedido vira venda. Nenhuma outra conversão vale. */
export function validarOrigemDocumento(dados: { tipoOrigem: string; tipoNovo: string }): Resultado {
  const valida = (dados.tipoOrigem === 'orcamento' && ['pedido', 'venda'].includes(dados.tipoNovo))
    || (dados.tipoOrigem === 'pedido' && dados.tipoNovo === 'venda')
  return valida ? ok() : recusa('VD-09', 'Conversão inválida: orçamento vira pedido ou venda, e pedido vira venda.', { codigo: 'INVALID_STATE', status: 409 })
}

/** VD-08: só venda gera conta a receber; orçamento e pedido precisam ser convertidos em venda antes de confirmar. */
export function validarConfirmacaoFinanceira(dados: { tipoDocumento: string }): Resultado {
  if (dados.tipoDocumento === 'orcamento') return recusa('VD-08', 'Converta o orçamento em venda antes de confirmar o financeiro.')
  if (dados.tipoDocumento !== 'venda') return recusa('VD-08', 'Converta o pedido em venda antes de confirmar o financeiro.')
  return ok()
}
