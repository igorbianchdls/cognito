import { notFound } from 'next/navigation'

import {
  readDashboardArtifact,
  listDashboards,
  listDashboardSourceVersions,
  ArtifactToolError,
} from '@/products/artifacts/backend/dashboardArtifactsService'
import { DashboardArtifactPage } from '@/products/artifacts/dashboard/DashboardArtifactPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactDashboardByIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ version?: string }>
}) {
  const { id } = await params
  const { version: rawVersion } = await searchParams
  const version = rawVersion && Number.isInteger(Number(rawVersion)) && Number(rawVersion) > 0
    ? Number(rawVersion)
    : undefined

  try {
    const [artifact, versions, dashboards] = await Promise.all([
      readDashboardArtifact({ artifactId: id, kind: 'draft', ...(version ? { version } : {}) }),
      listDashboardSourceVersions(id, 'draft'),
      listDashboards(),
    ])

    return (
      <DashboardArtifactPage
        artifactId={artifact.artifact_id}
        dashboards={dashboards}
        title={artifact.title}
        status={artifact.status}
        version={artifact.version}
        currentDraftVersion={artifact.current_draft_version ?? artifact.version}
        metadata={artifact.metadata}
        availableVersions={versions}
        source={artifact.source}
        updatedAt={artifact.updated_at}
        allowSourceEditing
      />
    )
  } catch (error) {
    if (error instanceof ArtifactToolError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
