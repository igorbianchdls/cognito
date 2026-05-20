import { notFound } from 'next/navigation'

import {
  readDashboardArtifact,
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
  searchParams: Promise<{ version?: string; embed?: string; token?: string }>
}) {
  const { id } = await params
  const { version: rawVersion, embed: rawEmbed, token: rawToken } = await searchParams
  const version = rawVersion && Number.isInteger(Number(rawVersion)) && Number(rawVersion) > 0
    ? Number(rawVersion)
    : undefined
  const embedMode = rawEmbed === '1' || rawEmbed === 'true'

  // Temporarily allow unsigned embeds while testing MCP/ChatGPT dashboard rendering.
  // Restore token verification before exposing private dashboards broadly.
  void rawToken

  try {
    const artifact = await readDashboardArtifact({ artifactId: id, kind: 'draft', ...(version ? { version } : {}) })

    return (
      <DashboardArtifactPage
        title={artifact.title}
        source={artifact.source}
        embedMode={embedMode}
      />
    )
  } catch (error) {
    if (error instanceof ArtifactToolError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
