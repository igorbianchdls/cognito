import { listArtifactsApi } from '@/app/api/artifacts/_artifactRouteHandlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(req: Request) {
  return listArtifactsApi(req, 'slide')
}
