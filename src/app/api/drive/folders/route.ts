import { runQuery } from '@/lib/postgres'
import { ensureSeedWorkspace, getWorkspaceOwnerId, listWorkspaces, parseUuid } from '@/products/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CreateFolderBody = {
  workspace_id?: string
  name?: string
  parent_id?: string | null
}

type FolderListRow = {
  id: string
  workspace_id: string
  parent_id: string | null
  name: string
  files_count: number
  total_bytes: string | number
  created_at: string
}

export async function GET(req: Request) {
  try {
    await ensureSeedWorkspace()
    const workspaces = await listWorkspaces()
    if (!workspaces.length) {
      return Response.json({ success: true, activeWorkspaceId: null, parentId: null, folders: [] })
    }

    const url = new URL(req.url)
    const requestedWorkspaceId = parseUuid(url.searchParams.get('workspace_id'))
    const activeWorkspaceId = requestedWorkspaceId && workspaces.some((w) => w.id === requestedWorkspaceId)
      ? requestedWorkspaceId
      : workspaces[0].id
    const parentIdRaw = url.searchParams.get('parent_id')
    const parentId = parentIdRaw ? parseUuid(parentIdRaw) : null

    if (parentIdRaw && !parentId) {
      return Response.json({ success: false, message: 'parent_id inválido' }, { status: 400 })
    }

    if (parentId) {
      const parentRows = await runQuery<{ id: string }>(
        `SELECT id::text AS id
           FROM drive.folders
          WHERE id = $1::uuid
            AND workspace_id = $2::uuid
            AND deleted_at IS NULL
          LIMIT 1`,
        [parentId, activeWorkspaceId]
      )
      if (!parentRows[0]) {
        return Response.json({ success: false, message: 'parent_id não encontrado neste workspace' }, { status: 404 })
      }
    }

    const rows = await runQuery<FolderListRow>(
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
         AND (
           ($2::uuid IS NULL AND f.parent_id IS NULL)
           OR f.parent_id = $2::uuid
         )
       GROUP BY f.id, f.workspace_id, f.parent_id, f.name, f.created_at
       ORDER BY f.created_at ASC`,
      [activeWorkspaceId, parentId]
    )

    const folders = rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      parentId: row.parent_id,
      name: row.name,
      filesCount: Number(row.files_count || 0),
      totalBytes: Number(row.total_bytes || 0),
      createdAt: row.created_at,
    }))

    return Response.json({
      success: true,
      activeWorkspaceId,
      parentId: parentId || null,
      folders,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as CreateFolderBody
    const workspaceId = parseUuid(body.workspace_id || '')
    const parentId = body.parent_id ? parseUuid(body.parent_id) : null
    const name = String(body.name || '').trim()

    if (!workspaceId) {
      return Response.json({ success: false, message: 'workspace_id inválido' }, { status: 400 })
    }
    if (!name) {
      return Response.json({ success: false, message: 'name é obrigatório' }, { status: 400 })
    }
    if (name.length > 120) {
      return Response.json({ success: false, message: 'name deve ter no máximo 120 caracteres' }, { status: 400 })
    }

    const ownerId = await getWorkspaceOwnerId(workspaceId)
    if (!ownerId) {
      return Response.json({ success: false, message: 'Workspace não encontrado' }, { status: 404 })
    }

    if (body.parent_id && !parentId) {
      return Response.json({ success: false, message: 'parent_id inválido' }, { status: 400 })
    }

    if (parentId) {
      const parentRows = await runQuery<{ id: string }>(
        `SELECT id::text AS id
           FROM drive.folders
          WHERE id = $1::uuid
            AND workspace_id = $2::uuid
            AND deleted_at IS NULL
          LIMIT 1`,
        [parentId, workspaceId]
      )
      if (!parentRows[0]) {
        return Response.json({ success: false, message: 'parent_id não encontrado neste workspace' }, { status: 404 })
      }
    }

    const rows = await runQuery<{
      id: string
      workspace_id: string
      parent_id: string | null
      name: string
      created_at: string
    }>(
      `INSERT INTO drive.folders (workspace_id, parent_id, name, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4)
       RETURNING
         id::text AS id,
         workspace_id::text AS workspace_id,
         parent_id::text AS parent_id,
         name,
         created_at`,
      [workspaceId, parentId, name, ownerId]
    )

    return Response.json({ success: true, folder: rows[0] })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('duplicate')) {
      return Response.json({ success: false, message: 'Já existe uma pasta com este nome neste local' }, { status: 409 })
    }
    return Response.json({ success: false, message }, { status: 500 })
  }
}
