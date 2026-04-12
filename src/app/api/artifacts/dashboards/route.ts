import { listDashboards } from '@/products/artifacts/backend/dashboardArtifactsService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rawLimit = Number(url.searchParams.get('limit') || '100')
    const dashboards = await listDashboards(rawLimit)
    return Response.json({
      ok: true,
      count: dashboards.length,
      dashboards,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao listar dashboards'
    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
