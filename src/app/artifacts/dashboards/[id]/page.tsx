import { notFound } from 'next/navigation'

import {
  readDashboardArtifact,
  ArtifactToolError,
} from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { DashboardArtifactPage } from '@/products/artifacts/dashboard/pages/DashboardArtifactPage'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

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
  const embedMode = false
  void rawEmbed
  void rawToken

  try {
    const tenant = await resolveAuthTenant({ access: 'read' })
    if (!tenant) notFound()
    const artifact = await readDashboardArtifact({
      artifactId: id,
      tenantId: tenant.tenantId,
      kind: 'draft',
      ...(version ? { version } : {}),
    })

    return (
      <DashboardArtifactPage
        artifactId={id}
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
