import { randomUUID } from 'crypto'
import { runQuery } from '@/lib/postgres'
import {
  getSupabaseAdmin,
  getWorkspaceOwnerId,
  parseUuid,
  sanitizeDriveFileName,
} from '../../_lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type PrepareUploadBody = {
  workspace_id?: string
  folder_id?: string | null
  file_name?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as PrepareUploadBody
    const workspaceId = parseUuid(body.workspace_id || '')
    const folderIdRaw = body.folder_id ? String(body.folder_id) : ''
    const folderId = folderIdRaw ? parseUuid(folderIdRaw) : null
    const fileNameRaw = String(body.file_name || '').trim()

    if (!workspaceId) {
      return Response.json({ success: false, message: 'workspace_id inválido' }, { status: 400 })
    }
    if (!fileNameRaw) {
      return Response.json({ success: false, message: 'file_name é obrigatório' }, { status: 400 })
    }
    if (folderIdRaw && !folderId) {
      return Response.json({ success: false, message: 'folder_id inválido' }, { status: 400 })
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

    const fileId = randomUUID()
    const safeName = sanitizeDriveFileName(fileNameRaw)
    const folderSegment = folderId || 'root'
    const storagePath = `${workspaceId}/${folderSegment}/${fileId}-${safeName}`

    const { data, error } = await supabase.storage.from('drive').createSignedUploadUrl(storagePath)
    if (error || !data?.token || !data?.path) {
      return Response.json({ success: false, message: `Falha ao preparar upload: ${error?.message || 'erro desconhecido'}` }, { status: 500 })
    }

    return Response.json({
      success: true,
      upload: {
        bucketId: 'drive',
        path: data.path,
        token: data.token,
      },
      file: {
        id: fileId,
        name: safeName,
        workspaceId,
        folderId: folderId || null,
        storagePath,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
