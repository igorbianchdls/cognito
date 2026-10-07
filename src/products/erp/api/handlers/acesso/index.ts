import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'
import { normalizeTimeZone } from '@/products/erp/shared/businessDate'

import { resolveErpApiSession as resolveErpSession } from '@/products/erp/api/http/access'

 async function handleGET() {
  const session = await resolveErpSession()
  if (!session) return erpFailure('Não autenticado.', 401)
  return NextResponse.json({ profile: session.erpProfile, capabilities: session.capabilities, fuso_horario: normalizeTimeZone(session.timeZone) })
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/acesso","authentication":"session","maxBodyBytes":1048576})
