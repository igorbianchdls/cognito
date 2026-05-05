import { NextRequest } from 'next/server'

import {
  ArtifactToolError,
  deleteDashboardArtifact,
  listDashboardSourceVersions,
  readDashboardArtifact,
  renameDashboardArtifact,
  updateDashboardThumbnail,
  writeDashboardArtifact,
} from '@/products/artifacts/backend/dashboardArtifactsService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const url = new URL(req.url)
    const rawVersion = url.searchParams.get('version')
    const version = rawVersion && Number.isInteger(Number(rawVersion)) && Number(rawVersion) > 0
      ? Number(rawVersion)
      : undefined

    const [artifact, versions] = await Promise.all([
      readDashboardArtifact({ artifactId: id, kind: 'draft', ...(version ? { version } : {}) }),
      listDashboardSourceVersions(id, 'draft'),
    ])

    return Response.json({
      ok: true,
      artifact,
      versions,
    })
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Erro interno ao carregar dashboard',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(payload.action ?? '').trim().toLowerCase()

    if (action === 'rename') {
      const result = await renameDashboardArtifact({
        artifactId: id,
        title: payload.title == null ? '' : String(payload.title),
        actorId: null,
      })
      return Response.json({ ok: true, ...result })
    }

    const result = await writeDashboardArtifact({
      artifactId: id,
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

    return Response.json({ ok: true, artifact: result })
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Erro interno ao salvar dashboard',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(payload.action ?? '').trim().toLowerCase()

    if (action !== 'update-thumbnail') {
      return Response.json(
        {
          ok: false,
          error: 'Ação POST não suportada para este endpoint',
        },
        { status: 400 },
      )
    }

    const result = await updateDashboardThumbnail({
      artifactId: id,
      thumbnailDataUrl: payload.thumbnail_data_url == null ? null : String(payload.thumbnail_data_url),
      actorId: null,
    })

    return Response.json(result)
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Erro interno ao atualizar thumbnail do dashboard',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const result = await deleteDashboardArtifact({ artifactId: id })
    return Response.json({ ok: true, ...result })
  } catch (error) {
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
        error: error instanceof Error ? error.message : 'Erro interno ao apagar dashboard',
      },
      { status: 500 },
    )
  }
}
