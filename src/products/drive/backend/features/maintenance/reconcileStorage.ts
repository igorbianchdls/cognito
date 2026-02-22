import { runQuery } from '@/lib/postgres'
import { getSupabaseAdmin, parseUuid } from '@/products/drive/backend/lib'

type ReconcileInput = {
  workspaceId?: string | null
  limit?: number
  apply?: boolean
}

type DriveFileRow = {
  id: string
  workspace_id: string
  bucket_id: string | null
  storage_path: string
  name: string
  mime: string | null
}

function clampLimit(value: unknown, fallback = 200): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.min(1000, Math.trunc(n)))
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

export async function reconcileDriveStorageObjects(input: ReconcileInput) {
  const workspaceId = parseUuid(input.workspaceId || null)
  const limit = clampLimit(input.limit, 200)
  const apply = Boolean(input.apply)

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      ok: false as const,
      status: 500,
      error: 'Supabase Storage não configurado no servidor',
      code: 'DRIVE_STORAGE_NOT_CONFIGURED',
    }
  }

  const rows = await runQuery<DriveFileRow>(
    `SELECT
       f.id::text AS id,
       f.workspace_id::text AS workspace_id,
       f.bucket_id,
       f.storage_path,
       f.name,
       f.mime
     FROM drive.files f
     WHERE f.deleted_at IS NULL
       AND ($1::uuid IS NULL OR f.workspace_id = $1::uuid)
     ORDER BY f.updated_at DESC NULLS LAST, f.created_at DESC, f.id DESC
     LIMIT $2::int`,
    [workspaceId, limit],
  )

  let checked = 0
  let existing = 0
  let missing = 0
  let errors = 0
  const missingRows: Array<Record<string, unknown>> = []
  const errorRows: Array<Record<string, unknown>> = []
  const missingIdsToDelete: string[] = []

  for (const row of rows) {
    checked += 1
    const bucket = row.bucket_id || 'drive'
    try {
      const { data, error } = await supabase.storage.from(bucket).info(row.storage_path)
      if (!error && data) {
        existing += 1
        continue
      }
      const detail = error?.message || 'erro desconhecido'
      if (looksLikeStorageNotFound(detail)) {
        missing += 1
        missingIdsToDelete.push(row.id)
        if (missingRows.length < 50) {
          missingRows.push({
            id: row.id,
            workspace_id: row.workspace_id,
            bucket_id: bucket,
            storage_path: row.storage_path,
            name: row.name,
            mime: row.mime || 'application/octet-stream',
            reason: detail,
          })
        }
        continue
      }
      errors += 1
      if (errorRows.length < 25) {
        errorRows.push({
          id: row.id,
          workspace_id: row.workspace_id,
          bucket_id: bucket,
          storage_path: row.storage_path,
          name: row.name,
          reason: detail,
        })
      }
    } catch (err) {
      errors += 1
      if (errorRows.length < 25) {
        errorRows.push({
          id: row.id,
          workspace_id: row.workspace_id,
          bucket_id: bucket,
          storage_path: row.storage_path,
          name: row.name,
          reason: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  let softDeleted = 0
  if (apply && missingIdsToDelete.length > 0) {
    const updated = await runQuery<{ id: string }>(
      `UPDATE drive.files
          SET deleted_at = now(),
              updated_at = now()
        WHERE id = ANY($1::uuid[])
          AND deleted_at IS NULL
        RETURNING id::text AS id`,
      [missingIdsToDelete],
    )
    softDeleted = updated.length
  }

  return {
    ok: true as const,
    status: 200,
    result: {
      success: true,
      workspace_id: workspaceId || null,
      apply,
      summary: {
        limit,
        checked,
        existing,
        missing,
        errors,
        soft_deleted: softDeleted,
      },
      missing_preview: missingRows,
      error_preview: errorRows,
    },
  }
}

