import { createClient } from '@supabase/supabase-js'
import { runQuery, withTransaction } from '@/lib/postgres'

const DEFAULT_FOLDER_NAMES = [
  'Brand Assets',
  'Design System',
  'Contracts',
  'Sprint Docs',
  'Marketing',
  'Operations',
]

export type DriveWorkspace = {
  id: string
  name: string
}

export type DriveFolderRecord = {
  id: string
  name: string
  files_count: number
  total_bytes: string | number | null
}

export type DriveFileRecord = {
  id: string
  folder_id: string | null
  name: string
  mime: string
  size_bytes: string | number | null
  created_at: string
  created_by: string | number | null
  storage_path: string
  bucket_id: string | null
}

export function parseUuid(value: string | null | undefined): string | null {
  const v = (value || '').trim()
  if (!v) return null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) {
    return null
  }
  return v
}

export function formatBytes(bytesRaw: number | string | null | undefined): string {
  const n = Number(bytesRaw || 0)
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(1)} GB`
}

export function buildUserLabel(createdBy: string | number | null | undefined): string {
  if (createdBy === null || createdBy === undefined || String(createdBy).trim() === '') return 'user'
  return `user-${String(createdBy)}`
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function ensureSeedWorkspace(): Promise<DriveWorkspace | null> {
  const existing = await runQuery<DriveWorkspace>(
    `SELECT w.id::text AS id, w.name
       FROM drive.workspaces w
      WHERE w.archived_at IS NULL
      ORDER BY w.created_at ASC
      LIMIT 1`
  )
  if (existing[0]) return existing[0]

  const users = await runQuery<{ id: number | string }>(
    `SELECT id
       FROM shared.users
      ORDER BY id ASC
      LIMIT 1`
  )
  const ownerId = Number(users[0]?.id)
  if (!Number.isFinite(ownerId) || ownerId <= 0) return null

  const created = await withTransaction(async (client) => {
    const ws = await client.query(
      `INSERT INTO drive.workspaces (name, owner_id)
       VALUES ($1, $2)
       RETURNING id::text AS id, name, owner_id`,
      ['Documents', ownerId]
    )
    const row = ws.rows?.[0] as { id: string; name: string; owner_id: number } | undefined
    if (!row?.id) throw new Error('Falha ao criar workspace padrão')

    const values: string[] = []
    const params: unknown[] = []
    let i = 1
    for (const folderName of DEFAULT_FOLDER_NAMES) {
      values.push(`($${i++}, $${i++}, $${i++})`)
      params.push(row.id, folderName, row.owner_id)
    }
    if (values.length) {
      await client.query(
        `INSERT INTO drive.folders (workspace_id, name, created_by)
         VALUES ${values.join(', ')}`,
        params
      )
    }
    return { id: row.id, name: row.name }
  })

  return created
}

export async function listWorkspaces(): Promise<DriveWorkspace[]> {
  const rows = await runQuery<DriveWorkspace>(
    `SELECT w.id::text AS id, w.name
       FROM drive.workspaces w
      WHERE w.archived_at IS NULL
      ORDER BY w.created_at ASC
      LIMIT 100`
  )
  return rows
}

export async function getWorkspaceOwnerId(workspaceId: string): Promise<number | null> {
  const rows = await runQuery<{ owner_id: string | number }>(
    `SELECT owner_id
       FROM drive.workspaces
      WHERE id = $1::uuid
        AND archived_at IS NULL
      LIMIT 1`,
    [workspaceId]
  )
  const ownerId = Number(rows[0]?.owner_id)
  if (!Number.isFinite(ownerId) || ownerId <= 0) return null
  return ownerId
}

export async function listRootFolders(workspaceId: string): Promise<DriveFolderRecord[]> {
  const rows = await runQuery<DriveFolderRecord>(
    `SELECT
       f.id::text AS id,
       f.name,
       COUNT(df.id)::int AS files_count,
       COALESCE(SUM(df.size_bytes), 0)::bigint AS total_bytes
     FROM drive.folders f
     LEFT JOIN drive.files df
       ON df.folder_id = f.id
      AND df.deleted_at IS NULL
     WHERE f.workspace_id = $1::uuid
       AND f.deleted_at IS NULL
       AND f.parent_id IS NULL
     GROUP BY f.id, f.name, f.created_at
     ORDER BY f.created_at ASC`,
    [workspaceId]
  )
  return rows
}

export async function getFolder(folderId: string) {
  const rows = await runQuery<{ id: string; name: string; workspace_id: string }>(
    `SELECT f.id::text AS id, f.name, f.workspace_id::text AS workspace_id
       FROM drive.folders f
      WHERE f.id = $1::uuid
        AND f.deleted_at IS NULL
      LIMIT 1`,
    [folderId]
  )
  return rows[0] || null
}

export async function listFilesByWorkspace(workspaceId: string, limit = 200): Promise<DriveFileRecord[]> {
  const rows = await runQuery<DriveFileRecord>(
    `SELECT
       fl.id::text AS id,
       fl.folder_id::text AS folder_id,
       fl.name,
       fl.mime,
       fl.size_bytes,
       fl.created_at,
       fl.created_by::text AS created_by,
       fl.storage_path,
       fl.bucket_id
     FROM drive.files fl
     WHERE fl.workspace_id = $1::uuid
       AND fl.deleted_at IS NULL
     ORDER BY fl.created_at DESC
     LIMIT $2::int`,
    [workspaceId, limit]
  )
  return rows
}

export async function listFilesByFolder(folderId: string, limit = 500): Promise<DriveFileRecord[]> {
  const rows = await runQuery<DriveFileRecord>(
    `SELECT
       fl.id::text AS id,
       fl.folder_id::text AS folder_id,
       fl.name,
       fl.mime,
       fl.size_bytes,
       fl.created_at,
       fl.created_by::text AS created_by,
       fl.storage_path,
       fl.bucket_id
     FROM drive.files fl
     WHERE fl.folder_id = $1::uuid
       AND fl.deleted_at IS NULL
     ORDER BY fl.created_at DESC
     LIMIT $2::int`,
    [folderId, limit]
  )
  return rows
}
