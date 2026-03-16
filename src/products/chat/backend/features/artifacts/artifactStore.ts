import { runQuery } from '@/lib/postgres'

export type ArtifactType = 'dashboard' | 'report' | 'slide'
export type ArtifactStatus = 'draft' | 'published' | 'archived'

export type ChatArtifactRow = {
  id: string
  type: ArtifactType
  title: string
  chat_id: string
  snapshot_id: string | null
  file_path: string
  thumbnail_data_url: string | null
  status: ArtifactStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  last_opened_at: string | null
}

type UpsertArtifactInput = {
  type: ArtifactType
  title: string
  chatId: string
  snapshotId?: string | null
  filePath: string
  thumbnailDataUrl?: string | null
  status?: ArtifactStatus
  metadata?: Record<string, unknown>
}

type ListArtifactsParams = {
  type?: ArtifactType | null
  limit?: number
}

let ensurePromise: Promise<void> | null = null

export async function ensureArtifactsTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await runQuery(`CREATE SCHEMA IF NOT EXISTS chat`)
      await runQuery(`
        CREATE TABLE IF NOT EXISTS chat.artifacts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          type text NOT NULL CHECK (type IN ('dashboard', 'report', 'slide')),
          title text NOT NULL,
          chat_id text NOT NULL REFERENCES chat.chats(id) ON DELETE CASCADE,
          snapshot_id text NULL,
          file_path text NOT NULL,
          thumbnail_data_url text NULL,
          status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          last_opened_at timestamptz NULL
        )
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_chat_artifacts_type
          ON chat.artifacts(type)
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_chat_artifacts_chat_id
          ON chat.artifacts(chat_id)
      `)
      await runQuery(`
        CREATE INDEX IF NOT EXISTS idx_chat_artifacts_updated_at
          ON chat.artifacts(updated_at DESC)
      `)
      await runQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_artifacts_chat_path
          ON chat.artifacts(chat_id, file_path)
      `)
    })().catch((err) => {
      ensurePromise = null
      throw err
    })
  }
  await ensurePromise
}

export async function upsertArtifact(input: UpsertArtifactInput): Promise<void> {
  await ensureArtifactsTable()
  await runQuery(
    `
      INSERT INTO chat.artifacts (
        type,
        title,
        chat_id,
        snapshot_id,
        file_path,
        thumbnail_data_url,
        status,
        metadata,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, now()
      )
      ON CONFLICT (chat_id, file_path) DO UPDATE SET
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        snapshot_id = EXCLUDED.snapshot_id,
        thumbnail_data_url = COALESCE(EXCLUDED.thumbnail_data_url, chat.artifacts.thumbnail_data_url),
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    `,
    [
      input.type,
      input.title,
      input.chatId,
      input.snapshotId ?? null,
      input.filePath,
      input.thumbnailDataUrl ?? null,
      input.status ?? 'draft',
      JSON.stringify(input.metadata ?? {}),
    ],
  )
}

export async function listArtifacts(params?: ListArtifactsParams): Promise<ChatArtifactRow[]> {
  await ensureArtifactsTable()
  const limit = Math.max(1, Math.min(200, Number(params?.limit || 50)))
  const hasType = Boolean(params?.type)
  const rows = await runQuery<ChatArtifactRow>(
    `
      SELECT
        id,
        type,
        title,
        chat_id,
        snapshot_id,
        file_path,
        thumbnail_data_url,
        status,
        metadata,
        created_at,
        updated_at,
        last_opened_at
      FROM chat.artifacts
      ${hasType ? 'WHERE type = $1' : ''}
      ORDER BY updated_at DESC, created_at DESC
      LIMIT $${hasType ? 2 : 1}
    `,
    hasType ? [params?.type, limit] : [limit],
  )
  return rows
}
