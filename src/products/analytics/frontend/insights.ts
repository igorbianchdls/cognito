// O que os insights têm em comum entre o construtor, a lista e os painéis: consultas novas de cada tipo, o período
// relativo (um insight salvo com 30 dias mostra sempre os últimos 30) e a limpeza antes de consultar.
import type { Consulta, Filtro } from '../shared/consulta'
import { ultimosDias } from './api'
import type { Visual } from './graficos'

export type Insight = { id: string; property_id: string; name: string; description: string; query: Consulta; view: Visual; created_at: string; updated_at: string }
export type Painel = { id: string; property_id: string; name: string; items: { insight_id: string; largura: 1 | 2 }[]; created_at: string }

export const TIPOS = { tendencia: 'Tendência', funil: 'Funil', retencao: 'Retenção', caminhos: 'Caminhos' } as const

export function nova(tipo: Consulta['tipo'], dias = 30): Consulta {
  const p = ultimosDias(dias)
  if (tipo === 'funil') return { tipo, passos: [{ evento: '$pageview', filtros: [] }, { evento: '$autocapture', filtros: [] }], janela_dias: 7, filtros: [], ...p }
  if (tipo === 'retencao') return { tipo, inicial: { evento: '$pageview', filtros: [] }, retorno: { evento: '$pageview', filtros: [] }, intervalo: 'semana', periodos: 8, filtros: [], ...p }
  if (tipo === 'caminhos') return { tipo, direcao: 'depois', passos: 4, filtros: [], ...p }
  return { tipo: 'tendencia', series: [{ evento: '$pageview', metrica: 'pessoas', filtros: [] }], intervalo: 'dia', filtros: [], comparar: false, ...p }
}

export const diasDe = (c: Pick<Consulta, 'de' | 'ate'>) => Math.max(1, Math.round((new Date(c.ate).getTime() - new Date(c.de).getTime()) / 86400000))

/** A mesma consulta nos últimos N dias até hoje. */
export const noPeriodo = <C extends Consulta>(c: C, dias: number): C => ({ ...c, ...ultimosDias(dias) })

const ok = (f: Filtro) => f.campo === 'coorte' ? Boolean(f.valor) : f.op === 'existe' || f.op === 'nao_existe' || Boolean(f.valor?.trim())
const fs = (l: Filtro[] | undefined) => (l ?? []).filter(ok)

/** Tira filtros ainda sem valor (enquanto a pessoa monta), para não zerar o gráfico. */
export function limpar(c: Consulta): Consulta {
  switch (c.tipo) {
    case 'tendencia': return { ...c, filtros: fs(c.filtros), series: c.series.map(s => ({ ...s, filtros: fs(s.filtros) })) }
    case 'funil': return { ...c, filtros: fs(c.filtros), passos: c.passos.map(s => ({ ...s, filtros: fs(s.filtros) })) }
    case 'retencao': return { ...c, filtros: fs(c.filtros), inicial: { ...c.inicial, filtros: fs(c.inicial.filtros) }, retorno: { ...c.retorno, filtros: fs(c.retorno.filtros) } }
    case 'caminhos': return { ...c, filtros: fs(c.filtros), pagina: c.pagina?.trim() || undefined }
  }
}

/** Uma frase do que o insight mostra (na lista e nos cartões). */
export function resumo(c: Consulta) {
  switch (c.tipo) {
    case 'tendencia': return `${c.series.length} série${c.series.length > 1 ? 's' : ''} por ${c.intervalo}${c.quebra ? ' com quebra' : ''}`
    case 'funil': return `${c.passos.length} passos em até ${c.janela_dias} dias`
    case 'retencao': return `Retenção por ${c.intervalo}, ${c.periodos} períodos`
    case 'caminhos': return c.pagina ? `${c.direcao === 'depois' ? 'Depois de' : 'Antes de'} ${c.pagina}` : 'A partir do início da sessão'
  }
}
