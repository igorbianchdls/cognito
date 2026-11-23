import { appDb } from '@/products/inbox/server/db'
import { previewSegment } from '@/products/inbox/server/segments'
import { body, handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { regras } or { segmento_id }, optional limite/inicio: how many contacts match and the first ones. */
export function POST(request: Request) {
  return handle('segmentos/previa', async who => json(200, await previewSegment(who, await body(request), appDb)))
}
