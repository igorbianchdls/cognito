import {
  readArtifact,
  writeArtifact,
  patchArtifact,
  type ArtifactKind,
} from '@/products/artifacts/backend/artifactService'
import {
  deleteDashboardArtifact,
  listDashboards,
  patchDashboardArtifact,
  readDashboardArtifact,
  writeDashboardArtifact,
  type ArtifactSourceKind,
  type DashboardListItem,
} from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'

export type McpJsonMap = Record<string, unknown>
export type McpArtifactKind = ArtifactKind
export type McpArtifactListKind = McpArtifactKind

export type McpDashboardListInput = {
  tenantId?: number | null
  limit?: number | null
}

export type McpArtifactListInput = {
  tenantId?: number | null
  kind?: McpArtifactListKind | null
  limit?: number | null
}

export type McpArtifactListItem = Omit<DashboardListItem, 'id' | 'thumbnail_data_url'> & {
  id: string
  artifact_type: McpArtifactKind
  thumbnail_data_url?: string | null
  has_thumbnail: boolean
  url: string
}

export type McpDashboardReadInput = {
  tenantId?: number | null
  artifactId: string
  kind?: ArtifactSourceKind
  version?: number | null
}

export type McpDashboardCreateInput = {
  tenantId?: number | null
  title: string
  source: string
  workspaceId?: string | null
  slug?: string | null
  metadata?: McpJsonMap | null
  changeSummary?: string | null
  chatId?: string | null
  actorId?: string | null
}

export type McpDashboardUpdateFullInput = {
  tenantId?: number | null
  artifactId: string
  expectedVersion: number
  source: string
  title?: string | null
  slug?: string | null
  metadata?: McpJsonMap | null
  changeSummary?: string | null
  actorId?: string | null
}

export type McpDashboardPatchInput = {
  tenantId?: number | null
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

export type McpDashboardDeleteInput = {
  tenantId?: number | null
  artifactId: string
}

export type McpArtifactReadInput = {
  tenantId?: number | null
  artifactType: McpArtifactKind
  artifactId: string
  kind?: ArtifactSourceKind
  version?: number | null
}

export type McpArtifactCreateInput = {
  tenantId?: number | null
  artifactType: McpArtifactKind
  title: string
  source: string
  workspaceId?: string | null
  slug?: string | null
  metadata?: McpJsonMap | null
  changeSummary?: string | null
  chatId?: string | null
  actorId?: string | null
}

export type McpArtifactUpdateFullInput = Omit<McpArtifactCreateInput, 'title'> & {
  artifactId: string
  expectedVersion: number
  title?: string | null
}

export type McpArtifactPatchInput = {
  tenantId?: number | null
  artifactType: McpArtifactKind
  artifactId: string
  expectedVersion: number
  operation: McpDashboardPatchInput['operation']
  actorId?: string | null
}

function getCognitoBaseUrl() {
  const explicitBaseUrl = String(
    process.env.COGNITO_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '',
  ).trim()
  if (explicitBaseUrl) return explicitBaseUrl.replace(/\/+$/, '')

  const vercelUrl = String(process.env.VERCEL_URL || '').trim()
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, '')}`

  return ''
}

export function buildDashboardArtifactUrl(artifactId: string) {
  const path = `/artifacts/dashboards/${artifactId}`
  const baseUrl = getCognitoBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}

export function buildArtifactUrl(artifactType: McpArtifactKind, artifactId: string) {
  void artifactType
  const path = `/artifacts/dashboards/${artifactId}`
  const baseUrl = getCognitoBaseUrl()
  return baseUrl ? `${baseUrl}${path}` : path
}

function withDashboardUrl<T extends { artifact_id: string }>(artifact: T) {
  return {
    ...artifact,
    url: buildDashboardArtifactUrl(artifact.artifact_id),
  }
}

function withListDashboardUrl(dashboard: DashboardListItem) {
  const { thumbnail_data_url: thumbnailDataUrl, ...dashboardWithoutThumbnail } = dashboard
  return {
    ...dashboardWithoutThumbnail,
    artifact_type: 'dashboard' as const,
    has_thumbnail: Boolean(thumbnailDataUrl),
    thumbnail_data_url: thumbnailDataUrl || null,
    url: buildDashboardArtifactUrl(dashboard.id),
  }
}

function isArtifactListKind(value: unknown): value is McpArtifactListKind {
  return value === 'dashboard'
}

function normalizeArtifactListKind(value: unknown): McpArtifactListKind {
  return isArtifactListKind(value) ? value : 'dashboard'
}

function normalizeListLimit(value: unknown) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 100
  return Math.min(parsed, 200)
}

export async function listMcpDashboards(input: McpDashboardListInput = {}) {
  const dashboards = await listDashboards(input.limit ?? 100, input.tenantId)
  return dashboards.map(withListDashboardUrl)
}

export async function listMcpArtifacts(input: McpArtifactListInput = {}) {
  const kind = normalizeArtifactListKind(input.kind)
  const limit = normalizeListLimit(input.limit)

  void kind
  return listMcpDashboards({ limit, tenantId: input.tenantId })
}

export async function readMcpDashboard(input: McpDashboardReadInput) {
  const artifact = await readDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    kind: input.kind,
    version: input.version,
  })

  return withDashboardUrl(artifact)
}

function withArtifactUrl<T extends { artifact_id: string; artifact_type?: string }>(artifact: T) {
  return {
    ...artifact,
    url: buildArtifactUrl('dashboard', artifact.artifact_id),
  }
}

export async function readMcpArtifact(input: McpArtifactReadInput) {
  const artifact = await readArtifact({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    kind: input.kind,
    version: input.version,
  })

  return withArtifactUrl(artifact)
}

export async function createMcpDashboard(input: McpDashboardCreateInput) {
  const artifact = await writeDashboardArtifact({
    tenantId: input.tenantId,
    title: input.title,
    source: input.source,
    workspaceId: input.workspaceId,
    slug: input.slug,
    metadata: input.metadata,
    changeSummary: input.changeSummary,
    chatId: input.chatId,
    actorId: input.actorId,
  })

  return withDashboardUrl(artifact)
}

export async function createMcpArtifact(input: McpArtifactCreateInput) {
  const artifact = await writeArtifact({
    artifactType: input.artifactType,
    tenantId: input.tenantId,
    title: input.title,
    source: input.source,
    workspaceId: input.workspaceId,
    slug: input.slug,
    metadata: input.metadata,
    changeSummary: input.changeSummary,
    chatId: input.chatId,
    actorId: input.actorId,
  })

  return withArtifactUrl(artifact)
}

export async function updateMcpDashboardFull(input: McpDashboardUpdateFullInput) {
  const artifact = await writeDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    title: input.title,
    source: input.source,
    slug: input.slug,
    metadata: input.metadata,
    changeSummary: input.changeSummary,
    actorId: input.actorId,
  })

  return withDashboardUrl(artifact)
}

export async function updateMcpArtifactFull(input: McpArtifactUpdateFullInput) {
  const artifact = await writeArtifact({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    title: input.title,
    source: input.source,
    slug: input.slug,
    metadata: input.metadata,
    changeSummary: input.changeSummary,
    actorId: input.actorId,
  })

  return withArtifactUrl(artifact)
}

export async function patchMcpDashboard(input: McpDashboardPatchInput) {
  const artifact = await patchDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    operation: input.operation,
    actorId: input.actorId,
  })

  return withDashboardUrl(artifact)
}

export async function patchMcpArtifact(input: McpArtifactPatchInput) {
  const artifact = await patchArtifact({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    operation: input.operation,
    actorId: input.actorId,
  })

  return withArtifactUrl(artifact)
}

export async function deleteMcpDashboard(input: McpDashboardDeleteInput) {
  return deleteDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
  })
}
