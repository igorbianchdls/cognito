import { runQuery } from '@/lib/postgres'

export type RuntimeSessionStatus = 'off' | 'starting' | 'resuming' | 'running' | 'stopping' | 'error'

export type RuntimeSessionRow = {
  chat_id: string
  status: RuntimeSessionStatus
  provider: string | null
  model: string | null
  sandbox_id: string | null
  startup_mode: string | null
  last_error: string | null
  has_local_session: boolean
  lease_expires_at: string | null
  last_heartbeat_at: string | null
  created_at: string
  updated_at: string
}

type UpsertParams = {
  chatId: string
  status: RuntimeSessionStatus
  provider?: string | null
  model?: string | null
  sandboxId?: string | null
  startupMode?: string | null
  lastError?: string | null
  hasLocalSession?: boolean
  leaseSeconds?: number
}

export type RuntimeStartLockRow = {
  chat_id: string
  owner: string
  token: string
  expires_at: string
}

let ensurePromise: Promise<void> | null = null

export async function ensureRuntimeSessionsTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await runQuery(`CREATE SCHEMA IF NOT EXISTS chat`)
      await runQuery(`
        CREATE TABLE IF NOT EXISTS chat.runtime_sessions (
          chat_id text PRIMARY KEY,
          status text NOT NULL DEFAULT 'off',
          provider text NULL,
          model text NULL,
          sandbox_id text NULL,
          startup_mode text NULL,
          last_error text NULL,
          has_local_session boolean NOT NULL DEFAULT false,
          lease_expires_at timestamptz NULL,
          last_heartbeat_at timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await runQuery(`
        ALTER TABLE chat.runtime_sessions
        ADD COLUMN IF NOT EXISTS sandbox_id text NULL
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_runtime_sessions_status
          ON chat.runtime_sessions(status)
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_runtime_sessions_lease
          ON chat.runtime_sessions(lease_expires_at)
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_runtime_sessions_updated
          ON chat.runtime_sessions(updated_at DESC)
      `)
      await runQuery(`
        CREATE TABLE IF NOT EXISTS chat.runtime_start_locks (
          chat_id text PRIMARY KEY,
          owner text NOT NULL,
          token text NOT NULL,
          expires_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_runtime_start_locks_expires
          ON chat.runtime_start_locks(expires_at)
      `)
    })().catch((err) => {
      ensurePromise = null
      throw err
    })
  }
  await ensurePromise
}

export async function upsertRuntimeSession(params: UpsertParams): Promise<void> {
  await ensureRuntimeSessionsTable()
  const leaseSeconds = Number.isFinite(Number(params.leaseSeconds)) ? Math.max(30, Math.floor(Number(params.leaseSeconds))) : 300
  await runQuery(
    `
      INSERT INTO chat.runtime_sessions (
        chat_id,
        status,
        provider,
        model,
        sandbox_id,
        startup_mode,
        last_error,
        has_local_session,
        lease_expires_at,
        last_heartbeat_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, COALESCE($8, false),
        now() + make_interval(secs => $9::int),
        now(),
        now()
      )
      ON CONFLICT (chat_id) DO UPDATE SET
        status = EXCLUDED.status,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        sandbox_id = EXCLUDED.sandbox_id,
        startup_mode = EXCLUDED.startup_mode,
        last_error = EXCLUDED.last_error,
        has_local_session = EXCLUDED.has_local_session,
        lease_expires_at = EXCLUDED.lease_expires_at,
        last_heartbeat_at = now(),
        updated_at = now()
    `,
    [
      params.chatId,
      params.status,
      params.provider ?? null,
      params.model ?? null,
      params.sandboxId ?? null,
      params.startupMode ?? null,
      params.lastError ?? null,
      params.hasLocalSession ?? false,
      leaseSeconds,
    ]
  )
}

export async function touchRuntimeSession(
  chatId: string,
  opts?: {
    leaseSeconds?: number
    hasLocalSession?: boolean
    provider?: string | null
    model?: string | null
    sandboxId?: string | null
    status?: RuntimeSessionStatus
  }
): Promise<void> {
  await ensureRuntimeSessionsTable()
  const leaseSeconds = Number.isFinite(Number(opts?.leaseSeconds)) ? Math.max(30, Math.floor(Number(opts?.leaseSeconds))) : 300
  await runQuery(
    `
      INSERT INTO chat.runtime_sessions (
        chat_id, status, provider, model, sandbox_id, has_local_session, lease_expires_at, last_heartbeat_at, updated_at
      ) VALUES (
        $1,
        COALESCE($7, 'running'),
        $4,
        $5,
        $6,
        COALESCE($3, false),
        now() + make_interval(secs => $2::int),
        now(),
        now()
      )
      ON CONFLICT (chat_id) DO UPDATE SET
        last_heartbeat_at = now(),
        lease_expires_at = now() + make_interval(secs => $2::int),
        has_local_session = COALESCE($3, chat.runtime_sessions.has_local_session),
        provider = COALESCE($4, chat.runtime_sessions.provider),
        model = COALESCE($5, chat.runtime_sessions.model),
        sandbox_id = COALESCE($6, chat.runtime_sessions.sandbox_id),
        status = COALESCE($7, chat.runtime_sessions.status),
        updated_at = now()
    `,
    [
      chatId,
      leaseSeconds,
      typeof opts?.hasLocalSession === 'boolean' ? opts.hasLocalSession : null,
      opts?.provider ?? null,
      opts?.model ?? null,
      opts?.sandboxId ?? null,
      opts?.status ?? null,
    ]
  )
}

export async function clearRuntimeSession(chatId: string, lastError?: string | null): Promise<void> {
  await ensureRuntimeSessionsTable()
  await runQuery(
    `
      INSERT INTO chat.runtime_sessions (
        chat_id, status, has_local_session, last_error, sandbox_id, lease_expires_at, updated_at
      ) VALUES (
        $1, 'off', false, $2, null, null, now()
      )
      ON CONFLICT (chat_id) DO UPDATE SET
        status = 'off',
        has_local_session = false,
        last_error = EXCLUDED.last_error,
        sandbox_id = null,
        lease_expires_at = null,
        updated_at = now()
    `,
    [chatId, lastError ?? null]
  )
}

export async function getRuntimeSession(chatId: string): Promise<RuntimeSessionRow | null> {
  await ensureRuntimeSessionsTable()
  const rows = await runQuery<RuntimeSessionRow>(
    `
      SELECT chat_id, status, provider, model, startup_mode, last_error, has_local_session,
             sandbox_id,
             lease_expires_at, last_heartbeat_at, created_at, updated_at
        FROM chat.runtime_sessions
       WHERE chat_id = $1
       LIMIT 1
    `,
    [chatId]
  )
  return rows[0] || null
}

function randomToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function acquireRuntimeStartLock(params: {
  chatId: string
  owner: string
  ttlSeconds?: number
}): Promise<{ acquired: boolean; lock?: RuntimeStartLockRow }> {
  await ensureRuntimeSessionsTable()
  const ttlSeconds = Number.isFinite(Number(params.ttlSeconds))
    ? Math.max(15, Math.floor(Number(params.ttlSeconds)))
    : 120
  const token = randomToken()
  const rows = await runQuery<RuntimeStartLockRow>(
    `
      INSERT INTO chat.runtime_start_locks (
        chat_id, owner, token, expires_at, updated_at
      ) VALUES (
        $1, $2, $3, now() + make_interval(secs => $4::int), now()
      )
      ON CONFLICT (chat_id) DO UPDATE SET
        owner = EXCLUDED.owner,
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        updated_at = now()
      WHERE
        chat.runtime_start_locks.expires_at <= now()
        OR chat.runtime_start_locks.owner = EXCLUDED.owner
      RETURNING chat_id, owner, token, expires_at
    `,
    [params.chatId, params.owner, token, ttlSeconds]
  )
  const lock = rows[0] || null
  if (!lock) return { acquired: false }
  if (lock.token !== token || lock.owner !== params.owner) return { acquired: false }
  return { acquired: true, lock }
}

export async function releaseRuntimeStartLock(params: {
  chatId: string
  owner: string
  token: string
}): Promise<void> {
  await ensureRuntimeSessionsTable()
  await runQuery(
    `
      DELETE FROM chat.runtime_start_locks
       WHERE chat_id = $1
         AND owner = $2
         AND token = $3
    `,
    [params.chatId, params.owner, params.token]
  )
}
