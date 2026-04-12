import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { ArtifactToolError, readDashboardArtifact } from '@/products/artifacts/backend/dashboardArtifactsService'

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
      meta: { tool: 'artifact_read', action: 'read', status },
      result: { success: false, error, code, ...(details ? { details } : {}) },
    },
    { status },
  )
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para artifact_read')
    }
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const result = await readDashboardArtifact({
      artifactId: String(payload.artifact_id ?? ''),
      kind: payload.kind === 'published' ? 'published' : 'draft',
      version: payload.version == null ? null : Number(payload.version),
    })

    return Response.json({
      ok: true,
      success: true,
      data: result,
      meta: { tool: 'artifact_read', action: 'read', status: 200 },
      result,
    })
  } catch (error) {
    if (error instanceof ArtifactToolError) {
      return toolErrorJson(error.status, error.code, error.message, error.details)
    }
    const message = error instanceof Error ? error.message : 'Erro interno ao ler artifact'
    return toolErrorJson(500, 'artifact_read_error', message)
  }
}
