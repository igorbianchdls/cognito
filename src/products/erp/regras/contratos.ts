// Regras de contratos de venda recorrente (catálogo: contratos.md). Funções puras.
import { ok, recusa, type Resultado } from './resultado'

export type AcaoContrato = 'suspender' | 'retomar' | 'encerrar'

/** CT-02: suspender só ativo; retomar só pausado; encerrar ativo ou pausado. Encerrado não volta. */
export function validarAcaoContrato(dados: { acao: AcaoContrato; situacao: string }): Resultado {
  const permitido = dados.acao === 'suspender' ? dados.situacao === 'ativo'
    : dados.acao === 'retomar' ? dados.situacao === 'pausado'
      : dados.acao === 'encerrar' && ['ativo', 'pausado'].includes(dados.situacao)
  return permitido ? ok() : recusa('CT-02', 'Esta ação não está disponível na situação atual do contrato.', { codigo: 'INVALID_STATE', status: 409 })
}

/** Situação do contrato depois da ação. */
export function situacaoAposAcaoContrato(acao: AcaoContrato): string {
  return acao === 'suspender' ? 'pausado' : acao === 'retomar' ? 'ativo' : 'encerrado'
}

/** CT-03: mudar a situação exige motivo de 3 a 1000 caracteres. */
export function validarMotivoContrato(motivo: unknown): Resultado {
  const texto = String(motivo ?? '').trim()
  return texto.length >= 3 && texto.length <= 1000 ? ok() : recusa('CT-03', 'Informe um motivo de 3 a 1000 caracteres.')
}

/** CT-06: não se retoma contrato cuja próxima geração já passou do fim da vigência. */
export function validarVigenciaRetomada(dados: { proximaGeracao: string; fim?: string | null }): Resultado {
  return !dados.fim || dados.proximaGeracao <= dados.fim ? ok()
    : recusa('CT-06', 'A vigência terminou. Encerre este contrato.', { codigo: 'INVALID_STATE', status: 409 })
}
