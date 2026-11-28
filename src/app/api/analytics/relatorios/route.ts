import { comPropriedade } from '@/products/analytics/server/http'
import { relatorio } from '@/products/analytics/server/motor'
import { AnalyticsError } from '@/products/analytics/server/pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RELATORIOS = ['resumo', 'totais', 'paginas', 'entradas', 'origens', 'campanhas', 'aparelhos', 'eventos', 'ao-vivo', 'agora']

/** GET ?propriedade&relatorio=resumo&de&ate (&evento): os números do painel geral e dos eventos ao vivo. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('relatorio', q.get('propriedade'), async (db, id) => {
    const nome = q.get('relatorio') ?? ''
    if (!RELATORIOS.includes(nome)) throw new AnalyticsError('Relatório desconhecido.')
    const de = new Date(q.get('de') ?? ''), ate = new Date(q.get('ate') ?? '')
    if (isNaN(de.getTime()) || isNaN(ate.getTime()) || ate <= de || ate.getTime() - de.getTime() > 400 * 86400000) throw new AnalyticsError('Período inválido (até 400 dias).')
    return { linhas: await relatorio(db, nome, id, de, ate, (q.get('evento') ?? '').slice(0, 120)) }
  })
}
