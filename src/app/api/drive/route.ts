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
    const recentFiles = await Promise.all(
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
