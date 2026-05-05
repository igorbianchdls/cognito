import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'

type JsonMap = Record<string, unknown>

export type ArtifactSourceKind = 'draft' | 'published'

export type DashboardListItem = {
  id: string
  title: string
  slug: string | null
  status: 'draft' | 'published' | 'archived'
  workspace_id: string | null
  created_from_chat_id: string | null
  current_draft_version: number | null
  current_published_version: number | null
  thumbnail_data_url: string | null
  created_at: string
  updated_at: string
}

export type DashboardSourceVersionListItem = {
  version: number
  kind: ArtifactSourceKind
  change_summary: string | null
  created_at: string
}

type DashboardRow = {
  id: string
  workspace_id: string | null
  created_from_chat_id: string | null
  title: string
  slug: string | null
  status: 'draft' | 'published' | 'archived'
  current_draft_version: number | null
  current_published_version: number | null
  thumbnail_data_url: string | null
  metadata: JsonMap | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

type DashboardSourceRow = {
  id: string
  dashboard_id: string
  version: number
  kind: ArtifactSourceKind
  source: string
  change_summary: string | null
  created_by: string | null
  created_at: string
}

type ReadArtifactInput = {
  artifactId: string
  kind?: ArtifactSourceKind
  version?: number | null
}

type WriteArtifactInput = {
  artifactId?: string | null
  expectedVersion?: number | null
  title?: string | null
  source: string
  workspaceId?: string | null
  slug?: string | null
  metadata?: JsonMap | null
  changeSummary?: string | null
  chatId?: string | null
  actorId?: string | null
}

type PatchArtifactInput = {
  artifactId: string
  expectedVersion: number
  operation: {
    type: 'replace_text' | 'replace_full_source'
    oldString?: string | null
    newString?: string | null
    replaceAll?: boolean | null
    source?: string | null
    changeSummary?: string | null
  }
  actorId?: string | null
}

type UpdateDashboardThumbnailInput = {
  artifactId: string
  thumbnailDataUrl?: string | null
  actorId?: string | null
}

export class ArtifactToolError extends Error {
  status: number
  code: string
  details?: JsonMap

  constructor(status: number, code: string, message: string, details?: JsonMap) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function toObj(value: unknown): JsonMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toNullableText(value: unknown): string | null {
  const text = toText(value)
  return text || null
}

function normalizePositiveInt(value: unknown, field: string): number | null {
  if (value == null || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) {
    throw new ArtifactToolError(400, 'invalid_input', `${field} deve ser inteiro positivo`)
  }
  return num
}

function normalizeSource(value: unknown, field = 'source'): string {
  const source = String(value ?? '')
  if (!source.trim()) {
    throw new ArtifactToolError(400, 'invalid_input', `${field} é obrigatório`)
  }
  return source
}

async function getDashboardById(client: Pick<SQLClient, 'query'>, artifactId: string, forUpdate = false) {
  const rows = await client.query(
    `SELECT
       id::text,
       workspace_id::text AS workspace_id,
       created_from_chat_id,
       title,
       slug,
       status,
       current_draft_version,
       current_published_version,
       thumbnail_data_url,
       metadata,
       created_by::text AS created_by,
       updated_by::text AS updated_by,
       created_at,
       updated_at
     FROM artifacts.dashboards
     WHERE id = $1::uuid
     ${forUpdate ? 'FOR UPDATE' : ''}`,
    [artifactId],
  )
  const row = (rows.rows?.[0] || null) as DashboardRow | null
  if (!row) {
    throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
  }
  return row
}

async function getDashboardSource(
  client: Pick<SQLClient, 'query'>,
  artifactId: string,
  kind: ArtifactSourceKind,
  version?: number | null,
) {
  const params: unknown[] = [artifactId, kind]
  const versionClause = version ? `AND version = $${params.push(version)}::int` : ''
  const rows = await client.query(
    `SELECT
       id::text,
       dashboard_id::text AS dashboard_id,
       version,
       kind,
       source,
       change_summary,
       created_by::text AS created_by,
       created_at
     FROM artifacts.dashboard_sources
     WHERE dashboard_id = $1::uuid
       AND kind = $2::text
       ${versionClause}
     ORDER BY version DESC
     LIMIT 1`,
    params,
  )
  const row = (rows.rows?.[0] || null) as DashboardSourceRow | null
  if (!row) {
    throw new ArtifactToolError(404, 'artifact_source_not_found', `versão ${kind} não encontrada`, {
      artifact_id: artifactId,
      kind,
      ...(version ? { version } : {}),
    })
  }
  return row
}

function buildArtifactResponse(dashboard: DashboardRow, source: DashboardSourceRow) {
  return {
    success: true,
    artifact_id: dashboard.id,
    artifact_type: 'dashboard',
    title: dashboard.title,
    slug: dashboard.slug,
    status: dashboard.status,
    workspace_id: dashboard.workspace_id,
    created_from_chat_id: dashboard.created_from_chat_id,
    current_draft_version: dashboard.current_draft_version,
    current_published_version: dashboard.current_published_version,
    thumbnail_data_url: dashboard.thumbnail_data_url,
    metadata: toObj(dashboard.metadata),
    source_kind: source.kind,
    version: source.version,
    source: source.source,
    change_summary: source.change_summary,
    created_at: dashboard.created_at,
    updated_at: dashboard.updated_at,
  }
}

function applyReplaceTextOperation(input: {
  source: string
  oldString: string
  newString: string
  replaceAll: boolean
}) {
  const { source, oldString, newString, replaceAll } = input
  if (!oldString) {
    throw new ArtifactToolError(400, 'invalid_input', 'operation.old_string é obrigatório para replace_text')
  }

  const occurrences = source.split(oldString).length - 1
  if (occurrences <= 0) {
    throw new ArtifactToolError(400, 'patch_no_match', 'operation.old_string não foi encontrado no source atual')
  }
  if (!replaceAll && occurrences > 1) {
    throw new ArtifactToolError(400, 'patch_ambiguous_match', 'operation.old_string apareceu múltiplas vezes; use replace_all=true ou torne o trecho mais específico', {
      matches: occurrences,
    })
  }

  const nextSource = replaceAll
    ? source.split(oldString).join(newString)
    : source.replace(oldString, newString)

  return { nextSource, matches: occurrences }
}

function assertExpectedVersion(currentVersion: number | null, expectedVersion: number, artifactId: string) {
  if (currentVersion !== expectedVersion) {
    throw new ArtifactToolError(409, 'version_conflict', 'versão draft atual não confere com expected_version', {
      artifact_id: artifactId,
      current_version: currentVersion,
      expected_version: expectedVersion,
    })
  }
}

function mapDbError(error: unknown): never {
  const err = error as { code?: string; message?: string; detail?: string }
  if (err?.code === '23505') {
    throw new ArtifactToolError(409, 'unique_conflict', err.detail || err.message || 'conflito de unicidade ao persistir artifact')
  }
  if (err?.code === '22P02') {
    throw new ArtifactToolError(400, 'invalid_input', err.message || 'valor inválido para UUID/integer')
  }
  if (error instanceof ArtifactToolError) throw error
  throw new ArtifactToolError(500, 'artifact_persistence_error', err?.message || 'erro interno ao persistir artifact')
}

export async function listDashboards(limit = 100): Promise<DashboardListItem[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100
  try {
    return await runQuery<DashboardListItem>(
      `SELECT
         id::text,
         title,
         slug,
         status,
         workspace_id::text AS workspace_id,
         created_from_chat_id,
         current_draft_version,
         current_published_version,
         thumbnail_data_url,
         created_at,
         updated_at
       FROM artifacts.dashboards
       ORDER BY updated_at DESC, created_at DESC
       LIMIT $1::int`,
      [safeLimit],
    )
  } catch (error) {
    return mapDbError(error)
  }
}

export async function renameDashboardArtifact(input: {
  artifactId: string
  title: string
  actorId?: string | null
}) {
  const artifactId = toText(input.artifactId)
  const title = toText(input.title)
  const actorId = toNullableText(input.actorId)

  if (!artifactId) {
    throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
  }
  if (!title) {
    throw new ArtifactToolError(400, 'invalid_input', 'title é obrigatório')
  }

  try {
    const rows = await runQuery<DashboardListItem>(
      `UPDATE artifacts.dashboards
       SET
         title = $2::text,
         updated_by = COALESCE($3::uuid, updated_by),
         updated_at = now()
       WHERE id = $1::uuid
       RETURNING
         id::text,
         title,
         slug,
         status,
         workspace_id::text AS workspace_id,
         created_from_chat_id,
         current_draft_version,
         current_published_version,
         thumbnail_data_url,
         created_at,
         updated_at`,
      [artifactId, title, actorId],
    )
    const row = rows[0] || null
    if (!row) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
    }
    return {
      success: true,
      dashboard: row,
    }
  } catch (error) {
    return mapDbError(error)
  }
}

export async function listDashboardSourceVersions(
  artifactId: string,
  kind: ArtifactSourceKind = 'draft',
  limit = 100,
): Promise<DashboardSourceVersionListItem[]> {
  const normalizedArtifactId = toText(artifactId)
  if (!normalizedArtifactId) {
    throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100

  try {
    return await runQuery<DashboardSourceVersionListItem>(
      `SELECT
         version,
         kind,
         change_summary,
         created_at
       FROM artifacts.dashboard_sources
       WHERE dashboard_id = $1::uuid
         AND kind = $2::text
       ORDER BY version DESC
       LIMIT $3::int`,
      [normalizedArtifactId, kind, safeLimit],
    )
  } catch (error) {
    return mapDbError(error)
  }
}

export async function readDashboardArtifact(input: ReadArtifactInput) {
  try {
    const artifactId = toText(input.artifactId)
    if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
    const kind = input.kind === 'published' ? 'published' : 'draft'
    const version = normalizePositiveInt(input.version, 'version')
    const dashboard = (await runQuery<DashboardRow>(
      `SELECT
         id::text,
         workspace_id::text AS workspace_id,
         created_from_chat_id,
         title,
         slug,
         status,
         current_draft_version,
         current_published_version,
         thumbnail_data_url,
         metadata,
         created_by::text AS created_by,
         updated_by::text AS updated_by,
         created_at,
         updated_at
       FROM artifacts.dashboards
       WHERE id = $1::uuid`,
      [artifactId],
    ))[0]
    if (!dashboard) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
    }
    const source = (await runQuery<DashboardSourceRow>(
      `SELECT
         id::text,
         dashboard_id::text AS dashboard_id,
         version,
         kind,
         source,
         change_summary,
         created_by::text AS created_by,
         created_at
       FROM artifacts.dashboard_sources
       WHERE dashboard_id = $1::uuid
         AND kind = $2::text
         ${version ? 'AND version = $3::int' : ''}
       ORDER BY version DESC
       LIMIT 1`,
      version ? [artifactId, kind, version] : [artifactId, kind],
    ))[0]
    if (!source) {
      throw new ArtifactToolError(404, 'artifact_source_not_found', `versão ${kind} não encontrada`, {
        artifact_id: artifactId,
        kind,
        ...(version ? { version } : {}),
      })
    }
    return buildArtifactResponse(dashboard, source)
  } catch (error) {
    return mapDbError(error)
  }
}

export async function writeDashboardArtifact(input: WriteArtifactInput) {
  const artifactId = toNullableText(input.artifactId)
  const expectedVersion = normalizePositiveInt(input.expectedVersion, 'expected_version')
  const title = toNullableText(input.title)
  const source = normalizeSource(input.source)
  const workspaceId = toNullableText(input.workspaceId)
  const slug = toNullableText(input.slug)
  const metadata = input.metadata == null ? null : toObj(input.metadata)
  const changeSummary = toNullableText(input.changeSummary)
  const chatId = toNullableText(input.chatId)
  const actorId = toNullableText(input.actorId)

  if (!artifactId && !title) {
    throw new ArtifactToolError(400, 'invalid_input', 'title é obrigatório para criar artifact novo')
  }
  if (artifactId && expectedVersion == null) {
    throw new ArtifactToolError(400, 'invalid_input', 'expected_version é obrigatório ao sobrescrever artifact existente')
  }

  try {
    return await withTransaction(async (client) => {
      if (!artifactId) {
        const createdRows = await client.query(
          `INSERT INTO artifacts.dashboards (
             workspace_id,
             created_from_chat_id,
             title,
             slug,
             status,
             current_draft_version,
             metadata,
             created_by,
             updated_by
           ) VALUES (
             $1::uuid,
             $2::text,
             $3::text,
             $4::text,
             'draft',
             1,
             COALESCE($5::jsonb, '{}'::jsonb),
             $6::uuid,
             $6::uuid
           )
           RETURNING
             id::text,
             workspace_id::text AS workspace_id,
             created_from_chat_id,
             title,
             slug,
             status,
             current_draft_version,
             current_published_version,
             thumbnail_data_url,
             metadata,
             created_by::text AS created_by,
             updated_by::text AS updated_by,
             created_at,
             updated_at`,
          [workspaceId, chatId, title, slug, metadata, actorId],
        )
        const dashboard = createdRows.rows[0] as DashboardRow
        await client.query(
          `INSERT INTO artifacts.dashboard_sources (
             dashboard_id,
             version,
             kind,
             source,
             change_summary,
             created_by
           ) VALUES (
             $1::uuid,
             1,
             'draft',
             $2::text,
             $3::text,
             $4::uuid
           )`,
          [dashboard.id, source, changeSummary, actorId],
        )
        const sourceRow = await getDashboardSource(client, dashboard.id, 'draft', 1)
        return {
          ...buildArtifactResponse(dashboard, sourceRow),
          created: true,
          previous_version: null,
          next_version: 1,
        }
      }

      const dashboard = await getDashboardById(client, artifactId, true)
      assertExpectedVersion(dashboard.current_draft_version, expectedVersion as number, artifactId)
      const nextVersion = (dashboard.current_draft_version || 0) + 1

      const updatedRows = await client.query(
        `UPDATE artifacts.dashboards
         SET
           title = COALESCE($2::text, title),
           slug = COALESCE($3::text, slug),
           metadata = CASE WHEN $4::jsonb IS NULL THEN metadata ELSE $4::jsonb END,
           current_draft_version = $5::int,
           updated_by = COALESCE($6::uuid, updated_by),
           updated_at = now()
         WHERE id = $1::uuid
         RETURNING
           id::text,
           workspace_id::text AS workspace_id,
           created_from_chat_id,
           title,
           slug,
           status,
           current_draft_version,
           current_published_version,
           thumbnail_data_url,
           metadata,
           created_by::text AS created_by,
           updated_by::text AS updated_by,
           created_at,
           updated_at`,
        [artifactId, title, slug, metadata, nextVersion, actorId],
      )
      await client.query(
        `INSERT INTO artifacts.dashboard_sources (
           dashboard_id,
           version,
           kind,
           source,
           change_summary,
           created_by
         ) VALUES (
           $1::uuid,
           $2::int,
           'draft',
           $3::text,
           $4::text,
           $5::uuid
         )`,
        [artifactId, nextVersion, source, changeSummary, actorId],
      )

      const updated = updatedRows.rows[0] as DashboardRow
      const sourceRow = await getDashboardSource(client, artifactId, 'draft', nextVersion)
      return {
        ...buildArtifactResponse(updated, sourceRow),
        created: false,
        previous_version: expectedVersion,
        next_version: nextVersion,
      }
    })
  } catch (error) {
    return mapDbError(error)
  }
}

export async function patchDashboardArtifact(input: PatchArtifactInput) {
  const artifactId = toText(input.artifactId)
  if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
  const expectedVersion = normalizePositiveInt(input.expectedVersion, 'expected_version')
  const actorId = toNullableText(input.actorId)
  const operation = input.operation || { type: 'replace_text' as const }
  const operationType = toText(operation.type) as PatchArtifactInput['operation']['type']
  if (operationType !== 'replace_text' && operationType !== 'replace_full_source') {
    throw new ArtifactToolError(400, 'invalid_input', 'operation.type deve ser replace_text ou replace_full_source')
  }

  try {
    return await withTransaction(async (client) => {
      const dashboard = await getDashboardById(client, artifactId, true)
      assertExpectedVersion(dashboard.current_draft_version, expectedVersion as number, artifactId)
      const currentSource = await getDashboardSource(client, artifactId, 'draft', expectedVersion)

      let nextSource = currentSource.source
      let matches = 1
      if (operationType === 'replace_text') {
        const result = applyReplaceTextOperation({
          source: currentSource.source,
          oldString: toText(operation.oldString),
          newString: String(operation.newString ?? ''),
          replaceAll: Boolean(operation.replaceAll),
        })
        nextSource = result.nextSource
        matches = result.matches
      } else {
        nextSource = normalizeSource(operation.source, 'operation.source')
      }

      const nextVersion = (dashboard.current_draft_version || 0) + 1
      const changeSummary = toNullableText(operation.changeSummary)

      await client.query(
        `INSERT INTO artifacts.dashboard_sources (
           dashboard_id,
           version,
           kind,
           source,
           change_summary,
           created_by
         ) VALUES (
           $1::uuid,
           $2::int,
           'draft',
           $3::text,
           $4::text,
           $5::uuid
         )`,
        [artifactId, nextVersion, nextSource, changeSummary, actorId],
      )

      const updatedRows = await client.query(
        `UPDATE artifacts.dashboards
         SET
           current_draft_version = $2::int,
           updated_by = COALESCE($3::uuid, updated_by),
           updated_at = now()
         WHERE id = $1::uuid
         RETURNING
           id::text,
           workspace_id::text AS workspace_id,
           created_from_chat_id,
           title,
           slug,
           status,
           current_draft_version,
           current_published_version,
           thumbnail_data_url,
           metadata,
           created_by::text AS created_by,
           updated_by::text AS updated_by,
           created_at,
           updated_at`,
        [artifactId, nextVersion, actorId],
      )

      const updated = updatedRows.rows[0] as DashboardRow
      const sourceRow = await getDashboardSource(client, artifactId, 'draft', nextVersion)

      return {
        ...buildArtifactResponse(updated, sourceRow),
        operation: operationType,
        previous_version: expectedVersion,
        next_version: nextVersion,
        matches,
      }
    })
  } catch (error) {
    return mapDbError(error)
  }
}

export async function updateDashboardThumbnail(input: UpdateDashboardThumbnailInput) {
  const artifactId = toText(input.artifactId)
  if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')

  const thumbnailDataUrl = input.thumbnailDataUrl == null ? null : toNullableText(input.thumbnailDataUrl)
  const actorId = toNullableText(input.actorId)

  try {
    const rows = await runQuery<{ id: string; thumbnail_data_url: string | null }>(
      `UPDATE artifacts.dashboards
       SET
         thumbnail_data_url = $2::text,
         updated_by = COALESCE($3::uuid, updated_by),
         updated_at = now()
       WHERE id = $1::uuid
       RETURNING
         id::text,
         thumbnail_data_url`,
      [artifactId, thumbnailDataUrl, actorId],
    )

    const row = rows[0] || null
    if (!row) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
    }

    return {
      ok: true,
      artifact_id: row.id,
      thumbnail_data_url: row.thumbnail_data_url,
    }
  } catch (error) {
    return mapDbError(error)
  }
}
