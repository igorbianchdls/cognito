import { NextRequest } from "next/server"
import { runQuery } from "@/lib/postgres"
import { getTenantId } from "../../_shared"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest, ctx: { params: { schemaId: string } }) {
  try {
    const tenantId = getTenantId(req)
    const { schemaId } = ctx.params
    const rows = await runQuery<{ id: string; name: string; description: string | null; created_at: string }>(
      `select id::text as id, name, description, created_at::text
       from airtable."schema"
       where tenant_id = $1 and id = $2::uuid
       limit 1`,
      [tenantId, schemaId]
    )
    if (!rows[0]) return Response.json({ success: false, message: "Schema não encontrado" }, { status: 404 })
    return Response.json({ success: true, row: rows[0] }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("🧩 API /api/modulos/airtable/schemas/[schemaId] GET error:", error)
    return Response.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}
