import { runQuery } from '@/lib/postgres'
import {
  formatBytes,
  getSupabaseAdmin,
  getWorkspaceOwnerId,
  parseUuid,
} from '@/features/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type CompleteUploadBody = {
  workspace_id?: string
  folder_id?: string | null
  file_id?: string
  name?: string
  mime?: string
  size_bytes?: number
  storage_path?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as CompleteUploadBody
    const workspaceId = parseUuid(body.workspace_id || '')
    const folderIdRaw = body.folder_id ? String(body.folder_id) : ''
    const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
    const fileId = parseUuid(body.file_id || '')
    const storagePath = String(body.storage_path || '').trim()
    const name = String(body.name || '').trim()
    const mime = String(body.mime || 'application/octet-stream').trim() || 'application/octet-stream'
    const sizeBytesInput = Number(body.size_bytes || 0)

    if (!workspaceId) {
      return Response.json({ success: false, message: 'workspace_id inválido' }, { status: 400 })
    }
    if (!fileId) {
      return Response.json({ success: false, message: 'file_id inválido' }, { status: 400 })
    }
    if (!name) {
      return Response.json({ success: false, message: 'name é obrigatório' }, { status: 400 })
    }
    if (!storagePath) {
      return Response.json({ success: false, message: 'storage_path é obrigatório' }, { status: 400 })
    }
    if (folderIdRaw && !folderId) {
      return Response.json({ success: false, message: 'folder_id inválido' }, { status: 400 })
    }

    const folderSegment = folderId || 'root'
    const expectedPrefix = `${workspaceId}/${folderSegment}/${fileId}-`
    if (!storagePath.startsWith(expectedPrefix)) {
      return Response.json({ success: false, message: 'storage_path inválido para workspace/pasta/arquivo' }, { status: 400 })
    }

    const ownerId = await getWorkspaceOwnerId(workspaceId)
    if (!ownerId) {
      return Response.json({ success: false, message: 'Workspace inválido' }, { status: 404 })
    }

    if (folderId) {
      const folderRows = await runQuery<{ id: string }>(
        `SELECT id::text AS id
           FROM drive.folders
          WHERE id = $1::uuid
            AND workspace_id = $2::uuid
            AND deleted_at IS NULL
          LIMIT 1`,
        [folderId, workspaceId]
      )
      if (!folderRows[0]) {
        return Response.json({ success: false, message: 'Pasta não encontrada para este workspace' }, { status: 404 })
      }
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return Response.json({ success: false, message: 'Supabase Storage não configurado no servidor' }, { status: 500 })
    }

    let info: unknown = null
    let infoErrorMessage = 'objeto não encontrado'
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase.storage.from('drive').info(storagePath)
      if (!error && data) {
        info = data
        infoErrorMessage = ''
        break
      }
      infoErrorMessage = error?.message || 'objeto não encontrado'
      if (attempt < 4) {
        await sleep(350)
      }
    }
    if (!info) {
      return Response.json({ success: false, message: `Upload não encontrado no storage: ${infoErrorMessage}` }, { status: 400 })
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
      [fileId, workspaceId, folderId, name, mimeFinal, sizeBytes, storagePath, ownerId]
    )

    const row = inserted[0]
    if (!row) {
      return Response.json({ success: false, message: 'Falha ao gravar metadados do arquivo' }, { status: 500 })
    }

    let signedUrl: string | undefined
    try {
      const { data } = await supabase.storage.from('drive').createSignedUrl(storagePath, 60 * 60)
      signedUrl = data?.signedUrl
    } catch {
      signedUrl = undefined
    }

    return Response.json({
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
        bucketId: row.bucket_id || 'drive',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
