import {
  buildUserLabel,
  formatBytes,
  getFolder,
  getSupabaseAdmin,
  listFilesByFolder,
  parseUuid,
} from '@/products/drive/backend/lib'
import { runQuery } from '@/lib/postgres'

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

type FolderTreeRow = { id: string }
type StorageFileRow = { storage_path: string; bucket_id: string | null }

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idRaw = parts[parts.length - 1] || ''
    const folderId = parseUuid(idRaw)
    const workspaceId = parseUuid(url.searchParams.get('workspace_id'))

    if (!folderId) {
      return Response.json({ success: false, message: 'folder_id inválido' }, { status: 400 })
    }

    const folder = await getFolder(folderId)
    if (!folder) {
      return Response.json({ success: false, message: 'Pasta não encontrada' }, { status: 404 })
    }
    if (workspaceId && workspaceId !== folder.workspace_id) {
      return Response.json({ success: false, message: 'Pasta não encontrada neste workspace' }, { status: 404 })
    }

    const folderTree = await runQuery<FolderTreeRow>(
      `WITH RECURSIVE tree AS (
         SELECT id
           FROM drive.folders
          WHERE id = $1::uuid
            AND deleted_at IS NULL
         UNION ALL
         SELECT f.id
           FROM drive.folders f
           JOIN tree t
             ON f.parent_id = t.id
          WHERE f.deleted_at IS NULL
       )
       SELECT id::text AS id
         FROM tree`,
      [folderId]
    )
    const folderIds = folderTree.map((r) => r.id)
    if (!folderIds.length) {
      return Response.json({ success: false, message: 'Pasta não encontrada' }, { status: 404 })
    }

    const filesToDelete = await runQuery<StorageFileRow>(
      `SELECT storage_path, bucket_id
         FROM drive.files
        WHERE deleted_at IS NULL
          AND folder_id = ANY($1::uuid[])`,
      [folderIds]
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
        const batches = chunk(paths, 100)
        for (const batch of batches) {
          try {
            await supabase.storage.from(bucket).remove(batch)
          } catch {
            // Não bloqueia exclusão lógica em caso de falha no storage.
          }
        }
      }
    }

    const deletedFiles = await runQuery<{ id: string }>(
      `UPDATE drive.files
          SET deleted_at = now()
        WHERE deleted_at IS NULL
          AND folder_id = ANY($1::uuid[])
      RETURNING id::text AS id`,
      [folderIds]
    )
    const deletedFolders = await runQuery<{ id: string }>(
      `UPDATE drive.folders
          SET deleted_at = now()
        WHERE deleted_at IS NULL
          AND id = ANY($1::uuid[])
      RETURNING id::text AS id`,
      [folderIds]
    )

    return Response.json({
      success: true,
      deleted: {
        folders: deletedFolders.length,
        files: deletedFiles.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
