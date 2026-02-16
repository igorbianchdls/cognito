import { NextRequest } from "next/server"
import { runQuery } from "@/lib/postgres"
import { getTenantId } from "@/features/airtable/backend/shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req)
    const rows = await runQuery<{ id: string; name: string }>(
      `select id::text as id, name
       from airtable."schema"
       where tenant_id = $1
       order by created_at asc, name asc`,
      [tenantId]
    )
    return Response.json({ success: true, schemas: rows }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/airtable/nav error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}
