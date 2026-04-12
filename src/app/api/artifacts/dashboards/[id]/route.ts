import { NextRequest } from 'next/server'

import { ArtifactToolError, writeDashboardArtifact } from '@/products/artifacts/backend/dashboardArtifactsService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>

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
