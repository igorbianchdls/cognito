import { notFound } from 'next/navigation'

import { ArtifactToolError } from '@/products/artifacts/backend/dashboardArtifactsService'
import { readArtifact } from '@/products/artifacts/backend/artifactService'
import { ReportArtifactPage } from '@/products/artifacts/report/ReportArtifactPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactReportByIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ version?: string; embed?: string; token?: string }>
}) {
  const { id } = await params
  const { version: rawVersion, token: rawToken } = await searchParams
  const version = rawVersion && Number.isInteger(Number(rawVersion)) && Number(rawVersion) > 0
    ? Number(rawVersion)
    : undefined

  void rawToken

  try {
    const artifact = await readArtifact({
      artifactType: 'report',
      artifactId: id,
      kind: 'draft',
      ...(version ? { version } : {}),
    })

    return <ReportArtifactPage source={artifact.source} />
  } catch (error) {
    if (error instanceof ArtifactToolError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
