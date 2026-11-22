// Shared bits of the Inbox routes: who is asking, and errors as JSON in Portuguese.
import { auth } from '@clerk/nextjs/server'
import { InboxError, type Person } from './db'

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const json = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function person(): Promise<Person | null> {
  const { userId, orgId } = await auth()
  return userId && orgId ? { userId, orgId } : null
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text()
  if (raw.length > 64 * 1024) throw new InboxError('TOO_LARGE', 'Pedido grande demais.', 413)
  try { const value = JSON.parse(raw || '{}'); return value && typeof value === 'object' ? value : {} } catch { throw new InboxError('INVALID', 'Pedido inválido.') }
}

/** Runs a route body; InboxError becomes its status and message, anything else a 500 logged without details to the user. */
export async function handle(scope: string, fn: (who: Person) => Promise<Response>) {
  const who = await person()
  if (!who) return json(401, { erro: 'Entre e escolha uma empresa.' })
  try {
    return await fn(who)
  } catch (error) {
    if (error instanceof InboxError) return json(error.status, { erro: error.message, codigo: error.code })
    console.error(JSON.stringify({ scope: 'inbox', route: scope, message: (error as Error).message }))
    return json(500, { erro: 'Algo deu errado. Tente de novo.' })
  }
}
