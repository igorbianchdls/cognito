import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

import { runQuery, withTransaction } from '@/lib/postgres'

import type { WorkspaceRequestAction } from '@/app/api/agent-tools/_workspace/handler'

const DEFAULT_FOLDER_NAMES = [
  'Brand Assets',
  'Design System',
  'Contracts',
  'Sprint Docs',
  'Marketing',
  'Operations',
]

type ToolErrorResult = {
  success: false
  error: string
  code: string
} & Record<string, unknown>

type DriveWorkspace = {
  id: string
  name: string
}

type DriveFolderRecord = {
  id: string
  name: string
  files_count: number
  total_bytes: string | number | null
}

type DriveFileRecord = {
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

type DriveRequestResult = {
  ok: boolean
  status: number
  result: unknown
}

function toolError(code: string, error: string, extra?: Record<string, unknown>): ToolErrorResult {
  return { success: false, error, code, ...(extra || {}) }
}

export function parseUuid(value: string | null | undefined): string | null {
  const v = (value || '').trim()
  if (!v) return null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) return null
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

export function sanitizeDriveFileName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 120) || 'file'
}

export function buildUserLabel(createdBy: string | number | null | undefined): string {
  if (createdBy == null || String(createdBy).trim() === '') return 'user'
  return `user-${String(createdBy)}`
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

function looksLikeStorageNotFound(errorTextRaw: unknown): boolean {
  const errorText = String(errorTextRaw || '').toLowerCase()
  if (!errorText) return false
  return (
    errorText.includes('object not found')
    || errorText.includes('not found')
    || errorText.includes('no such')
    || errorText.includes('does not exist')
    || errorText.includes('404')
  )
}

async function softDeleteDriveFile(fileId: string) {
  try {
    await runQuery(
      `UPDATE drive.files
          SET deleted_at = now(),
              updated_at = now()
        WHERE id = $1::uuid
          AND deleted_at IS NULL`,
      [fileId],
    )
  } catch {
    // Best-effort cleanup.
  }
}

async function ensureSeedWorkspace(): Promise<DriveWorkspace | null> {
  const existing = await runQuery<DriveWorkspace>(
    `SELECT w.id::text AS id, w.name
       FROM drive.workspaces w
      WHERE w.archived_at IS NULL
      ORDER BY w.created_at ASC
      LIMIT 1`,
  )
  if (existing[0]) return existing[0]

  const users = await runQuery<{ id: number | string }>(
    `SELECT id
       FROM shared.users
      ORDER BY id ASC
      LIMIT 1`,
  )
  const ownerId = Number(users[0]?.id)
  if (!Number.isFinite(ownerId) || ownerId <= 0) return null

  return withTransaction(async (client) => {
    const ws = await client.query(
      `INSERT INTO drive.workspaces (name, owner_id)
       VALUES ($1, $2)
       RETURNING id::text AS id, name, owner_id`,
      ['Documents', ownerId],
    )
    const row = ws.rows?.[0] as { id: string; name: string; owner_id: number } | undefined
    if (!row?.id) throw new Error('Falha ao criar workspace padrao')

    const values: string[] = []
    const params: unknown[] = []
    let index = 1
    for (const folderName of DEFAULT_FOLDER_NAMES) {
      values.push(`($${index++}, $${index++}, $${index++})`)
      params.push(row.id, folderName, row.owner_id)
    }
    if (values.length) {
      await client.query(
        `INSERT INTO drive.folders (workspace_id, name, created_by)
         VALUES ${values.join(', ')}`,
        params,
      )
    }
    return { id: row.id, name: row.name }
  })
}

async function listWorkspaces(): Promise<DriveWorkspace[]> {
  return runQuery<DriveWorkspace>(
    `SELECT w.id::text AS id, w.name
       FROM drive.workspaces w
      WHERE w.archived_at IS NULL
      ORDER BY w.created_at ASC
      LIMIT 100`,
  )
}

async function getWorkspaceOwnerId(workspaceId: string): Promise<number | null> {
  const rows = await runQuery<{ owner_id: string | number }>(
    `SELECT owner_id
       FROM drive.workspaces
      WHERE id = $1::uuid
        AND archived_at IS NULL
      LIMIT 1`,
    [workspaceId],
  )
  const ownerId = Number(rows[0]?.owner_id)
  if (!Number.isFinite(ownerId) || ownerId <= 0) return null
  return ownerId
}

async function listRootFolders(workspaceId: string): Promise<DriveFolderRecord[]> {
  return runQuery<DriveFolderRecord>(
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
    [workspaceId],
  )
}

async function getFolder(folderId: string) {
  const rows = await runQuery<{ id: string; name: string; workspace_id: string }>(
    `SELECT f.id::text AS id, f.name, f.workspace_id::text AS workspace_id
       FROM drive.folders f
      WHERE f.id = $1::uuid
        AND f.deleted_at IS NULL
      LIMIT 1`,
    [folderId],
  )
  return rows[0] || null
}

async function listFilesByWorkspace(workspaceId: string, limit = 200): Promise<DriveFileRecord[]> {
  return runQuery<DriveFileRecord>(
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
    [workspaceId, limit],
  )
}

async function listFilesByFolder(folderId: string, limit = 500): Promise<DriveFileRecord[]> {
  return runQuery<DriveFileRecord>(
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
    [folderId, limit],
  )
}

async function createSignedUrl(bucket: string, storagePath: string, expiresInSeconds = 60 * 60) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { signedUrl: undefined, error: 'Supabase Storage nao configurado no servidor' }
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds)
    return { signedUrl: data?.signedUrl, error: error?.message }
  } catch (error) {
    return { signedUrl: undefined, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getDriveFileDownloadBuffer(fileId: string) {
  const rows = await runQuery<{
    id: string
    name: string
    mime: string | null
    storage_path: string
    bucket_id: string | null
  }>(
    `SELECT
       id::text AS id,
       name,
       mime,
       storage_path,
       bucket_id
     FROM drive.files
     WHERE id = $1::uuid
       AND deleted_at IS NULL
     LIMIT 1`,
    [fileId],
  )
  const file = rows[0]
  if (!file) {
    return { ok: false as const, status: 404, result: toolError('DRIVE_FILE_NOT_FOUND', 'Arquivo nao encontrado') }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false as const, status: 500, result: toolError('DRIVE_STORAGE_NOT_CONFIGURED', 'Supabase Storage nao configurado no servidor') }
  }

  const bucket = file.bucket_id || 'drive'
  const { data, error } = await supabase.storage.from(bucket).download(file.storage_path)
  if (error || !data) {
    const detail = error?.message || 'erro desconhecido'
    if (looksLikeStorageNotFound(detail)) {
      await softDeleteDriveFile(file.id)
      return { ok: false as const, status: 404, result: toolError('DRIVE_FILE_STORAGE_MISSING', 'Arquivo nao encontrado no storage. Metadado removido da lista do Drive.') }
    }
    return { ok: false as const, status: 500, result: toolError('DRIVE_DOWNLOAD_FAILED', `Falha no download: ${detail}`) }
  }

  return {
    ok: true as const,
    status: 200,
    file: {
      id: file.id,
      name: file.name,
      mime: file.mime || 'application/octet-stream',
      bucketId: bucket,
    },
    buffer: Buffer.from(await data.arrayBuffer()),
  }
}

async function decodeBase64(input: string): Promise<Buffer | null> {
  const raw = String(input || '').trim()
  if (!raw) return null
  const normalized = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw
  const compact = normalized.replace(/\s+/g, '')
  if (!compact) return null
  try {
    const buf = Buffer.from(compact, 'base64')
    if (!buf.length) return null
    return buf
  } catch {
    return null
  }
}

async function handleDriveRootGet(req: Request): Promise<DriveRequestResult> {
  await ensureSeedWorkspace()
  const workspaces = await listWorkspaces()
  if (!workspaces.length) {
    return { ok: true, status: 200, result: { success: true, workspaces: [], activeWorkspaceId: null, folders: [], recentFiles: [] } }
  }

  const url = new URL(req.url)
  const requestedWorkspaceId = parseUuid(url.searchParams.get('workspace_id'))
  const activeWorkspaceId = requestedWorkspaceId && workspaces.some((w) => w.id === requestedWorkspaceId)
    ? requestedWorkspaceId
    : workspaces[0].id

  const [folders, files] = await Promise.all([
    listRootFolders(activeWorkspaceId),
    listFilesByWorkspace(activeWorkspaceId, 200),
  ])

  const recentFilesRaw = await Promise.all(
    files.map(async (file) => {
      const bucket = file.bucket_id || 'drive'
      const signed = await createSignedUrl(bucket, file.storage_path)
      if (signed.error && looksLikeStorageNotFound(signed.error)) {
        await softDeleteDriveFile(file.id)
        return null
      }
      return {
        id: file.id,
        folderId: file.folder_id || undefined,
        name: file.name,
        mime: file.mime || 'application/octet-stream',
        size: formatBytes(file.size_bytes),
        sizeBytes: Number(file.size_bytes || 0),
        addedAt: file.created_at,
        addedBy: buildUserLabel(file.created_by),
        url: signed.signedUrl,
        storagePath: file.storage_path,
        bucketId: bucket,
      }
    }),
  )

  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      workspaces,
      activeWorkspaceId,
      folders: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        filesCount: Number(folder.files_count || 0),
        size: formatBytes(folder.total_bytes),
      })),
      recentFiles: recentFilesRaw.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    },
  }
}

async function handleDriveFoldersGet(req: Request): Promise<DriveRequestResult> {
  await ensureSeedWorkspace()
  const workspaces = await listWorkspaces()
  if (!workspaces.length) {
    return { ok: true, status: 200, result: { success: true, activeWorkspaceId: null, parentId: null, folders: [] } }
  }

  const url = new URL(req.url)
  const requestedWorkspaceId = parseUuid(url.searchParams.get('workspace_id'))
  const activeWorkspaceId = requestedWorkspaceId && workspaces.some((w) => w.id === requestedWorkspaceId)
    ? requestedWorkspaceId
    : workspaces[0].id
  const parentIdRaw = url.searchParams.get('parent_id')
  const parentId = parentIdRaw ? parseUuid(parentIdRaw) : null
  if (parentIdRaw && !parentId) {
    return { ok: false, status: 400, result: { success: false, message: 'parent_id invalido' } }
  }

  if (parentId) {
    const parentRows = await runQuery<{ id: string }>(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE id = $1::uuid
          AND workspace_id = $2::uuid
          AND deleted_at IS NULL
        LIMIT 1`,
      [parentId, activeWorkspaceId],
    )
    if (!parentRows[0]) {
      return { ok: false, status: 404, result: { success: false, message: 'parent_id nao encontrado neste workspace' } }
    }
  }

  const rows = await runQuery<{
    id: string
    workspace_id: string
    parent_id: string | null
    name: string
    files_count: number
    total_bytes: string | number
    created_at: string
  }>(
    `SELECT
       f.id::text AS id,
       f.workspace_id::text AS workspace_id,
       f.parent_id::text AS parent_id,
       f.name,
       COUNT(df.id)::int AS files_count,
       COALESCE(SUM(df.size_bytes), 0)::bigint AS total_bytes,
       f.created_at
     FROM drive.folders f
     LEFT JOIN drive.files df
       ON df.folder_id = f.id
      AND df.deleted_at IS NULL
     WHERE f.workspace_id = $1::uuid
       AND f.deleted_at IS NULL
       AND (($2::uuid IS NULL AND f.parent_id IS NULL) OR f.parent_id = $2::uuid)
     GROUP BY f.id, f.workspace_id, f.parent_id, f.name, f.created_at
     ORDER BY f.created_at ASC`,
    [activeWorkspaceId, parentId],
  )

  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      activeWorkspaceId,
      parentId: parentId || null,
      folders: rows.map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        parentId: row.parent_id,
        name: row.name,
        filesCount: Number(row.files_count || 0),
        totalBytes: Number(row.total_bytes || 0),
        createdAt: row.created_at,
      })),
    },
  }
}

async function handleDriveFoldersPost(payload: WorkspaceRequestAction): Promise<DriveRequestResult> {
  const body = (payload.data || {}) as { workspace_id?: string; name?: string; parent_id?: string | null }
  const workspaceId = parseUuid(body.workspace_id || '')
  const parentId = body.parent_id ? parseUuid(body.parent_id) : null
  const name = String(body.name || '').trim()

  if (!workspaceId) return { ok: false, status: 400, result: { success: false, message: 'workspace_id invalido' } }
  if (!name) return { ok: false, status: 400, result: { success: false, message: 'name e obrigatorio' } }
  if (name.length > 120) return { ok: false, status: 400, result: { success: false, message: 'name deve ter no maximo 120 caracteres' } }
  if (body.parent_id && !parentId) return { ok: false, status: 400, result: { success: false, message: 'parent_id invalido' } }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ok: false, status: 404, result: { success: false, message: 'Workspace nao encontrado' } }

  if (parentId) {
    const parentRows = await runQuery<{ id: string }>(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE id = $1::uuid
          AND workspace_id = $2::uuid
          AND deleted_at IS NULL
        LIMIT 1`,
      [parentId, workspaceId],
    )
    if (!parentRows[0]) return { ok: false, status: 404, result: { success: false, message: 'parent_id nao encontrado neste workspace' } }
  }

  try {
    const rows = await runQuery<{
      id: string
      workspace_id: string
      parent_id: string | null
      name: string
      created_at: string
    }>(
      `INSERT INTO drive.folders (workspace_id, parent_id, name, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4)
       RETURNING id::text AS id, workspace_id::text AS workspace_id, parent_id::text AS parent_id, name, created_at`,
      [workspaceId, parentId, name, ownerId],
    )
    return { ok: true, status: 200, result: { success: true, folder: rows[0] } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('duplicate')) {
      return { ok: false, status: 409, result: { success: false, message: 'Ja existe uma pasta com este nome neste local' } }
    }
    return { ok: false, status: 500, result: { success: false, message } }
  }
}

async function handleDriveFolderGet(folderId: string): Promise<DriveRequestResult> {
  const folder = await getFolder(folderId)
  if (!folder) return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada' } }

  const files = await listFilesByFolder(folderId, 800)
  const outFiles = await Promise.all(
    files.map(async (file) => {
      const bucket = file.bucket_id || 'drive'
      const signed = await createSignedUrl(bucket, file.storage_path)
      return {
        id: file.id,
        folderId: file.folder_id || undefined,
        name: file.name,
        mime: file.mime || 'application/octet-stream',
        size: formatBytes(file.size_bytes),
        sizeBytes: Number(file.size_bytes || 0),
        addedAt: file.created_at,
        addedBy: buildUserLabel(file.created_by),
        url: signed.signedUrl,
        storagePath: file.storage_path,
        bucketId: bucket,
      }
    }),
  )

  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      folder: { id: folder.id, name: folder.name, workspaceId: folder.workspace_id },
      files: outFiles,
    },
  }
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size))
  return out
}

async function handleDriveFolderDelete(req: Request, folderId: string): Promise<DriveRequestResult> {
  const url = new URL(req.url)
  const workspaceId = parseUuid(url.searchParams.get('workspace_id'))
  const folder = await getFolder(folderId)
  if (!folder) return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada' } }
  if (workspaceId && workspaceId !== folder.workspace_id) {
    return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada neste workspace' } }
  }

  const folderTree = await runQuery<{ id: string }>(
    `WITH RECURSIVE tree AS (
       SELECT id
         FROM drive.folders
        WHERE id = $1::uuid
          AND deleted_at IS NULL
       UNION ALL
       SELECT f.id
         FROM drive.folders f
         JOIN tree t ON f.parent_id = t.id
        WHERE f.deleted_at IS NULL
     )
     SELECT id::text AS id FROM tree`,
    [folderId],
  )
  const folderIds = folderTree.map((row) => row.id)
  if (!folderIds.length) return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada' } }

  const filesToDelete = await runQuery<{ storage_path: string; bucket_id: string | null }>(
    `SELECT storage_path, bucket_id
       FROM drive.files
      WHERE deleted_at IS NULL
        AND folder_id = ANY($1::uuid[])`,
    [folderIds],
  )

  const supabase = getSupabaseAdmin()
  if (supabase && filesToDelete.length) {
    const byBucket = new Map<string, string[]>()
    for (const row of filesToDelete) {
      if (!row.storage_path) continue
      const bucket = row.bucket_id || 'drive'
      const list = byBucket.get(bucket) || []
      list.push(row.storage_path)
      byBucket.set(bucket, list)
    }
    for (const [bucket, paths] of byBucket.entries()) {
      for (const batch of chunk(paths, 100)) {
        try { await supabase.storage.from(bucket).remove(batch) } catch {}
      }
    }
  }

  const deletedFiles = await runQuery<{ id: string }>(
    `UPDATE drive.files
        SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND folder_id = ANY($1::uuid[])
    RETURNING id::text AS id`,
    [folderIds],
  )
  const deletedFolders = await runQuery<{ id: string }>(
    `UPDATE drive.folders
        SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND id = ANY($1::uuid[])
    RETURNING id::text AS id`,
    [folderIds],
  )

  return {
    ok: true,
    status: 200,
    result: { success: true, deleted: { folders: deletedFolders.length, files: deletedFiles.length } },
  }
}

async function handleDrivePrepareUpload(payload: WorkspaceRequestAction): Promise<DriveRequestResult> {
  const body = (payload.data || {}) as { workspace_id?: string; folder_id?: string | null; file_name?: string }
  const workspaceId = parseUuid(body.workspace_id || '')
  const folderIdRaw = body.folder_id ? String(body.folder_id) : ''
  const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
  const fileNameRaw = String(body.file_name || '').trim()

  if (!workspaceId) return { ok: false, status: 400, result: { success: false, message: 'workspace_id invalido' } }
  if (!fileNameRaw) return { ok: false, status: 400, result: { success: false, message: 'file_name e obrigatorio' } }
  if (folderIdRaw && !folderId) return { ok: false, status: 400, result: { success: false, message: 'folder_id invalido' } }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ok: false, status: 404, result: { success: false, message: 'Workspace invalido' } }
  if (folderId) {
    const folderRows = await runQuery<{ id: string }>(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE id = $1::uuid
          AND workspace_id = $2::uuid
          AND deleted_at IS NULL
        LIMIT 1`,
      [folderId, workspaceId],
    )
    if (!folderRows[0]) return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada para este workspace' } }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return { ok: false, status: 500, result: { success: false, message: 'Supabase Storage nao configurado no servidor' } }

  const fileId = randomUUID()
  const safeName = sanitizeDriveFileName(fileNameRaw)
  const folderSegment = folderId || 'root'
  const storagePath = `${workspaceId}/${folderSegment}/${fileId}-${safeName}`
  const { data, error } = await supabase.storage.from('drive').createSignedUploadUrl(storagePath)
  if (error || !data?.token || !data?.path) {
    return { ok: false, status: 500, result: { success: false, message: `Falha ao preparar upload: ${error?.message || 'erro desconhecido'}` } }
  }

  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      upload: { bucketId: 'drive', path: data.path, token: data.token },
      file: { id: fileId, name: safeName, workspaceId, folderId: folderId || null, storagePath },
    },
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handleDriveCompleteUpload(payload: WorkspaceRequestAction): Promise<DriveRequestResult> {
  const body = (payload.data || {}) as {
    workspace_id?: string
    folder_id?: string | null
    file_id?: string
    name?: string
    mime?: string
    size_bytes?: number
    storage_path?: string
  }

  const workspaceId = parseUuid(body.workspace_id || '')
  const folderIdRaw = body.folder_id ? String(body.folder_id) : ''
  const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
  const fileId = parseUuid(body.file_id || '')
  const storagePath = String(body.storage_path || '').trim()
  const name = String(body.name || '').trim()
  const mime = String(body.mime || 'application/octet-stream').trim() || 'application/octet-stream'
  const sizeBytesInput = Number(body.size_bytes || 0)

  if (!workspaceId) return { ok: false, status: 400, result: { success: false, message: 'workspace_id invalido' } }
  if (!fileId) return { ok: false, status: 400, result: { success: false, message: 'file_id invalido' } }
  if (!name) return { ok: false, status: 400, result: { success: false, message: 'name e obrigatorio' } }
  if (!storagePath) return { ok: false, status: 400, result: { success: false, message: 'storage_path e obrigatorio' } }
  if (folderIdRaw && !folderId) return { ok: false, status: 400, result: { success: false, message: 'folder_id invalido' } }

  const folderSegment = folderId || 'root'
  const expectedPrefix = `${workspaceId}/${folderSegment}/${fileId}-`
  if (!storagePath.startsWith(expectedPrefix)) {
    return { ok: false, status: 400, result: { success: false, message: 'storage_path invalido para workspace/pasta/arquivo' } }
  }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ok: false, status: 404, result: { success: false, message: 'Workspace invalido' } }
  if (folderId) {
    const folderRows = await runQuery<{ id: string }>(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE id = $1::uuid
          AND workspace_id = $2::uuid
          AND deleted_at IS NULL
        LIMIT 1`,
      [folderId, workspaceId],
    )
    if (!folderRows[0]) return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada para este workspace' } }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return { ok: false, status: 500, result: { success: false, message: 'Supabase Storage nao configurado no servidor' } }

  let info: unknown = null
  let infoErrorMessage = 'objeto nao encontrado'
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase.storage.from('drive').info(storagePath)
    if (!error && data) {
      info = data
      infoErrorMessage = ''
      break
    }
    infoErrorMessage = error?.message || 'objeto nao encontrado'
    if (attempt < 4) await sleep(350)
  }
  if (!info) {
    return { ok: false, status: 400, result: { success: false, message: `Upload nao encontrado no storage: ${infoErrorMessage}` } }
  }

  const sizeFromInfo = Number((info as any)?.metadata?.size ?? 0)
  const sizeBytes = Number.isFinite(sizeFromInfo) && sizeFromInfo > 0
    ? sizeFromInfo
    : (Number.isFinite(sizeBytesInput) && sizeBytesInput > 0 ? sizeBytesInput : 0)
  const mimeFromInfo = String((info as any)?.metadata?.mimetype || '').trim()
  const mimeFinal = mimeFromInfo || mime

  const inserted = await runQuery<{
    id: string
    folder_id: string | null
    name: string
    mime: string
    size_bytes: string | number
    created_at: string
    created_by: string | number
    storage_path: string
    bucket_id: string
  }>(
    `INSERT INTO drive.files
      (id, workspace_id, folder_id, name, mime, size_bytes, bucket_id, storage_path, created_by)
     VALUES
      ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::bigint, 'drive', $7, $8)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           mime = EXCLUDED.mime,
           size_bytes = EXCLUDED.size_bytes,
           storage_path = EXCLUDED.storage_path,
           bucket_id = EXCLUDED.bucket_id,
           updated_at = now()
     RETURNING
       id::text AS id,
       folder_id::text AS folder_id,
       name,
       mime,
       size_bytes,
       created_at,
       created_by::text AS created_by,
       storage_path,
       bucket_id`,
    [fileId, workspaceId, folderId, name, mimeFinal, sizeBytes, storagePath, ownerId],
  )
  const row = inserted[0]
  if (!row) return { ok: false, status: 500, result: { success: false, message: 'Falha ao gravar metadados do arquivo' } }

  const signed = await createSignedUrl('drive', storagePath)
  return {
    ok: true,
    status: 200,
    result: {
      success: true,
      file: {
        id: row.id,
        folderId: row.folder_id || undefined,
        name: row.name,
        mime: row.mime,
        size: formatBytes(row.size_bytes),
        sizeBytes: Number(row.size_bytes || 0),
        addedAt: row.created_at,
        addedBy: `user-${String(row.created_by)}`,
        url: signed.signedUrl,
        storagePath: row.storage_path,
        bucketId: row.bucket_id || 'drive',
      },
    },
  }
}

async function handleDriveUploadBase64(payload: WorkspaceRequestAction): Promise<DriveRequestResult> {
  const body = (payload.data || {}) as {
    workspace_id?: string | null
    folder_id?: string | null
    file_name?: string | null
    mime?: string | null
    content_base64?: string | null
  }

  const workspaceId = parseUuid(body.workspace_id || '')
  const folderIdRaw = String(body.folder_id || '').trim()
  const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
  const fileNameRaw = String(body.file_name || '').trim()
  const mime = String(body.mime || 'application/octet-stream').trim() || 'application/octet-stream'

  if (!workspaceId) return { ok: false, status: 400, result: { success: false, message: 'workspace_id invalido', code: 'DRIVE_WORKSPACE_ID_INVALID' } }
  if (!fileNameRaw) return { ok: false, status: 400, result: { success: false, message: 'file_name e obrigatorio', code: 'DRIVE_FILE_NAME_REQUIRED' } }
  if (folderIdRaw && !folderId) return { ok: false, status: 400, result: { success: false, message: 'folder_id invalido', code: 'DRIVE_FOLDER_ID_INVALID' } }

  const contentBuffer = await decodeBase64(String(body.content_base64 || ''))
  if (!contentBuffer) {
    return { ok: false, status: 400, result: { success: false, message: 'content_base64 e obrigatorio e deve ser base64 valido', code: 'DRIVE_CONTENT_BASE64_REQUIRED' } }
  }
  if (contentBuffer.byteLength > 20 * 1024 * 1024) {
    return { ok: false, status: 400, result: { success: false, message: 'arquivo excede o limite de 20 MB para upload_base64', code: 'DRIVE_FILE_TOO_LARGE' } }
  }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ok: false, status: 404, result: { success: false, message: 'Workspace invalido', code: 'DRIVE_WORKSPACE_NOT_FOUND' } }
  if (folderId) {
    const folderRows = await runQuery<{ id: string }>(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE id = $1::uuid
          AND workspace_id = $2::uuid
          AND deleted_at IS NULL
        LIMIT 1`,
      [folderId, workspaceId],
    )
    if (!folderRows[0]) {
      return { ok: false, status: 404, result: { success: false, message: 'Pasta nao encontrada para este workspace', code: 'DRIVE_FOLDER_NOT_FOUND' } }
    }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, status: 500, result: { success: false, message: 'Supabase Storage nao configurado no servidor', code: 'DRIVE_STORAGE_NOT_CONFIGURED' } }
  }

  const fileId = randomUUID()
  const safeName = sanitizeDriveFileName(fileNameRaw)
  const folderSegment = folderId || 'root'
  const bucketId = 'drive'
  const storagePath = `${workspaceId}/${folderSegment}/${fileId}-${safeName}`
  const upload = await supabase.storage.from(bucketId).upload(storagePath, contentBuffer, { contentType: mime, upsert: false })
  if (upload.error) {
    return {
      ok: false,
      status: 500,
      result: { success: false, message: `Falha no upload para o storage: ${upload.error.message || 'erro desconhecido'}`, code: 'DRIVE_STORAGE_UPLOAD_FAILED' },
    }
  }

  try {
    const inserted = await runQuery<{
      id: string
      folder_id: string | null
      name: string
      mime: string
      size_bytes: string | number
      created_at: string
      created_by: string | number
      storage_path: string
      bucket_id: string
    }>(
      `INSERT INTO drive.files
        (id, workspace_id, folder_id, name, mime, size_bytes, bucket_id, storage_path, created_by)
       VALUES
        ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::bigint, $7, $8, $9)
       RETURNING
         id::text AS id,
         folder_id::text AS folder_id,
         name,
         mime,
         size_bytes,
         created_at,
         created_by::text AS created_by,
         storage_path,
         bucket_id`,
      [fileId, workspaceId, folderId, safeName, mime, contentBuffer.byteLength, bucketId, storagePath, ownerId],
    )
    const row = inserted[0]
    if (!row) {
      return { ok: false, status: 500, result: { success: false, message: 'Falha ao gravar metadados do arquivo', code: 'DRIVE_METADATA_CREATE_FAILED' } }
    }

    const signed = await createSignedUrl(bucketId, storagePath)
    return {
      ok: true,
      status: 200,
      result: {
        success: true,
        file: {
          id: row.id,
          folderId: row.folder_id || undefined,
          name: row.name,
          mime: row.mime,
          size: formatBytes(row.size_bytes),
          sizeBytes: Number(row.size_bytes || 0),
          addedAt: row.created_at,
          addedBy: `user-${String(row.created_by)}`,
          url: signed.signedUrl,
          storagePath: row.storage_path,
          bucketId: row.bucket_id || bucketId,
        },
        signed_url: signed.signedUrl,
        filename: row.name,
        content_type: row.mime || mime,
      },
    }
  } catch (error) {
    try { await supabase.storage.from(bucketId).remove([storagePath]) } catch {}
    return {
      ok: false,
      status: 500,
      result: { success: false, message: error instanceof Error ? error.message : 'Falha ao gravar metadados do arquivo', code: 'DRIVE_METADATA_CREATE_FAILED' },
    }
  }
}

async function handleDriveFileDelete(req: Request, fileId: string): Promise<DriveRequestResult> {
  const url = new URL(req.url)
  const workspaceId = parseUuid(url.searchParams.get('workspace_id'))
  const fileRows = await runQuery<{
    id: string
    workspace_id: string
    storage_path: string
    bucket_id: string | null
  }>(
    `SELECT id::text AS id, workspace_id::text AS workspace_id, storage_path, bucket_id
       FROM drive.files
      WHERE id = $1::uuid
        AND deleted_at IS NULL
      LIMIT 1`,
    [fileId],
  )
  const file = fileRows[0]
  if (!file) return { ok: false, status: 404, result: { success: false, message: 'Arquivo nao encontrado' } }
  if (workspaceId && workspaceId !== file.workspace_id) {
    return { ok: false, status: 404, result: { success: false, message: 'Arquivo nao encontrado neste workspace' } }
  }

  const supabase = getSupabaseAdmin()
  const bucket = file.bucket_id || 'drive'
  if (supabase && file.storage_path) {
    try { await supabase.storage.from(bucket).remove([file.storage_path]) } catch {}
  }
  await runQuery(
    `UPDATE drive.files
        SET deleted_at = now()
      WHERE id = $1::uuid
        AND deleted_at IS NULL`,
    [fileId],
  )
  return { ok: true, status: 200, result: { success: true } }
}

export async function handleDriveRequest(req: Request, payload: WorkspaceRequestAction): Promise<DriveRequestResult> {
  const method = String(payload.method || 'GET').trim().toUpperCase()
  const resource = String(payload.resource || '').trim().replace(/^\/+|\/+$/g, '')

  if (!resource) return { ok: false, status: 400, result: toolError('TOOL_RESOURCE_REQUIRED', 'resource e obrigatorio') }

  if (resource === 'drive' && method === 'GET') return handleDriveRootGet(req)
  if (resource === 'drive/folders' && method === 'GET') return handleDriveFoldersGet(req)
  if (resource === 'drive/folders' && method === 'POST') return handleDriveFoldersPost(payload)
  if (/^drive\/folders\/[^/]+$/.test(resource)) {
    const folderId = resource.split('/').pop() || ''
    if (!isUuidString(folderId)) return { ok: false, status: 400, result: { success: false, message: 'folder_id invalido' } }
    if (method === 'GET') return handleDriveFolderGet(folderId)
    if (method === 'DELETE') return handleDriveFolderDelete(req, folderId)
  }
  if (resource === 'drive/files/prepare-upload' && method === 'POST') return handleDrivePrepareUpload(payload)
  if (resource === 'drive/files/complete-upload' && method === 'POST') return handleDriveCompleteUpload(payload)
  if (resource === 'drive/files/upload-base64' && method === 'POST') return handleDriveUploadBase64(payload)
  if (/^drive\/files\/[^/]+$/.test(resource) && method === 'DELETE') {
    const fileId = resource.split('/').pop() || ''
    if (!isUuidString(fileId)) return { ok: false, status: 400, result: { success: false, message: 'file_id invalido' } }
    return handleDriveFileDelete(req, fileId)
  }
  if (/^drive\/files\/[^/]+\/download$/.test(resource) && method === 'GET') {
    const fileId = resource.split('/')[2] || ''
    if (!isUuidString(fileId)) return { ok: false, status: 400, result: { success: false, message: 'file_id invalido' } }
    const out = await getDriveFileDownloadBuffer(fileId)
    if (!out.ok) return out
    return {
      ok: true,
      status: 200,
      result: {
        success: true,
        file: out.file,
        contentType: out.file.mime,
        sizeBytes: out.buffer.byteLength,
        message: 'Resposta binaria disponivel (use action=read_file para leitura textual do Drive).',
      },
    }
  }

  return {
    ok: false,
    status: 400,
    result: toolError('TOOL_RESOURCE_METHOD_NOT_ALLOWED', `resource/method nao permitido para drive: ${resource} (${method})`),
  }
}

function isUuidString(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
