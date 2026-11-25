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
