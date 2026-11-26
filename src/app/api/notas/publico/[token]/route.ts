import { lerPaginaPublica } from '@/products/notas/server/publico'
import { responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — página publicada na web (sem login; só leitura). */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return responder('NOTAS_PUBLIC_FAILED', () => lerPaginaPublica(token))
}
