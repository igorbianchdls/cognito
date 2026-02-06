import {
  buildUserLabel,
  formatBytes,
  getFolder,
  getSupabaseAdmin,
  listFilesByFolder,
  parseUuid,
} from '../../_lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idRaw = parts[parts.length - 1] || ''
    const folderId = parseUuid(idRaw)
    if (!folderId) {
      return Response.json({ success: false, message: 'folder_id inválido' }, { status: 400 })
    }

    const folder = await getFolder(folderId)
    if (!folder) {
      return Response.json({ success: false, message: 'Pasta não encontrada' }, { status: 404 })
    }

    const files = await listFilesByFolder(folderId, 800)
    const supabase = getSupabaseAdmin()
    const outFiles = await Promise.all(
      files.map(async (f) => {
        let signedUrl: string | undefined
        const bucket = f.bucket_id || 'drive'
        if (supabase) {
          try {
            const { data } = await supabase.storage.from(bucket).createSignedUrl(f.storage_path, 60 * 60)
            signedUrl = data?.signedUrl
          } catch {
            signedUrl = undefined
          }
        }
        return {
          id: f.id,
          folderId: f.folder_id || undefined,
          name: f.name,
          mime: f.mime || 'application/octet-stream',
          size: formatBytes(f.size_bytes),
          sizeBytes: Number(f.size_bytes || 0),
          addedAt: f.created_at,
          addedBy: buildUserLabel(f.created_by),
          url: signedUrl,
          storagePath: f.storage_path,
          bucketId: bucket,
        }
      })
    )

    return Response.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        workspaceId: folder.workspace_id,
      },
      files: outFiles,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
