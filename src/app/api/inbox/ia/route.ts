import { aiConfigured } from '@/products/inbox/server/ai'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: whether the AI is on in the server (ANTHROPIC_API_KEY). */
export function GET() {
  return handle('ia-config', async () => json(200, { ligada: aiConfigured() }))
}
