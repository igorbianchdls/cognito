import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { ArtifactToolError, patchDashboardArtifact } from '@/products/artifacts/backend/dashboardArtifactsService'

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
      meta: { tool: 'artifact_patch', action: 'patch', status },
      result: { success: false, error, code, ...(details ? { details } : {}) },
    },
    { status },
  )
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para artifact_patch')
    }
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const rawOperation = payload.operation && typeof payload.operation === 'object' && !Array.isArray(payload.operation)
      ? (payload.operation as Record<string, unknown>)
      : {}

    const result = await patchDashboardArtifact({
      artifactId: String(payload.artifact_id ?? ''),
      expectedVersion: Number(payload.expected_version),
      operation: {
        type: String(rawOperation.type ?? '') as 'replace_text' | 'replace_full_source',
        oldString: rawOperation.old_string == null ? null : String(rawOperation.old_string),
        newString: rawOperation.new_string == null ? null : String(rawOperation.new_string),
        replaceAll: Boolean(rawOperation.replace_all),
        source: rawOperation.source == null ? null : String(rawOperation.source),
        changeSummary: rawOperation.change_summary == null ? null : String(rawOperation.change_summary),
      },
      actorId: null,
    })

    return Response.json({
      ok: true,
      success: true,
      data: result,
      meta: { tool: 'artifact_patch', action: 'patch', status: 200 },
      result,
    })
  } catch (error) {
    if (error instanceof ArtifactToolError) {
      return toolErrorJson(error.status, error.code, error.message, error.details)
    }
    const message = error instanceof Error ? error.message : 'Erro interno ao aplicar patch no artifact'
    return toolErrorJson(500, 'artifact_patch_error', message)
  }
}
