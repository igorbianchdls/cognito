import { createHash, randomBytes } from 'node:crypto'
import { Pool } from 'pg'
import { z } from 'zod'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import type { Database, TablesSession } from './database'
import { nameSchema, TablesError } from '../shared/contracts'

// API keys: "ctk_" + 32 random characters. Only the SHA-256 is kept; the key is shown once.
export const keyInputSchema = z.object({ nome: nameSchema, escopo: z.enum(['leitura', 'escrita']).default('leitura') }).strict()
export const REQUESTS_PER_MINUTE = 600
const digest = (key: string) => createHash('sha256').update(key).digest('hex')

export async function listKeys(db: Database, session: TablesSession) {
  const rows = (await db.query("SELECT k.id,k.nome,k.prefixo,k.escopo,k.criado_em,k.ultimo_uso_em,k.revogada_em,k.criado_por::text=$2 propria,coalesce(m.nome,'Pessoa removida') criada_por FROM tables.chaves_api k LEFT JOIN tables.membros() m ON m.id=k.criado_por::text WHERE k.empresa_id=$1 ORDER BY k.revogada_em IS NOT NULL,k.criado_em DESC", [session.tenantId, String(session.sharedUserId)])).rows
  return { chaves: rows }
}
export async function createKey(db: Database, session: TablesSession, raw: unknown) {
  const input = keyInputSchema.parse(raw)
  if (session.role === 'viewer') throw new TablesError('FORBIDDEN', 'Seu acesso permite apenas consultas.', 403)
  const key = 'ctk_' + randomBytes(24).toString('base64url')
  const row = (await db.query('INSERT INTO tables.chaves_api(empresa_id,nome,prefixo,hash,escopo,criado_por) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,nome,prefixo,escopo,criado_em', [session.tenantId, input.nome, key.slice(0, 10), digest(key), input.escopo, session.sharedUserId])).rows[0]
  return { chave: row, segredo: key }
}
export async function revokeKey(db: Database, session: TablesSession, id: string) {
  const row = (await db.query('UPDATE tables.chaves_api SET revogada_em=now() WHERE empresa_id=$1 AND id=$2 AND revogada_em IS NULL RETURNING id', [session.tenantId, id])).rows[0]
  if (!row) throw new TablesError('NOT_FOUND', 'Chave não encontrada.', 404)
  return { ok: true }
}

let pool: InstanceType<typeof Pool> | undefined
type Client = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; release?: () => void }
export type KeyDependencies = { connect: () => Promise<Client> }
const defaults = (): KeyDependencies => {
  if (!process.env.SUPABASE_DB_URL) throw new TablesError('UNAVAILABLE', 'O banco não está configurado.', 503)
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  return { connect: () => pool!.connect() }
}

/** The person and company behind a key, if it is valid and that person still has access; counts the request. */
export async function authenticateKey(request: Request, deps: KeyDependencies = defaults()) {
  const header = request.headers.get('authorization') ?? '', key = header.match(/^Bearer (ctk_[A-Za-z0-9_-]{32})$/)?.[1]
  if (!key) throw new TablesError('UNAUTHENTICATED', 'Envie a chave de API no cabeçalho Authorization: Bearer ctk_…', 401)
  const client = await deps.connect()
  try {
    const row = (await client.query(`SELECT k.id,k.empresa_id,k.escopo,k.criado_por,m.role,u.email,u.full_name,u.clerk_user_id,to_jsonb(e)->>'name' empresa,k.ultimo_uso_em < now()-interval '1 minute' OR k.ultimo_uso_em IS NULL atualizar
      FROM tables.chaves_api k JOIN shared.usuarios_empresas m ON m.empresa_id=k.empresa_id AND m.usuario_id=k.criado_por JOIN shared.usuarios u ON u.id=k.criado_por JOIN shared.empresas e ON e.id=k.empresa_id
      WHERE k.hash=$1 AND k.revogada_em IS NULL AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'`, [digest(key)])).rows[0]
    // Same answer for unknown, revoked or orphan keys.
    if (!row) throw new TablesError('UNAUTHENTICATED', 'Chave de API inválida ou revogada.', 401)
    const used = (await client.query("INSERT INTO tables.uso_api(chave_id,minuto) VALUES($1,date_trunc('minute',now())) ON CONFLICT(chave_id,minuto) DO UPDATE SET contagem=tables.uso_api.contagem+1 RETURNING contagem", [row.id])).rows[0]
    if (Number(used.contagem) > REQUESTS_PER_MINUTE) throw new TablesError('RATE_LIMITED', `Limite de ${REQUESTS_PER_MINUTE} requisições por minuto atingido. Aguarde.`, 429)
    if (row.atualizar) await client.query("UPDATE tables.chaves_api SET ultimo_uso_em=now() WHERE id=$1", [row.id]).catch(() => undefined)
    const session: AuthTenantContext = { authMode: 'clerk', clerkUserId: String(row.clerk_user_id ?? ''), sharedUserId: Number(row.criado_por), email: String(row.email ?? ''), fullName: row.full_name ? String(row.full_name) : null, tenantId: Number(row.empresa_id), tenantName: String(row.empresa ?? ''), role: row.role as AuthTenantContext['role'] }
    // Viewers cannot create keys; if a creator becomes read-only, the key reads only.
    return { session, escopo: (session.role === 'viewer' ? 'leitura' : row.escopo) as 'leitura' | 'escrita' }
  } finally { client.release?.() }
}
