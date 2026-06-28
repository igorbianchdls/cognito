import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'

type JsonMap = Record<string, unknown>

export type ArtifactSourceKind = 'draft' | 'published'

export type ArtifactListItem = {
  id: string
  artifact_type: ArtifactKind
  tenant_id: number | null
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

export type DashboardListItem = ArtifactListItem

export type DashboardSourceVersionListItem = {
  version: number
  kind: ArtifactSourceKind
  change_summary: string | null
  created_at: string
}

type ArtifactRow = {
  id: string
  artifact_type: ArtifactKind
  tenant_id: number | null
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

type DashboardRow = ArtifactRow

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

type DashboardSourceRow = ArtifactSourceRow

type ReadArtifactInput = {
  artifactType?: ArtifactKind
  artifactId: string
  tenantId: number
  kind?: ArtifactSourceKind
  version?: number | null
}

type WriteArtifactInput = {
  artifactType?: ArtifactKind
  tenantId: number
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
  artifactType?: ArtifactKind
  artifactId: string
  tenantId: number
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

type UpdateArtifactThumbnailInput = {
  artifactType?: ArtifactKind
  artifactId: string
  tenantId: number
  thumbnailDataUrl?: string | null
  actorId?: string | null
}

type UpdateDashboardThumbnailInput = UpdateArtifactThumbnailInput

function normalizeArtifactType(value: unknown): ArtifactKind {
  const artifactType = String(value || 'dashboard').trim()
  if (artifactType === 'dashboard' || artifactType === 'report' || artifactType === 'slide') return artifactType
  throw new ArtifactToolError(400, 'unsupported_artifact_type', `artifact_type não suportado: ${artifactType}`)
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

function normalizeTenantId(value: unknown): number | null {
  if (value == null || value === '') return null
  const tenantId = Number(value)
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new ArtifactToolError(400, 'invalid_input', 'tenant_id deve ser inteiro positivo')
  }
  return tenantId
}

function normalizeSource(value: unknown, field = 'source'): string {
  const source = String(value ?? '')
  if (!source.trim()) {
    throw new ArtifactToolError(400, 'invalid_input', `${field} é obrigatório`)
  }
  return source
}

async function getArtifactById(
  client: Pick<SQLClient, 'query'>,
  artifactType: ArtifactKind,
  artifactId: string,
  forUpdate = false,
  tenantId: number,
) {
  const rows = await client.query(
    `SELECT
       id::text,
       artifact_type,
       tenant_id,
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
       AND tenant_id = $3::bigint
     ${forUpdate ? 'FOR UPDATE' : ''}`,
    [artifactId, artifactType, tenantId],
  )
  const row = (rows.rows?.[0] || null) as ArtifactRow | null
  if (!row) {
    throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
  }
  return row
}

async function getDashboardById(
  client: Pick<SQLClient, 'query'>,
  artifactId: string,
  forUpdate = false,
  tenantId: number,
) {
  return getArtifactById(client, 'dashboard', artifactId, forUpdate, tenantId)
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

function buildArtifactResponse(artifact: ArtifactRow, source: ArtifactSourceRow) {
  return {
    success: true,
    artifact_id: artifact.id,
    artifact_type: artifact.artifact_type,
    tenant_id: artifact.tenant_id,
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

export async function listArtifactsByType(
  artifactType: ArtifactKind,
  limit = 100,
  tenantId: number,
): Promise<ArtifactListItem[]> {
  const normalizedArtifactType = normalizeArtifactType(artifactType)
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100
  try {
    return await runQuery<ArtifactListItem>(
      `SELECT
         id::text,
         artifact_type,
         tenant_id,
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
       FROM artifacts.artifacts
       WHERE artifact_type = $2::text
         AND tenant_id = $3::bigint
       ORDER BY updated_at DESC, created_at DESC
       LIMIT $1::int`,
      [safeLimit, normalizedArtifactType, tenantId],
    )
  } catch (error) {
    return mapDbError(error)
  }
}

export async function listDashboards(limit = 100, tenantId: number): Promise<DashboardListItem[]> {
  return listArtifactsByType('dashboard', limit, tenantId)
}

export async function renameArtifact(input: {
  artifactType: ArtifactKind
  artifactId: string
  title: string
  tenantId: number
  actorId?: string | null
}) {
  const artifactType = normalizeArtifactType(input.artifactType)
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
    const rows = await runQuery<ArtifactListItem>(
      `UPDATE artifacts.artifacts
       SET
         title = $2::text,
         updated_by = COALESCE($3::uuid, updated_by),
         updated_at = now()
       WHERE id = $1::uuid
         AND artifact_type = $4::text
         AND tenant_id = $5::bigint
       RETURNING
         id::text,
         artifact_type,
         tenant_id,
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
      [artifactId, title, actorId, artifactType, input.tenantId],
    )
    const row = rows[0] || null
    if (!row) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
    }
    return {
      success: true,
      artifact: row,
      dashboard: row,
    }
  } catch (error) {
    return mapDbError(error)
  }
}

export async function renameDashboardArtifact(input: {
  artifactId: string
  title: string
  tenantId: number
  actorId?: string | null
}) {
  return renameArtifact({ ...input, artifactType: 'dashboard' })
}

export async function deleteArtifact(input: {
  artifactType: ArtifactKind
  artifactId: string
  tenantId: number
}) {
  const artifactType = normalizeArtifactType(input.artifactType)
  const artifactId = toText(input.artifactId)
  if (!artifactId) {
    throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
  }

  try {
    return await withTransaction(async (client) => {
      const rows = await client.query(
        `DELETE FROM artifacts.artifacts
         WHERE id = $1::uuid
           AND artifact_type = $2::text
           AND tenant_id = $3::bigint
         RETURNING id::text AS id, title, artifact_type`,
        [artifactId, artifactType, input.tenantId],
      )
      const row = rows.rows?.[0] as { id: string; title: string; artifact_type: ArtifactKind } | undefined
      if (!row) {
        throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
      }

      return {
        success: true,
        deleted_artifact_id: row.id,
        deleted_artifact_title: row.title,
        deleted_artifact_type: row.artifact_type,
        deleted_dashboard_id: row.id,
        deleted_dashboard_title: row.title,
      }
    })
  } catch (error) {
    return mapDbError(error)
  }
}

export async function deleteDashboardArtifact(input: {
  artifactId: string
  tenantId: number
}) {
  return deleteArtifact({ ...input, artifactType: 'dashboard' })
}

export async function listArtifactSourceVersions(
  artifactType: ArtifactKind,
  artifactId: string,
  kind: ArtifactSourceKind = 'draft',
  limit = 100,
  tenantId: number,
): Promise<DashboardSourceVersionListItem[]> {
  const normalizedArtifactType = normalizeArtifactType(artifactType)
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
       FROM artifacts.artifact_sources
       WHERE artifact_id = $1::uuid
         AND kind = $2::text
         AND EXISTS (
           SELECT 1
           FROM artifacts.artifacts artifact
           WHERE artifact.id = artifact_id
             AND artifact.artifact_type = $4::text
             AND artifact.tenant_id = $5::bigint
         )
       ORDER BY version DESC
       LIMIT $3::int`,
      [normalizedArtifactId, kind, safeLimit, normalizedArtifactType, tenantId],
    )
  } catch (error) {
    return mapDbError(error)
  }
}

export async function listDashboardSourceVersions(
  artifactId: string,
  kind: ArtifactSourceKind = 'draft',
  limit = 100,
  tenantId: number,
): Promise<DashboardSourceVersionListItem[]> {
  return listArtifactSourceVersions('dashboard', artifactId, kind, limit, tenantId)
}

export async function readArtifactByType(input: ReadArtifactInput) {
  try {
    const artifactType = normalizeArtifactType(input.artifactType)
    const artifactId = toText(input.artifactId)
    if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')
    const kind = input.kind === 'published' ? 'published' : 'draft'
    const version = normalizePositiveInt(input.version, 'version')
    const artifact = (await runQuery<ArtifactRow>(
      `SELECT
         id::text,
         artifact_type,
         tenant_id,
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
         AND tenant_id = $3::bigint`,
      [artifactId, artifactType, input.tenantId],
    ))[0]
    if (!artifact) {
      throw new ArtifactToolError(404, 'artifact_not_found', 'artifact não encontrado', { artifact_id: artifactId })
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

export async function readDashboardArtifact(input: ReadArtifactInput) {
  return readArtifactByType({ ...input, artifactType: 'dashboard' })
}

export async function writeArtifactByType(input: WriteArtifactInput) {
  const artifactType = normalizeArtifactType(input.artifactType)
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
  const tenantId = normalizeTenantId(input.tenantId)
  if (tenantId == null) {
    throw new ArtifactToolError(400, 'artifact_tenant_required', `tenant_id é obrigatório para ${artifactType}`)
  }

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
             tenant_id,
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
             $8::text,
             $1::bigint,
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
             tenant_id,
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
          [tenantId, workspaceId, chatId, title, slug, metadata, actorId, artifactType],
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
        const sourceRow = await getDashboardSource(client, artifact.id, 'draft', 1)
        return {
          ...buildArtifactResponse(artifact, sourceRow),
          created: true,
          previous_version: null,
          next_version: 1,
        }
      }

      const artifact = await getArtifactById(client, artifactType, artifactId, true, tenantId)
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
           AND artifact_type = $7::text
         RETURNING
           id::text,
           artifact_type,
           tenant_id,
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
        [artifactId, title, slug, metadata, nextVersion, actorId, artifactType],
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

export async function writeDashboardArtifact(input: WriteArtifactInput) {
  return writeArtifactByType({ ...input, artifactType: 'dashboard' })
}

export async function patchArtifactByType(input: PatchArtifactInput) {
  const artifactType = normalizeArtifactType(input.artifactType)
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
      const artifact = await getArtifactById(client, artifactType, artifactId, true, input.tenantId)
      assertExpectedVersion(artifact.current_draft_version, expectedVersion as number, artifactId)
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
           AND artifact_type = $4::text
         RETURNING
           id::text,
           artifact_type,
           tenant_id,
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
        [artifactId, nextVersion, actorId, artifactType],
      )

      const updated = updatedRows.rows[0] as ArtifactRow
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

export async function patchDashboardArtifact(input: PatchArtifactInput) {
  return patchArtifactByType({ ...input, artifactType: 'dashboard' })
}

export async function updateArtifactThumbnail(input: UpdateArtifactThumbnailInput) {
  const artifactType = normalizeArtifactType(input.artifactType)
  const artifactId = toText(input.artifactId)
  if (!artifactId) throw new ArtifactToolError(400, 'invalid_input', 'artifact_id é obrigatório')

  const thumbnailDataUrl = input.thumbnailDataUrl == null ? null : toNullableText(input.thumbnailDataUrl)
  const actorId = toNullableText(input.actorId)

  try {
    const rows = await runQuery<{ id: string; thumbnail_data_url: string | null }>(
      `UPDATE artifacts.artifacts
       SET
         thumbnail_data_url = $2::text,
         updated_by = COALESCE($3::uuid, updated_by),
         updated_at = now()
       WHERE id = $1::uuid
         AND artifact_type = $4::text
         AND tenant_id = $5::bigint
       RETURNING
         id::text,
         thumbnail_data_url`,
      [artifactId, thumbnailDataUrl, actorId, artifactType, input.tenantId],
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

export async function updateDashboardThumbnail(input: UpdateDashboardThumbnailInput) {
  return updateArtifactThumbnail({ ...input, artifactType: 'dashboard' })
}
