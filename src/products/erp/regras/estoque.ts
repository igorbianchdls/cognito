// Regras de estoque (catálogo: estoque.md). Funções puras.
import { ok, recusa, type Resultado } from './resultado'

/** ES-04: movimentos, contagens e transferências de estoque usam sempre o dia atual da empresa (GE-01). */
export function validarDataMovimento(dados: { data: string | null | undefined; hoje: string; operacao?: 'movimento' | 'contagem' | 'transferencia' }): Resultado {
  if (dados.data === dados.hoje) return ok()
  const mensagem = dados.operacao === 'contagem' ? 'A contagem deve ser registrada no dia atual.'
    : dados.operacao === 'transferencia' ? 'A transferência deve ser registrada no dia atual.'
      : 'Movimentos de estoque devem usar o dia atual. A data histórica do documento permanece no documento de origem.'
  return recusa('ES-04', mensagem, { codigo: 'STOCK_DATE_INVALID' })
}

/** ES-03: uma saída não deixa o físico abaixo do reservado (o disponível nunca fica negativo), salvo produto que permite estoque negativo. */
export function validarSaidaEstoque(dados: { produto: string; fisicoAtual: number; fisicoDepois: number; reservado: number; permiteNegativo?: boolean }): Resultado {
  if (dados.permiteNegativo || dados.fisicoDepois >= dados.reservado) return ok()
  const disponivel = Number((dados.fisicoAtual - dados.reservado).toFixed(4))
  return recusa('ES-03', `Saldo insuficiente para ${dados.produto}. Disponível para saída: ${disponivel}. Saldo físico: ${dados.fisicoAtual}; reservado: ${dados.reservado}.`, { codigo: 'STOCK_OPERATION_INVALID' })
}

/** ES-10: confirmar venda só reserva o disponível (físico − reservado), salvo produto que permite estoque negativo. */
export function validarReservaEstoque(dados: { produto: string; disponivel: number; quantidade: number; permiteNegativo?: boolean }): Resultado {
  return dados.permiteNegativo || dados.disponivel >= dados.quantidade ? ok()
    : recusa('ES-10', `Estoque disponível insuficiente para ${dados.produto}. Disponível: ${dados.disponivel}.`, { codigo: 'STOCK_OPERATION_INVALID' })
}
