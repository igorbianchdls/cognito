import { notFound } from 'next/navigation'

import {
  ArtifactToolError,
  readArtifactByType,
} from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { DocumentArtifactPage } from '@/products/artifacts/document/pages/DocumentArtifactPage'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactSlideByIdPage({
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
    const artifact = await readArtifactByType({
      artifactType: 'slide',
      artifactId: id,
      tenantId: tenant.tenantId,
      kind: 'draft',
      ...(version ? { version } : {}),
    })

    return (
      <DocumentArtifactPage
        kind="slide"
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
