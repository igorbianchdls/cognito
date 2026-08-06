import { NextResponse } from 'next/server'

import { resolveErpSession } from '@/products/erp/server/erpAccess'

export const runtime = 'nodejs'

export async function GET() {
  const session = await resolveErpSession()
  if (!session) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  return NextResponse.json({ profile: session.erpProfile, capabilities: session.capabilities })
}
