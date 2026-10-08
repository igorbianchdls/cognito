import { NextResponse } from 'next/server'
import { runScheduledErpAutomations } from '../../../server/erpAutomationSchedule'
import { withErpHttp } from '../../http/handler'
import { erpFailure } from '../../http/responses'

async function handleGET(request:Request) {
  const secret=process.env.CRON_SECRET
  if (!secret) {
    // Sem o segredo nenhuma rotina roda; o log deixa isso visível no painel da Vercel.
    console.error(JSON.stringify({ scope:'erp.automacoes', code:'CRON_SECRET_AUSENTE' }))
    return erpFailure('CRON_SECRET não configurado.',503)
  }
  if (request.headers.get('authorization') !== 'Bearer '+secret) {
    console.error(JSON.stringify({ scope:'erp.automacoes', code:'CRON_NAO_AUTORIZADO' }))
    return erpFailure('Acesso negado.',401)
  }
  const result=await runScheduledErpAutomations()
  return NextResponse.json(result,{status:result.failures ? 503 : 200})
}
export const GET=withErpHttp(handleGET,{operation:'GET /api/erp/internal/automacoes',authentication:'cron'})
