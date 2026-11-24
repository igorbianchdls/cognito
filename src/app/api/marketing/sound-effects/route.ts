import { auth } from '@clerk/nextjs/server'
import { listSoundEffects } from '@/products/marketing/server/soundEffects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })

/** GET: the Sound effects library, with signed URLs (one hour) to play and download. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para ver os efeitos.' })
  try {
    return json(200, { efeitos: await listSoundEffects(userId) })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'marketing', code: 'SOUND_EFFECTS_FAILED', message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível carregar os efeitos.' })
  }
}
