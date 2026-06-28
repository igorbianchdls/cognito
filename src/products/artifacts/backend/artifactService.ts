import {
  ArtifactToolError,
  patchArtifactByType,
  readArtifactByType,
  writeArtifactByType,
  type ArtifactSourceKind,
} from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'

export type { ArtifactKind }

type JsonMap = Record<string, unknown>

type WriteArtifactInput = {
  artifactType: ArtifactKind
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
  artifactType: ArtifactKind
  tenantId: number
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

function assertSupportedArtifactKind(kind: ArtifactKind) {
  if (kind !== 'dashboard' && kind !== 'report' && kind !== 'slide') {
    throw new ArtifactToolError(400, 'unsupported_artifact_type', `artifact_type não suportado: ${kind}`)
  }
}

export async function readArtifact(input: {
  artifactType: ArtifactKind
  artifactId: string
  tenantId: number
  kind?: ArtifactSourceKind
  version?: number | null
}) {
  assertSupportedArtifactKind(input.artifactType)
  return readArtifactByType({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    kind: input.kind,
    version: input.version,
  })
}

export async function writeArtifact(input: WriteArtifactInput) {
  assertSupportedArtifactKind(input.artifactType)
  return writeArtifactByType({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    title: input.title,
    source: input.source,
    workspaceId: input.workspaceId,
    slug: input.slug,
    metadata: input.metadata,
    changeSummary: input.changeSummary,
    chatId: input.chatId,
    actorId: input.actorId,
  })
}

export async function patchArtifact(input: PatchArtifactInput) {
  assertSupportedArtifactKind(input.artifactType)
  return patchArtifactByType({
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    operation: input.operation,
    actorId: input.actorId,
  })
}
