import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import {
  ArtifactToolError,
  patchDashboardArtifact,
  readDashboardArtifact,
  writeDashboardArtifact,
  type ArtifactSourceKind,
} from '@/products/artifacts/backend/dashboardArtifactsService'

export type ArtifactKind = 'dashboard' | 'report' | 'slide'
type JsonMap = Record<string, unknown>

type ArtifactRow = {
  id: string
  artifact_type: ArtifactKind
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

type ArtifactSourceRow = {
  id: string
  artifact_id: string
  version: number
  kind: ArtifactSourceKind
  source: string
  change_summary: string | null
  created_by: string | null
  created_at: string
}

type WriteArtifactInput = {
  artifactType: ArtifactKind
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
  artifactType: ArtifactKind
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

function buildArtifactResponse(artifact: ArtifactRow, source: ArtifactSourceRow) {
  return {
    success: true,
    artifact_id: artifact.id,
    artifact_type: artifact.artifact_type,
    title: artifact.title,
    slug: artifact.slug,
    status: artifact.status,
    workspace_id: artifact.workspace_id,
    created_from_chat_id: artifact.created_from_chat_id,
    current_draft_version: artifact.current_draft_version,
    current_published_version: artifact.current_published_version,
    thumbnail_data_url: artifact.thumbnail_data_url,
    metadata: toObj(artifact.metadata),
    source_kind: source.kind,
    version: source.version,
    source: source.source,
    change_summary: source.change_summary,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  }
}

async function getArtifactById(
  client: Pick<SQLClient, 'query'>,
  artifactId: string,
  artifactType: ArtifactKind,
  forUpdate = false,
) {
  const rows = await client.query(
    `SELECT
       id::text,
       artifact_type,
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
     FROM artifacts.artifacts
     WHERE id = $1::uuid
       AND artifact_type = $2::text
     ${forUpdate ? 'FOR UPDATE' : ''}`,
    [artifactId, artifactType],
  )
  const row = (rows.rows?.[0] || null) as ArtifactRow | null
  if (!row) {
    throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', {
      artifact_id: artifactId,
      artifact_type: artifactType,
    })
  }
  return row
}

async function getArtifactSource(
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
       artifact_id::text AS artifact_id,
       version,
       kind,
       source,
       change_summary,
       created_by::text AS created_by,
       created_at
     FROM artifacts.artifact_sources
     WHERE artifact_id = $1::uuid
       AND kind = $2::text
       ${versionClause}
     ORDER BY version DESC
     LIMIT 1`,
    params,
  )
  const row = (rows.rows?.[0] || null) as ArtifactSourceRow | null
  if (!row) {
    throw new ArtifactToolError(404, 'artifact_source_not_found', `versão ${kind} não encontrada`, {
      artifact_id: artifactId,
      kind,
      ...(version ? { version } : {}),
    })
  }
  return row
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

  return {
    nextSource: replaceAll ? source.split(oldString).join(newString) : source.replace(oldString, newString),
    matches: occurrences,
  }
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

export async function readArtifact(input: {
  artifactType: ArtifactKind
  artifactId: string
  kind?: ArtifactSourceKind
  version?: number | null
}) {
  if (input.artifactType === 'dashboard') {
    return readDashboardArtifact({
      artifactId: input.artifactId,
      kind: input.kind,
      version: input.version,
    })
  }

  try {
    const artifactId = toText(input.artifactId)
    if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
    const kind = input.kind === 'published' ? 'published' : 'draft'
    const version = normalizePositiveInt(input.version, 'version')
    const artifact = (await runQuery<ArtifactRow>(
      `SELECT
         id::text,
         artifact_type,
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
       FROM artifacts.artifacts
       WHERE id = $1::uuid
         AND artifact_type = $2::text`,
      [artifactId, input.artifactType],
    ))[0]
    if (!artifact) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', {
        artifact_id: artifactId,
        artifact_type: input.artifactType,
      })
    }
    const source = (await runQuery<ArtifactSourceRow>(
      `SELECT
         id::text,
         artifact_id::text AS artifact_id,
         version,
         kind,
         source,
         change_summary,
         created_by::text AS created_by,
         created_at
       FROM artifacts.artifact_sources
       WHERE artifact_id = $1::uuid
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
    return buildArtifactResponse(artifact, source)
  } catch (error) {
    return mapDbError(error)
  }
}

export async function writeArtifact(input: WriteArtifactInput) {
  if (input.artifactType === 'dashboard') {
    return writeDashboardArtifact(input)
  }

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
          `INSERT INTO artifacts.artifacts (
             artifact_type,
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
             $1::text,
             $2::uuid,
             $3::text,
             $4::text,
             $5::text,
             'draft',
             1,
             COALESCE($6::jsonb, '{}'::jsonb),
             $7::uuid,
             $7::uuid
           )
           RETURNING
             id::text,
             artifact_type,
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
          [input.artifactType, workspaceId, chatId, title, slug, metadata, actorId],
        )
        const artifact = createdRows.rows[0] as ArtifactRow
        await client.query(
          `INSERT INTO artifacts.artifact_sources (
             artifact_id,
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
          [artifact.id, source, changeSummary, actorId],
        )
        const sourceRow = await getArtifactSource(client, artifact.id, 'draft', 1)
        return {
          ...buildArtifactResponse(artifact, sourceRow),
          created: true,
          previous_version: null,
          next_version: 1,
        }
      }

      const artifact = await getArtifactById(client, artifactId, input.artifactType, true)
      assertExpectedVersion(artifact.current_draft_version, expectedVersion as number, artifactId)
      const nextVersion = (artifact.current_draft_version || 0) + 1
      const updatedRows = await client.query(
        `UPDATE artifacts.artifacts
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
           artifact_type,
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
        `INSERT INTO artifacts.artifact_sources (
           artifact_id,
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

      const updated = updatedRows.rows[0] as ArtifactRow
      const sourceRow = await getArtifactSource(client, artifactId, 'draft', nextVersion)
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

export async function patchArtifact(input: PatchArtifactInput) {
  if (input.artifactType === 'dashboard') {
    return patchDashboardArtifact(input)
  }

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
      const artifact = await getArtifactById(client, artifactId, input.artifactType, true)
      assertExpectedVersion(artifact.current_draft_version, expectedVersion as number, artifactId)
      const currentSource = await getArtifactSource(client, artifactId, 'draft', expectedVersion)

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

      const nextVersion = (artifact.current_draft_version || 0) + 1
      const changeSummary = toNullableText(operation.changeSummary)
      await client.query(
        `INSERT INTO artifacts.artifact_sources (
           artifact_id,
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
        `UPDATE artifacts.artifacts
         SET
           current_draft_version = $2::int,
           updated_by = COALESCE($3::uuid, updated_by),
           updated_at = now()
         WHERE id = $1::uuid
         RETURNING
           id::text,
           artifact_type,
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

      const updated = updatedRows.rows[0] as ArtifactRow
      const sourceRow = await getArtifactSource(client, artifactId, 'draft', nextVersion)
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
