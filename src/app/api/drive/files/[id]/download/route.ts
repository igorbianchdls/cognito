import { runQuery } from '@/lib/postgres'
import { getSupabaseAdmin, parseUuid } from '@/products/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type FileRow = {
  id: string
  name: string
  mime: string | null
  storage_path: string
  bucket_id: string | null
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

function buildContentDisposition(filename: string) {
  const safeName = String(filename || 'download').replace(/[\r\n"]/g, '').trim() || 'download'
  return `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idRaw = parts[parts.length - 2] || ''
    const fileId = parseUuid(idRaw)

    if (!fileId) {
      return Response.json({ success: false, message: 'file_id inválido' }, { status: 400 })
    }

    const rows = await runQuery<FileRow>(
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
      [fileId]
    )
    const file = rows[0]
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo não encontrado' }, { status: 404 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return Response.json({ success: false, message: 'Supabase Storage não configurado no servidor' }, { status: 500 })
    }

    const bucket = file.bucket_id || 'drive'
    const { data, error } = await supabase.storage.from(bucket).download(file.storage_path)
    if (error || !data) {
      const detail = error?.message || 'erro desconhecido'
      if (looksLikeStorageNotFound(detail)) {
        await softDeleteDriveFile(file.id)
        return Response.json(
          { success: false, message: 'Arquivo não encontrado no storage. Metadado removido da lista do Drive.' },
          { status: 404 },
        )
      }
      return Response.json({ success: false, message: `Falha no download: ${detail}` }, { status: 500 })
    }

    const buffer = await data.arrayBuffer()
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': file.mime || 'application/octet-stream',
        'Content-Disposition': buildContentDisposition(file.name),
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
