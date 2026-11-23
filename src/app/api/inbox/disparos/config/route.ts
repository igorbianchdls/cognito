import { sesConfig } from '@/products/inbox/server/email'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: what the server can send (e-mail depends on Amazon SES keys). */
export function GET() {
  return handle('disparos-config', async () => json(200, { email: !!sesConfig() }))
}
