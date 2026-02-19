import { NextRequest } from 'next/server'
import { GET as getDocumentos } from '@/products/erp/backend/features/modulos/controllers/documentos/controller'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (!url.searchParams.get('view')) {
    url.searchParams.set('view', 'documentos')
  }

  const proxied = new NextRequest(url.toString(), {
    method: 'GET',
    headers: req.headers,
  })

  return getDocumentos(proxied)
}
