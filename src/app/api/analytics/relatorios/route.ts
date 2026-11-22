import { auth } from '@clerk/nextjs/server'
import { bigQueryConfig, AnalyticsUnavailable } from '@/products/analytics/server/bigquery'
import { visibleProperty } from '@/products/analytics/server/database'
import { REPORTS, runReport, type Report } from '@/products/analytics/server/reports'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, max-age=60' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** GET ?propriedade=<id>&relatorio=resumo&de=2026-11-01&ate=2026-11-22 — only for members of the property's company. */
export async function GET(request: Request) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) return json(401, { erro: 'Entre e escolha uma empresa.' })
  const q = new URL(request.url).searchParams
  const propertyId = q.get('propriedade') ?? '', report = q.get('relatorio') as Report
  if (!UUID.test(propertyId) || !REPORTS.includes(report)) return json(400, { erro: 'Parâmetros inválidos.' })
  const de = new Date(q.get('de') ?? ''), ate = new Date(q.get('ate') ?? '')
  if (isNaN(de.getTime()) || isNaN(ate.getTime()) || ate <= de || ate.getTime() - de.getTime() > 400 * 86400000) return json(400, { erro: 'Período inválido (até 400 dias).' })
  const evento = (q.get('evento') ?? '').slice(0, 120)

  const property = await visibleProperty(userId, orgId, propertyId).catch(() => undefined)
  if (property === undefined) return json(503, { erro: 'Não foi possível conferir o acesso.' })
  if (!property) return json(404, { erro: 'Propriedade não encontrada nesta empresa.' })
  const config = bigQueryConfig()
  if (!config) return json(503, { erro: 'O BigQuery ainda não está configurado.', configurado: false })
  try {
    return json(200, { linhas: await runReport(config, report, property.id, de, ate, evento) })
  } catch (error) {
    if (error instanceof AnalyticsUnavailable) return json(503, { erro: error.message })
    console.error(JSON.stringify({ scope: 'analytics', code: 'REPORT_FAILED', report, message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível montar o relatório.' })
  }
}
