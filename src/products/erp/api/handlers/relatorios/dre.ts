import { NextResponse } from 'next/server'
import { dreEntries, dreReport } from '../../../server/erpDreReport'
import { erpToday } from '../../../server/erpBusinessDate'
import { resolveErpApiAccess } from '../../http/access'
import { withErpHttp } from '../../http/handler'

// DRE estruturada (?inicio&fim&visao=competencia|caixa). Com ?categoria_id (ou ?sem_categoria=1 / ?devolucoes=1),
// devolve os lançamentos daquela linha para o detalhamento.
async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.relatorios.visualizar'), params = new URL(request.url).searchParams
  const today = erpToday()
  const input = { inicio: params.get('inicio') || `${today.slice(0, 4)}-01-01`, fim: params.get('fim') || today, visao: params.get('visao') || 'competencia' }
  if (params.has('categoria_id') || params.get('sem_categoria') === '1' || params.get('devolucoes') === '1') {
    const id = Number(params.get('categoria_id'))
    return NextResponse.json({ records: await dreEntries(access.tenantId, { ...input, categoriaId: Number.isInteger(id) && id > 0 ? id : null, devolucoes: params.get('devolucoes') === '1' }) })
  }
  return NextResponse.json(await dreReport(access.tenantId, input))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/relatorios/dre' })
