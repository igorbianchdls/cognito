import { runQuery } from '@/lib/postgres'
import {
  buildUserLabel,
  ensureSeedWorkspace,
  formatBytes,
  getSupabaseAdmin,
  listFilesByWorkspace,
  listRootFolders,
  listWorkspaces,
  parseUuid,
} from '@/products/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export async function GET(req: Request) {
  try {
    await ensureSeedWorkspace()
    const workspaces = await listWorkspaces()
    if (!workspaces.length) {
      return Response.json({ success: true, workspaces: [], activeWorkspaceId: null, folders: [], recentFiles: [] })
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

    const supabase = getSupabaseAdmin()
    const recentFilesRaw = await Promise.all(
      files.map(async (f) => {
        let signedUrl: string | undefined
        const bucket = f.bucket_id || 'drive'
        if (supabase) {
          try {
            const { data, error } = await supabase.storage.from(bucket).createSignedUrl(f.storage_path, 60 * 60)
            if (error && looksLikeStorageNotFound(error.message)) {
              await softDeleteDriveFile(f.id)
              return null
            }
            signedUrl = data?.signedUrl
          } catch (error) {
            if (looksLikeStorageNotFound(error instanceof Error ? error.message : String(error))) {
              await softDeleteDriveFile(f.id)
              return null
            }
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
    const recentFiles = recentFilesRaw.filter((item): item is NonNullable<typeof item> => Boolean(item))

    const outFolders = folders.map((f) => ({
      id: f.id,
      name: f.name,
      filesCount: Number(f.files_count || 0),
      size: formatBytes(f.total_bytes),
    }))

    return Response.json({
      success: true,
      workspaces,
      activeWorkspaceId,
      folders: outFolders,
      recentFiles,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
