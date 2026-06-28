import { NextRequest } from 'next/server'

import {
  deleteArtifactApi,
  getArtifactApi,
  patchArtifactApi,
  updateArtifactThumbnailApi,
} from '@/app/api/artifacts/_artifactRouteHandlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return getArtifactApi(req, context, 'report')
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return patchArtifactApi(req, context, 'report')
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return updateArtifactThumbnailApi(req, context, 'report')
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return deleteArtifactApi(req, context, 'report')
}
