import { NextRequest } from 'next/server'

import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'
import {
  ArtifactToolError,
  deleteArtifact,
  listArtifactsByType,
  listArtifactSourceVersions,
  readArtifactByType,
  renameArtifact,
  updateArtifactThumbnail,
  writeArtifactByType,
} from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

function artifactErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ArtifactToolError) {
    return Response.json(
      {
        ok: false,
        code: error.code,
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    )
  }

  return Response.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallback,
    },
    { status: 500 },
  )
}

export async function listArtifactsApi(req: Request, artifactType: ArtifactKind) {
  try {
    const url = new URL(req.url)
    const tenant = await resolveAuthTenant({ access: 'read' })
    if (!tenant) return Response.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    const rawLimit = Number(url.searchParams.get('limit') || '100')
    const artifacts = await listArtifactsByType(artifactType, rawLimit, tenant.tenantId)
    return Response.json({
      ok: true,
      count: artifacts.length,
      artifacts,
      dashboards: artifactType === 'dashboard' ? artifacts : undefined,
    })
  } catch (error) {
    return artifactErrorResponse(error, 'Erro interno ao listar artifacts')
  }
}

export async function getArtifactApi(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  artifactType: ArtifactKind,
) {
  try {
    const tenant = await resolveAuthTenant({ access: 'read' })
    if (!tenant) return Response.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    const { id } = await context.params
    const url = new URL(req.url)
    const rawVersion = url.searchParams.get('version')
    const version = rawVersion && Number.isInteger(Number(rawVersion)) && Number(rawVersion) > 0
      ? Number(rawVersion)
      : undefined

    const [artifact, versions] = await Promise.all([
      readArtifactByType({ artifactType, artifactId: id, tenantId: tenant.tenantId, kind: 'draft', ...(version ? { version } : {}) }),
      listArtifactSourceVersions(artifactType, id, 'draft', 100, tenant.tenantId),
    ])

    return Response.json({
      ok: true,
      artifact,
      dashboard: artifactType === 'dashboard' ? artifact : undefined,
      versions,
    })
  } catch (error) {
    return artifactErrorResponse(error, 'Erro interno ao carregar artifact')
  }
}

export async function patchArtifactApi(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  artifactType: ArtifactKind,
) {
  try {
    const tenant = await resolveAuthTenant({ access: 'manage' })
    if (!tenant) return Response.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(payload.action ?? '').trim().toLowerCase()

    if (action === 'rename') {
      const result = await renameArtifact({
        artifactType,
        artifactId: id,
        tenantId: tenant.tenantId,
        title: payload.title == null ? '' : String(payload.title),
        actorId: null,
      })
      return Response.json({ ok: true, ...result })
    }

    const result = await writeArtifactByType({
      artifactType,
      artifactId: id,
      tenantId: tenant.tenantId,
      expectedVersion: payload.expected_version == null ? null : Number(payload.expected_version),
      title: payload.title == null ? null : String(payload.title),
      source: String(payload.source ?? ''),
      slug: payload.slug == null ? null : String(payload.slug),
      metadata:
        payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? (payload.metadata as Record<string, unknown>)
          : null,
      changeSummary: payload.change_summary == null ? null : String(payload.change_summary),
      actorId: null,
    })

    return Response.json({ ok: true, artifact: result, dashboard: artifactType === 'dashboard' ? result : undefined })
  } catch (error) {
    return artifactErrorResponse(error, 'Erro interno ao salvar artifact')
  }
}

export async function updateArtifactThumbnailApi(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  artifactType: ArtifactKind,
) {
  try {
    const tenant = await resolveAuthTenant({ access: 'manage' })
    if (!tenant) return Response.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(payload.action ?? '').trim().toLowerCase()

    if (action !== 'update-thumbnail') {
      return Response.json({ ok: false, error: 'Ação POST não suportada para este endpoint' }, { status: 400 })
    }

    const result = await updateArtifactThumbnail({
      artifactType,
      artifactId: id,
      tenantId: tenant.tenantId,
      thumbnailDataUrl: payload.thumbnail_data_url == null ? null : String(payload.thumbnail_data_url),
      actorId: null,
    })

    return Response.json(result)
  } catch (error) {
    return artifactErrorResponse(error, 'Erro interno ao atualizar thumbnail do artifact')
  }
}

export async function deleteArtifactApi(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
  artifactType: ArtifactKind,
) {
  try {
    const tenant = await resolveAuthTenant({ access: 'manage' })
    if (!tenant) return Response.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    const { id } = await context.params
    const result = await deleteArtifact({ artifactType, artifactId: id, tenantId: tenant.tenantId })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return artifactErrorResponse(error, 'Erro interno ao apagar artifact')
  }
}
