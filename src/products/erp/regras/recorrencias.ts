// Calendário e regras de recorrências financeiras e de compra (catálogo: recorrencias.md). Funções puras.
// Antes o banco refazia o calendário em SQL (BD-44); agora ele só garante que uma ocorrência não se repete.
import { ok, recusa, type Resultado } from './resultado'

export type Frequencia = 'dia' | 'semana' | 'mes' | 'ano'

/**
 * RC-01: data da ocorrência `ocorrencia` (0 = início). Mês e ano preservam o dia do início, ajustando ao último dia
 * do mês quando ele não existe (31/01 + 1 mês = 28/02 ou 29/02; 31/03 + 1 mês = 30/04).
 */
export function deslocarData(inicio: string, frequencia: string, intervalo: number, ocorrencia: number): string {
  const data = new Date(`${inicio}T12:00:00.000Z`)
  const passos = intervalo * ocorrencia
  if (frequencia === 'dia') data.setUTCDate(data.getUTCDate() + passos)
  else if (frequencia === 'semana') data.setUTCDate(data.getUTCDate() + passos * 7)
  else {
    const diaOriginal = data.getUTCDate()
    data.setUTCDate(1)
    data.setUTCMonth(data.getUTCMonth() + (frequencia === 'ano' ? passos * 12 : passos))
    const ultimoDia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0, 12)).getUTCDate()
    data.setUTCDate(Math.min(diaOriginal, ultimoDia))
  }
  return data.toISOString().slice(0, 10)
}

/** RC-01: número da ocorrência (0 = início) que cai em `competencia`, ou null se a data não é do calendário. */
export function indiceDaOcorrencia(inicio: string, competencia: string, frequencia: string, intervalo: number): number | null {
  const a = new Date(`${inicio}T12:00:00Z`), b = new Date(`${competencia}T12:00:00Z`)
  const unidades = frequencia === 'dia' ? (b.getTime() - a.getTime()) / 86400000
    : frequencia === 'semana' ? (b.getTime() - a.getTime()) / (86400000 * 7)
      : frequencia === 'mes' ? (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth()
        : b.getUTCFullYear() - a.getUTCFullYear()
  const indice = unidades / intervalo
  if (!Number.isInteger(indice) || indice < 0 || deslocarData(inicio, frequencia, intervalo, indice) !== competencia) return null
  return indice
}

/** RC-01: a competência precisa ser uma data do calendário da recorrência. */
export function validarCalendario(dados: { inicio: string; competencia: string; frequencia: string; intervalo: number }): Resultado {
  return indiceDaOcorrencia(dados.inicio, dados.competencia, dados.frequencia, dados.intervalo) === null
    ? recusa('RC-01', 'Próxima ocorrência fora do calendário da recorrência.')
    : ok()
}

/**
 * RC-02: uma ocorrência só é gerada de recorrência ativa (não pausada, não encerrada), dentro do período
 * (início até o término por data) e sem passar da quantidade de ocorrências; e precisa cair no calendário (RC-01).
 */
export function validarOcorrencia(dados: {
  ativa: boolean
  pausada?: boolean
  encerrada?: boolean
  inicio: string
  termino?: string | null
  quantidadeOcorrencias?: number | null
  frequencia: string
  intervalo: number
  competencia: string
}): Resultado {
  if (!dados.ativa || dados.pausada || dados.encerrada) {
    return recusa('RC-02', 'Recorrência pausada ou encerrada não gera novas ocorrências.', { codigo: 'INVALID_STATE', status: 409 })
  }
  if (dados.competencia < dados.inicio || (dados.termino && dados.competencia > dados.termino)) {
    return recusa('RC-02', 'Competência fora do período da recorrência.')
  }
  const indice = indiceDaOcorrencia(dados.inicio, dados.competencia, dados.frequencia, dados.intervalo)
  if (indice === null) return recusa('RC-01', 'Próxima ocorrência fora do calendário da recorrência.')
  if (dados.quantidadeOcorrencias != null && indice >= dados.quantidadeOcorrencias) {
    return recusa('RC-02', 'A recorrência já gerou todas as ocorrências previstas.', { codigo: 'INVALID_STATE', status: 409 })
  }
  return ok()
}
