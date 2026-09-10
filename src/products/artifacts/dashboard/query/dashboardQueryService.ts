import { ArtifactToolError, readDashboardArtifact } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { DASHBOARD_QUERY_RETIRED_CODE, DASHBOARD_QUERY_RETIRED_MESSAGE } from '@/products/artifacts/dashboard/query/dashboardQueryPolicy'

// Compatibility boundary for saved dashboards and older clients. Never executes SQL.
export async function executeDashboardQuery(input: {
  artifactId: string; tenantId: number; actorId?: number | null
  query: string; filters?: Record<string, unknown>; limit?: number
}): Promise<never> {
  await readDashboardArtifact({ artifactId: input.artifactId, tenantId: input.tenantId, kind: 'draft' })
  throw new ArtifactToolError(410, DASHBOARD_QUERY_RETIRED_CODE, DASHBOARD_QUERY_RETIRED_MESSAGE)
}
