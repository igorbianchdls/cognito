// Regras de cadastros (catálogo: cadastros.md). Funções puras.
import { ok, primeiraRecusa, recusa, type Resultado } from './resultado'

/** CD-04: limite de crédito vazio (sem limite) ou ≥ 0; bloqueio comercial exige motivo. */
export function validarCondicoesCliente(dados: { limiteCredito?: number | null; bloqueado?: boolean; motivoBloqueio?: string | null }): Resultado {
  const limite = dados.limiteCredito
  return primeiraRecusa(
    limite === null || limite === undefined || (Number.isFinite(limite) && limite >= 0) ? ok() : recusa('CD-04', 'Limite de crédito inválido.'),
    !dados.bloqueado || dados.motivoBloqueio?.trim() ? ok() : recusa('CD-04', 'Informe o motivo do bloqueio comercial.'),
  )
}
