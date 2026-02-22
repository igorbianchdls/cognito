import { reconcileDriveStorageObjects } from '@/products/drive/backend/features/maintenance/reconcileStorage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Body = {
  workspace_id?: string
  limit?: number
  apply?: boolean
}

function isAuthorized(req: Request): boolean {
  const internalKey = String(process.env.AGENT_INTERNAL_API_KEY || '').trim()
  if (!internalKey) return false
  const headerKey = String(req.headers.get('x-internal-agent-key') || '').trim()
  const auth = String(req.headers.get('authorization') || '')
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return headerKey === internalKey || bearer === internalKey
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: 'unauthorized', code: 'TOOL_UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as Body
    const out = await reconcileDriveStorageObjects({
      workspaceId: body.workspace_id || null,
      limit: body.limit,
      apply: body.apply === true,
    })

    if (!out.ok) {
      return Response.json({ ok: false, error: out.error, code: out.code }, { status: out.status })
    }
    return Response.json({ ok: true, result: out.result }, { status: 200 })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error), code: 'DRIVE_RECONCILE_ERROR' },
      { status: 500 },
    )
  }
}

