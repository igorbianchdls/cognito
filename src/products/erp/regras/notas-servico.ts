// Regras de notas de serviço (catálogo: notas-servico.md). Funções puras.
import { ok, recusa, type Resultado } from './resultado'

/**
 * NS-15: a competência da nota não pode ser futura. "Hoje" é o da empresa (GE-01, `hojeDaEmpresa`),
 * nunca a data UTC — vale para a emissão individual e para o lote.
 */
export function validarCompetencia(dados: { competencia: string; hoje: string }): Resultado {
  return dados.competencia <= dados.hoje ? ok() : recusa('NS-15', 'A competência não pode ser futura.')
}
