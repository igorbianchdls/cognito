import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpSession } from '@/products/erp/server/erpAccess'

export const runtime = 'nodejs'

export async function GET() {
  const session = await resolveErpSession()
  if (!session) return erpFailure('Nao autenticado.', 401)
  return NextResponse.json({ profile: session.erpProfile, capabilities: session.capabilities })
}
