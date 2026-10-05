import { timingSafeEqual } from 'node:crypto'
import { retryClerkOperations } from '@/products/auth/server/clerkOutbox'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request: Request) {
  const secret=process.env.CRON_SECRET
  const received=Buffer.from(request.headers.get('authorization') || '')
  const expected=Buffer.from(`Bearer ${secret || ''}`)
  if (!secret || received.length!==expected.length || !timingSafeEqual(received,expected))
    return Response.json({ error:'Acesso negado.' },{ status:401 })
  try { return Response.json(await retryClerkOperations()) }
  catch (error) {
    // Only a bounded error code goes to operational logs; never credentials or payloads.
    const code=String((error as { code?: string }).code || 'CLERK_RECONCILE_FAILED')
    console.error('Clerk reconciliation failed', /^[A-Z0-9_]{1,64}$/.test(code) ? code : 'CLERK_RECONCILE_FAILED')
    return Response.json({ error:'Sincronizacao temporariamente indisponivel.' },{ status:503 })
  }
}
export const GET=POST
