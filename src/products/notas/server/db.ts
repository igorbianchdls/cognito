// Notas no servidor: conexão ao banco rodando como a pessoa (role authenticated, com o usuário e a empresa ativa do
// Clerk), para as políticas do schema notas decidirem o que ela vê e altera; e o bucket privado de arquivos.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

export type Contexto = { userId: string; orgId: string }
export class NotasError extends Error {
  constructor(public status: number, message: string, public dados?: unknown) { super(message) }
}

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 4, connectionTimeoutMillis: 5000 })
  return pool
}
/** Fecha as conexões (testes). */
export async function encerrarConexoes() { await pool?.end(); pool = undefined }
export type Client = Awaited<ReturnType<InstanceType<typeof Pool>['connect']>>

/** Uma transação como a pessoa: tudo o que ela não pode ver ou alterar simplesmente não aparece ou não muda. */
export async function comoPessoa<T>(ctx: Contexto, run: (client: Client) => Promise<T>) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: ctx.userId, role: 'authenticated', o: { id: ctx.orgId } })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
    const result = await run(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

// ---------------------------------------------------------------- arquivos (bucket privado "notas")

export const NOTAS_BUCKET = 'notas'
function storage() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes')
  return { base, headers: { apikey: key, authorization: `Bearer ${key}` } }
}

export async function gravarArquivo(path: string, conteudo: ArrayBuffer, tipo: string) {
  const { base, headers } = storage()
  const response = await fetch(`${base}/storage/v1/object/${NOTAS_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', headers: { ...headers, 'content-type': tipo || 'application/octet-stream', 'x-upsert': 'false' }, body: conteudo, cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Storage respondeu ${response.status} ao gravar`)
}

export async function urlAssinada(path: string, segundos = 3600) {
  const { base, headers } = storage()
  const response = await fetch(`${base}/storage/v1/object/sign/${NOTAS_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ expiresIn: segundos }), cache: 'no-store',
  })
  if (!response.ok) return null
  const body = await response.json() as { signedURL?: string }
  return body.signedURL ? `${base}/storage/v1${body.signedURL}` : null
}

/** A pessoa está ativa na empresa (vínculo do ERP), além de ter a empresa ativa no Clerk. */
export function podeLer(ctx: Contexto) {
  return comoPessoa(ctx, async client => Boolean((await client.query('SELECT editor.can_read($1) AS ok', [ctx.orgId])).rows[0]?.ok))
}
