import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { ArtifactToolError, writeDashboardArtifact } from '@/products/artifacts/backend/dashboardArtifactsService'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

function unauthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

function toolErrorJson(status: number, code: string, error: string, details?: Record<string, unknown>) {
  return Response.json(
    {
      ok: false,
      success: false,
      data: null,
      error,
      code,
      ...(details ? { details } : {}),
      meta: { tool: 'artifact_write', action: 'write', status },
      result: { success: false, error, code, ...(details ? { details } : {}) },
    },
    { status },
  )
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para artifact_write')
    }
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const chatId = req.headers.get('x-chat-id') || ''
    const result = await writeDashboardArtifact({
      artifactId: payload.artifact_id == null ? null : String(payload.artifact_id),
      expectedVersion: payload.expected_version == null ? null : Number(payload.expected_version),
      title: payload.title == null ? null : String(payload.title),
      source: String(payload.source ?? ''),
      workspaceId: payload.workspace_id == null ? null : String(payload.workspace_id),
      slug: payload.slug == null ? null : String(payload.slug),
      metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : null,
      changeSummary: payload.change_summary == null ? null : String(payload.change_summary),
      chatId,
      actorId: null,
    })

    return Response.json({
      ok: true,
      success: true,
      data: result,
      meta: { tool: 'artifact_write', action: 'write', status: 200 },
      result,
    })
  } catch (error) {
    if (error instanceof ArtifactToolError) {
      return toolErrorJson(error.status, error.code, error.message, error.details)
    }
    const message = error instanceof Error ? error.message : 'Erro interno ao escrever artifact'
    return toolErrorJson(500, 'artifact_write_error', message)
  }
}
