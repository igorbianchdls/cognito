import { runQuery } from '@/lib/postgres'
import { getSupabaseAdmin, parseUuid } from '@/features/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type FileRow = {
  id: string
  workspace_id: string
  storage_path: string
  bucket_id: string | null
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idRaw = parts[parts.length - 1] || ''
    const fileId = parseUuid(idRaw)
    const workspaceId = parseUuid(url.searchParams.get('workspace_id'))

    if (!fileId) {
      return Response.json({ success: false, message: 'file_id inválido' }, { status: 400 })
    }

    const fileRows = await runQuery<FileRow>(
      `SELECT
         id::text AS id,
         workspace_id::text AS workspace_id,
         storage_path,
         bucket_id
       FROM drive.files
       WHERE id = $1::uuid
         AND deleted_at IS NULL
       LIMIT 1`,
      [fileId]
    )
    const file = fileRows[0]
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo não encontrado' }, { status: 404 })
    }
    if (workspaceId && workspaceId !== file.workspace_id) {
      return Response.json({ success: false, message: 'Arquivo não encontrado neste workspace' }, { status: 404 })
    }

    const bucket = file.bucket_id || 'drive'
    const supabase = getSupabaseAdmin()
    if (supabase && file.storage_path) {
      try {
        await supabase.storage.from(bucket).remove([file.storage_path])
      } catch {
        // Não bloqueia exclusão do metadado em caso de falha no storage.
      }
    }

    await runQuery(
      `UPDATE drive.files
          SET deleted_at = now()
        WHERE id = $1::uuid
          AND deleted_at IS NULL`,
      [fileId]
    )

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}

