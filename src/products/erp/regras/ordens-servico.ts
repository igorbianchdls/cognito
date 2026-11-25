// Regras de ordens de serviço (catálogo: ordens-servico.md). Funções puras.
import { recusa, type Recusa } from './resultado'

export type AcaoOS = 'aprovar' | 'iniciar' | 'concluir' | 'cancelar'

/** OS-03: de qual situação cada ação parte e para qual vai. Concluída e cancelada não mudam mais. */
export const TRANSICOES_OS: Record<AcaoOS, Record<string, string>> = {
  aprovar: { rascunho: 'aprovada', orcamento_pendente: 'aprovada' },
  iniciar: { aprovada: 'em_execucao' },
  concluir: { em_execucao: 'concluida' },
  cancelar: { rascunho: 'cancelada', orcamento_pendente: 'cancelada', aprovada: 'cancelada', em_execucao: 'cancelada' },
}

/** OS-03: a próxima situação da OS, ou a recusa quando a ação não vale para a situação atual. */
export function proximaSituacaoOS(acao: string, situacao: string): { ok: true; proxima: string } | Recusa {
  const proxima = TRANSICOES_OS[acao as AcaoOS]?.[situacao]
  return proxima ? { ok: true, proxima } : recusa('OS-03', 'Ação indisponível para a situação atual.', { codigo: 'INVALID_STATE', status: 409 })
}
