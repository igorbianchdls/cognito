import {
  deleteDashboardArtifact,
  listDashboards,
  patchDashboardArtifact,
  readDashboardArtifact,
  writeDashboardArtifact,
  type ArtifactSourceKind,
  type DashboardListItem,
} from '@/products/artifacts/backend/dashboardArtifactsService'

export type McpJsonMap = Record<string, unknown>

export type McpDashboardListInput = {
  limit?: number | null
}

export type McpDashboardReadInput = {
  artifactId: string
  kind?: ArtifactSourceKind
  version?: number | null
}

export type McpDashboardCreateInput = {
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
  artifactId: string
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

function withDashboardUrl<T extends { artifact_id: string }>(artifact: T) {
  return {
    ...artifact,
    url: buildDashboardArtifactUrl(artifact.artifact_id),
  }
}

function withListDashboardUrl(dashboard: DashboardListItem) {
  return {
    ...dashboard,
    url: buildDashboardArtifactUrl(dashboard.id),
  }
}

export async function listMcpDashboards(input: McpDashboardListInput = {}) {
  const dashboards = await listDashboards(input.limit ?? 100)
  return dashboards.map(withListDashboardUrl)
}

export async function readMcpDashboard(input: McpDashboardReadInput) {
  const artifact = await readDashboardArtifact({
    artifactId: input.artifactId,
    kind: input.kind,
    version: input.version,
  })

  return withDashboardUrl(artifact)
}

export async function createMcpDashboard(input: McpDashboardCreateInput) {
  const artifact = await writeDashboardArtifact({
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

export async function updateMcpDashboardFull(input: McpDashboardUpdateFullInput) {
  const artifact = await writeDashboardArtifact({
    artifactId: input.artifactId,
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

export async function patchMcpDashboard(input: McpDashboardPatchInput) {
  const artifact = await patchDashboardArtifact({
    artifactId: input.artifactId,
    expectedVersion: input.expectedVersion,
    operation: input.operation,
    actorId: input.actorId,
  })

  return withDashboardUrl(artifact)
}

export async function deleteMcpDashboard(input: McpDashboardDeleteInput) {
  return deleteDashboardArtifact({
    artifactId: input.artifactId,
  })
}

