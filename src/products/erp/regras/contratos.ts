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

// ---------------------------------------------------------------- versões e ciclos (etapa 7, antes no banco: BD-40)

const ATE_O_FIM = '9999-12-31'

/** Os dois períodos (fim vazio = sem fim) têm algum dia em comum. */
export function periodosSobrepostos(a: { inicio: string; fim?: string | null }, b: { inicio: string; fim?: string | null }): boolean {
  return a.inicio <= (b.fim || ATE_O_FIM) && b.inicio <= (a.fim || ATE_O_FIM)
}

/**
 * CT-10: uma versão só passa a valer com pelo menos um item e com vigência dentro da vigência do contrato.
 * (Versões sem sobreposição e itens imutáveis depois de valer são garantias que ficam no banco.)
 */
export function validarEfetivacaoVersao(dados: {
  quantidadeItens: number
  versao: { inicio: string; fim?: string | null }
  contrato: { inicio: string; fim?: string | null }
}): Resultado {
  if (dados.quantidadeItens <= 0) return recusa('CT-10', 'A versão precisa de pelo menos um item antes de valer.', { codigo: 'INVALID_STATE', status: 409 })
  const { versao, contrato } = dados
  if (versao.inicio < contrato.inicio || (versao.fim || ATE_O_FIM) > (contrato.fim || ATE_O_FIM)) {
    return recusa('CT-10', 'A vigência da versão precisa ficar dentro da vigência do contrato.', { codigo: 'INVALID_PERIOD', status: 422 })
  }
  return ok()
}

/** CT-11: o contrato só fica ativo com uma versão valendo. */
export function validarAtivacaoContrato(dados: { temVersaoEfetivada: boolean }): Resultado {
  return dados.temVersaoEfetivada ? ok() : recusa('CT-11', 'O contrato só pode ficar ativo com uma versão valendo.', { codigo: 'INVALID_STATE', status: 409 })
}

/**
 * CT-12: um ciclo só é gerado de contrato ativo, dentro da vigência de uma versão que vale, com a duração da periodicidade
 * (`fimEsperado` = véspera do próximo ciclo) e com venda do mesmo cliente do contrato.
 */
export function validarCicloContrato(dados: {
  contratoAtivo: boolean
  versaoEfetivada: boolean
  periodo: { inicio: string; fim: string }
  vigencia: { inicio: string; fim?: string | null }
  fimEsperado: string
  clienteDaVenda?: string | number | null
  clienteDoContrato?: string | number | null
}): Resultado {
  if (!dados.contratoAtivo) return recusa('CT-12', 'Só contrato ativo gera ciclos.', { codigo: 'INVALID_STATE', status: 409 })
  const { periodo, vigencia } = dados
  if (!dados.versaoEfetivada || periodo.inicio < vigencia.inicio || periodo.fim > (vigencia.fim || ATE_O_FIM)) {
    return recusa('CT-12', 'O ciclo completo precisa caber na vigência da versão do contrato.', { codigo: 'INVALID_PERIOD', status: 422 })
  }
  if (periodo.fim !== dados.fimEsperado) {
    return recusa('CT-12', 'A duração do ciclo não corresponde à periodicidade do contrato.', { codigo: 'INVALID_PERIOD', status: 422 })
  }
  if (dados.clienteDaVenda != null && dados.clienteDoContrato != null && String(dados.clienteDaVenda) !== String(dados.clienteDoContrato)) {
    return recusa('CT-12', 'A venda do ciclo precisa ser do cliente do contrato.', { codigo: 'INVALID_REFERENCE', status: 422 })
  }
  return ok()
}
