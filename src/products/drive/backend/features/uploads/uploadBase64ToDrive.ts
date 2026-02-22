import { randomUUID } from 'crypto'
import { runQuery } from '@/lib/postgres'
import {
  formatBytes,
  getSupabaseAdmin,
  getWorkspaceOwnerId,
  parseUuid,
  sanitizeDriveFileName,
} from '@/products/drive/backend/lib'

type UploadBase64Input = {
  workspace_id?: string | null
  folder_id?: string | null
  file_name?: string | null
  mime?: string | null
  content_base64?: string | null
}

type UploadBase64Success = {
  success: true
  file: {
    id: string
    folderId?: string
    name: string
    mime: string
    size: string
    sizeBytes: number
    addedAt: string
    addedBy: string
    url?: string
    storagePath: string
    bucketId: string
  }
  signed_url?: string
  filename: string
  content_type: string
}

type UploadBase64Failure = {
  success: false
  message: string
  code: string
  status: number
}

type UploadBase64Result = UploadBase64Success | UploadBase64Failure

function decodeBase64(input: string): Buffer | null {
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

function isValidFolderForWorkspace(folderId: string, workspaceId: string) {
  return runQuery<{ id: string }>(
    `SELECT id::text AS id
       FROM drive.folders
      WHERE id = $1::uuid
        AND workspace_id = $2::uuid
        AND deleted_at IS NULL
      LIMIT 1`,
    [folderId, workspaceId],
  )
}

export async function uploadBase64ToDrive(input: UploadBase64Input): Promise<UploadBase64Result> {
  const workspaceId = parseUuid(input.workspace_id || '')
  const folderIdRaw = String(input.folder_id || '').trim()
  const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
  const fileNameRaw = String(input.file_name || '').trim()
  const mime = String(input.mime || 'application/octet-stream').trim() || 'application/octet-stream'

  if (!workspaceId) return { success: false, code: 'DRIVE_WORKSPACE_ID_INVALID', message: 'workspace_id inválido', status: 400 }
  if (!fileNameRaw) return { success: false, code: 'DRIVE_FILE_NAME_REQUIRED', message: 'file_name é obrigatório', status: 400 }
  if (folderIdRaw && !folderId) return { success: false, code: 'DRIVE_FOLDER_ID_INVALID', message: 'folder_id inválido', status: 400 }

  const contentBuffer = decodeBase64(String(input.content_base64 || ''))
  if (!contentBuffer) {
    return {
      success: false,
      code: 'DRIVE_CONTENT_BASE64_REQUIRED',
      message: 'content_base64 é obrigatório e deve ser base64 válido',
      status: 400,
    }
  }
  if (contentBuffer.byteLength > 20 * 1024 * 1024) {
    return { success: false, code: 'DRIVE_FILE_TOO_LARGE', message: 'arquivo excede o limite de 20 MB para upload_base64', status: 400 }
  }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { success: false, code: 'DRIVE_WORKSPACE_NOT_FOUND', message: 'Workspace inválido', status: 404 }

  if (folderId) {
    const folderRows = await isValidFolderForWorkspace(folderId, workspaceId)
    if (!folderRows[0]) {
      return {
        success: false,
        code: 'DRIVE_FOLDER_NOT_FOUND',
        message: 'Pasta não encontrada para este workspace',
        status: 404,
      }
    }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      success: false,
      code: 'DRIVE_STORAGE_NOT_CONFIGURED',
      message: 'Supabase Storage não configurado no servidor',
      status: 500,
    }
  }

  const fileId = randomUUID()
  const safeName = sanitizeDriveFileName(fileNameRaw)
  const folderSegment = folderId || 'root'
  const bucketId = 'drive'
  const storagePath = `${workspaceId}/${folderSegment}/${fileId}-${safeName}`

  const upload = await supabase.storage.from(bucketId).upload(storagePath, contentBuffer, {
    contentType: mime,
    upsert: false,
  })
  if (upload.error) {
    return {
      success: false,
      code: 'DRIVE_STORAGE_UPLOAD_FAILED',
      message: `Falha no upload para o storage: ${upload.error.message || 'erro desconhecido'}`,
      status: 500,
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
      return { success: false, code: 'DRIVE_METADATA_CREATE_FAILED', message: 'Falha ao gravar metadados do arquivo', status: 500 }
    }

    let signedUrl: string | undefined
    try {
      const signed = await supabase.storage.from(bucketId).createSignedUrl(storagePath, 60 * 60)
      signedUrl = signed.data?.signedUrl
    } catch {
      signedUrl = undefined
    }

    return {
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
        url: signedUrl,
        storagePath: row.storage_path,
        bucketId: row.bucket_id || bucketId,
      },
      signed_url: signedUrl,
      filename: row.name,
      content_type: row.mime || mime,
    }
  } catch (error) {
    // Best-effort cleanup if metadata insert fails after blob upload.
    try {
      await supabase.storage.from(bucketId).remove([storagePath])
    } catch {}
    return {
      success: false,
      code: 'DRIVE_METADATA_CREATE_FAILED',
      message: error instanceof Error ? error.message : 'Falha ao gravar metadados do arquivo',
      status: 500,
    }
  }
}
