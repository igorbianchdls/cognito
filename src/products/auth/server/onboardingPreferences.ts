import { withTransaction } from "@/lib/postgres";
import { startAreaHref } from "@/products/auth/shared/onboarding";

/** The page a company chose to start on at onboarding (the overview when it chose none). */
export async function getTenantStartHref(tenantId: number) {
  const startArea = await withTransaction(async (client) => {
    const result = await client.query(
      "SELECT metadata->>'startArea' AS start_area FROM shared.empresas WHERE id = $1",
      [tenantId],
    );
    return (result.rows[0]?.start_area as string | null) ?? null;
  }).catch(() => null);
  return startAreaHref(startArea);
}
