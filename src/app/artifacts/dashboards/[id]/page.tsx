import { notFound } from 'next/navigation'

import { readDashboardArtifact, ArtifactToolError } from '@/products/artifacts/backend/dashboardArtifactsService'
import { DashboardArtifactPage } from '@/products/artifacts/dashboard/DashboardArtifactPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactDashboardByIdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const artifact = await readDashboardArtifact({ artifactId: id, kind: 'draft' })
    return (
      <DashboardArtifactPage
        artifactId={artifact.artifact_id}
        title={artifact.title}
        status={artifact.status}
        version={artifact.version}
        source={artifact.source}
        updatedAt={artifact.updated_at}
      />
    )
  } catch (error) {
    if (error instanceof ArtifactToolError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
