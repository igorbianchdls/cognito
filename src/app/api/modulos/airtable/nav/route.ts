import { NextRequest } from "next/server"
import { runQuery } from "@/lib/postgres"
import { getTenantId, maxDuration, dynamic, revalidate } from "../_shared"

export { maxDuration, dynamic, revalidate }

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
    console.error("🧩 API /api/modulos/airtable/nav error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}

